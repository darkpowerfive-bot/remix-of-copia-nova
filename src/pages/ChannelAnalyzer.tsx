import { MainLayout } from "@/components/layout/MainLayout";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  Plus, 
  Loader2, 
  X, 
  BarChart3, 
  Lightbulb,
  Copy,
  Star,
  Rocket,
  Youtube,
  Target,
  Zap,
  Save,
  Check,
  History,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  Pencil,
  AlertTriangle,
  Coins
} from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { usePersistedState } from "@/hooks/usePersistedState";
import { SessionIndicator } from "@/components/ui/session-indicator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import { useCreditDeduction } from "@/hooks/useCreditDeduction";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ChannelToAnalyze {
  id: string;
  url: string;
  niche: string;
  subniche: string;
  isAnalyzed: boolean;
  channelName?: string;
  subscribers?: string;
  topVideos?: Array<{
    title: string;
    views: string;
    formula?: string;
  }>;
}

interface AnalysisResult {
  gapAnalysis: {
    gaps: string[];
    opportunities: string[];
  };
  optimizedTitles: Array<{
    title: string;
    formula: string;
    explanation: string;
    score: number;
  }>;
  channelIdeas: Array<{
    name: string;
    concept: string;
    niche: string;
    firstVideos: string[];
  }>;
  patternsMixed: string[];
}

const ChannelAnalyzer = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { deduct, checkBalance, getEstimatedCost, CREDIT_COSTS } = useCreditDeduction();
  
  // Persisted states
  const [channels, setChannels] = usePersistedState<ChannelToAnalyze[]>("channelAnalyzer_channels", []);
  const [analysisResult, setAnalysisResult] = usePersistedState<AnalysisResult | null>("channelAnalyzer_result", null);
  
  // Non-persisted states
  const [newChannelUrl, setNewChannelUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [analyzingChannel, setAnalyzingChannel] = useState<string | null>(null);
  const [generatingAnalysis, setGeneratingAnalysis] = useState(false);
  const [progress, setProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("gaps");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [savedAnalyses, setSavedAnalyses] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [insufficientCredits, setInsufficientCredits] = useState(false);

  // Verificar saldo
  useEffect(() => {
    const checkCredits = async () => {
      const cost = getEstimatedCost('analyze_channel');
      const { hasBalance } = await checkBalance(cost);
      setInsufficientCredits(!hasBalance);
    };
    if (user) checkCredits();
  }, [user, checkBalance, getEstimatedCost]);

  // Load saved analyses
  useEffect(() => {
    if (user?.id && showHistory) {
      loadSavedAnalyses();
    }
  }, [user?.id, showHistory]);

  const loadSavedAnalyses = async () => {
    if (!user?.id) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('channel_analyses' as any)
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedAnalyses(data || []);
    } catch (error) {
      console.error('Error loading analyses:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleDeleteAnalysis = async (id: string) => {
    setDeletingId(id);
    try {
      const { error } = await supabase
        .from('channel_analyses' as any)
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSavedAnalyses(prev => prev.filter(a => a.id !== id));
      toast.success("Análise excluída!");
    } catch (error) {
      console.error('Error deleting analysis:', error);
      toast.error('Erro ao excluir análise');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLoadAnalysis = (analysis: any) => {
    setChannels(analysis.channels || []);
    setAnalysisResult(analysis.analysis_result);
    setShowHistory(false);
    toast.success("Análise carregada!");
  };

  const handleStartEdit = (analysis: any) => {
    setEditingId(analysis.id);
    setEditName(analysis.name || '');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim()) {
      toast.error("Digite um nome para a análise");
      return;
    }

    try {
      const { error } = await supabase
        .from('channel_analyses' as any)
        .update({ name: editName.trim() })
        .eq('id', id);

      if (error) throw error;

      setSavedAnalyses(prev => 
        prev.map(a => a.id === id ? { ...a, name: editName.trim() } : a)
      );
      setEditingId(null);
      setEditName("");
      toast.success("Nome atualizado!");
    } catch (error) {
      console.error('Error updating name:', error);
      toast.error('Erro ao atualizar nome');
    }
  };

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const handleAddChannel = () => {
    if (!newChannelUrl.trim()) {
      toast.error("Cole a URL de um canal para adicionar");
      return;
    }

    if (channels.length >= 5) {
      toast.error("Limite máximo de 5 canais atingido");
      return;
    }

    // Check if URL is valid YouTube channel URL
    const isValidUrl = newChannelUrl.includes('youtube.com/') || newChannelUrl.includes('youtu.be/');
    if (!isValidUrl) {
      toast.error("URL inválida. Cole uma URL de canal do YouTube");
      return;
    }

    // Check if channel already added
    const exists = channels.some(ch => ch.url.toLowerCase() === newChannelUrl.toLowerCase());
    if (exists) {
      toast.error("Este canal já foi adicionado");
      return;
    }

    const newChannel: ChannelToAnalyze = {
      id: generateId(),
      url: newChannelUrl,
      niche: "",
      subniche: "",
      isAnalyzed: false
    };

    setChannels([...channels, newChannel]);
    setNewChannelUrl("");
    toast.success("Canal adicionado! Clique em 'Analisar' quando estiver pronto.");
  };

  const handleRemoveChannel = (id: string) => {
    setChannels(channels.filter(ch => ch.id !== id));
    toast.success("Canal removido");
  };

  const handleAnalyzeChannel = async (channel: ChannelToAnalyze) => {
    // Deduzir créditos antes
    const deductionResult = await deduct({
      operationType: 'analyze_channel',
      showToast: true
    });

    if (!deductionResult.success) {
      setInsufficientCredits(true);
      return;
    }

    setAnalyzingChannel(channel.id);
    try {
      const { data, error } = await supabase.functions.invoke('analyze-channel', {
        body: {
          channelUrl: channel.url,
          userId: user?.id
        }
      });

      if (error) throw error;

      // Check for error in response
      if (!data.success && data.error) {
        throw new Error(data.error);
      }

      // Extract analysis data
      const analysis = data.analysis || {};
      const channelInfo = analysis.channelInfo || {};
      const insights = analysis.insights || {};

      // Update the channel with analysis data
      setChannels(prev => prev.map(ch => {
        if (ch.id === channel.id) {
          return {
            ...ch,
            isAnalyzed: true,
            niche: channelInfo.niche || "Detectado",
            subniche: channelInfo.subniche || "Detectado",
            channelName: channelInfo.name || channel.url.split('/').pop() || 'Canal',
            subscribers: analysis.metrics?.subscribers 
              ? `${(analysis.metrics.subscribers / 1000).toFixed(0)}K`
              : undefined,
            topVideos: insights.exampleTitles?.map((title: string) => ({
              title,
              views: "N/A"
            })) || []
          };
        }
        return ch;
      }));

      setInsufficientCredits(false);
      toast.success(`Canal "${channelInfo.name || 'Canal'}" analisado com sucesso!`);
    } catch (error) {
      console.error('Error analyzing channel:', error);
      // Reembolsar em caso de erro
      if (deductionResult.shouldRefund) {
        await deductionResult.refund();
      }
      toast.error('Erro ao analisar canal. Verifique a URL.');
    } finally {
      setAnalyzingChannel(null);
    }
  };

  const handleGenerateFullAnalysis = async () => {
    const analyzedChannels = channels.filter(ch => ch.isAnalyzed);
    
    if (analyzedChannels.length < 2) {
      toast.error("Analise pelo menos 2 canais antes de gerar a análise completa");
      return;
    }

    // Deduzir créditos para análise completa
    const deductionResult = await deduct({
      operationType: 'analyze_multiple_channels',
      showToast: true
    });

    if (!deductionResult.success) {
      setInsufficientCredits(true);
      return;
    }

    setGeneratingAnalysis(true);
    setProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 500);

      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: 'analyze_multiple_channels',
          agentData: {
            channels: analyzedChannels.map(ch => ({
              name: ch.channelName,
              url: ch.url,
              niche: ch.niche,
              subniche: ch.subniche,
              subscribers: ch.subscribers,
              topVideos: ch.topVideos
            }))
          },
          userId: user?.id
        }
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (error) throw error;

      // Extract result from response
      const result = data?.result || data;
      setAnalysisResult(result);
      setInsufficientCredits(false);
      toast.success("Análise completa gerada com sucesso!");
    } catch (error) {
      console.error('Error generating analysis:', error);
      // Reembolsar em caso de erro
      if (deductionResult.shouldRefund) {
        await deductionResult.refund();
      }
      toast.error('Erro ao gerar análise. Tente novamente.');
    } finally {
      setGeneratingAnalysis(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado!");
  };

  const handleSaveToDatabase = async () => {
    if (!user?.id || !analysisResult) return;
    
    setSaving(true);
    try {
      const channelNames = channels
        .filter(ch => ch.isAnalyzed)
        .map(ch => ch.channelName || 'Canal')
        .join(', ');

      const { error } = await supabase
        .from('channel_analyses' as any)
        .insert({
          user_id: user.id,
          channels: channels.filter(ch => ch.isAnalyzed),
          analysis_result: analysisResult,
          name: `Análise: ${channelNames}`
        } as any);

      if (error) throw error;

      setSaved(true);
      toast.success("Análise salva com sucesso!");
      
      // Reset saved state after 3 seconds
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving analysis:', error);
      toast.error('Erro ao salvar análise');
    } finally {
      setSaving(false);
    }
  };

  const analyzedCount = channels.filter(ch => ch.isAnalyzed).length;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  const cardHoverVariants = {
    rest: { scale: 1, boxShadow: "0 0 0 rgba(245, 158, 11, 0)" },
    hover: { 
      scale: 1.02, 
      boxShadow: "0 0 30px rgba(245, 158, 11, 0.15)",
      transition: { duration: 0.3 }
    }
  };

  return (
    <>
      <SEOHead
        title="Análise de Canais"
        description="Analise canais virais do YouTube e identifique padrões de sucesso."
        noindex={true}
      />
      <MainLayout>
        <PermissionGate permission="analisador_canal" featureName="Analisador de Canal">
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Session Indicator */}
          <SessionIndicator 
            storageKeys={["channelAnalyzer_channels", "channelAnalyzer_result"]}
            label="Análise anterior"
            onClear={() => {
              setChannels([]);
              setAnalysisResult(null);
            }}
          />

          {/* Header */}
          <motion.div 
            className="mb-8 mt-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center border border-primary/30">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground via-foreground to-primary bg-clip-text">
                    Análise de Canais Virais
                  </h1>
                  <p className="text-muted-foreground text-sm">
                    Analise até 5 canais, identifique padrões virais e crie títulos baseados no que funcionou
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowHistory(!showHistory)}
                className="border-primary/30 hover:bg-primary/10"
              >
                <History className="w-4 h-4 mr-2" />
                Histórico
                {showHistory ? (
                  <ChevronUp className="w-4 h-4 ml-2" />
                ) : (
                  <ChevronDown className="w-4 h-4 ml-2" />
                )}
              </Button>
            </div>
          </motion.div>

          {/* History Section */}
          <AnimatePresence>
            {showHistory && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <Card className="p-6 mb-6 bg-card/50 backdrop-blur-xl border-border/50 rounded-2xl">
                  <div className="flex items-center gap-2 mb-4">
                    <Clock className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">Análises Salvas</h2>
                    <Badge variant="outline" className="ml-auto">
                      {savedAnalyses.length} análises
                    </Badge>
                  </div>

                  {loadingHistory ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    </div>
                  ) : savedAnalyses.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <History className="w-10 h-10 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma análise salva ainda</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {savedAnalyses.map((analysis) => (
                        <motion.div
                          key={analysis.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-4 rounded-xl bg-background/30 border border-border/50 hover:border-primary/30 transition-all group"
                        >
                          <div className="flex-1 min-w-0">
                            {editingId === analysis.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  placeholder="Nome da análise"
                                  className="h-8 bg-background/50 border-primary/30"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit(analysis.id);
                                    if (e.key === 'Escape') handleCancelEdit();
                                  }}
                                />
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={() => handleSaveEdit(analysis.id)}
                                  className="h-8 w-8 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  onClick={handleCancelEdit}
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <>
                                <p className="font-medium text-foreground truncate">{analysis.name || 'Análise sem nome'}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(analysis.created_at).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                  <span className="text-muted-foreground/50">•</span>
                                  <span>{analysis.channels?.length || 0} canais</span>
                                </div>
                              </>
                            )}
                          </div>
                          {editingId !== analysis.id && (
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleStartEdit(analysis)}
                                className="text-muted-foreground hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => handleLoadAnalysis(analysis)}
                                className="bg-primary text-primary-foreground hover:bg-primary/90"
                              >
                                Carregar
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleDeleteAnalysis(analysis.id)}
                                disabled={deletingId === analysis.id}
                                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              >
                                {deletingId === analysis.id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Trash2 className="w-4 h-4" />
                                )}
                              </Button>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Add Channel Form - Premium Glass Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="p-6 mb-6 bg-card/50 backdrop-blur-xl border-primary/30 rounded-2xl shadow-xl relative overflow-hidden group">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-primary" />
                  </div>
                  <h2 className="text-lg font-semibold text-foreground">Adicionar Canal para Análise</h2>
                  <Badge className="ml-auto bg-primary/10 text-primary border-primary/30">
                    {channels.length}/5 canais
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="md:col-span-2">
                    <label className="text-sm text-muted-foreground mb-2 block">URL do Canal</label>
                    <Input
                      placeholder="https://youtube.com/@canal ou https://..."
                      value={newChannelUrl}
                      onChange={(e) => setNewChannelUrl(e.target.value)}
                      className="bg-background/50 border-border/50 focus:border-primary/50 transition-colors h-12"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddChannel()}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button 
                      onClick={handleAddChannel}
                      disabled={channels.length >= 5}
                      className="w-full h-12 bg-gradient-to-r from-primary to-amber-500 text-primary-foreground hover:opacity-90 transition-opacity rounded-xl font-semibold"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar Canal
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground">
                  <Rocket className="w-3 h-3 inline mr-1 text-primary" />
                  O nicho e subnicho serão detectados automaticamente após a análise do canal
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Channels List */}
          <AnimatePresence>
            {channels.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
              >
                <Card className="p-6 mb-6 bg-card/50 backdrop-blur-xl border-border/50 rounded-2xl">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Youtube className="w-5 h-5 text-red-500" />
                      Canais Adicionados
                    </h2>
                    <Badge variant="outline" className="border-primary/50 bg-primary/5">
                      <Rocket className="w-3 h-3 mr-1" />
                      {analyzedCount} de {channels.length} analisados
                    </Badge>
                  </div>

                  <motion.div 
                    className="space-y-3"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    {channels.map((channel, index) => (
                      <motion.div 
                        key={channel.id}
                        variants={itemVariants}
                        initial="rest"
                        whileHover="hover"
                        animate="rest"
                        layout
                      >
                        <motion.div
                          variants={cardHoverVariants}
                          className={`flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${
                            channel.isAnalyzed 
                              ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/5 border-green-500/30' 
                              : 'bg-background/30 border-border/50 hover:border-primary/30'
                          }`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${
                                channel.isAnalyzed 
                                  ? 'bg-green-500/20 ring-2 ring-green-500/30' 
                                  : 'bg-red-500/10'
                              }`}>
                                <Youtube className={`w-6 h-6 ${channel.isAnalyzed ? 'text-green-500' : 'text-red-500'}`} />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">
                                  {channel.channelName || channel.url}
                                </p>
                                <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                                  {channel.isAnalyzed ? (
                                    <>
                                      <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                                        <Target className="w-3 h-3 mr-1" />
                                        {channel.niche}
                                      </Badge>
                                      <span className="text-muted-foreground/50">→</span>
                                      <span className="text-muted-foreground">{channel.subniche}</span>
                                      {channel.subscribers && (
                                        <>
                                          <span className="text-muted-foreground/50">•</span>
                                          <span className="text-green-500 font-medium">{channel.subscribers} inscritos</span>
                                        </>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-amber-500 flex items-center gap-1">
                                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                      Aguardando análise...
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {channel.isAnalyzed ? (
                              <Badge className="bg-green-500/20 text-green-500 border-green-500/30 px-3 py-1">
                                <Rocket className="w-3 h-3 mr-1" />
                                Analisado
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleAnalyzeChannel(channel)}
                                disabled={analyzingChannel === channel.id}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg"
                              >
                                {analyzingChannel === channel.id ? (
                                  <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Analisando...
                                  </>
                                ) : (
                                  <>
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    Analisar
                                  </>
                                )}
                              </Button>
                            )}
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleRemoveChannel(channel.id)}
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </motion.div>
                      </motion.div>
                    ))}
                  </motion.div>

                  {analyzedCount >= 2 && (
                    <motion.div 
                      className="mt-6 pt-6 border-t border-border/50"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Button
                        onClick={handleGenerateFullAnalysis}
                        disabled={generatingAnalysis}
                        className="w-full h-14 bg-gradient-to-r from-primary via-amber-500 to-primary text-primary-foreground hover:opacity-90 rounded-xl font-bold text-lg relative overflow-hidden group"
                        size="lg"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        {generatingAnalysis ? (
                          <>
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Gerando Análise Completa...
                          </>
                        ) : (
                          <>
                            <Rocket className="w-5 h-5 mr-2" />
                            Gerar Análise Completa com IA
                          </>
                        )}
                      </Button>
                      
                      {generatingAnalysis && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <Progress value={progress} className="mt-4 h-2" />
                          <p className="text-xs text-center text-muted-foreground mt-2">
                            Analisando padrões virais e gerando insights...
                          </p>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Empty State */}
          {channels.length === 0 && !analysisResult && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <Card className="p-16 text-center bg-card/30 backdrop-blur-xl border-border/30 rounded-2xl">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-amber-500/20 flex items-center justify-center mx-auto mb-6 border border-primary/20">
                  <TrendingUp className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Comece sua Análise Viral</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Adicione canais do YouTube para analisar padrões virais, identificar lacunas de conteúdo e gerar títulos otimizados com IA
                </p>
              </Card>
            </motion.div>
          )}

          {/* Analysis Results */}
          <AnimatePresence>
            {analysisResult && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="p-6 bg-card/50 backdrop-blur-xl border-primary/20 rounded-2xl shadow-xl">
                  <div className="flex items-center justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center">
                        <Rocket className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">Resultado da Análise</h2>
                        <p className="text-sm text-muted-foreground">Insights gerados a partir dos canais analisados</p>
                      </div>
                    </div>
                    <Button
                      onClick={handleSaveToDatabase}
                      disabled={saving || saved}
                      className={`${
                        saved 
                          ? 'bg-green-500 hover:bg-green-500' 
                          : 'bg-primary hover:bg-primary/90'
                      } text-primary-foreground rounded-xl transition-all duration-300`}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Salvando...
                        </>
                      ) : saved ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Salvo!
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Salvar Análise
                        </>
                      )}
                    </Button>
                  </div>

                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid grid-cols-3 mb-6 bg-background/50 p-1 rounded-xl">
                      <TabsTrigger value="gaps" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Target className="w-4 h-4" />
                        <span className="hidden sm:inline">Lacunas & Oportunidades</span>
                        <span className="sm:hidden">Lacunas</span>
                      </TabsTrigger>
                      <TabsTrigger value="titles" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Zap className="w-4 h-4" />
                        <span className="hidden sm:inline">Títulos Otimizados</span>
                        <span className="sm:hidden">Títulos</span>
                      </TabsTrigger>
                      <TabsTrigger value="ideas" className="flex items-center gap-2 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                        <Lightbulb className="w-4 h-4" />
                        <span className="hidden sm:inline">Ideias de Canal</span>
                        <span className="sm:hidden">Ideias</span>
                      </TabsTrigger>
                    </TabsList>

                    {/* Gaps & Opportunities Tab */}
                    <TabsContent value="gaps">
                      <motion.div 
                        className="space-y-6"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <div className="grid md:grid-cols-2 gap-6">
                          <motion.div 
                            variants={itemVariants}
                            className="p-5 rounded-xl bg-gradient-to-br from-red-500/10 to-red-600/5 border border-red-500/20 hover:border-red-500/40 transition-colors"
                          >
                            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center">
                                <Target className="w-4 h-4 text-red-500" />
                              </div>
                              Lacunas Identificadas
                            </h3>
                            <ul className="space-y-3">
                              {analysisResult.gapAnalysis?.gaps?.map((gap, index) => (
                                <motion.li 
                                  key={index} 
                                  className="text-sm text-muted-foreground flex items-start gap-3 p-3 rounded-lg bg-background/30 hover:bg-background/50 transition-colors"
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                >
                                  <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-500 text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                                    {index + 1}
                                  </span>
                                  {gap}
                                </motion.li>
                              ))}
                            </ul>
                          </motion.div>

                          <motion.div 
                            variants={itemVariants}
                            className="p-5 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-600/5 border border-green-500/20 hover:border-green-500/40 transition-colors"
                          >
                            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
                                <Rocket className="w-4 h-4 text-green-500" />
                              </div>
                              Oportunidades
                            </h3>
                            <ul className="space-y-3">
                              {analysisResult.gapAnalysis?.opportunities?.map((opp, index) => (
                                <motion.li 
                                  key={index} 
                                  className="text-sm text-muted-foreground flex items-start gap-3 p-3 rounded-lg bg-background/30 hover:bg-background/50 transition-colors"
                                  initial={{ opacity: 0, x: 10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                >
                                  <span className="w-5 h-5 rounded-full bg-green-500/20 text-green-500 text-xs flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                                    {index + 1}
                                  </span>
                                  {opp}
                                </motion.li>
                              ))}
                            </ul>
                          </motion.div>
                        </div>

                        {analysisResult.patternsMixed && analysisResult.patternsMixed.length > 0 && (
                          <motion.div 
                            variants={itemVariants}
                            className="p-5 rounded-xl bg-gradient-to-br from-primary/10 to-amber-500/5 border border-primary/20"
                          >
                            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                                <Zap className="w-4 h-4 text-primary" />
                              </div>
                              Padrões Identificados nos Canais
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {analysisResult.patternsMixed.map((pattern, index) => (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, scale: 0.8 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ delay: index * 0.05 }}
                                >
                                  <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 transition-colors cursor-default px-3 py-1">
                                    {pattern}
                                  </Badge>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    </TabsContent>

                    {/* Optimized Titles Tab */}
                    <TabsContent value="titles">
                      <motion.div 
                        className="space-y-4"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {analysisResult.optimizedTitles?.map((title, index) => (
                          <motion.div 
                            key={index}
                            variants={itemVariants}
                            whileHover={{ scale: 1.01 }}
                            className="p-5 rounded-xl bg-background/30 border border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                  <Badge className={`font-bold px-3 py-1 border-0 ${
                                    title.score >= 80 
                                      ? 'bg-green-500 text-white' 
                                      : title.score >= 60 
                                        ? 'bg-primary text-primary-foreground' 
                                        : 'bg-destructive text-destructive-foreground'
                                  }`}>
                                    <Star className={`w-3 h-3 mr-1 ${
                                      title.score >= 80 
                                        ? 'fill-white' 
                                        : title.score >= 60 
                                          ? 'fill-primary-foreground' 
                                          : 'fill-destructive-foreground'
                                    }`} />
                                    {title.score}/100
                                  </Badge>
                                  <Badge variant="outline" className="text-xs border-border/50 bg-background/50">
                                    {title.formula}
                                  </Badge>
                                </div>
                                <p className="font-semibold text-foreground mb-2 text-lg">{title.title}</p>
                                <p className="text-sm text-muted-foreground">{title.explanation}</p>
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => copyToClipboard(title.title)}
                                className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </TabsContent>

                    {/* Channel Ideas Tab */}
                    <TabsContent value="ideas">
                      <motion.div 
                        className="space-y-6"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        {analysisResult.channelIdeas?.map((idea, index) => (
                          <motion.div 
                            key={index}
                            variants={itemVariants}
                            whileHover={{ scale: 1.01 }}
                            className="p-6 rounded-xl bg-gradient-to-br from-primary/10 via-card to-amber-500/5 border border-primary/20 hover:border-primary/40 transition-all duration-300"
                          >
                            <div className="flex items-center gap-4 mb-4">
                              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center shadow-lg shadow-primary/20">
                                <Lightbulb className="w-7 h-7 text-primary-foreground" />
                              </div>
                              <div>
                                <h3 className="font-bold text-xl text-foreground">{idea.name}</h3>
                                <Badge variant="outline" className="mt-1 border-primary/30 text-primary">
                                  {idea.niche}
                                </Badge>
                              </div>
                            </div>
                            
                            <p className="text-muted-foreground mb-5 p-3 rounded-lg bg-background/30">{idea.concept}</p>
                            
                            <div>
                              <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-500" />
                                5 Primeiros Vídeos Sugeridos:
                              </h4>
                              <ol className="space-y-2">
                                {idea.firstVideos?.map((video, vIndex) => (
                                  <motion.li 
                                    key={vIndex}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: vIndex * 0.1 }}
                                    className="flex items-center gap-3 text-sm text-muted-foreground p-3 rounded-lg bg-background/50 hover:bg-background/70 transition-colors group"
                                  >
                                    <span className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-amber-500 text-primary-foreground text-xs flex items-center justify-center font-bold shadow-sm">
                                      {vIndex + 1}
                                    </span>
                                    <span className="flex-1">{video}</span>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => copyToClipboard(video)}
                                      className="w-7 h-7 text-muted-foreground hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </motion.li>
                                ))}
                              </ol>
                            </div>
                          </motion.div>
                        ))}
                      </motion.div>
                    </TabsContent>
                  </Tabs>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
        </PermissionGate>
      </MainLayout>
    </>
  );
};

export default ChannelAnalyzer;
