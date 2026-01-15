import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SEOHead } from "@/components/seo/SEOHead";
import { RelatedArticles } from "@/components/blog/RelatedArticles";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Calendar, Clock, User, Share2, Loader2, ExternalLink, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.gif";

interface BlogArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category: string;
  read_time: string | null;
  image_url: string | null;
  meta_description: string | null;
  meta_keywords: string[] | null;
  is_published: boolean;
  created_at: string;
  published_at: string | null;
  product_url?: string | null;
  product_title?: string | null;
  product_cta?: string | null;
}

const DynamicArticle = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<BlogArticle | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("blog_articles")
          .select("*")
          .eq("slug", slug)
          .eq("is_published", true)
          .single();

        if (error || !data) {
          setNotFound(true);
        } else {
          setArticle(data);
          
          // Track page view
          try {
            await supabase.functions.invoke("track-blog-view", {
              body: { 
                pagePath: `/blog/${slug}`,
                articleId: data.id 
              },
            });
          } catch (e) {
            // Silent fail for analytics
          }
        }
      } catch (err) {
        console.error("Error fetching article:", err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  const handleShare = async () => {
    if (!article) return;

    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: article.title,
          text: article.excerpt || "",
          url: url,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    }
  };

  const handleProductClick = async () => {
    if (!article?.product_url) return;
    
    // Track the click
    try {
      await supabase.functions.invoke("track-product-click", {
        body: {
          articleId: article.id,
          productUrl: article.product_url,
          productTitle: article.product_title,
          referrer: document.referrer,
          userAgent: navigator.userAgent,
        },
      });
    } catch (e) {
      // Silent fail for analytics
    }
    
    // Open the link
    window.open(article.product_url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !article) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-4xl font-bold mb-4">Artigo não encontrado</h1>
        <p className="text-muted-foreground mb-8">
          O artigo que você procura não existe ou foi removido.
        </p>
        <Link to="/blog">
          <Button>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Blog
          </Button>
        </Link>
      </div>
    );
  }

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": article.title,
    "description": article.meta_description || article.excerpt,
    "image": article.image_url,
    "datePublished": article.published_at || article.created_at,
    "author": {
      "@type": "Organization",
      "name": "La Casa Dark",
    },
    "publisher": {
      "@type": "Organization",
      "name": "La Casa Dark",
      "logo": {
        "@type": "ImageObject",
        "url": "https://canaisdarks.com.br/logo.gif",
      },
    },
  };

  const publishDate = article.published_at || article.created_at;

  return (
    <>
      <SEOHead
        title={`${article.title} - La Casa Dark Blog`}
        description={article.meta_description || article.excerpt || ""}
        canonical={`/blog/${article.slug}`}
        ogType="article"
        keywords={article.meta_keywords?.join(", ") || article.category}
        jsonLd={articleJsonLd}
      />

      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/blog" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Voltar ao Blog</span>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleShare}>
              <Share2 className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Article */}
        <article className="max-w-4xl mx-auto px-4 py-12">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6">
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(publishDate).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {article.read_time || "5 min de leitura"}
            </span>
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              La Casa Dark
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
            {article.title}
          </h1>

          {/* Category Badge */}
          <Badge className="mb-8 bg-primary/20 text-primary hover:bg-primary/30">
            {article.category}
          </Badge>

          {/* Cover Image */}
          {article.image_url && (
            <div className="relative rounded-2xl overflow-hidden mb-10 aspect-video">
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
            </div>
          )}

          {/* Content - Otimizado para máxima legibilidade e SEO */}
          <div
            className="prose prose-lg dark:prose-invert max-w-none leading-relaxed
              
              /* Espaçamento geral entre elementos */
              [&>*]:mb-8
              [&>*:last-child]:mb-0
              
              /* Headings com muito respiro */
              prose-headings:font-bold prose-headings:text-foreground prose-headings:scroll-mt-24
              
              /* H2 - Seções principais com destaque forte */
              prose-h2:text-2xl prose-h2:md:text-3xl 
              prose-h2:mt-16 prose-h2:mb-8 
              prose-h2:pt-8 prose-h2:pb-4 
              prose-h2:border-t prose-h2:border-b prose-h2:border-primary/30
              prose-h2:bg-gradient-to-r prose-h2:from-primary/5 prose-h2:to-transparent
              prose-h2:px-4 prose-h2:-mx-4 prose-h2:rounded-lg
              
              /* H3 - Subseções com cor de destaque */
              prose-h3:text-xl prose-h3:md:text-2xl 
              prose-h3:mt-12 prose-h3:mb-6 
              prose-h3:text-primary 
              prose-h3:border-l-4 prose-h3:border-primary 
              prose-h3:pl-4 prose-h3:-ml-4
              
              /* H4 - Tópicos menores */
              prose-h4:text-lg prose-h4:md:text-xl
              prose-h4:mt-10 prose-h4:mb-5 
              prose-h4:font-semibold prose-h4:text-foreground/90
              
              /* Parágrafos com bom espaçamento e line-height */
              prose-p:text-muted-foreground 
              prose-p:leading-[1.9] prose-p:md:leading-[2]
              prose-p:my-6 prose-p:md:my-7
              prose-p:text-base prose-p:md:text-lg
              
              /* Links */
              prose-a:text-primary prose-a:font-medium prose-a:underline prose-a:underline-offset-4 hover:prose-a:text-primary/80
              
              /* Strong/Bold */
              prose-strong:text-foreground prose-strong:font-bold
              
              /* Listas com espaçamento generoso */
              prose-ul:my-8 prose-ul:md:my-10 prose-ul:text-muted-foreground prose-ul:pl-0
              prose-ol:my-8 prose-ol:md:my-10 prose-ol:text-muted-foreground prose-ol:pl-0
              
              /* Items de lista com respiro entre eles */
              prose-li:text-base prose-li:md:text-lg 
              prose-li:leading-[1.8] 
              prose-li:mb-4
              prose-li:pl-2
              
              /* Blockquotes com destaque visual forte */
              prose-blockquote:border-l-4 prose-blockquote:border-primary 
              prose-blockquote:bg-primary/10 
              prose-blockquote:rounded-r-xl 
              prose-blockquote:py-6 prose-blockquote:px-8 
              prose-blockquote:my-10 prose-blockquote:md:my-12
              prose-blockquote:italic prose-blockquote:text-foreground/90
              prose-blockquote:shadow-sm
              prose-blockquote:text-lg
              
              /* Code */
              prose-code:bg-muted prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-sm prose-code:text-primary
              prose-pre:bg-muted prose-pre:rounded-xl prose-pre:p-6 prose-pre:my-10
              
              /* Divisores */
              prose-hr:border-border prose-hr:my-16
              
              /* Imagens */
              prose-img:rounded-xl prose-img:shadow-lg prose-img:my-10
              
              /* Lista não ordenada customizada */
              [&_ul]:list-none [&_ul>li]:relative [&_ul>li]:pl-8 [&_ul>li]:mb-4
              [&_ul>li]:before:content-['▸'] [&_ul>li]:before:absolute [&_ul>li]:before:left-0 [&_ul>li]:before:text-primary [&_ul>li]:before:font-bold [&_ul>li]:before:text-lg
              
              /* Lista ordenada */
              [&_ol]:list-decimal [&_ol]:list-inside [&_ol>li]:pl-2 [&_ol>li]:mb-4
              [&_ol>li::marker]:text-primary [&_ol>li::marker]:font-bold
              
              /* Espaço extra após listas */
              [&_ul+p]:mt-10 [&_ol+p]:mt-10
              [&_p+ul]:mt-8 [&_p+ol]:mt-8
              
              /* Espaço entre seções */
              [&_h2+p]:mt-6
              [&_h3+p]:mt-4
              [&_h2+ul]:mt-6 [&_h2+ol]:mt-6
              [&_h3+ul]:mt-4 [&_h3+ol]:mt-4"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* Product/Affiliate Card */}
          {article.product_url && (
            <div className="mt-10 p-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl border border-primary/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground font-medium">Produto Recomendado</span>
              </div>
              {article.product_title && (
                <h4 className="text-xl font-bold mb-4">{article.product_title}</h4>
              )}
              <Button 
                size="lg" 
                className="gradient-button"
                onClick={handleProductClick}
              >
                {article.product_cta || "Saiba Mais"}
                <ExternalLink className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {/* CTA */}
          <div className="mt-16 p-8 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl border border-primary/20">
            <h3 className="text-2xl font-bold mb-4">
              Pronto para criar seu canal de sucesso?
            </h3>
            <p className="text-muted-foreground mb-6">
              Acesse a La Casa Dark CORE e tenha todas as ferramentas de IA para criar conteúdo viral.
            </p>
            <Link to="/auth">
              <Button size="lg" className="gradient-button">
                Começar Agora
              </Button>
            </Link>
          </div>

          {/* Related Articles */}
          <RelatedArticles currentSlug={article.slug} currentCategory={article.category} />
        </article>

        {/* Footer */}
        <footer className="border-t border-border py-8 mt-12">
          <div className="max-w-4xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <Link to="/landing" className="flex items-center gap-2">
              <img src={logo} alt="La Casa Dark" className="w-8 h-8 rounded-full" />
              <span className="font-semibold">La Casa Dark</span>
            </Link>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} La Casa Dark. Todos os direitos reservados.
            </p>
          </div>
        </footer>
      </div>
    </>
  );
};

export default DynamicArticle;
