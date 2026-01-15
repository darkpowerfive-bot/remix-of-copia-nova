import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Loader2, Save, Video, ExternalLink, Youtube, Play, 
  Type, Layout, MessageSquare, Rocket, Image
} from "lucide-react";

interface LandingSettings {
  // Video
  videoUrl: string;
  videoId: string | null;
  // Hero
  heroBadge: string;
  heroTitle: string;
  heroHighlight: string;
  heroSubtitle: string;
  heroCta: string;
  heroCtaSecondary: string;
  // Video Section
  videoSectionBadge: string;
  videoSectionTitle: string;
  videoSectionHighlight: string;
  videoSectionSubtitle: string;
  videoDuration: string;
}

const defaultSettings: LandingSettings = {
  videoUrl: "",
  videoId: null,
  heroBadge: "PLATAFORMA EXCLUSIVA",
  heroTitle: "Escale seu Canal Dark",
  heroHighlight: "para $10K+/mês",
  heroSubtitle: "Ferramentas de IA, automação completa e estratégias comprovadas para dominar o YouTube sem aparecer.",
  heroCta: "Começar Agora",
  heroCtaSecondary: "Ver Demonstração",
  videoSectionBadge: "VEJA EM AÇÃO",
  videoSectionTitle: "Conheça o Poder do",
  videoSectionHighlight: "La Casa Dark CORE",
  videoSectionSubtitle: "Assista uma demonstração completa das funcionalidades que vão revolucionar sua operação no YouTube.",
  videoDuration: "5 minutos",
};

export const AdminLandingTab = () => {
  const [settings, setSettings] = useState<LandingSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("*")
        .eq("key", "landing_settings")
        .maybeSingle();

      if (error) throw error;
      if (data?.value) {
        setSettings({ ...defaultSettings, ...(data.value as Partial<LandingSettings>) });
      }
    } catch (error) {
      console.error("Error fetching landing settings:", error);
    } finally {
      setLoading(false);
    }
  };

  const extractVideoId = (url: string): string | null => {
    if (!url) return null;
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    return null;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const videoId = extractVideoId(settings.videoUrl);
      const settingsToSave = { ...settings, videoId };

      const { data: existingData } = await supabase
        .from("admin_settings")
        .select("id")
        .eq("key", "landing_settings")
        .maybeSingle();

      if (existingData) {
        const { error } = await supabase
          .from("admin_settings")
          .update({ 
            value: settingsToSave,
            updated_at: new Date().toISOString(),
          })
          .eq("key", "landing_settings");

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("admin_settings")
          .insert({
            key: "landing_settings",
            value: settingsToSave,
          });

        if (error) throw error;
      }

      setSettings(settingsToSave);
      toast.success("Configurações da landing page atualizadas!");
    } catch (error) {
      console.error("Error saving landing settings:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = <K extends keyof LandingSettings>(key: K, value: LandingSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="hero" className="space-y-6">
        <TabsList className="bg-secondary/50 p-1 h-auto flex-wrap">
          <TabsTrigger value="hero" className="flex items-center gap-2">
            <Layout className="w-4 h-4" />
            Hero
          </TabsTrigger>
          <TabsTrigger value="video" className="flex items-center gap-2">
            <Youtube className="w-4 h-4" />
            Vídeo
          </TabsTrigger>
          <TabsTrigger value="texts" className="flex items-center gap-2">
            <Type className="w-4 h-4" />
            Textos Gerais
          </TabsTrigger>
        </TabsList>

        {/* Hero Section Settings */}
        <TabsContent value="hero" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <Rocket className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Seção Hero</h3>
                <p className="text-sm text-muted-foreground">
                  Configure os textos principais da página inicial
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <Label htmlFor="hero-badge" className="text-sm font-medium mb-2 block">
                  Badge (etiqueta superior)
                </Label>
                <Input
                  id="hero-badge"
                  value={settings.heroBadge}
                  onChange={(e) => updateSetting("heroBadge", e.target.value)}
                  placeholder="PLATAFORMA EXCLUSIVA"
                  className="bg-secondary border-border"
                />
              </div>

              <div>
                <Label htmlFor="hero-title" className="text-sm font-medium mb-2 block">
                  Título Principal
                </Label>
                <Input
                  id="hero-title"
                  value={settings.heroTitle}
                  onChange={(e) => updateSetting("heroTitle", e.target.value)}
                  placeholder="Escale seu Canal Dark"
                  className="bg-secondary border-border"
                />
              </div>

              <div>
                <Label htmlFor="hero-highlight" className="text-sm font-medium mb-2 block">
                  Destaque (texto em gradiente)
                </Label>
                <Input
                  id="hero-highlight"
                  value={settings.heroHighlight}
                  onChange={(e) => updateSetting("heroHighlight", e.target.value)}
                  placeholder="para $10K+/mês"
                  className="bg-secondary border-border"
                />
              </div>

              <div>
                <Label htmlFor="hero-subtitle" className="text-sm font-medium mb-2 block">
                  Subtítulo
                </Label>
                <Textarea
                  id="hero-subtitle"
                  value={settings.heroSubtitle}
                  onChange={(e) => updateSetting("heroSubtitle", e.target.value)}
                  placeholder="Ferramentas de IA..."
                  className="bg-secondary border-border min-h-[80px]"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="hero-cta" className="text-sm font-medium mb-2 block">
                    Botão Principal
                  </Label>
                  <Input
                    id="hero-cta"
                    value={settings.heroCta}
                    onChange={(e) => updateSetting("heroCta", e.target.value)}
                    placeholder="Começar Agora"
                    className="bg-secondary border-border"
                  />
                </div>

                <div>
                  <Label htmlFor="hero-cta-secondary" className="text-sm font-medium mb-2 block">
                    Botão Secundário
                  </Label>
                  <Input
                    id="hero-cta-secondary"
                    value={settings.heroCtaSecondary}
                    onChange={(e) => updateSetting("heroCtaSecondary", e.target.value)}
                    placeholder="Ver Demonstração"
                    className="bg-secondary border-border"
                  />
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Video Section Settings */}
        <TabsContent value="video" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <Youtube className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Vídeo de Demonstração</h3>
                <p className="text-sm text-muted-foreground">
                  Configure o vídeo exibido na landing page
                </p>
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <Label htmlFor="youtube-url" className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Video className="w-4 h-4 text-muted-foreground" />
                  Link do YouTube
                </Label>
                <Input
                  id="youtube-url"
                  type="text"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={settings.videoUrl}
                  onChange={(e) => updateSetting("videoUrl", e.target.value)}
                  className="bg-secondary border-border"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formatos aceitos: youtube.com/watch?v=ID, youtu.be/ID, ou apenas o ID do vídeo
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="video-badge" className="text-sm font-medium mb-2 block">
                    Badge da Seção
                  </Label>
                  <Input
                    id="video-badge"
                    value={settings.videoSectionBadge}
                    onChange={(e) => updateSetting("videoSectionBadge", e.target.value)}
                    placeholder="VEJA EM AÇÃO"
                    className="bg-secondary border-border"
                  />
                </div>

                <div>
                  <Label htmlFor="video-duration" className="text-sm font-medium mb-2 block">
                    Duração do Vídeo
                  </Label>
                  <Input
                    id="video-duration"
                    value={settings.videoDuration}
                    onChange={(e) => updateSetting("videoDuration", e.target.value)}
                    placeholder="5 minutos"
                    className="bg-secondary border-border"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="video-title" className="text-sm font-medium mb-2 block">
                  Título da Seção
                </Label>
                <Input
                  id="video-title"
                  value={settings.videoSectionTitle}
                  onChange={(e) => updateSetting("videoSectionTitle", e.target.value)}
                  placeholder="Conheça o Poder do"
                  className="bg-secondary border-border"
                />
              </div>

              <div>
                <Label htmlFor="video-highlight" className="text-sm font-medium mb-2 block">
                  Destaque do Título
                </Label>
                <Input
                  id="video-highlight"
                  value={settings.videoSectionHighlight}
                  onChange={(e) => updateSetting("videoSectionHighlight", e.target.value)}
                  placeholder="La Casa Dark CORE"
                  className="bg-secondary border-border"
                />
              </div>

              <div>
                <Label htmlFor="video-subtitle" className="text-sm font-medium mb-2 block">
                  Subtítulo da Seção
                </Label>
                <Textarea
                  id="video-subtitle"
                  value={settings.videoSectionSubtitle}
                  onChange={(e) => updateSetting("videoSectionSubtitle", e.target.value)}
                  placeholder="Assista uma demonstração..."
                  className="bg-secondary border-border min-h-[80px]"
                />
              </div>
            </div>
          </Card>

          {/* Video Preview */}
          {extractVideoId(settings.videoUrl) && (
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-success/10">
                  <Play className="w-5 h-5 text-success" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Preview do Vídeo</h3>
                  <p className="text-sm text-muted-foreground">
                    Este é o vídeo que será exibido na landing page
                  </p>
                </div>
              </div>

              <div className="aspect-video rounded-lg overflow-hidden bg-black border border-border">
                <iframe
                  src={`https://www.youtube.com/embed/${extractVideoId(settings.videoUrl)}`}
                  title="Preview do vídeo"
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              <div className="mt-4 flex items-center gap-2">
                <a
                  href={`https://www.youtube.com/watch?v=${extractVideoId(settings.videoUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  Abrir no YouTube
                </a>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* General Texts Settings */}
        <TabsContent value="texts" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-primary/10">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Textos Gerais</h3>
                <p className="text-sm text-muted-foreground">
                  Configurações adicionais de textos (em breve)
                </p>
              </div>
            </div>

            <p className="text-muted-foreground text-center py-8">
              Mais configurações de textos serão adicionadas em breve.
            </p>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <Button 
        onClick={handleSave} 
        disabled={saving}
        className="w-full gradient-button"
        size="lg"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        Salvar Todas as Configurações
      </Button>
    </div>
  );
};
