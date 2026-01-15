import { Link } from "react-router-dom";
import { ArrowLeft, Clock, Calendar, User, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/seo/SEOHead";
import { RelatedArticles } from "@/components/blog/RelatedArticles";
import coverImage from "@/assets/blog/algoritmo-youtube.jpg";

const AlgoritmoYouTube = () => {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Como Funciona o Algoritmo do YouTube em 2025",
    "description": "Entenda o algoritmo do YouTube e aprenda a criar vídeos que viralizam.",
    "author": { "@type": "Organization", "name": "La Casa Dark CORE" },
    "publisher": { "@type": "Organization", "name": "La Casa Dark CORE" },
    "datePublished": "2025-01-07"
  };

  return (
    <>
      <SEOHead
        title="Como Funciona o Algoritmo do YouTube em 2025"
        description="Descubra como o algoritmo do YouTube decide quais vídeos mostrar. CTR, retenção, engajamento e as métricas que realmente importam."
        canonical="/blog/algoritmo-youtube"
        ogType="article"
        keywords="algoritmo youtube, como viralizar youtube, recomendados youtube, ctr youtube, retenção youtube"
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
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />15 min de leitura</span>
            <span className="flex items-center gap-1"><User className="w-4 h-4" />Equipe La Casa Dark</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Como Funciona o Algoritmo do YouTube em 2025
          </h1>

          <div className="aspect-video rounded-2xl mb-8 overflow-hidden border border-border/50">
            <img src={coverImage} alt="Como Funciona o Algoritmo do YouTube em 2025" className="w-full h-full object-cover" />
          </div>

          <div className="prose prose-lg prose-invert max-w-none">
            <p className="text-xl text-muted-foreground leading-relaxed">
              O algoritmo do YouTube é um sistema de machine learning que decide quais vídeos 
              mostrar para cada usuário. Entender como ele funciona é essencial para crescer na plataforma.
            </p>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">O Objetivo do Algoritmo</h2>
            <p className="text-muted-foreground leading-relaxed">
              O YouTube tem um objetivo principal: <strong>manter usuários na plataforma o maior tempo possível</strong>. 
              Por isso, o algoritmo prioriza conteúdo que:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Faz pessoas clicarem</li>
              <li>Faz pessoas assistirem até o final</li>
              <li>Faz pessoas continuarem assistindo mais vídeos</li>
              <li>Gera engajamento (likes, comentários)</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">As 4 Métricas Principais</h2>

            <div className="bg-card border border-border/50 rounded-xl p-6 my-6">
              <h3 className="font-bold text-lg mb-3 text-primary">1. CTR (Click Through Rate)</h3>
              <p className="text-muted-foreground">
                Porcentagem de pessoas que clicam após ver a impressão. O algoritmo testa 
                seu vídeo com um grupo pequeno e expande se o CTR for bom.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Alvo:</strong> 4-10% para vídeos novos, 2-4% para vídeos mais antigos
              </p>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-6 my-6">
              <h3 className="font-bold text-lg mb-3 text-green-400">2. Average View Duration</h3>
              <p className="text-muted-foreground">
                Tempo médio que pessoas assistem seu vídeo. Quanto maior, mais o algoritmo 
                entende que seu conteúdo é valioso.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Alvo:</strong> 50%+ da duração total do vídeo
              </p>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-6 my-6">
              <h3 className="font-bold text-lg mb-3 text-blue-400">3. Watch Time</h3>
              <p className="text-muted-foreground">
                Total de minutos assistidos. Um vídeo de 10 min com 50% de retenção gera 
                mais watch time que um de 2 min com 100%.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Por isso:</strong> Vídeos mais longos podem performar melhor (se mantiverem retenção)
              </p>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-6 my-6">
              <h3 className="font-bold text-lg mb-3 text-purple-400">4. Session Time</h3>
              <p className="text-muted-foreground">
                Tempo total que o usuário passa no YouTube após ver seu vídeo. Se seu vídeo 
                faz pessoas saírem, o algoritmo penaliza.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                <strong>Dica:</strong> Use cards e end screens para direcionar para outros vídeos
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">O Ciclo de Viralização</h2>
            <ol className="list-decimal pl-6 space-y-2 text-muted-foreground">
              <li>Vídeo é mostrado para grupo pequeno (inscritos + busca)</li>
              <li>Se CTR e retenção forem bons, expande para Browse Features</li>
              <li>Se continuar performando, aparece nos Recomendados</li>
              <li>Se viralizar, aparece em Trending/Homepage</li>
            </ol>

            <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 my-8">
              <h3 className="text-xl font-bold mb-3 text-primary">⚡ As Primeiras 24-48 Horas</h3>
              <p className="text-muted-foreground">
                O algoritmo avalia performance principalmente nas primeiras 24-48 horas. 
                Por isso, notifique sua audiência, poste em horários de pico e maximize 
                engajamento inicial.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Fatores Secundários</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Frequência:</strong> Canais consistentes são priorizados</li>
              <li><strong>Histórico do canal:</strong> Performance passada influencia</li>
              <li><strong>Nicho:</strong> Vídeos são comparados com similares</li>
              <li><strong>Sazonalidade:</strong> Alguns tópicos têm picos de interesse</li>
              <li><strong>Novidade:</strong> Conteúdo novo tem boost inicial</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Mitos sobre o Algoritmo</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Mito:</strong> "Postar muito prejudica o canal" → <strong>Realidade:</strong> Mais vídeos = mais chances</li>
              <li><strong>Mito:</strong> "Tags são super importantes" → <strong>Realidade:</strong> Título e thumbnail importam mais</li>
              <li><strong>Mito:</strong> "Deletar vídeos ruins ajuda" → <strong>Realidade:</strong> Não afeta outros vídeos</li>
              <li><strong>Mito:</strong> "O algoritmo pune canais" → <strong>Realidade:</strong> Ele responde a métricas</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Como Otimizar para o Algoritmo</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Invista tempo em thumbnails e títulos (CTR)</li>
              <li>Hook forte nos primeiros 30 segundos (retenção)</li>
              <li>Pattern interrupts a cada 30-60 segundos (manter atenção)</li>
              <li>Peça engajamento (mas sem ser irritante)</li>
              <li>Use cards para sugerir outros vídeos (session time)</li>
              <li>Poste consistentemente (frequência)</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Conclusão</h2>
            <p className="text-muted-foreground leading-relaxed">
              O algoritmo não é seu inimigo - ele quer mostrar bom conteúdo. Foque em 
              criar vídeos que as pessoas queiram assistir até o final, e o algoritmo 
              naturalmente vai distribuí-los para mais pessoas.
            </p>
          </div>

          <div className="mt-12 p-8 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl border border-primary/30 text-center">
            <h3 className="text-2xl font-bold mb-4">Analise sua performance</h3>
            <p className="text-muted-foreground mb-6">
              Use a La Casa Dark CORE para entender o que funciona no seu nicho e criar vídeos otimizados.
            </p>
            <Link to="/auth">
              <Button size="lg">Analisar Tendências</Button>
            </Link>
          </div>

          <RelatedArticles currentSlug="algoritmo-youtube" currentCategory="Algoritmo" />
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

export default AlgoritmoYouTube;
