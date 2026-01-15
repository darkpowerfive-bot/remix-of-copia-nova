import { Link } from "react-router-dom";
import { ArrowLeft, Clock, Calendar, User, Share2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/seo/SEOHead";
import { RelatedArticles } from "@/components/blog/RelatedArticles";
import coverImage from "@/assets/blog/ferramentas-criacao-videos.jpg";

const FerramentasCriacaoVideos = () => {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Melhores Ferramentas para Criar Vídeos no YouTube em 2025",
    "description": "Comparativo completo das melhores ferramentas para criação de vídeos, edição, IA e automação.",
    "author": { "@type": "Organization", "name": "La Casa Dark CORE" },
    "publisher": { "@type": "Organization", "name": "La Casa Dark CORE" },
    "datePublished": "2025-01-07"
  };

  const ferramentas = [
    {
      categoria: "Edição de Vídeo",
      items: [
        { nome: "DaVinci Resolve", preco: "Grátis", nivel: "Avançado", pros: ["Gratuito completo", "Color grading profissional"], contras: ["Curva de aprendizado alta"] },
        { nome: "CapCut", preco: "Grátis", nivel: "Iniciante", pros: ["Fácil de usar", "Muitos efeitos"], contras: ["Marca d'água em alguns recursos"] },
        { nome: "Premiere Pro", preco: "R$90/mês", nivel: "Avançado", pros: ["Padrão da indústria", "Integração Adobe"], contras: ["Caro", "Pesado"] },
      ]
    },
    {
      categoria: "Geração de Imagens IA",
      items: [
        { nome: "Midjourney", preco: "$10/mês", nivel: "Intermediário", pros: ["Qualidade cinematográfica", "Estilos únicos"], contras: ["Precisa do Discord"] },
        { nome: "DALL-E 3", preco: "Pay per use", nivel: "Iniciante", pros: ["Fácil de usar", "Integrado ao ChatGPT"], contras: ["Limitações de estilo"] },
        { nome: "La Casa Dark CORE", preco: "Por plano", nivel: "Iniciante", pros: ["Especializado para YouTube", "Prompts otimizados"], contras: ["Focado em nicho específico"] },
      ]
    },
    {
      categoria: "Narração e TTS",
      items: [
        { nome: "ElevenLabs", preco: "$5/mês", nivel: "Iniciante", pros: ["Vozes realistas", "Clonagem de voz"], contras: ["Créditos limitados"] },
        { nome: "Play.ht", preco: "$39/mês", nivel: "Iniciante", pros: ["Muitas vozes PT-BR", "API disponível"], contras: ["Preço mais alto"] },
        { nome: "Descript", preco: "$12/mês", nivel: "Intermediário", pros: ["Edição por texto", "Overdub"], contras: ["Recursos avançados pagos"] },
      ]
    },
    {
      categoria: "Roteiros com IA",
      items: [
        { nome: "ChatGPT Plus", preco: "$20/mês", nivel: "Iniciante", pros: ["Versátil", "Atualizado"], contras: ["Genérico para YouTube"] },
        { nome: "Claude", preco: "$20/mês", nivel: "Intermediário", pros: ["Roteiros longos", "Contexto grande"], contras: ["Menos criativo"] },
        { nome: "La Casa Dark CORE", preco: "Por plano", nivel: "Iniciante", pros: ["Templates para YouTube", "Análise de tendências"], contras: ["Focado em nicho específico"] },
      ]
    },
  ];

  return (
    <>
      <SEOHead
        title="Melhores Ferramentas para Criar Vídeos no YouTube 2025"
        description="Comparativo completo das melhores ferramentas para criação de vídeos: edição, IA, narração e automação. Encontre a ferramenta ideal para seu canal."
        canonical="/blog/ferramentas-criacao-videos"
        ogType="article"
        keywords="ferramentas youtube, software edição video, ia para videos, melhores editores video, ferramentas criador conteudo"
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
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />20 min de leitura</span>
            <span className="flex items-center gap-1"><User className="w-4 h-4" />Equipe La Casa Dark</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            Melhores Ferramentas para Criar Vídeos no YouTube em 2025
          </h1>

          <div className="aspect-video rounded-2xl mb-8 overflow-hidden border border-border/50">
            <img src={coverImage} alt="Melhores Ferramentas para Criar Vídeos no YouTube em 2025" className="w-full h-full object-cover" />
          </div>

          <div className="prose prose-lg prose-invert max-w-none">
            <p className="text-xl text-muted-foreground leading-relaxed">
              A ferramenta certa pode transformar sua produtividade. Neste guia, comparamos as 
              melhores opções para cada etapa da criação de vídeos no YouTube.
            </p>

            {ferramentas.map((categoria, catIndex) => (
              <div key={catIndex}>
                <h2 className="text-2xl font-bold mt-12 mb-6 text-foreground">{categoria.categoria}</h2>
                <div className="space-y-4">
                  {categoria.items.map((ferramenta, idx) => (
                    <div key={idx} className="bg-card border border-border/50 rounded-xl p-6">
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                        <h3 className="font-bold text-lg">{ferramenta.nome}</h3>
                        <div className="flex gap-2">
                          <span className="px-3 py-1 bg-primary/20 text-primary text-sm rounded-full">
                            {ferramenta.preco}
                          </span>
                          <span className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full">
                            {ferramenta.nivel}
                          </span>
                        </div>
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-green-400 mb-2">Prós</p>
                          <ul className="space-y-1">
                            {ferramenta.pros.map((pro, pIdx) => (
                              <li key={pIdx} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Check className="w-4 h-4 text-green-400" />
                                {pro}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-red-400 mb-2">Contras</p>
                          <ul className="space-y-1">
                            {ferramenta.contras.map((contra, cIdx) => (
                              <li key={cIdx} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <X className="w-4 h-4 text-red-400" />
                                {contra}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Stack Recomendado por Orçamento</h2>

            <div className="bg-card border border-border/50 rounded-xl p-6 my-6">
              <h3 className="font-bold text-lg mb-3 text-green-400">💰 Grátis</h3>
              <p className="text-muted-foreground">
                <strong>Edição:</strong> DaVinci Resolve ou CapCut | <strong>Imagens:</strong> Bing Image Creator | 
                <strong>Narração:</strong> Voz própria ou TTS gratuito | <strong>Roteiros:</strong> ChatGPT Free
              </p>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-6 my-6">
              <h3 className="font-bold text-lg mb-3 text-blue-400">💵 Até R$100/mês</h3>
              <p className="text-muted-foreground">
                <strong>Edição:</strong> DaVinci Resolve | <strong>Imagens:</strong> Midjourney Basic | 
                <strong>Narração:</strong> ElevenLabs | <strong>Roteiros:</strong> ChatGPT Plus
              </p>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-6 my-6">
              <h3 className="font-bold text-lg mb-3 text-purple-400">💎 Profissional</h3>
              <p className="text-muted-foreground">
                <strong>All-in-one:</strong> La Casa Dark CORE | <strong>Edição:</strong> Premiere Pro | 
                <strong>Imagens:</strong> Midjourney Pro | <strong>Narração:</strong> ElevenLabs Pro
              </p>
            </div>

            <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 my-8">
              <h3 className="text-xl font-bold mb-3 text-primary">🚀 Por que usar All-in-One?</h3>
              <p className="text-muted-foreground">
                Ferramentas integradas como a La Casa Dark CORE economizam tempo ao combinar 
                análise de tendências, geração de roteiros, criação de imagens e otimização de SEO 
                em uma única plataforma otimizada para YouTube.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Conclusão</h2>
            <p className="text-muted-foreground leading-relaxed">
              Não existe ferramenta perfeita - existe a ferramenta certa para você. 
              Comece com opções gratuitas, aprenda o básico, e invista em ferramentas 
              pagas quando seu canal começar a gerar receita.
            </p>
          </div>

          <div className="mt-12 p-8 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl border border-primary/30 text-center">
            <h3 className="text-2xl font-bold mb-4">Experimente a La Casa Dark CORE</h3>
            <p className="text-muted-foreground mb-6">
              Plataforma completa para criação de canais dark com IA, desde roteiros até imagens cinematográficas.
            </p>
            <Link to="/auth">
              <Button size="lg">Testar Gratuitamente</Button>
            </Link>
          </div>

          <RelatedArticles currentSlug="ferramentas-criacao-videos" currentCategory="Ferramentas" />
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

export default FerramentasCriacaoVideos;
