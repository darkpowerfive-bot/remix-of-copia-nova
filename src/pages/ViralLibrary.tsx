import { MainLayout } from "@/components/layout/MainLayout";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Library, 
  Search, 
  Eye, 
  ThumbsUp, 
  Play, 
  Plus, 
  Trash2, 
  Loader2, 
  FileText, 
  Image, 
  Bot, 
  ScrollText,
  Heart,
  Copy,
  Check,
  Clock,
  Calendar,
  Rocket,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useSearchParams } from "react-router-dom";
import { GenerateScriptModal } from "@/components/library/GenerateScriptModal";
import { usePersistedState } from "@/hooks/usePersistedState";
import { useTutorial } from "@/hooks/useTutorial";
import { TutorialModal, TutorialHelpButton } from "@/components/tutorial/TutorialModal";
import { VIRAL_LIBRARY_TUTORIAL } from "@/lib/tutorialConfigs";

interface ViralTitle {
  id: string;
  title_text: string;
  formula: string | null;
  explicacao: string | null;
  pontuacao: number | null;
  is_favorite: boolean;
  model_used: string | null;
  created_at: string;
  video_analysis_id: string | null;
  analyzed_video?: {
    original_title: string | null;
    original_views: number | null;
    detected_niche: string | null;
    detected_subniche: string | null;
  } | null;
}

interface ScriptAgent {
  id: string;
  name: string;
  niche: string | null;
  sub_niche: string | null;
  based_on_title: string | null;
  formula: string | null;
  formula_structure: any;
  mental_triggers: string[] | null;
  times_used: number;
  created_at: string;
}

interface GeneratedScript {
  id: string;
  title: string;
  content: string;
  duration: number;
  language: string;
  model_used: string | null;
  credits_used: number;
  created_at: string;
  agent_id: string | null;
}

interface ViralThumbnail {
  id: string;
  image_url: string;
  video_title: string;
  headline: string | null;
  seo_description: string | null;
  seo_tags: string | null;
  prompt: string | null;
  style: string | null;
  niche: string | null;
  sub_niche: string | null;
  created_at: string;
}

const ViralLibrary = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Tutorial
  const { showTutorial, completeTutorial, openTutorial } = useTutorial(VIRAL_LIBRARY_TUTORIAL.id);
  
  // Persisted states
  const [searchTerm, setSearchTerm] = usePersistedState("library_searchTerm", "");
  const [nicheFilter, setNicheFilter] = usePersistedState("library_nicheFilter", "all");
  const [viewsFilter, setViewsFilter] = usePersistedState("library_viewsFilter", "all");
  const [showFavorites, setShowFavorites] = usePersistedState("library_showFavorites", false);
  
  // Non-persisted states
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "titles");
  const [titles, setTitles] = useState<ViralTitle[]>([]);
  const [agents, setAgents] = useState<ScriptAgent[]>([]);
  const [scripts, setScripts] = useState<GeneratedScript[]>([]);
  const [thumbnails, setThumbnails] = useState<ViralThumbnail[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<ScriptAgent | null>(null);

  useEffect(() => {
    if (user) {
      fetchTitles();
      fetchAgents();
      fetchScripts();
      fetchThumbnails();
    }
  }, [user]);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const fetchScripts = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_scripts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setScripts(data || []);
    } catch (error) {
      console.error('Error fetching scripts:', error);
    }
  };

  const fetchThumbnails = async () => {
    try {
      const { data, error } = await supabase
        .from('viral_thumbnails')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setThumbnails(data || []);
    } catch (error) {
      console.error('Error fetching thumbnails:', error);
    }
  };

  const fetchTitles = async () => {
    try {
      // Fetch titles that are favorited from the video analyzer
      const { data: titlesData, error: titlesError } = await supabase
        .from('generated_titles')
        .select('*, analyzed_videos!generated_titles_video_analysis_id_fkey(original_title, original_views, detected_niche, detected_subniche)')
        .eq('is_favorite', true)
        .order('created_at', { ascending: false });

      if (titlesError) throw titlesError;
      
      const formattedTitles: ViralTitle[] = (titlesData || []).map(t => ({
        ...t,
        analyzed_video: t.analyzed_videos as ViralTitle['analyzed_video']
      }));
      
      setTitles(formattedTitles);
    } catch (error) {
      console.error('Error fetching titles:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('script_agents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
    }
  };

  const handleDeleteTitle = async (id: string) => {
    try {
      const { error } = await supabase
        .from('generated_titles')
        .update({ is_favorite: false })
        .eq('id', id);

      if (error) throw error;
      toast.success('Título removido da biblioteca!');
      setTitles(titles.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error removing title:', error);
      toast.error('Erro ao remover título');
    }
  };

  const handleDeleteThumbnail = async (id: string) => {
    try {
      const { error } = await supabase
        .from('viral_thumbnails')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Thumbnail removida!');
      setThumbnails(thumbnails.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting thumbnail:', error);
      toast.error('Erro ao remover thumbnail');
    }
  };

  const handleDeleteAgent = async (id: string) => {
    try {
      const { error } = await supabase
        .from('script_agents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Agente removido!');
      setAgents(agents.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast.error('Erro ao remover agente');
    }
  };

  const handleUseAgent = (agent: ScriptAgent) => {
    setSelectedAgent(agent);
    setGenerateModalOpen(true);
  };

  const handleCopyTitle = async (id: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Título copiado!");
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  const formatViews = (views: number | null | undefined) => {
    if (!views) return "N/A";
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  const filteredTitles = titles.filter(t => {
    const matchesSearch = t.title_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.formula?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFavorites = !showFavorites || t.is_favorite;
    
    return matchesSearch && matchesFavorites;
  });

  const filteredThumbnails = thumbnails.filter(t =>
    t.video_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.headline?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.niche?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAgents = agents.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.niche?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.sub_niche?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <SEOHead
        title="Biblioteca Viral"
        description="Acesse sua biblioteca de títulos e thumbnails virais."
        noindex={true}
      />
      <MainLayout>
        <PermissionGate permission="biblioteca_viral" featureName="Biblioteca Viral">
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-4xl">📚</span>
                <h1 className="text-4xl font-bold text-foreground">Biblioteca de Títulos e Thumbnails Virais</h1>
              </div>
              <p className="text-lg text-muted-foreground">
                Acesse todos os títulos e thumbnails que geraram milhões de views
              </p>
            </div>
            <TutorialHelpButton onClick={openTutorial} />
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b border-border rounded-none h-auto p-0 mb-8">
              <TabsTrigger 
                value="titles" 
                className="text-base px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
              >
                <FileText className="w-5 h-5 mr-2" />
                Títulos Virais
              </TabsTrigger>
              <TabsTrigger 
                value="thumbnails" 
                className="text-base px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
              >
                <Image className="w-5 h-5 mr-2" />
                Thumbnails Virais
              </TabsTrigger>
              <TabsTrigger 
                value="agents" 
                className="text-base px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
              >
                <Bot className="w-5 h-5 mr-2" />
                Agentes de Roteiro
              </TabsTrigger>
              <TabsTrigger 
                value="scripts" 
                className="text-base px-6 py-4 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent"
              >
                <ScrollText className="w-5 h-5 mr-2" />
                Roteiros Gerados
              </TabsTrigger>
            </TabsList>

            {/* Filters */}
            <Card className="p-6 mb-8 border-border/50" data-tutorial="search-filter">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <Input
                    placeholder="Buscar títulos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="bg-secondary border-border h-12 text-base"
                  />
                </div>
                <Select value={nicheFilter} onValueChange={setNicheFilter}>
                  <SelectTrigger className="w-[200px] bg-secondary border-border h-12 text-base">
                    <SelectValue placeholder="Todos os Nichos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Nichos</SelectItem>
                    <SelectItem value="history">História</SelectItem>
                    <SelectItem value="education">Educação</SelectItem>
                    <SelectItem value="entertainment">Entretenimento</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={viewsFilter} onValueChange={setViewsFilter}>
                  <SelectTrigger className="w-[200px] bg-secondary border-border h-12 text-base">
                    <SelectValue placeholder="Todas as Views" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Views</SelectItem>
                    <SelectItem value="1m">+1M Views</SelectItem>
                    <SelectItem value="500k">+500K Views</SelectItem>
                    <SelectItem value="100k">+100K Views</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  variant={showFavorites ? "default" : "outline"} 
                  onClick={() => setShowFavorites(!showFavorites)}
                  className="h-12 text-base px-6"
                >
                  <Heart className={`w-5 h-5 mr-2 ${showFavorites ? 'fill-current' : ''}`} />
                  Apenas Favoritos
                </Button>
              </div>
            </Card>

            {/* Titles Tab */}
            <TabsContent value="titles" className="mt-0" data-tutorial="titles-list">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredTitles.length === 0 ? (
                <Card className="p-12 text-center border-border/50">
                  <Library className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Biblioteca de títulos vazia</h3>
                  <p className="text-lg text-muted-foreground">
                    Favorite títulos no Analisador de Vídeos para vê-los aqui
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTitles.map((title) => (
                    <Card key={title.id} className="p-6 border-border/50 hover:border-primary/50 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                        <h3 className="font-bold text-lg text-foreground line-clamp-2 flex-1">{title.title_text}</h3>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="shrink-0"
                          onClick={() => handleDeleteTitle(title.id)}
                        >
                          <Heart className="w-5 h-5 fill-primary text-primary" />
                        </Button>
                      </div>
                      
                      <div className="flex gap-2 mb-4 flex-wrap">
                        {title.analyzed_video?.detected_niche && (
                          <Badge className="bg-primary/20 text-primary border-0">
                            {title.analyzed_video.detected_niche}
                          </Badge>
                        )}
                        {title.analyzed_video?.detected_subniche && (
                          <Badge variant="outline">{title.analyzed_video.detected_subniche}</Badge>
                        )}
                      </div>

                      <div className="flex gap-4 mb-4">
                        <div className="bg-secondary/50 px-4 py-2 rounded-lg flex-1">
                          <p className="text-xs text-muted-foreground">Views Originais</p>
                          <p className="text-lg font-bold text-foreground">
                            {formatViews(title.analyzed_video?.original_views)}
                          </p>
                        </div>
                        <div className="bg-secondary/50 px-4 py-2 rounded-lg flex-1">
                          <p className="text-xs text-muted-foreground">Score</p>
                          <p className="text-lg font-bold text-primary">{title.pontuacao || 0}/10</p>
                        </div>
                      </div>

                      {title.formula && (
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground">Fórmula</p>
                          <p className="text-sm text-foreground line-clamp-2">{title.formula}</p>
                        </div>
                      )}

                      <Button 
                        data-tutorial="title-actions"
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 text-base"
                        onClick={() => handleCopyTitle(title.id, title.title_text)}
                      >
                        {copiedId === title.id ? (
                          <>
                            <Check className="w-5 h-5 mr-2" />
                            Copiado!
                          </>
                        ) : (
                          <>
                            <Copy className="w-5 h-5 mr-2" />
                            Copiar Título
                          </>
                        )}
                      </Button>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Thumbnails Tab */}
            <TabsContent value="thumbnails" className="mt-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredThumbnails.length === 0 ? (
                <Card className="p-12 text-center border-border/50">
                  <Image className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Biblioteca de thumbnails vazia</h3>
                  <p className="text-lg text-muted-foreground">
                    Salve thumbnails no Analisador de Vídeos para vê-las aqui
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredThumbnails.map((thumb) => (
                    <Card key={thumb.id} className="border-border/50 hover:border-primary/50 transition-colors overflow-hidden">
                      {/* Thumbnail Image */}
                      <div className="aspect-video bg-secondary">
                        <img 
                          src={thumb.image_url} 
                          alt={thumb.video_title || "Thumbnail"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="p-4 space-y-3">
                        {/* Video Title */}
                        <h3 className="font-bold text-foreground line-clamp-2">{thumb.video_title}</h3>
                        
                        {/* Headline */}
                        {thumb.headline && (
                          <div className="bg-primary/10 px-3 py-2 rounded-lg">
                            <p className="text-xs text-muted-foreground mb-1">Headline</p>
                            <p className="text-sm font-semibold text-primary">{thumb.headline}</p>
                          </div>
                        )}
                        
                        {/* Style and Niche badges */}
                        <div className="flex gap-2 flex-wrap">
                          {thumb.style && (
                            <Badge className="bg-secondary text-foreground text-xs">{thumb.style}</Badge>
                          )}
                          {thumb.niche && (
                            <Badge variant="outline" className="text-xs">{thumb.niche}</Badge>
                          )}
                          {thumb.sub_niche && (
                            <Badge variant="outline" className="text-xs text-primary border-primary">{thumb.sub_niche}</Badge>
                          )}
                        </div>
                        
                        {/* SEO Description */}
                        {thumb.seo_description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{thumb.seo_description}</p>
                        )}
                        
                        {/* Actions */}
                        <div className="flex gap-2">
                          {thumb.prompt && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1"
                              onClick={async () => {
                                await navigator.clipboard.writeText(thumb.prompt!);
                                setCopiedId(thumb.id);
                                setTimeout(() => setCopiedId(null), 2000);
                                toast.success("Prompt copiado!");
                              }}
                            >
                              {copiedId === thumb.id ? (
                                <>
                                  <Check className="w-3 h-3 mr-1" />
                                  Copiado
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 mr-1" />
                                  Prompt
                                </>
                              )}
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => window.open(thumb.image_url, '_blank')}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteThumbnail(thumb.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Agents Tab */}
            <TabsContent value="agents" className="mt-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredAgents.length === 0 ? (
                <Card className="p-12 text-center border-border/50">
                  <Bot className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum agente criado</h3>
                  <p className="text-lg text-muted-foreground">
                    Analise vídeos e crie agentes de roteiro baseados nas fórmulas virais
                  </p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAgents.map((agent) => (
                    <Card key={agent.id} className="p-6 border-border/50 hover:border-primary/50 transition-colors">
                      <h3 className="font-bold text-xl text-foreground mb-3">{agent.name}</h3>
                      
                      <div className="space-y-2 mb-4">
                        <p className="text-base">
                          <span className="text-primary font-medium">Nicho:</span>{" "}
                          <span className="text-foreground">{agent.niche || "Não definido"}</span>
                        </p>
                        <p className="text-base">
                          <span className="text-primary font-medium">Sub-nicho:</span>{" "}
                          <span className="text-foreground">{agent.sub_niche || "Não definido"}</span>
                        </p>
                        {agent.based_on_title && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            Baseado em: {agent.based_on_title}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          Usado {agent.times_used} vezes
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <Button 
                          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base"
                          onClick={() => handleUseAgent(agent)}
                        >
                          <Play className="w-5 h-5 mr-2" />
                          Usar Agente
                        </Button>
                        <Button 
                          variant="destructive"
                          size="icon"
                          className="h-12 w-12"
                          onClick={() => handleDeleteAgent(agent.id)}
                        >
                          <Trash2 className="w-5 h-5" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Scripts Tab */}
            <TabsContent value="scripts" className="mt-0">
              {scripts.length === 0 ? (
                <Card className="p-12 text-center border-border/50">
                  <ScrollText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum roteiro gerado</h3>
                  <p className="text-lg text-muted-foreground">
                    Use os agentes para gerar roteiros virais
                  </p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Stats Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <Card className="p-4 border-border/50">
                      <p className="text-sm text-muted-foreground">Total de Roteiros</p>
                      <p className="text-2xl font-bold text-foreground">{scripts.length}</p>
                    </Card>
                    <Card className="p-4 border-border/50">
                      <p className="text-sm text-muted-foreground">Minutos Totais</p>
                      <p className="text-2xl font-bold text-primary">
                        {scripts.reduce((acc, s) => acc + s.duration, 0)} min
                      </p>
                    </Card>
                    <Card className="p-4 border-border/50">
                      <p className="text-sm text-muted-foreground">Palavras Geradas</p>
                      <p className="text-2xl font-bold text-foreground">
                        {scripts.reduce((acc, s) => acc + s.content.split(/\s+/).length, 0).toLocaleString()}
                      </p>
                    </Card>
                    <Card className="p-4 border-border/50">
                      <p className="text-sm text-muted-foreground">Créditos Usados</p>
                      <p className="text-2xl font-bold text-amber-500">
                        {scripts.reduce((acc, s) => acc + s.credits_used, 0).toFixed(1)}
                      </p>
                    </Card>
                  </div>

                  {/* Scripts List */}
                  <div className="space-y-4">
                    {scripts
                      .filter(s => 
                        s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        s.content.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((script) => {
                        const wordCount = script.content.split(/\s+/).filter(w => w.length > 0).length;
                        const readTime = Math.ceil(wordCount / 150);
                        const isExpanded = copiedId === `expanded-${script.id}`;
                        
                        return (
                          <Card key={script.id} className="border-border/50 hover:border-primary/50 transition-colors overflow-hidden">
                            <div className="p-6">
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1">
                                  <h3 className="font-bold text-xl text-foreground mb-2">{script.title}</h3>
                                  
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    <Badge variant="outline" className="gap-1">
                                      <Clock className="w-3 h-3" />
                                      {script.duration} min
                                    </Badge>
                                    <Badge variant="outline">{script.language}</Badge>
                                    {script.model_used && (
                                      <Badge className="bg-primary/20 text-primary border-0 gap-1">
                                        <Rocket className="w-3 h-3" />
                                        {script.model_used}
                                      </Badge>
                                    )}
                                    <Badge variant="secondary" className="gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {new Date(script.created_at).toLocaleDateString('pt-BR')}
                                    </Badge>
                                  </div>
                                  
                                  <div className="flex gap-4 text-sm text-muted-foreground mb-3">
                                    <span>{wordCount.toLocaleString()} palavras</span>
                                    <span>~{readTime} min leitura</span>
                                    <span>{script.credits_used} créditos</span>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Preview or Full Content */}
                              <div className={`bg-background/50 rounded-lg p-4 mb-4 ${!isExpanded ? 'max-h-32 overflow-hidden relative' : ''}`}>
                                <p className="text-sm text-foreground whitespace-pre-wrap">
                                  {isExpanded ? script.content : script.content.substring(0, 400)}
                                  {!isExpanded && script.content.length > 400 && '...'}
                                </p>
                                {!isExpanded && script.content.length > 400 && (
                                  <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background/80 to-transparent" />
                                )}
                              </div>

                              <div className="flex gap-3">
                                <Button 
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => {
                                    if (isExpanded) {
                                      setCopiedId(null);
                                    } else {
                                      setCopiedId(`expanded-${script.id}`);
                                    }
                                  }}
                                >
                                  {isExpanded ? (
                                    <><ChevronUp className="w-4 h-4 mr-2" /> Recolher</>
                                  ) : (
                                    <><ChevronDown className="w-4 h-4 mr-2" /> Expandir</>
                                  )}
                                </Button>
                                <Button 
                                  className="flex-1 bg-primary text-primary-foreground"
                                  onClick={() => {
                                    // Remove part markings when copying
                                    const cleanContent = script.content
                                      .replace(/^(Parte\s*\d+\s*[:\.]\s*)/gim, '')
                                      .replace(/^\*\*Parte\s*\d+\s*[:\.]\s*\*\*/gim, '')
                                      .replace(/^#+ .+$/gm, '')
                                      .replace(/\n{3,}/g, '\n\n')
                                      .trim();
                                    navigator.clipboard.writeText(cleanContent);
                                    toast.success("Roteiro copiado!");
                                  }}
                                >
                                  <Copy className="w-4 h-4 mr-2" /> Copiar
                                </Button>
                                <Button 
                                  variant="destructive" 
                                  size="icon"
                                  onClick={async () => {
                                    const { error } = await supabase
                                      .from('generated_scripts')
                                      .delete()
                                      .eq('id', script.id);
                                    if (!error) {
                                      setScripts(scripts.filter(s => s.id !== script.id));
                                      toast.success("Roteiro removido!");
                                    }
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Generate Script Modal */}
      <GenerateScriptModal
        open={generateModalOpen}
        onOpenChange={setGenerateModalOpen}
        agent={selectedAgent}
      />
      
      {/* Tutorial Modal */}
      <TutorialModal
        open={showTutorial}
        onOpenChange={(open) => !open && completeTutorial()}
        title={VIRAL_LIBRARY_TUTORIAL.title}
        description={VIRAL_LIBRARY_TUTORIAL.description}
        steps={VIRAL_LIBRARY_TUTORIAL.steps}
        onComplete={completeTutorial}
      />
        </PermissionGate>
      </MainLayout>
    </>
  );
};

export default ViralLibrary;
