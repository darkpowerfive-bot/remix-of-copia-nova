import { useState, useEffect, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Youtube, CheckCircle, Upload, BarChart3, Settings, Loader2, LogOut, ExternalLink, AlertTriangle, X, FileVideo, Globe, Lock, Users, RefreshCw, TrendingUp, Eye, ThumbsUp, MessageCircle, Video, Lightbulb, AlertCircle, Info, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const PRODUCTION_DOMAIN = "app.canaisdarks.com.br";
const isProductionDomain = () => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname === PRODUCTION_DOMAIN;
};

interface YouTubeConnection {
  id: string;
  channel_id: string;
  channel_name: string;
  channel_thumbnail: string;
  subscribers_count: number;
  connected_at: string;
  scopes?: string[];
}

interface AnalyticsTip {
  type: 'success' | 'warning' | 'info';
  title: string;
  message: string;
}

interface ChannelAnalytics {
  channel: {
    id: string;
    name: string;
    thumbnail: string;
  };
  statistics: {
    subscribers: number;
    totalViews: number;
    totalVideos: number;
  };
  recentMetrics: {
    analyzedVideos: number;
    totalViewsRecent: number;
    avgViewsPerVideo: number;
    avgLikesPerVideo: number;
    avgEngagementRate: number;
    videosThisWeek: number;
    videosThisMonth: number;
    daysSinceLastVideo: number | null;
  };
  topVideos: Array<{
    videoId: string;
    title: string;
    thumbnail: string;
    views: number;
    likes: number;
    engagementRate: string;
  }>;
  tips: AnalyticsTip[];
  lastUpdated: string;
}

type PrivacyStatus = 'public' | 'unlisted' | 'private';

interface UploadForm {
  title: string;
  description: string;
  tags: string;
  privacyStatus: PrivacyStatus;
  categoryId: string;
  madeForKids: boolean;
}

const YouTubeIntegration = () => {
  const { user } = useAuth();
  const [connection, setConnection] = useState<YouTubeConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  
  // Analytics state
  const [analytics, setAnalytics] = useState<ChannelAnalytics | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  
  // Upload state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [uploadForm, setUploadForm] = useState<UploadForm>({
    title: '',
    description: '',
    tags: '',
    privacyStatus: 'private',
    categoryId: '22',
    madeForKids: false
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Settings state
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [refreshingToken, setRefreshingToken] = useState(false);

  // Check for OAuth callback params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');
    const error = urlParams.get('error');

    if (error) {
      toast.error('Erro ao conectar: ' + error);
      window.history.replaceState({}, '', '/youtube');
      return;
    }

    if (code && state) {
      handleOAuthCallback(code, state);
    }
  }, []);

  // Fetch existing connection
  useEffect(() => {
    if (user) {
      fetchConnection();
    }
  }, [user]);

  // Fetch analytics when connection is established
  useEffect(() => {
    if (connection) {
      fetchAnalytics();
    }
  }, [connection]);

  const fetchConnection = async () => {
    try {
      const { data, error } = await supabase
        .from('youtube_connections')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      if (error) throw error;
      setConnection(data);
    } catch (error) {
      console.error('Error fetching connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const { data, error } = await supabase.functions.invoke('youtube-channel-analytics');
      
      if (error) throw error;
      
      if (data.error) {
        console.error('Analytics error:', data.error);
        return;
      }
      
      setAnalytics(data);
    } catch (error: any) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      const { data, error } = await supabase.functions.invoke('youtube-auth-url');
      
      if (error) throw error;
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        throw new Error('No auth URL returned');
      }
    } catch (error: any) {
      console.error('Error starting OAuth:', error);
      toast.error('Erro ao iniciar conexão: ' + error.message);
      setConnecting(false);
    }
  };

  const handleOAuthCallback = async (code: string, state: string) => {
    setConnecting(true);
    window.history.replaceState({}, '', '/youtube');
    
    try {
      const { data, error } = await supabase.functions.invoke('youtube-oauth-callback', {
        body: { code, state }
      });
      
      if (error) throw error;
      
      if (data.success) {
        toast.success('Canal conectado com sucesso!');
        fetchConnection();
      } else {
        throw new Error(data.error || 'Erro ao conectar');
      }
    } catch (error: any) {
      console.error('OAuth callback error:', error);
      toast.error('Erro ao finalizar conexão: ' + error.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Tem certeza que deseja desconectar seu canal do YouTube?')) return;
    
    setDisconnecting(true);
    try {
      const { error } = await supabase.functions.invoke('youtube-disconnect');
      
      if (error) throw error;
      
      setConnection(null);
      setAnalytics(null);
      toast.success('Canal desconectado com sucesso');
    } catch (error: any) {
      console.error('Error disconnecting:', error);
      toast.error('Erro ao desconectar: ' + error.message);
    } finally {
      setDisconnecting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const maxSize = 256 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('Arquivo muito grande. Máximo 256MB para upload direto.');
        return;
      }
      
      if (!file.type.startsWith('video/')) {
        toast.error('Por favor, selecione um arquivo de vídeo.');
        return;
      }
      
      setSelectedFile(file);
      if (!uploadForm.title) {
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
        setUploadForm(prev => ({ ...prev, title: nameWithoutExt }));
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !uploadForm.title) {
      toast.error('Selecione um arquivo e preencha o título');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const reader = new FileReader();
      const fileBase64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });

      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 5, 90));
      }, 500);

      const { data, error } = await supabase.functions.invoke('youtube-upload', {
        body: {
          title: uploadForm.title,
          description: uploadForm.description,
          tags: uploadForm.tags.split(',').map(t => t.trim()).filter(Boolean),
          privacyStatus: uploadForm.privacyStatus,
          categoryId: uploadForm.categoryId,
          madeForKids: uploadForm.madeForKids,
          fileBase64,
          fileName: selectedFile.name,
          mimeType: selectedFile.type
        }
      });

      clearInterval(progressInterval);

      if (error) throw error;

      setUploadProgress(100);
      toast.success('Vídeo enviado com sucesso!');
      
      setTimeout(() => {
        setUploadModalOpen(false);
        setSelectedFile(null);
        setUploadProgress(0);
        setUploadForm({
          title: '',
          description: '',
          tags: '',
          privacyStatus: 'private',
          categoryId: '22',
          madeForKids: false
        });
        fetchAnalytics();
      }, 1500);

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar vídeo: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleRefreshToken = async () => {
    setRefreshingToken(true);
    try {
      const { data, error } = await supabase.functions.invoke('youtube-refresh-token');
      
      if (error) throw error;
      
      toast.success('Token atualizado com sucesso!');
      fetchConnection();
    } catch (error: any) {
      console.error('Error refreshing token:', error);
      toast.error('Erro ao atualizar token: ' + error.message);
    } finally {
      setRefreshingToken(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString('pt-BR');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getTipIcon = (type: AnalyticsTip['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTipBg = (type: AnalyticsTip['type']) => {
    switch (type) {
      case 'success': return 'bg-green-500/10 border-green-500/20';
      case 'warning': return 'bg-amber-500/10 border-amber-500/20';
      case 'info': return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  const videoCategories = [
    { id: '1', name: 'Film & Animation' },
    { id: '2', name: 'Autos & Vehicles' },
    { id: '10', name: 'Music' },
    { id: '15', name: 'Pets & Animals' },
    { id: '17', name: 'Sports' },
    { id: '20', name: 'Gaming' },
    { id: '22', name: 'People & Blogs' },
    { id: '23', name: 'Comedy' },
    { id: '24', name: 'Entertainment' },
    { id: '25', name: 'News & Politics' },
    { id: '26', name: 'Howto & Style' },
    { id: '27', name: 'Education' },
    { id: '28', name: 'Science & Technology' },
  ];

  return (
    <MainLayout>
      <SEOHead
        title="Integração YouTube"
        description="Conecte seu canal do YouTube e gerencie uploads diretamente pela plataforma."
        noindex={true}
      />
      <PermissionGate permission="analytics_youtube" featureName="Analytics YouTube">
        <div className="flex-1 overflow-auto p-6 lg:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-foreground mb-2">Integração YouTube</h1>
              <p className="text-muted-foreground">
                Conecte seu canal e gerencie uploads diretamente
              </p>
            </div>

            {loading ? (
              <Card className="p-8 flex justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </Card>
            ) : !connection ? (
              <Card className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-4">
                  <Youtube className="w-8 h-8 text-destructive" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">Conecte seu Canal</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Conecte sua conta do YouTube para fazer uploads automáticos, agendar publicações e acompanhar métricas em tempo real.
                </p>
                
                {!isProductionDomain() ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-2 text-amber-500 mb-2">
                      <AlertTriangle className="w-5 h-5" />
                      <span className="text-sm font-medium">Ambiente de Preview Detectado</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      A conexão com o YouTube só funciona no domínio de produção para evitar erros de OAuth.
                    </p>
                    <Button 
                      onClick={() => window.open(`https://${PRODUCTION_DOMAIN}/youtube`, '_blank')}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir no Domínio de Produção
                    </Button>
                  </div>
                ) : (
                  <Button 
                    onClick={handleConnect}
                    disabled={connecting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {connecting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Youtube className="w-4 h-4 mr-2" />
                    )}
                    {connecting ? 'Conectando...' : 'Conectar com YouTube'}
                  </Button>
                )}
              </Card>
            ) : (
              <div className="space-y-6">
                {/* Channel Card */}
                <Card className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {connection.channel_thumbnail ? (
                        <img 
                          src={connection.channel_thumbnail} 
                          alt={connection.channel_name}
                          className="w-12 h-12 rounded-full"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-destructive/20 flex items-center justify-center">
                          <Youtube className="w-6 h-6 text-destructive" />
                        </div>
                      )}
                      <div>
                        <h3 className="font-semibold text-foreground">{connection.channel_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatNumber(connection.subscribers_count)} inscritos
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-green-500">Conectado</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={handleDisconnect}
                        disabled={disconnecting}
                      >
                        {disconnecting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <LogOut className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Analytics Summary */}
                {loadingAnalytics ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                      <Card key={i} className="p-4">
                        <Skeleton className="h-4 w-20 mb-2" />
                        <Skeleton className="h-8 w-24" />
                      </Card>
                    ))}
                  </div>
                ) : analytics ? (
                  <>
                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <Card className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Users className="w-4 h-4" />
                          <span className="text-xs">Inscritos</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                          {formatNumber(analytics.statistics.subscribers)}
                        </p>
                      </Card>
                      
                      <Card className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Eye className="w-4 h-4" />
                          <span className="text-xs">Views Totais</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                          {formatNumber(analytics.statistics.totalViews)}
                        </p>
                      </Card>
                      
                      <Card className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <Video className="w-4 h-4" />
                          <span className="text-xs">Vídeos</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                          {formatNumber(analytics.statistics.totalVideos)}
                        </p>
                      </Card>
                      
                      <Card className="p-4">
                        <div className="flex items-center gap-2 text-muted-foreground mb-1">
                          <TrendingUp className="w-4 h-4" />
                          <span className="text-xs">Engajamento</span>
                        </div>
                        <p className="text-2xl font-bold text-foreground">
                          {analytics.recentMetrics.avgEngagementRate.toFixed(1)}%
                        </p>
                      </Card>
                    </div>

                    {/* Recent Metrics */}
                    <Card className="p-5">
                      <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" />
                        Métricas Recentes
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Média de Views</p>
                          <p className="text-lg font-semibold text-foreground">
                            {formatNumber(analytics.recentMetrics.avgViewsPerVideo)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Média de Likes</p>
                          <p className="text-lg font-semibold text-foreground">
                            {formatNumber(analytics.recentMetrics.avgLikesPerVideo)}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Vídeos este mês</p>
                          <p className="text-lg font-semibold text-foreground">
                            {analytics.recentMetrics.videosThisMonth}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Último upload</p>
                          <p className="text-lg font-semibold text-foreground">
                            {analytics.recentMetrics.daysSinceLastVideo !== null 
                              ? analytics.recentMetrics.daysSinceLastVideo === 0 
                                ? 'Hoje' 
                                : `${analytics.recentMetrics.daysSinceLastVideo} dias`
                              : '-'}
                          </p>
                        </div>
                      </div>
                    </Card>

                    {/* Tips */}
                    {analytics.tips.length > 0 && (
                      <Card className="p-5">
                        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                          <Lightbulb className="w-5 h-5 text-primary" />
                          Dicas e Insights
                        </h3>
                        <div className="space-y-3">
                          {analytics.tips.map((tip, index) => (
                            <div 
                              key={index}
                              className={`p-4 rounded-lg border ${getTipBg(tip.type)}`}
                            >
                              <div className="flex items-start gap-3">
                                {getTipIcon(tip.type)}
                                <div>
                                  <p className="font-medium text-foreground">{tip.title}</p>
                                  <p className="text-sm text-muted-foreground mt-1">{tip.message}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>
                    )}

                    {/* Top Videos */}
                    {analytics.topVideos.length > 0 && (
                      <Card className="p-5">
                        <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                          <Play className="w-5 h-5 text-primary" />
                          Top Vídeos Recentes
                        </h3>
                        <div className="space-y-3">
                          {analytics.topVideos.slice(0, 5).map((video, index) => (
                            <a
                              key={video.videoId}
                              href={`https://youtube.com/watch?v=${video.videoId}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-4 p-3 rounded-lg hover:bg-secondary/50 transition-colors"
                            >
                              <span className="text-lg font-bold text-muted-foreground w-6">
                                #{index + 1}
                              </span>
                              {video.thumbnail && (
                                <img 
                                  src={video.thumbnail} 
                                  alt={video.title}
                                  className="w-24 h-14 object-cover rounded"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground truncate">
                                  {video.title}
                                </p>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                  <span className="flex items-center gap-1">
                                    <Eye className="w-3 h-3" />
                                    {formatNumber(video.views)}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <ThumbsUp className="w-3 h-3" />
                                    {formatNumber(video.likes)}
                                  </span>
                                  <span>{video.engagementRate}% eng.</span>
                                </div>
                              </div>
                              <ExternalLink className="w-4 h-4 text-muted-foreground" />
                            </a>
                          ))}
                        </div>
                      </Card>
                    )}
                  </>
                ) : null}

                {/* Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card 
                    className="p-5 hover:border-primary/50 transition-colors cursor-pointer group"
                    onClick={() => setUploadModalOpen(true)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                      <Upload className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">Upload de Vídeo</h3>
                    <p className="text-sm text-muted-foreground">Faça upload direto para seu canal</p>
                  </Card>
                  
                  <Card 
                    className="p-5 hover:border-primary/50 transition-colors cursor-pointer group"
                    onClick={() => window.open(`https://studio.youtube.com/channel/${connection.channel_id}`, '_blank')}
                  >
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                      <BarChart3 className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1 flex items-center gap-2">
                      YouTube Studio
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-sm text-muted-foreground">Analytics detalhado</p>
                  </Card>
                  
                  <Card 
                    className="p-5 hover:border-primary/50 transition-colors cursor-pointer group"
                    onClick={() => setSettingsModalOpen(true)}
                  >
                    <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
                      <Settings className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground mb-1">Configurações</h3>
                    <p className="text-sm text-muted-foreground">Gerencie a integração</p>
                  </Card>
                </div>

                {/* Refresh Analytics */}
                {analytics && (
                  <div className="flex justify-center">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={fetchAnalytics}
                      disabled={loadingAnalytics}
                    >
                      {loadingAnalytics ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Atualizar Analytics
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </PermissionGate>

      {/* Upload Modal */}
      <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload de Vídeo
            </DialogTitle>
            <DialogDescription>
              Envie um vídeo diretamente para seu canal do YouTube
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* File Selection */}
            <div className="space-y-2">
              <Label>Arquivo de Vídeo</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={handleFileSelect}
              />
              
              {!selectedFile ? (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                >
                  <FileVideo className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-1">
                    Clique para selecionar ou arraste um vídeo
                  </p>
                  <p className="text-xs text-muted-foreground/60">
                    MP4, MOV, AVI, WMV, MKV • Máximo 256MB
                  </p>
                </div>
              ) : (
                <div className="border border-border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileVideo className="w-8 h-8 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={uploadForm.title}
                onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Título do vídeo"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground text-right">{uploadForm.title.length}/100</p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={uploadForm.description}
                onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição do vídeo..."
                rows={4}
                maxLength={5000}
              />
              <p className="text-xs text-muted-foreground text-right">{uploadForm.description.length}/5000</p>
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                value={uploadForm.tags}
                onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                placeholder="tag1, tag2, tag3 (separadas por vírgula)"
              />
            </div>

            {/* Privacy & Category */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Visibilidade</Label>
                <Select 
                  value={uploadForm.privacyStatus} 
                  onValueChange={(value: PrivacyStatus) => setUploadForm(prev => ({ ...prev, privacyStatus: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">
                      <div className="flex items-center gap-2">
                        <Lock className="w-4 h-4" />
                        Privado
                      </div>
                    </SelectItem>
                    <SelectItem value="unlisted">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Não listado
                      </div>
                    </SelectItem>
                    <SelectItem value="public">
                      <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4" />
                        Público
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select 
                  value={uploadForm.categoryId} 
                  onValueChange={(value) => setUploadForm(prev => ({ ...prev, categoryId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {videoCategories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Made for Kids */}
            <div className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-foreground">Feito para crianças?</p>
                <p className="text-xs text-muted-foreground">Selecione se o conteúdo é destinado a crianças</p>
              </div>
              <Switch
                checked={uploadForm.madeForKids}
                onCheckedChange={(checked) => setUploadForm(prev => ({ ...prev, madeForKids: checked }))}
              />
            </div>

            {/* Upload Progress */}
            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Enviando...</span>
                  <span className="text-foreground font-medium">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setUploadModalOpen(false)} disabled={uploading}>
              Cancelar
            </Button>
            <Button 
              onClick={handleUpload} 
              disabled={!selectedFile || !uploadForm.title || uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar Vídeo
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Settings Modal */}
      <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Configurações da Integração
            </DialogTitle>
          </DialogHeader>

          {connection && (
            <div className="space-y-6 py-4">
              {/* Connection Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg">
                  {connection.channel_thumbnail && (
                    <img 
                      src={connection.channel_thumbnail} 
                      alt={connection.channel_name}
                      className="w-12 h-12 rounded-full"
                    />
                  )}
                  <div>
                    <p className="font-medium text-foreground">{connection.channel_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Conectado em {formatDate(connection.connected_at)}
                    </p>
                  </div>
                </div>

                {/* Scopes */}
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Permissões ativas</Label>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs bg-secondary px-2 py-1 rounded">Leitura</span>
                    <span className="text-xs bg-secondary px-2 py-1 rounded">Upload</span>
                    <span className="text-xs bg-secondary px-2 py-1 rounded">Analytics</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="space-y-3 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start"
                    onClick={handleRefreshToken}
                    disabled={refreshingToken}
                  >
                    {refreshingToken ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Atualizar Token de Acesso
                  </Button>

                  <Button 
                    variant="outline" 
                    className="w-full justify-start text-destructive hover:text-destructive"
                    onClick={() => {
                      setSettingsModalOpen(false);
                      handleDisconnect();
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Desconectar Canal
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};

export default YouTubeIntegration;
