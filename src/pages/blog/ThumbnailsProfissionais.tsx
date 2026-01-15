import { Link } from "react-router-dom";
import { ArrowLeft, Clock, Calendar, User, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import SEOHead from "@/components/seo/SEOHead";
import { RelatedArticles } from "@/components/blog/RelatedArticles";
import coverImage from "@/assets/blog/thumbnails-profissionais.jpg";

const ThumbnailsProfissionais = () => {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Thumbnails Profissionais: Como Criar Capas que Aumentam Cliques",
    "description": "Aprenda a criar thumbnails que aumentam CTR e atraem mais visualizações para seus vídeos.",
    "author": { "@type": "Organization", "name": "La Casa Dark CORE" },
    "publisher": { "@type": "Organization", "name": "La Casa Dark CORE" },
    "datePublished": "2025-01-07"
  };

  return (
    <>
      <SEOHead
        title="Thumbnails Profissionais: Como Criar Capas que Convertem"
        description="Domine a arte de criar thumbnails que aumentam CTR. Técnicas de design, psicologia das cores e exemplos práticos para YouTube."
        canonical="/blog/thumbnails-profissionais"
        ogType="article"
        keywords="thumbnails youtube, como fazer thumbnail, ctr youtube, capa de video, thumbnail profissional"
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
            Thumbnails Profissionais: Como Criar Capas que Convertem
          </h1>

          <div className="aspect-video rounded-2xl mb-8 overflow-hidden border border-border/50">
            <img src={coverImage} alt="Thumbnails Profissionais: Como Criar Capas que Convertem" className="w-full h-full object-cover" />
          </div>

          <div className="prose prose-lg prose-invert max-w-none">
            <p className="text-xl text-muted-foreground leading-relaxed">
              A thumbnail é responsável por até 90% da decisão de clicar em um vídeo. 
              Aprenda os princípios de design que transformam impressões em cliques.
            </p>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">A Anatomia de uma Thumbnail Viral</h2>
            <p className="text-muted-foreground leading-relaxed">
              Thumbnails eficazes compartilham elementos em comum:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Alto contraste:</strong> Cores vibrantes que se destacam</li>
              <li><strong>Texto legível:</strong> Máximo 3-4 palavras, fonte grande</li>
              <li><strong>Emoção clara:</strong> Expressões faciais ou elementos visuais impactantes</li>
              <li><strong>Composição limpa:</strong> Foco em um elemento principal</li>
              <li><strong>Curiosidade:</strong> Algo que faz o espectador querer saber mais</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Psicologia das Cores</h2>
            <p className="text-muted-foreground leading-relaxed">
              Cores evocam emoções específicas:
            </p>
            <div className="grid grid-cols-2 gap-4 my-6">
              <div className="p-4 bg-red-500/20 rounded-xl border border-red-500/30">
                <h4 className="font-bold text-red-400">Vermelho</h4>
                <p className="text-sm text-muted-foreground">Urgência, paixão, perigo</p>
              </div>
              <div className="p-4 bg-yellow-500/20 rounded-xl border border-yellow-500/30">
                <h4 className="font-bold text-yellow-400">Amarelo</h4>
                <p className="text-sm text-muted-foreground">Atenção, otimismo, energia</p>
              </div>
              <div className="p-4 bg-blue-500/20 rounded-xl border border-blue-500/30">
                <h4 className="font-bold text-blue-400">Azul</h4>
                <p className="text-sm text-muted-foreground">Confiança, calma, profissionalismo</p>
              </div>
              <div className="p-4 bg-green-500/20 rounded-xl border border-green-500/30">
                <h4 className="font-bold text-green-400">Verde</h4>
                <p className="text-sm text-muted-foreground">Sucesso, dinheiro, crescimento</p>
              </div>
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Regras de Texto</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Menos é mais:</strong> 3-4 palavras no máximo</li>
              <li><strong>Fonte bold:</strong> Sem serifa, alta legibilidade</li>
              <li><strong>Outline/sombra:</strong> Para destacar do fundo</li>
              <li><strong>Hierarquia:</strong> Palavra principal maior</li>
              <li><strong>Posicionamento:</strong> Evite cobrir elementos importantes</li>
            </ul>

            <div className="bg-primary/10 border border-primary/30 rounded-xl p-6 my-8">
              <h3 className="text-xl font-bold mb-3 text-primary">💡 Dica de Ouro</h3>
              <p className="text-muted-foreground">
                Teste sua thumbnail em tamanho pequeno (como aparece na busca). 
                Se você não consegue entender o que está acontecendo, simplifique.
              </p>
            </div>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Elementos que Funcionam</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Rostos com emoção:</strong> Humanos são atraídos por expressões</li>
              <li><strong>Setas e círculos:</strong> Direcionam atenção</li>
              <li><strong>Números:</strong> "10 formas de..." chama atenção</li>
              <li><strong>Antes/Depois:</strong> Mostra transformação</li>
              <li><strong>Contraste de tamanho:</strong> Algo grande vs. algo pequeno</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Thumbnails para Canais Dark</h2>
            <p className="text-muted-foreground leading-relaxed">
              Canais sem rosto precisam de abordagens diferentes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Use imagens cinematográficas geradas por IA</li>
              <li>Crie atmosfera (mistério, tensão, drama)</li>
              <li>Use silhuetas e sombras</li>
              <li>Simbolismo forte (objetos que representam o tema)</li>
              <li>Paleta de cores consistente com a marca</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Ferramentas Recomendadas</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Canva:</strong> Fácil para iniciantes, muitos templates</li>
              <li><strong>Photoshop:</strong> Controle total, curva de aprendizado</li>
              <li><strong>Midjourney/DALL-E:</strong> Imagens únicas com IA</li>
              <li><strong>La Casa Dark CORE:</strong> Gerador especializado para thumbnails de canais dark</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Teste A/B de Thumbnails</h2>
            <p className="text-muted-foreground leading-relaxed">
              O YouTube permite testar diferentes thumbnails. Regras:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Teste uma variável por vez (cor, texto ou imagem)</li>
              <li>Deixe rodar por pelo menos 1 semana</li>
              <li>Avalie CTR, não apenas visualizações</li>
              <li>Documente o que funciona para replicar</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Erros Comuns</h2>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Texto demais (difícil de ler em tamanho pequeno)</li>
              <li>Cores sem contraste (se perde no feed)</li>
              <li>Qualidade baixa (parece amador)</li>
              <li>Clickbait extremo (prejudica retenção)</li>
              <li>Inconsistência visual (não cria marca)</li>
            </ul>

            <h2 className="text-2xl font-bold mt-12 mb-4 text-foreground">Conclusão</h2>
            <p className="text-muted-foreground leading-relaxed">
              Uma thumbnail profissional pode dobrar seu CTR. Invista tempo aprendendo design, 
              teste constantemente e desenvolva um estilo visual reconhecível.
            </p>
          </div>

          <div className="mt-12 p-8 bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl border border-primary/30 text-center">
            <h3 className="text-2xl font-bold mb-4">Crie thumbnails com IA</h3>
            <p className="text-muted-foreground mb-6">
              Gere imagens cinematográficas perfeitas para thumbnails em segundos.
            </p>
            <Link to="/auth">
              <Button size="lg">Criar Thumbnails Agora</Button>
            </Link>
          </div>

          <RelatedArticles currentSlug="thumbnails-profissionais" currentCategory="Thumbnails" />
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

export default ThumbnailsProfissionais;
