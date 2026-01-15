import { Link } from "react-router-dom";
import { ArrowLeft, Clock, Calendar, User, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/seo/SEOHead";
import { RelatedArticles } from "@/components/blog/RelatedArticles";
import coverImage from "@/assets/blog/shorts-virais.jpg";

const ShortsVirais = () => {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Como Fazer Shorts Virais no YouTube em 2025",
    "description": "Guia completo para criar Shorts que viralizam e aceleram o crescimento do seu canal.",
    "author": { "@type": "Organization", "name": "La Casa Dark CORE" },
    "publisher": { "@type": "Organization", "name": "La Casa Dark CORE" },
    "datePublished": "2025-01-07"
  };

  return (
    <>
      <SEOHead
        title="Como Fazer Shorts Virais no YouTube em 2025"
        description="Aprenda a criar YouTube Shorts que viralizam. Técnicas, formatos e estratégias para crescer rapidamente com vídeos curtos."
        canonical="/blog/shorts-virais"
        ogType="article"
        keywords="youtube shorts, shorts virais, como fazer shorts, videos curtos youtube, shorts monetização"
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
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />14 min de leitura</span>
            <span className="flex items-center gap-1"><User className="w-4 h-4" />Equipe La Casa Dark</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Como Fazer Shorts Virais no YouTube em 2025
          </h1>

          <div className="aspect-video rounded-2xl mb-8 overflow-hidden border border-border/50">
            <img src={coverImage} alt="Como Fazer Shorts Virais no YouTube em 2025" className="w-full h-full object-cover" />
          </div>

          <div className="prose prose-lg prose-invert max-w-none">
            <p className="text-xl text-muted-foreground leading-relaxed">
              YouTube Shorts explodiram em popularidade e são a forma mais rápida de crescer um canal do zero. 
              Aprenda as técnicas que geram milhões de visualizações.
            </p>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Por que Shorts são Poderosos?</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Alcance massivo:</strong> O algoritmo empurra Shorts para milhões de pessoas</li>
              <li><strong>Baixa barreira:</strong> Mais fácil de produzir que vídeos longos</li>
              <li><strong>Crescimento rápido:</strong> Canais novos conseguem tração em dias</li>
              <li><strong>Monetização:</strong> Agora pagam por visualização (RPM menor, mas volume compensa)</li>
              <li><strong>Funil:</strong> Convertam viewers em inscritos para vídeos longos</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Anatomia de um Short Viral</h2>
            
            <div className="bg-card border border-border/50 rounded-xl p-6 my-6">
              <h3 className="font-bold text-lg mb-3 text-primary">🎯 Hook (0-1 segundo)</h3>
              <p className="text-muted-foreground">
                O primeiro segundo decide TUDO. Use movimento, texto grande, ou uma frase impactante. 
                Se não capturar atenção imediatamente, o usuário passa para o próximo.
              </p>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-6 my-6">
              <h3 className="font-bold text-lg mb-3 text-green-400">📈 Escalada (1-30 segundos)</h3>
              <p className="text-muted-foreground">
                Mantenha tensão crescente. Cada segundo deve adicionar valor ou curiosidade. 
                Não existe tempo para enrolação em Shorts.
              </p>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-6 my-6">
              <h3 className="font-bold text-lg mb-3 text-purple-400">💥 Payoff (últimos segundos)</h3>
              <p className="text-muted-foreground">
                Entregue o prometido. Revelação, punchline, informação valiosa. 
                Um bom final faz pessoas reverem (loop) e comentarem.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Formatos que Viralizam</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Listicles:</strong> "3 coisas que você não sabia sobre..."</li>
              <li><strong>Before/After:</strong> Transformações visuais impactantes</li>
              <li><strong>POV:</strong> Perspectiva em primeira pessoa</li>
              <li><strong>Storytelling rápido:</strong> Histórias em 60 segundos</li>
              <li><strong>Tutorial express:</strong> Ensine algo em menos de 1 minuto</li>
              <li><strong>Reaction:</strong> Reação a conteúdo viral ou notícias</li>
              <li><strong>Curiosidades:</strong> Fatos surpreendentes do seu nicho</li>
            </ul>

            <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 my-8">
              <h3 className="text-xl font-bold mb-3 text-primary">💡 Segredo do Loop</h3>
              <p className="text-muted-foreground">
                Shorts que fazem pessoas assistirem múltiplas vezes têm boost massivo no algoritmo. 
                Crie um final que conecta com o início, ou deixe algo sutil que só é percebido na segunda vez.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Especificações Técnicas</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Formato:</strong> 9:16 (vertical)</li>
              <li><strong>Resolução:</strong> 1080x1920 (Full HD)</li>
              <li><strong>Duração:</strong> 15-60 segundos (sweet spot: 30-45s)</li>
              <li><strong>Legendas:</strong> Obrigatórias - 80% assistem sem som</li>
              <li><strong>Texto na tela:</strong> Grande, bold, alto contraste</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Shorts para Canais Dark</h2>
            <p className="text-muted-foreground leading-relaxed">
              Canais dark podem usar Shorts de forma estratégica:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Teasers de vídeos longos (cena mais impactante)</li>
              <li>Fatos rápidos do nicho</li>
              <li>Comparações visuais</li>
              <li>Previews cinematográficos</li>
              <li>Resumos de histórias maiores</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Frequência Ideal</h2>
            <p className="text-muted-foreground leading-relaxed">
              Para crescer rápido com Shorts:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Mínimo:</strong> 1 Short por dia</li>
              <li><strong>Ideal:</strong> 2-3 Shorts por dia</li>
              <li><strong>Agressivo:</strong> 5+ Shorts por dia (com qualidade)</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              Volume importa nos Shorts. Quanto mais você posta, mais chances de viralizar.
            </p>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Monetização de Shorts</h2>
            <p className="text-muted-foreground leading-relaxed">
              O YouTube paga por Shorts através do fundo de criadores:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Requisitos:</strong> 1.000 inscritos + 10M views de Shorts em 90 dias</li>
              <li><strong>RPM médio:</strong> R$0,03 - R$0,10 por 1.000 views</li>
              <li><strong>Compensação:</strong> Volume alto pode gerar receita significativa</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Erros Comuns</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Hook fraco (perder atenção no primeiro segundo)</li>
              <li>Sem legendas (ignora maioria mobile)</li>
              <li>Muito longo sem payoff</li>
              <li>Qualidade baixa de imagem/som</li>
              <li>Não usar # hashtags relevantes</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Conclusão</h2>
            <p className="text-muted-foreground leading-relaxed">
              Shorts são a porta de entrada mais rápida para o YouTube. Combine volume com qualidade, 
              teste diferentes formatos, e use os dados para refinar sua estratégia.
            </p>
          </div>

          <div className="mt-12 p-8 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl border border-primary/30 text-center">
            <h3 className="text-2xl font-bold mb-4">Crie Shorts com IA</h3>
            <p className="text-muted-foreground mb-6">
              Use a La Casa Dark CORE para gerar roteiros e imagens otimizados para Shorts virais.
            </p>
            <Link to="/auth">
              <Button size="lg">Criar Shorts Agora</Button>
            </Link>
          </div>

          <RelatedArticles currentSlug="shorts-virais" currentCategory="Shorts" />
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

export default ShortsVirais;
