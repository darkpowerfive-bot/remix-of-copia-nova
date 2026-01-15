import { Link } from "react-router-dom";
import { ArrowLeft, Clock, Calendar, User, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/seo/SEOHead";
import { RelatedArticles } from "@/components/blog/RelatedArticles";
import coverImage from "@/assets/blog/seo-youtube.jpg";

const SEOYouTube = () => {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "SEO para YouTube: Como Ranquear Vídeos em 2025",
    "description": "Guia completo de otimização para YouTube. Aprenda a ranquear seus vídeos nas buscas.",
    "author": { "@type": "Organization", "name": "La Casa Dark CORE" },
    "publisher": { "@type": "Organization", "name": "La Casa Dark CORE" },
    "datePublished": "2025-01-07"
  };

  return (
    <>
      <SEOHead
        title="SEO para YouTube: Como Ranquear Vídeos em 2025"
        description="Domine o algoritmo do YouTube com técnicas avançadas de SEO. Títulos, descrições, tags e estratégias para aparecer nas buscas e recomendados."
        canonical="/blog/seo-youtube"
        ogType="article"
        keywords="seo youtube, como ranquear video, algoritmo youtube, otimização youtube, tags youtube"
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
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />16 min de leitura</span>
            <span className="flex items-center gap-1"><User className="w-4 h-4" />Equipe La Casa Dark</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            SEO para YouTube: Como Ranquear Vídeos em 2025
          </h1>

          <div className="aspect-video rounded-2xl mb-8 overflow-hidden border border-border/50">
            <img src={coverImage} alt="SEO para YouTube: Como Ranquear Vídeos em 2025" className="w-full h-full object-cover" />
          </div>

          <div className="prose prose-lg prose-invert max-w-none">
            <p className="text-xl text-muted-foreground leading-relaxed">
              YouTube é o segundo maior buscador do mundo. Otimizar seus vídeos para busca pode 
              significar milhares de visualizações orgânicas todos os meses.
            </p>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Como o Algoritmo Funciona</h2>
            <p className="text-muted-foreground leading-relaxed">
              O YouTube prioriza vídeos que:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Alta retenção:</strong> Pessoas assistem até o final</li>
              <li><strong>Alto CTR:</strong> Muitos cliques em relação a impressões</li>
              <li><strong>Engajamento:</strong> Likes, comentários, compartilhamentos</li>
              <li><strong>Sessão:</strong> Pessoas continuam no YouTube após assistir</li>
              <li><strong>Relevância:</strong> Metadata alinhada com a busca</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Pesquisa de Palavras-Chave</h2>
            <p className="text-muted-foreground leading-relaxed">
              Antes de criar, pesquise o que as pessoas buscam:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>YouTube Autocomplete:</strong> Digite seu tema e veja sugestões</li>
              <li><strong>Google Trends:</strong> Compare termos e veja tendências</li>
              <li><strong>VidIQ/TubeBuddy:</strong> Ferramentas de análise de keywords</li>
              <li><strong>Concorrência:</strong> Veja tags de vídeos bem-sucedidos</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Otimização de Títulos</h2>
            <p className="text-muted-foreground leading-relaxed">
              O título é o elemento mais importante de SEO:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Palavra-chave principal no início</li>
              <li>Máximo 60 caracteres (visível completo)</li>
              <li>Inclua números quando possível ("10 formas de...")</li>
              <li>Use parênteses para contexto extra</li>
              <li>Crie curiosidade sem ser clickbait</li>
            </ul>

            <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 my-8">
              <h3 className="text-xl font-bold mb-3 text-primary">Exemplos de Títulos Otimizados</h3>
              <ul className="text-muted-foreground space-y-2">
                <li>✅ "Como Ganhar Dinheiro no YouTube (Guia Completo 2025)"</li>
                <li>✅ "10 Nichos Lucrativos para Canal Dark no YouTube"</li>
                <li>❌ "MEU VIDEO SOBRE YOUTUBE | PARTE 1 | COMO FAZER"</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Descrições que Ranqueiam</h2>
            <p className="text-muted-foreground leading-relaxed">
              A descrição ajuda o YouTube a entender seu conteúdo:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Primeiras 2-3 linhas:</strong> Resumo com palavra-chave (visível antes do "mostrar mais")</li>
              <li><strong>Corpo:</strong> 200-300 palavras descrevendo o vídeo</li>
              <li><strong>Timestamps:</strong> Melhora experiência e SEO</li>
              <li><strong>Links:</strong> Redes sociais, produtos, outros vídeos</li>
              <li><strong>Hashtags:</strong> 3-5 hashtags relevantes no final</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Tags Estratégicas</h2>
            <p className="text-muted-foreground leading-relaxed">
              Tags ajudam com variações e erros de digitação:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Primeira tag = palavra-chave exata do título</li>
              <li>Tags de 2-4 palavras (long tail)</li>
              <li>Inclua erros comuns de digitação</li>
              <li>Tags do canal para consistência</li>
              <li>Limite: 500 caracteres total</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Otimização do Vídeo</h2>
            <p className="text-muted-foreground leading-relaxed">
              O conteúdo também precisa ser otimizado:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Mencione a keyword:</strong> Nos primeiros 30 segundos</li>
              <li><strong>Legendas:</strong> YouTube indexa o conteúdo falado</li>
              <li><strong>Capítulos:</strong> Timestamps melhoram UX e SEO</li>
              <li><strong>Cards e End screens:</strong> Aumentam tempo de sessão</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Métricas que Importam</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>CTR (Click Through Rate):</strong> Alvo: 4-10%</li>
              <li><strong>Average View Duration:</strong> Alvo: 50%+ do vídeo</li>
              <li><strong>Watch Time:</strong> Total de minutos assistidos</li>
              <li><strong>Engagement Rate:</strong> Likes + comentários / views</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Estratégias Avançadas</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Playlists temáticas:</strong> Ranqueiam por si só</li>
              <li><strong>Embed em blogs:</strong> Sinais externos de qualidade</li>
              <li><strong>Resposta em vídeo:</strong> Conecte a conteúdos populares</li>
              <li><strong>Consistência:</strong> Poste no mesmo horário/dia</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Conclusão</h2>
            <p className="text-muted-foreground leading-relaxed">
              SEO no YouTube é uma maratona. Os resultados vêm com consistência e 
              otimização contínua. Use dados do YouTube Analytics para refinar sua estratégia.
            </p>
          </div>

          <div className="mt-12 p-8 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl border border-primary/30 text-center">
            <h3 className="text-2xl font-bold mb-4">Analise seu canal com IA</h3>
            <p className="text-muted-foreground mb-6">
              Use a La Casa Dark CORE para analisar SEO, identificar oportunidades e otimizar seus vídeos.
            </p>
            <Link to="/auth">
              <Button size="lg">Analisar Meu Canal</Button>
            </Link>
          </div>

          <RelatedArticles currentSlug="seo-youtube" currentCategory="SEO" />
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

export default SEOYouTube;
