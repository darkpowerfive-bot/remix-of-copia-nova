import { Link } from "react-router-dom";
import { ArrowLeft, Clock, Calendar, User, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/seo/SEOHead";
import { RelatedArticles } from "@/components/blog/RelatedArticles";
import coverImage from "@/assets/blog/nichos-lucrativos-youtube.jpg";

const NichosLucrativosYouTube = () => {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "10 Nichos Mais Lucrativos do YouTube em 2025",
    "description": "Descubra os nichos que mais pagam no YouTube e como escolher o melhor para você.",
    "author": { "@type": "Organization", "name": "La Casa Dark CORE" },
    "publisher": { "@type": "Organization", "name": "La Casa Dark CORE" },
    "datePublished": "2025-01-07",
    "dateModified": "2025-01-07"
  };

  const nichos = [
    { nome: "Finanças e Investimentos", cpm: "R$30-80", dificuldade: "Alta", potencial: "Muito Alto" },
    { nome: "Tecnologia e Reviews", cpm: "R$20-50", dificuldade: "Média", potencial: "Alto" },
    { nome: "Saúde e Bem-estar", cpm: "R$15-40", dificuldade: "Média", potencial: "Alto" },
    { nome: "Educação e Tutoriais", cpm: "R$10-35", dificuldade: "Baixa", potencial: "Alto" },
    { nome: "Negócios e Empreendedorismo", cpm: "R$25-60", dificuldade: "Alta", potencial: "Muito Alto" },
    { nome: "Curiosidades e Fatos", cpm: "R$5-15", dificuldade: "Baixa", potencial: "Médio" },
    { nome: "True Crime e Mistérios", cpm: "R$8-20", dificuldade: "Média", potencial: "Alto" },
    { nome: "Motivação e Desenvolvimento Pessoal", cpm: "R$10-30", dificuldade: "Baixa", potencial: "Médio" },
    { nome: "Gaming e E-sports", cpm: "R$3-12", dificuldade: "Alta", potencial: "Médio" },
    { nome: "Viagens e Lifestyle", cpm: "R$8-25", dificuldade: "Alta", potencial: "Médio" },
  ];

  return (
    <>
      <SEOHead
        title="10 Nichos Mais Lucrativos do YouTube em 2025"
        description="Descubra os nichos que mais pagam no YouTube em 2025. Compare CPM, dificuldade e potencial de cada nicho para escolher o melhor para seu canal."
        canonical="/blog/nichos-lucrativos-youtube"
        ogType="article"
        keywords="nichos lucrativos youtube, nichos que mais pagam youtube, cpm youtube, melhores nichos youtube 2025"
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
            <span className="flex items-center gap-1"><Clock className="w-4 h-4" />12 min de leitura</span>
            <span className="flex items-center gap-1"><User className="w-4 h-4" />Equipe La Casa Dark</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
            10 Nichos Mais Lucrativos do YouTube em 2025
          </h1>

          <div className="aspect-video rounded-2xl mb-8 overflow-hidden border border-border/50">
            <img src={coverImage} alt="10 Nichos Mais Lucrativos do YouTube em 2025" className="w-full h-full object-cover" />
          </div>

          <div className="prose prose-lg prose-invert max-w-none">
            <p className="text-xl text-muted-foreground leading-relaxed">
              Escolher o nicho certo pode ser a diferença entre ganhar centavos ou milhares de reais por mês. 
              Conheça os nichos que mais pagam no YouTube em 2025.
            </p>

            <h2 className="text-2xl font-bold mt-12 mb-6 text-foreground">Comparativo de Nichos</h2>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4">Nicho</th>
                    <th className="text-left py-3 px-4">CPM Médio</th>
                    <th className="text-left py-3 px-4">Dificuldade</th>
                    <th className="text-left py-3 px-4">Potencial</th>
                  </tr>
                </thead>
                <tbody>
                  {nichos.map((nicho, index) => (
                    <tr key={index} className="border-b border-border/50">
                      <td className="py-3 px-4 font-medium">{nicho.nome}</td>
                      <td className="py-3 px-4 text-green-400">{nicho.cpm}</td>
                      <td className="py-3 px-4">{nicho.dificuldade}</td>
                      <td className="py-3 px-4">{nicho.potencial}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">1. Finanças e Investimentos</h2>
            <p className="text-muted-foreground leading-relaxed">
              O nicho de finanças é o <strong>rei do CPM</strong> no YouTube Brasil. Anunciantes de bancos, 
              corretoras e fintechs pagam valores altíssimos para atingir pessoas interessadas em dinheiro.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Sub-nichos populares:</strong> Renda fixa, ações, criptomoedas, finanças pessoais, 
              independência financeira, day trade.
            </p>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">2. Tecnologia e Reviews</h2>
            <p className="text-muted-foreground leading-relaxed">
              Reviews de smartphones, notebooks, gadgets e software atraem anunciantes de tecnologia 
              dispostos a pagar bem por exposição.
            </p>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">3. Saúde e Bem-estar</h2>
            <p className="text-muted-foreground leading-relaxed">
              Conteúdo sobre emagrecimento, exercícios, nutrição e saúde mental tem alta demanda 
              e bom CPM, especialmente no início do ano.
            </p>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">4. Educação e Tutoriais</h2>
            <p className="text-muted-foreground leading-relaxed">
              Tutoriais de programação, idiomas, Excel e outras habilidades são evergreen e 
              atraem público qualificado.
            </p>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">5. True Crime e Mistérios</h2>
            <p className="text-muted-foreground leading-relaxed">
              Um dos nichos que mais crescem, com alta retenção de audiência. Perfeito para 
              canais dark automatizados com narração e imagens cinematográficas.
            </p>

            <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 my-8">
              <h3 className="text-xl font-bold mb-3 text-primary">💡 Estratégia Inteligente</h3>
              <p className="text-muted-foreground">
                Combine um nicho de alto CPM com formato de canal dark para maximizar ganhos 
                com menor esforço. Por exemplo: finanças + animação/infográficos.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Como Escolher Seu Nicho?</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Interesse pessoal:</strong> Você precisa consumir conteúdo do nicho para entender o público</li>
              <li><strong>Competição:</strong> Nichos saturados exigem diferenciação maior</li>
              <li><strong>Monetização:</strong> Considere CPM + potencial de afiliados e produtos próprios</li>
              <li><strong>Escalabilidade:</strong> O nicho permite criar conteúdo de forma consistente?</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Conclusão</h2>
            <p className="text-muted-foreground leading-relaxed">
              O melhor nicho é aquele que combina bom CPM com sua capacidade de produzir conteúdo 
              de qualidade de forma consistente. Não escolha apenas pelo dinheiro - escolha algo 
              que você consegue manter a longo prazo.
            </p>
          </div>

          <div className="mt-12 p-8 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl border border-primary/30 text-center">
            <h3 className="text-2xl font-bold mb-4">Analise nichos com IA</h3>
            <p className="text-muted-foreground mb-6">
              Use a La Casa Dark CORE para descobrir tendências, analisar concorrência e encontrar oportunidades em qualquer nicho.
            </p>
            <Link to="/auth">
              <Button size="lg">Começar Análise Gratuita</Button>
            </Link>
          </div>

          <RelatedArticles currentSlug="nichos-lucrativos-youtube" currentCategory="Nichos" />
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

export default NichosLucrativosYouTube;
