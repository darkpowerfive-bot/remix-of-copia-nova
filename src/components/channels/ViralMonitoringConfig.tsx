import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Settings,
  Plus,
  X,
  Flame,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Film,
  Clapperboard,
  Globe,
  TrendingUp,
  Youtube,
  Link2,
  Mail,
  MessageSquare,
  Bell,
  Crown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Link } from "react-router-dom";
import { usePermissions } from "@/hooks/usePermissions";

const COUNTRIES = [
  { code: "BR", name: "Brasil", flag: "🇧🇷" },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "ES", name: "Espanha", flag: "🇪🇸" },
  { code: "MX", name: "México", flag: "🇲🇽" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "GB", name: "Reino Unido", flag: "🇬🇧" },
  { code: "FR", name: "França", flag: "🇫🇷" },
  { code: "DE", name: "Alemanha", flag: "🇩🇪" },
  { code: "IT", name: "Itália", flag: "🇮🇹" },
  { code: "JP", name: "Japão", flag: "🇯🇵" },
  { code: "IN", name: "Índia", flag: "🇮🇳" },
];

interface ViralMonitoringConfigData {
  id: string;
  user_id: string;
  niches: string[];
  is_active: boolean;
  check_interval_hours: number;
  viral_threshold: number;
  last_checked_at: string | null;
  video_types: string[];
  country: string;
  notify_whatsapp: boolean;
  notify_email: boolean;
  whatsapp_template: string;
}

export const ViralMonitoringConfig = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newNiche, setNewNiche] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const { permissions, planName } = usePermissions();
  
  // Check if user has a paid plan (pro, turbo, master or admin) - uses user_roles table
  const isPaidPlan = planName !== "Free" && planName !== "FREE";

  // Fetch viral monitoring config
  const { data: config, isLoading } = useQuery({
    queryKey: ["viral-monitoring-config", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("viral_monitoring_config")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as ViralMonitoringConfigData | null;
    },
    enabled: !!user,
  });

  // Fetch user's YouTube API key status
  const { data: apiSettings } = useQuery({
    queryKey: ["api-settings-youtube", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_api_settings")
        .select("youtube_api_key, youtube_validated")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch saved analytics channels (pinned channels from Analytics page)
  const { data: savedAnalyticsChannels } = useQuery({
    queryKey: ["saved-analytics-channels", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("saved_analytics_channels")
        .select("id, channel_name, channel_thumbnail, notes")
        .eq("user_id", user.id)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const hasYouTubeApiKey = !!apiSettings?.youtube_api_key;

  // Create or update config mutation
  const saveConfigMutation = useMutation({
    mutationFn: async (updates: Partial<ViralMonitoringConfigData>) => {
      if (!user) throw new Error("User not authenticated");

      if (config) {
        // Update existing
        const { error } = await supabase
          .from("viral_monitoring_config")
          .update(updates)
          .eq("id", config.id);
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase
          .from("viral_monitoring_config")
          .insert({
            user_id: user.id,
            ...updates,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viral-monitoring-config"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddNiche = () => {
    if (!newNiche.trim()) return;

    const currentNiches = config?.niches || [];
    
    // Limitar a apenas 1 nicho por vez
    if (currentNiches.length >= 1) {
      toast({
        title: "Limite atingido",
        description: "Você pode monitorar apenas 1 nicho por vez. Remova o atual para adicionar outro.",
        variant: "destructive",
      });
      return;
    }

    if (currentNiches.includes(newNiche.trim().toLowerCase())) {
      toast({
        title: "Nicho duplicado",
        description: "Este nicho já está na sua lista",
        variant: "destructive",
      });
      return;
    }

    saveConfigMutation.mutate({
      niches: [newNiche.trim().toLowerCase()], // Sempre substitui para ter apenas 1
    });
    setNewNiche("");
    toast({ title: "Nicho configurado!" });
  };

  const handleRemoveNiche = (nicheToRemove: string) => {
    const currentNiches = config?.niches || [];
    saveConfigMutation.mutate({
      niches: currentNiches.filter((n) => n !== nicheToRemove),
    });
    toast({ title: "Nicho removido" });
  };

  const handleToggleActive = (checked: boolean) => {
    saveConfigMutation.mutate({ is_active: checked });
    toast({
      title: checked ? "Monitoramento ativado" : "Monitoramento pausado",
    });
  };

  const handleToggleVideoType = (type: string, checked: boolean) => {
    const currentTypes = config?.video_types || ["long", "short"];
    let newTypes: string[];
    
    if (checked) {
      newTypes = [...currentTypes, type];
    } else {
      newTypes = currentTypes.filter((t) => t !== type);
    }
    
    // Ensure at least one type is selected
    if (newTypes.length === 0) {
      toast({
        title: "Selecione pelo menos um tipo",
        variant: "destructive",
      });
      return;
    }
    
    saveConfigMutation.mutate({ video_types: newTypes });
  };

  const handleCountryChange = (countryCode: string) => {
    saveConfigMutation.mutate({ country: countryCode });
    toast({ title: "País atualizado!" });
  };

  const handleViralThresholdChange = (value: string) => {
    const threshold = parseInt(value, 10);
    if (isNaN(threshold) || threshold < 100) return;
    saveConfigMutation.mutate({ viral_threshold: threshold });
  };

  const niches = config?.niches || [];
  const isActive = config?.is_active ?? false;
  const videoTypes = config?.video_types || ["long", "short"];
  const country = config?.country || "BR";
  const viralThreshold = config?.viral_threshold || 1000;
  const notifyWhatsapp = config?.notify_whatsapp ?? false;
  const notifyEmail = config?.notify_email ?? false;

  const handleToggleNotifyWhatsapp = (checked: boolean) => {
    saveConfigMutation.mutate({ notify_whatsapp: checked });
    toast({
      title: checked ? "Notificação WhatsApp ativada" : "Notificação WhatsApp desativada",
    });
  };

  const handleToggleNotifyEmail = (checked: boolean) => {
    saveConfigMutation.mutate({ notify_email: checked });
    toast({
      title: checked ? "Notificação por Email ativada" : "Notificação por Email desativada",
    });
  };

  return (
    <Card className="p-4 mb-6">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Flame className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Detecção de Virais
                </h3>
                <p className="text-sm text-muted-foreground">
                  {niches.length > 0
                    ? `Monitorando ${niches.length} nicho(s)`
                    : "Configure nichos para monitorar"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isActive && niches.length > 0 && (
                <Badge variant="default" className="bg-green-500/20 text-green-500 border-green-500/30">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Ativo
                </Badge>
              )}
              <Settings className="w-5 h-5 text-muted-foreground" />
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent className="mt-4 space-y-4">
          {/* Status da API Key */}
          {!hasYouTubeApiKey && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-500">
                  YouTube API Key necessária
                </p>
                <p className="text-xs text-muted-foreground">
                  Configure sua chave de API do YouTube em{" "}
                  <a href="/settings" className="text-primary underline">
                    Configurações → APIs
                  </a>{" "}
                  para detectar vídeos virais.
                </p>
              </div>
            </div>
          )}

          {/* Toggle Ativo/Inativo */}
          <div className="flex items-center justify-between">
            <Label htmlFor="viral-active" className="text-sm">
              Ativar monitoramento automático
            </Label>
            <Switch
              id="viral-active"
              checked={isActive}
              onCheckedChange={handleToggleActive}
              disabled={!hasYouTubeApiKey || niches.length === 0}
            />
          </div>

          {/* Notificações */}
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-primary" />
              <Label className="text-sm font-medium">Receber alertas de vídeos virais</Label>
              {!isPaidPlan && (
                <Badge variant="outline" className="ml-2 text-xs border-primary/50 text-primary">
                  <Crown className="w-3 h-3 mr-1" />
                  PRO
                </Badge>
              )}
            </div>
            
            {!isPaidPlan ? (
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <p className="text-sm text-muted-foreground mb-2">
                  Alertas por Email e WhatsApp são exclusivos para planos pagos.
                </p>
                <Link to="/plans">
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Crown className="w-3 h-3 mr-1.5" />
                    Ver Planos
                  </Button>
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-green-500" />
                      <Label htmlFor="notify-whatsapp" className="text-sm cursor-pointer">
                        WhatsApp
                      </Label>
                    </div>
                    <Switch
                      id="notify-whatsapp"
                      checked={notifyWhatsapp}
                      onCheckedChange={handleToggleNotifyWhatsapp}
                      disabled={!isActive}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-500" />
                      <Label htmlFor="notify-email" className="text-sm cursor-pointer">
                        Email
                      </Label>
                    </div>
                    <Switch
                      id="notify-email"
                      checked={notifyEmail}
                      onCheckedChange={handleToggleNotifyEmail}
                      disabled={!isActive}
                    />
                  </div>
                </div>
                {!notifyWhatsapp && !notifyEmail && isActive && (
                  <p className="text-xs text-yellow-500 mt-2">
                    ⚠️ Ative pelo menos um canal para receber alertas
                  </p>
                )}
                {(notifyWhatsapp || notifyEmail) && (
                  <p className="text-xs text-muted-foreground mt-2">
                    ✅ Você receberá alertas personalizados quando detectarmos vídeos virais
                  </p>
                )}
              </>
            )}
          </div>

          {/* País */}
          <div>
            <Label className="text-sm mb-2 block flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-muted-foreground" />
              País para busca
            </Label>
            <Select value={country} onValueChange={handleCountryChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione o país" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="flex items-center gap-2">
                      <span>{c.flag}</span>
                      <span>{c.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Vídeos serão buscados em tendência neste país
            </p>
            {country !== "BR" && country !== "PT" && (
              <div className="mt-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>
                    <strong>Dica:</strong> Use termos de busca no idioma do país selecionado para melhores resultados. 
                    Ex: {country === "ES" || country === "MX" || country === "AR" 
                      ? '"historia" em vez de "história"' 
                      : country === "US" || country === "GB" 
                        ? '"history" em vez de "história"'
                        : country === "FR"
                          ? '"histoire" em vez de "história"'
                          : country === "DE"
                            ? '"geschichte" em vez de "história"'
                            : country === "IT"
                              ? '"storia" em vez de "história"'
                              : country === "JP"
                                ? 'termos em japonês'
                                : 'termos no idioma local'}
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Threshold de VPH */}
          <div>
            <Label className="text-sm mb-2 block flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              Threshold VPH (Views Por Hora)
            </Label>
            <Input
              type="number"
              min={100}
              step={100}
              value={viralThreshold}
              onChange={(e) => handleViralThresholdChange(e.target.value)}
              onBlur={(e) => {
                const val = parseInt(e.target.value, 10);
                if (isNaN(val) || val < 100) {
                  saveConfigMutation.mutate({ viral_threshold: 1000 });
                }
              }}
              className="w-full"
              placeholder="1000"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Vídeos com mais views/hora que este valor serão considerados virais
            </p>
          </div>

          {/* Tipo de Vídeo */}
          <div>
            <Label className="text-sm mb-3 block">Tipos de vídeo</Label>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="video-type-long"
                  checked={videoTypes.includes("long")}
                  onCheckedChange={(checked) => handleToggleVideoType("long", !!checked)}
                />
                <Label htmlFor="video-type-long" className="text-sm flex items-center gap-1.5 cursor-pointer">
                  <Film className="w-4 h-4 text-muted-foreground" />
                  Vídeos Longos
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="video-type-short"
                  checked={videoTypes.includes("short")}
                  onCheckedChange={(checked) => handleToggleVideoType("short", !!checked)}
                />
                <Label htmlFor="video-type-short" className="text-sm flex items-center gap-1.5 cursor-pointer">
                  <Clapperboard className="w-4 h-4 text-muted-foreground" />
                  Shorts
                </Label>
              </div>
            </div>
          </div>

          {/* Nicho atual */}
          <div>
            <Label className="text-sm mb-2 block">
              Nicho monitorado ({niches.length}/1)
            </Label>
            <div className="flex flex-wrap gap-2 mb-3">
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : niches.length > 0 ? (
                niches.map((niche) => (
                  <Badge
                    key={niche}
                    variant="secondary"
                    className="flex items-center gap-1 px-3 py-1"
                  >
                    {niche}
                    <button
                      onClick={() => handleRemoveNiche(niche)}
                      className="ml-1 hover:text-destructive transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  Nenhum nicho configurado
                </p>
              )}
            </div>
          </div>

          {/* Adicionar nicho */}
          {niches.length < 1 && (
            <div className="flex gap-2">
              <Input
                placeholder="Ex: dark channel, motivacional, curiosidades..."
                value={newNiche}
                onChange={(e) => setNewNiche(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddNiche()}
                className="flex-1"
              />
              <Button
                onClick={handleAddNiche}
                disabled={!newNiche.trim() || saveConfigMutation.isPending}
                size="sm"
              >
                {saveConfigMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </div>
          )}


          {/* Sugestões populares */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              Sugestões populares:
            </p>
            <div className="flex flex-wrap gap-1">
              {[
                "dark channel",
                "motivacional",
                "curiosidades",
                "história",
                "mistério",
                "finanças",
                "tecnologia",
                "true crime",
              ]
                .filter((s) => !niches.includes(s))
                .slice(0, 5)
                .map((suggestion) => (
                  <Button
                    key={suggestion}
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-xs"
                    onClick={() => {
                      setNewNiche(suggestion);
                    }}
                  >
                    +{suggestion}
                  </Button>
                ))}
            </div>
          </div>

          {/* Info sobre como funciona */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <p className="font-medium mb-1">💡 Como funciona:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Nossa automação busca sua config de nichos automaticamente</li>
              <li>Usa sua própria YouTube API Key para pesquisar</li>
              <li>Detecta vídeos com +1000 views/hora no nicho</li>
              <li>A IA analisa por que o vídeo está viralizando</li>
              <li>Você recebe notificação em tempo real</li>
            </ul>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
