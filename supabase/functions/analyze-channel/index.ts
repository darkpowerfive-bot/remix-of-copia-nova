import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Preços conforme documentação seção 4.2
const CREDIT_PRICING = {
  CHANNEL_ANALYSIS: { base: 5, gemini: 6, claude: 7 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Variáveis usadas também no catch (para permitir reembolso e resposta amigável)
  let supabaseAdmin: any = null;
  let debited = false;
  let debitedAmount = 0;
  let debitedUserId: string | null = null;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

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
      channelUrl,
      channelId,
      maxVideos = 10,
      model = "gemini"
    } = body;

    if (!channelUrl && !channelId) {
      throw new Error("channelUrl or channelId is required");
    }

    console.log(`[Analyze Channel] Processing channel: ${channelUrl || channelId}`);

    // Calcular créditos
    let modelKey: 'base' | 'gemini' | 'claude' = 'base';
    if (model?.includes('gemini')) modelKey = 'gemini';
    else if (model?.includes('claude') || model?.includes('gpt')) modelKey = 'claude';

    const creditsNeeded = CREDIT_PRICING.CHANNEL_ANALYSIS[modelKey];

    // Verificar configuração de uso de créditos da plataforma
    let usePlatformCredits = true;
    if (userId) {
      const { data: userApiSettings } = await supabaseAdmin
        .from("user_api_settings")
        .select("use_platform_credits")
        .eq("user_id", userId)
        .maybeSingle();

      usePlatformCredits = userApiSettings?.use_platform_credits ?? true;
      console.log(`[Analyze Channel] User ${userId} usePlatformCredits: ${usePlatformCredits}`);
    }

    // Verificar e debitar créditos - apenas se usa créditos da plataforma
    if (userId && usePlatformCredits) {
      const { data: creditData, error: creditError } = await supabaseAdmin
        .from("user_credits")
        .select("balance")
        .eq("user_id", userId)
        .maybeSingle();

      if (creditError) {
        console.error("[Analyze Channel] Error fetching credits:", creditError);
        throw new Error("Erro ao verificar créditos");
      }

      const currentBalance = creditData?.balance ?? 50;

      if (currentBalance < creditsNeeded) {
        return new Response(
          JSON.stringify({ success: false, error: `Créditos insuficientes. Necessário: ${creditsNeeded}, Disponível: ${currentBalance}` }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      await supabaseAdmin
        .from("user_credits")
        .update({ balance: currentBalance - creditsNeeded })
        .eq("user_id", userId);

      await supabaseAdmin.from("credit_usage").insert({
        user_id: userId,
        operation_type: "channel_analysis",
        credits_used: creditsNeeded,
        model_used: model,
        details: { channel_url: channelUrl, max_videos: maxVideos },
      });

      debited = true;
      debitedAmount = creditsNeeded;
      debitedUserId = userId;
      
      console.log(`[Analyze Channel] Debited ${creditsNeeded} credits from user ${userId}`);
    } else if (userId && !usePlatformCredits) {
      console.log(`[Analyze Channel] User ${userId} using own API - no credits debited`);
    }

    // Buscar YouTube API Key do usuário se disponível
    let channelData: any = null;
    
    if (userId) {
      const { data: apiSettings, error: apiSettingsError } = await supabaseAdmin
        .from("user_api_settings")
        .select("youtube_api_key")
        .eq("user_id", userId)
        .maybeSingle();

      if (apiSettingsError) {
        console.log("[Analyze Channel] Could not load user_api_settings:", apiSettingsError);
      }

      if (apiSettings?.youtube_api_key) {
        try {
          // Extrair channel ID da URL se necessário
          let targetChannelId = channelId;
          let targetHandle: string | null = null;
          
          if (!targetChannelId && channelUrl) {
            // Tentar extrair ID do canal do formato /channel/UCxxxxxx
            const channelIdMatch = channelUrl.match(/\/channel\/([A-Za-z0-9_-]+)/);
            if (channelIdMatch) {
              targetChannelId = channelIdMatch[1];
            } else {
              // Tentar extrair handle do formato /@handle ou /c/nome
              const handleMatch = channelUrl.match(/@([^\/\?]+)/);
              if (handleMatch) {
                targetHandle = handleMatch[1];
              } else {
                const cMatch = channelUrl.match(/\/c\/([^\/\?]+)/);
                if (cMatch) {
                  targetHandle = cMatch[1];
                }
              }
            }
          }

          console.log(`[Analyze Channel] Extracted ID: ${targetChannelId}, Handle: ${targetHandle}`);

          // Se temos um handle, precisamos buscar o channel ID primeiro
          if (targetHandle && !targetChannelId) {
            const searchResponse = await fetch(
              `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(targetHandle)}&type=channel&maxResults=1&key=${apiSettings.youtube_api_key}`
            );
            
            if (searchResponse.ok) {
              const searchData = await searchResponse.json();
              if (searchData.items && searchData.items.length > 0) {
                targetChannelId = searchData.items[0].snippet.channelId;
                console.log(`[Analyze Channel] Found channel ID from handle: ${targetChannelId}`);
              }
            }
          }

          if (targetChannelId) {
            // Buscar dados do canal
            const channelResponse = await fetch(
              `https://www.googleapis.com/youtube/v3/channels?id=${targetChannelId}&part=snippet,statistics,brandingSettings,contentDetails&key=${apiSettings.youtube_api_key}`
            );
            
            if (channelResponse.ok) {
              const data = await channelResponse.json();
              if (data.items && data.items.length > 0) {
                const channel = data.items[0];
                channelData = {
                  name: channel.snippet.title,
                  description: channel.snippet.description,
                  customUrl: channel.snippet.customUrl,
                  country: channel.snippet.country,
                  subscriberCount: parseInt(channel.statistics.subscriberCount || "0"),
                  videoCount: parseInt(channel.statistics.videoCount || "0"),
                  viewCount: parseInt(channel.statistics.viewCount || "0"),
                  thumbnailUrl: channel.snippet.thumbnails?.high?.url,
                  keywords: channel.brandingSettings?.channel?.keywords,
                  channelId: targetChannelId
                };

                // Buscar vídeos recentes do canal para análise mais profunda
                const videosResponse = await fetch(
                  `https://www.googleapis.com/youtube/v3/search?channelId=${targetChannelId}&part=snippet&type=video&order=date&maxResults=${maxVideos}&key=${apiSettings.youtube_api_key}`
                );
                
                if (videosResponse.ok) {
                  const videosData = await videosResponse.json();
                  if (videosData.items && videosData.items.length > 0) {
                    channelData.recentVideos = videosData.items.map((v: any) => ({
                      title: v.snippet.title,
                      description: v.snippet.description?.substring(0, 200),
                      publishedAt: v.snippet.publishedAt
                    }));
                  }
                }

                console.log(`[Analyze Channel] Found channel: ${channelData.name} with ${channelData.subscriberCount} subs`);
              }
            } else {
              console.log(`[Analyze Channel] Channel API response not OK: ${channelResponse.status}`);
            }
          }
        } catch (err) {
          console.log("[Analyze Channel] YouTube API error:", err);
        }
      } else {
        console.log("[Analyze Channel] No YouTube API key configured for user");
      }
    }

    // Construir prompt de análise com dados reais
    let channelContext = "";
    if (channelData) {
      channelContext = `
DADOS REAIS DO CANAL (API YouTube):
- Nome: ${channelData.name}
- Inscritos: ${channelData.subscriberCount?.toLocaleString()}
- Total de Vídeos: ${channelData.videoCount?.toLocaleString()}
- Views Totais: ${channelData.viewCount?.toLocaleString()}
- País: ${channelData.country || "Não informado"}
- Palavras-chave: ${channelData.keywords || "Não disponível"}
- Descrição: ${channelData.description?.substring(0, 500) || "Sem descrição"}

${channelData.recentVideos ? `
ÚLTIMOS ${channelData.recentVideos.length} VÍDEOS:
${channelData.recentVideos.map((v: any, i: number) => `${i + 1}. "${v.title}" (${v.publishedAt?.split('T')[0]})`).join('\n')}
` : ""}`;
    } else {
      channelContext = `
⚠️ ATENÇÃO: Não foi possível obter dados reais do canal.
Motivo provável: Chave YouTube API não configurada ou URL inválida.
A análise abaixo é baseada apenas na URL/nome fornecido.`;
    }

    const analysisPrompt = `Analise este canal do YouTube e forneça insights estratégicos DETALHADOS:

CANAL: ${channelUrl || channelId}
${channelContext}

Forneça uma análise PROFUNDA e ACIONÁVEL:

1. ANÁLISE DO CANAL:
   - Nicho e subnicho exatos
   - Proposta de valor
   - Público-alvo provável
   - Estilo de conteúdo

2. PONTOS FORTES E FRACOS:
   - O que o canal faz bem
   - Onde pode melhorar
   - Gaps identificados

3. ESTRATÉGIAS DE SUCESSO:
   - Padrões nos títulos que funcionam
   - Frequência de postagem
   - Formatos populares

4. OPORTUNIDADES DE MERCADO:
   - Tendências não exploradas
   - Conteúdos que faltam
   - Como se diferenciar

5. PLANO ESTRATÉGICO PARA COMPETIR:
   - Posicionamento recomendado
   - Ideias de conteúdo específicas
   - Ações imediatas (Quick Wins)

6. INSIGHTS VALIOSOS PARA O CRIADOR:
   - Minutagem ideal dos vídeos (baseado no nicho e padrões de sucesso)
   - Melhores horários para postar (horários específicos como "14:00", "19:00")
   - Melhores dias para postar (ex: "Segunda", "Quarta", "Sexta")
   - 5 títulos de exemplo virais que o usuário pode usar
   - Dicas específicas de thumbnails para o nicho
   - Insights sobre a audiência

Retorne APENAS um JSON válido:
{
  "channelInfo": {
    "name": "${channelData?.name || 'Nome estimado'}",
    "niche": "nicho principal",
    "subniche": "subnicho específico",
    "positioning": "como o canal se posiciona",
    "targetAudience": "público-alvo"
  },
  "metrics": {
    "subscribers": ${channelData?.subscriberCount || 0},
    "videos": ${channelData?.videoCount || 0},
    "totalViews": ${channelData?.viewCount || 0},
    "avgViewsPerVideo": número estimado,
    "postingFrequency": "frequência estimada (ex: 3x por semana)",
    "engagementLevel": "alto/médio/baixo"
  },
  "strengths": ["ponto forte 1", "ponto forte 2", "ponto forte 3"],
  "weaknesses": ["fraqueza 1", "fraqueza 2", "fraqueza 3"],
  "successPatterns": {
    "titlePatterns": ["padrão de título 1", "padrão 2"],
    "videoFormats": ["formato 1", "formato 2"],
    "thumbnailStyle": "descrição do estilo"
  },
  "opportunities": [
    {"type": "Gap de conteúdo", "description": "descrição", "priority": "Alta"},
    {"type": "Tendência", "description": "descrição", "priority": "Média"}
  ],
  "strategicPlan": {
    "positioning": "como se posicionar para competir",
    "uniqueValue": "proposta de valor única recomendada",
    "contentStrategy": "estratégia de conteúdo detalhada",
    "contentIdeas": ["ideia específica 1", "ideia 2", "ideia 3", "ideia 4", "ideia 5"],
    "differentials": ["diferencial 1", "diferencial 2", "diferencial 3"],
    "recommendations": ["recomendação acionável 1", "recomendação 2", "recomendação 3"],
    "postingSchedule": "ex: 3 vídeos por semana - Segunda, Quarta, Sexta",
    "growthTimeline": "3 meses: X inscritos | 6 meses: Y inscritos | 12 meses: Z inscritos"
  },
  "insights": {
    "idealVideoDuration": "8-12 minutos (ideal para retenção e monetização)",
    "bestPostingTimes": ["14:00", "19:00", "21:00"],
    "bestPostingDays": ["Segunda", "Quarta", "Sexta"],
    "exampleTitles": [
      "Título viral 1 usando fórmulas de sucesso do nicho",
      "Título viral 2 com gatilho mental forte",
      "Título viral 3 com número e promessa",
      "Título viral 4 baseado em padrões do canal",
      "Título viral 5 com gancho de curiosidade"
    ],
    "thumbnailTips": ["dica específica 1", "dica 2", "dica 3"],
    "audienceInsights": "Descrição do perfil da audiência e comportamentos",
    "strategicKeywords": [
      "palavra-chave principal do nicho",
      "termo de busca com alto volume",
      "keyword long-tail específica",
      "termo trending no nicho",
      "palavra-chave de intenção comercial",
      "termo para SEO de títulos",
      "hashtag relevante",
      "termo para descrição"
    ]
  },
  "quickWins": ["ação imediata 1", "ação 2", "ação 3"],
  "summary": "Resumo executivo em 2-3 frases",
  "dataSource": "${channelData ? 'API YouTube (dados reais)' : 'Análise baseada na URL (sem dados reais)'}"
}`;

    // Buscar chaves de API do admin (Laozhang como fallback)
    const { data: adminSettings } = await supabaseAdmin
      .from("admin_settings")
      .select("value")
      .eq("key", "api_keys")
      .maybeSingle();

    const adminKeys = (adminSettings?.value as Record<string, unknown>) || {};
    const adminLaozhangKey = typeof adminKeys.laozhang === "string" ? (adminKeys.laozhang as string) : "";
    const adminLaozhangValidated = !!adminKeys.laozhang_validated;

    const requestedModel = String(model || "").toLowerCase();
    const laozhangModel = requestedModel.includes("gpt")
      ? "gpt-4o"
      : requestedModel.includes("claude")
        ? "claude-3-5-sonnet-20241022"
        : "gemini-2.0-flash-001";
    // Função para chamar a API de IA com fallback
    async function callAI(prompt: string): Promise<string> {
      // 1) Tentar Laozhang (admin) primeiro (se disponível e validado)
      if (adminLaozhangKey && adminLaozhangValidated) {
        try {
          console.log("[Analyze Channel] Trying Laozhang AI...");
          const response = await fetch("https://api.laozhang.ai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${adminLaozhangKey}`,
              "Content-Type": "application/json",
              "X-User-Identifier": userIdentifier,
              "HTTP-Referer": "https://viralgen.app",
              "X-Title": `ViralGen-${userIdentifier.split('@')[0] || 'user'}`
            },
            body: JSON.stringify({
              model: laozhangModel,
              messages: [{ role: "user", content: prompt }],
            }),
          });

          if (response.ok) {
            const data = await response.json();
            console.log("[Analyze Channel] Laozhang AI success");
            return data.choices?.[0]?.message?.content || "";
          }

          // Rate limit: cair para o fallback
          if (response.status === 429) {
            console.log("[Analyze Channel] Laozhang rate limited (429), falling back...");
          } else {
            const t = await response.text();
            console.log("[Analyze Channel] Laozhang failed:", response.status, t);
          }
        } catch (err) {
          console.log("[Analyze Channel] Laozhang error:", err);
        }
      } else {
        console.log("[Analyze Channel] Admin Laozhang key not available/validated, using fallback...");
      }

      // 2) Fallback para Lovable AI
      console.log("[Analyze Channel] Trying Lovable AI...");
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Analyze Channel] Lovable AI error:", response.status, errorText);

        if (response.status === 402) {
          throw { code: "AI_CREDITS", status: 402, message: "Sem créditos de IA disponíveis no workspace no momento." };
        }
        if (response.status === 429) {
          throw { code: "AI_RATE_LIMIT", status: 429, message: "Limite de requisições de IA atingido. Aguarde e tente novamente." };
        }

        throw new Error(`AI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || "";
    }

    // Chamar API de IA com fallback
    const aiContent = await callAI(analysisPrompt);

    // Parsear resposta JSON
    let analysis;
    try {
      const jsonMatch = aiContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[1].trim());
      } else {
        analysis = JSON.parse(aiContent);
      }
    } catch (parseError) {
      console.error("[Analyze Channel] Failed to parse AI response:", parseError);
      throw new Error("Failed to parse AI analysis response");
    }

    console.log("[Analyze Channel] Analysis completed successfully");

    // Retornar resposta
    return new Response(
      JSON.stringify({
        success: true,
        analysis,
        creditsUsed: creditsNeeded
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[Analyze Channel] Error:", error);

    // Reembolsar créditos do usuário se a operação falhar após o débito
    if (debited && debitedUserId && debitedAmount > 0) {
      try {
        const { data: creditRow } = await supabaseAdmin
          .from("user_credits")
          .select("balance")
          .eq("user_id", debitedUserId)
          .maybeSingle();

        const current = creditRow?.balance ?? 0;
        await supabaseAdmin
          .from("user_credits")
          .update({ balance: current + debitedAmount })
          .eq("user_id", debitedUserId);

        await supabaseAdmin.from("credit_transactions").insert({
          user_id: debitedUserId,
          amount: debitedAmount,
          transaction_type: "refund",
          description: "Reembolso - falha na análise de concorrência",
        });

        console.log(`[Analyze Channel] Refunded ${debitedAmount} credits to user ${debitedUserId}`);
      } catch (refundErr) {
        console.error("[Analyze Channel] Refund failed:", refundErr);
      }
    }

    const errAny = error as any;
    const code = typeof errAny?.code === "string" ? errAny.code : undefined;
    const message = typeof errAny?.message === "string"
      ? errAny.message
      : error instanceof Error
        ? error.message
        : "Unknown error";

    // Para evitar tela branca/erro no client: devolver 200 com payload de erro "controlado"
    if (code === "AI_CREDITS" || code === "AI_RATE_LIMIT") {
      return new Response(
        JSON.stringify({ success: false, error: message, code }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const status = typeof errAny?.status === "number" ? errAny.status : 500;
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
