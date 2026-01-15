import { MainLayout } from "@/components/layout/MainLayout";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ViralMonitoringConfig } from "@/components/channels/ViralMonitoringConfig";
import { WhatsAppLimitModal, WhatsAppLimitType } from "@/components/channels/WhatsAppLimitModal";
import { ChannelNicheEditor } from "@/components/channels/ChannelNicheEditor";
import { useViralDetectionUsage } from "@/hooks/useViralDetectionUsage";
import {
  Eye,
  Plus,
  Search,
  Loader2,
  Trash2,
  Pin,
  X,
  ThumbsUp,
  Play,
  Folder,
  Bell,
  RefreshCw,
  Clock,
  Settings,
  Flame,
  TrendingUp,
  ExternalLink,
  MessageCircle,
  Tags,
  Infinity,
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePersistedState } from "@/hooks/usePersistedState";
import { useNavigate } from "react-router-dom";
import { useTutorial } from "@/hooks/useTutorial";
import { TutorialModal, TutorialHelpButton } from "@/components/tutorial/TutorialModal";
import { MONITORED_CHANNELS_TUTORIAL } from "@/lib/tutorialConfigs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
} from "@/components/ui/dialog";

interface ChannelVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  views: string;
  likes: string;
  publishedAt: string;
  url: string;
}

interface PinnedVideo {
  id: string;
  channel_id: string;
  video_id: string;
  video_url: string;
  title: string;
  thumbnail_url: string;
  views: string;
  likes: string;
}

interface ViralVideo {
  id: string;
  user_id: string;
  video_id: string;
  video_url: string;
  title: string | null;
  thumbnail_url: string | null;
  channel_name: string | null;
  channel_url: string | null;
  views: number;
  likes: number;
  comments: number;
  published_at: string | null;
  detected_at: string;
  viral_score: number;
  niche: string | null;
  keywords: string[] | null;
  is_read: boolean;
}

const MonitoredChannels = () => {
  // Persisted states
  const [channelUrl, setChannelUrl] = usePersistedState("monitored_channelUrl", "");
  const [channelName, setChannelName] = usePersistedState("monitored_channelName", "");

  // Non-persisted states
  const [adding, setAdding] = useState(false);
  const [loadingChannelName, setLoadingChannelName] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [recentVideos, setRecentVideos] = useState<ChannelVideo[]>([]);
  const [popularVideos, setPopularVideos] = useState<ChannelVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [showVideosDialog, setShowVideosDialog] = useState(false);
  const [pinnedFilter, setPinnedFilter] = useState<string>("all");
  
  // Niche editor modal state
  const [nicheEditorState, setNicheEditorState] = useState<{
    isOpen: boolean;
    channelId: string;
    channelName: string;
    niche?: string | null;
    subniche?: string | null;
    micronicho?: string | null;
  }>({
    isOpen: false,
    channelId: "",
    channelName: "",
  });
  
  // WhatsApp limit modal state
  const [whatsappLimitModal, setWhatsappLimitModal] = useState<{
    isOpen: boolean;
    type: WhatsAppLimitType;
    details?: {
      limit?: number;
      remaining?: number;
      nextAvailable?: string;
      sentCount?: number;
    };
  }>({ isOpen: false, type: "success" });

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Tutorial hook
  const { showTutorial, completeTutorial, openTutorial } = useTutorial(MONITORED_CHANNELS_TUTORIAL.id);
  
  // Viral detection usage hook
  const { usage: viralUsage, incrementUsage, isPaidPlan } = useViralDetectionUsage();

  // Fetch monitored channels
  const { data: channels, isLoading } = useQuery({
    queryKey: ["monitored-channels", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("monitored_channels")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch pinned videos
  const { data: pinnedVideos } = useQuery({
    queryKey: ["pinned-videos", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("pinned_videos")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as PinnedVideo[];
    },
    enabled: !!user,
  });

  // Fetch viral videos
  const { data: viralVideos, refetch: refetchVirals } = useQuery({
    queryKey: ["viral-videos", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("viral_videos")
        .select("*")
        .eq("user_id", user.id)
        .order("detected_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as ViralVideo[];
    },
    enabled: !!user,
  });

  // Fetch viral monitoring config to get user's niches and click limits
  const { data: viralConfig, refetch: refetchViralConfig } = useQuery({
    queryKey: ["viral-monitoring-config-full", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("viral_monitoring_config")
        .select("id, niches, scheduled_time, daily_clicks_count, daily_clicks_date")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as { 
        id: string;
        niches: string[]; 
        scheduled_time: string | null;
        daily_clicks_count: number | null;
        daily_clicks_date: string | null;
      } | null;
    },
    enabled: !!user,
  });

  // Get unique niches from config
  const userNiches = viralConfig?.niches || [];

  // Subscribe to realtime viral video updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('viral-videos-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'viral_videos',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('New viral video detected:', payload);
          refetchVirals();
          toast({
            title: "🔥 Vídeo Viral Detectado!",
            description: (payload.new as ViralVideo).title || "Novo vídeo viralizando no seu nicho",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetchVirals, toast]);

  // Count unread viral videos
  const unreadViralCount = viralVideos?.filter(v => !v.is_read).length || 0;

  // Mark viral video as read
  const markViralAsReadMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const { error } = await supabase
        .from("viral_videos")
        .update({ is_read: true })
        .eq("id", videoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viral-videos"] });
    },
  });

  // Delete viral video
  const deleteViralMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const { error } = await supabase
        .from("viral_videos")
        .delete()
        .eq("id", videoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["viral-videos"] });
      toast({ title: "Vídeo removido da lista" });
    },
  });

  // Extract channel name from URL
  const extractChannelName = async (url: string) => {
    if (!url.includes("youtube.com") && !url.includes("youtu.be")) return;

    setLoadingChannelName(true);
    try {
      // Extrair handle ou ID do canal da URL
      const handleMatch = url.match(/@([a-zA-Z0-9_-]+)/);
      if (handleMatch) {
        setChannelName(handleMatch[1]);
      } else {
        // Tentar extrair nome do canal de outras formas
        const channelMatch = url.match(/\/channel\/([a-zA-Z0-9_-]+)/);
        const userMatch = url.match(/\/user\/([a-zA-Z0-9_-]+)/);
        if (channelMatch) {
          setChannelName(channelMatch[1]);
        } else if (userMatch) {
          setChannelName(userMatch[1]);
        }
      }
    } catch (error) {
      console.error("Error extracting channel name:", error);
    } finally {
      setLoadingChannelName(false);
    }
  };

  // Add channel mutation
  const addChannelMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      const { error } = await supabase.from("monitored_channels").insert({
        user_id: user.id,
        channel_url: channelUrl,
        channel_name: channelName || "Canal sem nome",
        subscribers: "N/A",
        growth_rate: "+0%",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitored-channels"] });
      setChannelUrl("");
      setChannelName("");
      toast({
        title: "Canal adicionado!",
        description: "O canal foi adicionado à sua lista de monitoramento",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o canal",
        variant: "destructive",
      });
    },
  });

  // Delete channel mutation
  const deleteChannelMutation = useMutation({
    mutationFn: async (channelId: string) => {
      const { error } = await supabase
        .from("monitored_channels")
        .delete()
        .eq("id", channelId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["monitored-channels"] });
      queryClient.invalidateQueries({ queryKey: ["pinned-videos"] });
      toast({
        title: "Canal removido",
        description: "O canal foi removido da sua lista",
      });
    },
  });

  // Pin video mutation
  const pinVideoMutation = useMutation({
    mutationFn: async (video: ChannelVideo & { channelId: string }) => {
      if (!user) throw new Error("User not authenticated");

      // Check if already pinned 3 videos for this channel
      const channelPins = pinnedVideos?.filter((v) => v.channel_id === video.channelId) || [];
      if (channelPins.length >= 3) {
        throw new Error("Limite de 3 vídeos fixados por canal");
      }

      const { error } = await supabase.from("pinned_videos").insert({
        user_id: user.id,
        channel_id: video.channelId,
        video_id: video.videoId,
        video_url: video.url,
        title: video.title,
        thumbnail_url: video.thumbnail,
        views: video.views,
        likes: video.likes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pinned-videos"] });
      toast({ title: "Vídeo fixado!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Pin viral video mutation (without requiring channelId)
  const pinViralVideoMutation = useMutation({
    mutationFn: async (video: ViralVideo) => {
      if (!user) throw new Error("User not authenticated");

      // Check if already pinned
      const existingPin = pinnedVideos?.find((v) => v.video_id === video.video_id);
      if (existingPin) {
        throw new Error("Este vídeo já está fixado");
      }

      const { error } = await supabase.from("pinned_videos").insert({
        user_id: user.id,
        channel_id: null, // Viral videos don't require channel association
        video_id: video.video_id,
        video_url: video.video_url,
        title: video.title,
        thumbnail_url: video.thumbnail_url,
        views: String(video.views),
        likes: String(video.likes),
        published_at: video.published_at,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pinned-videos"] });
      toast({ title: "Vídeo fixado!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Unpin video mutation
  const unpinVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      const { error } = await supabase
        .from("pinned_videos")
        .delete()
        .eq("id", videoId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pinned-videos"] });
      toast({ title: "Vídeo removido dos fixados" });
    },
  });

  // Toggle notification mutation
  const toggleNotificationMutation = useMutation({
    mutationFn: async ({ channelId, notify }: { channelId: string; notify: boolean }) => {
      const { error } = await supabase
        .from("monitored_channels")
        .update({ notify_new_videos: notify })
        .eq("id", channelId);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["monitored-channels"] });
      toast({ 
        title: variables.notify ? "Notificações ativadas" : "Notificações desativadas",
        description: variables.notify 
          ? "Você será notificado quando houver novos vídeos" 
          : "Você não receberá mais notificações deste canal"
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível alterar as notificações",
        variant: "destructive",
      });
    },
  });

  // Use the viral detection usage hook for limits
  const canLoadMore = viralUsage.canUse;
  const usageDisplay = viralUsage.dailyLimit === null 
    ? `${viralUsage.currentCount}/∞`
    : `${viralUsage.currentCount}/${viralUsage.dailyLimit}`;

  // Check new videos mutation - now triggers n8n workflow
  const [checkingVideos, setCheckingVideos] = useState(false);
  const checkNewVideosMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");
      
      // Check limit using the hook
      if (!viralUsage.canUse) {
        const limitText = viralUsage.dailyLimit === null ? "ilimitado" : viralUsage.dailyLimit;
        throw new Error(`Você atingiu o limite de ${limitText} verificação(ões) por dia`);
      }
      
      setCheckingVideos(true);
      
      // Increment usage count
      await incrementUsage.mutateAsync();
      
      // Execute n8n workflow via edge function (avoids CORS)
      const { data, error } = await supabase.functions.invoke("trigger-viral-detection");
      
      if (error) {
        // Fallback to check-new-videos if trigger fails
        const { data: fallbackData, error: fallbackError } = await supabase.functions.invoke("check-new-videos");
        if (fallbackError) throw fallbackError;
        return fallbackData;
      }
      
      return data;
    },
    onSuccess: (data) => {
      setCheckingVideos(false);
      refetchViralConfig();
      queryClient.invalidateQueries({ queryKey: ["video-notifications"] });
      queryClient.invalidateQueries({ queryKey: ["viral-videos"] });
      queryClient.invalidateQueries({ queryKey: ["viral-detection-usage"] });
      
      // Check if there's WhatsApp limit info in the response
      const whatsappInfo = data?.whatsappLimitInfo || data?.n8n_response?.whatsappLimitInfo;
      if (whatsappInfo?.limitType) {
        setWhatsappLimitModal({
          isOpen: true,
          type: whatsappInfo.limitType as WhatsAppLimitType,
          details: {
            limit: whatsappInfo.antiBlockInfo?.dailyLimitPerUser,
            nextAvailable: whatsappInfo.nextAvailable,
          },
        });
      } else {
        toast({
          title: "Verificação iniciada",
          description: "Buscando vídeos virais nos seus nichos...",
        });
      }
    },
    onError: (error: Error) => {
      setCheckingVideos(false);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível verificar novos vídeos",
        variant: "destructive",
      });
    },
  });

  const handleAddChannel = async () => {
    if (!channelUrl.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira a URL do canal",
        variant: "destructive",
      });
      return;
    }
    setAdding(true);
    await addChannelMutation.mutateAsync();
    setAdding(false);
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value;
    setChannelUrl(url);
    if (url.length > 10) {
      extractChannelName(url);
    }
  };

  // Fetch user's API settings including check frequency
  const { data: apiSettings } = useQuery({
    queryKey: ["api-settings", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("user_api_settings")
        .select("youtube_api_key, youtube_validated, video_check_frequency")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Generate time options (every hour from 00:00 to 23:00)
  const timeOptions = Array.from({ length: 24 }, (_, i) => {
    const hour = i.toString().padStart(2, '0');
    return { value: `${hour}:00`, label: `${hour}:00` };
  });

  // Update scheduled time mutation
  const updateScheduledTimeMutation = useMutation({
    mutationFn: async (time: string) => {
      if (!user) throw new Error("User not authenticated");
      
      if (viralConfig?.id) {
        const { error } = await supabase
          .from("viral_monitoring_config")
          .update({ scheduled_time: time })
          .eq("id", viralConfig.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("viral_monitoring_config")
          .insert({ 
            user_id: user.id, 
            scheduled_time: time,
            niches: []
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      refetchViralConfig();
      toast({
        title: "Horário atualizado",
        description: "O horário de verificação automática foi alterado",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível alterar o horário",
        variant: "destructive",
      });
    },
  });
  const fetchChannelVideos = async (channelId: string, channelUrlToFetch: string) => {
    if (!apiSettings?.youtube_api_key) {
      toast({
        title: "Chave de API necessária",
        description: "Configure sua chave de API do YouTube nas configurações para buscar vídeos reais.",
        variant: "destructive",
      });
      return;
    }

    setLoadingVideos(true);
    setSelectedChannelId(channelId);
    setShowVideosDialog(true);

    try {
      const { data, error } = await supabase.functions.invoke("fetch-channel-videos", {
        body: {
          channelUrl: channelUrlToFetch,
          youtubeApiKey: apiSettings.youtube_api_key,
        },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      // Set recent and popular videos separately
      setRecentVideos(data.recentVideos || []);
      setPopularVideos(data.popularVideos || []);

      // Update channel name if we got a better one
      if (data.channelName) {
        await supabase
          .from("monitored_channels")
          .update({ channel_name: data.channelName })
          .eq("id", channelId);
        queryClient.invalidateQueries({ queryKey: ["monitored-channels"] });
      }

    } catch (error: unknown) {
      console.error("Error fetching videos:", error);
      const errorMessage = error instanceof Error ? error.message : "Não foi possível buscar os vídeos do canal";
      
      // Check if it's an API key issue
      if (errorMessage.includes("API") || errorMessage.includes("key")) {
        toast({
          title: "Chave de API necessária",
          description: "Configure sua chave de API do YouTube nas configurações para buscar vídeos reais.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleAnalyzeVideo = (videoUrl: string, videoData?: {
    title?: string;
    thumbnail?: string;
    views?: number;
    likes?: number;
    comments?: number;
    channel?: string;
    publishedAt?: string;
  }) => {
    const params = new URLSearchParams({ url: videoUrl });
    if (videoData?.title) params.set('title', videoData.title);
    if (videoData?.thumbnail) params.set('thumbnail', videoData.thumbnail);
    if (videoData?.views) params.set('views', String(videoData.views));
    if (videoData?.likes) params.set('likes', String(videoData.likes));
    if (videoData?.comments) params.set('comments', String(videoData.comments));
    if (videoData?.channel) params.set('channel', videoData.channel);
    if (videoData?.publishedAt) params.set('publishedAt', videoData.publishedAt);
    navigate(`/analyzer?${params.toString()}`);
  };

  const isVideoPinned = (videoId: string) => {
    return pinnedVideos?.some((v) => v.video_id === videoId);
  };

  // Filter pinned videos by channel
  const filteredPinnedVideos =
    pinnedFilter === "all"
      ? pinnedVideos
      : pinnedFilter === "viral"
        ? pinnedVideos?.filter((v) => v.channel_id === null)
        : pinnedVideos?.filter((v) => v.channel_id === pinnedFilter);

  // Group pinned videos by channel (including viral videos with null channel_id)
  const groupedPinnedVideos = (() => {
    const groups: Record<string, { channelName: string; videos: PinnedVideo[] }> = {};
    
    // Group by channel
    channels?.forEach((channel) => {
      const videos = pinnedVideos?.filter((v) => v.channel_id === channel.id) || [];
      if (videos.length > 0) {
        groups[channel.id] = {
          channelName: channel.channel_name || "Canal",
          videos,
        };
      }
    });
    
    // Add viral videos (channel_id === null)
    const viralPinnedVideos = pinnedVideos?.filter((v) => v.channel_id === null) || [];
    if (viralPinnedVideos.length > 0) {
      groups["viral"] = {
        channelName: "Vídeos Virais",
        videos: viralPinnedVideos,
      };
    }
    
    return groups;
  })();

  return (
    <MainLayout>
      <SEOHead
        title="Canais Monitorados"
        description="Monitore canais do YouTube e receba notificações de novos vídeos."
        noindex={true}
      />
      
      {/* WhatsApp Limit Modal */}
      <WhatsAppLimitModal
        isOpen={whatsappLimitModal.isOpen}
        onClose={() => setWhatsappLimitModal({ ...whatsappLimitModal, isOpen: false })}
        type={whatsappLimitModal.type}
        details={whatsappLimitModal.details}
      />
      
      {/* Channel Niche Editor Modal */}
      <ChannelNicheEditor
        isOpen={nicheEditorState.isOpen}
        onClose={() => setNicheEditorState({ ...nicheEditorState, isOpen: false })}
        channelId={nicheEditorState.channelId}
        channelName={nicheEditorState.channelName}
        currentNiche={nicheEditorState.niche}
        currentSubniche={nicheEditorState.subniche}
        currentMicronicho={nicheEditorState.micronicho}
      />
      
      <PermissionGate permission="canais_monitorados" featureName="Canais Monitorados">
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Canais Monitorados
              </h1>
              <p className="text-muted-foreground">
                Adicione canais do YouTube para monitorar novos vídeos.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <TutorialHelpButton onClick={openTutorial} />
              {/* Scheduled time selector - only for paid plans */}
              {isPaidPlan && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <Select
                    value={viralConfig?.scheduled_time || "09:00"}
                    onValueChange={(value) => updateScheduledTimeMutation.mutate(value)}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Horário" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {timeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Button
                onClick={() => checkNewVideosMutation.mutate()}
                disabled={checkingVideos || !canLoadMore}
                variant="outline"
                className="flex items-center gap-2"
                title={!canLoadMore ? "Limite diário atingido" : `Verificações hoje: ${usageDisplay}`}
              >
                <RefreshCw className={`w-4 h-4 ${checkingVideos ? "animate-spin" : ""}`} />
                Carregar ({usageDisplay})
              </Button>
            </div>
          </div>

          {/* Viral Monitoring Config */}
          <ViralMonitoringConfig />

          {/* Two column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Add Channel Card */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Adicionar Novo Canal
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">
                    Nome do Canal
                  </label>
                  <Input
                    placeholder="Ex: Canal Dark"
                    value={channelName}
                    onChange={(e) => setChannelName(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground mb-1.5 block">
                    URL do Canal
                  </label>
                  <div className="relative">
                    <Input
                      data-tutorial="add-channel-input"
                      placeholder="https://www.youtube.com/@canal"
                      value={channelUrl}
                      onChange={handleUrlChange}
                      className="bg-secondary border-border"
                    />
                    {loadingChannelName && (
                      <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
                    )}
                  </div>
                </div>
                <Button
                  onClick={handleAddChannel}
                  disabled={adding}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {adding ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Adicionar Canal
                </Button>
              </div>
            </Card>

            {/* Channels List Card */}
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-foreground mb-4">
                Meus Canais Monitorados
              </h2>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                </div>
              ) : channels && channels.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead className="text-primary">NOME</TableHead>
                        <TableHead className="text-primary">NICHO</TableHead>
                        <TableHead className="text-primary">NOTIFICAR</TableHead>
                        <TableHead className="text-primary text-right">
                          AÇÕES
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {channels.map((channel) => (
                        <TableRow key={channel.id} className="border-border">
                          <TableCell className="font-medium text-foreground">
                            <div className="flex flex-col">
                              <span>{channel.channel_name}</span>
                              <a
                                href={channel.channel_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-muted-foreground hover:text-primary hover:underline truncate max-w-[180px]"
                              >
                                {channel.channel_url}
                              </a>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setNicheEditorState({
                                isOpen: true,
                                channelId: channel.id,
                                channelName: channel.channel_name || "Canal",
                                niche: (channel as any).niche,
                                subniche: (channel as any).subniche,
                                micronicho: (channel as any).micronicho,
                              })}
                              className="flex items-center gap-1.5 text-xs h-auto py-1.5 px-2"
                            >
                              {(channel as any).niche ? (
                                <div className="flex flex-col items-start gap-0.5">
                                  <Badge variant="outline" className="text-xs font-normal border-destructive/50 text-destructive">
                                    {(channel as any).niche}
                                  </Badge>
                                  {(channel as any).subniche && (
                                    <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                                      {(channel as any).subniche}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <>
                                  <Tags className="w-3 h-3" />
                                  <span className="text-muted-foreground">Definir</span>
                                </>
                              )}
                            </Button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={channel.notify_new_videos || false}
                                onCheckedChange={(checked) =>
                                  toggleNotificationMutation.mutate({
                                    channelId: channel.id,
                                    notify: checked,
                                  })
                                }
                              />
                              <Bell
                                className={`w-4 h-4 ${
                                  channel.notify_new_videos
                                    ? "text-primary"
                                    : "text-muted-foreground"
                                }`}
                              />
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  fetchChannelVideos(channel.id, channel.channel_url)
                                }
                                title="Buscar Vídeos"
                                className="text-primary hover:bg-primary/10"
                              >
                                <Search className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => deleteChannelMutation.mutate(channel.id)}
                                className="text-destructive hover:bg-destructive/10"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Eye className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground text-sm">
                    Nenhum canal monitorado ainda
                  </p>
                </div>
              )}
            </Card>
          </div>

          {/* Videos Tabs Section */}
          <Card className="p-6">
            <Tabs defaultValue="viral" className="w-full">
              <div className="overflow-x-auto pb-2">
                <TabsList className="inline-flex w-auto min-w-full md:min-w-0 mb-6">
                  <TabsTrigger value="viral" className="flex items-center gap-2">
                    <Flame className="w-4 h-4" />
                    Viralizando
                    {unreadViralCount > 0 && (
                      <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-xs">
                        {unreadViralCount}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger value="pinned" className="flex items-center gap-2">
                    <Pin className="w-4 h-4" />
                    Fixados
                  </TabsTrigger>
                  {userNiches.map((niche) => {
                    const nicheVideos = viralVideos?.filter(
                      (v) => v.niche?.toLowerCase() === niche.toLowerCase()
                    ) ?? [];
                    return (
                      <TabsTrigger key={niche} value={`niche-${niche}`} className="flex items-center gap-2 capitalize">
                        <TrendingUp className="w-4 h-4" />
                        {niche}
                        {nicheVideos.length > 0 && (
                          <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                            {nicheVideos.length}
                          </Badge>
                        )}
                      </TabsTrigger>
                    );
                  })}
                </TabsList>
              </div>

              {/* Viral Videos Tab - All */}
              <TabsContent value="viral">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Vídeos detectados viralizando no seu nicho
                    </p>
                  </div>
                </div>

                {viralVideos && viralVideos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {viralVideos.map((video) => {
                      const pinnedVideo = pinnedVideos?.find((p) => p.video_id === video.video_id);
                      return (
                        <ViralVideoCard
                          key={video.id}
                          video={video}
                          isPinned={!!pinnedVideo}
                          onAnalyze={() => {
                            markViralAsReadMutation.mutate(video.id);
                            handleAnalyzeVideo(video.video_url, {
                              title: video.title || undefined,
                              thumbnail: video.thumbnail_url || undefined,
                              views: video.views,
                              likes: video.likes,
                              comments: video.comments,
                              channel: video.channel_name || undefined,
                              publishedAt: video.published_at || undefined,
                            });
                          }}
                          onPin={() => pinViralVideoMutation.mutate(video)}
                          onUnpin={pinnedVideo ? () => unpinVideoMutation.mutate(pinnedVideo.id) : undefined}
                          onDelete={() => deleteViralMutation.mutate(video.id)}
                          onMarkRead={() => markViralAsReadMutation.mutate(video.id)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Flame className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Nenhum vídeo viral detectado ainda</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Configure o monitoramento de nichos acima para detectar vídeos viralizando
                    </p>
                  </div>
                )}
              </TabsContent>

              {/* Dynamic Niche Tabs Content */}
              {userNiches.map((niche) => {
                const nicheVideos = (
                  viralVideos?.filter((v) => v.niche?.toLowerCase() === niche.toLowerCase()) ?? []
                ).slice(0, 6);
                
                return (
                  <TabsContent key={niche} value={`niche-${niche}`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Vídeos viralizando no nicho <span className="font-medium text-primary capitalize">{niche}</span>
                        </p>
                      </div>
                    </div>

                    {nicheVideos.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {nicheVideos.map((video) => {
                          const pinnedVideo = pinnedVideos?.find((p) => p.video_id === video.video_id);
                          return (
                            <ViralVideoCard
                              key={video.id}
                              video={video}
                              isPinned={!!pinnedVideo}
                              onAnalyze={() => {
                                markViralAsReadMutation.mutate(video.id);
                                handleAnalyzeVideo(video.video_url, {
                                  title: video.title || undefined,
                                  thumbnail: video.thumbnail_url || undefined,
                                  views: video.views,
                                  likes: video.likes,
                                  comments: video.comments,
                                  channel: video.channel_name || undefined,
                                  publishedAt: video.published_at || undefined,
                                });
                              }}
                              onPin={() => pinViralVideoMutation.mutate(video)}
                              onUnpin={pinnedVideo ? () => unpinVideoMutation.mutate(pinnedVideo.id) : undefined}
                              onDelete={() => deleteViralMutation.mutate(video.id)}
                              onMarkRead={() => markViralAsReadMutation.mutate(video.id)}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <TrendingUp className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">Nenhum vídeo viral detectado neste nicho</p>
                        <p className="text-sm text-muted-foreground mt-2">
                          O sistema irá detectar novos vídeos automaticamente
                        </p>
                      </div>
                    )}
                  </TabsContent>
                );
              })}

              {/* Pinned Videos Tab */}
              <TabsContent value="pinned">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Canal:</span>
                    <Select value={pinnedFilter} onValueChange={setPinnedFilter}>
                      <SelectTrigger className="w-[180px] bg-secondary border-border">
                        <SelectValue placeholder="Todos os Canais" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Canais</SelectItem>
                        <SelectItem value="viral">Vídeos Virais</SelectItem>
                        {channels?.map((channel) => (
                          <SelectItem key={channel.id} value={channel.id}>
                            {channel.channel_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {pinnedVideos && pinnedVideos.length > 0 ? (
                  <div className="space-y-6">
                    {pinnedFilter === "all" ? (
                      Object.entries(groupedPinnedVideos || {}).map(
                        ([channelId, { channelName, videos }]) => (
                          <div key={channelId}>
                            <div className="flex items-center gap-2 mb-4">
                              <Folder className="w-4 h-4 text-primary" />
                              <span className="font-medium text-foreground">
                                {channelName}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                ({videos.length} vídeos fixados)
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {videos.map((video) => (
                                <PinnedVideoCard
                                  key={video.id}
                                  video={video}
                                  onAnalyze={() => handleAnalyzeVideo(video.video_url)}
                                  onUnpin={() => unpinVideoMutation.mutate(video.id)}
                                />
                              ))}
                            </div>
                          </div>
                        )
                      )
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredPinnedVideos?.map((video) => (
                          <PinnedVideoCard
                            key={video.id}
                            video={video}
                            onAnalyze={() => handleAnalyzeVideo(video.video_url)}
                            onUnpin={() => unpinVideoMutation.mutate(video.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Pin className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-50" />
                    <p className="text-muted-foreground">Nenhum vídeo fixado ainda</p>
                    <p className="text-sm text-muted-foreground">
                      Busque vídeos de um canal e fixe até 3 por canal
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>

      {/* Videos Dialog */}
      <Dialog open={showVideosDialog} onOpenChange={setShowVideosDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vídeos do Canal</DialogTitle>
          </DialogHeader>

          {loadingVideos ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Recent Videos */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  🕐 Vídeos Recentes
                </h3>
                {recentVideos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recentVideos.map((video) => (
                      <VideoCard
                        key={video.videoId}
                        video={video}
                        channelId={selectedChannelId!}
                        isPinned={isVideoPinned(video.videoId)}
                        onPin={() =>
                          pinVideoMutation.mutate({
                            ...video,
                            channelId: selectedChannelId!,
                          })
                        }
                        onAnalyze={() => handleAnalyzeVideo(video.url)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Nenhum vídeo recente encontrado</p>
                )}
              </div>

              {/* Popular Videos */}
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  🔥 Vídeos Mais Vistos
                </h3>
                {popularVideos.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {popularVideos.map((video) => (
                      <VideoCard
                        key={video.videoId}
                        video={video}
                        channelId={selectedChannelId!}
                        isPinned={isVideoPinned(video.videoId)}
                        onPin={() =>
                          pinVideoMutation.mutate({
                            ...video,
                            channelId: selectedChannelId!,
                          })
                        }
                        onAnalyze={() => handleAnalyzeVideo(video.url)}
                      />
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">Nenhum vídeo popular encontrado</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Tutorial Modal */}
      <TutorialModal
        open={showTutorial}
        onOpenChange={(open) => !open && completeTutorial()}
        title={MONITORED_CHANNELS_TUTORIAL.title}
        description={MONITORED_CHANNELS_TUTORIAL.description}
        steps={MONITORED_CHANNELS_TUTORIAL.steps}
        onComplete={completeTutorial}
      />
      </PermissionGate>
    </MainLayout>
  );
};

// Video Card Component
interface VideoCardProps {
  video: ChannelVideo;
  channelId: string;
  isPinned: boolean;
  onPin: () => void;
  onAnalyze: () => void;
}

const VideoCard = ({ video, isPinned, onPin, onAnalyze }: VideoCardProps) => {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video">
        <img
          src={video.thumbnail}
          alt={video.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="w-12 h-12 text-white" />
        </div>
      </div>
      <div className="p-3">
        <h4 className="font-medium text-foreground text-sm line-clamp-2 mb-2">
          {video.title}
        </h4>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" /> {video.views}
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" /> {video.likes}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onAnalyze}
            size="sm"
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Analisar
          </Button>
          <Button
            onClick={onPin}
            size="sm"
            variant="outline"
            disabled={isPinned}
            className="px-3"
          >
            <Pin className={`w-4 h-4 ${isPinned ? "text-primary" : ""}`} />
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Pinned Video Card Component
interface PinnedVideoCardProps {
  video: PinnedVideo;
  onAnalyze: () => void;
  onUnpin: () => void;
}

const PinnedVideoCard = ({ video, onAnalyze, onUnpin }: PinnedVideoCardProps) => {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video">
        <img
          src={video.thumbnail_url}
          alt={video.title || "Vídeo"}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-3">
        <h4 className="font-medium text-foreground text-sm line-clamp-2 mb-2">
          {video.title}
        </h4>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" /> {video.views}
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" /> {video.likes}
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onAnalyze}
            size="sm"
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Analisar
          </Button>
          <Button
            onClick={onUnpin}
            size="sm"
            variant="outline"
            className="px-3 text-destructive hover:bg-destructive/10"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

// Viral Video Card Component
interface ViralVideoCardProps {
  video: ViralVideo;
  onAnalyze: () => void;
  onDelete: () => void;
  onMarkRead: () => void;
  onPin: () => void;
  onUnpin?: () => void;
  isPinned: boolean;
}

const formatViralScore = (score: number) => {
  if (score >= 100000) return `${(score / 1000).toFixed(0)}K/h`;
  if (score >= 1000) return `${(score / 1000).toFixed(1)}K/h`;
  return `${score}/h`;
};

const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
};

const getTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffDays > 0) return `${diffDays}d atrás`;
  if (diffHours > 0) return `${diffHours}h atrás`;
  return "Agora";
};

const getVideoDaysOld = (dateString: string | null): number | null => {
  if (!dateString) return null;
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
};

const ViralVideoCard = ({ video, onAnalyze, onDelete, onMarkRead, onPin, onUnpin, isPinned }: ViralVideoCardProps) => {
  const videoDays = getVideoDaysOld(video.published_at);
  
  const handlePinToggle = () => {
    if (isPinned && onUnpin) {
      onUnpin();
    } else {
      onPin();
    }
  };
  
  return (
    <Card className={`overflow-hidden relative ${!video.is_read ? 'ring-2 ring-primary/50' : ''} ${isPinned ? 'ring-2 ring-yellow-500/50' : ''}`}>
      {!video.is_read && (
        <div className="absolute top-2 left-2 z-10">
          <Badge variant="destructive" className="flex items-center gap-1">
            <Flame className="w-3 h-3" />
            Novo
          </Badge>
        </div>
      )}
      {isPinned && (
        <div className="absolute top-2 left-2 z-10">
          <Badge className="bg-yellow-500 text-black flex items-center gap-1">
            <Pin className="w-3 h-3" />
            Fixado
          </Badge>
        </div>
      )}
      <div className="absolute top-2 right-2 z-10">
        <Badge className="bg-primary/90 text-primary-foreground flex items-center gap-1">
          <TrendingUp className="w-3 h-3" />
          {formatViralScore(video.viral_score)}
        </Badge>
      </div>
      <div className="relative aspect-video">
        {video.thumbnail_url ? (
          <img
            src={video.thumbnail_url}
            alt={video.title || "Vídeo viral"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-secondary flex items-center justify-center">
            <Play className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        <a
          href={video.video_url}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center"
        >
          <ExternalLink className="w-8 h-8 text-white" />
        </a>
      </div>
      <div className="p-3">
        <h4 className="font-medium text-foreground text-sm line-clamp-2 mb-1">
          {video.title || "Vídeo sem título"}
        </h4>
        {video.channel_name && (
          <p className="text-xs text-muted-foreground mb-2 truncate">
            {video.channel_name}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" /> {formatNumber(video.views)}
          </span>
          <span className="flex items-center gap-1">
            <ThumbsUp className="w-3 h-3" /> {formatNumber(video.likes)}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="w-3 h-3" /> {formatNumber(video.comments)}
          </span>
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
          {videoDays !== null && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {videoDays === 0 ? "Hoje" : videoDays === 1 ? "1 dia" : `${videoDays} dias`}
            </span>
          )}
          <span>Detectado {getTimeAgo(video.detected_at)}</span>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={onAnalyze}
            size="sm"
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Analisar
          </Button>
          <Button
            onClick={handlePinToggle}
            size="sm"
            variant={isPinned ? "default" : "outline"}
            className={`px-3 ${isPinned ? "bg-yellow-500 hover:bg-yellow-600 text-black" : ""}`}
            title={isPinned ? "Desfixar vídeo" : "Fixar vídeo"}
          >
            <Pin className="w-4 h-4" />
          </Button>
          <Button
            onClick={onDelete}
            size="sm"
            variant="outline"
            className="px-3 text-destructive hover:bg-destructive/10"
            title="Remover"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default MonitoredChannels;
