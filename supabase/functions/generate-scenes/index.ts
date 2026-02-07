import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, cache-control, accept",
};

// Preços conforme documentação
const CREDIT_PRICING = {
  base: 2,    // por lote de 10 cenas
  gemini: 3,
  claude: 4,
};

interface AdminApiKeys {
  openai?: string;
  gemini?: string;
  claude?: string;
  laozhang?: string;
  openai_validated?: boolean;
  gemini_validated?: boolean;
  claude_validated?: boolean;
  laozhang_validated?: boolean;
}

interface CharacterDescription {
  name: string;
  description: string;
  seed: number;
  fromReference?: boolean; // Indica se veio de imagem de referência
}

// Interface para personagens de referência recebidos do frontend
interface ReferenceCharacterInput {
  name: string;
  imageBase64: string;
}

// NOVO: Contexto global do roteiro para consistência visual
interface ScriptContext {
  period: string; // Época/período histórico
  setting: string; // Ambientação/cenário principal
  atmosphere: string; // Atmosfera visual
  prohibitedElements: string[]; // Elementos a evitar (anacrônicos)
  visualReferences: string; // Referências visuais
}

interface SceneResult {
  number: number;
  text: string;
  imagePrompt: string;
  veo3Prompt?: string; // Prompt otimizado para Google Veo3 em inglês com SFX
  wordCount: number;
  characterName?: string; // Nome do personagem principal nesta cena
  emotion?: string; // Emoção dominante: tensão, surpresa, medo, admiração, choque, curiosidade
  retentionTrigger?: string; // Gatilho de retenção: curiosidade, quebra_padrão, antecipação, revelação, mistério
  suggestMovement?: boolean; // Indica se a cena se beneficiaria de vídeo (ação dinâmica)
  retentionMultiplier?: number; // Multiplicador de duração para retenção (0.7 = 30% mais rápido, 1.3 = 30% mais lento)
  retentionReason?: string; // Motivo do ajuste de tempo
}

// Função para dividir texto em partes (para processamento em lotes)
function splitTextIntoChunks(text: string, wordsPerScene: number, scenesPerBatch: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const wordsPerBatch = wordsPerScene * scenesPerBatch;
  const chunks: string[] = [];
  
  for (let i = 0; i < words.length; i += wordsPerBatch) {
    chunks.push(words.slice(i, i + wordsPerBatch).join(' '));
  }
  
  return chunks;
}

// NOVA FUNÇÃO: Dividir texto em cenas ANTES de chamar a IA
// Isso garante que cada cena tenha exatamente o texto que será narrado
interface PreSegmentedScene {
  number: number;
  text: string;
  wordCount: number;
}

function preSegmentScript(script: string, wordsPerScene: number, startNumber: number = 1): PreSegmentedScene[] {
  const words = script.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  
  const scenes: PreSegmentedScene[] = [];
  let sceneNumber = startNumber;
  
  // Dividir em chunks de aproximadamente wordsPerScene palavras
  // Tentar quebrar em pontos naturais (., !, ?, :)
  let currentWords: string[] = [];
  let i = 0;
  
  while (i < words.length) {
    currentWords.push(words[i]);
    
    // Verificar se atingimos o limite de palavras
    if (currentWords.length >= wordsPerScene) {
      // Tentar encontrar um ponto de quebra natural nas próximas 5 palavras
      let breakPoint = currentWords.length;
      for (let j = currentWords.length - 1; j >= Math.max(0, currentWords.length - 5); j--) {
        const word = currentWords[j];
        if (word.endsWith('.') || word.endsWith('!') || word.endsWith('?') || word.endsWith(':')) {
          breakPoint = j + 1;
          break;
        }
      }
      
      // Criar cena com as palavras até o breakPoint
      const sceneWords = currentWords.slice(0, breakPoint);
      const text = sceneWords.join(' ');
      
      scenes.push({
        number: sceneNumber++,
        text,
        wordCount: sceneWords.length
      });
      
      // Manter as palavras restantes para a próxima cena
      currentWords = currentWords.slice(breakPoint);
    }
    
    i++;
  }
  
  // Adicionar última cena se houver palavras restantes
  if (currentWords.length > 0) {
    scenes.push({
      number: sceneNumber,
      text: currentWords.join(' '),
      wordCount: currentWords.length
    });
  }
  
  return scenes;
}

// NOVA FUNÇÃO: Split dinâmico de cenas longas para vídeos mais dinâmicos
// Divide cenas que excedem maxSecondsPerScene em sub-cenas menores
// sem alterar a duração total (apenas mais trocas de imagem)
function splitLongScenes(
  scenes: PreSegmentedScene[], 
  wpm: number, 
  maxSecondsPerScene: number
): PreSegmentedScene[] {
  if (maxSecondsPerScene <= 0) return scenes;
  
  const maxWordsPerSubScene = Math.max(5, Math.round((maxSecondsPerScene * wpm) / 60));
  const result: PreSegmentedScene[] = [];
  let newNumber = scenes.length > 0 ? scenes[0].number : 1;
  
  for (const scene of scenes) {
    const durationSeconds = (scene.wordCount / wpm) * 60;
    
    // Se a cena não excede o limite, manter como está
    if (durationSeconds <= maxSecondsPerScene + 1) { // +1s tolerância
      result.push({ ...scene, number: newNumber++ });
      continue;
    }
    
    // Dividir em sub-cenas de ~maxWordsPerSubScene palavras
    const words = scene.text.split(/\s+/).filter(Boolean);
    const numSubScenes = Math.max(2, Math.ceil(words.length / maxWordsPerSubScene));
    const targetWordsPerSub = Math.ceil(words.length / numSubScenes);
    
    let wordIdx = 0;
    let subsCreated = 0;
    
    while (wordIdx < words.length) {
      const remaining = words.length - wordIdx;
      const isLast = subsCreated === numSubScenes - 1;
      const targetEnd = isLast ? words.length : Math.min(wordIdx + targetWordsPerSub, words.length);
      
      // Tentar quebrar em ponto natural (., !, ?, :, ;, ,) 
      let breakAt = targetEnd;
      if (!isLast && targetEnd < words.length) {
        // Procurar ponto de quebra natural 3 palavras antes e 3 depois do target
        for (let j = Math.min(targetEnd + 3, words.length - 1); j >= Math.max(wordIdx + 3, targetEnd - 3); j--) {
          const w = words[j];
          if (w.endsWith('.') || w.endsWith('!') || w.endsWith('?') || w.endsWith(':') || w.endsWith(';') || w.endsWith(',')) {
            breakAt = j + 1;
            break;
          }
        }
      }
      
      const subWords = words.slice(wordIdx, breakAt);
      if (subWords.length > 0) {
        result.push({
          number: newNumber++,
          text: subWords.join(' '),
          wordCount: subWords.length
        });
        subsCreated++;
      }
      
      wordIdx = breakAt;
    }
  }
  
  console.log(`[Split Long Scenes] ${scenes.length} scenes → ${result.length} scenes (max ${maxSecondsPerScene}s/scene, ${maxWordsPerSubScene} words/sub)`);
  return result;
}

// FUNÇÃO UNIFICADA: Detectar contexto, personagens E criar mapa visual do roteiro COMPLETO
interface ContextAndCharacters {
  context: ScriptContext;
  characters: CharacterDescription[];
  visualMap: ScriptVisualMap; // NOVO: Mapa visual de todo o roteiro
}

// NOVO: Mapa visual do roteiro para garantir consistência
interface ScriptVisualMap {
  mainTheme: string; // Tema principal (ex: "mistérios do Egito antigo")
  keyLocations: string[]; // Locações importantes mencionadas
  keyObjects: string[]; // Objetos importantes (artefatos, manuscritos, etc)
  keyEvents: string[]; // Eventos principais da narrativa
  visualTone: string; // Tom visual geral (dramático, misterioso, etc)
  prohibitedVisuals: string[]; // O que NÃO deve aparecer
}

function buildScriptAnalysisSample(script: string, maxChars = 60000): string {
  const s = (script || "").trim();
  if (s.length <= maxChars) return s;

  // Para roteiros muito longos (1h+ = ~54000 chars), usar sample de 5 partes
  // Isso garante que TODO o contexto do roteiro seja capturado
  const numParts = s.length > 100000 ? 5 : 3;
  const chunkSize = Math.floor(maxChars / numParts);
  
  const parts: string[] = [];
  
  if (numParts === 5) {
    // 5 partes: início, 25%, meio, 75%, fim
    parts.push(s.slice(0, chunkSize));
    parts.push("\n\n--- SECTION 2/5 ---\n\n");
    const q1Start = Math.floor(s.length * 0.25) - Math.floor(chunkSize / 2);
    parts.push(s.slice(Math.max(0, q1Start), q1Start + chunkSize));
    parts.push("\n\n--- SECTION 3/5 (MIDDLE) ---\n\n");
    const midStart = Math.floor(s.length * 0.5) - Math.floor(chunkSize / 2);
    parts.push(s.slice(Math.max(0, midStart), midStart + chunkSize));
    parts.push("\n\n--- SECTION 4/5 ---\n\n");
    const q3Start = Math.floor(s.length * 0.75) - Math.floor(chunkSize / 2);
    parts.push(s.slice(Math.max(0, q3Start), q3Start + chunkSize));
    parts.push("\n\n--- SECTION 5/5 (END) ---\n\n");
    parts.push(s.slice(Math.max(0, s.length - chunkSize)));
  } else {
    // 3 partes: início, meio, fim
    parts.push(s.slice(0, chunkSize));
    parts.push("\n\n--- MIDDLE SECTION ---\n\n");
    const midStart = Math.floor(s.length / 2) - Math.floor(chunkSize / 2);
    parts.push(s.slice(Math.max(0, midStart), midStart + chunkSize));
    parts.push("\n\n--- END SECTION ---\n\n");
    parts.push(s.slice(Math.max(0, s.length - chunkSize)));
  }

  return parts.join("").slice(0, maxChars);
}

async function detectContextAndCharacters(
  script: string,
  apiUrl: string,
  apiKey: string,
  apiModel: string
): Promise<ContextAndCharacters> {
  // ANÁLISE PROFUNDA de TODO o roteiro para criar mapa visual completo
  const systemPrompt = `You are a visual director analyzing a COMPLETE script to create a visual guide.

CRITICAL: Read the ENTIRE script carefully and extract ALL visual elements mentioned.
The script may be about historical events, documentaries, stories, etc. IDENTIFY THE MAIN SUBJECT.

Return ONLY valid JSON:
{
  "context": {
    "period": "exact historical period or modern setting (e.g., 'Ancient Egypt 2500 BCE', 'Medieval Europe 1200 CE', 'Modern day')",
    "setting": "ALL main locations mentioned in the script",
    "atmosphere": "visual mood (mysterious, dramatic, epic, educational, etc)",
    "prohibitedElements": ["elements that would be anachronistic or out of context"],
    "visualReferences": "documentary style reference"
  },
  "characters": [
    {"name": "Name", "description": "detailed physical description in English"}
  ],
  "visualMap": {
    "mainTheme": "the CENTRAL topic of this ENTIRE script - be VERY specific (e.g., 'construction secrets of the Great Pyramid of Giza', 'mysteries of ancient Egyptian pharaohs')",
    "keyLocations": ["EVERY specific location mentioned: pyramids, temples, tombs, deserts, cities, rivers, etc - extract ALL of them"],
    "keyObjects": ["EVERY important object: manuscripts, artifacts, tools, monuments, statues, treasures, etc - extract ALL"],
    "keyEvents": ["ALL main events/actions: excavations, discoveries, constructions, battles, ceremonies, etc"],
    "visualTone": "overall visual feeling that matches the script: mysterious, educational, dramatic, suspenseful, reverent",
    "prohibitedVisuals": ["things that should NEVER appear based on the script context: modern tech if ancient setting, random animals not mentioned, sports cars in historical documentaries, people with masks if not mentioned, etc"]
  }
}

CRITICAL EXTRACTION RULES:
- Read the ENTIRE script including beginning, middle, and end sections
- Extract EVERY specific noun, location, object, and event from ALL parts
- If script is about Egypt → pyramids, pharaohs, hieroglyphics, Nile, tombs, etc must be in keyLocations/keyObjects
- If script mentions specific artifacts → they MUST be in keyObjects
- The visualMap will VALIDATE every generated image - missing elements = bad images
- Be EXHAUSTIVE - list 10-20+ items in each array if the script is detailed
- Return empty arrays [] ONLY if truly nothing found`;

  try {
    // CRÍTICO: Para roteiros longos (1h+ = ~54k chars), usar sample maior com mais seções
    // Roteiros de 3h podem ter ~160k chars - precisamos capturar TODO o contexto
    const sampleSize = script.length > 100000 ? 60000 : (script.length > 50000 ? 50000 : 40000);
    const scriptSample = buildScriptAnalysisSample(script, sampleSize);
    console.log(`[Detect Context] Analyzing script: ${script.length} chars → sample: ${scriptSample.length} chars (${Math.round(scriptSample.length / script.length * 100)}% coverage)`);
    
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: apiModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Analyze this complete script (includes beginning, middle, and end excerpts):\n\n${scriptSample}` }
        ],
        max_tokens: 3000,
        temperature: 0.1,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      console.error('[Detect Context+Characters+VisualMap] API error:', response.status);
      return { context: getDefaultContext(), characters: [], visualMap: getDefaultVisualMap() };
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content?.trim() || "";

    if (content.startsWith("```json")) content = content.slice(7);
    if (content.startsWith("```")) content = content.slice(3);
    if (content.endsWith("```")) content = content.slice(0, -3);
    content = content.trim();

    // ROBUSTECIDO: Extrair JSON se houver texto antes
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) content = jsonMatch[0];

    const parsed = JSON.parse(content);
    
    const context: ScriptContext = {
      period: parsed.context?.period || "unspecified period",
      setting: parsed.context?.setting || "cinematic environment",
      atmosphere: parsed.context?.atmosphere || "dramatic",
      prohibitedElements: parsed.context?.prohibitedElements || [],
      visualReferences: parsed.context?.visualReferences || "documentary"
    };

    const characters = (parsed.characters || []).map((char: any) => ({
      name: char.name,
      description: char.description,
      seed: Math.abs(hashCode(char.name)) % 2147483647
    }));

    const visualMap: ScriptVisualMap = {
      mainTheme: parsed.visualMap?.mainTheme || "documentary narrative",
      keyLocations: parsed.visualMap?.keyLocations || [],
      keyObjects: parsed.visualMap?.keyObjects || [],
      keyEvents: parsed.visualMap?.keyEvents || [],
      visualTone: parsed.visualMap?.visualTone || "dramatic documentary",
      prohibitedVisuals: parsed.visualMap?.prohibitedVisuals || []
    };

    console.log('[Detect Context+Characters+VisualMap] OK:', {
      period: context.period,
      mainTheme: visualMap.mainTheme,
      keyLocations: visualMap.keyLocations.length,
      keyObjects: visualMap.keyObjects.length,
      characters: characters.length
    });
    
    return { context, characters, visualMap };
  } catch (e) {
    console.error('[Detect Context+Characters+VisualMap] Error:', e);
    return { context: getDefaultContext(), characters: [], visualMap: getDefaultVisualMap() };
  }
}

function getDefaultContext(): ScriptContext {
  return {
    period: "unspecified period",
    setting: "appropriate environment matching the narrative",
    atmosphere: "dramatic and cinematic",
    prohibitedElements: [],
    visualReferences: "documentary style"
  };
}

function getDefaultVisualMap(): ScriptVisualMap {
  return {
    mainTheme: "documentary narrative",
    keyLocations: [],
    keyObjects: [],
    keyEvents: [],
    visualTone: "dramatic documentary",
    prohibitedVisuals: []
  };
}

// Função para analisar imagens de referência e extrair descrições de personagens
// ATUALIZADO: Usa Laozhang API (gpt-4o-mini com visão) para consumir créditos
async function analyzeReferenceImages(
  referenceCharacters: ReferenceCharacterInput[],
  laozhangApiKey?: string | null
): Promise<CharacterDescription[]> {
  if (!referenceCharacters || referenceCharacters.length === 0) {
    return [];
  }

  console.log(`[Analyze Reference Images] Processing ${referenceCharacters.length} reference images via Laozhang...`);
  
  const characters: CharacterDescription[] = [];
  
  for (const ref of referenceCharacters) {
    try {
      if (!laozhangApiKey) {
        console.warn("[Analyze Reference] LAOZHANG_API_KEY missing; skipping reference analysis");
        continue;
      }

      // Usar Laozhang API com gpt-4o-mini (visão) - consome créditos
      const resp = await fetch("https://api.laozhang.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${laozhangApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini", // Modelo com visão mais econômico
          messages: [
            {
              role: "system",
              content:
                "You are a visual description expert. Analyze the image and provide a DETAILED physical description of the person for use in AI image generation prompts. Focus on: age range, gender presentation, skin tone, hair, facial features, body type if visible, distinctive characteristics, clothing style if relevant. Return ONLY a concise English description (50-80 words). DO NOT include the character name.",
            },
            {
              role: "user",
              content: [
                { type: "text", text: `Describe this person for image generation. Character label: ${ref.name}` },
                { type: "image_url", image_url: { url: ref.imageBase64 } },
              ],
            },
          ],
          max_tokens: 220,
          temperature: 0.2,
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text().catch(() => "");
        console.warn(`[Analyze Reference] Laozhang vision request failed for ${ref.name}:`, resp.status, errText?.slice(0, 300));
        continue;
      }

      const data = await resp.json();
      const description = data.choices?.[0]?.message?.content?.trim() || "";

      if (description) {
        characters.push({
          name: ref.name,
          description: description,
          seed: Math.abs(hashCode(ref.name)) % 2147483647,
          fromReference: true,
        });
        console.log(`[Analyze Reference] Character "${ref.name}": ${description.substring(0, 100)}...`);
      }
    } catch (e) {
      console.error(`[Analyze Reference] Error analyzing ${ref.name}:`, e);
    }
  }

  console.log(`[Analyze Reference Images] Successfully analyzed ${characters.length}/${referenceCharacters.length} characters via Laozhang`);
  return characters;
}

// Função simples de hash para gerar seed consistente
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash;
}

// Função para gerar prompt Veo3 otimizado (inglês + SFX)
function generateVeo3Prompt(basePrompt: string, context: ScriptContext, wordCount: number, wpm: number): string {
  const durationSeconds = Math.round((wordCount / wpm) * 60);
  
  const cleanedPrompt = basePrompt
    .replace(/1280x720 resolution,?\s*/gi, '')
    .replace(/16:9 (horizontal landscape|aspect ratio),?\s*/gi, '')
    .replace(/edge-to-edge full bleed composition,?\s*/gi, '')
    .replace(/full frame composition,?\s*/gi, '')
    .replace(/fill entire frame without any black bars,?\s*/gi, '')
    .replace(/no text.*$/gi, '')
    .replace(/,\s*,/g, ',')
    .trim();

  return `Cinematic video scene, ${context.period}, ${cleanedPrompt}. Duration: ${durationSeconds}s. Camera: slow cinematic movement. Audio SFX: ambient environmental sounds matching the scene. Style: documentary, photorealistic, dramatic lighting.`;
}

// NOVA FUNÇÃO: Gerar prompts de imagem para cenas PRÉ-SEGMENTADAS
// Isso garante sincronização perfeita: texto e duração são determinísticos
async function generatePromptsForPreSegmentedScenes(
  scenes: PreSegmentedScene[],
  batchNumber: number,
  style: string,
  stylePrefix: string,
  characters: CharacterDescription[],
  scriptContext: ScriptContext,
  visualMap: ScriptVisualMap, // NOVO: Mapa visual do roteiro completo
  wpm: number,
  apiUrl: string,
  apiKey: string,
  apiModel: string,
  includeVeo3: boolean = false,
  userIdentifier: string = "anonymous"
): Promise<SceneResult[]> {
  if (scenes.length === 0) return [];

  const characterContext = characters.length > 0
    ? `\n\nRECURRING CHARACTERS (use EXACT descriptions when they appear):
${characters.map(c => `- ${c.name}: ${c.description}`).join('\n')}`
    : '';

  // Criar lista de cenas para o prompt
  const scenesForPrompt = scenes.map(s => ({
    number: s.number,
    text: s.text,
    wordCount: s.wordCount,
    durationSeconds: Math.round((s.wordCount / wpm) * 60 * 10) / 10
  }));

  // Lista de elementos proibidos combinada
  const allProhibited = [
    ...scriptContext.prohibitedElements,
    ...visualMap.prohibitedVisuals
  ].slice(0, 10);
  
  const prohibitedList = allProhibited.length > 0
    ? `\n🚫 PROHIBITED (NEVER show these): ${allProhibited.join(', ')}`
    : '';

  // Detectar se é conteúdo histórico para aplicar regras de vestuário apropriadas
  const isHistoricalContent = /ancient|egypt|rome|medieval|biblical|historic|1800s|1900s|19th|18th|17th|antiquity|pharaoh|pyramid|temple|civilization/i.test(
    visualMap.mainTheme + ' ' + scriptContext.period + ' ' + scriptContext.setting
  );
  
  // Regras de vestuário baseadas no período histórico (SEM bloquear o roteiro)
  // IMPORTANTE: o texto da cena manda. Se o narrador falar de arqueólogos/pesquisadores/arquivos modernos,
  // é PERMITIDO mostrar pessoas e ambiente contemporâneo.
  const clothingRules = isHistoricalContent
    ? `\n👔 HISTORICAL CONTEXT GUIDELINE (TEXT OVERRIDES):

✅ If the scene text describes an ANCIENT moment (rituals, cities, temples, ancient workers):
- Avoid modern clothing, modern officials, modern uniforms, and modern safety equipment.
- Prefer period-accurate clothing OR show the ancient location/object itself.

✅ If the scene text describes MODERN investigation (archaeologists, researchers, excavation reports, maps, archives, laboratories):
- It is ALLOWED to show modern people and modern environments, as long as they match the narration.
- Keep it documentary and grounded (no random luxury, no unrelated modern lifestyle).

🚫 Always avoid random anachronisms that are NOT in the text (sports cars, luxury watches, generic business office vibes) unless explicitly mentioned.`
    : '';

  // PROMPT ULTRA-FOCADO EM FIDELIDADE AO TEXTO DA NARRAÇÃO
  // A imagem DEVE ilustrar EXATAMENTE o que o narrador está dizendo naquele momento
  const systemPrompt = `You are a visual art director creating images that PERFECTLY ILLUSTRATE what the narrator is saying.

🎯 CRITICAL MISSION: Each image MUST VISUALLY REPRESENT the EXACT content of the scene's text.
The viewer should look at the image and IMMEDIATELY understand what the narrator is saying.

📖 MANDATORY PROCESS FOR EACH SCENE:
1. READ the "text" field - this is what the narrator is SAYING at this exact moment
2. IDENTIFY the key visual elements MENTIONED in that specific text:
   - What OBJECTS are mentioned? (artifacts, documents, structures, tools)
   - What LOCATIONS are described? (rooms, buildings, landscapes)
   - What ACTIONS are happening? (discovering, building, moving, revealing)
   - What CONCEPTS need visual representation? (mystery, power, time passing)
3. CREATE a prompt that shows EXACTLY those elements - not generic theme images

⛔ DO NOT:
- Create generic "theme" images that don't match the specific narration
- Show pyramids when the narrator is talking about papyrus scrolls
- Show temples when the narrator is discussing mathematical calculations
- Show landscapes when the narrator is describing a specific artifact
- Use the same visual for different narration content

✅ CORRECT APPROACH - EXAMPLES:
- If narrator says "ancient scrolls reveal secrets" → show SCROLLS with mysterious symbols, close-up
- If narrator says "workers moved massive stones" → show the ACTION of moving stones
- If narrator says "inside the chamber, gold treasures" → show the INTERIOR with treasures
 - If narrator focuses on the EVIDENCE → show the evidence/artefact; if narrator focuses on the RESEARCHER/ACTION → show the researcher doing that action
- If narrator mentions a specific NUMBER or DATE → represent that concept visually

🎬 GLOBAL CONTEXT (for consistency, but TEXT CONTENT takes PRIORITY):
- Theme: ${visualMap.mainTheme}
- Era: ${scriptContext.period}
- Setting: ${scriptContext.setting}
- Atmosphere: ${scriptContext.atmosphere}
- Style: ${stylePrefix || style}
- Key Locations: ${visualMap.keyLocations.slice(0, 10).join(', ') || 'documentary setting'}
- Key Objects: ${visualMap.keyObjects.slice(0, 10).join(', ') || 'relevant objects'}${prohibitedList}${characterContext}${clothingRules}

📸 VISUAL STYLE:
- ALWAYS apply: "${stylePrefix || style}"
- Match lighting and color grading to this style

🎨 VISUAL DIVERSITY (MANDATORY):
- CAMERA ANGLES (rotate): wide shot, close-up, low angle, high angle, macro, panoramic
- LIGHTING (vary): golden hour, blue hour, dramatic shadows, soft dawn, backlit, candlelight
- Each consecutive scene MUST have DIFFERENT angle and lighting
- NEVER 3+ scenes with same subject (e.g., 3 pyramid exteriors)

🎬 MOVEMENT RECOMMENDATIONS (suggestMovement):
Set TRUE for: action scenes, natural phenomena, camera movements, emotional peaks, first 5 scenes
TARGET: 40-50% of scenes should have movement=true

⏱️ YOU ARE AN AUDIOVISUAL RETENTION EXPERT - TIMING IS YOUR EXPERTISE:
You define HOW LONG each image stays on screen. This is CRITICAL for viewer retention.
The retentionMultiplier controls the ACTUAL duration of each scene in the final video.

📊 RETENTION SCIENCE - RULES FROM TOP YOUTUBE CREATORS:
- Human attention span drops after 3-5 seconds on same visual → FAST cuts = HIGH retention
- Revelations need PAUSE for brain to process → SLOWER = more impact
- Hooks (first 30s) need RAPID cuts to prevent click-away → 0.6x-0.75x
- Pattern breaks (unexpected timing changes) RESET attention → alternate fast/slow

🎯 MANDATORY TIMING RULES (retentionMultiplier):
- 0.55-0.70: HOOK scenes (first 5 scenes) - rapid fire visual assault, grab attention NOW
- 0.60-0.75: SHOCK/SURPRISE - hit hard, move on fast before brain processes
- 0.70-0.80: ACTION/TENSION - keep energy high, don't let viewer breathe  
- 0.75-0.85: TRANSITION between ideas - smooth but quick
- 0.85-1.00: STANDARD narration - comfortable pace
- 1.00-1.15: IMPORTANT context - give time to absorb
- 1.15-1.30: REVELATION/CLIMAX - let the impact LAND, dramatic pause
- 1.25-1.40: EPIC CONCLUSION (last 3 scenes) - cinematic slowdown for emotional payoff
- 0.65-0.80: PATTERN BREAK - randomly speed up after slow scenes to RESET attention

⚠️ CRITICAL: DO NOT make all scenes the same multiplier. 
The VARIATION between fast and slow is what creates cinematic rhythm.
AIM for: 30% fast (0.6-0.8), 40% medium (0.8-1.0), 20% slow (1.0-1.3), 10% pattern breaks

FORMAT (MANDATORY - 50-70 words):
"16:9 horizontal landscape, edge-to-edge full bleed composition, [CAMERA ANGLE], ${stylePrefix || style}, [SPECIFIC LIGHTING], [DESCRIPTION THAT DIRECTLY ILLUSTRATES THE NARRATOR'S TEXT - what they are SAYING must be VISIBLE], ${scriptContext.atmosphere} atmosphere, fill entire frame, no text, no watermarks"

🔍 SELF-CHECK BEFORE SUBMITTING EACH PROMPT:
Ask yourself: "If someone sees this image while hearing the narration text, will they IMMEDIATELY see the connection?"
If NO → rewrite the prompt to match the narration more closely.

RETURN ONLY JSON:
{"scenes":[{"number":N,"imagePrompt":"[50-70 words - MUST illustrate the specific narration text, not generic theme]","emotion":"[tensão/surpresa/medo/admiração/choque/curiosidade/neutral]","suggestMovement":true/false,"retentionMultiplier":0.7-1.4,"retentionReason":"[reason]"}]}`;

  let lastError = null;
  const maxRetries = 2;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "X-User-Identifier": userIdentifier, // Identificação do usuário para tracking
          "HTTP-Referer": "https://viralgen.app", // Identificação da plataforma
          "X-Title": `ViralGen-${userIdentifier.split('@')[0] || 'user'}` // Nome curto para logs
        },
        body: JSON.stringify({
          model: apiModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: JSON.stringify(scenesForPrompt) }
          ],
          max_tokens: 3000,
          temperature: 0.2,
          response_format: { type: "json_object" }
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Batch ${batchNumber}] API error (attempt ${attempt + 1}):`, errorText);
        lastError = new Error(`Erro no lote ${batchNumber}: ${response.status}`);
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }
        throw lastError;
      }

      const data = await response.json();
      let content = data.choices?.[0]?.message?.content?.trim() || "";
      
      // Parse JSON - ROBUSTECIDO para lidar com respostas com texto adicional
      if (content.startsWith("```json")) content = content.slice(7);
      if (content.startsWith("```")) content = content.slice(3);
      if (content.endsWith("```")) content = content.slice(0, -3);
      content = content.trim();

      // NOVO: Extrair JSON se houver texto antes (ex: "Aqui estão..." ou "Here are...")
      const jsonStartIndex = content.indexOf('{"scenes"');
      if (jsonStartIndex > 0) {
        console.log(`[Batch ${batchNumber}] Extracting JSON from position ${jsonStartIndex}`);
        content = content.substring(jsonStartIndex);
      }

      // Reparar JSON truncado
      if (!content.endsWith("]}") && !content.endsWith("}]")) {
        const lastCompleteScene = content.lastIndexOf('},');
        if (lastCompleteScene > 0) {
          content = content.substring(0, lastCompleteScene + 1) + "]}";
          console.log(`[Batch ${batchNumber}] Repaired truncated JSON`);
        } else {
          const lastBrace = content.lastIndexOf('}');
          if (lastBrace > 0) {
            content = content.substring(0, lastBrace + 1) + "]}";
          }
        }
      }

      try {
        const parsed = JSON.parse(content);
        const scenesRaw = Array.isArray(parsed?.scenes) ? parsed.scenes : [];

        // Mesclar com dados originais para garantir sincronização
        const results: SceneResult[] = [];
        
        for (const originalScene of scenes) {
          // Encontrar a cena correspondente na resposta da IA
          const aiScene = scenesRaw.find((s: any) => s.number === originalScene.number);
          
          let finalPrompt = aiScene?.imagePrompt || 
            `16:9 horizontal landscape, edge-to-edge full bleed composition, ${stylePrefix || style + ' style'}, dramatic lighting, cinematic shot of ${visualMap.mainTheme}, ${visualMap.keyLocations[0] || scriptContext.setting}, fill entire frame without any black bars`;
          
          // VALIDAÇÃO AUTOMÁTICA ULTRA-RIGOROSA: Detectar QUALQUER roupa/pessoa moderna
          // Lista COMPLETA para detectar roupas modernas em contextos históricos
          const modernClothingPatterns = [
            // Roupas formais/business - PRIORIDADE MÁXIMA
            /\b(suit|suits|blazer|blazers|tie|ties|formal attire|formal wear|formal clothing)\b/i,
            /\b(business attire|business suit|dress shirt|button.?up shirt|collar shirt)\b/i,
            /\b(office wear|professional attire|corporate|executive)\b/i,
            // Pessoas em roupas modernas
            /\b(officials? in|man in|woman in|people in|person in)\s+(formal|modern|suit|blazer|attire)\b/i,
            /\b(examining|observing|studying|holding|looking at).*\b(official|researcher|scientist)\b/i,
            /\b(official|researcher|scientist|archaeologist|explorer|investigator|expert)\b/i,
            /\b(bureaucrat|government worker|museum worker|curator|archivist)\b/i,
            // Uniformes modernos
            /\b(uniform|police|security|guard|officer|military|soldier)\b/i,
            /\b(construction|helmet|hard hat|safety vest|safety gear|protective)\b/i,
            /\b(lab coat|medical|hospital|nurse|doctor)\b/i,
            // Roupas casuais modernas
            /\b(jeans|denim|t-?shirt|hoodie|jacket|sweater|cardigan)\b/i,
            /\b(polo|blouse|skirt|pants|trousers|slacks)\b/i,
            // Acessórios modernos
            /\b(glasses|sunglasses|watch|wristwatch|goggles|mask)\b/i,
            /\b(backpack|briefcase|handbag|purse|bag)\b/i,
            // Tecnologia
            /\b(laptop|computer|smartphone|phone|tablet|camera|flashlight|equipment)\b/i,
            /\b(neon|led|digital|hologram|screen|monitor)\b/i,
            // Veículos
            /\b(car|vehicle|truck|motorcycle|bus|train)\b/i,
            // Descrições genéricas de pessoas modernas
            /\b(modern|contemporary|current|today|present.?day)\s+(person|people|man|woman|observer)\b/i,
            /\b(standing|sitting|walking)\s+(in|near|by|beside)\b.*\b(ancient|egypt|tomb|pyramid|temple)\b/i
          ];
          
          const hasModernClothing = modernClothingPatterns.some(p => p.test(finalPrompt));
          
          // Verificar se menciona elementos do tema do roteiro
          const mentionsThemeElements = visualMap.keyLocations.some(loc => 
            loc.length > 3 && finalPrompt.toLowerCase().includes(loc.toLowerCase())
          ) || visualMap.keyObjects.some(obj => 
            obj.length > 3 && finalPrompt.toLowerCase().includes(obj.toLowerCase())
          );
          
          // Verificar se o estilo está sendo aplicado
          const styleApplied = finalPrompt.toLowerCase().includes((stylePrefix || style).toLowerCase().split(',')[0]);
          
          // Se tem elementos modernos em contexto histórico OU não menciona elementos do tema, corrigir
          const isHistorical = /ancient|egypt|rome|medieval|biblical|historic|pharaoh|pyramid|temple/i.test(
            visualMap.mainTheme + ' ' + scriptContext.period
          );
          
          // DIVERSIFICAÇÃO VISUAL: Usar índice da cena para distribuir elementos únicos
          const sceneIdx = originalScene.number - 1;
          const numLocations = Math.max(1, visualMap.keyLocations.length);
          const numObjects = Math.max(1, visualMap.keyObjects.length);
          
          // ÂNGULOS E COMPOSIÇÕES para diversificação visual entre cenas
          const cameraAngles = [
            'wide establishing shot', 'close-up detail shot', 'low angle dramatic view',
            'high angle overview', 'medium shot', 'extreme close-up macro',
            'panoramic vista', 'side profile view', 'diagonal dynamic angle',
            'bird\'s eye view', 'worm\'s eye perspective', 'dutch angle tilted frame'
          ];
          const timeOfDay = [
            'golden hour sunset lighting', 'blue hour twilight', 'harsh midday sun',
            'soft dawn light', 'dramatic dusk silhouette', 'moonlit night scene',
            'overcast diffused light', 'backlit dramatic rays', 'warm candlelight glow'
          ];
          const visualFocus = [
            'texture and detail emphasis', 'atmospheric depth and haze', 'sharp foreground blur background',
            'symmetrical composition', 'rule of thirds framing', 'leading lines to subject',
            'negative space minimalist', 'layered depth planes', 'reflection and mirroring'
          ];
          
          // Selecionar elementos DIFERENTES para cada cena usando módulo
          const cameraAngle = cameraAngles[sceneIdx % cameraAngles.length];
          const lighting = timeOfDay[sceneIdx % timeOfDay.length];
          const composition = visualFocus[sceneIdx % visualFocus.length];
          
          // CORREÇÃO AUTOMÁTICA PRESERVANDO FIDELIDADE À NARRAÇÃO:
          // - NUNCA reescrever completamente o prompt - isso perde a sincronização com o texto
          // - Apenas REMOVER termos problemáticos e ADICIONAR diversidade visual
          // - O prompt original da IA já foi criado com base no texto da cena
          const hasHuman = /\b(person|people|man|woman|official|observer|figure)\b/i.test(finalPrompt);

          if (isHistorical && (hasModernClothing || hasHuman)) {
            console.log(`[Batch ${batchNumber}] Scene ${originalScene.number} detected modern/human elements in historical context, CLEANING prompt while preserving narration context...`);
            
            // NOVA ABORDAGEM: Limpar o prompt original em vez de substituí-lo completamente
            // Isso preserva a conexão com a narração original
            
            // Lista de termos a REMOVER (não reescrever tudo)
            const termsToRemove = [
              /\b(suit|suits|blazer|blazers|tie|ties|formal attire|formal wear|formal clothing)\b/gi,
              /\b(business attire|business suit|dress shirt|button.?up shirt|collar shirt)\b/gi,
              /\b(office wear|professional attire|corporate|executive)\b/gi,
              /\b(official|researcher|scientist|archaeologist|explorer|investigator|expert|curator|archivist)\s+(in|wearing|with)\s+[^,]+/gi,
              /\b(person|people|man|woman|figure)\s+(in|wearing|examining|studying|observing|looking at)\s+[^,]+/gi,
              /\b(uniform|police|security|guard|officer|military)\b/gi,
              /\b(modern|contemporary|present.?day)\s+(person|people|man|woman|observer|attire|clothing)\b/gi,
              /\b(jeans|denim|t-?shirt|hoodie|jacket|sweater|cardigan|polo|blouse)\b/gi,
              /\b(glasses|sunglasses|watch|wristwatch|goggles|backpack|briefcase)\b/gi,
              /\b(laptop|computer|smartphone|phone|tablet|camera|flashlight)\b/gi,
            ];
            
            let cleanedPrompt = finalPrompt;
            for (const pattern of termsToRemove) {
              cleanedPrompt = cleanedPrompt.replace(pattern, '');
            }
            
            // Limpar vírgulas duplas e espaços extras resultantes da remoção
            cleanedPrompt = cleanedPrompt
              .replace(/,\s*,/g, ',')
              .replace(/,\s*$/g, '')
              .replace(/^\s*,/g, '')
              .replace(/\s+/g, ' ')
              .trim();
            
            // Adicionar sufixos de limpeza e diversidade, preservando o conteúdo original
            const sceneTextKeywords = originalScene.text
              .split(/\s+/)
              .filter(w => w.length > 4)
              .slice(0, 5)
              .join(', ');
            
            // Reconstruir com contexto da cena preservado
            finalPrompt = `${cleanedPrompt}, ${cameraAngle}, ${composition}, ${lighting}, focus on ${sceneTextKeywords || 'artifacts and location'}, empty scene without visible people, no humans, no modern elements`;
          } else {
            // Adicionar diversidade visual sem mexer no conteúdo
            const diversity = `, ${cameraAngle}, ${composition}, ${lighting}`;
            const lp = finalPrompt.toLowerCase();
            if (!lp.includes(cameraAngle.toLowerCase()) && !lp.includes(lighting.toLowerCase())) {
              finalPrompt = `${finalPrompt}${diversity}`;
            }
          }
          
          // Garantir que o estilo seja aplicado mesmo se não corrigido
          if (!styleApplied && stylePrefix) {
            finalPrompt = finalPrompt.replace(/^(16:9[^,]*|1280x720[^,]*),\s*(16:9[^,]*|edge-to-edge[^,]*),?\s*/, `16:9 horizontal landscape, edge-to-edge full bleed composition, ${stylePrefix}, `);
          }
          
          // Calcular multiplicador de retenção baseado na posição e conteúdo
          const scenePosition = originalScene.number;
          const totalScenes = scenes.length;
          const positionPercent = scenePosition / totalScenes;
          
          // Multiplicador padrão baseado na posição se a IA não fornecer
          // APRIMORADO: Segue as mesmas regras do audiovisual expert
          let defaultMultiplier = 1.0;
          let defaultReason = "ritmo padrão";
          
          if (scenePosition <= 5) {
            // Primeiras cenas: HOOK rápido (0.55-0.70)
            defaultMultiplier = 0.65;
            defaultReason = "hook inicial - cortes rápidos para prender atenção";
          } else if (positionPercent >= 0.92) {
            // Últimas cenas: conclusão épica (1.25-1.40)
            defaultMultiplier = 1.3;
            defaultReason = "conclusão épica - desaceleração cinematográfica";
          } else if (aiScene?.emotion && ['choque', 'shock', 'surprise', 'surpresa'].includes(aiScene.emotion.toLowerCase())) {
            defaultMultiplier = 0.7;
            defaultReason = "choque/surpresa - impacto visual rápido";
          } else if (aiScene?.emotion && ['tensão', 'tension', 'fear', 'medo'].includes(aiScene.emotion.toLowerCase())) {
            defaultMultiplier = 0.75;
            defaultReason = "tensão - manter energia alta";
          } else if (aiScene?.retentionTrigger && ['revelação', 'revelation'].includes(aiScene.retentionTrigger.toLowerCase())) {
            defaultMultiplier = 1.2;
            defaultReason = "revelação - pausa dramática para impacto";
          } else if (scenePosition % 7 === 0) {
            // Pattern break a cada ~7 cenas
            defaultMultiplier = 0.7;
            defaultReason = "pattern break - resetar atenção do espectador";
          }
          
          // Usar multiplicador da IA se fornecido e válido (range expandido: 0.55-1.4)
          const aiMultiplier = typeof aiScene?.retentionMultiplier === 'number' 
            ? Math.max(0.55, Math.min(1.4, aiScene.retentionMultiplier)) 
            : null;
          
          results.push({
            number: originalScene.number,
            // CRÍTICO: Usar o texto ORIGINAL, não o da IA
            text: originalScene.text,
            wordCount: originalScene.wordCount,
            imagePrompt: finalPrompt,
            // Gerar prompt Veo3 se solicitado
            veo3Prompt: includeVeo3 ? generateVeo3Prompt(
              finalPrompt, 
              scriptContext, 
              originalScene.wordCount, 
              wpm
            ) : undefined,
            characterName: aiScene?.characterName || undefined,
            emotion: aiScene?.emotion || 'neutral',
            retentionTrigger: aiScene?.retentionTrigger || 'continuity',
            // Priorizar movimento nas primeiras cenas (retenção de audiência)
            // Cenas 1-5: forçar movimento | Cenas 6-15: usar recomendação da IA ou forçar se dinâmico
            suggestMovement: originalScene.number <= 5 
              ? true 
              : (originalScene.number <= 15 
                  ? (aiScene?.suggestMovement || /action|explosion|battle|chase|storm|wave|fire|crowd|vehicle|reveal|transform/i.test(originalScene.text))
                  : (aiScene?.suggestMovement || false)),
            // NOVO: Multiplicador de retenção para ajuste de duração
            retentionMultiplier: aiMultiplier || defaultMultiplier,
            retentionReason: aiScene?.retentionReason || defaultReason
          });
        }

        if (results.length > 0) {
          return results;
        }

        if (attempt < maxRetries) {
          console.warn(`[Batch ${batchNumber}] No scenes parsed, retrying...`);
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
      } catch (parseError) {
        console.error(`[Batch ${batchNumber}] Parse error:`, parseError);
        lastError = parseError;
        if (attempt < maxRetries) {
          await new Promise(r => setTimeout(r, 2000));
          continue;
        }
      }
    } catch (fetchError) {
      console.error(`[Batch ${batchNumber}] Fetch error:`, fetchError);
      lastError = fetchError;
      if (attempt < maxRetries) {
        await new Promise(r => setTimeout(r, 3000 * (attempt + 1)));
        continue;
      }
    }
  }
  
  // Se todas as tentativas falharam, retornar cenas com prompts genéricos CONTEXTUAIS com DIVERSIFICAÇÃO
  console.warn(`[Batch ${batchNumber}] All retries failed, using contextual fallback prompts with visual diversity`);
  
  // Mesmas listas de diversificação usadas na correção automática
  const cameraAngles = [
    'wide establishing shot', 'close-up detail shot', 'low angle dramatic view',
    'high angle overview', 'medium shot', 'extreme close-up macro',
    'panoramic vista', 'side profile view', 'diagonal dynamic angle',
    'bird\'s eye view', 'worm\'s eye perspective', 'dutch angle tilted frame'
  ];
  const timeOfDay = [
    'golden hour sunset lighting', 'blue hour twilight', 'harsh midday sun',
    'soft dawn light', 'dramatic dusk silhouette', 'moonlit night scene',
    'overcast diffused light', 'backlit dramatic rays', 'warm candlelight glow'
  ];
  const visualFocus = [
    'texture and detail emphasis', 'atmospheric depth and haze', 'sharp foreground blur background',
    'symmetrical composition', 'rule of thirds framing', 'leading lines to subject',
    'negative space minimalist', 'layered depth planes', 'reflection and mirroring'
  ];
  
  return scenes.map((scene, idx) => {
    const sceneIdx = scene.number - 1;
    const numLocations = Math.max(1, visualMap.keyLocations.length);
    const numObjects = Math.max(1, visualMap.keyObjects.length);
    
    // Usar elementos do visualMap DISTRIBUÍDOS para cada cena
    const location = visualMap.keyLocations[sceneIdx % numLocations] || scriptContext.setting;
    const object = visualMap.keyObjects.length > 0 
      ? visualMap.keyObjects[(sceneIdx + 1) % numObjects] 
      : '';
    
    // Diversificação visual: ângulo, iluminação e composição ÚNICOS por cena
    const cameraAngle = cameraAngles[sceneIdx % cameraAngles.length];
    const lighting = timeOfDay[sceneIdx % timeOfDay.length];
    const composition = visualFocus[sceneIdx % visualFocus.length];
    
    const fallbackImagePrompt = `16:9 horizontal landscape, edge-to-edge full bleed composition, ${cameraAngle}, ${composition}, ${stylePrefix || style + ' style'}, ${lighting}, ${location}${object ? ', featuring ' + object : ''}, ${scriptContext.period}, ${scriptContext.atmosphere} atmosphere, documentary about ${visualMap.mainTheme}, fill entire frame without any black bars, no text, no watermarks`;
    
    // Priorizar movimento nas primeiras cenas mesmo no fallback
    const isEarlyScene = scene.number <= 5;
    const isRetentionZone = scene.number <= 15;
    const hasDynamicContent = /action|move|run|fly|battle|storm|wave|fire|water|crowd|reveal|transform|explosion|chase|wind|rain|lightning/i.test(scene.text);
    
    // Calcular multiplicador de retenção baseado na posição
    const totalScenesFallback = scenes.length;
    const positionPercent = scene.number / totalScenesFallback;
    
    let fallbackMultiplier = 1.0;
    let fallbackReason = "ritmo padrão";
    
    if (isEarlyScene) {
      fallbackMultiplier = 0.65;
      fallbackReason = "hook inicial - cortes rápidos para prender atenção";
    } else if (positionPercent >= 0.92) {
      fallbackMultiplier = 1.3;
      fallbackReason = "conclusão épica - desaceleração cinematográfica";
    } else if (hasDynamicContent) {
      fallbackMultiplier = 0.75;
      fallbackReason = "conteúdo dinâmico - ritmo acelerado";
    } else if (scene.number % 7 === 0) {
      fallbackMultiplier = 0.7;
      fallbackReason = "pattern break - resetar atenção";
    }
    
    return {
      number: scene.number,
      text: scene.text,
      wordCount: scene.wordCount,
      imagePrompt: fallbackImagePrompt,
      veo3Prompt: includeVeo3 ? generateVeo3Prompt(fallbackImagePrompt, scriptContext, scene.wordCount, wpm) : undefined,
      characterName: undefined,
      emotion: 'neutral',
      retentionTrigger: 'continuity',
      // Forçar movimento nas primeiras 5 cenas, ou se tiver conteúdo dinâmico nas primeiras 15
      suggestMovement: isEarlyScene ? true : (isRetentionZone && hasDynamicContent),
      // Multiplicador de retenção baseado na posição
      retentionMultiplier: fallbackMultiplier,
      retentionReason: fallbackReason
    };
  });
}
async function generateBatchPrompts(
  chunk: string,
  batchNumber: number,
  startSceneNumber: number,
  scenesInBatch: number,
  style: string,
  stylePrefix: string,
  characters: CharacterDescription[],
  scriptContext: ScriptContext,
  visualMap: ScriptVisualMap,
  wpm: number,
  apiUrl: string,
  apiKey: string,
  apiModel: string,
  includeVeo3: boolean = false,
  userIdentifier: string = "anonymous"
): Promise<SceneResult[]> {
  // Pré-segmentar o chunk e usar a nova função
  const preSegmented = preSegmentScript(chunk, Math.ceil(chunk.split(/\s+/).length / scenesInBatch), startSceneNumber);
  return generatePromptsForPreSegmentedScenes(preSegmented, batchNumber, style, stylePrefix, characters, scriptContext, visualMap, wpm, apiUrl, apiKey, apiModel, includeVeo3, userIdentifier);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const LAOZHANG_API_KEY = Deno.env.get("LAOZHANG_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Extrair userId e email para tracking
    let userId: string | null = null;
    let userEmail: string = "anonymous";
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      userId = user?.id || null;
      userEmail = user?.email || "anonymous";
    }

    // NOVO: Identificador do usuário para logs da API externa
    const userIdentifier = userEmail !== "anonymous" ? userEmail : (userId || "anonymous");
    console.log(`[Generate Scenes] User: ${userIdentifier}`);

    const body = await req.json();
    const {
      script,
      scriptId,
      model = "gpt-4o",
      style = "cinematic",
      stylePrefix = "", // Novo: recebe o promptPrefix do estilo selecionado
      wordsPerScene = 80,
      maxScenes = 500,
      wpm = 140,
      includeVeo3 = false, // Novo: incluir prompts Veo3
      stream = false, // Nova opção para streaming
      startSceneNumber = 1, // NOVO: numeração correta quando o roteiro é dividido em partes
      existingCharacters = [] as CharacterDescription[], // NOVO: manter consistência entre partes
      referenceCharacters: referenceCharactersRaw = [] as ReferenceCharacterInput[], // NOVO: Personagens com imagens de referência
      maxSecondsPerScene = 0, // NOVO: Split dinâmico - 0 = desativado
    } = body;

    // Sanear/limitar imagens de referência (evita payloads e tempo excessivo de visão)
    const MAX_REFERENCE_IMAGES = 3;
    const MAX_REFERENCE_BASE64_LEN = 450_000; // ~450KB (string); o client já comprime

    const referenceCharacters: ReferenceCharacterInput[] = (Array.isArray(referenceCharactersRaw)
      ? referenceCharactersRaw
      : [])
      .filter((c) => c && typeof c.name === "string" && typeof c.imageBase64 === "string")
      .map((c) => ({ name: c.name.trim(), imageBase64: c.imageBase64 }))
      .filter((c) => c.name.length > 0 && c.imageBase64.length > 0)
      .filter((c) => {
        if (c.imageBase64.length <= MAX_REFERENCE_BASE64_LEN) return true;
        console.warn(`[Generate Scenes] Reference image too large for "${c.name}" (${c.imageBase64.length} chars). Skipping.`);
        return false;
      })
      .slice(0, MAX_REFERENCE_IMAGES);

    if (referenceCharacters.length > 0) {
      console.log(`[Generate Scenes] Reference characters received: ${referenceCharacters.length}`);
    }


    // Resolver o roteiro:
    // - Preferir script direto (compat)
    // - Senão, buscar pelo scriptId (evita payload gigante no client)
    let resolvedScript: string | null = (script || null) as string | null;
    if (!resolvedScript && scriptId) {
      const { data: promptRow, error: promptErr } = await supabaseAdmin
        .from("scene_prompts")
        .select("script")
        .eq("id", scriptId)
        .maybeSingle();

      if (promptErr) {
        console.error("[Generate Scenes] Failed to fetch script by scriptId:", promptErr);
      }
      resolvedScript = (promptRow?.script as string | null) ?? null;
    }

    if (!resolvedScript) {
      throw new Error("script or scriptId is required");
    }

    const wordCount = resolvedScript.split(/\s+/).filter(Boolean).length;
    const estimatedScenes = Math.min(Math.ceil(wordCount / wordsPerScene), maxScenes);
    // OTIMIZADO v2: 35 cenas por batch + 3 batches em paralelo para máxima velocidade
    const scenesPerBatch = 35;
    const totalBatches = Math.ceil(estimatedScenes / scenesPerBatch);

    console.log(`[Generate Scenes] ${wordCount} words -> ${estimatedScenes} scenes in ${totalBatches} batches (35/batch, 3x parallel)`);

    // Calcular créditos (Prompts para Cenas sempre usa DeepSeek)
    const creditsNeeded = Math.ceil(totalBatches * CREDIT_PRICING.base);

    // Get admin API keys (fallback)
    const { data: adminData } = await supabaseAdmin
      .from('admin_settings')
      .select('value')
      .eq('key', 'api_keys')
      .maybeSingle();

    const adminApiKeys = adminData?.value as AdminApiKeys | null;

    // Determine API config
    let apiUrl: string;
    let apiKey: string;
    let apiModel: string;

    // FORÇAR: Usar deepseek-v3.2-exp da Laozhang (modelo obrigatório conforme regra do sistema)
    if (LAOZHANG_API_KEY) {
      apiUrl = "https://api.laozhang.ai/v1/chat/completions";
      apiKey = LAOZHANG_API_KEY;
      apiModel = "deepseek-v3.2-exp"; // Modelo obrigatório para geração de cenas
      console.log(`[Generate Scenes] Using Laozhang AI - Model: deepseek-v3.2-exp (env)`);
    } else if (adminApiKeys?.laozhang) {
      apiUrl = "https://api.laozhang.ai/v1/chat/completions";
      apiKey = adminApiKeys.laozhang;
      apiModel = "deepseek-v3.2-exp";
      console.log(`[Generate Scenes] Using Laozhang AI - Model: deepseek-v3.2-exp (admin_settings)`);
    } else {
      return new Response(
        JSON.stringify({ error: "Chave DeepSeek (Laozhang) não configurada. Configure LAOZHANG_API_KEY." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar configuração de uso de créditos da plataforma
    let usePlatformCredits = true;
    if (userId) {
      const { data: userApiSettings } = await supabaseAdmin
        .from("user_api_settings")
        .select("use_platform_credits")
        .eq("user_id", userId)
        .maybeSingle();

      usePlatformCredits = userApiSettings?.use_platform_credits ?? true;
    }

    // Verificar e debitar créditos - apenas se usa créditos da plataforma
    if (userId && usePlatformCredits) {
      const { data: creditData } = await supabaseAdmin
        .from("user_credits")
        .select("balance")
        .eq("user_id", userId)
        .single();

      const currentBalance = creditData?.balance ?? 50;
      
      if (currentBalance < creditsNeeded) {
        return new Response(
          JSON.stringify({ error: `Créditos insuficientes. Necessário: ${creditsNeeded}, Disponível: ${currentBalance}` }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabaseAdmin
        .from("user_credits")
        .update({ balance: currentBalance - creditsNeeded })
        .eq("user_id", userId);

      await supabaseAdmin.from("credit_usage").insert({
        user_id: userId,
        operation_type: "scene_prompts",
        credits_used: creditsNeeded,
        model_used: apiModel,
        details: { word_count: wordCount, total_batches: totalBatches, estimated_scenes: estimatedScenes }
      });

      await supabaseAdmin.from("credit_transactions").insert({
        user_id: userId,
        amount: -creditsNeeded,
        transaction_type: "debit",
        description: `Geração de ${estimatedScenes} prompts de cenas`
      });
    }

    // OTIMIZADO: Detectar contexto, personagens E mapa visual em UMA chamada
    console.log(`[Generate Scenes] Detecting context + characters + visual map (unified call)...`);
    const { context: scriptContext, characters: scriptCharacters, visualMap } = await detectContextAndCharacters(resolvedScript, apiUrl, apiKey, apiModel);

    // NOVO: Analisar imagens de referência para extrair descrições de personagens
    // CUSTO: 5 créditos para consistência de personagens (conforme mapa de créditos)
    // IMPORTANTE: o provedor de geração (DeepSeek/Laozhang) não tem visão.
    // Para visão usamos o gateway multimodal do Lovable (Gemini), via LOVABLE_API_KEY.
    let referenceChars: CharacterDescription[] = [];
    const REFERENCE_IMAGE_CREDITS = 5; // Custo fixo para análise de personagens consistentes
    
    if (referenceCharacters && referenceCharacters.length > 0) {
      console.log(`[Generate Scenes] Analyzing ${referenceCharacters.length} reference images (${REFERENCE_IMAGE_CREDITS} credits)...`);
      
      // Verificar e debitar créditos para análise de referência
      if (userId && usePlatformCredits) {
        const { data: refCreditData } = await supabaseAdmin
          .from("user_credits")
          .select("balance")
          .eq("user_id", userId)
          .single();

        const refBalance = refCreditData?.balance ?? 0;
        
        if (refBalance < REFERENCE_IMAGE_CREDITS) {
          return new Response(
            JSON.stringify({ error: `Créditos insuficientes para análise de personagens. Necessário: ${REFERENCE_IMAGE_CREDITS}, Disponível: ${refBalance}` }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Debitar créditos
        await supabaseAdmin
          .from("user_credits")
          .update({ balance: refBalance - REFERENCE_IMAGE_CREDITS })
          .eq("user_id", userId);

        // Registrar uso
        await supabaseAdmin.from("credit_usage").insert({
          user_id: userId,
          operation_type: "character_consistency",
          credits_used: REFERENCE_IMAGE_CREDITS,
          model_used: "gemini-2.5-flash",
          details: { 
            reference_count: referenceCharacters.length,
            character_names: referenceCharacters.map(r => r.name)
          }
        });

        await supabaseAdmin.from("credit_transactions").insert({
          user_id: userId,
          amount: -REFERENCE_IMAGE_CREDITS,
          transaction_type: "debit",
          description: `Análise de ${referenceCharacters.length} personagem(s) consistente(s)`
        });
        
        console.log(`[Generate Scenes] Deducted ${REFERENCE_IMAGE_CREDITS} credits for character analysis`);
      }
      
      referenceChars = await analyzeReferenceImages(referenceCharacters, LAOZHANG_API_KEY);
    }

    // Mesclar personagens com prioridade:
    // 1) Referências (mais precisas)
    // 2) existingCharacters (consistência entre chunks)
    // 3) personagens detectados no script
    const allCharacters: CharacterDescription[] = [];

    const pushUnique = (char: CharacterDescription) => {
      const exists = allCharacters.some(c => c.name.toLowerCase() === char.name.toLowerCase());
      if (!exists) allCharacters.push(char);
    };

    for (const c of referenceChars) pushUnique(c);
    for (const c of (existingCharacters || [])) pushUnique(c);
    for (const c of scriptCharacters) pushUnique(c);

    console.log(
      `[Generate Scenes] Context: ${scriptContext.period}, Theme: ${visualMap.mainTheme}, Characters: ${allCharacters.length} (${referenceChars.length} from reference)`,
      allCharacters.map((c: CharacterDescription) => c.name)
    );

    // PRÉ-SEGMENTAR o roteiro inteiro ANTES de chamar a IA
    // Isso garante sincronização PERFEITA: cada cena tem texto exato que será narrado
    let allPreSegmentedScenes = preSegmentScript(resolvedScript, wordsPerScene, startSceneNumber);
    
    // NOVO: Split dinâmico para criar mais cenas sem aumentar a duração total
    if (maxSecondsPerScene > 0) {
      console.log(`[Generate Scenes] Dynamic split enabled: max ${maxSecondsPerScene}s per scene at ${wpm} WPM`);
      allPreSegmentedScenes = splitLongScenes(allPreSegmentedScenes, wpm, maxSecondsPerScene);
    }
    
    const actualSceneCount = allPreSegmentedScenes.length;
    console.log(`[Generate Scenes] Pre-segmented into ${actualSceneCount} scenes`);

    // Dividir cenas pré-segmentadas em lotes para processamento
    const sceneBatches: PreSegmentedScene[][] = [];
    for (let i = 0; i < allPreSegmentedScenes.length; i += scenesPerBatch) {
      sceneBatches.push(allPreSegmentedScenes.slice(i, i + scenesPerBatch));
    }
    console.log(`[Generate Scenes] Split into ${sceneBatches.length} batches`);

    // ===== STREAMING MODE =====
    if (stream) {
      const encoder = new TextEncoder();
      
      const streamBody = new ReadableStream({
        async start(controller) {
          // Heartbeat interval para manter conexão viva (a cada 10s)
          let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
          let isControllerClosed = false;

          const safeEnqueue = (data: string) => {
            if (!isControllerClosed) {
              try {
                controller.enqueue(encoder.encode(data));
              } catch (e) {
                console.error("[Generate Scenes] Enqueue error:", e);
                isControllerClosed = true;
              }
            }
          };

          const cleanup = () => {
            if (heartbeatInterval) {
              clearInterval(heartbeatInterval);
              heartbeatInterval = null;
            }
          };

          try {
            // Iniciar heartbeat para manter conexão SSE viva
            heartbeatInterval = setInterval(() => {
              safeEnqueue(`: heartbeat\n\n`);
            }, 10000);

            // Enviar info inicial com número EXATO de cenas e contexto
            safeEnqueue(`data: ${JSON.stringify({ 
              type: 'init', 
              estimatedScenes: actualSceneCount, 
              totalBatches: sceneBatches.length,
              characters: allCharacters,
              scriptContext
            })}\n\n`);

            const allScenes: SceneResult[] = [];
            let completedScenes = 0; // Contador global para progresso gradual

            // OTIMIZADO v3: Processar batches em paralelo MAS emitir cenas GRADUALMENTE
            // Em vez de esperar todos os batches, emitimos cenas assim que cada batch individual termina
            const PARALLEL_BATCHES = 3;

            for (let i = 0; i < sceneBatches.length; i += PARALLEL_BATCHES) {
              if (isControllerClosed) break;

              // Pegar os próximos N batches para processar em paralelo
              const batchesToProcess = sceneBatches.slice(i, i + PARALLEL_BATCHES);
              
              console.log(`[Generate Scenes] Processing batches ${i + 1}-${Math.min(i + PARALLEL_BATCHES, sceneBatches.length)}/${sceneBatches.length} in parallel`);

              // Enviar status do lote para manter cliente informado
              safeEnqueue(`data: ${JSON.stringify({ 
                type: 'batch_start', 
                batch: i + 1, 
                totalBatches: sceneBatches.length,
                parallelCount: batchesToProcess.length
              })}\n\n`);

              // Criar promises para todos os batches em paralelo
              // NOVA ABORDAGEM: Cada promise emite suas cenas imediatamente ao completar
              const pendingScenes: Map<number, SceneResult[]> = new Map();
              let nextBatchToEmit = i + 1; // Qual batch deve emitir próximo (para manter ordem)

              const emitPendingScenes = () => {
                // Emitir cenas na ordem correta
                while (pendingScenes.has(nextBatchToEmit)) {
                  const scenes = pendingScenes.get(nextBatchToEmit)!;
                  pendingScenes.delete(nextBatchToEmit);
                  
                  for (const scene of scenes) {
                    if (isControllerClosed) break;
                    allScenes.push(scene);
                    completedScenes++;
                    
                    // IMPORTANTE: Emitir CADA cena individualmente para progresso gradual
                    safeEnqueue(`data: ${JSON.stringify({ 
                      type: 'scene', 
                      scene,
                      current: completedScenes,
                      total: actualSceneCount
                    })}\n\n`);
                  }
                  nextBatchToEmit++;
                }
              };

              const batchPromises = batchesToProcess.map((batch, idx) => {
                const batchNum = i + idx + 1;
                
                const batchPromise = generatePromptsForPreSegmentedScenes(
                  batch,
                  batchNum,
                  style,
                  stylePrefix,
                  allCharacters,
                  scriptContext,
                  visualMap,
                  wpm,
                  apiUrl,
                  apiKey,
                  apiModel,
                  includeVeo3,
                  userIdentifier
                );

                // Timeout reduzido para 90s (gpt-4.1 é mais rápido)
                const timeoutPromise = new Promise<SceneResult[]>((_, reject) => {
                  setTimeout(() => reject(new Error(`Batch ${batchNum} timeout`)), 90000);
                });

                return Promise.race([batchPromise, timeoutPromise])
                  .then(scenes => {
                    console.log(`[Generate Scenes] Batch ${batchNum} completed: ${scenes.length} scenes`);
                    // Armazenar cenas para emissão ordenada
                    pendingScenes.set(batchNum, scenes);
                    // Tentar emitir cenas pendentes na ordem
                    emitPendingScenes();
                    return { batchNum, scenes, error: null };
                  })
                  .catch(error => {
                    console.error(`[Generate Scenes] Batch ${batchNum} failed:`, error);
                    
                    safeEnqueue(`data: ${JSON.stringify({ 
                      type: 'batch_retry', 
                      batch: batchNum,
                      message: 'Usando fallback para este lote'
                    })}\n\n`);

                    // Gerar fallback imediatamente
                    const fallbackScenes: SceneResult[] = [];
                    for (const preScene of batch) {
                      const sceneIdx = preScene.number - 1;
                      const cameraAngles = ['wide shot', 'close-up', 'medium shot', 'panoramic view'];
                      const lighting = ['golden hour', 'dramatic lighting', 'soft light', 'atmospheric haze'];
                      
                      fallbackScenes.push({
                        number: preScene.number,
                        text: preScene.text,
                        wordCount: preScene.wordCount,
                        imagePrompt: `16:9 horizontal landscape, edge-to-edge full bleed composition, ${cameraAngles[sceneIdx % 4]}, ${stylePrefix || style + ' style'}, ${lighting[sceneIdx % 4]}, ${visualMap.mainTheme}, ${visualMap.keyLocations[sceneIdx % Math.max(1, visualMap.keyLocations.length)] || scriptContext.setting}, ${scriptContext.period}, documentary scene, fill entire frame without any black bars, no text, no watermarks`,
                        emotion: 'neutral',
                        retentionTrigger: 'continuity',
                        suggestMovement: preScene.number <= 5
                      });
                    }
                    
                    // Armazenar fallback para emissão ordenada
                    pendingScenes.set(batchNum, fallbackScenes);
                    emitPendingScenes();
                    
                    return { batchNum, scenes: fallbackScenes, error };
                  });
              });

              // Esperar todos os batches paralelos completarem
              await Promise.all(batchPromises);
              
              // Garantir que todas as cenas pendentes foram emitidas
              emitPendingScenes();

              // Pausa mínima entre grupos de batches paralelos
              if (i + PARALLEL_BATCHES < sceneBatches.length) {
                await new Promise(resolve => setTimeout(resolve, 100));
              }
            }

            cleanup();

            // Verificar resultado final
            if (allScenes.length === 0) {
              if (userId && usePlatformCredits) {
                const { data: creditData } = await supabaseAdmin
                  .from("user_credits")
                  .select("balance")
                  .eq("user_id", userId)
                  .single();

                if (creditData) {
                  await supabaseAdmin
                    .from("user_credits")
                    .update({ balance: creditData.balance + creditsNeeded })
                    .eq("user_id", userId);

                  await supabaseAdmin.from("credit_transactions").insert({
                    user_id: userId,
                    amount: creditsNeeded,
                    transaction_type: "refund",
                    description: "Reembolso - Falha na geração de prompts"
                  });
                }
              }
              
              safeEnqueue(`data: ${JSON.stringify({ 
                type: 'error', 
                error: "Não foi possível gerar os prompts. Tente novamente." 
              })}\n\n`);
            } else {
              safeEnqueue(`data: ${JSON.stringify({ 
                type: 'complete', 
                totalScenes: allScenes.length,
                creditsUsed: creditsNeeded
              })}\n\n`);
            }

            if (!isControllerClosed) {
              controller.close();
              isControllerClosed = true;
            }
          } catch (error) {
            cleanup();
            console.error("[Generate Scenes Stream] Error:", error);
            safeEnqueue(`data: ${JSON.stringify({ 
              type: 'error', 
              error: error instanceof Error ? error.message : "Unknown error" 
            })}\n\n`);
            if (!isControllerClosed) {
              controller.close();
              isControllerClosed = true;
            }
          }
        }
      });

      return new Response(streamBody, {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "Connection": "keep-alive",
          "X-Accel-Buffering": "no"
        }
      });
    }

    // ===== NON-STREAMING MODE (fallback) =====
    const allScenes: SceneResult[] = [];

    for (let i = 0; i < sceneBatches.length; i++) {
      const batch = sceneBatches[i];

      console.log(`[Generate Scenes] Processing batch ${i + 1}/${sceneBatches.length} (${batch.length} scenes)`);

      try {
        const batchScenes = await generatePromptsForPreSegmentedScenes(
          batch,
          i + 1,
          style,
          stylePrefix,
          allCharacters,
          scriptContext,
          visualMap,
          wpm,
          apiUrl,
          apiKey,
          apiModel,
          includeVeo3,
          userIdentifier
        );

        for (const scene of batchScenes) {
          allScenes.push(scene);
        }

        console.log(`[Generate Scenes] Batch ${i + 1} completed: ${batchScenes.length} scenes`);

        if (i < sceneBatches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (batchError) {
        console.error(`[Generate Scenes] Batch ${i + 1} failed:`, batchError);
        // Fallback: add scenes with generic prompts
        for (const preScene of batch) {
          allScenes.push({
            number: preScene.number,
            text: preScene.text,
            wordCount: preScene.wordCount,
            imagePrompt: `16:9 horizontal landscape, edge-to-edge full bleed composition, ${stylePrefix || style + ' style'}, cinematic scene: ${preScene.text.substring(0, 100)}, fill entire frame without any black bars`,
            emotion: 'neutral',
            retentionTrigger: 'continuity'
          });
        }
      }
    }

    // Se nenhuma cena foi gerada, reembolsar
    if (allScenes.length === 0) {
      if (userId && usePlatformCredits) {
        const { data: creditData } = await supabaseAdmin
          .from("user_credits")
          .select("balance")
          .eq("user_id", userId)
          .single();

        if (creditData) {
          await supabaseAdmin
            .from("user_credits")
            .update({ balance: creditData.balance + creditsNeeded })
            .eq("user_id", userId);

          await supabaseAdmin.from("credit_transactions").insert({
            user_id: userId,
            amount: creditsNeeded,
            transaction_type: "refund",
            description: "Reembolso - Falha na geração de prompts"
          });
        }
      }

      return new Response(
        JSON.stringify({ error: "Não foi possível gerar os prompts. Tente novamente." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Generate Scenes] Completed: ${allScenes.length} total scenes`);

    return new Response(
      JSON.stringify({
        success: true,
        scenes: allScenes,
        totalScenes: allScenes.length,
        totalBatches: sceneBatches.length,
        creditsUsed: creditsNeeded,
        characters: allCharacters
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[Generate Scenes] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
