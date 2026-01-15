import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, category, language = "pt-BR", productName, productUrl, productCta } = await req.json();

    if (!topic) {
      return new Response(
        JSON.stringify({ error: "Tópico é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[Blog Article] Generating for:", topic, "category:", category, "product:", productName);

    // Get API keys from environment
    const LAOZHANG_API_KEY = Deno.env.get("LAOZHANG_API_KEY");
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

    if (!LAOZHANG_API_KEY && !OPENAI_API_KEY) {
      throw new Error("Nenhuma chave de API disponível. Configure LAOZHANG_API_KEY ou OPENAI_API_KEY.");
    }

    const systemPrompt = `Você é um jornalista especializado e escritor premiado em marketing digital e criação de conteúdo para YouTube. 
Escreva artigos de blog excepcionalmente bem formatados, profissionais e otimizados para SEO.
O conteúdo deve ser informativo, envolvente, profundo e prático.
Use uma linguagem acessível mas profissional, com tom de autoridade.
Sempre inclua exemplos práticos, dicas acionáveis e insights únicos.
${productName ? `IMPORTANTE: Mencione e recomende o produto "${productName}" de forma natural e persuasiva no artigo, inserindo-o no contexto mais relevante. Apresente-o como uma solução essencial para o leitor.` : ''}`;

    const userPrompt = `Escreva um artigo de blog COMPLETO, BEM FORMATADO e com EXCELENTE LEGIBILIDADE sobre: "${topic}"
Categoria: ${category || "YouTube"}
Idioma: ${language}

📋 ESTRUTURA OBRIGATÓRIA DO ARTIGO:

1. INTRODUÇÃO IMPACTANTE (2-3 parágrafos bem espaçados)
   - Hook que prende a atenção imediatamente
   - Contextualização do problema/tema
   - Promessa clara do que o leitor vai aprender

2. DESENVOLVIMENTO (6-10 seções com H2)
   - Cada seção deve ter título atraente
   - Subsections com H3 quando necessário
   - Mínimo 3 parágrafos por seção
   - IMPORTANTE: Deixe espaço visual entre cada elemento

3. CONCLUSÃO FORTE
   - Resumo dos pontos principais
   - Call-to-action claro

📝 REGRAS DE FORMATAÇÃO HTML (OBRIGATÓRIO - FOCO EM LEGIBILIDADE):

- Use <h2> para TODAS as seções principais (com texto impactante, não genérico)
- Use <h3> para subseções dentro de cada h2
- CRÍTICO: Cada parágrafo <p> deve ter APENAS 2-4 frases. Parágrafos curtos facilitam a leitura!
- NUNCA junte muitas informações em um único parágrafo. Divida em múltiplos parágrafos menores.
- Use <strong> para destacar termos importantes (1-2 por parágrafo, não exagere)
- Use <em> para ênfase sutil
- LISTAS são obrigatórias: use <ul><li> ou <ol><li> em pelo menos 4 seções
- Cada item de lista deve ser uma ideia separada
- Use <blockquote> para citações ou insights importantes (mínimo 2 no artigo)
- IMPORTANTE: Adicione quebras naturais entre seções para criar "respiro" visual

📐 EXEMPLO DE FORMATAÇÃO CORRETA COM BOA LEGIBILIDADE:

<h2>Por Que Este Tema é Crucial para Seu Sucesso</h2>

<p>Texto introdutório curto e direto ao ponto. <strong>Destaque o mais importante</strong> logo no início.</p>

<p>Segundo parágrafo expandindo a ideia. Mantenha entre 2-4 frases apenas.</p>

<p>Terceiro parágrafo com mais contexto. Observe como cada parágrafo é separado.</p>

<h3>Aspecto Específico do Tema</h3>

<p>Explicação do subtópico. Parágrafos curtos são mais fáceis de ler.</p>

<ul>
<li><strong>Ponto 1:</strong> Explicação clara e objetiva do primeiro ponto</li>
<li><strong>Ponto 2:</strong> Cada item deve ser uma ideia completa mas concisa</li>
<li><strong>Ponto 3:</strong> Evite itens muito longos nas listas</li>
</ul>

<p>Parágrafo de transição após a lista.</p>

<blockquote>Insight importante que merece destaque visual. Use para frases de impacto ou conclusões parciais.</blockquote>

<p>Continuação do conteúdo após o blockquote.</p>

🎯 RESPONDA APENAS COM JSON VÁLIDO:

{
  "title": "Título do artigo (máximo 60 caracteres, otimizado para SEO, impactante)",
  "slug": "slug-do-artigo-em-kebab-case",
  "excerpt": "Resumo envolvente em 2-3 frases (máximo 160 caracteres)",
  "content": "Conteúdo HTML completo seguindo TODAS as regras acima. Mínimo 2000 palavras. PARÁGRAFOS CURTOS!",
  "meta_description": "Meta description persuasiva para SEO (máximo 160 caracteres)",
  "meta_keywords": ["keyword-1", "keyword-2", "keyword-3", "keyword-4", "keyword-5"],
  "read_time": "X min"
}

⚠️ CRÍTICO:
- Conteúdo DEVE ser HTML válido e bem estruturado
- MÍNIMO 2000 palavras no content
- OBRIGATÓRIO usar h2, h3, strong, listas e blockquotes
- NÃO use markdown, apenas HTML
- PARÁGRAFOS CURTOS (2-4 frases) para máxima legibilidade
- Responda APENAS com o JSON, sem explicações`;

    let data;
    
    // Priority: Laozhang > OpenAI
    if (LAOZHANG_API_KEY) {
      console.log("[Blog Article] Using Laozhang API");
      
      const response = await fetch("https://api.laozhang.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${LAOZHANG_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 8000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Blog Article] Laozhang error:", response.status, errorText);
        throw new Error(`Laozhang API error: ${response.status}`);
      }

      data = await response.json();
    } else {
      console.log("[Blog Article] Using OpenAI API");
      
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.7,
          max_tokens: 8000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[Blog Article] OpenAI error:", response.status, errorText);
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      data = await response.json();
    }

    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content generated");
    }

    console.log("[Blog Article] Parsing JSON response...");

    let articleData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        articleData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("[Blog Article] Parse error:", parseError);
      throw new Error("Failed to parse article data");
    }

    console.log("[Blog Article] Success:", articleData.title);

    return new Response(
      JSON.stringify({ success: true, article: articleData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[Blog Article] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
