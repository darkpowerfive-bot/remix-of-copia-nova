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
async function analyzeReferenceImages(
  referenceCharacters: ReferenceCharacterInput[],
  lovableApiKey?: string | null
): Promise<CharacterDescription[]> {
  if (!referenceCharacters || referenceCharacters.length === 0) {
    return [];
  }

  console.log(`[Analyze Reference Images] Processing ${referenceCharacters.length} reference images...`);
  
  const characters: CharacterDescription[] = [];
  
  for (const ref of referenceCharacters) {
    try {
      if (!lovableApiKey) {
        console.warn("[Analyze Reference] LOVABLE_API_KEY missing; skipping reference analysis");
        continue;
      }

      // Usar o gateway multimodal do Lovable (Gemini) para extrair descrição do personagem
      const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
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
        console.warn(`[Analyze Reference] Vision request failed for ${ref.name}:`, resp.status, errText?.slice(0, 300));
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

  console.log(`[Analyze Reference Images] Successfully analyzed ${characters.length}/${referenceCharacters.length} characters`);
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
    .replace(/16:9 aspect ratio,?\s*/gi, '')
    .replace(/full frame composition,?\s*/gi, '')
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
  
  // Regras de vestuário baseadas no período histórico - EXTREMAMENTE RIGOROSAS
  const clothingRules = isHistoricalContent 
    ? `\n👔 ABSOLUTE PROHIBITION - CLOTHING RULES FOR HISTORICAL CONTENT:

⛔ ZERO TOLERANCE POLICY - DO NOT INCLUDE ANY OF THESE:
- NO suits, blazers, ties, formal attire, business attire, dress shirts
- NO modern officials, bureaucrats, government workers in suits
- NO researchers, scientists, archaeologists, explorers in modern clothing
- NO people examining, studying, observing artifacts in contemporary attire
- NO archive rooms with suited officials - show ONLY the artifacts/papyrus
- NO police, security, military in modern uniforms
- NO construction workers with modern safety equipment
- NO women in blazers, modern dresses, or contemporary fashion
- NO men in suits standing in ancient locations
- NO "formal attire", "professional clothing", "office wear"

✅ WHAT TO SHOW INSTEAD:
- ARTIFACTS ONLY: papyrus scrolls, hieroglyphics, statues, tombs, temples
- LOCATIONS ONLY: pyramid interiors, chambers, ancient archives, excavation sites
- If HANDS are needed: show ONLY hands (no sleeves, no clothing visible) touching artifacts
- If SILHOUETTES are needed: dark undefined shapes, no clothing details
- ANCIENT WORKERS: wearing tunics, robes, sandals - ONLY if the script mentions workers
- EMPTY SCENES: most scenes should have NO human presence at all

🚨 DEFAULT RULE: When in doubt, DO NOT INCLUDE PEOPLE. Focus on OBJECTS and LOCATIONS.`
    : '';

  // PROMPT COM MAPA VISUAL COMPLETO + VALIDAÇÃO AUTOMÁTICA para garantir fidelidade TOTAL ao roteiro
  const systemPrompt = `You are a visual art director creating prompts for a documentary about: "${visualMap.mainTheme}"

🎬 SCRIPT VISUAL MAP (THIS IS YOUR ONLY REFERENCE - DO NOT INVENT):
- MAIN THEME: ${visualMap.mainTheme}
- KEY LOCATIONS (use ONLY these): ${visualMap.keyLocations.slice(0, 15).join(', ') || 'generic documentary setting'}
- KEY OBJECTS (use ONLY these): ${visualMap.keyObjects.slice(0, 15).join(', ') || 'relevant objects'}
- KEY EVENTS (visualize these): ${visualMap.keyEvents.slice(0, 10).join(', ') || 'narrative moments'}
- VISUAL TONE: ${visualMap.visualTone}

📍 GLOBAL CONTEXT:
- Era: ${scriptContext.period}
- Setting: ${scriptContext.setting}
- Atmosphere: ${scriptContext.atmosphere}
- Style: ${stylePrefix || style}${prohibitedList}${characterContext}${clothingRules}

⛔ CRITICAL VALIDATION (APPLY TO EVERY PROMPT):

STEP 1 - READ: Read the scene "text" field completely
STEP 2 - EXTRACT: Find visual elements (objects, locations, artifacts) mentioned in the text
STEP 3 - VALIDATE: Check each element against the VISUAL MAP above
  - If element IS in visual map → USE IT
  - If element is NOT in visual map AND NOT in scene text → DO NOT USE IT
STEP 4 - HUMAN CHECK: For historical content, AVOID showing modern humans. Focus on ARTIFACTS, STRUCTURES, LANDSCAPES
STEP 5 - SUBSTITUTE: For abstract text (theories, explanations, narration), use elements FROM THE VISUAL MAP that relate to the theme
STEP 6 - FINAL CHECK: Ask "Would this image fit in a professional ${visualMap.mainTheme} documentary?" If NO → remove anachronistic elements

🚫 ABSOLUTELY FORBIDDEN (AUTOMATIC REJECTION):
- Modern business suits, blazers, ties, dress shirts in ancient settings
- Construction helmets, safety vests, modern uniforms in historical scenes
- Police uniforms, security guards in ancient locations
- Tablet computers, phones, modern cameras held by people
- Modern vehicles, electronics, contemporary objects
- Random people with masks, goggles, or modern accessories
- Generic "researchers" or "scientists" in modern attire observing ancient artifacts
- Any clothing or accessory that would look OUT OF PLACE in the ${scriptContext.period}

✅ CORRECT APPROACH:
- Historical discoveries → show ONLY the artifacts, structures, hieroglyphics (no modern observers)
- Archaeological sites → show the LOCATION itself: tombs, chambers, pyramids, temples
- Abstract narration → show relevant LOCATION or OBJECT without human presence
- If people ARE needed → use SILHOUETTES, SHADOWS, or hands only
- Workers/builders → show ancient workers in period tunics/robes if the script mentions construction

📸 VISUAL STYLE ENFORCEMENT:
- ALWAYS apply the selected style: "${stylePrefix || style}"
- This style takes PRIORITY over default assumptions
- Match the lighting, color grading, and atmosphere to this specific style

🎬 VEO3 MOVEMENT RECOMMENDATIONS (CRITICAL FOR VIEWER RETENTION):
IMPORTANT: Be GENEROUS with suggestMovement=true recommendations! Video movement captures attention and reduces viewer drop-off.

MANDATORY suggestMovement=true for:
- ALL scenes in the FIRST 20% of the video (early scenes are CRITICAL for retention - hook the viewer!)
- Opening/hook scenes (first 3-5 scenes should ALWAYS have movement)
- Action sequences: explosions, battles, chases, fights, running, flying
- Natural phenomena: storms, waves, fire, waterfalls, wind, rain, lightning
- Camera movements: sweeping panoramas, zooming reveals, tracking shots
- Dynamic subjects: animals in motion, crowds, vehicles, machinery
- Emotional peaks: dramatic reveals, transformations, confrontations
- Transitions: scene changes, time lapses, day-to-night, seasonal changes
- Any scene with verbs of motion in the text: walk, run, fly, fall, rise, crash, explode, flow

ALSO RECOMMEND suggestMovement=true for:
- Atmospheric scenes: clouds moving, fog rolling, leaves falling, smoke rising
- Water scenes: rivers flowing, ocean waves, rain falling
- Epic establishing shots: cities, landscapes, monuments (with subtle movement)
- Suspense/tension scenes: shadows moving, doors opening, lights flickering

TARGET: Recommend movement for AT LEAST 40-50% of all scenes, with PRIORITY on early scenes.
The FIRST 5 scenes should almost ALWAYS have suggestMovement=true unless they are purely static informational frames.

🎨 VISUAL DIVERSITY REQUIREMENT (CRITICAL - MANDATORY):
Each scene MUST have a DISTINCT visual composition. Use these techniques to ensure NO TWO CONSECUTIVE SCENES look similar:

CAMERA ANGLES (rotate through these): wide establishing shot, close-up detail, low angle dramatic, high angle overview, panoramic vista, extreme macro close-up, dutch angle, side profile
LIGHTING (vary between scenes): golden hour sunset, blue hour twilight, harsh midday, soft dawn, backlit silhouette, candlelight, moonlit night, overcast diffused
COMPOSITION (alternate): symmetrical, rule of thirds, leading lines, negative space, layered depth, reflection, diagonal dynamic

DIVERSITY RULES:
- Scene N and Scene N+1 MUST have DIFFERENT camera angles
- Scene N and Scene N+2 MUST show DIFFERENT key locations from the visualMap
- NEVER generate 3+ consecutive scenes with the same dominant subject (e.g., 3 pyramid exteriors in a row)
- ALTERNATE between: wide/close shots, exterior/interior, objects/architecture, day/night

FORMAT (EVERY PROMPT - INCLUDE CAMERA ANGLE AND LIGHTING):
"1280x720, 16:9, [CAMERA ANGLE], ${stylePrefix || style}, [LIGHTING], [VISUAL DESCRIPTION focusing on LOCATIONS and OBJECTS, minimal human presence], ${scriptContext.atmosphere} atmosphere, no text, no watermarks"

RETURN ONLY JSON:
{"scenes":[{"number":N,"imagePrompt":"[50-70 words including camera angle and specific lighting, diverse from adjacent scenes]","emotion":"[one word]","suggestMovement":true/false}]}`;

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
            `1280x720 resolution, 16:9 aspect ratio, full frame composition, ${stylePrefix || style + ' style'}, dramatic lighting, cinematic shot of ${visualMap.mainTheme}, ${visualMap.keyLocations[0] || scriptContext.setting}`;
          
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
          
          // CORREÇÃO AUTOMÁTICA (SEM QUEBRAR SINCRONIA/CONTEXTO):
          // - Em conteúdo histórico: remover humanos/roupas modernas quando detectado
          // - Fora disso: apenas acrescentar diversidade (ângulo/luz/composição) sem reescrever o significado
          const hasHuman = /\b(person|people|man|woman|official|observer|figure)\b/i.test(finalPrompt);

          if (isHistorical) {
            // Em contexto histórico, só corrigir quando houver risco claro (humanos/roupa moderna)
            if (hasModernClothing || hasHuman) {
              console.log(`[Batch ${batchNumber}] Scene ${originalScene.number} detected modern/human elements in historical context, FORCE correcting with visual diversity...`);

              // Usar índice da cena para DISTRIBUIR elementos - cada cena usa localização/objeto diferente
              const locationIdx = sceneIdx % numLocations;
              const objectIdx = (sceneIdx + 1) % numObjects; // +1 para não coincidir com location

              const relevantLocation = visualMap.keyLocations[locationIdx] || scriptContext.setting;
              const relevantObject = visualMap.keyObjects.length > 0 ? visualMap.keyObjects[objectIdx] : '';

              // Prompt focado em LOCAIS/OBJETOS, com diversidade visual, sem pessoas
              finalPrompt = `1280x720 resolution, 16:9 aspect ratio, ${cameraAngle}, ${composition}, ${stylePrefix || style}, ${lighting}, ancient ${relevantLocation}${relevantObject ? ', ancient ' + relevantObject + ' artifact' : ''}, ${scriptContext.period}, ${scriptContext.atmosphere} atmosphere, documentary about ${visualMap.mainTheme}, empty scene without any people, focus on architecture and artifacts only, no humans, no modern elements, no text, no watermarks`;
            } else {
              // Mesmo quando não corrige, adicionar diversidade leve sem mexer no conteúdo
              const diversity = `, ${cameraAngle}, ${composition}, ${lighting}`;
              const lp = finalPrompt.toLowerCase();
              if (!lp.includes(cameraAngle.toLowerCase()) && !lp.includes(lighting.toLowerCase())) {
                finalPrompt = `${finalPrompt}${diversity}`;
              }
            }
          } else {
            // Fora do histórico: NÃO reescrever o prompt (isso pode desalinhar a imagem da narração).
            // Só adiciona diversidade para evitar imagens muito parecidas.
            const diversity = `, ${cameraAngle}, ${composition}, ${lighting}`;
            const lp = finalPrompt.toLowerCase();
            if (!lp.includes(cameraAngle.toLowerCase()) && !lp.includes(lighting.toLowerCase())) {
              finalPrompt = `${finalPrompt}${diversity}`;
            }
          }
          
          // Garantir que o estilo seja aplicado mesmo se não corrigido
          if (!styleApplied && stylePrefix) {
            finalPrompt = finalPrompt.replace(/^1280x720[^,]*,\s*16:9[^,]*,\s*/, `1280x720 resolution, 16:9 aspect ratio, full frame composition, ${stylePrefix}, `);
          }
          
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
                  : (aiScene?.suggestMovement || false))
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
    
    const fallbackImagePrompt = `1280x720 resolution, 16:9 aspect ratio, ${cameraAngle}, ${composition}, ${stylePrefix || style + ' style'}, ${lighting}, ${location}${object ? ', featuring ' + object : ''}, ${scriptContext.period}, ${scriptContext.atmosphere} atmosphere, documentary about ${visualMap.mainTheme}, no text, no watermarks`;
    
    // Priorizar movimento nas primeiras cenas mesmo no fallback
    const isEarlyScene = scene.number <= 5;
    const isRetentionZone = scene.number <= 15;
    const hasDynamicContent = /action|move|run|fly|battle|storm|wave|fire|water|crowd|reveal|transform|explosion|chase|wind|rain|lightning/i.test(scene.text);
    
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
      suggestMovement: isEarlyScene ? true : (isRetentionZone && hasDynamicContent)
    };
  });
}

// Função legada mantida para compatibilidade (não mais usada)
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
      referenceCharacters = [] as ReferenceCharacterInput[], // NOVO: Personagens com imagens de referência
    } = body;

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
    const scenesPerBatch = 15; // Processar 15 cenas por vez (aumentado de 10)
    const totalBatches = Math.ceil(estimatedScenes / scenesPerBatch);

    console.log(`[Generate Scenes] ${wordCount} words -> ${estimatedScenes} scenes in ${totalBatches} batches`);

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

    // Regra: Prompts para Cenas SEMPRE usa DeepSeek (mais econômico)
    if (LAOZHANG_API_KEY) {
      apiUrl = "https://api.laozhang.ai/v1/chat/completions";
      apiKey = LAOZHANG_API_KEY;
      apiModel = "deepseek-v3";
      console.log(`[Generate Scenes] Using Laozhang AI - FORCED Model: deepseek-v3 (env)`);
    } else if (adminApiKeys?.laozhang) {
      apiUrl = "https://api.laozhang.ai/v1/chat/completions";
      apiKey = adminApiKeys.laozhang;
      apiModel = "deepseek-v3";
      console.log(`[Generate Scenes] Using Laozhang AI - FORCED Model: deepseek-v3 (admin_settings)`);
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
    // IMPORTANTE: o provedor de geração (DeepSeek/Laozhang) não tem visão.
    // Para visão usamos o gateway multimodal do Lovable (Gemini), via LOVABLE_API_KEY.
    let referenceChars: CharacterDescription[] = [];
    if (referenceCharacters && referenceCharacters.length > 0) {
      console.log(`[Generate Scenes] Analyzing ${referenceCharacters.length} reference images...`);
      referenceChars = await analyzeReferenceImages(referenceCharacters, LOVABLE_API_KEY);
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
    const allPreSegmentedScenes = preSegmentScript(resolvedScript, wordsPerScene, startSceneNumber);
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

            for (let i = 0; i < sceneBatches.length; i++) {
              if (isControllerClosed) break;

              const batch = sceneBatches[i];
              
              console.log(`[Generate Scenes] Processing batch ${i + 1}/${sceneBatches.length} (${batch.length} scenes)`);

              // Enviar status do lote para manter cliente informado
              safeEnqueue(`data: ${JSON.stringify({ 
                type: 'batch_start', 
                batch: i + 1, 
                totalBatches: sceneBatches.length 
              })}\n\n`);

              try {
                // Timeout de 60s por lote para evitar travamento
                const batchPromise = generatePromptsForPreSegmentedScenes(
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

                const timeoutPromise = new Promise<SceneResult[]>((_, reject) => {
                  setTimeout(() => reject(new Error('Batch timeout')), 60000);
                });

                const batchScenes = await Promise.race([batchPromise, timeoutPromise]);

                // Enviar cada cena individualmente
                for (const scene of batchScenes) {
                  if (isControllerClosed) break;
                  allScenes.push(scene);
                  
                  safeEnqueue(`data: ${JSON.stringify({ 
                    type: 'scene', 
                    scene,
                    current: allScenes.length,
                    total: actualSceneCount
                  })}\n\n`);
                }

                console.log(`[Generate Scenes] Batch ${i + 1} completed: ${batchScenes.length} scenes`);

                // Pausa curta entre lotes
                if (i < sceneBatches.length - 1) {
                  await new Promise(resolve => setTimeout(resolve, 300));
                }
              } catch (batchError) {
                console.error(`[Generate Scenes] Batch ${i + 1} failed:`, batchError);
                
                // Notificar erro do lote mas continuar com fallback
                safeEnqueue(`data: ${JSON.stringify({ 
                  type: 'batch_retry', 
                  batch: i + 1,
                  message: 'Usando fallback para este lote'
                })}\n\n`);

                // Gerar cenas com prompts genéricos contextuais
                for (const preScene of batch) {
                  if (isControllerClosed) break;
                  
                  // Diversificação visual mesmo no fallback
                  const sceneIdx = preScene.number - 1;
                  const cameraAngles = ['wide shot', 'close-up', 'medium shot', 'panoramic view'];
                  const lighting = ['golden hour', 'dramatic lighting', 'soft light', 'atmospheric haze'];
                  
                  const fallbackScene: SceneResult = {
                    number: preScene.number,
                    text: preScene.text,
                    wordCount: preScene.wordCount,
                    imagePrompt: `1280x720 resolution, 16:9 aspect ratio, ${cameraAngles[sceneIdx % 4]}, ${stylePrefix || style + ' style'}, ${lighting[sceneIdx % 4]}, ${visualMap.mainTheme}, ${visualMap.keyLocations[sceneIdx % Math.max(1, visualMap.keyLocations.length)] || scriptContext.setting}, ${scriptContext.period}, documentary scene, no text, no watermarks`,
                    emotion: 'neutral',
                    retentionTrigger: 'continuity',
                    suggestMovement: preScene.number <= 5
                  };
                  allScenes.push(fallbackScene);
                  
                  safeEnqueue(`data: ${JSON.stringify({ 
                    type: 'scene', 
                    scene: fallbackScene,
                    current: allScenes.length,
                    total: actualSceneCount
                  })}\n\n`);
                }
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
            imagePrompt: `1280x720 resolution, 16:9 aspect ratio, full frame composition, ${stylePrefix || style + ' style'}, cinematic scene: ${preScene.text.substring(0, 100)}`,
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
