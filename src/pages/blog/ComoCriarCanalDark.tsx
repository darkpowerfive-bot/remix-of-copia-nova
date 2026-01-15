import { Link } from "react-router-dom";
import { ArrowLeft, Clock, Calendar, User, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/seo/SEOHead";
import { RelatedArticles } from "@/components/blog/RelatedArticles";
import coverImage from "@/assets/blog/como-criar-canal-dark.jpg";

const ComoCriarCanalDark = () => {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Como Criar um Canal Dark do Zero em 2025: Guia Definitivo",
    "description": "Aprenda passo a passo como criar um canal dark no YouTube, desde a escolha do nicho até a monetização.",
    "author": { "@type": "Organization", "name": "La Casa Dark CORE" },
    "publisher": { "@type": "Organization", "name": "La Casa Dark CORE" },
    "datePublished": "2025-01-07",
    "dateModified": "2025-01-07"
  };

  const passos = [
    { titulo: "Escolha do Nicho", descricao: "Defina um nicho específico e lucrativo" },
    { titulo: "Criação do Canal", descricao: "Configure nome, arte e descrição otimizados" },
    { titulo: "Pesquisa de Tendências", descricao: "Encontre tópicos virais no seu nicho" },
    { titulo: "Criação de Roteiros", descricao: "Escreva scripts envolventes com IA" },
    { titulo: "Produção de Imagens", descricao: "Gere visuais cinematográficos" },
    { titulo: "Narração e Áudio", descricao: "Adicione voz e trilha sonora" },
    { titulo: "Edição e Montagem", descricao: "Junte tudo em vídeos profissionais" },
    { titulo: "Upload e Otimização", descricao: "Publique com SEO otimizado" },
  ];

  return (
    <>
      <SEOHead
        title="Como Criar um Canal Dark do Zero em 2025: Guia Definitivo"
        description="Aprenda passo a passo como criar um canal dark no YouTube. Guia completo desde a escolha do nicho até a primeira monetização."
        canonical="/blog/como-criar-canal-dark"
        ogType="article"
        keywords="como criar canal dark, canal dark youtube, canal automatizado, canal sem aparecer, faceless youtube"
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
            Como Criar um Canal Dark do Zero em 2025: Guia Definitivo
          </h1>

          <div className="aspect-video rounded-2xl mb-8 overflow-hidden border border-border/50">
            <img src={coverImage} alt="Como Criar um Canal Dark do Zero em 2025" className="w-full h-full object-cover" />
          </div>

          <div className="prose prose-lg prose-invert max-w-none">
            <p className="text-xl text-muted-foreground leading-relaxed">
              Canais dark são canais do YouTube onde o criador não aparece. Eles usam narração, 
              imagens, animações e música para contar histórias. Este guia mostra como criar o seu do zero.
            </p>

            <h2 className="text-2xl font-bold mt-12 mb-6 text-foreground">Os 8 Passos para Criar seu Canal Dark</h2>
            
            <div className="grid gap-4 my-8">
              {passos.map((passo, index) => (
                <div key={index} className="flex items-start gap-4 p-4 bg-card rounded-xl border border-border/50">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold shrink-0">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{passo.titulo}</h3>
                    <p className="text-sm text-muted-foreground">{passo.descricao}</p>
                  </div>
                </div>
              ))}
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Passo 1: Escolha do Nicho</h2>
            <p className="text-muted-foreground leading-relaxed">
              O nicho define todo o resto. Escolha algo que:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Tenha demanda comprovada (pesquise no YouTube)</li>
              <li>Permita conteúdo visual interessante</li>
              <li>Tenha bom CPM para monetização</li>
              <li>Você consiga produzir consistentemente</li>
            </ul>
            <p className="text-muted-foreground leading-relaxed">
              <strong>Nichos populares para canais dark:</strong> True crime, mistérios históricos, 
              curiosidades científicas, biografias, explicações de filmes, finanças, tecnologia.
            </p>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Passo 2: Criação do Canal</h2>
            <p className="text-muted-foreground leading-relaxed">
              Configure seu canal profissionalmente:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Nome:</strong> Memorável, relacionado ao nicho, fácil de pesquisar</li>
              <li><strong>Logo:</strong> Simples, reconhecível em tamanho pequeno</li>
              <li><strong>Banner:</strong> Profissional, com proposta de valor clara</li>
              <li><strong>Descrição:</strong> Otimizada para SEO com palavras-chave do nicho</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Passo 3: Pesquisa de Tendências</h2>
            <p className="text-muted-foreground leading-relaxed">
              Antes de criar qualquer vídeo, pesquise o que está funcionando:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Analise vídeos virais de canais similares</li>
              <li>Use o Google Trends para identificar picos de interesse</li>
              <li>Observe padrões de títulos e thumbnails que funcionam</li>
              <li>Identifique lacunas - tópicos pouco explorados</li>
            </ul>

            <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 my-8">
              <h3 className="text-xl font-bold mb-3 text-primary">🚀 Dica: Use IA para Acelerar</h3>
              <p className="text-muted-foreground">
                A La Casa Dark CORE analisa canais automaticamente e identifica vídeos virais, 
                tendências e oportunidades no seu nicho. Economize horas de pesquisa manual.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Passo 4: Criação de Roteiros</h2>
            <p className="text-muted-foreground leading-relaxed">
              Um bom roteiro é a base de um vídeo viral. Estrutura recomendada:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Gancho (0-30s):</strong> Capte atenção imediatamente</li>
              <li><strong>Contexto (30s-2min):</strong> Estabeleça o cenário</li>
              <li><strong>Desenvolvimento (2-8min):</strong> Conte a história com tensão</li>
              <li><strong>Clímax (8-9min):</strong> Momento mais impactante</li>
              <li><strong>Conclusão (9-10min):</strong> Reflexão e call-to-action</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Passo 5: Produção de Imagens</h2>
            <p className="text-muted-foreground leading-relaxed">
              As imagens são o diferencial de um canal dark profissional:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Use geradores de imagem com IA para criar visuais únicos</li>
              <li>Mantenha um estilo visual consistente</li>
              <li>Crie imagens que complementem a narração</li>
              <li>Evite imagens genéricas de banco de imagens</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Passo 6: Narração e Áudio</h2>
            <p className="text-muted-foreground leading-relaxed">
              A narração define o tom do seu canal:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Voz própria:</strong> Mais autêntico, maior conexão</li>
              <li><strong>Voz IA:</strong> Escalável, consistente, várias opções</li>
              <li><strong>Trilha sonora:</strong> Use músicas sem copyright que combinem com o tom</li>
              <li><strong>Efeitos sonoros:</strong> Adicionam imersão e profissionalismo</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Passo 7: Edição e Montagem</h2>
            <p className="text-muted-foreground leading-relaxed">
              Una todos os elementos em um vídeo coeso:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Sincronize imagens com a narração</li>
              <li>Adicione transições suaves</li>
              <li>Inclua legendas para acessibilidade</li>
              <li>Aplique color grading para visual cinematográfico</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Passo 8: Upload e Otimização</h2>
            <p className="text-muted-foreground leading-relaxed">
              Um vídeo bem otimizado tem mais chances de viralizar:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Título:</strong> Atrativo, com palavra-chave principal</li>
              <li><strong>Thumbnail:</strong> Alto contraste, texto legível, emoção</li>
              <li><strong>Descrição:</strong> Primeiras linhas otimizadas, links relevantes</li>
              <li><strong>Tags:</strong> Palavras-chave relacionadas ao tópico</li>
              <li><strong>Horário:</strong> Publique quando sua audiência está ativa</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Quanto Tempo Leva para Monetizar?</h2>
            <p className="text-muted-foreground leading-relaxed">
              Com consistência (3-5 vídeos por semana), a maioria dos canais dark atinge:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>1.000 inscritos:</strong> 1-3 meses</li>
              <li><strong>4.000 horas:</strong> 2-4 meses</li>
              <li><strong>Primeira monetização:</strong> 3-6 meses</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Conclusão</h2>
            <p className="text-muted-foreground leading-relaxed">
              Criar um canal dark é uma maratona, não uma corrida. Foque em qualidade, 
              consistência e melhoria contínua. Com as ferramentas certas e dedicação, 
              você pode construir uma fonte de renda passiva significativa.
            </p>
          </div>

          <div className="mt-12 p-8 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl border border-primary/30 text-center">
            <h3 className="text-2xl font-bold mb-4">Crie seu canal dark com IA</h3>
            <p className="text-muted-foreground mb-6">
              A La Casa Dark CORE automatiza roteiros, imagens e análises para você focar no crescimento.
            </p>
            <Link to="/auth">
              <Button size="lg">Criar Meu Canal Agora</Button>
            </Link>
          </div>

          <RelatedArticles currentSlug="como-criar-canal-dark" currentCategory="Guia Completo" />
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

export default ComoCriarCanalDark;
