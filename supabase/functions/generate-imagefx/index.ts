import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Lovable AI Gateway for prompt rewriting
const LOVABLE_AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const DefaultHeader = {
  "Origin": "https://labs.google",
  "Content-Type": "application/json",
  "Referer": "https://labs.google/fx/tools/image-fx"
};

const Model = {
  IMAGEN_3: "IMAGEN_3",
  IMAGEN_3_5: "IMAGEN_3_5"
} as const;

const AspectRatio = {
  SQUARE: "IMAGE_ASPECT_RATIO_SQUARE",
  PORTRAIT: "IMAGE_ASPECT_RATIO_PORTRAIT",
  LANDSCAPE: "IMAGE_ASPECT_RATIO_LANDSCAPE",
  THUMBNAIL: "IMAGE_ASPECT_RATIO_LANDSCAPE" // 16:9 for thumbnails
} as const;

// Rewrite prompt using AI to make it safe - rápido e contextual
async function rewritePromptForSafety(originalPrompt: string, attemptNumber: number = 1): Promise<string> {
  if (!LOVABLE_API_KEY) {
    console.log('[ImageFX] No Lovable API key, cannot rewrite prompt');
    throw new Error("Não foi possível reescrever o prompt bloqueado.");
  }

  console.log(`[ImageFX] Rewriting blocked prompt (attempt ${attemptNumber})...`);

  // Estratégia única e eficaz que mantém o contexto do roteiro
  const systemPrompt = attemptNumber === 1 
    ? `You are an expert at rewriting image prompts to pass AI safety filters while keeping the EXACT same visual context.

CRITICAL RULES:
1. Keep the SAME scene, setting, and visual composition
2. Replace sensitive elements with safe alternatives:
   - Violence/weapons → peaceful objects or symbolic representations
   - Blood → red fabric, flowers, or sunset lighting
   - People in danger → people in neutral poses
   - Scary content → mysterious atmospheric scenes
3. Keep all visual descriptions: lighting, colors, camera angles, style
4. Add: "professional cinematography, cinematic lighting, 8K quality"
5. Keep: "16:9 horizontal landscape, edge-to-edge full bleed, fill entire frame without any black bars or letterboxing"
6. Output ONLY the rewritten prompt, nothing else

The goal is to create the SAME visual scene but described in a safe way.`
    : `You are creating an ABSTRACT representation of a visual concept that will NEVER be blocked.

MANDATORY RULES:
1. Transform the scene into pure visual elements: colors, textures, light, atmosphere
2. NO people, NO actions, NO specific objects that could be flagged
3. Focus on: moods, color palettes, lighting effects, abstract compositions
4. Use terms like: "ethereal", "atmospheric", "cinematic mood", "artistic composition"
5. Add: "abstract digital art, 16:9 horizontal landscape, edge-to-edge full bleed, professional photography, fill entire frame without any black bars"
6. Output ONLY the abstract visual prompt

Create a beautiful, safe image that captures the ESSENCE of the original scene.`;

  try {
    const response = await fetch(LOVABLE_AI_GATEWAY, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Rewrite this blocked prompt:\n\n${originalPrompt}` }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      console.error('[ImageFX] AI rewrite failed:', response.status);
      throw new Error("Falha ao reescrever prompt");
    }

    const data = await response.json();
    const rewrittenPrompt = data.choices?.[0]?.message?.content?.trim();

    if (!rewrittenPrompt) {
      throw new Error("AI não retornou prompt reescrito");
    }

    // Garantir que inclui requisitos de formato
    const finalPrompt = rewrittenPrompt.includes("edge-to-edge") || rewrittenPrompt.includes("full bleed")
      ? rewrittenPrompt 
      : `${rewrittenPrompt}, 16:9 horizontal landscape, edge-to-edge full bleed composition, fill entire frame without any black bars or letterboxing`;

    console.log('[ImageFX] Prompt rewritten successfully');
    console.log('[ImageFX] New prompt:', finalPrompt.substring(0, 150) + '...');

    return finalPrompt;
  } catch (error) {
    console.error('[ImageFX] Error rewriting prompt:', error);
    throw new Error("Não foi possível reescrever o prompt bloqueado.");
  }
}

// Session cache to avoid re-fetching every request
const sessionCache = new Map<string, { token: string; expires: Date; user: any }>();

async function fetchSession(cookie: string): Promise<{ access_token: string; expires: string; user: any }> {
  console.log('[ImageFX] Fetching session...');
  
  const res = await fetch("https://labs.google/fx/api/auth/session", {
    headers: {
      "Origin": "https://labs.google",
      "Referer": "https://labs.google/fx/tools/image-fx",
      "Cookie": cookie
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error(`[ImageFX] Session error ${res.status}:`, errorText);
    
    if ([401, 403].includes(res.status)) {
      throw new Error(`Falha de autenticação (${res.status}). Verifique os cookies do ImageFX.`);
    }
    throw new Error(`Erro ao obter sessão: ${res.status}`);
  }

  const data = await res.json();
  
  if (!data.access_token || !data.expires || !data.user) {
    console.error('[ImageFX] Invalid session response:', data);
    throw new Error("Resposta de sessão inválida. Atualize os cookies do ImageFX.");
  }

  console.log('[ImageFX] Session obtained successfully');
  return data;
}

async function getAuthHeaders(cookie: string, userId: string): Promise<Record<string, string>> {
  // Check cache first
  const cached = sessionCache.get(userId);
  const now = new Date();
  
  if (cached && cached.expires > new Date(now.getTime() + 30000)) {
    console.log('[ImageFX] Using cached session');
    return {
      ...DefaultHeader,
      "Cookie": cookie,
      "Authorization": `Bearer ${cached.token}`
    };
  }

  // Fetch new session
  const session = await fetchSession(cookie);
  
  // Cache the session
  sessionCache.set(userId, {
    token: session.access_token,
    expires: new Date(session.expires),
    user: session.user
  });

  return {
    ...DefaultHeader,
    "Cookie": cookie,
    "Authorization": `Bearer ${session.access_token}`
  };
}

function generateSessionId(): string {
  const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `${Date.now()}-${randomHex}`;
}

function buildPromptPayload(options: {
  prompt: string;
  negativePrompt?: string;
  numberOfImages?: number;
  aspectRatio?: string;
  seed?: number;
  model?: string;
}): string {
  const seed = options.seed ?? Math.floor(Math.random() * 2147483647);
  const model = options.model === "IMAGEN_3" ? Model.IMAGEN_3 : Model.IMAGEN_3_5;
  
  // CRÍTICO: Limpar prompt de possíveis padrões que causam texto na imagem
  let cleanedPrompt = options.prompt
    // Remover padrão "illustrating:" que causa texto
    .replace(/illustrating:\s*/gi, '')
    // Remover aspas que podem virar texto
    .replace(/["']/g, '')
    // Remover frases em espanhol/português que podem virar texto na imagem
    .replace(/\b(el|la|los|las|un|una|de|del|que|en|por|para|con|sin|sobre|bajo|entre|hacia|desde|hasta|durante|mediante|según)\s+\w+\s+\w+\s+\w+/gi, (match) => {
      // Se parecer uma frase (4+ palavras conectadas), é provável que seja texto do roteiro
      return match.split(' ').length > 4 ? '' : match;
    });
  
  // Se o prompt for muito curto após limpeza, usar o original
  if (cleanedPrompt.length < 50) {
    cleanedPrompt = options.prompt.replace(/illustrating:\s*/gi, '');
  }
  
  // CRÍTICO: Instruções rigorosas para resolução 1280x720, preenchimento total e SEM TEXTO
  const enhancedPrompt = `${cleanedPrompt}. MANDATORY: 1280x720 resolution, 16:9 aspect ratio, full frame edge-to-edge, NO black bars, NO letterbox. ABSOLUTELY CRITICAL: This image must contain ZERO TEXT - no words, no letters, no subtitles, no captions, no watermarks, no typography, no written language of any kind - pure visual imagery only`;

  const payload: any = {
    userInput: {
      candidatesCount: options.numberOfImages || 1,
      prompts: [enhancedPrompt],
      seed: seed
    },
    clientContext: {
      sessionId: generateSessionId(),
      tool: "IMAGE_FX"
    },
    modelInput: {
      modelNameType: model
    },
    aspectRatio: options.aspectRatio || AspectRatio.LANDSCAPE
  };

  return JSON.stringify(payload);
}

function parseImageFXError(text: string, status: number): string {
  try {
    const json = JSON.parse(text);
    const reason = json?.error?.details?.[0]?.reason;
    const fallback = json?.error?.message || `Erro ${status}`;

    switch (reason) {
      case "PUBLIC_ERROR_UNSAFE_GENERATION":
        return "Prompt bloqueado: conteúdo considerado inseguro pelo ImageFX.";
      case "PUBLIC_ERROR_PROMINENT_PEOPLE_FILTER_FAILED":
        return "Prompt bloqueado: não é permitido gerar imagens de pessoas famosas.";
      case "PUBLIC_ERROR_QUALITY_FILTER_FAILED":
      case "PUBLIC_ERROR_AESTHETIC_FILTER_FAILED":
        return "Prompt bloqueado: qualidade ou estética considerada baixa.";
      case "PUBLIC_ERROR_USER_REQUESTS_THROTTLED":
        return "Limite de requisições atingido. Aguarde alguns segundos e tente novamente.";
      default:
        return reason ? `Erro ImageFX: ${reason}` : fallback;
    }
  } catch {
    return status === 429 
      ? "Limite de requisições atingido. Aguarde alguns segundos." 
      : `Erro ${status}: ${text.substring(0, 200)}`;
  }
}

async function generateWithImageFX(
  cookie: string,
  userId: string,
  options: {
    prompt: string;
    negativePrompt?: string;
    numberOfImages?: number;
    aspectRatio?: string;
    seed?: number;
    model?: string;
  },
  retries = 3,
  allowPromptRewrite = true,
  rewriteAttempts = 0
): Promise<any[]> {
  const headers = await getAuthHeaders(cookie, userId);
  const payload = buildPromptPayload(options);

  console.log('[ImageFX] Generating image with prompt:', options.prompt.substring(0, 100) + '...');
  console.log('[ImageFX] Aspect ratio:', options.aspectRatio);
  console.log('[ImageFX] Model:', options.model || 'IMAGEN_3_5');
  console.log('[ImageFX] Retries left:', retries, '| Rewrite attempts:', rewriteAttempts);

  try {
    const res = await fetch("https://aisandbox-pa.googleapis.com/v1:runImageFx", {
      method: "POST",
      body: payload,
      headers
    });

    if (!res.ok) {
      const errText = await res.text();
      const msg = parseImageFXError(errText, res.status);
      
      // If auth error, clear cache and throw
      if ([401, 403].includes(res.status)) {
        sessionCache.delete(userId);
        throw new Error(`Erro de autenticação: ${msg}. Atualize os cookies do ImageFX nas configurações.`);
      }
      
      // Check if rate limited - wait longer and retry with exponential backoff
      const isRateLimited = msg.includes("Limite de requisições") || msg.includes("throttled") || res.status === 429;
      if (isRateLimited && retries > 0) {
        // Exponential backoff: 5s, 10s, 20s with jitter
        const baseWait = 5000 * Math.pow(2, 3 - retries);
        const jitter = Math.random() * 2000;
        const waitTime = baseWait + jitter;
        console.log(`[ImageFX] Rate limited, waiting ${Math.round(waitTime)}ms before retry (${retries} left)...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return generateWithImageFX(cookie, userId, options, retries - 1, allowPromptRewrite, rewriteAttempts);
      }
      
      // Check if prompt was blocked for safety - try rewriting up to 3 times with increasingly aggressive strategies
      const isUnsafeContent = msg.includes("inseguro") || msg.includes("bloqueado") || msg.includes("blocked") || msg.includes("safety") || msg.includes("violates");
      
      if (isUnsafeContent && allowPromptRewrite && rewriteAttempts < 3) {
        console.log(`[ImageFX] Prompt blocked (attempt ${rewriteAttempts + 1}/3), attempting to rewrite...`);
        
        try {
          const rewrittenPrompt = await rewritePromptForSafety(options.prompt, rewriteAttempts + 1);
          
          // Add a small delay to avoid rate limits
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Retry with rewritten prompt
          return await generateWithImageFX(
            cookie,
            userId,
            { ...options, prompt: rewrittenPrompt },
            retries,
            rewriteAttempts < 2, // Allow more rewrites
            rewriteAttempts + 1
          );
        } catch (rewriteError) {
          console.error('[ImageFX] Failed to rewrite prompt:', rewriteError);
          // Continue to retry logic below
        }
      }
      
      throw new Error(msg);
    }

    const json = await res.json();
    const images = json?.imagePanels?.[0]?.generatedImages;
    
    if (!images?.length) {
      throw new Error("A API ImageFX não retornou imagens.");
    }

    console.log(`[ImageFX] Generated ${images.length} image(s) successfully`);

    // Transform to standard format
    return images.map((img: any) => ({
      url: `data:image/png;base64,${img.encodedImage}`,
      prompt: options.prompt,
      seed: img.seed,
      mediaId: img.mediaGenerationId,
      model: img.modelNameType || options.model || 'IMAGEN_3_5',
      wasRewritten: rewriteAttempts > 0
    }));

  } catch (err) {
    const errorMsg = (err as Error).message;
    
    // Don't retry auth errors
    if (errorMsg.includes('autenticação')) {
      throw err;
    }
    
    // Check if it's a rate limit that slipped through
    if ((errorMsg.includes('Limite de requisições') || errorMsg.includes('throttled')) && retries > 0) {
      const baseWait = 5000 * Math.pow(2, 3 - retries);
      const jitter = Math.random() * 2000;
      const waitTime = baseWait + jitter;
      console.log(`[ImageFX] Rate limit error, waiting ${Math.round(waitTime)}ms...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return generateWithImageFX(cookie, userId, options, retries - 1, allowPromptRewrite, rewriteAttempts);
    }
    
    // General retry with delay
    if (retries > 0) {
      const waitTime = 2000 + (3 - retries) * 1000;
      console.warn(`[ImageFX] Failed, waiting ${waitTime}ms before retry... (${retries} left)`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
      return generateWithImageFX(cookie, userId, options, retries - 1, allowPromptRewrite, rewriteAttempts);
    }
    
    throw err;
  }
}

// Get global ImageFX cookies from admin settings
async function getGlobalImageFXCookies(): Promise<string[] | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('admin_settings')
      .select('value')
      .eq('key', 'global_imagefx_cookies')
      .maybeSingle();

    if (error || !data?.value) {
      console.log('[ImageFX] No global cookies configured');
      return null;
    }

    const cookies = data.value as { cookie1?: string; cookie2?: string; cookie3?: string };
    const cookieList = [cookies.cookie1, cookies.cookie2, cookies.cookie3]
      .filter((c): c is string => !!c && c.trim().length > 0)
      .map(c => c.trim());

    if (cookieList.length === 0) return null;

    console.log(`[ImageFX] Found ${cookieList.length} global cookie(s) configured`);
    return cookieList;
  } catch (e) {
    console.error('[ImageFX] Error fetching global cookies:', e);
    return null;
  }
}

// Get user's ImageFX cookies from settings - supports multiple cookies separated by |||
async function getUserImageFXCookies(userId: string): Promise<string[] | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_api_settings')
      .select('imagefx_cookies, imagefx_validated')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) {
      console.log('[ImageFX] No user settings found');
      return null;
    }

    if (!data.imagefx_validated) {
      console.log('[ImageFX] Cookies not validated');
      return null;
    }

    const rawCookies = (data as any).imagefx_cookies || null;
    if (!rawCookies) return null;

    // Aceitar separadores comuns (||| ou quebras de linha) e limpar colagens do DevTools
    const split = rawCookies
      .split(/\|\|\||\r?\n+/)
      .map((c: string) => c.trim())
      .filter((c: string) => c.length > 0)
      .map((c: string) => c
        .replace(/^cookie:\s*/i, '')
        .replace(/^\"|\"$/g, '')
        .replace(/^'|'$/g, '')
      );

    if (split.length === 0) return null;

    console.log(`[ImageFX] Found ${split.length} user cookie(s) configured`);
    return split;
  } catch (e) {
    console.error('[ImageFX] Error fetching user cookies:', e);
    return null;
  }
}

// Deterministic cookie selector based on scene index for ordered distribution
function getCookieForScene(sceneIndex: number, cookies: string[]): { cookie: string; cookieIndex: number } {
  const cookieIndex = sceneIndex % cookies.length;
  return { cookie: cookies[cookieIndex], cookieIndex };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      prompt, 
      negativePrompt,
      numberOfImages = 1,
      aspectRatio = "LANDSCAPE",
      seed,
      model = "IMAGEN_3_5",
      userId: bodyUserId,
      sceneIndex = 0 // Index for deterministic cookie distribution
    } = await req.json();

    if (!prompt?.trim()) {
      return new Response(
        JSON.stringify({ error: "Prompt é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract userId from JWT or body
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
        console.log('[ImageFX] Could not extract user from token');
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's ImageFX cookies first, then fallback to global
    let cookieList = await getUserImageFXCookies(userId);
    let usingGlobalCookies = false;
    
    if (!cookieList || cookieList.length === 0) {
      console.log('[ImageFX] No user cookies, trying global cookies...');
      cookieList = await getGlobalImageFXCookies();
      usingGlobalCookies = true;
    }
    
    if (!cookieList || cookieList.length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "Cookies do ImageFX não configurados. Configure seus cookies em Configurações > ImageFX, ou aguarde o administrador configurar cookies globais." 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    console.log(`[ImageFX] Using ${usingGlobalCookies ? 'GLOBAL' : 'USER'} cookies (${cookieList.length} available)`);

    // Select cookie based on scene index for ordered distribution
    const { cookie: selectedCookie, cookieIndex } = getCookieForScene(sceneIndex, cookieList);
    console.log(`[ImageFX] Scene ${sceneIndex} -> Cookie ${cookieIndex + 1}/${cookieList.length}`);

    // Map aspect ratio
    let aspectRatioValue: string = AspectRatio.LANDSCAPE;
    if (aspectRatio === "SQUARE" || aspectRatio === "1:1") {
      aspectRatioValue = AspectRatio.SQUARE;
    } else if (aspectRatio === "PORTRAIT" || aspectRatio === "9:16") {
      aspectRatioValue = AspectRatio.PORTRAIT;
    } else if (aspectRatio === "LANDSCAPE" || aspectRatio === "16:9") {
      aspectRatioValue = AspectRatio.LANDSCAPE;
    }

    // Generate images using selected cookie
    try {
      const images = await generateWithImageFX(selectedCookie, userId, {
        prompt,
        negativePrompt,
        numberOfImages: Math.min(numberOfImages, 4), // Max 4 images
        aspectRatio: aspectRatioValue,
        seed,
        model
      });

      console.log(`[ImageFX] Returning ${images.length} image(s) from cookie ${cookieIndex + 1}`);

      return new Response(
        JSON.stringify({ 
          success: true,
          images,
          count: images.length 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error(`[ImageFX] Error with cookie ${cookieIndex + 1}:`, error);
      
      const errorMessage = error instanceof Error ? error.message : "Erro inesperado";
      
      // Se for erro de sessão/autenticação, incluir qual cookie falhou
      if (errorMessage.includes("sessão") || errorMessage.includes("autenticação") || errorMessage.includes("cookies") || errorMessage.includes("Atualize")) {
        return new Response(
          JSON.stringify({ 
            error: `Cookie ${cookieIndex + 1} inválido ou expirado. Atualize o Cookie ${cookieIndex + 1} nas Configurações > ImageFX.`,
            cookieIndex: cookieIndex + 1,
            totalCookies: cookieList.length,
            usingGlobal: usingGlobalCookies
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          error: errorMessage,
          cookieIndex: cookieIndex + 1
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

  } catch (error) {
    console.error('[ImageFX] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Erro inesperado ao gerar imagem" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});