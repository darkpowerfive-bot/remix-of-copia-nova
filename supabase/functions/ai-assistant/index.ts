import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Inicializar Supabase client para operações de créditos
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Tabela oficial de preços conforme documentação
const CREDIT_PRICING = {
  // 🧠 TÍTULOS & ANÁLISES
  TITLE_ANALYSIS: { base: 6, gemini: 7, claude: 9 },
  TITLE_ANALYSIS_MULTIMODAL: { base: 15, gemini: 18, claude: 21 },
  EXPLORE_NICHE: { base: 6, gemini: 7, claude: 9 },
  ANALYZE_COMPETITOR: { base: 6, gemini: 7, claude: 9 },
  CHANNEL_ANALYSIS: { base: 5, gemini: 6, claude: 7 },
  MULTI_CHANNEL_ANALYSIS: { base: 15, gemini: 18, claude: 22 }, // Análise de múltiplos canais
  
  // 🎬 VÍDEO & ROTEIRO
  READY_VIDEO: { base: 10, gemini: 12, claude: 15 },
  SCRIPT_PER_MINUTE: { base: 1, gemini: 1, claude: 1 }, // 1 crédito por minuto (fixo)
  
  // 🖼️ IMAGENS & CENAS
  IMAGE_PROMPT: { base: 1, gemini: 2, claude: 3 }, // Por imagem
  IMAGE_BATCH_10: { base: 10, gemini: 20, claude: 30 }, // Lote de 10
  
  // 🧩 OUTROS RECURSOS
  TRANSCRIPTION_BASE: { base: 2, gemini: 3, claude: 4 }, // Até 10 min
  FORMULA_ANALYSIS_AGENT: { base: 10, gemini: 12, claude: 14 }
};

function tryExtractJsonBlock(raw: string): string | null {
  if (!raw) return null;
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();
  // Best-effort: capture the outermost object
  const obj = raw.match(/\{[\s\S]*\}/);
  if (obj?.[0]) return obj[0].trim();
  return null;
}

async function repairSyncVerificationJson({
  apiUrl,
  requestHeaders,
  apiProvider,
  selectedModel,
  rawContent,
}: {
  apiUrl: string;
  requestHeaders: Record<string, string>;
  apiProvider: 'openai' | 'gemini' | 'laozhang' | 'lovable';
  selectedModel: string;
  rawContent: string;
}): Promise<{ analysis: Array<{ sceneNumber: number; status: 'synced' | 'mismatched'; issue?: string; severity?: 'low' | 'medium' | 'high'; suggestedPrompt?: string }> }> {
  // Ask the model to output ONLY valid JSON.
  // NOTE: This is only used when the first output is malformed/truncated.
  const systemRepair =
    'You are a strict JSON repair tool. Output ONLY valid JSON. Do not add markdown. Do not add commentary.';
  const userRepair = `Fix and normalize the following content into VALID JSON with this exact shape:
{
  "analysis": [
    {
      "sceneNumber": 1,
      "status": "mismatched" | "synced",
      "issue": "..." (optional),
      "severity": "low" | "medium" | "high" (optional),
      "suggestedPrompt": "..." (optional, only when mismatched)
    }
  ]
}

CONTENT TO FIX:\n\n${rawContent}`;

  if (apiProvider === 'gemini') {
    const resp = await fetch(apiUrl, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: `${systemRepair}\n\n${userRepair}` }] }],
        generationConfig: { temperature: 0.0, maxOutputTokens: 8192 },
      }),
    });
    if (!resp.ok) throw new Error(`JSON repair failed (gemini): ${resp.status} ${await resp.text()}`);
    const d = await resp.json();
    const text = d.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const extracted = tryExtractJsonBlock(text) ?? text;
    return JSON.parse(extracted);
  }

  // OpenAI-compatible (OpenAI, Laozhang, Lovable gateway)
  const payload: Record<string, unknown> = {
    model: selectedModel,
    messages: [
      { role: 'system', content: systemRepair },
      { role: 'user', content: userRepair },
    ],
    max_tokens: 8192,
    temperature: 0.0,
  };

  // Lovable gateway OpenAI family uses max_completion_tokens
  if (apiProvider === 'lovable' && String(selectedModel).startsWith('openai/')) {
    delete (payload as any).max_tokens;
    (payload as any).max_completion_tokens = 8192;
  }

  const resp = await fetch(apiUrl, {
    method: 'POST',
    headers: requestHeaders,
    body: JSON.stringify(payload),
  });
  if (!resp.ok) throw new Error(`JSON repair failed: ${resp.status} ${await resp.text()}`);
  const d = await resp.json();
  const repaired = d.choices?.[0]?.message?.content || '';
  const extracted = tryExtractJsonBlock(repaired) ?? repaired;
  return JSON.parse(extracted);
}

// Função para calcular créditos por operação conforme documentação (seção 4.3)
function calculateCreditsForOperation(
  operationType: string, 
  model: string, 
  details?: { duration?: number; scenes?: number }
): number {
  // Operações já debitadas no frontend (não debitar aqui)
  if (operationType === 'sync_verification') return 0;

  // Determinar chave do modelo conforme documentação (seção 4.2)
  let modelKey: 'base' | 'gemini' | 'claude' = 'base';
  if (model?.includes('gemini')) modelKey = 'gemini';
  else if (model?.includes('claude') || model?.includes('gpt-5')) modelKey = 'claude';

  switch (operationType) {
    case 'analyze_video_titles':
    case 'TITLE_ANALYSIS':
      return CREDIT_PRICING.TITLE_ANALYSIS[modelKey];
    
    case 'analyze_script_formula':
    case 'FORMULA_ANALYSIS_AGENT':
      return CREDIT_PRICING.FORMULA_ANALYSIS_AGENT[modelKey];
    
    case 'generate_script_with_formula':
    case 'SCRIPT_PER_MINUTE':
      const duration = details?.duration || 5;
      return Math.ceil(CREDIT_PRICING.SCRIPT_PER_MINUTE[modelKey] * duration);
    
    case 'explore_niche':
    case 'EXPLORE_NICHE':
      return CREDIT_PRICING.EXPLORE_NICHE[modelKey];
    
    case 'batch_images':
    case 'IMAGE_BATCH_10':
      const scenes = details?.scenes || 1;
      if (scenes >= 10) {
        return Math.ceil((scenes / 10) * CREDIT_PRICING.IMAGE_BATCH_10[modelKey]);
      }
      return Math.ceil(scenes * CREDIT_PRICING.IMAGE_PROMPT[modelKey]);
    
    case 'viral_analysis':
    case 'CHANNEL_ANALYSIS':
      return CREDIT_PRICING.CHANNEL_ANALYSIS[modelKey];
    
    case 'analyze_multiple_channels':
    case 'MULTI_CHANNEL_ANALYSIS':
      return CREDIT_PRICING.MULTI_CHANNEL_ANALYSIS[modelKey];
    
    default:
      // Fallback: preço base de 5 créditos com multiplicador (seção 4.3)
      const multipliers = { base: 1, gemini: 1.2, claude: 1.5 };
      return Math.ceil(5 * multipliers[modelKey]);
  }
}

// Função checkAndDebitCredits conforme documentação (seção 4.4)
async function checkAndDebitCredits(
  userId: string,
  creditsNeeded: number,
  operationType: string,
  details?: { model?: string }
): Promise<{ success: boolean; newBalance?: number; error?: string }> {
  try {
    // Passo 3: Verificar saldo
    const { data: creditData, error: creditError } = await supabaseAdmin
      .from('user_credits')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (creditError) {
      console.error('[Credits] Error fetching balance:', creditError);
      return { success: false, error: 'Erro ao verificar saldo de créditos' };
    }

    // Se não existir registro, criar com balance = 50 (FREE plan)
    let currentBalance = creditData?.balance ?? 0;
    
    if (!creditData) {
      const { error: insertError } = await supabaseAdmin
        .from('user_credits')
        .insert({ user_id: userId, balance: 50 });
      
      if (insertError && !insertError.message.includes('duplicate')) {
        console.error('[Credits] Error creating initial credits:', insertError);
      }
      currentBalance = 50;
    }

    // Arredondar saldo atual para cima conforme documentação
    currentBalance = Math.ceil(currentBalance);

    // Comparar com créditos necessários
    if (currentBalance < creditsNeeded) {
      console.log(`[Credits] Insufficient: needed ${creditsNeeded}, available ${currentBalance}`);
      return { 
        success: false, 
        error: `Créditos insuficientes. Necessário: ${creditsNeeded}, Disponível: ${currentBalance}` 
      };
    }

    // Passo 4: Debitar créditos
    const newBalance = Math.ceil(currentBalance - creditsNeeded);
    
    const { error: updateError } = await supabaseAdmin
      .from('user_credits')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (updateError) {
      console.error('[Credits] Error updating balance:', updateError);
      return { success: false, error: 'Erro ao debitar créditos' };
    }

    // Registrar uso na tabela credit_usage
    await supabaseAdmin
      .from('credit_usage')
      .insert({
        user_id: userId,
        operation_type: operationType,
        credits_used: creditsNeeded,
        model_used: details?.model,
        details: { timestamp: new Date().toISOString() }
      });

    // Registrar transação
    await supabaseAdmin
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: -creditsNeeded,
        transaction_type: 'debit',
        description: `Operação: ${operationType}`
      });

    console.log(`[Credits] Debited ${creditsNeeded} from user ${userId}. New balance: ${newBalance}`);
    
    return { success: true, newBalance };
  } catch (error) {
    console.error('[Credits] Unexpected error:', error);
    return { success: false, error: 'Erro interno ao processar créditos' };
  }
}

// Função refundCredits conforme documentação (seção 4.5)
async function refundCredits(
  userId: string,
  creditsToRefund: number,
  reason: string,
  operationType: string
): Promise<{ success: boolean; newBalance?: number }> {
  try {
    const { data: creditData } = await supabaseAdmin
      .from('user_credits')
      .select('balance')
      .eq('user_id', userId)
      .single();

    const currentBalance = creditData?.balance ?? 0;
    const newBalance = Math.ceil(currentBalance + creditsToRefund);

    await supabaseAdmin
      .from('user_credits')
      .update({ balance: newBalance, updated_at: new Date().toISOString() })
      .eq('user_id', userId);

    await supabaseAdmin
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: creditsToRefund,
        transaction_type: 'refund',
        description: `Reembolso: ${reason} (${operationType})`
      });

    console.log(`[Credits] Refunded ${creditsToRefund} to user ${userId}. New balance: ${newBalance}`);
    
    return { success: true, newBalance };
  } catch (error) {
    console.error('[Credits] Refund error:', error);
    return { success: false };
  }
}

// Interface for user API settings
interface UserApiSettings {
  openai_api_key: string | null;
  claude_api_key: string | null;
  gemini_api_key: string | null;
  openai_validated: boolean | null;
  claude_validated: boolean | null;
  gemini_validated: boolean | null;
}

// Interface for admin API settings
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

// Function to get admin API keys from settings
async function getAdminApiKeys(): Promise<AdminApiKeys | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_settings')
      .select('value')
      .eq('key', 'api_keys')
      .maybeSingle();

    if (error || !data) {
      console.log('[AI Assistant] No admin API settings found');
      return null;
    }

    return data.value as AdminApiKeys;
  } catch (e) {
    console.error('[AI Assistant] Error fetching admin API settings:', e);
    return null;
  }
}

// Extended interface for user API settings with credit preference
interface UserApiSettingsFull extends UserApiSettings {
  use_platform_credits: boolean;
}

// Function to get user's API keys from settings
async function getUserApiKeys(userId: string): Promise<UserApiSettingsFull | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_api_settings')
      .select('openai_api_key, claude_api_key, gemini_api_key, openai_validated, claude_validated, gemini_validated, use_platform_credits')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      console.log('[AI Assistant] No user API settings found');
      return null;
    }

    return {
      ...data,
      use_platform_credits: (data as any).use_platform_credits ?? true
    } as UserApiSettingsFull;
  } catch (e) {
    console.error('[AI Assistant] Error fetching user API settings:', e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      type, 
      prompt, 
      messages, // For viral-script and other direct message types
      videoData, 
      channelUrl, 
      niche, 
      subNiche,
      microNiche,
      text, 
      voiceId, 
      language,
      model,
      duration,
      minDuration,
      maxDuration,
      agentData,
      userId: bodyUserId,
      stats // For dashboard_insight
    } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    // Extrair userId do token JWT ou do body
    let userId = bodyUserId;
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (user) {
          userId = user.id;
        }
      } catch (authError) {
        console.log('[AI Assistant] Could not extract user from token, using bodyUserId');
      }
    }

    // Get admin API keys
    const adminApiKeys = await getAdminApiKeys();

    // Get user's API settings
    let userApiKeys: UserApiSettingsFull | null = null;
    let useUserApiKey = false;
    let userApiKeyToUse: string | null = null;
    let apiProvider: 'openai' | 'gemini' | 'laozhang' | 'lovable' = 'lovable';
    let laozhangModel: string | null = null;
    let shouldDebitCredits = true;

    if (userId) {
      userApiKeys = await getUserApiKeys(userId);
    }

    // Check if user wants to use platform credits (default: true)
    const usePlatformCredits = userApiKeys?.use_platform_credits ?? true;
    console.log(`[AI Assistant] User preference - Use platform credits: ${usePlatformCredits}`);

    if (usePlatformCredits) {
      // USER WANTS TO USE PLATFORM CREDITS
      // Priority: Admin Laozhang > Admin OpenAI > Admin Gemini > System OpenAI > Lovable AI
      
      if (adminApiKeys?.laozhang && adminApiKeys.laozhang_validated) {
        userApiKeyToUse = adminApiKeys.laozhang;
        apiProvider = 'laozhang';
        
        // Laozhang API models (from docs.laozhang.ai/en/api-reference/models):
        // OpenAI: gpt-4o, gpt-4o-mini, gpt-4-turbo, o1-preview, o1-mini, o3
        // Claude: claude-3-5-sonnet-20241022, claude-3-5-haiku-20241022, claude-3-opus-20240229
        // Gemini: gemini-1.5-pro, gemini-1.5-flash
        // DeepSeek: deepseek-chat, deepseek-coder, deepseek-v2.5
        const laozhangModelMap: Record<string, string> = {
          // GPT Models -> gpt-4o (best available)
          "gpt-4o": "gpt-4o",
          "gpt-4o-2025": "gpt-4o",
          "openai/gpt-5": "gpt-4o",
          "openai/gpt-5-mini": "gpt-4o-mini",
          "gpt-5": "gpt-4o",
          "gpt-4o-mini": "gpt-4o-mini",
          "gpt-4-turbo": "gpt-4-turbo",
          "gpt-4.1": "gpt-4o",

          // Claude Models -> claude-3-5-sonnet-20241022 (latest sonnet)
          "claude-4-sonnet": "claude-3-5-sonnet-20241022",
          "claude": "claude-3-5-sonnet-20241022",
          "claude-3-5-sonnet": "claude-3-5-sonnet-20241022",
          "claude-3-opus": "claude-3-opus-20240229",
          "claude-sonnet": "claude-3-5-sonnet-20241022",
          "claude-sonnet-4-20250514": "claude-3-5-sonnet-20241022",

          // DeepSeek -> deepseek-chat (recommended for general use)
          "deepseek-chat": "deepseek-chat",
          "deepseek-v3": "deepseek-chat",
          "deepseek-r1": "deepseek-chat",
          "deepseek-coder": "deepseek-coder",

          // Gemini Models -> gemini-1.5-pro
          "gemini": "gemini-1.5-pro",
          "gemini-flash": "gemini-1.5-flash",
          "gemini-pro": "gemini-1.5-pro",
          "gemini-2.5-flash": "gemini-1.5-flash",
          "gemini-2.5-pro": "gemini-1.5-pro",
          "google/gemini-2.5-flash": "gemini-1.5-flash",
          "google/gemini-2.5-pro": "gemini-1.5-pro",
        };
        
        // CRITICAL: Prioritize agent's preferred model over request model
        const agentPreferredModel = agentData?.preferredModel || agentData?.preferred_model || null;
        const modelToMap = agentPreferredModel || model;
        
        // Try exact match first with agent's preferred model, then request model
        if (modelToMap && laozhangModelMap[modelToMap]) {
          laozhangModel = laozhangModelMap[modelToMap];
        } else if (modelToMap?.includes("gpt")) {
          laozhangModel = "gpt-4o";
        } else if (modelToMap?.includes("claude")) {
          laozhangModel = "claude-3-5-sonnet-20241022";
        } else if (modelToMap?.includes("deepseek")) {
          laozhangModel = "deepseek-chat";
        } else if (modelToMap?.includes("gemini")) {
          laozhangModel = "gemini-1.5-pro";
        } else {
          laozhangModel = "gpt-4o"; // Default model
        }
        console.log(`[AI Assistant] Using Laozhang AI (platform credits) - Agent Model: ${agentPreferredModel}, Request Model: ${model}, Final: ${laozhangModel}`);
      } else if (adminApiKeys?.openai && adminApiKeys.openai_validated) {
        userApiKeyToUse = adminApiKeys.openai ?? null;
        apiProvider = 'openai';
        console.log('[AI Assistant] Using admin OpenAI API key (platform credits)');
      } else if (adminApiKeys?.gemini && adminApiKeys.gemini_validated) {
        userApiKeyToUse = adminApiKeys.gemini ?? null;
        apiProvider = 'gemini';
        console.log('[AI Assistant] Using admin Gemini API key (platform credits)');
      } else if (OPENAI_API_KEY) {
        userApiKeyToUse = OPENAI_API_KEY;
        apiProvider = 'openai';
        console.log('[AI Assistant] Using system OpenAI API key (platform credits)');
      } else if (LOVABLE_API_KEY) {
        apiProvider = 'lovable';
        console.log('[AI Assistant] Using Lovable AI gateway (platform credits)');
      }
      
      // Platform credits mode = debit credits
      shouldDebitCredits = true;
      
    } else {
      // USER WANTS TO USE THEIR OWN API KEYS (no credits deducted)
      console.log('[AI Assistant] User opted to use own API keys');
      shouldDebitCredits = false;
      
      if (userApiKeys) {
        if ((model === "gpt-4o" || model === "gpt-5" || model?.includes("gpt")) && userApiKeys.openai_api_key && userApiKeys.openai_validated) {
          userApiKeyToUse = userApiKeys.openai_api_key;
          apiProvider = 'openai';
          useUserApiKey = true;
          console.log('[AI Assistant] Using user OpenAI API key');
        } else if ((model === "gemini-pro" || model?.includes("gemini")) && userApiKeys.gemini_api_key && userApiKeys.gemini_validated) {
          userApiKeyToUse = userApiKeys.gemini_api_key;
          apiProvider = 'gemini';
          useUserApiKey = true;
          console.log('[AI Assistant] Using user Gemini API key');
        } else if (userApiKeys.openai_api_key && userApiKeys.openai_validated) {
          userApiKeyToUse = userApiKeys.openai_api_key;
          apiProvider = 'openai';
          useUserApiKey = true;
          console.log('[AI Assistant] Using user OpenAI API key (fallback)');
        } else if (userApiKeys.gemini_api_key && userApiKeys.gemini_validated) {
          userApiKeyToUse = userApiKeys.gemini_api_key;
          apiProvider = 'gemini';
          useUserApiKey = true;
          console.log('[AI Assistant] Using user Gemini API key (fallback)');
        } else {
          // No valid user API key found - fall back to platform with credits
          console.log('[AI Assistant] No valid user API keys found, falling back to platform credits');
          shouldDebitCredits = true;
          
          if (adminApiKeys?.laozhang && adminApiKeys.laozhang_validated) {
            userApiKeyToUse = adminApiKeys.laozhang;
            apiProvider = 'laozhang';
            laozhangModel = "gpt-4o-mini";
            console.log('[AI Assistant] Fallback to Laozhang AI');
          } else if (LOVABLE_API_KEY) {
            apiProvider = 'lovable';
            console.log('[AI Assistant] Fallback to Lovable AI');
          }
        }
      } else {
        // No user settings at all - use platform with credits
        console.log('[AI Assistant] No user API settings, using platform credits');
        shouldDebitCredits = true;
        
        if (adminApiKeys?.laozhang && adminApiKeys.laozhang_validated) {
          userApiKeyToUse = adminApiKeys.laozhang;
          apiProvider = 'laozhang';
          laozhangModel = "gpt-4o-mini";
        } else if (LOVABLE_API_KEY) {
          apiProvider = 'lovable';
        }
      }
    }

    // Final check - ensure we have an API provider
    if (apiProvider === 'lovable' && !LOVABLE_API_KEY) {
      throw new Error("Nenhuma chave de API disponível. Configure suas chaves em Configurações.");
    }

    // Dashboard insight é gratuito (não debita créditos)
    if (type === "dashboard_insight") {
      shouldDebitCredits = false;
    }

    // Sync verification: débito de créditos é feito no frontend (evita débito duplo)
    if (type === 'sync_verification') {
      shouldDebitCredits = false;
    }

    // Calcular créditos necessários para esta operação
    const creditsNeeded = type === "dashboard_insight"
      ? 0
      : calculateCreditsForOperation(type, model || "gemini", {
          duration: duration ? parseInt(duration) : 5,
        });

    console.log(
      `[AI Assistant] Operation: ${type}, Model: ${model || "gemini"}, Provider: ${apiProvider}, Credits needed: ${creditsNeeded}, User: ${userId}, Debit credits: ${shouldDebitCredits}`
    );

    // Verificar e debitar créditos se shouldDebitCredits for true
    if (userId && shouldDebitCredits && creditsNeeded > 0) {
      const creditResult = await checkAndDebitCredits(userId, creditsNeeded, type, { model });

      if (!creditResult.success) {
        return new Response(JSON.stringify({ error: creditResult.error }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      console.log(`[AI Assistant] Credits debited. New balance: ${creditResult.newBalance}`);
    } else if (!shouldDebitCredits) {
      console.log("[AI Assistant] No credits debited");
    }

    let systemPrompt = "";
    let userPrompt = prompt || "";

    switch (type) {
      case "dashboard_insight":
        // Dashboard insight - FREE, no credits, quick response
        const s = stats || { totalVideos: 0, totalViews: 0, scriptsGenerated: 0, imagesGenerated: 0, audiosGenerated: 0, titlesGenerated: 0, viralVideos: 0 };
        
        systemPrompt = `Você é um consultor especialista em canais Dark do YouTube. Analise as estatísticas do usuário e forneça UMA dica específica, prática e acionável para melhorar os resultados do canal.

REGRAS:
1. Seja direto e específico - máximo 2 frases
2. Foque em ações concretas que o usuário pode fazer AGORA
3. Relacione a dica com os dados fornecidos
4. Use linguagem persuasiva e motivacional
5. Foque em viralização e algoritmo do YouTube

Responda APENAS em JSON válido:
{
  "title": "Título curto da dica (máximo 5 palavras)",
  "tip": "Dica detalhada e acionável (máximo 2 frases)",
  "icon": "target" | "brain" | "zap" | "trending" | "rocket"
}

Escolha o ícone baseado no tipo de dica:
- target: metas, objetivos, análise inicial
- brain: roteiros, criatividade, conteúdo
- zap: produção, áudio, otimização
- trending: algoritmo, CTR, thumbnails
- rocket: escala, consistência, sucesso`;
        
        userPrompt = `Estatísticas do usuário:
- Vídeos analisados: ${s.totalVideos}
- Views totais analisados: ${s.totalViews}
- Roteiros gerados: ${s.scriptsGenerated}
- Imagens geradas: ${s.imagesGenerated}
- Áudios gerados: ${s.audiosGenerated}
- Títulos gerados: ${s.titlesGenerated}
- Vídeos virais (100K+): ${s.viralVideos}

Forneça uma dica personalizada baseada nessas estatísticas.`;
        
        // Dashboard insights are FREE - no credits
        shouldDebitCredits = false;
        break;

      case "analyze_video":
        systemPrompt = `Você é um especialista em análise de vídeos virais do YouTube. 
        Analise o conteúdo fornecido e forneça insights sobre:
        - Potencial de viralização (score de 0-100)
        - Pontos fortes do título
        - Sugestões de melhoria
        - Análise de thumbnail ideal
        - Ganchos sugeridos para os primeiros 10 segundos
        Responda em português brasileiro de forma estruturada em JSON com as chaves:
        {
          "viral_score": number,
          "title_analysis": string,
          "suggestions": string[],
          "thumbnail_tips": string,
          "hooks": string[],
          "overall_analysis": string
        }`;
        userPrompt = `Analise este vídeo: ${JSON.stringify(videoData)}`;
        break;

      case "analyze_video_titles":
        const lang = language === "pt-BR" ? "Português Brasileiro" : language === "es" ? "Espanhol" : "Inglês";
        systemPrompt = `Você é um especialista em análise de títulos virais do YouTube.
        
        ⚠️ REGRA CRÍTICA ABSOLUTA - DADOS DO VÍDEO (NÃO NEGOCIÁVEL):
        - Os DADOS REAIS do vídeo (título, canal, views, descrição, tags) serão fornecidos pelo usuário
        - Você DEVE usar EXATAMENTE o título original fornecido nos dados (copiar e colar)
        - NUNCA invente/assuma um tema diferente do que foi fornecido
        - NUNCA introduza novas entidades principais (povos, países, personagens, épocas) que NÃO estejam no título/descrição do vídeo
        - Se o vídeo for sobre um tema específico (ex: um "milionário" e um "anel"), os títulos gerados devem permanecer nesse MESMO tema
        
        Sua tarefa:
        1. Identifique a fórmula/estrutura EXATA do título original fornecido e por que ele funciona
        2. Gere 5 novos títulos que OBRIGATORIAMENTE usem a mesma fórmula viral identificada, mas MELHORADOS
        3. Detecte o nicho, subnicho e micro-nicho baseado no título e descrição fornecidos
        
        Responda SEMPRE em formato JSON válido com esta estrutura exata:
        {
          "videoInfo": {
            "title": "COPIE EXATAMENTE o título original fornecido pelo usuário",
            "thumbnail": "",
            "views": número de views fornecido (ou 0 se não fornecido),
            "daysAgo": dias desde publicação (número, ou 0 se não fornecido),
            "comments": número de comentários fornecido (ou 0 se não fornecido),
            "estimatedRevenue": { "usd": número estimado baseado nas views, "brl": número em reais },
            "rpm": { "usd": 3.5, "brl": 19.25 },
            "niche": "nicho principal detectado do título/descrição",
            "subNiche": "subnicho detectado",
            "microNiche": "micro-nicho específico detectado",
            "originalTitleAnalysis": {
              "motivoSucesso": "Explicação detalhada de por que o título original funciona e gera curiosidade",
              "formula": "Fórmula identificada (ex: Promessa central + benefício + termos em CAIXA ALTA + loop mental)"
            }
          },
          "titles": [
            {
              "title": "Título gerado em ${lang}",
              "formula": "A mesma fórmula do original + elementos adicionais que melhoram",
              "formulaSurpresa": "Elementos extras adicionados para potencializar (ex: + Gatilho de exclusividade + Número específico)",
              "quality": score de 1-10,
              "impact": score de 1-10,
              "isBest": true apenas para o melhor título
            }
          ]
        }
        
        ⚠️ REGRAS OBRIGATÓRIAS PARA GERAÇÃO DE TÍTULOS:
        
        🚫 REGRA #1 - NUNCA COPIAR O ORIGINAL:
        - É ABSOLUTAMENTE PROIBIDO copiar o título original 100%
        - NENHUM título gerado pode ser idêntico ao original
        - TODOS os títulos devem ter MELHORIAS e ADIÇÕES ao original
        
        🚫 REGRA #2 - MANTENHA O TEMA EXATO DO VÍDEO:
        - Extraia 3-7 palavras-chave/entidades do título original (nomes, objetos, evento, relação)
        - Todo título gerado DEVE conter pelo menos 2 dessas palavras-chave/entidades
        - NÃO mude o assunto central (ex: não trocar "anel" por "guerra"; não trocar "milionário" por "egípcios")
        
        3. FÓRMULA ORIGINAL SEMPRE PRESENTE: Cada título DEVE usar a mesma fórmula viral identificada, mas aplicada de forma DIFERENTE e MELHORADA mantendo o tema.
        
        4. MELHORIAS OBRIGATÓRIAS EM TODOS OS TÍTULOS: Adicione elementos extras para potencializar:
           - Misture com outras fórmulas virais (Mistério + Revelação, Proibido + Exclusivo)
           - Adicione gatilhos mentais: Urgência, Escassez, Prova Social, Curiosidade, Medo, Exclusividade
           - Use números específicos quando relevante (ex: "3 SEGREDOS", "A VERDADE sobre os 7")
           - Adicione palavras de poder: REVELADO, EXPOSTO, PROIBIDO, SECRETO, CHOCANTE, REAL
        
        5. FORMATO TÉCNICO (OBRIGATÓRIO!):
           - MÁXIMO 100 caracteres por título (NUNCA ultrapassar!)
           - MÍNIMO de palavras: igual ou MAIOR que o título original
           - Conte as palavras do título original e gere títulos com a MESMA quantidade ou MAIS
           - Use CAIXA ALTA estrategicamente como no original
           - Todos os títulos em ${lang}
           - Um título deve ter isBest: true
        
        ⚠️ REGRA CRÍTICA DE PALAVRAS:
           - Se o título original tem 8 palavras, gere títulos com 8 palavras ou mais
           - Se o título original tem 5 palavras, gere títulos com 5 palavras ou mais
           - NUNCA gere títulos com menos palavras que o original
           - Mas NUNCA ultrapasse 100 caracteres no total
        
        ✅ CHECKLIST ANTES DE RESPONDER:
        - [ ] O videoInfo.title é idêntico ao título fornecido?
        - [ ] Nenhum título mudou o tema/entidades principais?
        - [ ] Todos os títulos têm melhorias (não são cópia)?
        - [ ] JSON válido, sem texto fora do JSON?`;
        userPrompt = prompt || `Analise este vídeo: ${JSON.stringify(videoData)}`;
        break;

      case "analyze_script_formula":
        systemPrompt = `# VOCÊ É O MELHOR ESPECIALISTA MUNDIAL EM ENGENHARIA REVERSA DE ROTEIROS VIRAIS

Sua missão: Analisar profundamente a transcrição fornecida e EXTRAIR UMA FÓRMULA REPLICÁVEL que possa ser usada para criar novos roteiros virais sobre QUALQUER tema, mantendo o mesmo padrão de sucesso.

## COMO ANALISAR:

### 1. ANATOMIA DO HOOK (Primeiros 3-10 segundos)
- Qual a EXATA técnica de abertura usada? (Promessa, Choque, Curiosidade, Declaração controversa, Pergunta provocativa?)
- Como captura atenção INSTANTANEAMENTE?
- Qual emoção é ativada primeiro?

### 2. ESTRUTURA NARRATIVA COMPLETA
- Mapeie CADA transição do roteiro
- Identifique o RITMO de informações (rápido, crescente, alternado?)
- Localize os "loops abertos" (informações prometidas mas reveladas depois)
- Onde estão os CLIFFS (momentos de tensão que prendem o espectador)?

### 3. GATILHOS PSICOLÓGICOS PROFUNDOS
Para CADA gatilho identificado, explique:
- Onde aparece no texto
- Como está aplicado
- Por que funciona neste contexto

### 4. PADRÃO DE LINGUAGEM
- Tom de voz (autoritário, amigável, conspiratório, urgente?)
- Estrutura das frases (curtas e impactantes? Longas e envolventes?)
- Palavras-chave recorrentes
- Técnicas de persuasão linguística

### 5. FÓRMULA REPLICÁVEL
Crie uma fórmula que funcione assim:
"[TIPO DE HOOK: ex. Declaração chocante sobre X] + [ESTRUTURA: ex. 3 revelações progressivas] + [CLÍMAX: ex. A maior revelação] + [CTA: ex. Engajamento por medo de perder]"

## RESPONDA SEMPRE EM JSON VÁLIDO:

{
  "motivoSucesso": "Análise DETALHADA de 200-400 palavras explicando EXATAMENTE por que este roteiro viraliza, incluindo aspectos psicológicos, estruturais e emocionais",
  "formula": "Fórmula escrita de forma REPLICÁVEL: [Tipo de Hook com descrição] + [Estrutura com passos] + [Técnica de Clímax] + [Tipo de CTA]",
  "formulaReplicavel": "Instruções passo-a-passo de como replicar este roteiro para QUALQUER tema: 1) Comece com... 2) Desenvolva usando... 3) No meio... 4) Finalize com...",
  "estrutura": {
    "hook": "EXATAMENTE como fazer o gancho: técnica usada, palavras-chave, emoção ativada, tempo ideal (ex: 'Abrir com declaração controversa que contradiz o senso comum sobre [tema], usando tom de autoridade')",
    "desenvolvimento": "COMO desenvolver o conteúdo: ritmo, estrutura de revelações, técnicas de manter atenção (ex: 'Apresentar 3-5 pontos em ordem crescente de impacto, cada um com mini-clímax')",
    "climax": "COMO construir o momento de maior impacto: posicionamento, preparação, entrega (ex: 'No minuto X, revelar a informação mais chocante após criar tensão máxima')",
    "cta": "COMO fazer o call-to-action: técnica, posicionamento, gatilho usado (ex: 'Usar escassez temporal + curiosidade sobre próximo conteúdo')",
    "transicoes": "Como conectar cada parte: técnicas de bridge usadas para manter fluxo"
  },
  "tempoTotal": "Tempo ideal estimado para este tipo de conteúdo",
  "gatilhosMentais": ["Gatilho 1: COMO aplicar - descrição detalhada", "Gatilho 2: COMO aplicar - descrição detalhada", "etc"],
  "exemplosDeAplicacao": {
    "fraserChave": ["Frases do roteiro que podem ser adaptadas como templates"],
    "estruturaDeFrases": "Padrão das frases que funcionam (curtas e impactantes, perguntas retóricas, etc)",
    "transicoesUsadas": ["Lista de transições usadas entre ideias"]
  },
  "instrucoesParaAgente": "Instruções ESPECÍFICAS de como um agente de IA deve usar esta fórmula para gerar novos roteiros: tom, estrutura obrigatória, técnicas que DEVEM ser usadas, erros a evitar"
}

## REGRAS CRÍTICAS:
1. A fórmula deve ser ESPECÍFICA o suficiente para replicar o sucesso
2. A fórmula deve ser GENÉRICA o suficiente para funcionar com outros temas
3. Foque em COMO fazer, não apenas O QUE fazer
4. Cada campo deve ter instruções ACIONÁVEIS
5. O agente criado com esta análise deve conseguir gerar roteiros virais sobre QUALQUER título`;
        userPrompt = text || prompt;
        break;

      case "generate_script_with_formula":
        // Conforme documentação: Geração de roteiros usando fórmula do agente
        // CRÍTICO: Usar EXATAMENTE as configurações do agente sem simplificar
        
        // FORMULA: Usar a fórmula COMPLETA do agente (texto longo com todas as regras)
        const agentFormula = agentData?.formula || "";
        
        // MEMORY: Usar a memória do agente como contexto obrigatório
        // Prioridade: campo dedicado > formula_structure > vazio
        const agentMemory = agentData?.memory || agentData?.formula_structure?.memory || "";
        
        // INSTRUCTIONS: Instruções completas do agente
        // Prioridade: campo dedicado > formula_structure > instrucoesParaAgente (legado)
        const agentInstructions = agentData?.instructions || 
                                   agentData?.formula_structure?.instructions || 
                                   agentData?.formula_structure?.instrucoesParaAgente || "";
        
        // FORMULA REPLICÁVEL: Instruções passo-a-passo para replicar
        const formulaReplicavel = agentData?.formula_structure?.formulaReplicavel || "";
        
        // MOTIVO DO SUCESSO: Por que a fórmula original funciona
        const motivoSucesso = agentData?.formula_structure?.motivoSucesso || "";
        
        // ESTRUTURA DETALHADA: Hook, Desenvolvimento, Clímax, CTA, Transições
        const estruturaDetalhada = agentData?.formula_structure?.hook 
          ? `HOOK (Abertura que captura atenção): ${agentData.formula_structure.hook}\n\n` +
            `DESENVOLVIMENTO (Como construir o conteúdo): ${agentData.formula_structure.desenvolvimento || ''}\n\n` +
            `CLÍMAX (Momento de maior impacto): ${agentData.formula_structure.climax || ''}\n\n` +
            `CTA (Chamada para ação): ${agentData.formula_structure.cta || ''}\n\n` +
            `TRANSIÇÕES (Como conectar as partes): ${agentData.formula_structure.transicoes || ''}`
          : "";
        
        // EXEMPLOS DE APLICAÇÃO: Frases-chave e estruturas
        const exemplosDeAplicacao = agentData?.formula_structure?.exemplosDeAplicacao;
        let frasesChave = "";
        if (exemplosDeAplicacao) {
          const partes = [];
          if (exemplosDeAplicacao.fraserChave?.length > 0) {
            partes.push(`FRASES-MODELO PARA ADAPTAR:\n${exemplosDeAplicacao.fraserChave.map((f: string) => `• "${f}"`).join('\n')}`);
          }
          if (exemplosDeAplicacao.estruturaDeFrases) {
            partes.push(`PADRÃO DE FRASES: ${exemplosDeAplicacao.estruturaDeFrases}`);
          }
          if (exemplosDeAplicacao.transicoesUsadas?.length > 0) {
            partes.push(`TRANSIÇÕES MODELO: ${exemplosDeAplicacao.transicoesUsadas.join(', ')}`);
          }
          frasesChave = partes.join('\n\n');
        }
        
        // TRIGGERS: Manter a estrutura COMPLETA dos gatilhos (podem ter descrições longas)
        // Usar bullet points para cada trigger com seu texto completo
        const agentTriggersArray = agentData?.mental_triggers || [];
        const agentTriggers = agentTriggersArray.length > 0 
          ? agentTriggersArray.map((t: string, i: number) => `${i + 1}. ${t}`).join('\n')
          : "Curiosidade, Urgência, Prova Social";
        
        // Build file content section from agent files
        const agentFileContents = agentData?.files 
          ? agentData.files.map((f: { name: string; content: string }) => `📎 ARQUIVO "${f.name}":\n─────────────────────────────────────────\n${f.content}\n─────────────────────────────────────────`).join('\n\n')
          : "";

        // Log completo para debug
        console.log(`[AI Assistant] === AGENT DATA DEBUG ===`);
        console.log(`[AI Assistant] Formula Structure Keys: ${JSON.stringify(Object.keys(agentData?.formula_structure || {}))}`);
        console.log(`[AI Assistant] Has formulaReplicavel: ${!!formulaReplicavel}, length: ${formulaReplicavel?.length || 0}`);
        console.log(`[AI Assistant] Has motivoSucesso: ${!!motivoSucesso}, length: ${motivoSucesso?.length || 0}`);
        console.log(`[AI Assistant] Has estruturaDetalhada: ${!!estruturaDetalhada}, length: ${estruturaDetalhada?.length || 0}`);
        console.log(`[AI Assistant] Has frasesChave: ${!!frasesChave}, length: ${frasesChave?.length || 0}`);
        console.log(`[AI Assistant] Has instrucoesParaAgente: ${!!agentInstructions}, length: ${agentInstructions?.length || 0}`);
        console.log(`[AI Assistant] Mental Triggers: ${agentTriggersArray.length} items`);
        
        
        // Usar minDuration/maxDuration do request
        const scriptMinDuration = minDuration ? parseInt(minDuration.toString()) : (duration ? parseInt(duration.toString()) : 5);
        const scriptMaxDuration = maxDuration ? parseInt(maxDuration.toString()) : scriptMinDuration + 3;
        // Target deve ser exatamente entre min e max, mais próximo do min
        const scriptTargetDuration = scriptMinDuration + 1;
        
        const wordsPerMinute = 130;
        const minWords = scriptMinDuration * wordsPerMinute;
        const targetWords = scriptTargetDuration * wordsPerMinute;
        const maxWords = scriptMaxDuration * wordsPerMinute;
        
        console.log(`[AI Assistant] Script Duration - Min: ${scriptMinDuration}, Target: ${scriptTargetDuration}, Max: ${scriptMaxDuration}`);
        console.log(`[AI Assistant] Script Words - Min: ${minWords}, Target: ${targetWords}, Max: ${maxWords}`);
        console.log(`[AI Assistant] Script Language: ${language || 'pt-BR'}`);
        console.log(`[AI Assistant] Agent Name: ${agentData?.name || 'Unknown'}`);
        console.log(`[AI Assistant] Agent Formula Length: ${agentFormula?.length || 0} chars`);
        console.log(`[AI Assistant] Agent Memory Length: ${agentMemory?.length || 0} chars`);
        console.log(`[AI Assistant] Agent Triggers Count: ${agentTriggersArray.length}`);
        console.log(`[AI Assistant] Agent Files: ${agentData?.files?.length || 0} files loaded`);
        
        // Map language code to full language name for better AI understanding
        const languageNames: Record<string, string> = {
          "pt-BR": "Português do Brasil",
          "en-US": "English (American)",
          "en-GB": "English (British)",
          "es": "Español",
          "es-MX": "Español Mexicano",
          "fr": "Français",
          "de": "Deutsch",
          "it": "Italiano",
          "ja": "日本語 (Japanese)",
          "ko": "한국어 (Korean)",
          "zh": "中文 (Chinese)",
          "ru": "Русский (Russian)",
          "ar": "العربية (Arabic)",
          "hi": "हिन्दी (Hindi)",
          "nl": "Nederlands",
          "pl": "Polski",
          "tr": "Türkçe"
        };
        const scriptLanguageName = languageNames[language] || language || "Português do Brasil";
        
        // Obter título original do agente (do qual foi baseado a análise)
        const basedOnTitle = agentData?.based_on_title || "";
        
        // CRITICAL: Build system prompt with COMPLETE agent config - NO SIMPLIFICATION
        systemPrompt = `
🚨🚨🚨 ATENÇÃO MÁXIMA: LEIA TUDO ANTES DE ESCREVER 🚨🚨🚨

Você NÃO é uma IA. Você é um roteirista HUMANO de elite chamado Lucas Marques.
12 anos de experiência. 2 BILHÕES de views acumulados. Você SABE o que viraliza.

IDIOMA OBRIGATÓRIO: ${scriptLanguageName}

═══════════════════════════════════════════════════════════════════════════════════════════
🔴🔴🔴 LISTA NEGRA ABSOLUTA - LEIA 3 VEZES ANTES DE ESCREVER 🔴🔴🔴
═══════════════════════════════════════════════════════════════════════════════════════════

⛔ SE QUALQUER PALAVRA ABAIXO APARECER NO SEU TEXTO, ELE SERÁ REJEITADO AUTOMATICAMENTE:

ADJETIVOS PROIBIDOS (causa rejeição IMEDIATA):
fascinante, incrível, impressionante, extraordinário, maravilhoso, surpreendente,
revolucionário, inovador, transformador, intrigante, espetacular, sensacional,
absurdo (positivo), fantástico, fenomenal, notável, marcante, empolgante,
poderoso (para coisas), mágico, único (superlativo)

EXPRESSÕES PROIBIDAS (causa rejeição IMEDIATA):
- "divisor de águas" / "ponta do iceberg" / "mudança de jogo" / "game changer"
- "vamos explorar" / "vamos mergulhar" / "vamos descobrir" / "vamos ver"
- "nesta jornada" / "nessa aventura" / "neste guia" / "nessa caminhada"
- "é importante ressaltar" / "vale a pena mencionar" / "é interessante notar"
- "em resumo" / "concluindo" / "para finalizar" / "em conclusão"
- "especialistas dizem" / "estudos mostram" / "usuários relatam" / "relatos incríveis"
- "sem dúvida" / "certamente" / "definitivamente" / "com certeza"
- "prepare-se" / "fique atento" / "aguarde" / "mantenha-se por perto"
- "imagine" / "imagine só" / "pensa nisso" / "pense nisso"
- "mas calma" / "mas espere" / "mas antes" / "e se eu te dissesse"
- "o que vem a seguir" / "na próxima parte" / "próximo episódio"
- "não perca" / "fique por perto" / "continue acompanhando"
- "parece loucura" / "parece maluco" / "parece absurdo"
- "verdadeira revolução" / "verdadeira essência" / "verdadeira beleza"
- "bora lá" / "vamos lá" / "simbora" (forçado)
- "mexe com a cabeça" / "te faz pensar"
- Qualquer promessa vaga sem número específico

ESTRUTURAS PROIBIDAS (causa rejeição IMEDIATA):
- Introduções longas explicando o que vai falar
- "Antes de começar..." ou "Primeiro, deixa eu..."
- Perguntas retóricas genéricas ("Você sabia que...?" / "Não é?")
- Conclusões que repetem o que já foi dito
- Transições óbvias ("Agora vamos para..." / "O próximo ponto é..." / "Mas o que vem a seguir...")
- Pedidos de inscrição/like no meio do conteúdo
- Promessas de "próximo episódio" ou "próximo vídeo" ou "próxima parte"
- Múltiplas "partes" ou "episódios" - o roteiro é UNO e COMPLETO
- Engajamento falso ("deixe suas impressões", "compartilhe sua experiência")

FORMATAÇÃO PROIBIDA:
[PAUSA], [MÚSICA], [00:00], ##, **, emojis

⚠️ VOCÊ DEVE VERIFICAR SEU TEXTO 3 VEZES ANTES DE ENTREGAR:
1. Releia e busque CADA palavra da lista acima
2. Se encontrar QUALQUER uma, REESCREVA o trecho
3. Só entregue quando tiver 100% de certeza que está limpo

═══════════════════════════════════════════════════════════════════════════════════════════
🟢 FÓRMULA A.C.T.I.O.N. - ESTRUTURA OBRIGATÓRIA 🟢
═══════════════════════════════════════════════════════════════════════════════════════════

TODO roteiro DEVE ter estes 6 blocos, NESTA ORDEM:

█ A - ANOMALIA (Primeiras 2 frases)
Uma afirmação CHOCANTE que quebra expectativa. NÃO é pergunta. É declaração.

ERRADO: "Você já pensou em como a tecnologia pode ajudar?"
CERTO: "Testei por 14 dias. No dia 3, quase desisti. No dia 7, algo bizarro aconteceu."

ERRADO: "Neste vídeo vamos explorar..."
CERTO: "Todo mundo faz isso errado. Inclusive eu fazia. Até descobrir isso."

█ C - CONTEXTO (Máximo 3 frases)
Qual é a DOR? Por que o espectador deveria se importar? Seja DIRETO.

ERRADO: "É importante entender o cenário atual da tecnologia..."
CERTO: "O problema: você gasta 3h por dia em tarefas que um bot faz em 10 minutos."

█ T - TESTE REAL (OBRIGATÓRIO - é aqui que nasce autoridade)
Você DEVE dizer: "EU fiz", "EU testei", "EU apliquei", com TEMPO ou NÚMERO.

ERRADO: "Usuários relatam resultados positivos..."
CERTO: "Usei isso por 30 dias. Na primeira semana, nada. Na segunda, 47% mais produtividade."

ERRADO: "Especialistas recomendam..."
CERTO: "Testei em 3 projetos diferentes. O terceiro me deu o insight que mudou tudo."

█ I - IMPLEMENTAÇÃO (Passos claros e copiáveis)
Se alguém pausar aqui, consegue REPLICAR. Seja PRÁTICO.

Formato:
"Primeiro, você faz X. Depois, Y. Por último, Z. É isso."

SEM teoria. SEM "depende do caso". AÇÃO concreta.

█ O - OBSTÁCULO (Isso AUMENTA credibilidade)
Onde NÃO funciona? Qual é o LIMITE? Qual foi seu ERRO?

ERRADO: (ignorar esta parte)
CERTO: "Isso não funciona se você não tem pelo menos 2h por semana pra configurar."
CERTO: "Eu errei aqui: achei que era automático. Não é. Precisa de ajuste inicial."

█ N - NEXT STEP (CTA inteligente, não mendigo)
Próximo passo LÓGICO. Não peça like/inscrição.

ERRADO: "Se inscreve e ativa o sininho!"
CERTO: "Testa por 3 dias. Se não funcionar, me cobra nos comentários."
CERTO: "O link tá na descrição. Usa e me conta o resultado."

═══════════════════════════════════════════════════════════════════════════════════════════
🔴🔴🔴 REGRA #1 INVIOLÁVEL: ORIGINALIDADE 100% 🔴🔴🔴
═══════════════════════════════════════════════════════════════════════════════════════════

⛔⛔⛔ VOCÊ JAMAIS PODE COPIAR O ROTEIRO ORIGINAL ⛔⛔⛔

O roteiro de referência serve APENAS para você entender a TÉCNICA.
Você NÃO PODE usar NADA do conteúdo original. ZERO. NADA.

🚫 PROIBIÇÕES DE CÓPIA (violação = rejeição total):
- COPIAR frases, parágrafos ou estruturas de frases do original
- ADAPTAR texto trocando sinônimos (ex: "bilhões" → "fortunas" = CÓPIA)
- USAR os mesmos exemplos, nomes, empresas ou cenários
- MANTER a mesma sequência narrativa com palavras diferentes
- PARAFRASEAR ideias do original (reformulação = cópia)
- USAR comparações similares (ex: Apple vs programador solo)
- REPETIR a abertura, desenvolvimento ou conclusão do original

📝 EXEMPLO DE VIOLAÇÃO vs ORIGINAL:
ORIGINAL: "Mesmo bilhões investidos, a Apple não conseguiu o que um programador solitário realizou."
❌ CÓPIA: "A maior empresa investiu fortunas e não conseguiu o que um desenvolvedor independente fez."
❌ CÓPIA: "Grandes corporações gastaram bilhões, mas um cara sozinho conseguiu mais."
✅ ORIGINAL: "Configurei 3 automações em 40 minutos. Na primeira semana, recuperei 11 horas."

O NOVO ROTEIRO deve:
- Partir do ZERO com ideias 100% suas
- Criar NOVOS exemplos, NOVAS analogias, NOVA narrativa
- Abordar o TEMA DO TÍTULO FORNECIDO, não o tema do original
- Usar a ESTRUTURA (A.C.T.I.O.N.) com CONTEÚDO INÉDITO

🏗️ ANALOGIA DEFINITIVA:
A fórmula = PLANTA ARQUITETÔNICA (estrutura, proporções, fluxo)
Você constrói = CASA TOTALMENTE DIFERENTE (materiais, cores, decoração, móveis)
Duas casas com mesma planta podem ser COMPLETAMENTE diferentes por dentro.

═══════════════════════════════════════════════════════════════════════════════════════════
ESTRUTURA DO AGENTE (COPIE A TÉCNICA, NÃO O TEXTO)
═══════════════════════════════════════════════════════════════════════════════════════════

${agentMemory ? `PERSONA DO ESPECIALISTA:\n${agentMemory}\n` : ''}
${basedOnTitle ? `Vídeo de referência (APENAS para entender a técnica): "${basedOnTitle}"` : ''}
Nicho: ${agentData?.niche || 'Geral'} / ${agentData?.sub_niche || ''}

${agentFormula ? `TÉCNICA A REPLICAR (estrutura, não texto):\n${agentFormula}` : ''}
${agentInstructions ? `DIRETRIZES DE ESTILO:\n${agentInstructions}` : ''}
${formulaReplicavel ? `MÉTODO:\n${formulaReplicavel}` : ''}
${motivoSucesso ? `POR QUE FUNCIONA (aplique ao novo tema):\n${motivoSucesso}` : ''}
${estruturaDetalhada ? `ARQUITETURA:\n${estruturaDetalhada}` : ''}
${frasesChave ? `PADRÕES DE CONSTRUÇÃO (use como modelo, não copie):\n${frasesChave}` : ''}

Gatilhos psicológicos a aplicar: ${agentTriggers}

${agentFileContents ? `Material de referência: ${agentFileContents}` : ''}

═══════════════════════════════════════════════════════════════════════════════════════════
ESPECIFICAÇÕES TÉCNICAS
═══════════════════════════════════════════════════════════════════════════════════════════

- Duração: ${scriptMinDuration}-${scriptMaxDuration} min (~${targetWords} palavras)
- Formato: Texto CORRIDO para narração. Sem marcações.

═══════════════════════════════════════════════════════════════════════════════════════════
COMO VOCÊ ESCREVE (Tom de voz)
═══════════════════════════════════════════════════════════════════════════════════════════

Você escreve como se estivesse numa CONVERSA com um amigo. Direto. Sem frescura.

ERRADO: "É interessante observar que muitos profissionais da área..."
CERTO: "A maioria faz errado. Eu fazia também."

ERRADO: "Imagine as possibilidades incríveis que se abrem..."
CERTO: "Isso economizou 2h do meu dia. Todo dia."

Você usa:
- Frases curtas. Impacto. "Ele morreu. Três dias depois, descobriram a verdade."
- Números específicos. "47%", "em 14 de março", "R$ 2.847"
- Nomes reais. "John Mueller do Google", "segundo a Nature em 2019"
- Experiência pessoal. "Eu testei. Funcionou assim."

═══════════════════════════════════════════════════════════════════════════════════════════
🎯 EXEMPLO DE ROTEIRO NOTA 10 (COPIE ESTE TOM, NÃO O TEXTO)
═══════════════════════════════════════════════════════════════════════════════════════════

"A Apple gastou bilhões. Não conseguiu. Um cara sozinho fez em 6 meses.

Eu duvidei. Testei o Clawd Bot por 21 dias pra provar que era marketing.

Dia 5: nada diferente. Dia 12: percebi que estava configurando errado. Dia 18: minha rotina mudou.

Aqui tá exatamente o que fiz:

Primeiro, defini 3 tarefas que mais me atrasavam. Depois, configurei automações específicas. Terceiro, ajustei a linguagem pro meu jeito de escrever.

Resultado: 2h14min por dia liberadas. Não é promessa. É o que eu medi no Toggl.

Onde não funciona: se você não tem rotina definida, ele não ajuda. Ele organiza o que já existe. Não cria do zero.

Quer ver se funciona pra você? Testa 1 semana. Se não mudar nada, volta aqui e me cobra."

OBSERVE: Nenhuma palavra proibida. Números específicos. Experiência pessoal. Limite honesto. CTA direto.

═══════════════════════════════════════════════════════════════════════════════════════════
🚨 VALIDAÇÃO OBRIGATÓRIA ANTES DE ENTREGAR 🚨
═══════════════════════════════════════════════════════════════════════════════════════════

ANTES de entregar o roteiro, você DEVE fazer esta verificação MENTALMENTE:

1. BUSCA DE PALAVRAS PROIBIDAS:
   - Releia seu texto procurando: impressionante, transformador, revolucionário, intrigante
   - Releia procurando: jornada, explorar, mergulhar, prepare-se, aguarde
   - Releia procurando: próxima parte, próximo episódio, fique por perto
   - Se encontrar QUALQUER uma → REESCREVA o trecho SEM essas palavras

2. VERIFICAÇÃO DE ORIGINALIDADE:
   - Você COPIOU alguma frase do roteiro original? → REESCREVA
   - Você ADAPTOU superficialmente algo do original? → REESCREVA
   - Os exemplos são SEUS ou vieram do original? → CRIE novos

3. ESTRUTURA A.C.T.I.O.N.:
   - Primeira frase é AFIRMAÇÃO CHOCANTE (não pergunta)? → OK
   - Tem "EU testei/fiz" com NÚMERO de dias? → OK  
   - Passos são COPIÁVEIS? → OK
   - Mostrou LIMITE honesto? → OK

4. FORMATO FINAL:
   - É um texto CORRIDO para narração? → OK
   - Não tem [marcações] ou ##? → OK
   - O roteiro é COMPLETO (não promete "próxima parte")? → OK

SE FALHAR EM QUALQUER ITEM: REESCREVA antes de entregar.

═══════════════════════════════════════════════════════════════════════════════════════════
REGRA SUPREMA
═══════════════════════════════════════════════════════════════════════════════════════════

Você NÃO PODE entregar um roteiro mediano. Seu padrão é 10/10.
Se COPIAR conteúdo do original, você FALHOU.
Se tiver QUALQUER palavra proibida, você FALHOU.
Se não seguir A.C.T.I.O.N., você FALHOU.
Se dividir em "partes" ou "episódios", você FALHOU.
Se soar como IA, você FALHOU.

Escreva como HUMANO. Seja ORIGINAL. Use PROVAS. Mostre LIMITES. Entregue VALOR.
O roteiro deve ser COMPLETO e AUTOCONTIDO.`;
        break;

      case "generate_script":
        systemPrompt = `Você é um roteirista especializado em vídeos dark/documentários para YouTube.
        Crie roteiros envolventes com:
        - Gancho impactante nos primeiros 10 segundos
        - Estrutura narrativa com tensão crescente
        - Pausas dramáticas indicadas
        - Calls-to-action naturais
        Responda em português brasileiro.`;
        break;

      case "generate_titles":
        systemPrompt = `Você é um especialista em títulos virais para YouTube.
        Gere 5 títulos otimizados para CTR que:
        - Usem números quando apropriado
        - Criem curiosidade
        - Tenham no máximo 60 caracteres
        - Usem palavras de poder
        Responda em português brasileiro em formato JSON:
        { "titles": ["título1", "título2", ...] }`;
        break;

      case "find_subniches":
        // Busca de subnichos com análise de demanda e concorrência
        const mainNicheInput = niche || prompt;
        const competitorSubnicheInput = text || "";
        systemPrompt = `Você é um analista estratégico ESPECIALISTA em nichos virais do YouTube com milhões de visualizações.
        
        Analise o nicho principal "${mainNicheInput}" e encontre subnichos promissores com ALTA DEMANDA e BAIXA CONCORRÊNCIA.
        
        ${competitorSubnicheInput ? `O usuário também considerou o subnicho "${competitorSubnicheInput}" que provavelmente é concorrido. Use isso como referência para encontrar alternativas melhores.` : ""}
        
        Para cada subnicho, avalie:
        1. DEMANDA: Volume de buscas, interesse do público, tendências de crescimento
        2. CONCORRÊNCIA: Número de canais, qualidade do conteúdo existente, saturação
        3. OPORTUNIDADE: Potencial de monetização, crescimento projetado, facilidade de entrada
        4. DIFERENCIAÇÃO: Como se destacar neste subnicho
        5. MICRO-NICHO: Um segmento ainda mais específico dentro do subnicho
        6. TÍTULOS VIRAIS: 3 exemplos de títulos REAIS e ESPECÍFICOS que funcionariam bem
        7. PAÍSES ALVO: Países ideais para começar com menor concorrência
        
        ⚠️ REGRA CRÍTICA PARA TÍTULOS DE EXEMPLO:
        Os títulos NÃO podem ser genéricos! Devem ser ULTRA-ESPECÍFICOS e parecer títulos de vídeos REAIS.
        
        ❌ ERRADO (genérico): "A história incrível que ninguém conhece"
        ✅ CERTO (específico): "O piloto que salvou 155 vidas pousando no Rio Hudson"
        
        ❌ ERRADO (genérico): "O herói esquecido que mudou tudo"  
        ✅ CERTO (específico): "Irena Sendler: a mulher que salvou 2.500 crianças dos nazistas"
        
        ❌ ERRADO (genérico): "A invenção proibida que mudaria o mundo"
        ✅ CERTO (específico): "Nikola Tesla e o carro elétrico de 1931 que funcionava sem bateria"
        
        Os títulos devem mencionar NOMES, NÚMEROS, DATAS, LUGARES ESPECÍFICOS!
        
        Retorne EXATAMENTE 5 subnichos promissores em formato JSON:
        {
          "mainNiche": "${mainNicheInput}",
          "analysis": "Breve análise do mercado do nicho principal",
          "subniches": [
            {
              "name": "Nome do subnicho específico",
              "potential": "Muito Alto" | "Alto" | "Médio" | "Baixo",
              "competition": "Muito Baixa" | "Baixa" | "Média" | "Alta",
              "demandScore": número de 1-10,
              "competitionScore": número de 1-10,
              "opportunityScore": número de 1-10,
              "description": "Descrição detalhada do subnicho e por que é uma boa oportunidade",
              "microNiche": "Um segmento ultra-específico dentro deste subnicho para dominar mais rápido",
              "exampleTitles": [
                "Título ESPECÍFICO com nome/número/data real - ex: 'John Harrison: o carpinteiro que resolveu o maior problema da navegação'",
                "Título ESPECÍFICO com fato concreto - ex: 'A bomba de 1,4 megatons que os EUA perderam na costa da Espanha em 1966'",
                "Título ESPECÍFICO com gancho emocional - ex: 'Por que a Kodak inventou a câmera digital em 1975 e escondeu por 20 anos?'"
              ],
              "targetCountries": ["BR Brasil", "PT Portugal", "etc - países com melhor oportunidade"],
              "contentIdeas": ["ideia 1", "ideia 2", "ideia 3"],
              "keywords": ["palavra-chave 1", "palavra-chave 2"],
              "monetizationPotential": "Alto" | "Médio" | "Baixo",
              "growthTrend": "Crescendo" | "Estável" | "Declinando",
              "entryDifficulty": "Fácil" | "Moderada" | "Difícil"
            }
          ],
          "recommendations": "Recomendações gerais para o usuário",
          "bestChoice": "Nome do subnicho mais recomendado e por quê"
        }
        
        IMPORTANTE:
        - Priorize subnichos com ALTA demanda e BAIXA concorrência
        - Seja específico e prático nos subnichos sugeridos
        - O microNiche deve ser MUITO específico (ex: "Histórias de sobrevivência na Antártida" ao invés de apenas "Histórias de sobrevivência")
        - Os 3 títulos de exemplo DEVEM ser específicos com nomes, números e fatos reais - NUNCA genéricos!
        - Os países alvo devem ter código de 2 letras antes do nome (ex: "BR Brasil", "PT Portugal", "AR Argentina")
        - Considere tendências atuais de 2025/2026
        - Foque em oportunidades reais e acionáveis
        - Os subnichos devem ser diferentes o suficiente para diversificar
        Responda APENAS com o JSON válido, sem texto adicional.`;
        userPrompt = `Encontre subnichos promissores para o nicho: ${mainNicheInput}`;
        break;

      case "analyze_competitor_channel":
        // Análise de canal concorrente e plano estratégico
        const channelUrlInput = channelUrl || prompt;
        systemPrompt = `Você é um estrategista de conteúdo especializado em análise competitiva de canais do YouTube.
        
        Analise o canal concorrente fornecido e crie um PLANO ESTRATÉGICO COMPLETO para um novo canal competir neste nicho.
        
        Baseado na URL/nome do canal "${channelUrlInput}", faça:
        
        1. ANÁLISE DO CONCORRENTE:
           - Identifique o nicho e subnicho exato do canal
           - Analise a estratégia de conteúdo atual
           - Identifique pontos fortes e fracos
           - Detecte padrões de sucesso nos vídeos
        
        2. OPORTUNIDADES:
           - Gaps de conteúdo não explorados
           - Formatos que funcionam mas são pouco usados
           - Tendências emergentes no nicho
        
        3. PLANO ESTRATÉGICO:
           - Como se diferenciar do concorrente
           - Estratégia de conteúdo recomendada
           - Frequência ideal de postagem
           - Tipos de vídeos prioritários
        
        Retorne em formato JSON:
        {
          "channelAnalysis": {
            "name": "Nome do canal (ou estimado pela URL)",
            "niche": "Nicho principal identificado",
            "subNiche": "Subnicho específico",
            "estimatedSubscribers": "Faixa estimada de inscritos",
            "strengths": ["ponto forte 1", "ponto forte 2"],
            "weaknesses": ["fraqueza 1", "fraqueza 2"],
            "contentPatterns": ["padrão 1", "padrão 2"],
            "postingFrequency": "Frequência estimada"
          },
          "opportunities": [
            {
              "type": "Gap de conteúdo" | "Formato" | "Tendência",
              "description": "Descrição da oportunidade",
              "priority": "Alta" | "Média" | "Baixa"
            }
          ],
          "strategicPlan": {
            "positioning": "Como se posicionar para competir",
            "uniqueValue": "Proposta de valor única recomendada",
            "contentStrategy": "Estratégia de conteúdo detalhada",
            "contentIdeas": ["ideia de vídeo 1", "ideia 2", "ideia 3", "ideia 4", "ideia 5"],
            "differentials": ["diferencial 1", "diferencial 2", "diferencial 3"],
            "recommendations": ["recomendação 1", "recomendação 2", "recomendação 3"],
            "postingSchedule": "Frequência e dias recomendados",
            "growthTimeline": "Expectativa de crescimento em 3, 6 e 12 meses"
          },
          "quickWins": ["ação imediata 1", "ação imediata 2", "ação imediata 3"],
          "summary": "Resumo executivo do plano estratégico"
        }
        
        IMPORTANTE:
        - Seja específico e acionável nas recomendações
        - Baseie-se em estratégias comprovadas do YouTube
        - Considere tendências atuais de 2025/2026
        - Foque em diferenciação real, não apenas cópia
        Responda APENAS com o JSON válido, sem texto adicional.`;
        userPrompt = `Analise este canal e crie um plano estratégico: ${channelUrlInput}`;
        break;

      case "regenerate_titles":
        // Regenerar apenas títulos de exemplo para um subnicho específico
        const regenNiche = niche || "";
        const regenSubNiche = subNiche || "";
        const regenMicroNiche = microNiche || "";
        systemPrompt = `Você é um especialista em títulos VIRAIS do YouTube.
        
        Gere 3 títulos ULTRA-ESPECÍFICOS e VIRAIS para o seguinte contexto:
        - Nicho: ${regenNiche}
        - Subnicho: ${regenSubNiche}
        ${regenMicroNiche ? `- Micro-nicho: ${regenMicroNiche}` : ""}
        
        ⚠️ REGRA CRÍTICA:
        Os títulos DEVEM ser ULTRA-ESPECÍFICOS com NOMES, NÚMEROS, DATAS, LUGARES REAIS.
        
        ❌ ERRADO (genérico): "A história incrível que ninguém conhece"
        ✅ CERTO (específico): "O piloto Sully que salvou 155 vidas pousando no Rio Hudson em 2009"
        
        ❌ ERRADO (genérico): "O herói esquecido que mudou tudo"  
        ✅ CERTO (específico): "Irena Sendler: a mulher que salvou 2.500 crianças dos nazistas"
        
        ❌ ERRADO (genérico): "A invenção proibida que mudaria o mundo"
        ✅ CERTO (específico): "Por que a Kodak inventou a câmera digital em 1975 e escondeu por 20 anos?"
        
        Retorne APENAS um JSON válido:
        {
          "titles": [
            "Título específico 1 com nome/número/data real",
            "Título específico 2 com fato concreto e impactante",
            "Título específico 3 com gancho emocional forte"
          ]
        }
        
        Responda APENAS com o JSON, sem texto adicional.`;
        userPrompt = `Gere 3 títulos virais específicos para o subnicho: ${regenSubNiche}`;
        break;

      case "analyze_niche":
      case "explore_niche":
        systemPrompt = `Você é um analista de mercado especializado em nichos do YouTube.
        Forneça análise detalhada sobre o nicho "${niche || prompt}" incluindo:
        - Tendências atuais do nicho
        - Oportunidades de conteúdo inexploradas
        - Nível de competição (baixo/médio/alto)
        - Palavras-chave com potencial
        - Formatos de vídeo que funcionam melhor
        - Exemplos de canais de sucesso
        - Estratégias de crescimento
        Responda em português brasileiro em formato JSON:
        {
          "niche": string,
          "trends": string[],
          "opportunities": string[],
          "competition_level": string,
          "keywords": string[],
          "best_formats": string[],
          "example_channels": string[],
          "growth_strategies": string[],
          "summary": string
        }`;
        userPrompt = niche || prompt;
        break;

      case "search_channels":
        systemPrompt = `Você é um especialista em descoberta de canais do YouTube.
        Baseado na URL do canal ou tema "${channelUrl || prompt}", sugira canais similares com:
        - Nome do canal sugerido
        - Nicho específico
        - Tamanho estimado (pequeno/médio/grande)
        - Por que é relevante
        Responda em português brasileiro em formato JSON:
        {
          "reference_channel": string,
          "similar_channels": [
            {
              "name": string,
              "niche": string,
              "size": string,
              "relevance": string,
              "url_suggestion": string
            }
          ],
          "search_tips": string[]
        }`;
        userPrompt = channelUrl || prompt;
        break;

      case "viral_analysis":
        systemPrompt = `Você é um especialista em análise de viralidade de vídeos do YouTube.
        Analise o potencial viral do conteúdo fornecido e retorne:
        - Score de viralidade (0-100)
        - Fatores positivos
        - Fatores negativos
        - Recomendações de melhoria
        - Previsão de performance
        Responda em português brasileiro em formato JSON:
        {
          "viral_score": number,
          "positive_factors": string[],
          "negative_factors": string[],
          "recommendations": string[],
          "performance_prediction": string,
          "best_posting_time": string,
          "target_audience": string
        }`;
        userPrompt = JSON.stringify(videoData) || prompt;
        break;

      case "generate_voice":
        systemPrompt = `Você é um assistente de geração de voz. 
        O usuário quer converter o seguinte texto em áudio.
        Analise o texto e sugira:
        - Melhorias de entonação
        - Pausas sugeridas (marque com ...)
        - Tom recomendado (neutro/dramático/alegre/sério)
        Retorne o texto otimizado para narração.
        Responda em formato JSON:
        {
          "original_text": string,
          "optimized_text": string,
          "suggested_tone": string,
          "duration_estimate": string,
          "tips": string[]
        }`;
        userPrompt = text || prompt;
        break;

      case "batch_images":
        systemPrompt = `Você é um especialista em criação de prompts para geração de imagens.
        Baseado no tema fornecido, crie prompts detalhados para geração de imagens.
        Cada prompt deve ter:
        - Descrição visual detalhada
        - Estilo artístico sugerido
        - Cores predominantes
        - Composição da cena
        Responda em formato JSON:
        {
          "theme": string,
          "prompts": [
            {
              "prompt": string,
              "style": string,
              "colors": string[],
              "composition": string
            }
          ]
        }`;
        break;

      case "video_script":
        systemPrompt = `Você é um roteirista profissional especializado em vídeos curtos virais.
        Crie um roteiro completo incluindo:
        - Hook inicial (0-3 segundos)
        - Introdução (3-10 segundos)
        - Desenvolvimento (corpo principal)
        - Clímax
        - CTA (call-to-action)
        Responda em formato JSON:
        {
          "title": string,
          "duration_estimate": string,
          "sections": [
            {
              "name": string,
              "timestamp": string,
              "content": string,
              "visual_notes": string
            }
          ],
          "voiceover_text": string,
          "music_suggestion": string
        }`;
        break;

      case "analyze_multiple_channels":
        // Análise de múltiplos canais para identificar lacunas, padrões e oportunidades
        const channelsData = agentData?.channels || [];
        const channelsList = channelsData.map((ch: any) => 
          `- ${ch.name || 'Canal'}: ${ch.niche || 'Nicho desconhecido'} / ${ch.subniche || 'Subnicho desconhecido'} (${ch.subscribers || 'N/A'} inscritos)
           Vídeos populares: ${ch.topVideos?.map((v: any) => v.title).join(', ') || 'N/A'}`
        ).join('\n');
        
        systemPrompt = `Você é um estrategista de conteúdo ESPECIALISTA em análise competitiva do YouTube.
        
        Analise os seguintes ${channelsData.length} canais simultaneamente e forneça uma análise profunda:
        
        ${channelsList}
        
        Sua análise deve incluir:
        
        1. ANÁLISE DE LACUNAS (gaps):
           - Identifique temas que NENHUM dos canais está cobrindo adequadamente
           - Identifique formatos de vídeo ausentes
           - Identifique públicos sub-atendidos
        
        2. OPORTUNIDADES:
           - Baseado nos gaps, liste oportunidades de conteúdo
           - Identifique tendências que eles não estão aproveitando
           - Sugira combinações únicas de nichos
        
        3. PADRÕES IDENTIFICADOS:
           - Quais fórmulas de título funcionam para todos?
           - Quais elementos visuais são comuns?
           - Qual frequência de postagem funciona?
        
        4. TÍTULOS OTIMIZADOS (15 títulos):
           - Misture as fórmulas de TODOS os canais analisados
           - Crie títulos que preencham as lacunas identificadas
           - Use gatilhos mentais: Urgência, Escassez, Curiosidade, Exclusividade
           - Cada título deve ter score de potencial viral (0-100)
        
        5. IDEIAS DE CANAL (3 ideias):
           - Sugira conceitos de novos canais baseados nas lacunas
           - Para cada canal, sugira os 5 primeiros vídeos
           - Foque em diferenciação e público sub-atendido
        
        Retorne em formato JSON:
        {
          "gapAnalysis": {
            "gaps": ["lacuna 1", "lacuna 2", "lacuna 3", "lacuna 4", "lacuna 5"],
            "opportunities": ["oportunidade 1", "oportunidade 2", "oportunidade 3", "oportunidade 4", "oportunidade 5"]
          },
          "patternsMixed": ["padrão comum 1", "padrão comum 2", "padrão comum 3", "fórmula identificada 1", "fórmula identificada 2"],
          "optimizedTitles": [
            {
              "title": "Título otimizado que mistura fórmulas dos canais",
              "formula": "Fórmula utilizada (ex: Curiosidade + Número + Exclusividade)",
              "explanation": "Por que este título funciona e preenche lacunas",
              "score": 85
            }
          ],
          "channelIdeas": [
            {
              "name": "Nome sugerido para o canal",
              "concept": "Conceito e proposta de valor única",
              "niche": "Nicho específico combinando elementos dos analisados",
              "firstVideos": [
                "Título do vídeo 1 - gancho forte",
                "Título do vídeo 2 - estabelece autoridade",
                "Título do vídeo 3 - viralização",
                "Título do vídeo 4 - engajamento",
                "Título do vídeo 5 - consolidação"
              ]
            }
          ]
        }
        
        IMPORTANTE:
        - Gere exatamente 15 títulos otimizados
        - Gere exatamente 3 ideias de canal
        - Cada ideia de canal deve ter exatamente 5 vídeos sugeridos
        - Todos os títulos em português brasileiro
        - Foque em diferenciação real baseada nos gaps identificados
        
        Responda APENAS com o JSON válido, sem texto adicional.`;
        userPrompt = `Analise estes ${channelsData.length} canais e gere uma estratégia completa baseada nas lacunas e oportunidades identificadas.`;
        break;

      case "agent_chat":
        // Chat with a custom agent - STRICT enforcement of agent configuration
        if (agentData?.systemPrompt) {
          // Use the enhanced system prompt from frontend (already includes files)
          systemPrompt = agentData.systemPrompt;
          
          // If files are provided separately, append them to the system prompt
          if (agentData?.files?.length > 0) {
            const filesSection = agentData.files
              .map((f: { name: string; content: string }) => 
                `\n📎 ARQUIVO: ${f.name}\n---\n${f.content}\n---`
              )
              .join('\n');
            
            // Only append if not already in systemPrompt
            if (!systemPrompt.includes('ARQUIVOS DE REFERÊNCIA')) {
              systemPrompt += `\n\n═══════════════════════════════════════════════════════════════════
4️⃣ ARQUIVOS DE REFERÊNCIA (INFORMAÇÕES CRÍTICAS)
   Use este conteúdo como base de conhecimento adicional:
═══════════════════════════════════════════════════════════════════
${filesSection}`;
            }
          }
        } else {
          // Fallback: Build strict system prompt manually
          const filesSection = (agentData?.files || [])
            .map((f: { name: string; content: string }) => 
              `📎 ARQUIVO: ${f.name}\n---\n${f.content}\n---`
            )
            .join('\n\n');
          
          systemPrompt = `
╔══════════════════════════════════════════════════════════════════╗
║  ⚠️ REGRAS ABSOLUTAS - VOCÊ DEVE SEGUIR À RISCA ⚠️             ║
╚══════════════════════════════════════════════════════════════════╝

Você é "${agentData?.name || 'um assistente'}", um agente de IA especializado em criar conteúdo viral para YouTube.
${agentData?.niche ? `🎯 Nicho: ${agentData.niche}` : ''}
${agentData?.subNiche ? ` | Subnicho: ${agentData.subNiche}` : ''}

═══════════════════════════════════════════════════════════════════
1️⃣ MEMÓRIA DO AGENTE (CONTEXTO OBRIGATÓRIO)
═══════════════════════════════════════════════════════════════════
${agentData?.memory || '(Nenhuma memória configurada)'}

═══════════════════════════════════════════════════════════════════
2️⃣ INSTRUÇÕES/FÓRMULA (SIGA EXATAMENTE)
═══════════════════════════════════════════════════════════════════
${agentData?.formula || '(Nenhuma instrução específica)'}

═══════════════════════════════════════════════════════════════════
3️⃣ GATILHOS MENTAIS (USE TODOS OBRIGATORIAMENTE)
═══════════════════════════════════════════════════════════════════
${agentData?.mentalTriggers?.length 
  ? agentData.mentalTriggers.map((t: string) => `• ${t}`).join('\n') 
  : '(Nenhum gatilho configurado)'}

${filesSection ? `
═══════════════════════════════════════════════════════════════════
4️⃣ ARQUIVOS DE REFERÊNCIA (INFORMAÇÕES CRÍTICAS)
═══════════════════════════════════════════════════════════════════
${filesSection}
` : ''}

🚨 ATENÇÃO: Todas as informações acima são OBRIGATÓRIAS.
NÃO ignore nenhuma instrução. NÃO improvise. SIGA o contexto fornecido À RISCA.
`;
        }
        
        // Build the conversation context
        userPrompt = prompt;
        break;

      case "analyze_thumbnails":
        // Análise de thumbnails de referência para criar 3 prompts padrão adaptados ao título
        const thumbnailsData = agentData?.thumbnails || [];
        const userVideoTitle = niche ? (agentData?.videoTitle || "") : (agentData?.videoTitle || "");
        const userNiche = niche || "";
        const userSubNiche = subNiche || "";
        
        systemPrompt = `Você é um especialista em análise visual de thumbnails do YouTube e geração de prompts para IA.
        
        TAREFA: Analisar o estilo visual das thumbnails de referência e criar 3 PROMPTS PADRÃO que mantenham o mesmo estilo, mas ADAPTADOS ao novo título/tema.
        
        THUMBNAILS DE REFERÊNCIA:
        ${thumbnailsData.map((t: any, i: number) => `${i + 1}. URL: ${t.url} | Nicho: ${t.niche || 'N/A'} | Subnicho: ${t.subNiche || 'N/A'}`).join('\n')}
        
        NOVO CONTEXTO PARA ADAPTAR:
        - Título do Vídeo: "${userVideoTitle || 'Não especificado'}"
        - Nicho: "${userNiche || 'Não especificado'}"
        - Subnicho: "${userSubNiche || 'Não especificado'}"
        
        INSTRUÇÕES CRÍTICAS:
        1. Analise o ESTILO VISUAL das thumbnails de referência (cores, composição, iluminação, tipografia)
        2. Crie 3 prompts que MANTENHAM o mesmo estilo visual, MAS adaptando:
           - AMBIENTAÇÃO: cenário adequado ao novo título
           - PERSONAGEM/POVO: pessoas/figuras relevantes ao tema do título
           - ÉPOCA/TEMPO: elementos temporais que combinem com o título
           - CORES: manter a paleta da referência mas com elementos do novo tema
           - ELEMENTOS VISUAIS: objetos e símbolos relevantes ao título
        
        FORMATO DE SAÍDA (JSON):
        {
          "commonStyle": "Descrição do estilo visual comum das thumbnails de referência",
          "colorPalette": "Cores predominantes identificadas (ex: preto, dourado, laranja vibrante)",
          "composition": "Descrição da composição típica usada",
          "headlineStyle": "Descrição do estilo de headline: posição, cor, fonte, efeitos",
          "prompts": [
            {
              "promptNumber": 1,
              "prompt": "Prompt completo e detalhado para gerar thumbnail mantendo estilo da referência mas adaptado ao título. Incluir: estilo artístico, composição, iluminação, cores, elementos visuais específicos do tema, personagem/figura central, cenário/ambientação, atmosfera.",
              "focus": "Qual aspecto do título este prompt destaca (ex: drama histórico, mistério, revelação)"
            },
            {
              "promptNumber": 2,
              "prompt": "Segundo prompt com variação de ângulo/composição mantendo o estilo...",
              "focus": "..."
            },
            {
              "promptNumber": 3,
              "prompt": "Terceiro prompt com outra interpretação visual do título...",
              "focus": "..."
            }
          ]
        }
        
        REGRAS:
        - Os 3 prompts devem ser DIFERENTES entre si, oferecendo variações
        - Cada prompt deve ter no mínimo 100 palavras
        - Incluir detalhes técnicos: iluminação, profundidade de campo, estilo artístico
        - Se houver headline, descrever posicionamento, estilo e efeitos
        - Adaptar elementos culturais/históricos/temáticos ao título fornecido
        
        Responda APENAS com o JSON válido.`;
        userPrompt = `Analise estas ${thumbnailsData.length} thumbnails de referência e crie 3 prompts adaptados ao título "${userVideoTitle}"`;
        break;

      case "viral-script":
        // For viral-script, the full prompt is already in messages from frontend
        // We just need to pass it through with a minimal system prompt
        systemPrompt = "Você é um roteirista ELITE especializado em criar roteiros COMPLETOS e PROFISSIONAIS para vídeos virais do YouTube. SIGA EXATAMENTE as instruções do usuário e gere o roteiro completo conforme solicitado. NÃO faça perguntas, NÃO peça mais informações, GERE O ROTEIRO AGORA.";
        // Extract prompt from messages if provided
        if (messages && messages.length > 0) {
          userPrompt = messages[0]?.content || prompt || "";
        }
        break;

      default:
        systemPrompt = "Você é um assistente especializado em criação de conteúdo para YouTube. Responda em português brasileiro de forma clara e útil.";
    }

    console.log("[AI Assistant] Request type:", type);
    console.log("[AI Assistant] System prompt length:", systemPrompt.length);

    // Determine API endpoint and model based on provider
    let apiUrl: string;
    let apiKey: string;
    let selectedModel: string;
    let requestHeaders: Record<string, string>;

    // Use external provider when we have a key (user or admin), otherwise use Lovable AI Gateway
    if (userApiKeyToUse && apiProvider !== 'lovable') {
      // CRITICAL: For script generation with agent formula, check if agent has a preferred model
      const requiresStrongModel = type === 'generate_script_with_formula' || type === 'agent_chat' || type === 'viral-script';
      // Get agent's preferred model if available
      const agentPreferredModel = agentData?.preferredModel || agentData?.preferred_model || null;
      
      // Strong models list for validation
      const strongModels = [
        'gpt-4o', 'gpt-4.1', 'gpt-5', 'openai/gpt-5',
        'claude-sonnet-4-20250514', 'claude-4-sonnet', 'claude-3-5-sonnet',
        'gemini-2.5-pro', 'gemini-pro', 'google/gemini-2.5-pro',
        'deepseek-r1'
      ];
      
      // Check if agent's preferred model is strong enough
      const isAgentModelStrong = agentPreferredModel && strongModels.some(sm => 
        agentPreferredModel.includes(sm.replace('google/', '').replace('openai/', ''))
      );
      
      if (apiProvider === 'laozhang') {
        // Laozhang AI Gateway - OpenAI compatible
        apiUrl = "https://api.laozhang.ai/v1/chat/completions";
        apiKey = userApiKeyToUse;
        
        // Map agent's preferred model to Laozhang API models (docs.laozhang.ai)
        const laozhangAgentModelMap: Record<string, string> = {
          "gpt-4o": "gpt-4o",
          "gpt-4.1": "gpt-4o",
          "gpt-5": "gpt-4o",
          "claude-sonnet-4-20250514": "claude-3-5-sonnet-20241022",
          "claude-4-sonnet": "claude-3-5-sonnet-20241022",
          "gemini-2.5-pro": "gemini-1.5-pro",
          "gemini-pro": "gemini-1.5-pro",
          "deepseek-r1": "deepseek-chat",
        };
        
        // Priority: Agent preferred model > laozhangModel (from initial mapping) > default
        if (agentPreferredModel && laozhangAgentModelMap[agentPreferredModel]) {
          selectedModel = laozhangAgentModelMap[agentPreferredModel];
          console.log(`[AI Assistant] Laozhang: Using agent's PREFERRED model: ${agentPreferredModel} -> ${selectedModel}`);
        } else if (laozhangModel) {
          selectedModel = laozhangModel;
          console.log(`[AI Assistant] Laozhang: Using pre-mapped model: ${selectedModel}`);
        } else {
          selectedModel = "gpt-4o";
          console.log(`[AI Assistant] Laozhang: Using default model: ${selectedModel}`);
        }
        
        requestHeaders = {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        };
        console.log(`[AI Assistant] Using Laozhang AI API with final model: ${selectedModel}`);
      } else if (apiProvider === 'openai') {
        apiUrl = "https://api.openai.com/v1/chat/completions";
        apiKey = userApiKeyToUse;
        
        // CRITICAL: Respect agent's selected model - user chose it intentionally
        if (agentPreferredModel) {
          // Map frontend model names to OpenAI API model names
          const openaiModelMap: Record<string, string> = {
            "gpt-4o": "gpt-4o",
            "gpt-4.1": "gpt-4o", // gpt-4.1 maps to gpt-4o
            "gpt-5": "gpt-4o",
          };
          selectedModel = openaiModelMap[agentPreferredModel] || "gpt-4o";
          console.log(`[AI Assistant] Using agent's SELECTED model: ${agentPreferredModel} -> ${selectedModel}`);
        } else if (requiresStrongModel) {
          selectedModel = "gpt-4o";
          console.log(`[AI Assistant] No model selected, defaulting to GPT-4o for complex tasks`);
        } else {
          selectedModel = "gpt-4o-mini";
          if (model === "gpt-4o" || model === "gpt-5" || model?.includes("gpt")) {
            selectedModel = "gpt-4o";
          }
        }
        requestHeaders = {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        };
        console.log(`[AI Assistant] Using OpenAI API directly with model: ${selectedModel}`);
      } else if (apiProvider === 'gemini') {
        apiKey = userApiKeyToUse;
        
        // CRITICAL: Respect agent's selected model - user chose it intentionally
        if (agentPreferredModel && agentPreferredModel.includes('gemini')) {
          selectedModel = "gemini-2.5-pro"; // Both gemini options map to pro for quality
          apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`;
          console.log(`[AI Assistant] Using agent's SELECTED Gemini model: ${agentPreferredModel} -> ${selectedModel}`);
        } else if (requiresStrongModel) {
          selectedModel = "gemini-2.5-pro";
          apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`;
          console.log(`[AI Assistant] No Gemini model selected, defaulting to gemini-2.5-pro for complex tasks`);
        } else {
          selectedModel = "gemini-2.5-flash";
          apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
          if (model === "gemini-pro" || model?.includes("pro")) {
            selectedModel = "gemini-2.5-pro";
            apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${apiKey}`;
          }
        }
        requestHeaders = {
          "Content-Type": "application/json",
        };
        console.log(`[AI Assistant] Using Gemini API directly with model: ${selectedModel}`);
      } else {
        throw new Error("Provider não suportado");
      }
    } else {
      // Use Lovable AI Gateway
      apiUrl = "https://ai.gateway.lovable.dev/v1/chat/completions";
      apiKey = LOVABLE_API_KEY!;
      
      // CRITICAL: Respect agent's selected model - user chose it intentionally
      const agentPreferredModelLovable = agentData?.preferredModel || agentData?.preferred_model || null;
      
      // Map agent's preferred model to Lovable gateway format
      const lovableModelMap: Record<string, string> = {
        "gpt-4o": "openai/gpt-5",
        "gpt-4.1": "openai/gpt-5",
        "gpt-5": "openai/gpt-5",
        "claude-sonnet-4-20250514": "openai/gpt-5", // Claude -> GPT-5 on Lovable (similar quality)
        "claude-4-sonnet": "openai/gpt-5",
        "gemini-2.5-pro": "google/gemini-2.5-pro",
        "gemini-pro": "google/gemini-2.5-pro",
        "gemini-2.5-flash": "google/gemini-2.5-flash",
        "deepseek-r1": "google/gemini-2.5-pro",
      };
      
      // ALWAYS respect user's model selection first
      if (agentPreferredModelLovable && lovableModelMap[agentPreferredModelLovable]) {
        selectedModel = lovableModelMap[agentPreferredModelLovable];
        console.log(`[AI Assistant] Using agent's SELECTED model via Lovable: ${agentPreferredModelLovable} -> ${selectedModel}`);
      } else if (model && lovableModelMap[model]) {
        selectedModel = lovableModelMap[model];
        console.log(`[AI Assistant] Using request model via Lovable: ${model} -> ${selectedModel}`);
      } else {
        // Default to Gemini Pro for quality
        selectedModel = "google/gemini-2.5-pro";
        console.log(`[AI Assistant] No model preference, defaulting to: ${selectedModel}`);
      }
      requestHeaders = {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      };
      console.log(`[AI Assistant] Using Lovable AI Gateway with model: ${selectedModel}`);
    }

    let response: Response;

    if (apiProvider === 'gemini' && userApiKeyToUse) {
      // Gemini API has a different request format
      // Use messages directly when provided (e.g., regenerate lost scenes, sync_verification)
      const shouldUseProvidedMessages = Array.isArray(messages) && messages.length > 0 && 
        messages.some((m: any) => m?.role && m?.content);
      const combinedText = shouldUseProvidedMessages
        ? (messages as any[])
            .map((m) => {
              const role = m?.role ? String(m.role).toUpperCase() : 'USER';
              const content = m?.content ? String(m.content) : '';
              return `${role}: ${content}`;
            })
            .join('\n\n')
        : `${systemPrompt}\n\n${userPrompt}`;

      response = await fetch(apiUrl, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: combinedText }] }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        }),
      });
    } else {
      // OpenAI-compatible format (OpenAI, Laozhang AI, and Lovable AI Gateway)
      const longOutput = type === "viral-script" || type === "generate_script_with_formula" || type === "agent_chat";
      // Increase max_tokens for analyze_video_titles to avoid truncated JSON
      const isAnalyzeTitles = type === "analyze_video_titles";
      const isSyncVerification = type === 'sync_verification';
      // Sync verification can include hundreds of scenes: avoid truncation.
      const maxOut = (longOutput || isSyncVerification) ? 8192 : (isAnalyzeTitles ? 4096 : 2048);

      // Use messages directly when provided (e.g., regenerate lost scenes, sync_verification)
      // Otherwise, construct from systemPrompt + userPrompt
      const useDirectMessages = Array.isArray(messages) && messages.length > 0 && 
        messages.some((m: any) => m?.role && m?.content);
      
      const payload: Record<string, unknown> = {
        model: selectedModel,
        messages: useDirectMessages
          ? messages
          : [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
      };

      // Token limit differences
      if (apiProvider === 'lovable') {
        if (selectedModel.startsWith('openai/')) {
          // GPT-5 family uses max_completion_tokens
          (payload as any).max_completion_tokens = maxOut;
        } else {
          (payload as any).max_tokens = maxOut;
        }
      } else {
        // OpenAI and Laozhang are OpenAI-compatible and accept max_tokens
        (payload as any).max_tokens = maxOut;
      }

      response = await fetch(apiUrl, {
        method: "POST",
        headers: requestHeaders,
        body: JSON.stringify(payload),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[AI Assistant] AI API error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições excedido. Tente novamente em alguns minutos." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA esgotados. Configure suas chaves de API em Configurações ou adicione mais créditos." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (response.status === 401) {
        return new Response(
          JSON.stringify({ error: "Chave de API inválida. Verifique suas configurações." }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error(`AI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // Extract content based on provider
    let content: string;
    if (apiProvider === 'gemini' && useUserApiKey) {
      // Gemini response format
      content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      // OpenAI-compatible response format
      content = data.choices?.[0]?.message?.content || "";
    }

    console.log("[AI Assistant] AI response received, length:", content?.length);

    // Try to parse as JSON if expected
    let result: unknown = content;
    if (type === 'sync_verification') {
      // For sync_verification we MUST return valid JSON to the client.
      // First attempt: parse extracted JSON.
      try {
        const extracted = tryExtractJsonBlock(content) ?? content;
        result = JSON.parse(extracted);
      } catch (e) {
        console.warn('[AI Assistant] sync_verification returned invalid JSON, attempting repair...');
        // Second attempt: repair using the same provider/model.
        result = await repairSyncVerificationJson({
          apiUrl,
          requestHeaders,
          apiProvider,
          selectedModel,
          rawContent: content,
        });
      }
    } else if (content && (content.includes('{') || content.includes('['))) {
      try {
        const extracted = tryExtractJsonBlock(content);
        result = JSON.parse((extracted ?? content).trim());
      } catch {
        // If JSON parsing fails, return as string
        result = content;
      }
    }

    if (type === 'sync_verification') {
      const ok = !!result && typeof result === 'object' && Array.isArray((result as any).analysis);
      console.log(`[AI Assistant] sync_verification JSON valid: ${ok}`);
      if (!ok) {
        throw new Error('sync_verification: backend could not produce valid JSON');
      }
    }

    // For dashboard_insight, return directive format
    if (type === "dashboard_insight") {
      type IconType = 'target' | 'brain' | 'zap' | 'trending' | 'rocket';
      let directive: { title: string; tip: string; icon: IconType } = { 
        title: "Dica do Especialista", 
        tip: "Continue analisando vídeos para descobrir padrões virais.", 
        icon: "rocket" 
      };
      try {
        if (result && typeof result === 'object') {
          const parsed = result as { title?: string; tip?: string; icon?: string };
          if (parsed.title && parsed.tip) {
            const validIcons: IconType[] = ['target', 'brain', 'zap', 'trending', 'rocket'];
            const iconValue = validIcons.includes(parsed.icon as IconType) ? parsed.icon as IconType : 'rocket';
            directive = {
              title: String(parsed.title),
              tip: String(parsed.tip),
              icon: iconValue
            };
          }
        }
      } catch {}
      return new Response(
        JSON.stringify({ directive }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For agent_chat, return simple response format
    if (type === "agent_chat") {
      return new Response(
        JSON.stringify({ 
          response: content,
          text: content,
          creditsUsed: useUserApiKey ? 0 : creditsNeeded,
          model: selectedModel,
          provider: apiProvider
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        result,
        creditsUsed: useUserApiKey ? 0 : creditsNeeded,
        model: selectedModel,
        provider: apiProvider
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("[AI Assistant] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
