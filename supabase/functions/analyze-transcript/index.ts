import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Preços conforme documentação seção 4.2
const CREDIT_PRICING = {
  TRANSCRIPTION_BASE: { base: 2, gemini: 3, claude: 4 }, // Até 10 min
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Extrair userId
    let userId: string | null = null;
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      const { data: { user } } = await supabaseAdmin.auth.getUser(token);
      userId = user?.id || null;
    }

    const body = await req.json();
    const { 
      transcript,
      videoUrl,
      title = "",
      niche = "",
      subniche = "",
      model = "gemini",
      durationMinutes = 10
    } = body;

    if (!transcript) {
      throw new Error("transcript is required");
    }

    console.log(`[Analyze Transcript] Processing transcript with ${transcript.length} characters`);

    // Calcular créditos baseado na duração
    let modelKey: 'base' | 'gemini' | 'claude' = 'base';
    if (model?.includes('gemini')) modelKey = 'gemini';
    else if (model?.includes('claude') || model?.includes('gpt')) modelKey = 'claude';

    const durationMultiplier = Math.ceil(durationMinutes / 10);
    const creditsNeeded = CREDIT_PRICING.TRANSCRIPTION_BASE[modelKey] * durationMultiplier;

    // Verificar e debitar créditos
    if (userId) {
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
        operation_type: "transcript_analysis",
        credits_used: creditsNeeded,
        model_used: model,
        details: { duration_minutes: durationMinutes, video_url: videoUrl }
      });
    }

    // Construir prompt de análise conforme documentação seção 7
    const analysisPrompt = `Analise esta transcrição de vídeo do YouTube e extraia insights virais:

TRANSCRIÇÃO:
"${transcript.substring(0, 8000)}"

TÍTULO: "${title || 'Não fornecido'}"
NICHO: "${niche}"
SUBNICHE: "${subniche}"

Analise e identifique:

1. PONTOS PRINCIPAIS:
   - Quais são os 3-5 pontos principais do vídeo?
   - Que informações chave são apresentadas?

2. PADRÕES VIRAIS:
   - Que técnicas de retenção são usadas?
   - Como mantém o espectador engajado?
   - Que gatilhos emocionais são ativados?

3. ESTRUTURA NARRATIVA:
   - Como está organizado o conteúdo?
   - Qual o ritmo de revelação de informações?
   - Como constrói e resolve tensão?

4. HOOKS IDENTIFICADOS:
   - Quais ganchos de abertura são usados?
   - Que promessas são feitas ao espectador?

5. SUGESTÕES DE MELHORIA:
   - O que poderia ser melhorado?
   - Que elementos faltam para maior viralização?

6. FÓRMULA DO ROTEIRO:
   - Qual a fórmula identificada neste roteiro?
   - Estrutura: Hook → Desenvolvimento → Clímax → CTA

Retorne em JSON:
{
  "mainPoints": ["ponto 1", "ponto 2", "ponto 3", "ponto 4", "ponto 5"],
  "viralPatterns": ["padrão 1", "padrão 2", "padrão 3"],
  "narrativeStructure": "descrição detalhada da estrutura narrativa",
  "hooks": ["hook 1", "hook 2"],
  "emotionalTriggers": ["gatilho 1", "gatilho 2", "gatilho 3"],
  "improvements": ["sugestão 1", "sugestão 2", "sugestão 3"],
  "formula": {
    "name": "Nome da fórmula identificada",
    "structure": {
      "hook": "Descrição do hook usado",
      "development": "Como o conteúdo se desenvolve",
      "climax": "Onde está o clímax",
      "cta": "Como é feita a chamada para ação"
    },
    "mentalTriggers": ["Curiosidade", "Urgência", "Prova Social"]
  },
  "retentionScore": 85,
  "viralPotential": "alto/médio/baixo"
}`;

    // Chamar API de IA
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: analysisPrompt }],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("[Analyze Transcript] AI API error:", errorText);
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiContent = aiData.choices?.[0]?.message?.content || "";

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
      console.error("[Analyze Transcript] Failed to parse AI response:", parseError);
      throw new Error("Failed to parse AI analysis response");
    }

    console.log("[Analyze Transcript] Analysis completed successfully");

    // Retornar resposta
    return new Response(
      JSON.stringify({
        success: true,
        analysis: {
          mainPoints: analysis.mainPoints || [],
          viralPatterns: analysis.viralPatterns || [],
          narrativeStructure: analysis.narrativeStructure || "",
          hooks: analysis.hooks || [],
          emotionalTriggers: analysis.emotionalTriggers || [],
          improvements: analysis.improvements || [],
          formula: analysis.formula || null,
          retentionScore: analysis.retentionScore || 0,
          viralPotential: analysis.viralPotential || "médio"
        },
        creditsUsed: creditsNeeded
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[Analyze Transcript] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
