import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Tabela oficial de preços conforme documentação seção 4.2
const CREDIT_PRICING = {
  TITLE_ANALYSIS: { base: 6, gemini: 7, claude: 9 },
};

// Função para extrair videoId da URL do YouTube
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^[a-zA-Z0-9_-]{11}$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1] || match[0];
  }
  return null;
}

// Função para buscar dados do vídeo via YouTube Data API
async function fetchYouTubeVideoData(videoId: string, apiKey: string) {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,statistics&key=${apiKey}`
  );
  
  if (!response.ok) {
    throw new Error(`YouTube API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  if (!data.items || data.items.length === 0) {
    throw new Error("Video not found");
  }
  
  const video = data.items[0];
  const publishedAt = new Date(video.snippet.publishedAt);
  const daysAgo = Math.floor((Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24));
  
  return {
    title: video.snippet.title,
    description: video.snippet.description,
    thumbnailUrl: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url,
    views: parseInt(video.snippet.statistics?.viewCount || "0"),
    comments: parseInt(video.snippet.statistics?.commentCount || "0"),
    likes: parseInt(video.snippet.statistics?.likeCount || "0"),
    publishedAt: video.snippet.publishedAt,
    daysAgo,
    channelTitle: video.snippet.channelTitle,
    tags: video.snippet.tags || []
  };
}

// Helper function to get AI configuration
async function getAIConfig(userId: string | null, supabaseAdmin: any, requestedModel: string) {
  let apiKey: string | null = null;
  let apiEndpoint = "https://ai.gateway.lovable.dev/v1/chat/completions";
  let finalModel = "google/gemini-2.5-flash";
  let provider = "lovable";

  // Map frontend model names to actual model names
  const modelMap: Record<string, string> = {
    "gpt-4o": "gpt-4o",
    "gpt-4o-2025": "gpt-4o",
    "gemini": "gemini-2.5-flash",
    "gemini-pro": "gemini-2.5-pro",
    "gemini-2.5-pro": "gemini-2.5-pro",
    "claude": "claude-3-5-sonnet-20241022",
  };

  // Check user API settings first
  if (userId) {
    const { data: userSettings } = await supabaseAdmin
      .from("user_api_settings")
      .select("openai_api_key, openai_validated, gemini_api_key, gemini_validated, claude_api_key, claude_validated, use_platform_credits")
      .eq("user_id", userId)
      .maybeSingle();

    const usePlatformCredits = userSettings?.use_platform_credits ?? true;

    // If user has their own API keys and not using platform credits
    if (!usePlatformCredits && userSettings) {
      console.log(`[AI Config] User using own API, requested model: ${requestedModel}`);
      
      if (requestedModel.includes("gpt") && userSettings.openai_api_key && userSettings.openai_validated) {
        apiKey = userSettings.openai_api_key;
        apiEndpoint = "https://api.openai.com/v1/chat/completions";
        finalModel = "gpt-4o";
        provider = "openai";
        console.log("[AI Config] Using user OpenAI API key");
      } else if (requestedModel.includes("claude") && userSettings.claude_api_key && userSettings.claude_validated) {
        apiKey = userSettings.claude_api_key;
        apiEndpoint = "https://api.anthropic.com/v1/messages";
        finalModel = "claude-3-5-sonnet-20241022";
        provider = "claude";
        console.log("[AI Config] Using user Claude API key");
      } else if (requestedModel.includes("gemini") && userSettings.gemini_api_key && userSettings.gemini_validated) {
        // Determine which Gemini model to use
        const geminiModel = requestedModel.includes("pro") ? "gemini-2.5-pro" : "gemini-2.5-flash";
        apiKey = userSettings.gemini_api_key;
        apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${userSettings.gemini_api_key}`;
        finalModel = geminiModel;
        provider = "gemini";
        console.log(`[AI Config] Using user Gemini API key with model: ${geminiModel}`);
      } else {
        console.log(`[AI Config] User has own API disabled but no valid key for model: ${requestedModel}`);
      }
    }
  }

  // If no user key, check admin settings for Laozhang or other providers
  if (!apiKey) {
    // Admin keys are stored in api_keys object
    const { data: adminSettings } = await supabaseAdmin
      .from("admin_settings")
      .select("key, value")
      .eq("key", "api_keys")
      .maybeSingle();

    const apiKeys = adminSettings?.value as any || {};
    const adminLaozhangKey = apiKeys.laozhang;
    const adminOpenaiKey = apiKeys.openai;
    const adminGeminiKey = apiKeys.gemini;
    const adminClaudeKey = apiKeys.claude;

    console.log(`[AI Config] Admin keys found - Laozhang: ${!!adminLaozhangKey}, OpenAI: ${!!adminOpenaiKey}, Gemini: ${!!adminGeminiKey}`);

    // Priority: Laozhang > OpenAI/Gemini > Lovable AI
    if (adminLaozhangKey) {
      apiKey = adminLaozhangKey;
      apiEndpoint = "https://api.laozhang.ai/v1/chat/completions";
      // Map model for Laozhang - using deepseek-r1 for reasoning tasks
      if (requestedModel.includes("gpt")) {
        finalModel = "gpt-4.1";
      } else if (requestedModel.includes("claude")) {
        finalModel = "claude-sonnet-4-20250514";
      } else if (requestedModel.includes("deepseek")) {
        finalModel = "deepseek-r1";
      } else if (requestedModel.includes("gemini") && requestedModel.includes("pro")) {
        finalModel = "gemini-2.5-pro";
      } else {
        finalModel = "gemini-2.5-flash";
      }
      provider = "laozhang";
      console.log(`[AI Config] Using admin Laozhang API key with model: ${finalModel}`);
    } else if (requestedModel.includes("gpt") && adminOpenaiKey) {
      apiKey = adminOpenaiKey;
      apiEndpoint = "https://api.openai.com/v1/chat/completions";
      finalModel = "gpt-4o";
      provider = "openai";
      console.log("[AI Config] Using admin OpenAI API key");
    } else if (requestedModel.includes("gemini") && adminGeminiKey) {
      const geminiModel = requestedModel.includes("pro") ? "gemini-2.5-pro" : "gemini-2.5-flash";
      apiKey = adminGeminiKey;
      apiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${adminGeminiKey}`;
      finalModel = geminiModel;
      provider = "gemini";
      console.log(`[AI Config] Using admin Gemini API key with model: ${geminiModel}`);
    } else {
      // Fallback to Lovable AI
      apiKey = Deno.env.get("LOVABLE_API_KEY") || null;
      apiEndpoint = "https://ai.gateway.lovable.dev/v1/chat/completions";
      finalModel = `google/${modelMap[requestedModel] || "gemini-2.5-flash"}`;
      provider = "lovable";
      console.log("[AI Config] Using Lovable AI fallback");
    }
  }

  return { apiKey, apiEndpoint, finalModel, provider };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
    const userIdentifier = userEmail !== "anonymous" ? userEmail : (userId || "anonymous");

    const body = await req.json();
    const { 
      videoUrl, 
      model = "gemini", 
      language = "Português",
      folderId = null
    } = body;

    if (!videoUrl) {
      throw new Error("videoUrl is required");
    }

    // Passo 2: Extrair videoId
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      throw new Error("Invalid YouTube URL");
    }

    console.log(`[Analyze Titles] Processing video: ${videoId}, Model: ${model}, Language: ${language}`);

    // Get AI configuration based on hierarchy
    const aiConfig = await getAIConfig(userId, supabaseAdmin, model);
    console.log(`[Analyze Titles] Using provider: ${aiConfig.provider}, model: ${aiConfig.finalModel}`);

    // Passo 3: Buscar YouTube API Key do usuário (fallback para dados básicos)
    let videoData: any = null;
    
    if (userId) {
      const { data: apiSettings } = await supabaseAdmin
        .from("user_api_settings")
        .select("youtube_api_key")
        .eq("user_id", userId)
        .single();
      
      if (apiSettings?.youtube_api_key) {
        try {
          videoData = await fetchYouTubeVideoData(videoId, apiSettings.youtube_api_key);
          console.log("[Analyze Titles] Fetched video data from YouTube API");
        } catch (err) {
          console.log("[Analyze Titles] YouTube API error, continuing without video data:", err);
        }
      }
    }

    // Calcular créditos
    let modelKey: 'base' | 'gemini' | 'claude' = 'base';
    if (model?.includes('gemini')) modelKey = 'gemini';
    else if (model?.includes('claude') || model?.includes('gpt')) modelKey = 'claude';
    
    const creditsNeeded = CREDIT_PRICING.TITLE_ANALYSIS[modelKey];

    // Verificar configuração de uso de créditos da plataforma
    let usePlatformCredits = true;
    if (userId) {
      const { data: userApiSettings } = await supabaseAdmin
        .from("user_api_settings")
        .select("use_platform_credits")
        .eq("user_id", userId)
        .maybeSingle();

      usePlatformCredits = userApiSettings?.use_platform_credits ?? true;
      console.log(`[Analyze Titles] User ${userId} usePlatformCredits: ${usePlatformCredits}`);
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

      // Debitar créditos
      await supabaseAdmin
        .from("user_credits")
        .update({ balance: currentBalance - creditsNeeded })
        .eq("user_id", userId);

      await supabaseAdmin.from("credit_usage").insert({
        user_id: userId,
        operation_type: "title_analysis",
        credits_used: creditsNeeded,
        model_used: `${aiConfig.provider}/${aiConfig.finalModel}`,
        details: { video_id: videoId, language, provider: aiConfig.provider }
      });
      
      console.log(`[Analyze Titles] Debited ${creditsNeeded} credits from user ${userId}`);
    } else if (userId && !usePlatformCredits) {
      console.log(`[Analyze Titles] User ${userId} using own API - no credits debited`);
    }

    // Passo 8: Construir prompt de análise conforme documentação
    const langLabel = language === "Português" ? "Português Brasileiro" : language === "English" ? "Inglês" : "Espanhol";
    
    const analysisPrompt = `Você é um especialista em análise de títulos virais para YouTube.

VÍDEO PARA ANALISAR:
- URL: ${videoUrl}
- Video ID: ${videoId}
${videoData ? `
- Título Original: "${videoData.title}"
- Visualizações: ${videoData.views?.toLocaleString() || "N/A"}
- Comentários: ${videoData.comments?.toLocaleString() || "N/A"}
- Dias no ar: ${videoData.daysAgo}
- Canal: ${videoData.channelTitle}
- Tags: ${videoData.tags?.slice(0, 10).join(", ") || "N/A"}
- Descrição (início): "${videoData.description?.substring(0, 300) || "N/A"}"
` : ""}

Analise este título e identifique:

1. FORMATO E ESTRUTURA DO TÍTULO ORIGINAL:
   - Detecte o formato exato: usa CAIXA ALTA? Usa separadores (| - : •)?
   - Tem sufixo padrão (ex: "- Documentário", "| REACT", "(LEGENDADO)")?
   - Qual a estrutura visual? (ex: "TEMA | SUBTEMA - Categoria")
   - CRÍTICO: Os títulos gerados DEVEM seguir este mesmo formato visual!

2. FÓRMULA DO TÍTULO:
   - Qual padrão/técnica ele usa? (pergunta, número, mistério, nome próprio, CAIXA ALTA, etc)
   - Por que essa fórmula funciona para este nicho?

3. NICHO E SUBNICHO:
   - Nicho principal detectado
   - Subnicho específico
   - Micronicho (se aplicável)

4. ELEMENTOS DE SUCESSO:
   - Por que este título viralizou?
   - Que gatilhos emocionais ativa?
   - Que curiosidade desperta?

5. GERE 5 TÍTULOS OTIMIZADOS:
   - OBRIGATÓRIO: Use o MESMO FORMATO VISUAL do original (separadores, caixa alta, sufixos)
   - Se o original usa "TEMA | SUBTEMA", os novos também devem
   - Se o original tem "- Documentário" no final, mantenha
   - Use a mesma fórmula identificada
   - Adapte para o idioma: ${langLabel}
   - Mantenha o impacto e curiosidade
   - Máximo 70 caracteres cada

Retorne APENAS em formato JSON válido:
{
  "originalTitle": "título original do vídeo",
  "translatedTitle": "título traduzido se necessário ou igual ao original",
  "titleFormat": {
    "usesUppercase": true/false,
    "separators": ["|", "-"],
    "suffix": "- Documentário" ou null,
    "structure": "TEMA | SUBTEMA - Categoria"
  },
  "videoStats": {
    "views": número,
    "comments": número,
    "days": número
  },
  "detectedNiche": "nicho principal",
  "detectedSubniche": "subnicho específico",
  "detectedMicroniche": "micronicho",
  "formula": "descrição da fórmula identificada",
  "whyItWorks": "explicação de por que este título funciona e viraliza",
  "titles": [
    {"title": "TÍTULO 1 NO MESMO FORMATO", "score": 95, "explanation": "Mantém estrutura X | Y com gatilho Z"},
    {"title": "TÍTULO 2 NO MESMO FORMATO", "score": 92, "explanation": "Variação usando mesmos separadores"},
    {"title": "TÍTULO 3 NO MESMO FORMATO", "score": 90, "explanation": "Combina elementos A e B no formato original"},
    {"title": "TÍTULO 4 NO MESMO FORMATO", "score": 88, "explanation": "Foco em gatilho W mantendo estrutura"},
    {"title": "TÍTULO 5 NO MESMO FORMATO", "score": 85, "explanation": "Alternativa respeitando o formato visual"}
  ]
}`;

    // Passo 9: Chamar API de IA usando a configuração dinâmica
    if (!aiConfig.apiKey) {
      throw new Error("No AI API key configured");
    }

    let aiResponse: Response;
    
    if (aiConfig.provider === "gemini") {
      // Google Gemini API has different format
      aiResponse = await fetch(aiConfig.apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: analysisPrompt }] }],
        }),
      });
    } else if (aiConfig.provider === "claude") {
      // Anthropic Claude API
      aiResponse = await fetch(aiConfig.apiEndpoint, {
        method: "POST",
        headers: {
          "x-api-key": aiConfig.apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: aiConfig.finalModel,
          max_tokens: 4096,
          messages: [{ role: "user", content: analysisPrompt }],
        }),
      });
    } else {
      // OpenAI-compatible format (OpenAI, Laozhang, Lovable AI)
      aiResponse = await fetch(aiConfig.apiEndpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${aiConfig.apiKey}`,
          "Content-Type": "application/json",
          "X-User-Identifier": userIdentifier,
          "HTTP-Referer": "https://viralgen.app",
          "X-Title": `ViralGen-${userIdentifier.split('@')[0] || 'user'}`
        },
        body: JSON.stringify({
          model: aiConfig.finalModel,
          messages: [{ role: "user", content: analysisPrompt }],
        }),
      });
    }

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[Analyze Titles] AI API error:", errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    
    // Extract content based on provider
    let aiContent = "";
    if (aiConfig.provider === "gemini") {
      aiContent = aiData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else if (aiConfig.provider === "claude") {
      aiContent = aiData.content?.[0]?.text || "";
    } else {
      aiContent = aiData.choices?.[0]?.message?.content || "";
    }

    console.log(`[Analyze Titles] AI response received from ${aiConfig.provider}, length: ${aiContent.length}`);

    // Parsear resposta JSON
    let analysis;
    try {
      // Tentar extrair JSON de markdown code blocks
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1].trim());
      } else {
        analysis = JSON.parse(aiContent);
      }
    } catch (parseError) {
      console.error("[Analyze Titles] Failed to parse AI response:", parseError);
      throw new Error("Failed to parse AI analysis response");
    }

    // Passo 10: Salvar no banco de dados
    if (userId) {
      // Salvar análise do vídeo
      const { data: analysisRecord, error: analysisError } = await supabaseAdmin
        .from("analyzed_videos")
        .insert({
          user_id: userId,
          youtube_video_id: videoId,
          video_url: videoUrl,
          original_title: analysis.originalTitle || videoData?.title,
          translated_title: analysis.translatedTitle,
          original_views: analysis.videoStats?.views || videoData?.views,
          original_comments: analysis.videoStats?.comments || videoData?.comments,
          original_days: analysis.videoStats?.days || videoData?.daysAgo,
          original_thumbnail_url: videoData?.thumbnailUrl,
          detected_niche: analysis.detectedNiche,
          detected_subniche: analysis.detectedSubniche,
          detected_microniche: analysis.detectedMicroniche,
          analysis_data_json: analysis,
          folder_id: folderId,
        })
        .select("id")
        .single();

      if (analysisError) {
        console.error("[Analyze Titles] Error saving analysis:", analysisError);
      } else if (analysisRecord && analysis.titles) {
        // Salvar títulos gerados
        const titlesToInsert = analysis.titles.map((t: any) => ({
          video_analysis_id: analysisRecord.id,
          user_id: userId,
          title_text: t.title,
          model_used: model,
          pontuacao: t.score || 0,
          explicacao: t.explanation || "",
          formula: analysis.formula,
        }));

        await supabaseAdmin.from("generated_titles").insert(titlesToInsert);
        console.log(`[Analyze Titles] Saved ${titlesToInsert.length} generated titles`);
      }
    }

    // Passo 11: Retornar resposta
    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          originalTitle: analysis.originalTitle || videoData?.title,
          translatedTitle: analysis.translatedTitle,
          videoStats: {
            views: analysis.videoStats?.views || videoData?.views || 0,
            comments: analysis.videoStats?.comments || videoData?.comments || 0,
            days: analysis.videoStats?.days || videoData?.daysAgo || 0,
            thumbnail: videoData?.thumbnailUrl
          },
          detectedNiche: analysis.detectedNiche,
          detectedSubniche: analysis.detectedSubniche,
          detectedMicroniche: analysis.detectedMicroniche,
          formula: analysis.formula,
          whyItWorks: analysis.whyItWorks
        },
        generatedTitles: (analysis.titles || []).map((t: any, idx: number) => ({
          id: idx,
          title: t.title,
          pontuacao: t.score,
          explicacao: t.explanation || analysis.formula
        })),
        creditsUsed: creditsNeeded
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[Analyze Titles] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
