import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Video, 
  Edit2, 
  Trash2, 
  Lightbulb,
  Film,
  Scissors,
  CheckCircle,
  Upload,
  AlertCircle,
  Youtube,
  TrendingUp,
  Loader2,
  BarChart3,
  Rocket,
  RefreshCw,
  Bell,
  BellOff
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { usePushNotifications } from "@/hooks/usePushNotifications";

type VideoStatus = 'planned' | 'recording' | 'editing' | 'ready' | 'published';
type VideoPriority = 'low' | 'normal' | 'high';

interface ScheduledVideo {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  scheduled_date: string;
  scheduled_time: string | null;
  status: VideoStatus;
  niche: string | null;
  video_url: string | null;
  notes: string | null;
  priority: VideoPriority;
  reminder_enabled: boolean;
  reminder_hours: number;
  reminder_sent: boolean;
}

interface NicheBestTime {
  niche: string;
  best_days: string[];
  best_hours: string[];
  reasoning: string | null;
}

interface PostingTimeAnalysis {
  bestDays: { day: string; avgViews: number; videoCount: number }[];
  bestHours: { hour: string; avgViews: number; videoCount: number }[];
  bestDayHourCombos: { day: string; hour: string; avgViews: number }[];
  insights: string[];
  country?: string;
  niche?: string;
  channelName?: string;
  totalVideosAnalyzed: number;
}

const statusConfig = {
  planned: { label: 'Planejado', icon: Calendar, color: 'bg-muted text-muted-foreground' },
  recording: { label: 'Gravando', icon: Film, color: 'bg-blue-500/20 text-blue-400' },
  editing: { label: 'Editando', icon: Scissors, color: 'bg-yellow-500/20 text-yellow-400' },
  ready: { label: 'Pronto', icon: CheckCircle, color: 'bg-green-500/20 text-green-400' },
  published: { label: 'Publicado', icon: Upload, color: 'bg-primary/20 text-primary' },
};

const priorityConfig = {
  low: { label: 'Baixa', color: 'bg-muted text-muted-foreground' },
  normal: { label: 'Normal', color: 'bg-blue-500/20 text-blue-400' },
  high: { label: 'Alta', color: 'bg-red-500/20 text-red-400' },
};

const dayNames: Record<string, string> = {
  monday: 'Segunda',
  tuesday: 'Terça',
  wednesday: 'Quarta',
  thursday: 'Quinta',
  friday: 'Sexta',
  saturday: 'Sábado',
  sunday: 'Domingo',
};

export default function PublicationSchedule() {
  const { session } = useAuth();
  const { toast } = useToast();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [scheduledVideos, setScheduledVideos] = useState<ScheduledVideo[]>([]);
  const [nicheBestTimes, setNicheBestTimes] = useState<NicheBestTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<ScheduledVideo | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingChannelAnalysis, setIsLoadingChannelAnalysis] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    scheduled_date: string;
    scheduled_time: string;
    status: VideoStatus;
    niche: string;
    notes: string;
    priority: VideoPriority;
    reminder_enabled: boolean;
    reminder_hours: number;
  }>({
    title: '',
    description: '',
    scheduled_date: '',
    scheduled_time: '',
    status: 'planned',
    niche: '',
    notes: '',
    priority: 'normal',
    reminder_enabled: true,
    reminder_hours: 2,
  });

  // Push notifications hook
  const { permission, isSupported, requestPermission, showNotification } = usePushNotifications();

  // Check YouTube connection
  const { data: youtubeConnection } = useQuery({
    queryKey: ['youtube-connection', session?.user?.id],
    queryFn: async () => {
      if (!session?.user?.id) return null;
      const { data, error } = await supabase
        .from('youtube_connections')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!session?.user?.id,
  });

  // Fetch personalized posting time analysis from YouTube channel
  const { data: postingAnalysis, refetch: refetchAnalysis, isFetching: isFetchingAnalysis } = useQuery({
    queryKey: ['posting-time-analysis', session?.user?.id],
    queryFn: async (): Promise<PostingTimeAnalysis | null> => {
      if (!session?.user?.id) return null;
      
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.access_token) return null;

      const response = await supabase.functions.invoke('analyze-posting-times', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (response.error || response.data?.error) {
        console.log('No YouTube analysis available:', response.data?.error || response.error);
        return null;
      }

      return response.data as PostingTimeAnalysis;
    },
    enabled: !!session?.user?.id && !!youtubeConnection,
    staleTime: 1000 * 60 * 30, // 30 minutes
    retry: false,
  });

  const handleRefreshAnalysis = async () => {
    setIsLoadingChannelAnalysis(true);
    await refetchAnalysis();
    setIsLoadingChannelAnalysis(false);
    toast({ title: "Análise atualizada!", description: "Dados do seu canal foram reanalisados." });
  };

  // Check for upcoming reminders periodically
  useEffect(() => {
    if (!session?.user?.id) return;
    
    const checkReminders = async () => {
      const now = new Date();
      const today = format(now, 'yyyy-MM-dd');
      
      // Find videos scheduled for today that need local notification
      for (const video of scheduledVideos) {
        if (
          video.scheduled_date === today &&
          video.scheduled_time &&
          video.reminder_enabled &&
          !video.reminder_sent &&
          permission === 'granted'
        ) {
          const scheduledDateTime = new Date(`${video.scheduled_date}T${video.scheduled_time}`);
          const reminderTime = new Date(scheduledDateTime.getTime() - (video.reminder_hours || 2) * 60 * 60 * 1000);
          
          if (now >= reminderTime && now < scheduledDateTime) {
            const hoursLeft = Math.round((scheduledDateTime.getTime() - now.getTime()) / (1000 * 60 * 60));
            showNotification(`⏰ Lembrete: ${video.title}`, {
              body: `Faltam ${hoursLeft > 0 ? hoursLeft + 'h' : 'menos de 1h'} para publicar este vídeo!`,
              tag: `schedule-${video.id}`,
              requireInteraction: true,
            });
          }
        }
      }
    };

    // Check on load and every 5 minutes
    checkReminders();
    const interval = setInterval(checkReminders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [scheduledVideos, session?.user?.id, permission, showNotification]);

  useEffect(() => {
    if (session?.user?.id) {
      fetchScheduledVideos();
      fetchNicheBestTimes();
    }
  }, [session?.user?.id, currentMonth]);

  const fetchScheduledVideos = async () => {
    if (!session?.user?.id) return;
    
    const startDate = format(startOfMonth(currentMonth), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(currentMonth), 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from('publication_schedule')
      .select('*')
      .eq('user_id', session.user.id)
      .gte('scheduled_date', startDate)
      .lte('scheduled_date', endDate)
      .order('scheduled_date', { ascending: true });

    if (error) {
      console.error('Error fetching schedule:', error);
    } else {
      setScheduledVideos((data || []) as ScheduledVideo[]);
    }
    setLoading(false);
  };

  const fetchNicheBestTimes = async () => {
    const { data, error } = await supabase
      .from('niche_best_times')
      .select('*');

    if (!error && data) {
      setNicheBestTimes(data);
    }
  };

  // Create production tasks in Kanban for a scheduled video
  const createKanbanTasks = async (scheduleId: string, videoTitle: string) => {
    if (!session?.user?.id) return;

    const taskTemplates = [
      { title: `📝 Roteiro - ${videoTitle}`, task_type: 'script' },
      { title: `🎬 Gravação - ${videoTitle}`, task_type: 'video' },
      { title: `✂️ Edição - ${videoTitle}`, task_type: 'video' },
      { title: `🖼️ Thumbnail - ${videoTitle}`, task_type: 'thumbnail' },
    ];

    const tasksToInsert = taskTemplates.map((t, index) => ({
      user_id: session.user.id,
      title: t.title,
      task_type: t.task_type,
      column_id: 'backlog',
      task_order: index,
      schedule_id: scheduleId,
    }));

    const { error } = await supabase
      .from('production_board_tasks')
      .insert(tasksToInsert);

    if (error) {
      console.error('Error creating Kanban tasks:', error);
    }
  };

  const handleSaveVideo = async () => {
    if (!session?.user?.id || !formData.title || !formData.scheduled_date) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o título e a data",
        variant: "destructive",
      });
      return;
    }

    const videoData = {
      user_id: session.user.id,
      title: formData.title,
      description: formData.description || null,
      scheduled_date: formData.scheduled_date,
      scheduled_time: formData.scheduled_time || null,
      status: formData.status,
      niche: formData.niche || null,
      notes: formData.notes || null,
      priority: formData.priority,
      reminder_enabled: formData.reminder_enabled,
      reminder_hours: formData.reminder_hours,
      reminder_sent: false,
    };

    if (editingVideo) {
      const { error } = await supabase
        .from('publication_schedule')
        .update(videoData)
        .eq('id', editingVideo.id);

      if (error) {
        toast({ title: "Erro ao atualizar", variant: "destructive" });
      } else {
        toast({ title: "Vídeo atualizado!" });
      }
    } else {
      // Insert new video and create Kanban tasks
      const { data: newVideo, error } = await supabase
        .from('publication_schedule')
        .insert(videoData)
        .select('id')
        .single();

      if (error) {
        toast({ title: "Erro ao salvar", variant: "destructive" });
      } else {
        // Create Kanban tasks for this video
        await createKanbanTasks(newVideo.id, formData.title);
        toast({ 
          title: "Vídeo agendado!", 
          description: "Tarefas criadas no Quadro de Produção 📋" 
        });
      }
    }

    resetForm();
    fetchScheduledVideos();
  };

  const handleDeleteVideo = async (id: string) => {
    const { error } = await supabase
      .from('publication_schedule')
      .delete()
      .eq('id', id);

    if (error) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    } else {
      toast({ title: "Vídeo removido" });
      fetchScheduledVideos();
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: ScheduledVideo['status']) => {
    const { error } = await supabase
      .from('publication_schedule')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
      fetchScheduledVideos();
      toast({ title: `Status atualizado para ${statusConfig[newStatus].label}` });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      scheduled_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
      scheduled_time: '',
      status: 'planned',
      niche: '',
      notes: '',
      priority: 'normal',
      reminder_enabled: true,
      reminder_hours: 2,
    });
    setEditingVideo(null);
    setIsDialogOpen(false);
  };

  const openEditDialog = (video: ScheduledVideo) => {
    setEditingVideo(video);
    setFormData({
      title: video.title,
      description: video.description || '',
      scheduled_date: video.scheduled_date,
      scheduled_time: video.scheduled_time || '',
      status: video.status,
      niche: video.niche || '',
      notes: video.notes || '',
      priority: video.priority,
      reminder_enabled: video.reminder_enabled ?? true,
      reminder_hours: video.reminder_hours ?? 2,
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = (date?: Date) => {
    setEditingVideo(null);
    setFormData({
      title: '',
      description: '',
      scheduled_date: date ? format(date, 'yyyy-MM-dd') : '',
      scheduled_time: '',
      status: 'planned',
      niche: '',
      notes: '',
      priority: 'normal',
      reminder_enabled: true,
      reminder_hours: 2,
    });
    setIsDialogOpen(true);
  };

  const getVideosForDate = (date: Date) => {
    return scheduledVideos.filter(video => 
      isSameDay(parseISO(video.scheduled_date), date)
    );
  };

  const getSuggestionForNiche = (niche: string) => {
    return nicheBestTimes.find(n => n.niche.toLowerCase() === niche.toLowerCase());
  };

  // Calendar generation
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Add padding days for week alignment
  const startPadding = monthStart.getDay();
  const paddedDays = Array(startPadding).fill(null).concat(calendarDays);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
              <Calendar className="h-7 w-7 text-primary" />
              Agenda de Publicação
            </h1>
            <p className="text-muted-foreground mt-1">
              Planeje e organize seus vídeos
            </p>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSuggestions(!showSuggestions)}
            >
              <Lightbulb className="h-4 w-4 mr-2" />
              Dicas de Horário
            </Button>
            <Button onClick={() => openNewDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Vídeo
            </Button>
          </div>
        </div>

        {/* Personalized Channel Analysis Panel */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 space-y-4"
            >
              {/* YouTube Channel Based Suggestions */}
              {youtubeConnection ? (
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Youtube className="h-5 w-5 text-red-500" />
                        Análise do Seu Canal
                        {postingAnalysis && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {postingAnalysis.totalVideosAnalyzed} vídeos analisados
                          </Badge>
                        )}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleRefreshAnalysis}
                        disabled={isFetchingAnalysis || isLoadingChannelAnalysis}
                      >
                        {isFetchingAnalysis || isLoadingChannelAnalysis ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <RefreshCw className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    {postingAnalysis?.channelName && (
                      <p className="text-sm text-muted-foreground">
                        Baseado nos dados reais do canal <strong>{postingAnalysis.channelName}</strong>
                        {postingAnalysis.country && ` (${postingAnalysis.country})`}
                      </p>
                    )}
                  </CardHeader>
                  <CardContent>
                    {isFetchingAnalysis && !postingAnalysis ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
                          <p className="text-sm text-muted-foreground">Analisando histórico do canal...</p>
                        </div>
                      </div>
                    ) : postingAnalysis ? (
                      <div className="space-y-6">
                        {/* Insights */}
                        {postingAnalysis.insights.length > 0 && (
                          <div className="space-y-2">
                            <h4 className="font-medium flex items-center gap-2 text-sm">
                              <Rocket className="h-4 w-4 text-yellow-500" />
                              Insights Personalizados
                            </h4>
                            <div className="space-y-2">
                              {postingAnalysis.insights.map((insight, index) => (
                                <div key={index} className="p-3 rounded-lg bg-background/50 border text-sm">
                                  {insight}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {/* Best Days */}
                          <div className="p-4 rounded-lg bg-background/50 border">
                            <h4 className="font-medium flex items-center gap-2 mb-3 text-sm">
                              <Calendar className="h-4 w-4 text-primary" />
                              Melhores Dias
                            </h4>
                            <div className="space-y-2">
                              {postingAnalysis.bestDays.slice(0, 3).map((day, index) => {
                                const maxViews = postingAnalysis.bestDays[0]?.avgViews || 1;
                                const percentage = (day.avgViews / maxViews) * 100;
                                return (
                                  <div key={day.day} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="flex items-center gap-2">
                                        {index === 0 && <TrendingUp className="h-3 w-3 text-green-500" />}
                                        {dayNames[day.day] || day.day}
                                      </span>
                                      <span className="text-muted-foreground">
                                        {day.avgViews.toLocaleString('pt-BR')} views
                                      </span>
                                    </div>
                                    <Progress value={percentage} className="h-2" />
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Best Hours */}
                          <div className="p-4 rounded-lg bg-background/50 border">
                            <h4 className="font-medium flex items-center gap-2 mb-3 text-sm">
                              <Clock className="h-4 w-4 text-primary" />
                              Melhores Horários
                            </h4>
                            <div className="space-y-2">
                              {postingAnalysis.bestHours.slice(0, 4).map((hour, index) => {
                                const maxViews = postingAnalysis.bestHours[0]?.avgViews || 1;
                                const percentage = (hour.avgViews / maxViews) * 100;
                                return (
                                  <div key={hour.hour} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="flex items-center gap-2">
                                        {index === 0 && <TrendingUp className="h-3 w-3 text-green-500" />}
                                        {hour.hour}
                                      </span>
                                      <span className="text-muted-foreground">
                                        {hour.avgViews.toLocaleString('pt-BR')} views
                                      </span>
                                    </div>
                                    <Progress value={percentage} className="h-2" />
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Best Combos */}
                          {postingAnalysis.bestDayHourCombos.length > 0 && (
                            <div className="p-4 rounded-lg bg-background/50 border">
                              <h4 className="font-medium flex items-center gap-2 mb-3 text-sm">
                                <BarChart3 className="h-4 w-4 text-primary" />
                                Combinações de Ouro
                              </h4>
                              <div className="space-y-2">
                                {postingAnalysis.bestDayHourCombos.slice(0, 3).map((combo, index) => (
                                  <div
                                    key={`${combo.day}-${combo.hour}`}
                                    className={`flex items-center justify-between p-2 rounded text-sm ${
                                      index === 0 ? 'bg-primary/10 border border-primary/20' : ''
                                    }`}
                                  >
                                    <span className="font-medium">
                                      {dayNames[combo.day]} às {combo.hour}
                                    </span>
                                    <Badge variant={index === 0 ? 'default' : 'secondary'}>
                                      {combo.avgViews.toLocaleString('pt-BR')} views
                                    </Badge>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted-foreground">
                        <BarChart3 className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>Clique no botão de atualizar para analisar seu canal</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-yellow-500/20 bg-yellow-500/5">
                  <CardContent className="py-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full bg-yellow-500/10">
                        <Youtube className="h-6 w-6 text-yellow-500" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium">Conecte seu canal para sugestões personalizadas</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Ao conectar seu canal do YouTube, analisaremos seus vídeos para descobrir 
                          os melhores dias e horários de postagem baseados no seu histórico real.
                        </p>
                      </div>
                      <Button variant="outline" asChild>
                        <a href="/youtube">Conectar YouTube</a>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Generic Niche Suggestions (fallback) */}
              {(!youtubeConnection || !postingAnalysis) && nicheBestTimes.length > 0 && (
                <Card className="border-border">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-primary" />
                      Horários Gerais por Nicho
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {nicheBestTimes.map((niche) => (
                        <div key={niche.niche} className="p-3 rounded-lg bg-background/50 border">
                          <h4 className="font-semibold capitalize mb-2">{niche.niche}</h4>
                          <div className="text-sm text-muted-foreground space-y-1">
                            <p><strong>Dias:</strong> {niche.best_days.map(d => dayNames[d] || d).join(', ')}</p>
                            <p><strong>Horários:</strong> {niche.best_hours.join(', ')}</p>
                            {niche.reasoning && (
                              <p className="text-xs italic mt-2">{niche.reasoning}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Calendar Navigation */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <h2 className="text-xl font-semibold capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Week Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {paddedDays.map((day, index) => {
                if (!day) {
                  return <div key={`empty-${index}`} className="min-h-[100px]" />;
                }

                const dayVideos = getVideosForDate(day);
                const isCurrentDay = isToday(day);
                const isSelected = selectedDate && isSameDay(day, selectedDate);

                return (
                  <motion.div
                    key={day.toISOString()}
                    className={`
                      min-h-[100px] p-2 rounded-lg border cursor-pointer transition-all
                      ${isCurrentDay ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                      ${isSelected ? 'ring-2 ring-primary' : ''}
                    `}
                    onClick={() => setSelectedDate(day)}
                    onDoubleClick={() => openNewDialog(day)}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className={`text-sm font-medium ${isCurrentDay ? 'text-primary' : ''}`}>
                        {format(day, 'd')}
                      </span>
                      {dayVideos.length > 0 && (
                        <Badge variant="secondary" className="text-xs px-1.5">
                          {dayVideos.length}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      {dayVideos.slice(0, 2).map((video) => {
                        const StatusIcon = statusConfig[video.status].icon;
                        return (
                          <div
                            key={video.id}
                            className={`text-xs p-1 rounded truncate flex items-center gap-1 ${statusConfig[video.status].color}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditDialog(video);
                            }}
                          >
                            <StatusIcon className="h-3 w-3 flex-shrink-0" />
                            <span className="truncate">{video.title}</span>
                          </div>
                        );
                      })}
                      {dayVideos.length > 2 && (
                        <div className="text-xs text-muted-foreground">
                          +{dayVideos.length - 2} mais
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Selected Day Details */}
        {selectedDate && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {format(selectedDate, "EEEE, d 'de' MMMM", { locale: ptBR })}
                </CardTitle>
                <Button size="sm" onClick={() => openNewDialog(selectedDate)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Adicionar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {getVideosForDate(selectedDate).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum vídeo agendado para este dia</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => openNewDialog(selectedDate)}
                  >
                    Agendar Vídeo
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {getVideosForDate(selectedDate).map((video) => {
                    const StatusIcon = statusConfig[video.status].icon;
                    const suggestion = video.niche ? getSuggestionForNiche(video.niche) : null;
                    
                    return (
                      <motion.div
                        key={video.id}
                        className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold truncate">{video.title}</h4>
                              <Badge className={priorityConfig[video.priority].color}>
                                {priorityConfig[video.priority].label}
                              </Badge>
                            </div>
                            
                            {video.description && (
                              <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                                {video.description}
                              </p>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-3 text-sm">
                              <Badge className={statusConfig[video.status].color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig[video.status].label}
                              </Badge>
                              
                              {video.scheduled_time && (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  {video.scheduled_time}
                                </span>
                              )}
                              
                              {video.niche && (
                                <Badge variant="outline" className="capitalize">
                                  {video.niche}
                                </Badge>
                              )}

                              {video.reminder_enabled && video.scheduled_time && (
                                <span className="flex items-center gap-1 text-muted-foreground" title={`Lembrete ${video.reminder_hours}h antes`}>
                                  <Bell className="h-3 w-3 text-primary" />
                                  <span className="text-xs">{video.reminder_hours}h</span>
                                </span>
                              )}
                            </div>

                            {suggestion && video.scheduled_time && (
                              <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                                <AlertCircle className="h-3 w-3" />
                                Melhor horário para {video.niche}: {suggestion.best_hours.join(' ou ')}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Select
                              value={video.status}
                              onValueChange={(value) => handleUpdateStatus(video.id, value as ScheduledVideo['status'])}
                            >
                              <SelectTrigger className="w-[130px] h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(statusConfig).map(([key, config]) => (
                                  <SelectItem key={key} value={key}>
                                    <div className="flex items-center gap-2">
                                      <config.icon className="h-3 w-3" />
                                      {config.label}
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(video)}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteVideo(video.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {editingVideo ? 'Editar Vídeo' : 'Agendar Novo Vídeo'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Título do vídeo"
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição breve do conteúdo"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="scheduled_date">Data *</Label>
                  <Input
                    id="scheduled_date"
                    type="date"
                    value={formData.scheduled_date}
                    onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="scheduled_time">Horário</Label>
                  <Input
                    id="scheduled_time"
                    type="time"
                    value={formData.scheduled_time}
                    onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="niche">Nicho</Label>
                  <div className="relative">
                    <Input
                      id="niche"
                      value={formData.niche}
                      onChange={(e) => setFormData({ ...formData, niche: e.target.value })}
                      placeholder="Digite ou selecione"
                      list="niche-options"
                    />
                    <datalist id="niche-options">
                      {nicheBestTimes.map((n) => (
                        <option key={n.niche} value={n.niche} />
                      ))}
                    </datalist>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="priority">Prioridade</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          {config.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <config.icon className="h-4 w-4" />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="notes">Anotações</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Notas, links, referências..."
                  rows={2}
                />
              </div>

              {/* Reminder Settings */}
              <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {formData.reminder_enabled ? (
                      <Bell className="h-4 w-4 text-primary" />
                    ) : (
                      <BellOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <div>
                      <Label htmlFor="reminder_enabled" className="cursor-pointer">
                        Lembrete de Publicação
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Receba uma notificação antes do horário
                      </p>
                    </div>
                  </div>
                  <Switch
                    id="reminder_enabled"
                    checked={formData.reminder_enabled}
                    onCheckedChange={(checked) => setFormData({ ...formData, reminder_enabled: checked })}
                  />
                </div>

                {formData.reminder_enabled && (
                  <div className="flex items-center gap-3">
                    <Label htmlFor="reminder_hours" className="text-sm whitespace-nowrap">
                      Lembrar
                    </Label>
                    <Select
                      value={formData.reminder_hours.toString()}
                      onValueChange={(value) => setFormData({ ...formData, reminder_hours: parseInt(value) })}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 hora</SelectItem>
                        <SelectItem value="2">2 horas</SelectItem>
                        <SelectItem value="3">3 horas</SelectItem>
                        <SelectItem value="6">6 horas</SelectItem>
                        <SelectItem value="12">12 horas</SelectItem>
                        <SelectItem value="24">1 dia</SelectItem>
                      </SelectContent>
                    </Select>
                    <span className="text-sm text-muted-foreground">antes</span>
                  </div>
                )}

                {formData.reminder_enabled && permission !== 'granted' && isSupported && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={requestPermission}
                    className="w-full"
                  >
                    <Bell className="h-4 w-4 mr-2" />
                    Ativar Notificações do Navegador
                  </Button>
                )}
              </div>
              
              {/* Suggestion based on niche */}
              {formData.niche && getSuggestionForNiche(formData.niche) && (
                <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                  <div className="flex items-center gap-2 text-sm">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <span className="font-medium">Sugestão para {formData.niche}:</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Melhores horários: {getSuggestionForNiche(formData.niche)?.best_hours.join(', ')}
                  </p>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={resetForm}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveVideo}>
                  {editingVideo ? 'Salvar' : 'Agendar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
