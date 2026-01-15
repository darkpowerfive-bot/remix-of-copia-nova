import { MainLayout } from "@/components/layout/MainLayout";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Zap, 
  Loader2, 
  Target, 
  TrendingUp, 
  Users, 
  Lightbulb, 
  ChevronDown, 
  DollarSign, 
  BarChart3,
  Rocket,
  Award,
  Clock,
  Calendar,
  CheckCircle,
  Search,
  Star,
  Hash,
  Copy,
  Check,
  Globe,
  FileText,
  Layers,
  RefreshCw,
  AlertTriangle,
  Save,
  Video,
  Timer,
  Image,
  History,
  Coins
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { usePersistedState } from "@/hooks/usePersistedState";
import { SessionIndicator } from "@/components/ui/session-indicator";
import { FolderSelect } from "@/components/folders/FolderSelect";
import { useAuth } from "@/hooks/useAuth";
import { useCreditDeduction } from "@/hooks/useCreditDeduction";
import { useNavigate } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SubnicheResult {
  name: string;
  potential: string;
  competition: string;
  description: string;
  demandScore?: number;
  competitionScore?: number;
  opportunityScore?: number;
  contentIdeas?: string[];
  keywords?: string[];
  monetizationPotential?: string;
  growthTrend?: string;
  entryDifficulty?: string;
  audienceSize?: string;
  avgViews?: string;
  topChannels?: string[];
  microNiche?: string;
  exampleTitles?: string[];
  targetCountries?: string[];
}

interface StrategicPlan {
  channelName?: string;
  niche?: string;
  strategy: string;
  contentIdeas: string[];
  differentials: string[];
  recommendations: string[];
  positioning?: string;
  uniqueValue?: string;
  postingSchedule?: string;
  growthTimeline?: string;
  quickWins?: string[];
  summary?: string;
  strengths?: string[];
  weaknesses?: string[];
  opportunities?: any[];
  threats?: string[];
  metrics?: {
    subscribers?: number;
    videos?: number;
    totalViews?: number;
    avgViewsPerVideo?: number;
    postingFrequency?: string;
    engagementLevel?: string;
  };
  dataSource?: string;
  // Novos campos de insights
  idealVideoDuration?: string;
  bestPostingTimes?: string[];
  bestPostingDays?: string[];
  exampleTitles?: string[];
  thumbnailTips?: string[];
  audienceInsights?: string;
  strategicKeywords?: string[];
}

const ExploreNiche = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { deduct, checkBalance, getEstimatedCost, CREDIT_COSTS } = useCreditDeduction();
  
  // Etapa 1 states
  const [mainNiche, setMainNiche] = usePersistedState("explore_mainNiche", "");
  const [competitorSubniche, setCompetitorSubniche] = usePersistedState("explore_competitorSubniche", "");
  const [subnicheModel, setSubnicheModel] = usePersistedState("explore_subnicheModel", "gpt-4.1");
  const [subnicheResults, setSubnicheResults] = usePersistedState<SubnicheResult[]>("explore_subnicheResults", []);
  const [loadingSubniches, setLoadingSubniches] = useState(false);
  const [expandedSubniche, setExpandedSubniche] = useState<number | null>(null);
  const [copiedKeyword, setCopiedKeyword] = useState<string | null>(null);
  const [regeneratingTitles, setRegeneratingTitles] = useState<number | null>(null);
  const [insufficientCredits, setInsufficientCredits] = useState(false);

  // Etapa 2 states
  const [channelUrl, setChannelUrl] = usePersistedState("explore_channelUrl", "");
  const [channelModel, setChannelModel] = usePersistedState("explore_channelModel", "gpt-4.1");
  const [strategicPlan, setStrategicPlan] = usePersistedState<StrategicPlan | null>("explore_strategicPlan", null);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [planProcessingStep, setPlanProcessingStep] = useState<string>("");
  const [selectedFolderForPlan, setSelectedFolderForPlan] = useState<string | null>(null);
  const [savingPlan, setSavingPlan] = useState(false);
  const [showSavedAnalyses, setShowSavedAnalyses] = useState(false);
  const [loadChannelFolderFilter, setLoadChannelFolderFilter] = usePersistedState<"all" | string | null>(
    "explore_loadChannelFolderFilter",
    "all",
  );

  // Verificar saldo
  useEffect(() => {
    const checkCredits = async () => {
      const cost = getEstimatedCost('explore_niche');
      const { hasBalance } = await checkBalance(cost);
      setInsufficientCredits(!hasBalance);
    };
    if (user) checkCredits();
  }, [user, checkBalance, getEstimatedCost]);

  // Query para buscar análises salvas (apenas análises de canal)
  const { data: savedAnalyses, refetch: refetchSavedAnalyses, isLoading: loadingSavedAnalyses } = useQuery({
    queryKey: ["saved-channel-analyses", user?.id, loadChannelFolderFilter],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from("analyzed_videos")
        .select("id, original_title, video_url, detected_niche, analysis_data_json, created_at, folder_id")
        .eq("user_id", user.id)
        .not("analysis_data_json", "is", null)
        .order("created_at", { ascending: false })
        .limit(200);

      // Filtro por pasta (all = todas)
      if (loadChannelFolderFilter !== "all") {
        if (loadChannelFolderFilter === null) query = query.is("folder_id", null);
        else query = query.eq("folder_id", loadChannelFolderFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Filtrar apenas análises de canal
      return (data || []).filter((item: any) => item.analysis_data_json?.type === "channel_analysis");
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (showSavedAnalyses) refetchSavedAnalyses();
  }, [showSavedAnalyses, refetchSavedAnalyses]);

  const loadSavedAnalysis = (analysis: any) => {
    const data = analysis.analysis_data_json;
    setChannelUrl(analysis.video_url);
    setSelectedFolderForPlan(analysis.folder_id ?? null);
    setStrategicPlan({
      channelName: data.channelName,
      niche: data.niche,
      strategy: data.strategy,
      contentIdeas: data.contentIdeas || [],
      differentials: data.differentials || [],
      recommendations: data.recommendations || [],
      positioning: data.positioning,
      uniqueValue: data.uniqueValue,
      postingSchedule: data.postingSchedule,
      growthTimeline: data.growthTimeline,
      quickWins: data.quickWins,
      summary: data.summary,
      strengths: data.strengths,
      weaknesses: data.weaknesses,
      opportunities: data.opportunities,
      threats: data.threats,
      metrics: data.metrics,
      dataSource: data.dataSource,
      idealVideoDuration: data.idealVideoDuration,
      bestPostingTimes: data.bestPostingTimes || [],
      bestPostingDays: data.bestPostingDays || [],
      exampleTitles: data.exampleTitles || [],
      thumbnailTips: data.thumbnailTips || [],
      audienceInsights: data.audienceInsights,
      strategicKeywords: data.strategicKeywords || [],
    });
    setShowSavedAnalyses(false);
    toast.success("Análise carregada com sucesso!");
  };

  // Etapas de processamento para feedback visual
  const planProcessingSteps = [
    "Extraindo ID do canal...",
    "Buscando dados do YouTube...",
    "Analisando inscritos e vídeos...",
    "Identificando nicho e subnicho...",
    "Detectando padrões de sucesso...",
    "Analisando pontos fortes e fracos...",
    "Identificando oportunidades...",
    "Gerando plano estratégico...",
    "Criando recomendações...",
    "Finalizando análise..."
  ];

  const copyKeyword = (keyword: string) => {
    navigator.clipboard.writeText(keyword);
    setCopiedKeyword(keyword);
    toast.success("Palavra-chave copiada!");
    setTimeout(() => setCopiedKeyword(null), 2000);
  };

  const handleSavePlanToFolder = async () => {
    if (!user || !strategicPlan) {
      toast.error("Você precisa estar logado e ter um plano gerado");
      return;
    }

    setSavingPlan(true);
    try {
      // Salvar como análise de canal na tabela analyzed_videos
      const { error } = await supabase.from("analyzed_videos").insert({
        user_id: user.id,
        video_url: channelUrl,
        folder_id: selectedFolderForPlan,
        original_title: `Análise: ${strategicPlan.channelName}`,
        detected_niche: strategicPlan.niche,
        analysis_data_json: {
          type: "channel_analysis",
          channelName: strategicPlan.channelName,
          niche: strategicPlan.niche,
          strategy: strategicPlan.strategy,
          contentIdeas: strategicPlan.contentIdeas,
          differentials: strategicPlan.differentials,
          recommendations: strategicPlan.recommendations,
          positioning: strategicPlan.positioning,
          uniqueValue: strategicPlan.uniqueValue,
          postingSchedule: strategicPlan.postingSchedule,
          growthTimeline: strategicPlan.growthTimeline,
          quickWins: strategicPlan.quickWins,
          summary: strategicPlan.summary,
          strengths: strategicPlan.strengths,
          weaknesses: strategicPlan.weaknesses,
          opportunities: strategicPlan.opportunities,
          threats: strategicPlan.threats,
          metrics: strategicPlan.metrics,
          dataSource: strategicPlan.dataSource,
          idealVideoDuration: strategicPlan.idealVideoDuration,
          bestPostingTimes: strategicPlan.bestPostingTimes,
          bestPostingDays: strategicPlan.bestPostingDays,
          exampleTitles: strategicPlan.exampleTitles,
          thumbnailTips: strategicPlan.thumbnailTips,
          audienceInsights: strategicPlan.audienceInsights,
          strategicKeywords: strategicPlan.strategicKeywords,
        },
      });

      if (error) throw error;

      refetchSavedAnalyses();
      toast.success("Análise salva com sucesso!");
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error("Erro ao salvar análise");
    } finally {
      setSavingPlan(false);
    }
  };

  const handleRegenerateTitles = async (subnicheIndex: number) => {
    const sub = subnicheResults[subnicheIndex];
    if (!sub) return;

    setRegeneratingTitles(subnicheIndex);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Você precisa estar logado");
        return;
      }

      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          action: "regenerate_titles",
          niche: mainNiche,
          subNiche: sub.name,
          microNiche: sub.microNiche,
          model: subnicheModel,
          userId: user.id,
        },
      });

      if (error) throw error;

      const newTitles = data?.titles || data?.exampleTitles;
      if (newTitles && Array.isArray(newTitles)) {
        const updatedResults = [...subnicheResults];
        updatedResults[subnicheIndex] = {
          ...updatedResults[subnicheIndex],
          exampleTitles: newTitles,
        };
        setSubnicheResults(updatedResults);
        toast.success("Títulos regenerados com sucesso!");
      } else {
        toast.error("Não foi possível regenerar os títulos");
      }
    } catch (err) {
      console.error("Error regenerating titles:", err);
      toast.error("Erro ao regenerar títulos");
    } finally {
      setRegeneratingTitles(null);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-success";
    if (score >= 5) return "text-primary";
    return "text-destructive";
  };

  const getScoreBarColor = (score: number) => {
    if (score >= 8) return "bg-success";
    if (score >= 5) return "bg-primary";
    return "bg-destructive";
  };

  const normalizeCountryName = (value: string) => {
    const trimmed = value.trim();
    const withoutCode = trimmed.replace(/^[a-z]{2}\s+/i, "");
    return withoutCode
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .toLowerCase();
  };

  const codeToFlag = (code: string) => {
    const upper = code.toUpperCase();
    return String.fromCodePoint(
      ...upper.split("").map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)
    );
  };

  const formatCountryWithFlag = (country: string) => {
    const match = country.trim().match(/^([a-z]{2})\s+(.+)$/i);
    if (match) {
      const code = match[1];
      const name = match[2];
      return `${codeToFlag(code)} ${name}`;
    }
    // fallback: try to find code from known country names
    const nameToCode: Record<string, string> = {
      brasil: "BR", brazil: "BR",
      argentina: "AR",
      "índia": "IN", india: "IN",
      portugal: "PT",
      espanha: "ES", spain: "ES",
      alemanha: "DE", germany: "DE",
      "méxico": "MX", mexico: "MX",
      eua: "US", usa: "US", "estados unidos": "US",
      frança: "FR", france: "FR", franca: "FR",
      itália: "IT", italia: "IT", italy: "IT",
      japão: "JP", japao: "JP", japan: "JP",
      "reino unido": "GB", uk: "GB",
      canadá: "CA", canada: "CA",
      turquia: "TR", turkey: "TR",
      "coreia do sul": "KR", "south korea": "KR",
      colômbia: "CO", colombia: "CO",
      chile: "CL",
      peru: "PE",
    };
    const normalized = country.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
    const code = nameToCode[normalized];
    if (code) {
      return `${codeToFlag(code)} ${country}`;
    }
    return country;
  };

  const getCountryBadgeClass = () => {
    return "bg-secondary/50 text-foreground border-border/50";
  };

  const getPotentialBadge = (potential: string) => {
    if (potential === "Muito Alto") {
      return "bg-success text-success-foreground border-0";
    }
    if (potential === "Alto") {
      return "bg-success/80 text-success-foreground border-0";
    }
    if (potential === "Médio") {
      return "bg-primary text-primary-foreground border-0";
    }
    return "bg-muted text-muted-foreground border-0";
  };

  const getCompetitionBadge = (competition: string) => {
    if (competition === "Muito Baixa") {
      return "bg-success text-success-foreground border-0";
    }
    if (competition === "Baixa") {
      return "bg-success/80 text-success-foreground border-0";
    }
    if (competition === "Média") {
      return "bg-primary text-primary-foreground border-0";
    }
    return "bg-destructive text-destructive-foreground border-0";
  };

  const handleFindSubniches = async () => {
    if (!mainNiche.trim()) {
      toast.error("Digite o nicho principal");
      return;
    }

    // Deduzir créditos antes
    const deductionResult = await deduct({
      operationType: 'explore_niche',
      modelUsed: subnicheModel,
      showToast: true
    });

    if (!deductionResult.success) {
      setInsufficientCredits(true);
      return;
    }

    setLoadingSubniches(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: 'find_subniches',
          niche: mainNiche,
          text: competitorSubniche,
          model: subnicheModel
        }
      });

      if (error) throw error;

      const result = data.result;
      if (result?.subniches) {
        setSubnicheResults(result.subniches);
        toast.success(`${result.subniches.length} subnichos encontrados!`);
      } else if (Array.isArray(result)) {
        setSubnicheResults(result);
        toast.success(`${result.length} subnichos encontrados!`);
      } else {
        throw new Error("Formato de resposta inválido");
      }
      setInsufficientCredits(false);
    } catch (error) {
      console.error('Error finding subniches:', error);
      // Reembolsar em caso de erro
      if (deductionResult.shouldRefund) {
        await deductionResult.refund();
      }
      toast.error('Erro ao buscar subnichos. Usando sugestões padrão.');
      setSubnicheResults([
        {
          name: `${mainNiche} - Histórias Não Contadas`,
          potential: "Alto",
          competition: "Baixa",
          description: "Foco em histórias pouco conhecidas dentro do nicho principal, explorando narrativas únicas e intrigantes que capturam a atenção do público.",
          demandScore: 8,
          competitionScore: 3,
          opportunityScore: 9,
          contentIdeas: ["Top 10 histórias esquecidas", "O que ninguém conta sobre...", "Revelações surpreendentes", "A verdade por trás de...", "Segredos históricos revelados"],
          keywords: ["história secreta", "revelações", "verdade oculta", "fatos desconhecidos", "mistérios"],
          monetizationPotential: "Alto",
          growthTrend: "📈 Em alta",
          audienceSize: "500K-1M",
          avgViews: "50K-100K",
          microNiche: "Segredos e Mistérios Históricos",
          exampleTitles: [
            `O Segredo de ${mainNiche} Que NINGUÉM Te Contou`,
            `A Verdade CHOCANTE Por Trás de ${mainNiche}`,
            `5 Histórias PROIBIDAS de ${mainNiche} Reveladas`
          ],
          targetCountries: ["🇧🇷 Brasil", "🇵🇹 Portugal", "🇺🇸 EUA (Espanhol)"]
        },
        {
          name: `${mainNiche} - Para Iniciantes`,
          potential: "Muito Alto",
          competition: "Média",
          description: "Conteúdo educacional introdutório para novatos, guias passo a passo e explicações simplificadas para quem está começando.",
          demandScore: 9,
          competitionScore: 5,
          opportunityScore: 8,
          contentIdeas: ["Guia completo para iniciantes", "Primeiros passos em...", "Erros comuns de iniciantes", "O básico que você precisa saber", "Por onde começar?"],
          keywords: ["iniciantes", "tutorial", "como começar", "guia básico", "passo a passo"],
          monetizationPotential: "Muito Alto",
          growthTrend: "📈 Em alta",
          audienceSize: "1M-5M",
          avgViews: "100K-500K",
          microNiche: "Tutoriais e Guias Simplificados",
          exampleTitles: [
            `${mainNiche} Para INICIANTES: Guia Completo 2025`,
            `Como Começar em ${mainNiche} do ZERO (Passo a Passo)`,
            `7 Erros de INICIANTE em ${mainNiche} Que Você PRECISA Evitar`
          ],
          targetCountries: ["🇧🇷 Brasil", "🇲🇽 México", "🇦🇷 Argentina", "🇨🇴 Colômbia"]
        },
        {
          name: `${mainNiche} - Análises Profundas`,
          potential: "Médio",
          competition: "Baixa",
          description: "Análises detalhadas e investigativas que vão além da superfície, oferecendo insights únicos e perspectivas exclusivas.",
          demandScore: 6,
          competitionScore: 2,
          opportunityScore: 8,
          contentIdeas: ["Análise completa de...", "Por que isso acontece?", "A verdade sobre...", "Investigação profunda", "O que os especialistas dizem"],
          keywords: ["análise", "investigação", "estudo aprofundado", "pesquisa", "insights"],
          monetizationPotential: "Médio",
          growthTrend: "📊 Estável",
          audienceSize: "100K-500K",
          avgViews: "20K-50K",
          microNiche: "Investigações e Deep Dives",
          exampleTitles: [
            `A VERDADE Sobre ${mainNiche} Que Ninguém Fala`,
            `Eu Investiguei ${mainNiche} Por 30 Dias e Descobri ISSO`,
            `Por Que ${mainNiche} Vai MUDAR em 2025? Análise Completa`
          ],
          targetCountries: ["🇧🇷 Brasil", "🇵🇹 Portugal"]
        },
        {
          name: `${mainNiche} - Comparativos`,
          potential: "Alto",
          competition: "Média",
          description: "Vídeos de comparação entre temas, produtos ou conceitos relacionados ao nicho, ajudando o público a tomar decisões informadas.",
          demandScore: 8,
          competitionScore: 4,
          opportunityScore: 7,
          contentIdeas: ["X vs Y: Qual é melhor?", "Comparativo definitivo", "A diferença que ninguém fala", "Ranking completo", "O melhor de todos os tempos"],
          keywords: ["comparativo", "versus", "ranking", "melhor", "diferenças"],
          monetizationPotential: "Alto",
          growthTrend: "📈 Em alta",
          audienceSize: "500K-1M",
          avgViews: "80K-150K",
          microNiche: "Reviews e Batalhas",
          exampleTitles: [
            `${mainNiche} A vs B: Qual é o MELHOR? Teste Definitivo`,
            `TOP 5 Melhores de ${mainNiche} em 2025 (Ranking Atualizado)`,
            `A Diferença Entre ${mainNiche} Barato e Caro (Vale a Pena?)`
          ],
          targetCountries: ["🇧🇷 Brasil", "🇺🇸 EUA", "🇬🇧 Reino Unido", "🇮🇳 Índia"]
        },
        {
          name: `${mainNiche} - Curiosidades`,
          potential: "Muito Alto",
          competition: "Média",
          description: "Fatos curiosos, trivia e informações surpreendentes que geram engajamento e compartilhamento orgânico.",
          demandScore: 9,
          competitionScore: 5,
          opportunityScore: 8,
          contentIdeas: ["10 fatos que você não sabia", "Curiosidades surpreendentes", "Por que isso existe?", "O que a ciência diz", "Mitos desvendados"],
          keywords: ["curiosidades", "fatos", "você sabia", "surpreendente", "incrível"],
          monetizationPotential: "Alto",
          growthTrend: "🚀 Viral",
          audienceSize: "1M-10M",
          avgViews: "200K-1M",
          microNiche: "Fatos Virais e Trivia",
          exampleTitles: [
            `10 Fatos INSANOS Sobre ${mainNiche} Que Vão Te CHOCAR`,
            `Por Que ${mainNiche} Existe? A Resposta Vai Te Surpreender`,
            `Você NUNCA Vai Olhar ${mainNiche} Da Mesma Forma Depois Disso`
          ],
          targetCountries: ["🇧🇷 Brasil", "🇲🇽 México", "🇪🇸 Espanha", "🇺🇸 EUA (Latino)"]
        }
      ]);
    } finally {
      setLoadingSubniches(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!channelUrl.trim()) {
      toast.error("Digite a URL do canal concorrente");
      return;
    }

    setLoadingPlan(true);
    setPlanProcessingStep(planProcessingSteps[0]);

    // Simular progressão das etapas enquanto aguarda a resposta
    let stepIndex = 0;
    const stepInterval = setInterval(() => {
      stepIndex = (stepIndex + 1) % planProcessingSteps.length;
      setPlanProcessingStep(planProcessingSteps[stepIndex]);
    }, 2500);

    try {
      // Usar a Edge Function analyze-channel que busca dados REAIS do YouTube
      const { data, error } = await supabase.functions.invoke('analyze-channel', {
        body: {
          channelUrl,
          maxVideos: 10,
          model: channelModel
        }
      });

      clearInterval(stepInterval);

      if (error) throw error;

      if (data?.success === false) {
        toast.error(data.error || "Não foi possível gerar o plano agora. Tente novamente.");
        return;
      }

      const analysis = data?.analysis;
      if (!analysis) {
        throw new Error("Formato de resposta inválido");
      }

      setPlanProcessingStep("Análise concluída!");

      setStrategicPlan({
        channelName: analysis.channelInfo?.name || "Canal Analisado",
        niche: analysis.channelInfo?.niche || "Nicho detectado",
        strategy: analysis.strategicPlan?.contentStrategy || analysis.channelInfo?.positioning || "",
        contentIdeas: analysis.strategicPlan?.contentIdeas || [],
        differentials: analysis.strategicPlan?.differentials || [],
        recommendations: analysis.strategicPlan?.recommendations || [],
        positioning: analysis.strategicPlan?.positioning,
        uniqueValue: analysis.strategicPlan?.uniqueValue,
        postingSchedule: analysis.strategicPlan?.postingSchedule || analysis.metrics?.postingFrequency,
        growthTimeline: analysis.strategicPlan?.growthTimeline,
        quickWins: analysis.quickWins,
        summary: analysis.summary,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        opportunities: analysis.opportunities,
        threats: analysis.threats,
        metrics: analysis.metrics,
        dataSource: analysis.dataSource,
        // Novos campos de insights
        idealVideoDuration: analysis.insights?.idealVideoDuration,
        bestPostingTimes: analysis.insights?.bestPostingTimes || [],
        bestPostingDays: analysis.insights?.bestPostingDays || [],
        exampleTitles: analysis.insights?.exampleTitles || [],
        thumbnailTips: analysis.insights?.thumbnailTips || [],
        audienceInsights: analysis.insights?.audienceInsights,
        strategicKeywords: analysis.insights?.strategicKeywords || [],
      });

      if (analysis.dataSource?.includes('dados reais')) {
        toast.success(`Plano estratégico gerado com dados reais do canal ${analysis.channelInfo?.name}!`);
      } else {
        toast.warning("Plano gerado sem dados reais. Configure sua YouTube API Key nas configurações para análises mais precisas.");
      }
    } catch (error: any) {
      clearInterval(stepInterval);
      console.error('Error generating plan:', error);
      if (error.message?.includes('Créditos insuficientes')) {
        toast.error(error.message);
      } else {
        toast.error('Erro ao gerar plano. Tente novamente.');
      }
    } finally {
      setLoadingPlan(false);
      setPlanProcessingStep("");
    }
  };

  return (
    <MainLayout>
      <SEOHead
        title="Explorar Nichos"
        description="Descubra subnichos lucrativos e gere planos estratégicos para seu canal."
        noindex={true}
      />
      <PermissionGate permission="explorar_nicho" featureName="Explorar Nicho">
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Session Indicator */}
          <SessionIndicator 
            storageKeys={[
              "explore_mainNiche", 
              "explore_competitorSubniche", 
              "explore_subnicheResults",
              "explore_channelUrl",
              "explore_strategicPlan"
            ]}
            label="Exploração anterior"
            onClear={() => {
              setMainNiche("");
              setCompetitorSubniche("");
              setSubnicheResults([]);
              setChannelUrl("");
              setStrategicPlan(null);
            }}
          />

          {/* Header */}
          <div className="mb-8 mt-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Search className="w-6 h-6 text-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">Explorador de Nichos</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Encontre subnichos promissores e analise a concorrência para dominar o YouTube.
            </p>
          </div>

          {/* Etapa 1: Encontrar um Subnicho */}
          <Card className="p-6 mb-8 border-primary/20 bg-gradient-to-br from-card to-card/80">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 text-primary font-bold text-lg">
                1
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Encontrar Subnichos</h2>
                <p className="text-sm text-muted-foreground">
                  Descubra oportunidades com alta demanda e baixa concorrência
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Nicho Principal *</label>
                  <Input
                    placeholder="Ex: História, Culinária, Finanças, Tecnologia"
                    value={mainNiche}
                    onChange={(e) => setMainNiche(e.target.value)}
                    className="bg-secondary/50 border-border h-12 text-base"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Subnicho concorrido (opcional)</label>
                  <Input
                    placeholder="Ex: Segunda Guerra Mundial, Receitas Fitness"
                    value={competitorSubniche}
                    onChange={(e) => setCompetitorSubniche(e.target.value)}
                    className="bg-secondary/50 border-border h-12 text-base"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-foreground">Motor de IA</label>
                    <Badge className="bg-primary/20 text-primary border-0 text-xs">
                      <Zap className="w-3 h-3 mr-1" />
                      ~6 créditos
                    </Badge>
                  </div>
                  <Select value={subnicheModel} onValueChange={setSubnicheModel}>
                    <SelectTrigger className="bg-secondary/50 border-border h-12">
                      <SelectValue />
                    </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4.1">GPT-4.1</SelectItem>
                        <SelectItem value="claude-sonnet-4-20250514">Claude 4 Sonnet</SelectItem>
                        <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                        <SelectItem value="deepseek-r1">DeepSeek R1</SelectItem>
                      </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleFindSubniches}
                    disabled={loadingSubniches || !mainNiche.trim()}
                    className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-8 text-base font-semibold"
                  >
                    {loadingSubniches ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analisando com IA...
                      </>
                    ) : (
                      <>
                        <Target className="w-4 h-4 mr-2" />
                        Encontrar Subnichos
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {/* Loading Progress Indicator */}
              {loadingSubniches && (
                <div className="mt-6 p-4 bg-secondary/30 rounded-xl border border-border/30">
                  <div className="flex items-center gap-3 mb-3">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    <span className="text-sm font-medium text-foreground">Processando análise...</span>
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-success" />
                      <span>Analisando demanda de mercado</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 text-primary animate-spin" />
                      <span>Avaliando concorrência e oportunidades</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-50">
                      <Clock className="w-3 h-3" />
                      <span>Gerando títulos virais e micro-nichos</span>
                    </div>
                    <div className="flex items-center gap-2 opacity-50">
                      <Globe className="w-3 h-3" />
                      <span>Identificando países recomendados</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Subnicho Results */}
            {subnicheResults.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Rocket className="w-5 h-5 text-primary" />
                    {subnicheResults.length} Subnichos Encontrados
                  </h3>
                </div>
                
                {/* Legenda das pontuações */}
                <div className="mb-6 p-4 bg-secondary/20 rounded-xl border border-border/30">
                  <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    Entenda as Pontuações
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="flex items-start gap-2">
                      <div className="w-3 h-3 rounded-full bg-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-foreground">Demanda</span>
                        <p className="text-muted-foreground">Quanto o público busca por esse tipo de conteúdo. Maior = mais interesse.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-3 h-3 rounded-full bg-success mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-foreground">Oportunidade</span>
                        <p className="text-muted-foreground">Potencial de crescimento considerando demanda vs concorrência. Maior = melhor.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="w-3 h-3 rounded-full bg-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <span className="font-semibold text-foreground">Dificuldade</span>
                        <p className="text-muted-foreground">Quão difícil é competir nesse nicho. Menor = mais fácil de entrar.</p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {(() => {
                    // Calcular o vencedor (maior score combinado: demanda + oportunidade - dificuldade)
                    const winnerIndex = subnicheResults.reduce((best, curr, idx) => {
                      const currScore = (curr.demandScore || 0) + (curr.opportunityScore || 0) - (curr.competitionScore || 0);
                      const bestScore = (subnicheResults[best].demandScore || 0) + (subnicheResults[best].opportunityScore || 0) - (subnicheResults[best].competitionScore || 0);
                      return currScore > bestScore ? idx : best;
                    }, 0);
                    
                    return subnicheResults.map((sub, index) => {
                      const isWinner = index === winnerIndex;
                      return (
                      <Collapsible 
                        key={index} 
                        open={expandedSubniche === index}
                        onOpenChange={() => setExpandedSubniche(expandedSubniche === index ? null : index)}
                      >
                        <div className={`bg-secondary/30 rounded-xl border overflow-hidden transition-colors ${isWinner ? 'border-success/50 ring-2 ring-success/20' : 'border-border/50 hover:border-primary/30'}`}>
                        <CollapsibleTrigger className="w-full cursor-pointer group/trigger">
                          <div className="p-6">
                            {/* Header */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm text-muted-foreground font-medium">#{index + 1}</span>
                                  {isWinner && (
                                    <Badge className="bg-success/20 text-success border-success/30 text-xs px-2 py-0.5">
                                      <Award className="w-3 h-3 mr-1" />
                                      Melhor Escolha
                                    </Badge>
                                  )}
                                  {sub.growthTrend && (
                                    <Badge className="bg-primary/20 text-primary border-0 text-xs">
                                      {sub.growthTrend}
                                    </Badge>
                                  )}
                                </div>
                                <h4 className="font-bold text-foreground text-xl text-left">{sub.name}</h4>
                              </div>
                              <div className="flex items-center gap-3">
                                <Badge className={`${getPotentialBadge(sub.potential)} text-sm px-3 py-1.5`}>
                                  <TrendingUp className="w-3.5 h-3.5 mr-1" />
                                  {sub.potential}
                                </Badge>
                                <Badge className={`${getCompetitionBadge(sub.competition)} text-sm px-3 py-1.5`}>
                                  <Users className="w-3.5 h-3.5 mr-1" />
                                  {sub.competition}
                                </Badge>
                                <ChevronDown className={`w-6 h-6 text-muted-foreground transition-transform duration-200 group-hover/trigger:text-primary ${expandedSubniche === index ? 'rotate-180' : ''}`} />
                              </div>
                            </div>
                            
                            <p className="text-base text-muted-foreground text-left mb-5 leading-relaxed">{sub.description}</p>
                            
                            {/* Scores Row */}
                            {(sub.demandScore || sub.opportunityScore || sub.competitionScore) && (
                              <div className="grid grid-cols-3 gap-6 mb-4">
                                {sub.demandScore !== undefined && sub.demandScore !== null && (
                                  <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-sm text-muted-foreground">Demanda</span>
                                      <span className={`text-base font-bold ${getScoreColor(sub.demandScore)}`}>{sub.demandScore}/10</span>
                                    </div>
                                    <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full transition-all rounded-full"
                                        style={{ 
                                          width: `${sub.demandScore * 10}%`,
                                          backgroundColor:
                                            sub.demandScore >= 8
                                              ? "hsl(var(--success))"
                                              : sub.demandScore >= 5
                                                ? "hsl(var(--primary))"
                                                : "hsl(var(--destructive))",
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                                {sub.opportunityScore !== undefined && sub.opportunityScore !== null && (
                                  <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-sm text-muted-foreground">Oportunidade</span>
                                      <span className={`text-base font-bold ${getScoreColor(sub.opportunityScore)}`}>{sub.opportunityScore}/10</span>
                                    </div>
                                    <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full transition-all rounded-full"
                                        style={{ 
                                          width: `${sub.opportunityScore * 10}%`,
                                          backgroundColor:
                                            sub.opportunityScore >= 8
                                              ? "hsl(var(--success))"
                                              : sub.opportunityScore >= 5
                                                ? "hsl(var(--primary))"
                                                : "hsl(var(--destructive))",
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                                {sub.competitionScore !== undefined && sub.competitionScore !== null && (
                                  <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                      <span className="text-sm text-muted-foreground">Dificuldade</span>
                                      <span className={`text-base font-bold ${getScoreColor(10 - sub.competitionScore)}`}>{sub.competitionScore}/10</span>
                                    </div>
                                    <div className="h-2.5 bg-muted/50 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full transition-all rounded-full"
                                        style={{ 
                                          width: `${sub.competitionScore * 10}%`,
                                          backgroundColor:
                                            (10 - sub.competitionScore) >= 8
                                              ? "hsl(var(--success))"
                                              : (10 - sub.competitionScore) >= 5
                                                ? "hsl(var(--primary))"
                                                : "hsl(var(--destructive))",
                                        }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            
                            {/* Expand indicator */}
                            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground group-hover/trigger:text-primary transition-colors">
                              <span>{expandedSubniche === index ? 'Clique para recolher' : 'Clique para ver detalhes'}</span>
                            </div>
                          </div>
                        </CollapsibleTrigger>
                        
                        <CollapsibleContent>
                          <div className="px-5 pb-5 pt-2 border-t border-border/30">
                            {/* Micro-Nicho */}
                            {sub.microNiche && (
                              <div className="mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
                                <div className="flex items-center gap-2 mb-1">
                                  <Layers className="w-4 h-4 text-primary" />
                                  <span className="text-xs font-semibold text-primary">Micro-Nicho Específico</span>
                                </div>
                                <p className="text-sm font-medium text-foreground">{sub.microNiche}</p>
                              </div>
                            )}
                            
                            {/* Stats Grid */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                              {sub.monetizationPotential && (
                                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                                  <DollarSign className="w-4 h-4 text-primary mx-auto mb-1" />
                                  <p className="text-xs text-muted-foreground">Monetização</p>
                                  <p className="text-sm font-semibold text-foreground">{sub.monetizationPotential}</p>
                                </div>
                              )}
                              {sub.audienceSize && (
                                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                                  <Users className="w-4 h-4 text-primary mx-auto mb-1" />
                                  <p className="text-xs text-muted-foreground">Audiência</p>
                                  <p className="text-sm font-semibold text-foreground">{sub.audienceSize}</p>
                                </div>
                              )}
                              {sub.avgViews && (
                                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                                  <BarChart3 className="w-4 h-4 text-primary mx-auto mb-1" />
                                  <p className="text-xs text-muted-foreground">Views Médias</p>
                                  <p className="text-sm font-semibold text-foreground">{sub.avgViews}</p>
                                </div>
                              )}
                              {sub.entryDifficulty && (
                                <div className="bg-secondary/50 rounded-lg p-3 text-center">
                                  <Target className="w-4 h-4 text-primary mx-auto mb-1" />
                                  <p className="text-xs text-muted-foreground">Entrada</p>
                                  <p className="text-sm font-semibold text-foreground">{sub.entryDifficulty}</p>
                                </div>
                              )}
                            </div>
                            
                            {/* Target Countries */}
                            {sub.targetCountries && sub.targetCountries.length > 0 && (
                              <div className="mb-4">
                                <h5 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                  <Globe className="w-4 h-4 text-primary" />
                                  Países Recomendados para Iniciar
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {sub.targetCountries.map((country, i) => (
                                    <Badge
                                      key={i}
                                      variant="outline"
                                      className={`${getCountryBadgeClass()} text-sm px-3 py-1.5 font-medium`}
                                    >
                                      {formatCountryWithFlag(country)}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Example Titles */}
                            {sub.exampleTitles && sub.exampleTitles.length > 0 && (
                              <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                  <h5 className="text-sm font-semibold text-foreground flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" />
                                    Exemplos de Títulos Virais
                                  </h5>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRegenerateTitles(index);
                                    }}
                                    disabled={regeneratingTitles === index}
                                    className="h-7 text-xs text-muted-foreground hover:text-primary"
                                  >
                                    {regeneratingTitles === index ? (
                                      <>
                                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                        Gerando...
                                      </>
                                    ) : (
                                      <>
                                        <RefreshCw className="w-3 h-3 mr-1" />
                                        Regenerar
                                      </>
                                    )}
                                  </Button>
                                </div>
                                <div className="space-y-3">
                                  {sub.exampleTitles.map((title, i) => {
                                    // Formatar título destacando palavras de impacto em CAIXA ALTA com pipe
                                    const formatTitle = (t: string) => {
                                      let formatted = t;
                                      
                                      // Lista de palavras de poder para destacar
                                      const powerWords = [
                                        'nunca', 'sempre', 'segredo', 'verdade', 'mentira', 'chocante',
                                        'incrível', 'absurdo', 'bizarro', 'proibido', 'escondido', 'revelado',
                                        'finalmente', 'urgente', 'alerta', 'cuidado', 'perigo', 'erro',
                                        'terrível', 'horrível', 'impressionante', 'surpreendente', 'real',
                                        'fake', 'verdadeiro', 'falso', 'maior', 'menor', 'pior', 'melhor',
                                        'primeiro', 'último', 'único', 'raro', 'impossível', 'possível',
                                        'secreto', 'misterioso', 'desconhecido', 'famoso', 'rico', 'pobre',
                                        'morreu', 'nasceu', 'descobriu', 'revelou', 'confessou', 'admitiu',
                                        'traição', 'vingança', 'justiça', 'guerra', 'paz', 'morte', 'vida',
                                        'milhões', 'bilhões', 'fortuna', 'milagre', 'tragédia', 'drama'
                                      ];
                                      
                                      // Colocar palavras de poder em CAIXA ALTA
                                      powerWords.forEach(word => {
                                        const regex = new RegExp(`\\b(${word})\\b`, 'gi');
                                        formatted = formatted.replace(regex, (match) => {
                                          return `<strong class="font-bold">${match.toUpperCase()}</strong>`;
                                        });
                                      });
                                      
                                      // Colocar nomes próprios em CAIXA ALTA (2+ palavras capitalizadas seguidas)
                                      formatted = formatted.replace(/([A-Z][a-záéíóúàèìòùâêîôûãõ]+(?:\s+[A-Z][a-záéíóúàèìòùâêîôûãõ]+)+)/g, (match) => {
                                        return `<strong class="font-bold">${match.toUpperCase()}</strong>`;
                                      });
                                      
                                      // Colocar números + contexto em destaque (negrito)
                                      formatted = formatted.replace(/(\d+(?:\.\d+)?(?:\s*(?:mil|milhões?|bilhões?|anos?|dias?|horas?|minutos?|vidas?|pessoas?|crianças?|%))?)/gi, '<strong class="font-bold">$1</strong>');
                                      
                                      // Substituir dois pontos por pipe estilizado
                                      formatted = formatted.replace(/\s*:\s*/g, ' <span class="text-muted-foreground mx-1">|</span> ');
                                      
                                      // Substituir travessão por pipe
                                      formatted = formatted.replace(/\s*[–—-]\s*/g, ' <span class="text-muted-foreground mx-1">|</span> ');
                                      
                                      return formatted;
                                    };
                                    
                                    const formulas = [
                                      { 
                                        parts: ["NOME", "FEITO"], 
                                        colors: ["text-blue-400", "text-blue-300"],
                                        bgColor: "bg-blue-500/10"
                                      },
                                      { 
                                        parts: ["NÚMERO", "IMPACTO"], 
                                        colors: ["text-emerald-400", "text-emerald-300"],
                                        bgColor: "bg-emerald-500/10"
                                      },
                                      { 
                                        parts: ["PERGUNTA", "REVELAÇÃO"], 
                                        colors: ["text-amber-400", "text-amber-300"],
                                        bgColor: "bg-amber-500/10"
                                      },
                                    ];
                                    
                                    const formula = formulas[i % 3];
                                    
                                    return (
                                      <div key={i} className="bg-card/50 border border-border/50 rounded-xl overflow-hidden group hover:border-primary/30 transition-colors">
                                        {/* Formula badge */}
                                        <div className="flex items-center justify-between px-4 py-2 bg-secondary/30 border-b border-border/30">
                                          <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold text-primary bg-primary/20 px-2 py-0.5 rounded">
                                              #{i + 1}
                                            </span>
                                            <div className={`flex items-center gap-1 ${formula.bgColor} px-3 py-1 rounded-full`}>
                                              <span className={`text-xs font-black tracking-wider ${formula.colors[0]}`}>
                                                {formula.parts[0]}
                                              </span>
                                              <span className="text-muted-foreground/50 text-xs font-light mx-0.5">|</span>
                                              <span className="text-muted-foreground text-xs font-bold">+</span>
                                              <span className="text-muted-foreground/50 text-xs font-light mx-0.5">|</span>
                                              <span className={`text-xs font-black tracking-wider ${formula.colors[1]}`}>
                                                {formula.parts[1]}
                                              </span>
                                            </div>
                                          </div>
                                          <button 
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              copyKeyword(title);
                                            }}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-primary/20 rounded-lg"
                                          >
                                            {copiedKeyword === title ? (
                                              <Check className="w-4 h-4 text-success" />
                                            ) : (
                                              <Copy className="w-4 h-4 text-muted-foreground" />
                                            )}
                                          </button>
                                        </div>
                                        {/* Title content */}
                                        <div className="px-4 py-3">
                                          <p 
                                            className="text-base text-foreground leading-relaxed"
                                            dangerouslySetInnerHTML={{ __html: formatTitle(title) }}
                                          />
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                            
                            {/* Content Ideas */}
                            {sub.contentIdeas && sub.contentIdeas.length > 0 && (
                              <div className="mb-4">
                                <h5 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                  <Lightbulb className="w-4 h-4 text-primary" />
                                  Ideias de Conteúdo
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                  {sub.contentIdeas.map((idea, i) => (
                                    <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/30 rounded-lg px-3 py-2">
                                      <Star className="w-3 h-3 text-primary flex-shrink-0" />
                                      {idea}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Keywords */}
                            {sub.keywords && sub.keywords.length > 0 && (
                              <div>
                                <h5 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
                                  <Hash className="w-4 h-4 text-primary" />
                                  Palavras-chave (clique para copiar)
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {sub.keywords.map((kw, i) => (
                                    <button
                                      key={i}
                                      onClick={() => copyKeyword(kw)}
                                      className="flex items-center gap-1 text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
                                    >
                                      {copiedKeyword === kw ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                      {kw}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                      );
                    })
                  })()}
                </div>
              </div>
            )}
          </Card>

          {/* Etapa 2: Analisar Canal Concorrente */}
          <Card className="p-6 border-blue-500/20 bg-gradient-to-br from-card to-card/80">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/20 text-blue-500 font-bold text-lg">
                  2
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Analisar Concorrência</h2>
                  <p className="text-sm text-muted-foreground">
                    Obtenha um plano estratégico baseado em um canal de sucesso
                  </p>
                </div>
              </div>

              {/* Botão para carregar análises salvas */}
              {user && (
                <Dialog open={showSavedAnalyses} onOpenChange={setShowSavedAnalyses}>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                      disabled={loadingSavedAnalyses}
                    >
                      <History className="w-4 h-4 mr-2" />
                      Carregar Análise ({savedAnalyses?.length ?? 0})
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2 text-foreground">
                        <History className="w-5 h-5 text-blue-500" />
                        Análises Salvas
                      </DialogTitle>
                    </DialogHeader>

                    {/* Filtro por pasta */}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        type="button"
                        variant={loadChannelFolderFilter === "all" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setLoadChannelFolderFilter("all")}
                        className={loadChannelFolderFilter === "all" ? "bg-primary text-primary-foreground" : "border-border"}
                      >
                        Todas
                      </Button>
                      <FolderSelect
                        value={loadChannelFolderFilter === "all" ? null : loadChannelFolderFilter}
                        onChange={(v) => setLoadChannelFolderFilter(v)}
                        placeholder="Filtrar por pasta"
                        className="flex-1"
                      />
                    </div>

                    <ScrollArea className="max-h-[400px] pr-4 mt-2">
                      {loadingSavedAnalyses ? (
                        <div className="flex items-center justify-center py-10 text-muted-foreground">
                          <Loader2 className="w-5 h-5 animate-spin mr-2" />
                          Carregando...
                        </div>
                      ) : savedAnalyses && savedAnalyses.length > 0 ? (
                        <div className="space-y-3">
                          {savedAnalyses.map((analysis: any) => (
                            <div
                              key={analysis.id}
                              className="p-4 bg-secondary/50 rounded-xl border border-border/50 hover:border-blue-500/30 transition-colors cursor-pointer group"
                              onClick={() => loadSavedAnalysis(analysis)}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium text-foreground truncate group-hover:text-blue-400 transition-colors">
                                    {analysis.original_title || "Análise sem título"}
                                  </h4>
                                  <p className="text-sm text-muted-foreground truncate mt-1">
                                    {analysis.video_url}
                                  </p>
                                  <div className="flex items-center gap-2 mt-2">
                                    {analysis.detected_niche && (
                                      <Badge variant="outline" className="text-xs">
                                        {analysis.detected_niche}
                                      </Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(analysis.created_at).toLocaleDateString("pt-BR")}
                                    </span>
                                  </div>
                                </div>
                                <Badge className="bg-blue-500/20 text-blue-400 border-0 text-xs self-start">
                                  Concorrência
                                </Badge>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-10 text-center text-muted-foreground">
                          Nenhuma análise encontrada para esse filtro.
                        </div>
                      )}
                    </ScrollArea>
                  </DialogContent>
                </Dialog>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">URL do Canal Concorrente *</label>
                <Input
                  placeholder="https://www.youtube.com/@canaldesucesso"
                  value={channelUrl}
                  onChange={(e) => setChannelUrl(e.target.value)}
                  className="bg-secondary/50 border-border h-12 text-base"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <label className="text-sm font-medium text-foreground">Motor de IA</label>
                    <Badge className="bg-blue-500/20 text-blue-500 border-0 text-xs">
                      <Zap className="w-3 h-3 mr-1" />
                      ~8 créditos
                    </Badge>
                  </div>
                  <Select value={channelModel} onValueChange={setChannelModel}>
                    <SelectTrigger className="bg-secondary/50 border-border h-12">
                      <SelectValue />
                    </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4.1">GPT-4.1</SelectItem>
                        <SelectItem value="claude-sonnet-4-20250514">Claude 4 Sonnet</SelectItem>
                        <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                        <SelectItem value="deepseek-r1">DeepSeek R1</SelectItem>
                      </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button
                    onClick={handleGeneratePlan}
                    disabled={loadingPlan || !channelUrl.trim()}
                    className="w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700 h-12 px-8 text-base font-semibold"
                  >
                    {loadingPlan ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Gerar Plano Estratégico
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Processing Feedback */}
            {loadingPlan && planProcessingStep && (
              <div className="mt-6 p-5 bg-gradient-to-r from-blue-500/10 to-primary/10 rounded-xl border border-blue-500/20 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                    <div className="absolute inset-0 w-6 h-6 rounded-full bg-blue-500/20 animate-ping" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-blue-400">Analisando canal...</p>
                    <p className="text-base text-foreground font-semibold">{planProcessingStep}</p>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CheckCircle className="w-3 h-3 text-success" />
                    <span>Conectando à API do YouTube</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 text-blue-500 animate-spin" />
                    <span>{planProcessingStep}</span>
                  </div>
                </div>
              </div>
            )}
            {strategicPlan && (
              <div className="mt-8 space-y-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-500" />
                    Plano Estratégico
                  </h3>
                  
                  {/* Save to Folder */}
                  <div className="flex items-center gap-2">
                    <FolderSelect
                      value={selectedFolderForPlan}
                      onChange={setSelectedFolderForPlan}
                      placeholder="Selecione pasta"
                      className="w-48"
                    />
                    <Button
                      onClick={handleSavePlanToFolder}
                      disabled={savingPlan}
                      size="sm"
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {savingPlan ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-1" />
                          Salvar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Data Source Badge */}
                {strategicPlan.dataSource && (
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                    strategicPlan.dataSource.includes('dados reais') 
                      ? 'bg-success/20 text-success' 
                      : 'bg-orange-500/20 text-orange-500'
                  }`}>
                    {strategicPlan.dataSource.includes('dados reais') ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <AlertTriangle className="w-3 h-3" />
                    )}
                    {strategicPlan.dataSource}
                  </div>
                )}

                {/* Channel Metrics - Dados Reais do YouTube */}
                {strategicPlan.metrics && strategicPlan.metrics.subscribers > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border border-primary/20 text-center">
                      <p className="text-2xl font-bold text-primary">
                        {strategicPlan.metrics.subscribers >= 1000000
                          ? `${(strategicPlan.metrics.subscribers / 1000000).toFixed(1)}M`
                          : strategicPlan.metrics.subscribers >= 1000
                          ? `${(strategicPlan.metrics.subscribers / 1000).toFixed(1)}K`
                          : strategicPlan.metrics.subscribers.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Inscritos</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-blue-500/10 to-blue-500/5 rounded-xl border border-blue-500/20 text-center">
                      <p className="text-2xl font-bold text-blue-500">
                        {(strategicPlan.metrics.videos || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Vídeos</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-success/10 to-success/5 rounded-xl border border-success/20 text-center">
                      <p className="text-2xl font-bold text-success">
                        {strategicPlan.metrics.totalViews >= 1000000000
                          ? `${(strategicPlan.metrics.totalViews / 1000000000).toFixed(1)}B`
                          : strategicPlan.metrics.totalViews >= 1000000
                          ? `${(strategicPlan.metrics.totalViews / 1000000).toFixed(1)}M`
                          : strategicPlan.metrics.totalViews >= 1000
                          ? `${(strategicPlan.metrics.totalViews / 1000).toFixed(1)}K`
                          : (strategicPlan.metrics.totalViews || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Views Totais</p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-orange-500/10 to-orange-500/5 rounded-xl border border-orange-500/20 text-center">
                      <p className="text-lg font-bold text-orange-500">
                        {strategicPlan.metrics.postingFrequency || strategicPlan.postingSchedule || "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Frequência</p>
                    </div>
                  </div>
                )}

                {/* Summary Card */}
                {strategicPlan.summary && (
                  <div className="p-5 bg-gradient-to-r from-blue-500/10 to-primary/10 rounded-xl border border-blue-500/20">
                    <h4 className="font-semibold text-blue-400 mb-2 flex items-center gap-2">
                      <Rocket className="w-4 h-4" />
                      Resumo Executivo
                    </h4>
                    <p className="text-foreground">{strategicPlan.summary}</p>
                  </div>
                )}

                {/* SWOT Analysis */}
                {(strategicPlan.strengths || strategicPlan.weaknesses || strategicPlan.opportunities) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {strategicPlan.strengths && (
                      <div className="p-4 bg-success/10 rounded-xl border border-success/20">
                        <h5 className="font-semibold text-success mb-3 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          Pontos Fortes
                        </h5>
                        <ul className="space-y-2">
                          {strategicPlan.strengths.map((item, i) => (
                            <li key={i} className="text-sm text-foreground flex items-start gap-2">
                              <span className="text-success mt-0.5">•</span>
                              {typeof item === 'string' ? item : (item as any)?.description || (item as any)?.type || JSON.stringify(item)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {strategicPlan.weaknesses && (
                      <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/20">
                        <h5 className="font-semibold text-destructive mb-3 flex items-center gap-2">
                          <Target className="w-4 h-4" />
                          Pontos Fracos
                        </h5>
                        <ul className="space-y-2">
                          {strategicPlan.weaknesses.map((item, i) => (
                            <li key={i} className="text-sm text-foreground flex items-start gap-2">
                              <span className="text-destructive mt-0.5">•</span>
                              {typeof item === 'string' ? item : (item as any)?.description || (item as any)?.type || JSON.stringify(item)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {strategicPlan.opportunities && (
                      <div className="p-4 bg-primary/10 rounded-xl border border-primary/20">
                        <h5 className="font-semibold text-primary mb-3 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4" />
                          Oportunidades
                        </h5>
                        <ul className="space-y-2">
                          {strategicPlan.opportunities.map((item, i) => (
                            <li key={i} className="text-sm text-foreground flex items-start gap-2">
                              <span className="text-primary mt-0.5">•</span>
                              {typeof item === 'string' ? item : (item as any)?.description || (item as any)?.type || JSON.stringify(item)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {strategicPlan.threats && (
                      <div className="p-4 bg-orange-500/10 rounded-xl border border-orange-500/20">
                        <h5 className="font-semibold text-orange-500 mb-3 flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Ameaças
                        </h5>
                        <ul className="space-y-2">
                          {strategicPlan.threats.map((item, i) => (
                            <li key={i} className="text-sm text-foreground flex items-start gap-2">
                              <span className="text-orange-500 mt-0.5">•</span>
                              {typeof item === 'string' ? item : (item as any)?.description || (item as any)?.type || JSON.stringify(item)}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Wins */}
                {strategicPlan.quickWins && strategicPlan.quickWins.length > 0 && (
                  <div className="p-5 bg-success/10 rounded-xl border border-success/20">
                    <h4 className="font-semibold text-success mb-3 flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      Ações Imediatas (Quick Wins)
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {strategicPlan.quickWins.map((win, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm text-foreground bg-success/5 rounded-lg px-3 py-2">
                          <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                          {typeof win === 'string' ? win : (win as any)?.description || (win as any)?.type || JSON.stringify(win)}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strategy */}
                <div className="p-5 bg-secondary/30 rounded-xl border border-border/50">
                  <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary" />
                    Estratégia Principal
                  </h4>
                  <p className="text-muted-foreground mb-4">{strategicPlan.strategy}</p>
                  
                  {strategicPlan.uniqueValue && (
                    <div className="mt-4 pt-4 border-t border-border/30">
                      <p className="text-xs text-muted-foreground mb-1">Proposta de Valor Única:</p>
                      <p className="text-foreground font-medium">{strategicPlan.uniqueValue}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Content Ideas */}
                  <div className="p-5 bg-secondary/30 rounded-xl border border-border/50">
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-primary" />
                      Ideias de Conteúdo
                    </h4>
                    <ul className="space-y-2">
                      {strategicPlan.contentIdeas.map((idea, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <Star className="w-3 h-3 text-primary mt-1 flex-shrink-0" />
                          {idea}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Differentials */}
                  <div className="p-5 bg-secondary/30 rounded-xl border border-border/50">
                    <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                      <Award className="w-4 h-4 text-primary" />
                      Diferenciais a Explorar
                    </h4>
                    <ul className="space-y-2">
                      {strategicPlan.differentials.map((diff, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <CheckCircle className="w-3 h-3 text-success mt-1 flex-shrink-0" />
                          {diff}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="p-5 bg-secondary/30 rounded-xl border border-border/50">
                  <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Recomendações de Execução
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {strategicPlan.recommendations.map((rec, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
                        <span className="text-primary">•</span>
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Schedule & Growth */}
                {(strategicPlan.postingSchedule || strategicPlan.growthTimeline) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {strategicPlan.postingSchedule && (
                      <div className="p-5 bg-secondary/30 rounded-xl border border-border/50">
                        <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-primary" />
                          Agenda de Postagem
                        </h4>
                        <p className="text-muted-foreground">{strategicPlan.postingSchedule}</p>
                      </div>
                    )}
                    {strategicPlan.growthTimeline && (
                      <div className="p-5 bg-secondary/30 rounded-xl border border-border/50">
                        <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                          <TrendingUp className="w-4 h-4 text-primary" />
                          Expectativa de Crescimento
                        </h4>
                        <p className="text-muted-foreground">{strategicPlan.growthTimeline}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* NEW INSIGHTS SECTION */}
                {(strategicPlan.idealVideoDuration || strategicPlan.bestPostingTimes?.length > 0 || strategicPlan.exampleTitles?.length > 0) && (
                  <div className="space-y-4">
                    <h4 className="text-lg font-bold text-foreground flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-primary" />
                      Insights Valiosos
                    </h4>

                    {/* Video Duration & Posting Times */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Ideal Duration */}
                      {strategicPlan.idealVideoDuration && (
                        <div className="p-5 bg-gradient-to-br from-purple-500/10 to-purple-500/5 rounded-xl border border-purple-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Timer className="w-5 h-5 text-purple-500" />
                            <h5 className="font-semibold text-purple-400">Minutagem Ideal</h5>
                          </div>
                          <p className="text-xl font-bold text-foreground">{strategicPlan.idealVideoDuration}</p>
                          <p className="text-xs text-muted-foreground mt-1">Duração recomendada para o nicho</p>
                        </div>
                      )}

                      {/* Best Posting Times */}
                      {strategicPlan.bestPostingTimes && strategicPlan.bestPostingTimes.length > 0 && (
                        <div className="p-5 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5 rounded-xl border border-cyan-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-5 h-5 text-cyan-500" />
                            <h5 className="font-semibold text-cyan-400">Melhores Horários</h5>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {strategicPlan.bestPostingTimes.map((time, i) => (
                              <Badge key={i} variant="outline" className="bg-cyan-500/10 text-cyan-400 border-cyan-500/30 text-lg px-3 py-1">
                                {time}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Best Posting Days */}
                      {strategicPlan.bestPostingDays && strategicPlan.bestPostingDays.length > 0 && (
                        <div className="p-5 bg-gradient-to-br from-amber-500/10 to-amber-500/5 rounded-xl border border-amber-500/20">
                          <div className="flex items-center gap-2 mb-2">
                            <Calendar className="w-5 h-5 text-amber-500" />
                            <h5 className="font-semibold text-amber-400">Melhores Dias</h5>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {strategicPlan.bestPostingDays.map((day, i) => (
                              <Badge key={i} variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30 px-3 py-1">
                                {day}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Example Titles */}
                    {strategicPlan.exampleTitles && strategicPlan.exampleTitles.length > 0 && (
                      <div className="p-5 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-xl border border-primary/20">
                        <div className="flex items-center gap-2 mb-4">
                          <Video className="w-5 h-5 text-primary" />
                          <h5 className="font-semibold text-primary">Títulos de Exemplo (prontos para usar)</h5>
                        </div>
                        <div className="space-y-3">
                          {strategicPlan.exampleTitles.map((title, i) => (
                            <div key={i} className="flex items-center justify-between gap-3 bg-background/50 rounded-lg px-4 py-3 group hover:bg-background/80 transition-colors">
                              <span className="text-foreground font-medium">{title}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  navigator.clipboard.writeText(title);
                                  toast.success("Título copiado!");
                                }}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Thumbnail Tips */}
                    {strategicPlan.thumbnailTips && strategicPlan.thumbnailTips.length > 0 && (
                      <div className="p-5 bg-secondary/30 rounded-xl border border-border/50">
                        <div className="flex items-center gap-2 mb-3">
                          <Image className="w-5 h-5 text-primary" />
                          <h5 className="font-semibold text-foreground">Dicas de Thumbnails</h5>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {strategicPlan.thumbnailTips.map((tip, i) => (
                            <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/50 rounded-lg px-3 py-2">
                              <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
                              {tip}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Strategic Keywords */}
                    {strategicPlan.strategicKeywords && strategicPlan.strategicKeywords.length > 0 && (
                      <div className="p-5 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 rounded-xl border border-emerald-500/20">
                        <div className="flex items-center gap-2 mb-4">
                          <Hash className="w-5 h-5 text-emerald-500" />
                          <h5 className="font-semibold text-emerald-400">Palavras-Chave Estratégicas</h5>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {strategicPlan.strategicKeywords.map((keyword, i) => (
                            <Badge 
                              key={i} 
                              variant="outline" 
                              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 px-3 py-1.5 cursor-pointer hover:bg-emerald-500/20 transition-colors"
                              onClick={() => {
                                navigator.clipboard.writeText(keyword);
                                toast.success("Palavra-chave copiada!");
                              }}
                            >
                              <Hash className="w-3 h-3 mr-1" />
                              {keyword}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">Clique para copiar</p>
                      </div>
                    )}

                    {/* Audience Insights */}
                    {strategicPlan.audienceInsights && (
                      <div className="p-5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-xl border border-indigo-500/20">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="w-5 h-5 text-indigo-500" />
                          <h5 className="font-semibold text-indigo-400">Perfil da Audiência</h5>
                        </div>
                        <p className="text-foreground">{strategicPlan.audienceInsights}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
      </PermissionGate>
    </MainLayout>
  );
};

export default ExploreNiche;
