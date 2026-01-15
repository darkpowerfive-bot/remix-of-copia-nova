import { Link } from "react-router-dom";
import { ArrowLeft, Clock, Calendar, User, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/seo/SEOHead";
import { RelatedArticles } from "@/components/blog/RelatedArticles";
import coverImage from "@/assets/blog/monetizacao-afiliados.jpg";

const MonetizacaoAfiliados = () => {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Monetização com Afiliados no YouTube: Guia Completo 2025",
    "description": "Aprenda a ganhar dinheiro com marketing de afiliados no YouTube, mesmo sem monetização do AdSense.",
    "author": { "@type": "Organization", "name": "La Casa Dark CORE" },
    "publisher": { "@type": "Organization", "name": "La Casa Dark CORE" },
    "datePublished": "2025-01-07"
  };

  const plataformas = [
    { nome: "Amazon Associados", comissao: "1-10%", tipo: "Produtos físicos", pros: "Maior catálogo, confiança do consumidor" },
    { nome: "Hotmart", comissao: "20-80%", tipo: "Produtos digitais", pros: "Altas comissões, produtos em português" },
    { nome: "Eduzz", comissao: "20-70%", tipo: "Produtos digitais", pros: "Boa variedade, suporte brasileiro" },
    { nome: "Monetizze", comissao: "30-70%", tipo: "Produtos digitais", pros: "Nichos específicos, bom dashboard" },
    { nome: "Shopee Afiliados", comissao: "5-15%", tipo: "E-commerce", pros: "Produtos baratos, alta conversão" },
    { nome: "Mercado Livre", comissao: "5-12%", tipo: "Marketplace", pros: "Confiança, entrega rápida" },
  ];

  return (
    <>
      <SEOHead
        title="Monetização com Afiliados no YouTube: Guia Completo 2025"
        description="Descubra como ganhar dinheiro com marketing de afiliados no YouTube. Plataformas, estratégias e técnicas para maximizar comissões."
        canonical="/blog/monetizacao-afiliados"
        ogType="article"
        keywords="afiliados youtube, marketing afiliados, ganhar dinheiro afiliados, hotmart youtube, amazon afiliados"
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
            Monetização com Afiliados no YouTube: Guia Completo
          </h1>

          <div className="aspect-video rounded-2xl mb-8 overflow-hidden border border-border/50">
            <img src={coverImage} alt="Monetização com Afiliados no YouTube: Guia Completo" className="w-full h-full object-cover" />
          </div>

          <div className="prose prose-lg prose-invert max-w-none">
            <p className="text-xl text-muted-foreground leading-relaxed">
              Marketing de afiliados permite ganhar dinheiro no YouTube desde o primeiro dia, 
              sem precisar esperar a monetização do AdSense. Aprenda a maximizar essa fonte de renda.
            </p>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Por que Afiliados?</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Sem requisitos:</strong> Não precisa de 1.000 inscritos ou 4.000 horas</li>
              <li><strong>Altas comissões:</strong> Produtos digitais pagam até 80%</li>
              <li><strong>Renda passiva:</strong> Links continuam gerando vendas por meses/anos</li>
              <li><strong>Escalável:</strong> Mais vídeos = mais links = mais comissões</li>
              <li><strong>Diversificação:</strong> Não dependa apenas do AdSense</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-6 text-foreground">Principais Plataformas</h2>
            <div className="space-y-4">
              {plataformas.map((plat, idx) => (
                <div key={idx} className="bg-card border border-border/50 rounded-xl p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                    <h3 className="font-bold text-lg">{plat.nome}</h3>
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full font-medium">
                      {plat.comissao}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    <strong>Tipo:</strong> {plat.tipo} | <strong>Destaque:</strong> {plat.pros}
                  </p>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Como Escolher Produtos</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Relevância:</strong> Produto deve fazer sentido para sua audiência</li>
              <li><strong>Qualidade:</strong> Só promova o que você usaria/recomendaria</li>
              <li><strong>Comissão vs. Conversão:</strong> Às vezes 10% de um produto caro vale mais que 80% de um barato</li>
              <li><strong>Página de vendas:</strong> Produtos com boa página convertem mais</li>
              <li><strong>Suporte:</strong> Evite produtos com muitas reclamações</li>
            </ul>

            <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 my-8">
              <h3 className="text-xl font-bold mb-3 text-primary">💰 Regra de Ouro</h3>
              <p className="text-muted-foreground">
                Promova produtos que você genuinamente acredita. Sua audiência percebe quando 
                você está apenas tentando vender algo. Autenticidade converte mais que táticas agressivas.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Estratégias de Promoção</h2>

            <h3 className="text-xl font-bold mt-8 mb-3 text-foreground">1. Reviews Detalhados</h3>
            <p className="text-muted-foreground leading-relaxed">
              Crie vídeos completos analisando o produto. Mostre prós e contras, 
              funcionalidades, e para quem é indicado. Honestidade gera confiança.
            </p>

            <h3 className="text-xl font-bold mt-8 mb-3 text-foreground">2. Tutoriais com o Produto</h3>
            <p className="text-muted-foreground leading-relaxed">
              Ensine algo usando o produto como ferramenta. Exemplo: tutorial de edição 
              usando um software específico com seu link de afiliado.
            </p>

            <h3 className="text-xl font-bold mt-8 mb-3 text-foreground">3. Listas e Comparativos</h3>
            <p className="text-muted-foreground leading-relaxed">
              Vídeos tipo "Top 5 melhores ferramentas para X" ou "Produto A vs Produto B". 
              Coloque links de afiliado para todos os produtos mencionados.
            </p>

            <h3 className="text-xl font-bold mt-8 mb-3 text-foreground">4. Menções Naturais</h3>
            <p className="text-muted-foreground leading-relaxed">
              Em vídeos de conteúdo regular, mencione produtos que você usa naturalmente. 
              "Eu uso o X para fazer isso" com link na descrição.
            </p>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Onde Colocar os Links</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Descrição:</strong> Primeiras linhas (visíveis sem clicar em "mais")</li>
              <li><strong>Comentário fixado:</strong> Alta visibilidade</li>
              <li><strong>Cards:</strong> Durante o vídeo em momentos relevantes</li>
              <li><strong>Pinned comment:</strong> Primeiro comentário fixado</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Afiliados para Canais Dark</h2>
            <p className="text-muted-foreground leading-relaxed">
              Canais dark podem monetizar com afiliados de forma criativa:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Nicho Finanças:</strong> Cursos de investimento, apps de banco digital</li>
              <li><strong>Nicho Tech:</strong> Software, gadgets, cursos de programação</li>
              <li><strong>Nicho Saúde:</strong> Suplementos, apps de exercício, cursos</li>
              <li><strong>Nicho Educação:</strong> Cursos online, livros, ferramentas</li>
              <li><strong>Nicho Curiosidades:</strong> Livros, documentários, assinaturas</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Erros a Evitar</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Promover produtos ruins só pela comissão alta</li>
              <li>Não declarar que é link de afiliado (exigido por lei)</li>
              <li>Spam de links sem contexto</li>
              <li>Promover produtos fora do seu nicho</li>
              <li>Não testar o produto antes de promover</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Métricas para Acompanhar</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Cliques:</strong> Quantas pessoas clicam nos seus links</li>
              <li><strong>Taxa de conversão:</strong> Cliques que viram vendas</li>
              <li><strong>Ticket médio:</strong> Valor médio das vendas</li>
              <li><strong>Comissão por vídeo:</strong> Quanto cada vídeo gera</li>
              <li><strong>Lifetime value:</strong> Alguns produtos pagam recorrente</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Conclusão</h2>
            <p className="text-muted-foreground leading-relaxed">
              Marketing de afiliados é uma das formas mais acessíveis de monetizar no YouTube. 
              Comece escolhendo 2-3 produtos relevantes para seu nicho e integre-os naturalmente 
              ao seu conteúdo. Com consistência, pode se tornar sua principal fonte de renda.
            </p>
          </div>

          <div className="mt-12 p-8 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl border border-primary/30 text-center">
            <h3 className="text-2xl font-bold mb-4">Crie conteúdo que converte</h3>
            <p className="text-muted-foreground mb-6">
              Use a La Casa Dark CORE para criar vídeos otimizados que geram visualizações e vendas.
            </p>
            <Link to="/auth">
              <Button size="lg">Começar Agora</Button>
            </Link>
          </div>

          <RelatedArticles currentSlug="monetizacao-afiliados" currentCategory="Afiliados" />
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

export default MonetizacaoAfiliados;
