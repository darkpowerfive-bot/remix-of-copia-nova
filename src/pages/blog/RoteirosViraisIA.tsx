import { Link } from "react-router-dom";
import { ArrowLeft, Clock, Calendar, User, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/seo/SEOHead";
import { RelatedArticles } from "@/components/blog/RelatedArticles";
import coverImage from "@/assets/blog/roteiros-virais-ia.jpg";

const RoteirosViraisIA = () => {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Como Criar Roteiros Virais com Inteligência Artificial em 2025",
    "description": "Aprenda a usar IA para criar roteiros de vídeo que viralizam no YouTube.",
    "author": { "@type": "Organization", "name": "La Casa Dark CORE" },
    "publisher": { "@type": "Organization", "name": "La Casa Dark CORE" },
    "datePublished": "2025-01-07"
  };

  return (
    <>
      <SEOHead
        title="Como Criar Roteiros Virais com IA em 2025"
        description="Domine a arte de criar roteiros virais usando inteligência artificial. Técnicas, prompts e estruturas que geram milhões de views no YouTube."
        canonical="/blog/roteiros-virais-ia"
        ogType="article"
        keywords="roteiros virais, roteiro com ia, chatgpt roteiro, script youtube, como fazer roteiro viral"
        jsonLd={articleJsonLd}
      />
      
      <div className="min-h-screen bg-background">
        <header className="border-b border-border/50 bg-background/95 backdrop-blur sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/blog" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-4 h-4" />
                Voltar ao Blog
              </Link>
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="w-4 h-4" />
                Compartilhar
              </Button>
            </div>
          </div>
        </header>

        <article className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />7 de Janeiro, 2025</span>
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />18 min de leitura</span>
            <span className="flex items-center gap-1"><User className="w-4 h-4" />Equipe La Casa Dark</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Como Criar Roteiros Virais com Inteligência Artificial
          </h1>

          <div className="aspect-video rounded-2xl mb-8 overflow-hidden border border-border/50">
            <img src={coverImage} alt="Como Criar Roteiros Virais com Inteligência Artificial" className="w-full h-full object-cover" />
          </div>

          <div className="prose prose-lg prose-invert max-w-none">
            <p className="text-xl text-muted-foreground leading-relaxed">
              A inteligência artificial revolucionou a criação de conteúdo. Aprenda a usar IA de forma 
              estratégica para criar roteiros que capturam atenção e geram milhões de visualizações.
            </p>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Por que usar IA para Roteiros?</h2>
            <p className="text-muted-foreground leading-relaxed">
              Criar roteiros manualmente pode levar horas. Com IA, você pode:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Gerar ideias infinitas em segundos</li>
              <li>Estruturar roteiros seguindo fórmulas comprovadas</li>
              <li>Adaptar tom e estilo para seu nicho</li>
              <li>Escalar produção sem perder qualidade</li>
              <li>Testar múltiplas abordagens rapidamente</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">A Estrutura de um Roteiro Viral</h2>
            <p className="text-muted-foreground leading-relaxed">
              Vídeos virais seguem uma estrutura psicologicamente eficaz:
            </p>

            <div className="bg-card border border-border/50 rounded-xl p-6 my-6">
              <h3 className="font-bold text-lg mb-4">🎯 Hook (0-5 segundos)</h3>
              <p className="text-muted-foreground">
                A frase de abertura mais importante. Deve criar curiosidade imediata ou prometer 
                uma transformação. Exemplos: "O que vou te mostrar agora pode mudar sua vida" ou 
                "Você nunca imaginou que isso era possível".
              </p>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-6 my-6">
              <h3 className="font-bold text-lg mb-4">🔥 Tensão (5-30 segundos)</h3>
              <p className="text-muted-foreground">
                Amplifique o hook com contexto. Estabeleça stakes, crie urgência. 
                "Milhões de pessoas fazem isso errado todos os dias..."
              </p>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-6 my-6">
              <h3 className="font-bold text-lg mb-4">📖 História (30s-8min)</h3>
              <p className="text-muted-foreground">
                Desenvolva a narrativa com altos e baixos. Use técnicas de storytelling: 
                conflito, personagens, obstáculos, reviravoltas.
              </p>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-6 my-6">
              <h3 className="font-bold text-lg mb-4">💥 Clímax (8-9min)</h3>
              <p className="text-muted-foreground">
                O momento de maior impacto emocional. A revelação, a transformação, a conclusão surpreendente.
              </p>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-6 my-6">
              <h3 className="font-bold text-lg mb-4">🎬 CTA (9-10min)</h3>
              <p className="text-muted-foreground">
                Direcione o espectador: inscreva-se, comente, veja o próximo vídeo. 
                Conecte com o próximo conteúdo para aumentar retenção no canal.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Prompts que Funcionam</h2>
            <p className="text-muted-foreground leading-relaxed">
              A qualidade do output depende da qualidade do input. Aqui estão frameworks de prompts eficazes:
            </p>

            <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 my-8">
              <h3 className="text-lg font-bold mb-3 text-primary">Prompt para Hook</h3>
              <code className="text-sm text-muted-foreground block">
                "Crie 10 hooks para um vídeo sobre [TEMA]. Os hooks devem criar curiosidade imediata, 
                usar gatilhos mentais como escassez ou prova social, e ter no máximo 15 palavras. 
                Formato: frases diretas, tom [FORMAL/INFORMAL/DRAMÁTICO]."
              </code>
            </div>

            <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 my-8">
              <h3 className="text-lg font-bold mb-3 text-primary">Prompt para Roteiro Completo</h3>
              <code className="text-sm text-muted-foreground block">
                "Crie um roteiro de [X] minutos sobre [TEMA] para canal de [NICHO]. Estrutura: 
                Hook (5s), Tensão (25s), Desenvolvimento com 3 pontos principais (7min), Clímax (1min), 
                CTA (30s). Tom: [TOM]. Inclua marcações de tempo e sugestões de imagens para cada seção."
              </code>
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Gatilhos Mentais que Viralizam</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Curiosidade:</strong> "Você nunca vai acreditar no que aconteceu..."</li>
              <li><strong>Medo:</strong> "O erro que 90% das pessoas cometem..."</li>
              <li><strong>Ganância:</strong> "Como ele fez R$100k em 30 dias..."</li>
              <li><strong>Prova social:</strong> "Milhões de pessoas já descobriram..."</li>
              <li><strong>Escassez:</strong> "Poucas pessoas sabem disso..."</li>
              <li><strong>Urgência:</strong> "Antes que seja tarde demais..."</li>
              <li><strong>Novidade:</strong> "Acabou de ser descoberto..."</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Erros Comuns ao Usar IA</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Usar output sem editar:</strong> IA gera base, você refina</li>
              <li><strong>Prompts genéricos:</strong> Quanto mais específico, melhor o resultado</li>
              <li><strong>Ignorar seu nicho:</strong> Adapte o tom para sua audiência</li>
              <li><strong>Não iterar:</strong> Peça variações, combine ideias, refine</li>
              <li><strong>Esquecer a emoção:</strong> IA é lógica, adicione emoção humana</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Ferramentas Recomendadas</h2>
            <p className="text-muted-foreground leading-relaxed">
              Diferentes IAs têm diferentes forças:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>GPT-4:</strong> Melhor para narrativas complexas e criatividade</li>
              <li><strong>Claude:</strong> Excelente para roteiros longos e coerentes</li>
              <li><strong>Gemini:</strong> Bom para pesquisa e dados atualizados</li>
              <li><strong>La Casa Dark CORE:</strong> Especializado em roteiros para YouTube, 
              com templates otimizados para nichos específicos</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Conclusão</h2>
            <p className="text-muted-foreground leading-relaxed">
              IA é uma ferramenta poderosa, mas não substitui criatividade humana. Use-a para 
              acelerar seu processo, não para substituí-lo. Os melhores criadores combinam 
              eficiência da IA com toque pessoal único.
            </p>
          </div>

          <div className="mt-12 p-8 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl border border-primary/30 text-center">
            <h3 className="text-2xl font-bold mb-4">Crie roteiros virais em minutos</h3>
            <p className="text-muted-foreground mb-6">
              A La Casa Dark CORE usa IA especializada para gerar roteiros otimizados para seu nicho.
            </p>
            <Link to="/auth">
              <Button size="lg">Testar Gerador de Roteiros</Button>
            </Link>
          </div>

          <RelatedArticles currentSlug="roteiros-virais-ia" currentCategory="Roteiros" />
        </article>

        <footer className="border-t border-border/50 py-8 mt-12">
          <div className="container mx-auto px-4 text-center text-muted-foreground">
            <p>© 2025 La Casa Dark CORE. Todos os direitos reservados.</p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default RoteirosViraisIA;
