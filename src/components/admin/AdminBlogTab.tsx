import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FileText,
  Plus,
  Rocket,
  Loader2,
  Eye,
  Edit,
  Trash2,
  Globe,
  GlobeLock,
  RefreshCw,
  Search,
  Image,
  ImagePlus,
  Youtube,
  Newspaper,
  Type,
  Clock,
  Calendar,
  Wand2,
  TrendingUp,
  BarChart3,
  ShoppingBag,
  MousePointerClick,
  ExternalLink,
} from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
  updated_at: string;
  published_at: string | null;
  view_count?: number;
  seo_score?: number;
  product_url?: string | null;
  product_title?: string | null;
  product_cta?: string | null;
}

interface BlogViewStats {
  total_views: number;
  views_7d: number;
  views_30d: number;
  unique_visitors: number;
}

interface DailyViewData {
  date: string;
  views: number;
  label: string;
}

interface ProductClickStats {
  total_clicks: number;
  clicks_7d: number;
  clicks_30d: number;
  top_products: Array<{
    product_title: string | null;
    product_url: string;
    clicks: number;
    article_title: string | null;
  }>;
}

const CATEGORIES = [
  "YouTube",
  "Monetização",
  "SEO",
  "Thumbnails",
  "Roteiros",
  "Shorts",
  "Ferramentas",
  "Crescimento",
  "Dark Channels",
  "Afiliados",
  "Inteligência Artificial",
];

export const AdminBlogTab = () => {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatingCover, setGeneratingCover] = useState<string | null>(null);
  const [regeneratingContent, setRegeneratingContent] = useState<string | null>(null);
  const [regeneratingAll, setRegeneratingAll] = useState(false);
  const [regeneratingProgress, setRegeneratingProgress] = useState({ current: 0, total: 0 });
  const [regeneratingCovers, setRegeneratingCovers] = useState(false);
  const [coversProgress, setCoversProgress] = useState({ current: 0, total: 0 });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewStats, setViewStats] = useState<BlogViewStats>({
    total_views: 0,
    views_7d: 0,
    views_30d: 0,
    unique_visitors: 0,
  });
  const [dailyViews, setDailyViews] = useState<DailyViewData[]>([]);
  const [productClickStats, setProductClickStats] = useState<ProductClickStats>({
    total_clicks: 0,
    clicks_7d: 0,
    clicks_30d: 0,
    top_products: [],
  });

  // Generate modal
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [generateMode, setGenerateMode] = useState<"keyword" | "youtube" | "news">("keyword");
  const [generateTopic, setGenerateTopic] = useState("");
  const [generateYoutubeUrl, setGenerateYoutubeUrl] = useState("");
  const [generateCategory, setGenerateCategory] = useState("YouTube");
  const [generateWithCover, setGenerateWithCover] = useState(true);
  const [generateCoverStyle, setGenerateCoverStyle] = useState("cinematic");
  const [generateProductName, setGenerateProductName] = useState("");
  const [generateProductUrl, setGenerateProductUrl] = useState("");
  const [generateProductCta, setGenerateProductCta] = useState("Saiba Mais");

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<BlogArticle | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "YouTube",
    read_time: "5 min",
    meta_description: "",
    image_url: "",
    product_url: "",
    product_title: "",
    product_cta: "Saiba Mais",
  });

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingArticle, setDeletingArticle] = useState<BlogArticle | null>(null);

  // Preview modal
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [previewArticle, setPreviewArticle] = useState<BlogArticle | null>(null);

  useEffect(() => {
    fetchArticles();
    fetchViewStats();
    fetchDailyViews();
    fetchProductClickStats();
  }, []);

  const fetchArticles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("blog_articles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setArticles(data || []);
    } catch (error) {
      console.error("Error fetching articles:", error);
      toast.error("Erro ao carregar artigos");
    } finally {
      setLoading(false);
    }
  };

  const fetchViewStats = async () => {
    try {
      const now = new Date();
      const date7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const date30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get total views
      const { count: totalViews } = await supabase
        .from("blog_page_views")
        .select("*", { count: "exact", head: true });

      // Get views last 7 days
      const { count: views7d } = await supabase
        .from("blog_page_views")
        .select("*", { count: "exact", head: true })
        .gte("view_date", date7d);

      // Get views last 30 days
      const { count: views30d } = await supabase
        .from("blog_page_views")
        .select("*", { count: "exact", head: true })
        .gte("view_date", date30d);

      // Get unique visitors (distinct hashes)
      const { data: uniqueData } = await supabase
        .from("blog_page_views")
        .select("visitor_hash");
      
      const uniqueVisitors = new Set(uniqueData?.map(v => v.visitor_hash) || []).size;

      setViewStats({
        total_views: totalViews || 0,
        views_7d: views7d || 0,
        views_30d: views30d || 0,
        unique_visitors: uniqueVisitors,
      });
    } catch (error) {
      console.error("Error fetching view stats:", error);
    }
  };

  const fetchDailyViews = async () => {
    try {
      const now = new Date();
      const date30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      // Get all views from last 30 days
      const { data: viewsData } = await supabase
        .from("blog_page_views")
        .select("view_date")
        .gte("view_date", date30d.toISOString().split('T')[0])
        .order("view_date", { ascending: true });

      // Aggregate by date
      const viewsByDate: Record<string, number> = {};
      
      // Initialize all dates with 0
      for (let i = 29; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().split('T')[0];
        viewsByDate[dateStr] = 0;
      }

      // Count views per day
      viewsData?.forEach(v => {
        if (viewsByDate[v.view_date] !== undefined) {
          viewsByDate[v.view_date]++;
        }
      });

      // Convert to array format for chart
      const chartData: DailyViewData[] = Object.entries(viewsByDate).map(([date, views]) => {
        const d = new Date(date);
        return {
          date,
          views,
          label: `${d.getDate()}/${d.getMonth() + 1}`,
        };
      });

      setDailyViews(chartData);
    } catch (error) {
      console.error("Error fetching daily views:", error);
    }
  };

  const fetchProductClickStats = async () => {
    try {
      const now = new Date();
      const date7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const date30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      // Get total clicks
      const { count: totalClicks } = await supabase
        .from("product_clicks")
        .select("*", { count: "exact", head: true });

      // Get clicks last 7 days
      const { count: clicks7d } = await supabase
        .from("product_clicks")
        .select("*", { count: "exact", head: true })
        .gte("click_date", date7d);

      // Get clicks last 30 days
      const { count: clicks30d } = await supabase
        .from("product_clicks")
        .select("*", { count: "exact", head: true })
        .gte("click_date", date30d);

      // Get top products by clicks
      const { data: clicksData } = await supabase
        .from("product_clicks")
        .select(`
          product_url,
          product_title,
          article_id
        `);

      // Aggregate clicks by product URL
      const productClickCounts: Record<string, { 
        clicks: number; 
        product_title: string | null; 
        article_id: string | null 
      }> = {};
      
      clicksData?.forEach(click => {
        if (!productClickCounts[click.product_url]) {
          productClickCounts[click.product_url] = {
            clicks: 0,
            product_title: click.product_title,
            article_id: click.article_id,
          };
        }
        productClickCounts[click.product_url].clicks++;
      });

      // Get article titles for top products
      const topProducts = await Promise.all(
        Object.entries(productClickCounts)
          .sort(([, a], [, b]) => b.clicks - a.clicks)
          .slice(0, 10)
          .map(async ([url, data]) => {
            let articleTitle: string | null = null;
            if (data.article_id) {
              const article = articles.find(a => a.id === data.article_id);
              articleTitle = article?.title || null;
            }
            return {
              product_url: url,
              product_title: data.product_title,
              clicks: data.clicks,
              article_title: articleTitle,
            };
          })
      );

      setProductClickStats({
        total_clicks: totalClicks || 0,
        clicks_7d: clicks7d || 0,
        clicks_30d: clicks30d || 0,
        top_products: topProducts,
      });
    } catch (error) {
      console.error("Error fetching product click stats:", error);
    }
  };

  // Calculate SEO score for an article
  const calculateSEOScore = (article: BlogArticle): number => {
    let score = 0;
    const maxScore = 100;
    
    // Title: 60 chars or less (15 points)
    if (article.title && article.title.length > 0 && article.title.length <= 60) score += 15;
    else if (article.title && article.title.length <= 70) score += 10;
    
    // Meta description: 120-160 chars (20 points)
    if (article.meta_description) {
      const len = article.meta_description.length;
      if (len >= 120 && len <= 160) score += 20;
      else if (len >= 80 && len <= 180) score += 10;
    }
    
    // Keywords: at least 3 (15 points)
    if (article.meta_keywords && article.meta_keywords.length >= 3) score += 15;
    else if (article.meta_keywords && article.meta_keywords.length >= 1) score += 7;
    
    // Cover image (15 points)
    if (article.image_url) score += 15;
    
    // Slug is valid (10 points)
    if (article.slug && article.slug.length > 0 && !article.slug.includes(' ')) score += 10;
    
    // Content length (15 points for 500+ words)
    const wordCount = article.content?.split(/\s+/).length || 0;
    if (wordCount >= 500) score += 15;
    else if (wordCount >= 200) score += 8;
    
    // Excerpt exists (10 points)
    if (article.excerpt && article.excerpt.length > 20) score += 10;
    
    return Math.min(score, maxScore);
  };

  const handleGenerateArticle = async () => {
    if (generateMode === "keyword" && !generateTopic.trim()) {
      toast.error("Digite um tópico para o artigo");
      return;
    }
    if (generateMode === "youtube" && !generateYoutubeUrl.trim()) {
      toast.error("Cole a URL do vídeo do YouTube");
      return;
    }
    if (generateMode === "news" && !generateTopic.trim()) {
      toast.error("Digite o tópico da notícia");
      return;
    }

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-blog-article", {
        body: { 
          topic: generateTopic, 
          category: generateCategory,
          mode: generateMode,
          youtubeUrl: generateYoutubeUrl,
          productName: generateProductName.trim() || null,
          productUrl: generateProductUrl.trim() || null,
          productCta: generateProductCta.trim() || "Saiba Mais",
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const article = data.article;

      // Save to database
      const { data: savedArticle, error: saveError } = await supabase
        .from("blog_articles")
        .insert({
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          content: article.content,
          category: generateCategory,
          read_time: article.read_time,
          meta_description: article.meta_description,
          meta_keywords: article.meta_keywords,
          is_published: false,
          product_url: generateProductUrl.trim() || null,
          product_title: generateProductName.trim() || null,
          product_cta: generateProductCta.trim() || "Saiba Mais",
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // Generate cover image if enabled
      if (generateWithCover && savedArticle) {
        toast.info("Gerando imagem de capa...");
        try {
          const { data: coverData, error: coverError } = await supabase.functions.invoke(
            "generate-blog-cover",
            {
              body: {
                title: article.title,
                category: generateCategory,
                articleId: savedArticle.id,
                style: generateCoverStyle,
              },
            }
          );

          if (coverError) {
            console.error("Error generating cover:", coverError);
            toast.warning("Artigo criado, mas houve erro na imagem de capa");
          } else if (coverData?.image_url) {
            toast.success("Imagem de capa gerada!");
          }
        } catch (coverErr) {
          console.error("Cover generation failed:", coverErr);
          toast.warning("Artigo criado, mas houve erro na imagem de capa");
        }
      }

      toast.success(
        <div className="flex flex-col gap-2">
          <span>Artigo gerado com sucesso!</span>
          <a 
            href={`/blog/${savedArticle.slug}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary underline hover:text-primary/80 text-sm"
          >
            Ver artigo →
          </a>
        </div>,
        { duration: 8000 }
      );
      setGenerateModalOpen(false);
      setGenerateTopic("");
      setGenerateYoutubeUrl("");
      setGenerateMode("keyword");
      setGenerateProductName("");
      setGenerateProductUrl("");
      setGenerateProductCta("Saiba Mais");
      fetchArticles();
    } catch (error: any) {
      console.error("Error generating article:", error);
      toast.error(error.message || "Erro ao gerar artigo");
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateCover = async (article: BlogArticle) => {
    setGeneratingCover(article.id);
    try {
      // Build prompt for blog cover
      const imagePrompt = `Professional blog cover image about "${article.title}". Cinematic dramatic lighting, professional. Category: ${article.category || "YouTube content creation"}. High quality, ultra detailed, no text or words.`;

      console.log("Generating cover with prompt:", imagePrompt);

      // Use the existing generate-imagefx function
      const { data, error } = await supabase.functions.invoke("generate-imagefx", {
        body: {
          prompt: imagePrompt,
          aspectRatio: "LANDSCAPE",
          numberOfImages: 1,
          model: "IMAGEN_3_5",
        },
      });

      console.log("ImageFX response:", { data, error });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const imageUrl = data?.images?.[0]?.url;
      console.log("Image URL received:", imageUrl ? `${imageUrl.substring(0, 50)}...` : "none");
      
      if (!imageUrl) throw new Error("Nenhuma imagem gerada");

      // Check if it's base64
      if (imageUrl.startsWith("data:image")) {
        // Upload the base64 image to storage
        const base64Data = imageUrl.replace(/^data:image\/\w+;base64,/, "");
        const imageBuffer = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        const fileName = `blog-covers/${article.id}-${Date.now()}.png`;

        console.log("Uploading to storage:", fileName);

        const { error: uploadError } = await supabase.storage
          .from("blog-images")
          .upload(fileName, imageBuffer, { contentType: "image/png", upsert: true });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw new Error("Erro ao fazer upload da imagem: " + uploadError.message);
        }

        // Get public URL
        const { data: urlData } = supabase.storage.from("blog-images").getPublicUrl(fileName);
        console.log("Public URL:", urlData.publicUrl);

        // Update article with image URL
        const { error: updateError } = await supabase
          .from("blog_articles")
          .update({ image_url: urlData.publicUrl })
          .eq("id", article.id);

        if (updateError) {
          console.error("Update error:", updateError);
          throw updateError;
        }
      } else {
        // URL already public, just save it
        const { error: updateError } = await supabase
          .from("blog_articles")
          .update({ image_url: imageUrl })
          .eq("id", article.id);

        if (updateError) throw updateError;
      }

      toast.success("Imagem de capa gerada com sucesso!");
      fetchArticles();
    } catch (error: any) {
      console.error("Error generating cover:", error);
      toast.error(error.message || "Erro ao gerar imagem de capa");
    } finally {
      setGeneratingCover(null);
    }
  };

  const handleRegenerateContent = async (article: BlogArticle) => {
    setRegeneratingContent(article.id);
    try {
      toast.info("Gerando conteúdo completo...");

      const { data, error } = await supabase.functions.invoke("generate-blog-article", {
        body: { 
          topic: article.title, 
          category: article.category,
          mode: "keyword",
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const newArticle = data.article;

      // Update article with new content
      const { error: updateError } = await supabase
        .from("blog_articles")
        .update({
          content: newArticle.content,
          excerpt: newArticle.excerpt,
          meta_description: newArticle.meta_description,
          meta_keywords: newArticle.meta_keywords,
          read_time: newArticle.read_time,
        })
        .eq("id", article.id);

      if (updateError) throw updateError;

      toast.success("Conteúdo gerado com sucesso!");
      fetchArticles();
    } catch (error: any) {
      console.error("Error regenerating content:", error);
      toast.error(error.message || "Erro ao gerar conteúdo");
    } finally {
      setRegeneratingContent(null);
    }
  };

  const handleRegenerateAllContent = async () => {
    // Find all articles with placeholder content
    const placeholderContent = "<p>Artigo importado - edite o conteúdo completo aqui.</p>";
    const articlesToRegenerate = articles.filter(a => a.content === placeholderContent);
    
    if (articlesToRegenerate.length === 0) {
      toast.info("Nenhum artigo com conteúdo placeholder encontrado");
      return;
    }

    setRegeneratingAll(true);
    setRegeneratingProgress({ current: 0, total: articlesToRegenerate.length });

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < articlesToRegenerate.length; i++) {
      const article = articlesToRegenerate[i];
      setRegeneratingProgress({ current: i + 1, total: articlesToRegenerate.length });
      
      try {
        toast.info(`Gerando: ${article.title.slice(0, 40)}...`, { duration: 2000 });
        
        const { data, error } = await supabase.functions.invoke("generate-blog-article", {
          body: { 
            topic: article.title, 
            category: article.category,
            mode: "keyword",
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        const newArticle = data.article;

        const { error: updateError } = await supabase
          .from("blog_articles")
          .update({
            content: newArticle.content,
            excerpt: newArticle.excerpt,
            meta_description: newArticle.meta_description,
            meta_keywords: newArticle.meta_keywords,
            read_time: newArticle.read_time,
          })
          .eq("id", article.id);

        if (updateError) throw updateError;
        
        successCount++;
      } catch (error: any) {
        console.error(`Error regenerating ${article.title}:`, error);
        errorCount++;
      }

      // Small delay between requests to avoid rate limiting
      if (i < articlesToRegenerate.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    setRegeneratingAll(false);
    setRegeneratingProgress({ current: 0, total: 0 });
    fetchArticles();

    if (errorCount === 0) {
      toast.success(`${successCount} artigos regenerados com sucesso!`);
    } else {
      toast.warning(`${successCount} sucesso, ${errorCount} erros`);
    }
  };

  const handleRegenerateAllCovers = async () => {
    // Find only articles WITHOUT covers (no image_url or empty)
    const articlesToUpdate = articles.filter(a => !a.image_url || a.image_url.trim() === "");
    
    if (articlesToUpdate.length === 0) {
      toast.info("Todos os artigos já possuem imagem de capa");
      return;
    }

    toast.info(`Gerando capas para ${articlesToUpdate.length} artigos sem imagem...`);

    setRegeneratingCovers(true);
    setCoversProgress({ current: 0, total: articlesToUpdate.length });

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < articlesToUpdate.length; i++) {
      const article = articlesToUpdate[i];
      setCoversProgress({ current: i + 1, total: articlesToUpdate.length });
      
      try {
        toast.info(`Gerando capa: ${article.title.slice(0, 30)}...`, { duration: 2000 });
        
        const { data, error } = await supabase.functions.invoke("generate-blog-cover", {
          body: { 
            title: article.title, 
            category: article.category,
            articleId: article.id,
            style: "cinematic"
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        
        successCount++;
      } catch (error: any) {
        console.error(`Error regenerating cover for ${article.title}:`, error);
        errorCount++;
      }

      // Delay between requests to avoid rate limiting
      if (i < articlesToUpdate.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    setRegeneratingCovers(false);
    setCoversProgress({ current: 0, total: 0 });
    fetchArticles();

    if (errorCount === 0) {
      toast.success(`${successCount} capas regeneradas com WebP otimizado!`);
    } else {
      toast.warning(`${successCount} sucesso, ${errorCount} erros`);
    }
  };

  const handleRegeneratePublishedContent = async () => {
    // Find all published articles
    const articlesToRegenerate = articles.filter(a => a.is_published);
    
    if (articlesToRegenerate.length === 0) {
      toast.info("Nenhum artigo publicado encontrado");
      return;
    }

    const confirmed = window.confirm(
      `Isso vai regenerar o conteúdo de ${articlesToRegenerate.length} artigos publicados com formatação melhorada. Continuar?`
    );
    
    if (!confirmed) return;

    setRegeneratingAll(true);
    setRegeneratingProgress({ current: 0, total: articlesToRegenerate.length });

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < articlesToRegenerate.length; i++) {
      const article = articlesToRegenerate[i];
      setRegeneratingProgress({ current: i + 1, total: articlesToRegenerate.length });
      
      try {
        toast.info(`Melhorando: ${article.title.slice(0, 35)}...`, { duration: 2000 });
        
        const { data, error } = await supabase.functions.invoke("generate-blog-article", {
          body: { 
            topic: article.title, 
            category: article.category,
            mode: "keyword",
            productName: article.product_title,
            productUrl: article.product_url,
            productCta: article.product_cta,
          },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        const newArticle = data.article;

        const { error: updateError } = await supabase
          .from("blog_articles")
          .update({
            content: newArticle.content,
            excerpt: newArticle.excerpt,
            meta_description: newArticle.meta_description,
            meta_keywords: newArticle.meta_keywords,
            read_time: newArticle.read_time,
          })
          .eq("id", article.id);

        if (updateError) throw updateError;
        
        successCount++;
      } catch (error: any) {
        console.error(`Error regenerating ${article.title}:`, error);
        errorCount++;
      }

      // Delay between requests to avoid rate limiting
      if (i < articlesToRegenerate.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    setRegeneratingAll(false);
    setRegeneratingProgress({ current: 0, total: 0 });
    fetchArticles();

    if (errorCount === 0) {
      toast.success(`${successCount} artigos melhorados com sucesso!`);
    } else {
      toast.warning(`${successCount} sucesso, ${errorCount} erros`);
    }
  };

  const handleEditArticle = (article: BlogArticle) => {
    setEditingArticle(article);
    setEditForm({
      title: article.title,
      slug: article.slug,
      excerpt: article.excerpt || "",
      content: article.content,
      category: article.category,
      read_time: article.read_time || "5 min",
      meta_description: article.meta_description || "",
      image_url: article.image_url || "",
      product_url: article.product_url || "",
      product_title: article.product_title || "",
      product_cta: article.product_cta || "Saiba Mais",
    });
    setEditModalOpen(true);
  };

  const handleSaveArticle = async () => {
    if (!editingArticle) return;

    try {
      const { error } = await supabase
        .from("blog_articles")
        .update({
          title: editForm.title,
          slug: editForm.slug,
          excerpt: editForm.excerpt,
          content: editForm.content,
          category: editForm.category,
          read_time: editForm.read_time,
          meta_description: editForm.meta_description,
          image_url: editForm.image_url || null,
          product_url: editForm.product_url || null,
          product_title: editForm.product_title || null,
          product_cta: editForm.product_cta || "Saiba Mais",
        })
        .eq("id", editingArticle.id);

      if (error) throw error;

      toast.success("Artigo atualizado!");
      setEditModalOpen(false);
      fetchArticles();
    } catch (error) {
      console.error("Error saving article:", error);
      toast.error("Erro ao salvar artigo");
    }
  };

  const handleTogglePublish = async (article: BlogArticle) => {
    try {
      const newStatus = !article.is_published;
      const { error } = await supabase
        .from("blog_articles")
        .update({
          is_published: newStatus,
          published_at: newStatus ? new Date().toISOString() : null,
        })
        .eq("id", article.id);

      if (error) throw error;

      toast.success(newStatus ? "Artigo publicado!" : "Artigo despublicado!");
      fetchArticles();
    } catch (error) {
      console.error("Error toggling publish:", error);
      toast.error("Erro ao alterar status");
    }
  };

  const handleDeleteArticle = async () => {
    if (!deletingArticle) return;

    try {
      const { error } = await supabase
        .from("blog_articles")
        .delete()
        .eq("id", deletingArticle.id);

      if (error) throw error;

      toast.success("Artigo excluído!");
      setDeleteDialogOpen(false);
      fetchArticles();
    } catch (error) {
      console.error("Error deleting article:", error);
      toast.error("Erro ao excluir artigo");
    }
  };

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      !searchTerm ||
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || article.category === filterCategory;
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "published" && article.is_published) ||
      (filterStatus === "draft" && !article.is_published);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Gerador de Artigos</h3>
          <p className="text-sm text-muted-foreground">
            Crie artigos automaticamente com IA para o blog
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchArticles} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
          <Button onClick={() => setGenerateModalOpen(true)}>
            <Rocket className="w-4 h-4 mr-2" />
            Gerar Artigo
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Total Artigos</p>
          <p className="text-2xl font-bold text-foreground">{articles.length}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Publicados</p>
          <p className="text-2xl font-bold text-success">
            {articles.filter((a) => a.is_published).length}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Visitas Total</p>
          <p className="text-2xl font-bold text-primary">{viewStats.total_views.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Visitas 7d</p>
          <p className="text-2xl font-bold text-accent">{viewStats.views_7d.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Visitas 30d</p>
          <p className="text-2xl font-bold text-foreground">{viewStats.views_30d.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Visitantes Únicos</p>
          <p className="text-2xl font-bold text-foreground">{viewStats.unique_visitors.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Média SEO</p>
          <p className="text-2xl font-bold text-foreground">
            {articles.length > 0 
              ? Math.round(articles.reduce((sum, a) => sum + calculateSEOScore(a), 0) / articles.length)
              : 0}%
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Capas WebP</p>
          <p className="text-2xl font-bold text-accent">
            {articles.filter((a) => a.image_url?.includes('.webp')).length}/{articles.length}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full text-xs"
            onClick={handleRegenerateAllCovers}
            disabled={regeneratingCovers || regeneratingAll}
          >
            {regeneratingCovers ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                {coversProgress.current}/{coversProgress.total}
              </>
            ) : (
              <>
                <ImagePlus className="w-3 h-3 mr-1" />
                Gerar Faltantes
              </>
            )}
          </Button>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Publicados</p>
          <p className="text-2xl font-bold text-primary">
            {articles.filter((a) => a.is_published).length}
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-2 w-full text-xs"
            onClick={handleRegeneratePublishedContent}
            disabled={regeneratingCovers || regeneratingAll}
          >
            {regeneratingAll ? (
              <>
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                {regeneratingProgress.current}/{regeneratingProgress.total}
              </>
            ) : (
              <>
                <Wand2 className="w-3 h-3 mr-1" />
                Melhorar Todos
              </>
            )}
          </Button>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Views Trend Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Tendência de Visitas (30 dias)</h3>
            </div>
            <span className="text-sm text-muted-foreground">
              Total: {dailyViews.reduce((sum, d) => sum + d.views, 0).toLocaleString()} visitas
            </span>
          </div>
          <ChartContainer
            config={{
              views: {
                label: "Visitas",
                color: "hsl(var(--primary))",
              },
            }}
            className="h-[300px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyViews} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="label" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  width={40}
                />
                <ChartTooltip
                  content={<ChartTooltipContent indicator="line" />}
                  cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "4 4" }}
                />
                <Area
                  type="monotone"
                  dataKey="views"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  fill="url(#viewsGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartContainer>
        </Card>

        {/* Top 10 Articles Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-accent" />
              <h3 className="font-semibold text-foreground">Top 10 Artigos Mais Visualizados</h3>
            </div>
          </div>
          <ChartContainer
            config={{
              views: {
                label: "Visitas",
                color: "hsl(var(--accent))",
              },
            }}
            className="h-[300px] w-full"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={articles
                  .filter(a => (a.view_count || 0) > 0)
                  .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
                  .slice(0, 10)
                  .map(a => ({
                    name: a.title.length > 30 ? a.title.substring(0, 30) + "..." : a.title,
                    fullTitle: a.title,
                    views: a.view_count || 0,
                  }))}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 5, bottom: 5 }}
              >
                <XAxis 
                  type="number" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                />
                <YAxis 
                  type="category" 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  width={150}
                />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
                          <p className="text-sm font-medium text-foreground">{data.fullTitle}</p>
                          <p className="text-sm text-muted-foreground">{data.views.toLocaleString()} visitas</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="views" radius={[0, 4, 4, 0]}>
                  {articles
                    .filter(a => (a.view_count || 0) > 0)
                    .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
                    .slice(0, 10)
                    .map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index === 0 ? "hsl(var(--primary))" : `hsl(var(--accent) / ${1 - index * 0.08})`}
                      />
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
          {articles.filter(a => (a.view_count || 0) > 0).length === 0 && (
            <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
              Nenhum artigo com visitas registradas ainda
            </div>
          )}
        </Card>
      </div>

      {/* Product Clicks Report */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <MousePointerClick className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Relatório de Cliques em Produtos</h3>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="text-center">
              <p className="text-muted-foreground">Total</p>
              <p className="text-xl font-bold text-foreground">{productClickStats.total_clicks}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">7 dias</p>
              <p className="text-xl font-bold text-primary">{productClickStats.clicks_7d}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">30 dias</p>
              <p className="text-xl font-bold text-accent">{productClickStats.clicks_30d}</p>
            </div>
          </div>
        </div>

        {productClickStats.top_products.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground font-medium">Top Produtos Clicados</p>
            {productClickStats.top_products.map((product, index) => (
              <div 
                key={product.product_url} 
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                    index === 0 ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {product.product_title || "Produto sem nome"}
                    </p>
                    {product.article_title && (
                      <p className="text-xs text-muted-foreground truncate">
                        Artigo: {product.article_title}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-bold text-lg text-primary">{product.clicks}</p>
                    <p className="text-xs text-muted-foreground">cliques</p>
                  </div>
                  <a
                    href={product.product_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <ShoppingBag className="w-12 h-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              Nenhum clique em produtos registrado ainda
            </p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              Adicione produtos aos artigos para rastrear conversões
            </p>
          </div>
        )}
      </Card>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar artigos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="published">Publicados</SelectItem>
              <SelectItem value="draft">Rascunhos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Articles List */}
      <Card className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-medium text-foreground mb-2">Nenhum artigo encontrado</h4>
            <p className="text-muted-foreground mb-4">
              Clique em "Gerar Artigo" para criar seu primeiro artigo com IA
            </p>
            <Button onClick={() => setGenerateModalOpen(true)}>
              <Rocket className="w-4 h-4 mr-2" />
              Gerar Primeiro Artigo
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredArticles.map((article) => (
              <div
                key={article.id}
                className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg hover:bg-secondary/70 transition-colors"
              >
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  {/* Thumbnail - Maior */}
                  <div className="w-24 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border/50">
                    {article.image_url ? (
                      <img
                        src={article.image_url}
                        alt={article.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        <Image className="w-6 h-6 text-muted-foreground/50" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h4 className="font-medium text-foreground truncate max-w-md">{article.title}</h4>
                      {article.is_published ? (
                        <Badge className="bg-success/20 text-success border-success/50 flex-shrink-0">
                          <Globe className="w-3 h-3 mr-1" />
                          Publicado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="flex-shrink-0">
                          <GlobeLock className="w-3 h-3 mr-1" />
                          Rascunho
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded text-xs font-medium">
                        {article.category}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {article.read_time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {(article.view_count || 0).toLocaleString()} views
                      </span>
                      <span 
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          calculateSEOScore(article) >= 80 
                            ? 'bg-success/20 text-success' 
                            : calculateSEOScore(article) >= 50 
                              ? 'bg-warning/20 text-warning' 
                              : 'bg-destructive/20 text-destructive'
                        }`}
                        title="Nota SEO"
                      >
                        SEO: {calculateSEOScore(article)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Regenerate content button - show only for placeholder content */}
                  {article.content === "<p>Artigo importado - edite o conteúdo completo aqui.</p>" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRegenerateContent(article)}
                      disabled={regeneratingContent === article.id}
                      title="Gerar conteúdo com IA"
                      className="h-8 w-8 text-primary"
                    >
                      {regeneratingContent === article.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Wand2 className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleGenerateCover(article)}
                    disabled={generatingCover === article.id}
                    title="Gerar imagem de capa"
                    className="h-8 w-8"
                  >
                    {generatingCover === article.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ImagePlus className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    asChild
                    title="Abrir artigo"
                    className="h-8 w-8"
                  >
                    <a href={`/blog/${article.slug}`} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setPreviewArticle(article);
                      setPreviewModalOpen(true);
                    }}
                    title="Visualizar"
                    className="h-8 w-8"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleEditArticle(article)}
                    title="Editar"
                    className="h-8 w-8"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleTogglePublish(article)}
                    className="text-xs"
                  >
                    {article.is_published ? "Despublicar" : "Publicar"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive h-8 w-8"
                    onClick={() => {
                      setDeletingArticle(article);
                      setDeleteDialogOpen(true);
                    }}
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Generate Modal */}
      <Dialog open={generateModalOpen} onOpenChange={setGenerateModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" />
              Gerar Artigo com IA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Mode Selection */}
            <Tabs value={generateMode} onValueChange={(v) => setGenerateMode(v as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="keyword" className="gap-1.5">
                  <Type className="w-4 h-4" />
                  Palavra-chave
                </TabsTrigger>
                <TabsTrigger value="youtube" className="gap-1.5">
                  <Youtube className="w-4 h-4" />
                  YouTube
                </TabsTrigger>
                <TabsTrigger value="news" className="gap-1.5">
                  <Newspaper className="w-4 h-4" />
                  Notícias
                </TabsTrigger>
              </TabsList>

              <TabsContent value="keyword" className="mt-4 space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Tópico do Artigo
                  </label>
                  <Input
                    placeholder="Ex: Como criar thumbnails que viralizam"
                    value={generateTopic}
                    onChange={(e) => setGenerateTopic(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    A IA vai criar um artigo completo sobre este tópico
                  </p>
                </div>
              </TabsContent>

              <TabsContent value="youtube" className="mt-4 space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    URL do Vídeo do YouTube
                  </label>
                  <Input
                    placeholder="https://youtube.com/watch?v=..."
                    value={generateYoutubeUrl}
                    onChange={(e) => setGenerateYoutubeUrl(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    O vídeo será transcrito e transformado em artigo
                  </p>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Foco do Artigo (opcional)
                  </label>
                  <Input
                    placeholder="Ex: Principais insights do vídeo"
                    value={generateTopic}
                    onChange={(e) => setGenerateTopic(e.target.value)}
                  />
                </div>
              </TabsContent>

              <TabsContent value="news" className="mt-4 space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Tópico da Notícia
                  </label>
                  <Input
                    placeholder="Ex: Novas regras de monetização do YouTube 2025"
                    value={generateTopic}
                    onChange={(e) => setGenerateTopic(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    A IA vai pesquisar tendências e criar um artigo atualizado
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Categoria</label>
              <Select value={generateCategory} onValueChange={setGenerateCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="generateWithCover"
                  checked={generateWithCover}
                  onChange={(e) => setGenerateWithCover(e.target.checked)}
                  className="w-4 h-4 rounded border-border"
                />
                <label htmlFor="generateWithCover" className="text-sm text-muted-foreground">
                  Gerar imagem de capa automaticamente
                </label>
              </div>
              {generateWithCover && (
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Estilo Visual da Capa
                  </label>
                  <Select value={generateCoverStyle} onValueChange={setGenerateCoverStyle}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cinematic">🎬 Cinematográfico</SelectItem>
                      <SelectItem value="minimalist">✨ Minimalista</SelectItem>
                      <SelectItem value="colorful">🌈 Colorido</SelectItem>
                      <SelectItem value="tech">💻 Tech/Futurista</SelectItem>
                      <SelectItem value="gradient">🎨 Gradiente Abstrato</SelectItem>
                      <SelectItem value="neon">🔮 Neon/Cyberpunk</SelectItem>
                      <SelectItem value="professional">📊 Profissional/Corporativo</SelectItem>
                      <SelectItem value="creative">🎭 Artístico/Criativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Product Section */}
            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-sm font-medium text-foreground">Produto/Afiliado (opcional)</p>
              <p className="text-xs text-muted-foreground -mt-2">
                A IA vai incluir o produto no melhor local do artigo
              </p>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Nome do Produto
                </label>
                <Input
                  placeholder="Ex: Curso de YouTube PRO"
                  value={generateProductName}
                  onChange={(e) => setGenerateProductName(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Link do Produto
                </label>
                <Input
                  placeholder="https://..."
                  value={generateProductUrl}
                  onChange={(e) => setGenerateProductUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Texto do Botão (CTA)
                </label>
                <Input
                  placeholder="Saiba Mais"
                  value={generateProductCta}
                  onChange={(e) => setGenerateProductCta(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGenerateModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleGenerateArticle} disabled={generating}>
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {generateMode === "youtube" ? "Transcrevendo..." : "Gerando..."}
                </>
              ) : (
                <>
                  <Rocket className="w-4 h-4 mr-2" />
                  Gerar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Artigo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Título</label>
                <Input
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Slug</label>
                <Input
                  value={editForm.slug}
                  onChange={(e) => setEditForm({ ...editForm, slug: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Categoria</label>
                <Select
                  value={editForm.category}
                  onValueChange={(v) => setEditForm({ ...editForm, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Tempo de Leitura
                </label>
                <Input
                  value={editForm.read_time}
                  onChange={(e) => setEditForm({ ...editForm, read_time: e.target.value })}
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">URL da Imagem</label>
              <Input
                value={editForm.image_url}
                onChange={(e) => setEditForm({ ...editForm, image_url: e.target.value })}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Resumo</label>
              <Textarea
                value={editForm.excerpt}
                onChange={(e) => setEditForm({ ...editForm, excerpt: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Meta Description</label>
              <Textarea
                value={editForm.meta_description}
                onChange={(e) => setEditForm({ ...editForm, meta_description: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Conteúdo (HTML)</label>
              <Textarea
                value={editForm.content}
                onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                rows={12}
                className="font-mono text-xs"
              />
            </div>

            {/* Product/Affiliate Section */}
            <div className="border-t border-border pt-4">
              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                🛒 Produto/Afiliado (opcional)
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Nome do Produto</label>
                  <Input
                    value={editForm.product_title}
                    onChange={(e) => setEditForm({ ...editForm, product_title: e.target.value })}
                    placeholder="Ex: Curso Completo de YouTube"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-2 block">Texto do Botão</label>
                  <Input
                    value={editForm.product_cta}
                    onChange={(e) => setEditForm({ ...editForm, product_cta: e.target.value })}
                    placeholder="Ex: Comprar Agora, Saiba Mais"
                  />
                </div>
              </div>
              <div className="mt-3">
                <label className="text-sm text-muted-foreground mb-2 block">Link do Produto/Afiliado</label>
                <Input
                  value={editForm.product_url}
                  onChange={(e) => setEditForm({ ...editForm, product_url: e.target.value })}
                  placeholder="https://..."
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Se preenchido, será exibido um card de produto no artigo
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveArticle}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={previewModalOpen} onOpenChange={setPreviewModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewArticle?.title}</DialogTitle>
          </DialogHeader>
          {previewArticle && (
            <div className="py-4">
              {/* Cover Image */}
              {previewArticle.image_url && (
                <div className="mb-6 rounded-lg overflow-hidden">
                  <img 
                    src={previewArticle.image_url} 
                    alt={previewArticle.title}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                <Badge>{previewArticle.category}</Badge>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {previewArticle.read_time}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Criado: {new Date(previewArticle.created_at).toLocaleDateString('pt-BR')}
                </span>
                {previewArticle.published_at && (
                  <span className="text-success flex items-center gap-1">
                    <Globe className="w-4 h-4" />
                    Publicado: {new Date(previewArticle.published_at).toLocaleDateString('pt-BR')}
                  </span>
                )}
              </div>
              {previewArticle.excerpt && (
                <p className="text-muted-foreground italic mb-6">{previewArticle.excerpt}</p>
              )}
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: previewArticle.content }}
              />
              {previewArticle.content === "<p>Artigo importado - edite o conteúdo completo aqui.</p>" && (
                <div className="mt-4 p-4 bg-warning/10 border border-warning/20 rounded-lg">
                  <p className="text-warning text-sm">
                    ⚠️ Este artigo foi importado e precisa ter seu conteúdo editado. 
                    Clique em "Editar" para adicionar o conteúdo completo.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Artigo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{deletingArticle?.title}"? Esta ação não pode ser
              desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteArticle}
              className="bg-destructive text-destructive-foreground"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
