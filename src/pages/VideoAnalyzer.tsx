import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { SEOHead } from "@/components/seo/SEOHead";
import { MainLayout } from "@/components/layout/MainLayout";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Zap,
  Eye,
  Calendar,
  MessageSquare,
  Download,
  FileText,
  Search,
  Copy,
  Check,
  Loader2,
  ChevronDown,
  Rocket,
  RefreshCw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { useActivityLog } from "@/hooks/useActivityLog";
import { TranscriptionSection } from "@/components/analyzer/TranscriptionSection";
import { CreateAgentModal } from "@/components/analyzer/CreateAgentModal";
import { ThumbnailLibrary } from "@/components/analyzer/ThumbnailLibrary";
import { usePersistedState } from "@/hooks/usePersistedState";
import { SessionIndicator } from "@/components/ui/session-indicator";
import { useTutorial } from "@/hooks/useTutorial";
import { TutorialModal, TutorialHelpButton } from "@/components/tutorial/TutorialModal";
import { VIDEO_ANALYZER_TUTORIAL } from "@/lib/tutorialConfigs";
import { useCreditDeduction } from "@/hooks/useCreditDeduction";

interface GeneratedTitle {
  id: string;
  title: string;
  formula: string;
  formulaSurpresa: string;
  quality: number;
  impact: number;
  isBest?: boolean;
  model: string;
  isUsed?: boolean;
}

interface OriginalTitleAnalysis {
  motivoSucesso: string;
  formula: string;
}

interface VideoInfo {
  title: string;
  thumbnail: string;
  views: number;
  daysAgo: number;
  comments: number;
  estimatedRevenue: { usd: number; brl: number };
  rpm: { usd: number; brl: number };
  niche: string;
  subNiche: string;
  microNiche: string;
  originalTitleAnalysis?: OriginalTitleAnalysis;
}

interface ScriptFormulaAnalysis {
  motivoSucesso: string;
  formula: string;
  estrutura: {
    hook: string;
    desenvolvimento: string;
    climax: string;
    cta: string;
  };
  tempoTotal: string;
  gatilhosMentais: string[];
}

// Elite motivational messages for loading states (La Casa Dark Core style)
const LOADING_MESSAGES = [
  "Conectando ao motor de análise premium...",
  "Decodificando fórmulas de sucesso comprovado...",
  "Analisando padrões de viralização de elite...",
  "Processando insights exclusivos da IA...",
  "Identificando gatilhos mentais de alta conversão...",
  "Calculando métricas de engajamento avançadas...",
  "Gerando títulos otimizados para máximo impacto...",
  "Finalizando sua análise profissional...",
];

const VideoAnalyzer = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Credit deduction hook
  const { executeWithDeduction, getEstimatedCost } = useCreditDeduction();
  
  // Persisted states - survive navigation
  const [videoUrl, setVideoUrl] = usePersistedState("analyzer_videoUrl", "");
  const [aiModel, setAiModel] = usePersistedState("analyzer_aiModel", "gemini-2.5-pro");
  const [language, setLanguage] = usePersistedState("analyzer_language", "pt-BR");
  const [saveFolder, setSaveFolder] = usePersistedState("analyzer_saveFolder", "general");
  const [videoInfo, setVideoInfo] = usePersistedState<VideoInfo | null>("analyzer_videoInfo", null);
  const [generatedTitles, setGeneratedTitles] = usePersistedState<GeneratedTitle[]>("analyzer_generatedTitles", []);
  const [selectedTitles, setSelectedTitles] = usePersistedState<string[]>("analyzer_selectedTitles", []);
  const [selectedTitleForThumbnail, setSelectedTitleForThumbnail] = usePersistedState("analyzer_selectedTitleForThumbnail", "");
  const [currentTranscription, setCurrentTranscription] = usePersistedState("analyzer_currentTranscription", "");
  const [currentAnalysisId, setCurrentAnalysisId] = usePersistedState<string | null>("analyzer_currentAnalysisId", null);
  
  // Non-persisted states (transient)
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  
  // Tutorial hook
  const { showTutorial, completeTutorial, openTutorial } = useTutorial(VIDEO_ANALYZER_TUTORIAL.id);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showAgentModal, setShowAgentModal] = useState(false);
  const [currentFormula, setCurrentFormula] = useState<ScriptFormulaAnalysis | null>(null);
  const [loadingTranscription, setLoadingTranscription] = useState(false);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const { logActivity } = useActivityLog();

  // Track last analyzed URL to detect manual changes
  const [lastAnalyzedUrl, setLastAnalyzedUrl] = usePersistedState("analyzer_lastAnalyzedUrl", "");

  // Load video data from URL params (when coming from viral videos)
  useEffect(() => {
    const urlParam = searchParams.get('url');
    const titleParam = searchParams.get('title');
    const thumbnailParam = searchParams.get('thumbnail');
    const viewsParam = searchParams.get('views');
    const likesParam = searchParams.get('likes');
    const commentsParam = searchParams.get('comments');
    const channelParam = searchParams.get('channel');
    const publishedAtParam = searchParams.get('publishedAt');
    
    if (urlParam) {
      setVideoUrl(urlParam);
      setLastAnalyzedUrl(urlParam);
      
      // If we have pre-loaded video data from viral detection
      if (titleParam || viewsParam) {
        const daysAgo = publishedAtParam 
          ? Math.floor((Date.now() - new Date(publishedAtParam).getTime()) / (1000 * 60 * 60 * 24))
          : 0;
        
        setVideoInfo({
          title: titleParam || '',
          thumbnail: thumbnailParam || '',
          views: parseInt(viewsParam || '0'),
          daysAgo,
          comments: parseInt(commentsParam || '0'),
          estimatedRevenue: { usd: 0, brl: 0 },
          rpm: { usd: 3.5, brl: 17.5 },
          niche: '',
          subNiche: '',
          microNiche: '',
        });
      }
      
      // Clear URL params after loading to avoid confusion
      setSearchParams({}, { replace: true });
    }
  }, []);

  // Clear stale video info when user manually changes the URL
  useEffect(() => {
    // Only clear if we have a different URL than what was last analyzed
    if (videoUrl && lastAnalyzedUrl && videoUrl !== lastAnalyzedUrl && videoInfo) {
      // Clear the video info to avoid showing stale data
      setVideoInfo(null);
      setGeneratedTitles([]);
      setCurrentAnalysisId(null);
    }
  }, [videoUrl]);

  const { data: folders } = useQuery({
    queryKey: ["folders", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("folders")
        .select("*")
        .eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user,
  });

  const modelLabels: Record<string, string> = {
    multimodal: "Comparar (Multimodal)",
    "gpt-4.1": "GPT-4.1",
    "claude-sonnet-4-20250514": "Claude 4 Sonnet",
    "gemini-2.5-pro": "Gemini 2.5 Pro",
    "deepseek-r1": "DeepSeek R1",
  };

  // O backend decide o provedor (Laozhang/OpenAI/Gemini/Platform) e o modelo final.
  // Aqui enviamos apenas o ID do modelo selecionado na UI (ex: gpt-4o, claude-4-sonnet, gemini-pro).

  const handleAnalyze = async () => {
    if (!videoUrl.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma URL de vídeo",
        variant: "destructive",
      });
      return;
    }

    // Multimodal usa 4 modelos, então cobra 4x
    const modelsCount = aiModel === "multimodal" ? 4 : 1;

    setAnalyzing(true);
    setVideoInfo(null);
    setGeneratedTitles([]);
    setLoadingMessage(LOADING_MESSAGES[0]);
    setLoadingProgress(0);
    
    // Animate progress and rotate messages
    let progressValue = 0;
    let messageIndex = 0;
    
    const progressInterval = setInterval(() => {
      progressValue += Math.random() * 6 + 2; // Random increment between 2-8
      if (progressValue > 92) progressValue = 92; // Cap at 92% until complete
      setLoadingProgress(progressValue);
      
      // Update message based on progress
      const newMessageIndex = Math.min(
        Math.floor((progressValue / 100) * LOADING_MESSAGES.length),
        LOADING_MESSAGES.length - 1
      );
      if (newMessageIndex !== messageIndex) {
        messageIndex = newMessageIndex;
        setLoadingMessage(LOADING_MESSAGES[messageIndex]);
      }
    }, 1000);
    
    const messageInterval = progressInterval; // Keep reference for cleanup

    // Deduzir créditos antes de iniciar
    const { result: deductionData, success: deductionSuccess, error: deductionError } = await executeWithDeduction(
      {
        operationType: 'analyze_video_titles',
        multiplier: modelsCount,
        modelUsed: aiModel,
        details: { model: aiModel, modelsCount },
        showToast: true
      },
      async () => ({ proceed: true })
    );

    if (!deductionSuccess) {
      clearInterval(messageInterval);
      setAnalyzing(false);
      return;
    }

    try {
      // Extract video ID from URL for thumbnail fallback
      const extractVideoId = (url: string): string | null => {
        const patterns = [
          /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
          /^([a-zA-Z0-9_-]{11})$/
        ];
        for (const pattern of patterns) {
          const match = url.match(pattern);
          if (match) return match[1];
        }
        return null;
      };

      const videoId = extractVideoId(videoUrl);
      const fallbackThumbnail = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : "";

      // First, fetch real video data from YouTube API
      const transcribeResponse = await supabase.functions.invoke("transcribe-video", {
        body: { videoUrl },
      });

      let realVideoData = null;
      if (transcribeResponse.data?.videoDetails) {
        realVideoData = transcribeResponse.data.videoDetails;
        
        // Ensure thumbnail is set with fallback
        if (!realVideoData.thumbnail && fallbackThumbnail) {
          realVideoData.thumbnail = fallbackThumbnail;
        }
        
        // Update transcription if available
        if (transcribeResponse.data.transcription) {
          setCurrentTranscription(transcribeResponse.data.transcription);
        }
      } else if (videoId) {
        // If no video details but we have ID, create minimal data
        realVideoData = {
          title: "",
          thumbnail: fallbackThumbnail,
          views: 0,
          daysAgo: 0,
          comments: 0,
        };
      }

      // Helper function to call AI and generate titles
      const generateTitlesWithModel = async (modelId: string, modelLabel: string) => {
        const response = await supabase.functions.invoke("ai-assistant", {
          body: {
            type: "analyze_video_titles",
            model: modelId,
            videoData: {
              url: videoUrl,
              title: realVideoData?.title,
              description: realVideoData?.description,
              tags: realVideoData?.tags,
            },
            language,
            prompt: `Analise o vídeo do YouTube com URL: ${videoUrl}
            ${realVideoData ? `
            Dados reais do vídeo:
            - Título: ${realVideoData.title}
            - Canal: ${realVideoData.channelTitle}
            - Views: ${realVideoData.views}
            - Likes: ${realVideoData.likes}
            - Categoria YouTube: ${realVideoData.categoryId || "N/A"}
            - Tags: ${realVideoData.tags?.join(", ") || "N/A"}
            - Descrição: ${realVideoData.description?.substring(0, 500) || "N/A"}
            ` : ""}
            
            IMPORTANTE: Determine o nicho, subnicho e micronicho baseando-se EXCLUSIVAMENTE no conteúdo real do vídeo (título, descrição, tags e categoria do YouTube). 
            Não invente nichos que não tenham relação direta com o conteúdo do vídeo.
            Exemplos de nichos corretos: "DIY", "ASMR", "Tecnologia", "Educação", "Entretenimento", "Games", "Culinária", "Fitness", etc.
            O nicho deve refletir o assunto REAL do vídeo.
            
            Para estimatedRevenue: calcule baseado nas views reais usando a fórmula: (views / 1000) * RPM.
            RPM médio por nicho: Tech=$4-8, Finance=$8-15, Entertainment=$1-3, Education=$3-6, DIY/ASMR=$2-5, Gaming=$2-4, Health=$5-10.
            Escolha o RPM adequado ao nicho REAL do vídeo.
            
            Retorne um JSON com:
            1. videoInfo: informações do vídeo com:
               - niche: nicho principal do vídeo (baseado no conteúdo real)
               - subNiche: subnicho específico
               - microNiche: micronicho detalhado
               - estimatedRevenue: { usd: valor calculado, brl: valor * 5 }
               - rpm: { usd: valor do RPM usado, brl: rpm * 5.5 }
            2. titles: array com 5 títulos gerados baseados na fórmula do título original. Cada título deve ter:
               - title: o título gerado
               - formula: análise da estrutura/fórmula (ex: "Promessa central + benefício + 5 termo(s) em CAIXA ALTA + loop mental")
               - formulaSurpresa: fórmula alternativa (ex: "Promessa central + benefício + gatilho de segredo + loop mental")
               - quality: score de qualidade (1-10)
               - impact: score de impacto (1-10)
            
            O título com maior score combinado deve ser marcado como isBest: true.
            Idioma dos títulos: ${language === "pt-BR" ? "Português Brasileiro" : language}`,
          },
        });

        if (response.error) throw response.error;

        const result = response.data.result;
        let parsedResult = result;
        if (typeof result === "string") {
          try {
            const jsonMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/);
            if (jsonMatch) {
              parsedResult = JSON.parse(jsonMatch[1].trim());
            } else {
              parsedResult = JSON.parse(result);
            }
          } catch {
            parsedResult = generateMockData(videoUrl);
          }
        }

        return { parsedResult, modelLabel };
      };

      // Determine models to use based on selection
      let modelsToUse: { id: string; label: string }[] = [];
      
      if (aiModel === "multimodal") {
        // Use all 4 Laozhang models for multimodal
        modelsToUse = [
          { id: "gpt-4.1", label: "GPT-4.1" },
          { id: "claude-sonnet-4-20250514", label: "Claude 4 Sonnet" },
          { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
          { id: "deepseek-r1", label: "DeepSeek R1" },
        ];
      } else {
        // Use single selected model
        modelsToUse = [{ id: aiModel, label: modelLabels[aiModel] || aiModel }];
      }

      // Call all models in parallel (one call per model). Don't fail the whole run if one model errors.
      const settled = await Promise.allSettled(
        modelsToUse.map((m) => generateTitlesWithModel(m.id, m.label))
      );

      const failedModelLabels = settled
        .map((r, idx) => (r.status === "rejected" ? modelsToUse[idx].label : null))
        .filter(Boolean) as string[];

      // Combine all titles from all successful models
      let allTitles: GeneratedTitle[] = [];
      let videoInfoData: any = null;

      settled.forEach((r, modelIndex) => {
        if (r.status !== "fulfilled") return;

        const { parsedResult, modelLabel } = r.value;

        if (!videoInfoData && parsedResult?.videoInfo) {
          videoInfoData = parsedResult.videoInfo;
        }

        // Add titles with model label
        if (parsedResult?.titles && Array.isArray(parsedResult.titles)) {
          const titlesWithModel = parsedResult.titles.map((t: any, i: number) => ({
            ...t,
            id: `title-${modelIndex}-${i}`,
            model: modelLabel,
          }));
          allTitles = [...allTitles, ...titlesWithModel];
        }
      });

      if (allTitles.length === 0) {
        // All models failed
        throw new Error("Nenhum modelo retornou títulos");
      }

      // Find best title across all
      if (allTitles.length > 0) {
        const bestIndex = allTitles.reduce((best, curr, idx) => {
          const currScore = (curr.quality || 0) + (curr.impact || 0);
          const bestScore = (allTitles[best].quality || 0) + (allTitles[best].impact || 0);
          return currScore > bestScore ? idx : best;
        }, 0);
        allTitles[bestIndex].isBest = true;
      }

      // Set video info with thumbnail fallback
      const aiVideoInfo = videoInfoData || {};
      const actualViews = realVideoData?.views || 0;
      
      // Calculate revenue from actual views if AI didn't provide proper values
      const aiRpm = aiVideoInfo.rpm?.usd || 3.5;
      const calculatedRevenueUsd = Math.round((actualViews / 1000) * aiRpm);
      const calculatedRevenueBrl = Math.round(calculatedRevenueUsd * 5);
      
      // Use AI revenue only if it seems reasonable (>$1 for videos with views), otherwise calculate
      const aiRevenueUsd = aiVideoInfo.estimatedRevenue?.usd || 0;
      const useCalculated = actualViews > 1000 && (aiRevenueUsd < 1 || aiRevenueUsd < calculatedRevenueUsd * 0.1);
      
      setVideoInfo({
        title: realVideoData?.title || aiVideoInfo.title || "Título do Vídeo",
        thumbnail: realVideoData?.thumbnail || fallbackThumbnail || "",
        views: actualViews,
        daysAgo: realVideoData?.daysAgo || 0,
        comments: realVideoData?.comments || 0,
        estimatedRevenue: useCalculated 
          ? { usd: calculatedRevenueUsd, brl: calculatedRevenueBrl }
          : (aiVideoInfo.estimatedRevenue || { usd: calculatedRevenueUsd, brl: calculatedRevenueBrl }),
        rpm: aiVideoInfo.rpm || { usd: 3.5, brl: 19.25 },
        niche: aiVideoInfo.niche || "Conteúdo",
        subNiche: aiVideoInfo.subNiche || "",
        microNiche: aiVideoInfo.microNiche || "",
        originalTitleAnalysis: aiVideoInfo.originalTitleAnalysis,
      });

      // Set generated titles
      setGeneratedTitles(allTitles);

      // Save to database and get the analysis ID
      if (user?.id) {
        // First save the analyzed_video to get an ID for linking titles
        const { data: analyzedVideoData, error: analyzedVideoError } = await supabase
          .from("analyzed_videos")
          .insert({
            user_id: user.id,
            video_url: videoUrl,
            original_title: realVideoData?.title || aiVideoInfo?.title || "Análise de Vídeo",
            original_thumbnail_url: realVideoData?.thumbnail,
            original_views: realVideoData?.views,
            original_comments: realVideoData?.comments,
            detected_niche: aiVideoInfo?.niche,
            detected_subniche: aiVideoInfo?.subNiche,
            detected_microniche: aiVideoInfo?.microNiche,
            analysis_data_json: JSON.parse(JSON.stringify({ videoInfo: aiVideoInfo, titles: allTitles })),
            folder_id: saveFolder !== "general" ? saveFolder : null,
          })
          .select("id")
          .single();

        if (!analyzedVideoError && analyzedVideoData) {
          setCurrentAnalysisId(analyzedVideoData.id);

          // Save all titles linked to this analysis
          const titlesToInsert = allTitles.map((t: GeneratedTitle) => ({
            user_id: user.id,
            title_text: t.title,
            formula: t.formula,
            pontuacao: Math.round((t.quality + t.impact) / 2 * 10),
            model_used: t.model,
            video_analysis_id: analyzedVideoData.id,
            is_favorite: false,
            folder_id: saveFolder !== "general" ? saveFolder : null,
          }));

          await supabase.from("generated_titles").insert(titlesToInsert);
        }

        // Also save to video_analyses for legacy
        await supabase.from("video_analyses").insert({
          user_id: user.id,
          video_url: videoUrl,
          video_title: realVideoData?.title || aiVideoInfo?.title || "Análise de Vídeo",
          thumbnail_url: realVideoData?.thumbnail,
          views: realVideoData?.views,
          likes: realVideoData?.likes,
          comments: realVideoData?.comments,
          analysis_data: JSON.parse(JSON.stringify({ videoInfo: aiVideoInfo, titles: allTitles })),
        });
      }

      // Log activity
      await logActivity({
        action: 'video_analysis',
        description: `Vídeo analisado: ${realVideoData?.title || videoUrl}`,
      });

      // Mark this URL as analyzed so we can detect future changes
      setLastAnalyzedUrl(videoUrl);

      toast({
        title: failedModelLabels.length > 0 ? "Análise concluída (parcial)" : "Análise concluída!",
        description:
          failedModelLabels.length > 0
            ? `Alguns modelos falharam: ${failedModelLabels.join(", ")}`
            : "Títulos gerados com sucesso",
        ...(failedModelLabels.length > 0 ? { variant: "destructive" as const } : {}),
      });
    } catch (error) {
      console.error("Error analyzing video:", error);
      
      // Generate mock data on error for demo purposes
      const mockData = generateMockData(videoUrl);
      setVideoInfo(mockData.videoInfo);
      setGeneratedTitles(mockData.titles.map((t: any, i: number) => ({
        ...t,
        id: `title-${i}`,
        model: modelLabels[aiModel] || aiModel,
      })));
      
      toast({
        title: "Análise concluída",
        description: "Dados gerados para demonstração",
      });
    } finally {
      clearInterval(messageInterval);
      setLoadingProgress(100);
      setTimeout(() => setLoadingProgress(0), 500);
      setAnalyzing(false);
    }
  };

  const generateMockData = (url: string) => {
    // Extract video ID for thumbnail fallback
    const extractVideoId = (videoUrl: string): string | null => {
      const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /^([a-zA-Z0-9_-]{11})$/
      ];
      for (const pattern of patterns) {
        const match = videoUrl.match(pattern);
        if (match) return match[1];
      }
      return null;
    };

    const videoId = extractVideoId(url);
    const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : "";

    return {
      videoInfo: {
        title: "La BATALLA TECNOLÓGICA que NADIE Vio: MAYAS vs. AZTECAS",
        thumbnail: thumbnailUrl,
        views: 1295,
        daysAgo: 137,
        comments: 2,
        estimatedRevenue: { usd: 5, brl: 25 },
        rpm: { usd: 3.5, brl: 19.25 },
        niche: "História",
        subNiche: "Mistérios",
        microNiche: "Conflito Tecnológico Ucrônico Antigo",
        originalTitleAnalysis: {
          motivoSucesso: "O título original gera curiosidade ao sugerir uma batalha tecnológica desconhecida entre civilizações antigas, usando palavras em caixa alta para intensificar o impacto.",
          formula: "Promessa central + benefício + 5 termo(s) em CAIXA ALTA + loop mental (o detalhe/segredo/verdade).",
        },
      },
      titles: [
        {
          title: "O SEGREDO MILITAR que NINGUÉM Revelou: EGÍPCIOS vs. HITITAS",
          formula: "Promessa central + benefício + 5 termo(s) em CAIXA ALTA + loop mental (o detalhe/segredo/verdade).",
          formulaSurpresa: "Promessa central + benefício + gatilho de segredo + loop mental",
          quality: 9,
          impact: 9,
          isBest: true,
        },
        {
          title: "A TÁTICA OCULTA que NINGUÉM Esperava: ROMANOS vs. VISIGODOS",
          formula: "Promessa central + benefício + 5 termo(s) em CAIXA ALTA + loop mental (o detalhe/segredo/verdade).",
          formulaSurpresa: "Mistério central + benefício + gatilho de revelação",
          quality: 9,
          impact: 8,
        },
        {
          title: "A ESTRATÉGIA PERDIDA que NINGUÉM Conhecia: VIKINGS vs. SAXÕES",
          formula: "Promessa central + benefício + 5 termo(s) em CAIXA ALTA + loop mental (o detalhe/segredo/verdade).",
          formulaSurpresa: "Promessa central + benefício + segredo revelado + loop mental",
          quality: 9,
          impact: 8,
        },
        {
          title: "A ESTRATÉGIA IMPOSSÍVEL que MUDOU TUDO: SPARTANOS vs. PERSAS",
          formula: "Promessa central + benefício + 5 termo(s) em CAIXA ALTA + loop mental (o detalhe/segredo/verdade).",
          formulaSurpresa: "Contraste extremo + benefício + gatilho de mistério",
          quality: 9,
          impact: 4,
        },
        {
          title: "O CONFRONTO SECRETO que TRANSFORMOU a HISTÓRIA: CHINESES vs. MONGÓIS",
          formula: "Promessa central + benefício + 5 termo(s) em CAIXA ALTA + loop mental (o detalhe/segredo/verdade).",
          formulaSurpresa: "Promessa central + segredo impactante + loop mental",
          quality: 9,
          impact: 4,
        },
      ],
    };
  };

  const handleDownloadThumbnail = async () => {
    if (!videoInfo?.thumbnail) {
      toast({
        title: "Thumbnail não disponível",
        description: "Não foi possível obter a thumbnail do vídeo",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const response = await fetch(videoInfo.thumbnail);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `thumbnail-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast({ title: "Download iniciado!", description: "Thumbnail salva com sucesso" });
    } catch {
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar a thumbnail",
        variant: "destructive",
      });
    }
  };

  const handleLoadTranscription = async () => {
    if (!videoUrl) {
      toast({
        title: "Erro",
        description: "Insira a URL do vídeo primeiro",
        variant: "destructive",
      });
      return;
    }

    setLoadingTranscription(true);
    try {
      const { data, error } = await supabase.functions.invoke("transcribe-video", {
        body: { videoUrl },
      });

      if (error) throw error;

      if (data?.transcription) {
        setCurrentTranscription(data.transcription);
        toast({
          title: "Transcrição carregada!",
          description: `${data.transcription.length} caracteres transcritos`,
        });
      } else {
        toast({
          title: "Transcrição não encontrada",
          description: "Não foi possível obter a transcrição do vídeo",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Transcription error:", error);
      toast({
        title: "Erro ao transcrever",
        description: "Não foi possível transcrever o vídeo",
        variant: "destructive",
      });
    } finally {
      setLoadingTranscription(false);
    }
  };

  const handleSearchSimilarVideos = () => {
    if (!videoInfo?.title) return;
    
    const searchQuery = encodeURIComponent(videoInfo.title);
    window.open(`https://www.youtube.com/results?search_query=${searchQuery}`, "_blank");
    toast({ title: "Buscando vídeos semelhantes", description: "Abrindo YouTube em nova aba" });
  };

  const copyTitle = async (id: string, title: string) => {
    await navigator.clipboard.writeText(title);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    
    // Also mark as used when copying
    const titleData = generatedTitles.find(t => t.id === id);
    if (titleData && !titleData.isUsed) {
      // Update local state
      setGeneratedTitles(prev => prev.map(t => 
        t.id === id ? { ...t, isUsed: true } : t
      ));
      
      // Update in database
      if (user && currentAnalysisId) {
        const { data: existingTitle } = await supabase
          .from("generated_titles")
          .select("id")
          .eq("user_id", user.id)
          .eq("title_text", titleData.title)
          .eq("video_analysis_id", currentAnalysisId)
          .single();
        
        if (existingTitle) {
          await supabase
            .from("generated_titles")
            .update({ is_used: true })
            .eq("id", existingTitle.id);
        }
      }
    }
    
    toast({ title: "Copiado e marcado!", description: "Título copiado e marcado como utilizado" });
  };

  const toggleTitleSelection = async (id: string, titleText: string) => {
    const isSelected = selectedTitles.includes(id);
    const newSelected = isSelected 
      ? selectedTitles.filter((t) => t !== id) 
      : [...selectedTitles, id];
    
    setSelectedTitles(newSelected);
    
    // When selecting, set the title for thumbnail generation
    if (!isSelected) {
      setSelectedTitleForThumbnail(titleText);
    }
    
    // Update is_favorite in database for the title linked to current analysis
    if (user && currentAnalysisId) {
      const titleData = generatedTitles.find(t => t.id === id);
      if (titleData) {
        // Find the title by text and analysis_id
        const { data: existingTitle } = await supabase
          .from("generated_titles")
          .select("id, is_favorite")
          .eq("user_id", user.id)
          .eq("title_text", titleData.title)
          .eq("video_analysis_id", currentAnalysisId)
          .single();
        
        if (existingTitle) {
          await supabase
            .from("generated_titles")
            .update({ is_favorite: !isSelected })
            .eq("id", existingTitle.id);
        }
        
        toast({
          title: isSelected ? "Título desmarcado" : "Título marcado!",
          description: isSelected 
            ? "Título removido dos favoritos" 
            : "Título salvo como favorito e disponível no histórico",
        });
      }
    }
  };

  const toggleTitleUsed = async (id: string) => {
    const titleData = generatedTitles.find(t => t.id === id);
    if (!titleData) return;
    
    const newIsUsed = !titleData.isUsed;
    
    // Update local state
    setGeneratedTitles(prev => prev.map(t => 
      t.id === id ? { ...t, isUsed: newIsUsed } : t
    ));
    
    // Update in database
    if (user && currentAnalysisId) {
      const { data: existingTitle } = await supabase
        .from("generated_titles")
        .select("id")
        .eq("user_id", user.id)
        .eq("title_text", titleData.title)
        .eq("video_analysis_id", currentAnalysisId)
        .single();
      
      if (existingTitle) {
        await supabase
          .from("generated_titles")
          .update({ is_used: newIsUsed })
          .eq("id", existingTitle.id);
      }
    }
    
    toast({
      title: newIsUsed ? "Título marcado como utilizado" : "Título desmarcado",
      description: newIsUsed 
        ? "Este título foi marcado como já utilizado" 
        : "Este título foi desmarcado",
    });
  };

  const handleCreateAgent = (formula: ScriptFormulaAnalysis | null, transcription: string) => {
    setCurrentFormula(formula);
    setCurrentTranscription(transcription);
    setShowAgentModal(true);
  };

  return (
    <>
      <SEOHead
        title="Analisador de Vídeos"
        description="Analise vídeos virais do YouTube e gere títulos otimizados com IA."
        noindex={true}
      />
      <MainLayout>
        <PermissionGate permission="analisador_videos" featureName="Analisador de Vídeos">
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Session Indicator */}
          <SessionIndicator 
            storageKeys={[
              "analyzer_videoUrl", 
              "analyzer_videoInfo", 
              "analyzer_generatedTitles",
              "analyzer_currentTranscription"
            ]}
            label="Análise anterior"
            onClear={() => {
              setVideoUrl("");
              setVideoInfo(null);
              setGeneratedTitles([]);
              setSelectedTitles([]);
              setSelectedTitleForThumbnail("");
              setCurrentTranscription("");
              setCurrentAnalysisId(null);
            }}
          />

          {/* Header */}
          <div className="mb-8 mt-4 flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-3">
                Analisador de Títulos Virais
              </h1>
              <p className="text-lg text-muted-foreground">
                Cole uma URL de vídeo e o motor de IA para gerar títulos.
              </p>
            </div>
            <TutorialHelpButton onClick={openTutorial} />
          </div>

          {/* Input Section */}
          <Card className="p-8 mb-8 border-border/50">
            <div className="space-y-6">
              {/* URL Input */}
              <div>
                <label className="text-base text-muted-foreground mb-3 block">
                  URL do Vídeo Viral
                </label>
                <Input
                  data-tutorial="video-url-input"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="bg-secondary border-border h-12 text-base"
                />
              </div>

              {/* Options Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* AI Model */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <label className="text-base text-muted-foreground">Motor de IA</label>
                    <Badge variant="outline" className="text-primary border-primary text-sm px-3 py-1">
                      <Zap className="w-4 h-4 mr-1" />
                      Custo estimado: {aiModel === "multimodal" ? "12 créditos" : "3 créditos"}
                    </Badge>
                  </div>
                  <Select value={aiModel} onValueChange={setAiModel}>
                    <SelectTrigger className="bg-secondary border-border h-12 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="multimodal">Comparar (Multimodal)</SelectItem>
                      <SelectItem value="gpt-4.1">GPT-4.1</SelectItem>
                      <SelectItem value="claude-sonnet-4-20250514">Claude 4 Sonnet</SelectItem>
                      <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                      <SelectItem value="deepseek-r1">DeepSeek R1</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground mt-2">
                    {aiModel === "multimodal" ? "Multimodal: 20 títulos (5 de cada modelo)" : "Modo único: 5 títulos"}
                  </p>
                </div>

                {/* Language */}
                <div>
                  <label className="text-base text-muted-foreground mb-3 block">
                    Idioma dos Títulos
                  </label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="bg-secondary border-border h-12 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">🇧🇷 Português (PT-BR)</SelectItem>
                      <SelectItem value="en">🇺🇸 English</SelectItem>
                      <SelectItem value="es">🇪🇸 Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Save Folder */}
                <div>
                  <label className="text-base text-muted-foreground mb-3 block">
                    Salvar em... (Opcional)
                  </label>
                  <Select value={saveFolder} onValueChange={setSaveFolder}>
                    <SelectTrigger className="bg-secondary border-border h-12 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">Histórico Geral</SelectItem>
                      {folders?.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          {folder.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Analyze Button with Progress Bar */}
              <div className="space-y-3">
                <Button
                  data-tutorial="analyze-button"
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-14 text-lg font-semibold relative overflow-hidden"
                >
                  {analyzing ? (
                    <div className="flex items-center z-10 relative">
                      <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                      <span className="font-medium">{loadingMessage}</span>
                    </div>
                  ) : (
                    "Analisar e Gerar Títulos"
                  )}
                  {/* Progress bar overlay */}
                  {analyzing && (
                    <div 
                      className="absolute left-0 top-0 h-full bg-white/10 transition-all duration-300 ease-out"
                      style={{ width: `${loadingProgress}%` }}
                    />
                  )}
                </Button>
                
                {/* Progress indicator with percentage */}
                {analyzing && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Analisando vídeo viral...</span>
                      <span className="text-primary font-semibold">{Math.round(loadingProgress)}%</span>
                    </div>
                    <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary via-primary to-amber-400 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${loadingProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-center text-muted-foreground italic">
                      Nossa IA está extraindo os segredos do sucesso viral deste vídeo
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Video Info Card */}
          {videoInfo && (
            <Card className="p-6 mb-6 border-border/50">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Thumbnail */}
                <div className="relative flex-shrink-0">
                  <div className="w-full lg:w-48 h-28 bg-secondary rounded-lg overflow-hidden relative">
                    {videoInfo.thumbnail ? (
                      <img
                        src={videoInfo.thumbnail}
                        alt={videoInfo.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <Eye className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Video Details */}
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-foreground mb-1">
                    {videoInfo.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mb-3 italic">
                    {videoInfo.title}
                  </p>

                  {/* Stats */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {videoInfo.views.toLocaleString()} views
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {videoInfo.daysAgo} dias
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-4 h-4" />
                      {videoInfo.comments} comentários
                    </span>
                  </div>

                  {/* Revenue */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Receita Estimada:</p>
                      <p className="text-success font-semibold">${videoInfo.estimatedRevenue.usd}</p>
                      <p className="text-success text-sm">R$ {videoInfo.estimatedRevenue.brl}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">RPM (por 1K views):</p>
                      <p className="text-success font-semibold">${videoInfo.rpm.usd}</p>
                      <p className="text-success text-sm">R$ {videoInfo.rpm.brl}</p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mb-4">
                    * Valores baseados no nicho &quot;{videoInfo.niche}&quot;
                  </p>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handleDownloadThumbnail}>
                      <Download className="w-4 h-4 mr-2" />
                      Baixar Thumbnail Original
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-primary text-primary" 
                      onClick={handleLoadTranscription}
                      disabled={loadingTranscription}
                    >
                      {loadingTranscription ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <FileText className="w-4 h-4 mr-2" />
                      )}
                      {loadingTranscription ? "Transcrevendo..." : "Carregar Transcrição"}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Niche Tags */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="bg-secondary/50 p-4 rounded-lg border-l-4 border-destructive">
                  <p className="text-xs text-destructive font-semibold mb-1">NICHO DETETADO</p>
                  <div className="flex items-center justify-between">
                    <p className="text-foreground font-medium">{videoInfo.niche}</p>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyTitle("niche", videoInfo.niche)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="bg-secondary/50 p-4 rounded-lg border-l-4 border-primary">
                  <p className="text-xs text-primary font-semibold mb-1">SUBNICHO DETETADO</p>
                  <div className="flex items-center justify-between">
                    <p className="text-foreground font-medium">{videoInfo.subNiche}</p>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyTitle("subNiche", videoInfo.subNiche)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="bg-secondary/50 p-4 rounded-lg border-l-4 border-primary">
                  <p className="text-xs text-primary font-semibold mb-1">MICRO-NICHO DETETADO</p>
                  <div className="flex items-center justify-between">
                    <p className="text-foreground font-medium">{videoInfo.microNiche}</p>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyTitle("microNiche", videoInfo.microNiche)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Análise do Título Original */}
              {videoInfo.originalTitleAnalysis && (
                <Card className="mt-6 p-6 bg-secondary/30 border-border/50">
                  <h3 className="text-lg font-bold text-foreground mb-4">Análise do Título Original</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="font-semibold text-foreground">Motivo do Sucesso: </span>
                      <span className="text-muted-foreground">{videoInfo.originalTitleAnalysis.motivoSucesso}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-foreground">Fórmula: </span>
                      <code className="bg-primary/20 text-primary px-2 py-1 rounded text-sm">
                        {videoInfo.originalTitleAnalysis.formula}
                      </code>
                    </div>
                  </div>
                </Card>
              )}
            </Card>
          )}

          {/* Generated Titles */}
          {generatedTitles.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Títulos Gerados (Modelo: {aiModel === "gemini" ? "Gemini" : aiModel})
                </h3>
                <Button variant="outline" size="sm" onClick={handleAnalyze}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Gerar Mais Títulos
                </Button>
              </div>

              <div className="space-y-4">
                {generatedTitles.map((title) => (
                  <Card key={title.id} className={`p-4 border-border/50 transition-all duration-500 ${
                    title.isBest 
                      ? "ring-2 ring-primary/50 border-primary/50 bg-primary/5 animate-pulse-once" 
                      : ""
                  }`}>
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedTitles.includes(title.id)}
                        onCheckedChange={() => toggleTitleSelection(title.id, title.title)}
                        className="mt-1 data-[state=checked]:bg-success data-[state=checked]:border-success"
                      />
                      <div className="flex-1">
                        <div className="flex items-start gap-2 mb-2 flex-wrap">
                          <Badge 
                            variant="outline" 
                            className={`text-xs shrink-0 ${
                              title.model.includes("GPT") 
                                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30" 
                                : title.model.includes("Claude") 
                                  ? "bg-orange-500/10 text-orange-500 border-orange-500/30"
                                  : "bg-blue-500/10 text-blue-500 border-blue-500/30"
                            }`}
                          >
                            {title.model}
                          </Badge>
                          {title.isUsed && (
                            <Badge variant="outline" className="text-xs shrink-0 text-muted-foreground border-muted-foreground/50">
                              Utilizado
                            </Badge>
                          )}
                          <span 
                            className={`font-semibold cursor-pointer transition-all ${
                              title.isUsed 
                                ? "text-muted-foreground line-through opacity-60" 
                                : "text-foreground"
                            }`}
                            onClick={() => toggleTitleUsed(title.id)}
                            title={title.isUsed ? "Clique para desmarcar" : "Clique para marcar como utilizado"}
                          >
                            {title.title}
                          </span>
                        </div>
                        

                        <Collapsible>
                          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                            <Rocket className="w-4 h-4 text-primary" />
                            Análise da Estrutura/Fórmula
                            <ChevronDown className="w-4 h-4" />
                          </CollapsibleTrigger>
                          <CollapsibleContent className="mt-2 space-y-2">
                            <p className="text-sm text-muted-foreground">
                              <span className="font-medium">Fórmula original:</span>{" "}
                              <code className="bg-secondary px-2 py-0.5 rounded text-xs">
                                {title.formula}
                              </code>
                            </p>
                            <Badge variant="outline" className="text-xs text-primary border-primary">
                              <Rocket className="w-3 h-3 mr-1" />
                              Fórmula surpresa: {title.formulaSurpresa}
                            </Badge>
                          </CollapsibleContent>
                        </Collapsible>

                        {title.isBest && (
                          <p className="text-xs text-muted-foreground mt-2">
                            Este título equilibra Qualidade ({title.quality}/10) e Impacto ({title.impact}/10) com score{" "}
                            {((title.quality + title.impact) / 2).toFixed(2)}. Mantém a mesma estrutura do original.
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                          <div className="flex flex-col items-center gap-2">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-success text-success bg-success/10">
                                <Check className="w-3 h-3 mr-1" />
                                Qualidade {title.quality}/10
                              </Badge>
                              <Badge className="bg-primary text-primary-foreground">
                                <Rocket className="w-3 h-3 mr-1" />
                                Impacto {title.impact}/10
                              </Badge>
                            </div>
                            
                            {/* Best title badge below quality/impact - aligned and same width */}
                            {title.isBest && (
                              <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30 justify-center py-1.5 w-full">
                                <Rocket className="w-3 h-3 mr-1" />
                                Melhor título
                              </Badge>
                            )}
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyTitle(title.id, title.title)}
                            className="h-8 w-8"
                          >
                            {copiedId === title.id ? (
                              <Check className="w-4 h-4 text-success" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Transcription Section */}
          {videoInfo && (
            <div className="mt-8">
              <TranscriptionSection 
                onCreateAgent={handleCreateAgent} 
                videoUrl={videoUrl}
                externalTranscription={currentTranscription}
                onTranscriptionChange={setCurrentTranscription}
              />
            </div>
          )}

          {/* Thumbnail Library - Always visible after analysis */}
          {videoInfo && (
            <div className="mt-8">
              <ThumbnailLibrary
                currentNiche={videoInfo.niche}
                currentSubNiche={videoInfo.subNiche}
                currentTitle={selectedTitleForThumbnail || videoInfo.title}
              />
            </div>
          )}

          {/* Empty State */}
          {!videoInfo && !analyzing && (
            <Card className="p-12 text-center border-border/50">
              <Rocket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Pronto para analisar
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Cole uma URL de vídeo do YouTube acima para analisar a fórmula do título e gerar novas variações otimizadas.
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Create Agent Modal */}
      <CreateAgentModal
        open={showAgentModal}
        onOpenChange={setShowAgentModal}
        formula={currentFormula}
        videoTitle={videoInfo?.title || ""}
        niche={videoInfo?.niche || ""}
        subNiche={videoInfo?.subNiche || ""}
      />
      {/* Tutorial Modal */}
      <TutorialModal
        open={showTutorial}
        onOpenChange={(open) => !open && completeTutorial()}
        title={VIDEO_ANALYZER_TUTORIAL.title}
        description={VIDEO_ANALYZER_TUTORIAL.description}
        steps={VIDEO_ANALYZER_TUTORIAL.steps}
        onComplete={completeTutorial}
      />
        </PermissionGate>
      </MainLayout>
    </>
  );
};

export default VideoAnalyzer;
