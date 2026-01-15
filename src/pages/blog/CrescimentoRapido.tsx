import { Link } from "react-router-dom";
import { ArrowLeft, Clock, Calendar, User, Share2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/seo/SEOHead";
import { RelatedArticles } from "@/components/blog/RelatedArticles";
import coverImage from "@/assets/blog/crescimento-rapido.jpg";

const CrescimentoRapido = () => {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Estratégias de Crescimento Rápido no YouTube em 2025",
    "description": "Táticas comprovadas para acelerar o crescimento do seu canal no YouTube.",
    "author": { "@type": "Organization", "name": "La Casa Dark CORE" },
    "publisher": { "@type": "Organization", "name": "La Casa Dark CORE" },
    "datePublished": "2025-01-07"
  };

  const estrategias = [
    { titulo: "Consistência Agressiva", tempo: "Semana 1-4", desc: "Poste diariamente para treinar o algoritmo" },
    { titulo: "Shorts + Longos", tempo: "Semana 2-8", desc: "Use Shorts para atrair, longos para reter" },
    { titulo: "Trend Jacking", tempo: "Contínuo", desc: "Crie conteúdo sobre tópicos em alta" },
    { titulo: "Colaborações", tempo: "Mês 2-3", desc: "Parcerias com canais do mesmo porte" },
    { titulo: "Otimização SEO", tempo: "Contínuo", desc: "Títulos, descrições e tags estratégicos" },
    { titulo: "Engajamento Ativo", tempo: "Diário", desc: "Responda comentários, crie comunidade" },
  ];

  return (
    <>
      <SEOHead
        title="Estratégias de Crescimento Rápido no YouTube 2025"
        description="Aprenda táticas comprovadas para crescer rapidamente no YouTube. De 0 a 1.000 inscritos e além com estratégias de alto impacto."
        canonical="/blog/crescimento-rapido"
        ogType="article"
        keywords="crescer no youtube, como crescer canal, estrategias youtube, ganhar inscritos, viralizar youtube"
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
            Estratégias de Crescimento Rápido no YouTube
          </h1>

          <div className="aspect-video rounded-2xl mb-8 overflow-hidden border border-border/50">
            <img src={coverImage} alt="Estratégias de Crescimento Rápido no YouTube" className="w-full h-full object-cover" />
          </div>

          <div className="prose prose-lg prose-invert max-w-none">
            <p className="text-xl text-muted-foreground leading-relaxed">
              Crescer no YouTube não é mais sobre esperar anos. Com as estratégias certas, 
              é possível alcançar 1.000 inscritos em semanas, não meses.
            </p>

            <h2 className="text-2xl font-bold mt-12 mb-6 text-foreground">Roadmap de Crescimento</h2>
            <div className="space-y-4">
              {estrategias.map((est, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border/50">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{est.titulo}</h3>
                      <span className="text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">{est.tempo}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{est.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">1. A Regra dos 100 Vídeos</h2>
            <p className="text-muted-foreground leading-relaxed">
              Seus primeiros 100 vídeos são de aprendizado. Não espere viralizar antes disso. 
              O objetivo inicial é:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Desenvolver habilidades de produção</li>
              <li>Entender o que sua audiência quer</li>
              <li>Criar uma biblioteca de conteúdo</li>
              <li>Treinar o algoritmo sobre seu nicho</li>
            </ul>

            <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 my-8">
              <h3 className="text-xl font-bold mb-3 text-primary">🚀 Hack de Velocidade</h3>
              <p className="text-muted-foreground">
                Use ferramentas de IA como a La Casa Dark CORE para produzir mais rápido. 
                O que levaria 10 horas pode ser feito em 2. Mais vídeos = mais chances de acertar.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">2. Estratégia Shorts + Longos</h2>
            <p className="text-muted-foreground leading-relaxed">
              A combinação mais poderosa para crescimento:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Shorts:</strong> Atraem novos viewers rapidamente</li>
              <li><strong>Vídeos longos:</strong> Convertem viewers em inscritos fiéis</li>
              <li><strong>Proporção ideal:</strong> 3-5 Shorts para cada vídeo longo</li>
              <li><strong>Cross-promotion:</strong> Mencione vídeos longos nos Shorts</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">3. Trend Jacking Inteligente</h2>
            <p className="text-muted-foreground leading-relaxed">
              Aproveite tendências para ganhar exposição:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Monitore Google Trends e Twitter/X</li>
              <li>Reaja a notícias do seu nicho rapidamente (dentro de 24h)</li>
              <li>Adapte trends virais para seu formato</li>
              <li>Use títulos que conectem sua expertise com o trend</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">4. O Poder das Colaborações</h2>
            <p className="text-muted-foreground leading-relaxed">
              Colaborações expõem seu conteúdo para audiências novas:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Procure canais do mesmo porte (similar subscriber count)</li>
              <li>Proponha conteúdo que beneficie ambos</li>
              <li>Faça menções cruzadas em vídeos</li>
              <li>Participe de podcasts e entrevistas</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">5. Thumbnail + Título = 80% do Sucesso</h2>
            <p className="text-muted-foreground leading-relaxed">
              Invista tempo desproporcional em thumbnails e títulos:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Crie 3-5 opções de thumbnail antes de escolher</li>
              <li>Teste títulos diferentes (A/B testing nativo do YouTube)</li>
              <li>Analise thumbnails de vídeos virais do seu nicho</li>
              <li>Alto contraste, texto legível, emoção clara</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">6. Engajamento que Converte</h2>
            <p className="text-muted-foreground leading-relaxed">
              Transforme viewers em comunidade:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Responda comentários:</strong> Especialmente nas primeiras horas</li>
              <li><strong>Faça perguntas:</strong> No vídeo e na descrição</li>
              <li><strong>Crie inside jokes:</strong> Referências que só inscritos entendem</li>
              <li><strong>Use Community Tab:</strong> Enquetes, atualizações, bastidores</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Cronograma de 90 Dias</h2>
            
            <div className="bg-card border border-border/50 rounded-xl p-6 my-6">
              <h3 className="font-bold text-lg mb-3 text-green-400">Dias 1-30: Fundação</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" />Publique 30 vídeos (1 por dia)</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" />Defina identidade visual consistente</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" />Otimize SEO de todos os vídeos</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" />Analise métricas e ajuste</li>
              </ul>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-6 my-6">
              <h3 className="font-bold text-lg mb-3 text-blue-400">Dias 31-60: Aceleração</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-400" />Adicione Shorts à estratégia (2-3/dia)</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-400" />Identifique seu vídeo mais viral e replique</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-400" />Busque primeira colaboração</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-400" />Crie série/playlist temática</li>
              </ul>
            </div>

            <div className="bg-card border border-border/50 rounded-xl p-6 my-6">
              <h3 className="font-bold text-lg mb-3 text-purple-400">Dias 61-90: Escala</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-purple-400" />Aumente frequência de Shorts</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-purple-400" />Teste trend jacking</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-purple-400" />Implemente monetização (afiliados)</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-purple-400" />Prepare para os 1.000 inscritos</li>
              </ul>
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Métricas para Acompanhar</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Taxa de crescimento:</strong> Inscritos/semana</li>
              <li><strong>CTR médio:</strong> Alvo 4-10%</li>
              <li><strong>Retenção média:</strong> Alvo 40-50%</li>
              <li><strong>Views/vídeo:</strong> Tendência de crescimento</li>
              <li><strong>Engajamento:</strong> Likes + comentários / views</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Conclusão</h2>
            <p className="text-muted-foreground leading-relaxed">
              Crescimento rápido no YouTube é possível com estratégia, consistência e 
              as ferramentas certas. Não espere perfeição - publique, aprenda, melhore, repita.
            </p>
          </div>

          <div className="mt-12 p-8 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl border border-primary/30 text-center">
            <h3 className="text-2xl font-bold mb-4">Acelere seu crescimento</h3>
            <p className="text-muted-foreground mb-6">
              Use a La Casa Dark CORE para produzir mais conteúdo em menos tempo e escalar seu canal.
            </p>
            <Link to="/auth">
              <Button size="lg">Começar a Crescer</Button>
            </Link>
          </div>

          <RelatedArticles currentSlug="crescimento-rapido" currentCategory="Crescimento" />
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

export default CrescimentoRapido;
