import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, ArrowRight } from "lucide-react";

// Dados centralizados dos artigos
export const blogArticlesData = [
  {
    slug: "como-ganhar-dinheiro-youtube",
    title: "Como Ganhar Dinheiro no YouTube em 2025",
    excerpt: "Estratégias comprovadas para monetizar seu canal",
    category: "Monetização",
    readTime: "15 min",
  },
  {
    slug: "nichos-lucrativos-youtube",
    title: "10 Nichos Mais Lucrativos do YouTube",
    excerpt: "Descubra os nichos que mais pagam",
    category: "Nichos",
    readTime: "12 min",
  },
  {
    slug: "como-criar-canal-dark",
    title: "Como Criar um Canal Dark do Zero",
    excerpt: "Guia definitivo para iniciantes",
    category: "Guia Completo",
    readTime: "20 min",
  },
  {
    slug: "shorts-virais",
    title: "Como Fazer Shorts Virais no YouTube",
    excerpt: "Técnicas para criar Shorts que explodem",
    category: "Shorts",
    readTime: "14 min",
  },
  {
    slug: "roteiros-virais-ia",
    title: "Roteiros Virais com Inteligência Artificial",
    excerpt: "Crie scripts que geram milhões de views",
    category: "Roteiros",
    readTime: "18 min",
  },
  {
    slug: "thumbnails-profissionais",
    title: "Thumbnails Profissionais que Convertem",
    excerpt: "Design que aumenta CTR significativamente",
    category: "Thumbnails",
    readTime: "14 min",
  },
  {
    slug: "seo-youtube",
    title: "SEO para YouTube: Ranqueie Vídeos",
    excerpt: "Domine o algoritmo com técnicas avançadas",
    category: "SEO",
    readTime: "16 min",
  },
  {
    slug: "algoritmo-youtube",
    title: "Como Funciona o Algoritmo do YouTube",
    excerpt: "Entenda as métricas que importam",
    category: "Algoritmo",
    readTime: "15 min",
  },
  {
    slug: "ferramentas-criacao-videos",
    title: "Melhores Ferramentas para Criar Vídeos",
    excerpt: "Comparativo completo de ferramentas",
    category: "Ferramentas",
    readTime: "20 min",
  },
  {
    slug: "monetizacao-afiliados",
    title: "Monetização com Afiliados no YouTube",
    excerpt: "Ganhe dinheiro sem AdSense",
    category: "Afiliados",
    readTime: "18 min",
  },
  {
    slug: "crescimento-rapido",
    title: "Estratégias de Crescimento Rápido",
    excerpt: "De 0 a 1.000 inscritos em semanas",
    category: "Crescimento",
    readTime: "16 min",
  },
];

// Mapeamento de categorias relacionadas
const categoryRelations: Record<string, string[]> = {
  "Monetização": ["Afiliados", "Nichos", "Crescimento"],
  "Nichos": ["Monetização", "Guia Completo", "Crescimento"],
  "Guia Completo": ["Nichos", "Ferramentas", "Roteiros"],
  "Shorts": ["Algoritmo", "Crescimento", "Thumbnails"],
  "Roteiros": ["Ferramentas", "Guia Completo", "SEO"],
  "Thumbnails": ["SEO", "Algoritmo", "Shorts"],
  "SEO": ["Algoritmo", "Thumbnails", "Crescimento"],
  "Algoritmo": ["SEO", "Shorts", "Crescimento"],
  "Ferramentas": ["Roteiros", "Thumbnails", "Guia Completo"],
  "Afiliados": ["Monetização", "Nichos", "Crescimento"],
  "Crescimento": ["Algoritmo", "Shorts", "SEO"],
};

interface RelatedArticlesProps {
  currentSlug: string;
  currentCategory: string;
  maxArticles?: number;
}

export const RelatedArticles = ({ 
  currentSlug, 
  currentCategory, 
  maxArticles = 3 
}: RelatedArticlesProps) => {
  // Encontrar artigos relacionados
  const relatedCategories = categoryRelations[currentCategory] || [];
  
  const relatedArticles = blogArticlesData
    .filter(article => article.slug !== currentSlug)
    .sort((a, b) => {
      // Priorizar categorias relacionadas
      const aIndex = relatedCategories.indexOf(a.category);
      const bIndex = relatedCategories.indexOf(b.category);
      
      if (aIndex !== -1 && bIndex === -1) return -1;
      if (aIndex === -1 && bIndex !== -1) return 1;
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      
      return 0;
    })
    .slice(0, maxArticles);

  if (relatedArticles.length === 0) return null;

  return (
    <div className="mt-16 pt-12 border-t border-border/50">
      <h3 className="text-2xl font-bold mb-8 flex items-center gap-2">
        📚 Artigos Relacionados
      </h3>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {relatedArticles.map((article) => (
          <Link key={article.slug} to={`/blog/${article.slug}`}>
            <Card className="group h-full overflow-hidden hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="outline" className="text-xs">
                    {article.category}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {article.readTime}
                  </span>
                </div>
                <h4 className="font-semibold mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {article.title}
                </h4>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {article.excerpt}
                </p>
                <span className="text-sm text-primary flex items-center gap-1 group-hover:gap-2 transition-all">
                  Ler artigo <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default RelatedArticles;
