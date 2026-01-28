import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Clipboard,
  Copy,
  Trash2,
  Loader2,
  Rocket,
  Bot,
  Zap,
  Download,
  Eye,
  ThumbsUp,
  MessageSquare,
  Calendar,
  Clock,
  Tag,
  User,
  AlertCircle,
  Key,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCreditDeduction } from "@/hooks/useCreditDeduction";

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

interface VideoDetails {
  title: string;
  description: string;
  channelTitle: string;
  views: number;
  likes: number;
  comments: number;
  daysAgo: number;
  thumbnail: string;
  tags: string[];
  duration: number;
}

interface TranscriptionSectionProps {
  onCreateAgent: (formula: ScriptFormulaAnalysis | null, transcription: string) => void;
  videoUrl?: string;
  externalTranscription?: string;
  onTranscriptionChange?: (transcription: string) => void;
}

export const TranscriptionSection = ({ 
  onCreateAgent, 
  videoUrl, 
  externalTranscription,
  onTranscriptionChange 
}: TranscriptionSectionProps) => {
  const { deduct, usePlatformCredits } = useCreditDeduction();
  const [transcription, setTranscription] = useState(externalTranscription || "");
  const [analyzing, setAnalyzing] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [formulaAnalysis, setFormulaAnalysis] = useState<ScriptFormulaAnalysis | null>(null);
  const [videoDetails, setVideoDetails] = useState<VideoDetails | null>(null);
  const [noSubtitlesMessage, setNoSubtitlesMessage] = useState<string | null>(null);
  const { toast } = useToast();
  
  // Sync with external transcription when it changes
  React.useEffect(() => {
    if (externalTranscription && externalTranscription !== transcription) {
      setTranscription(externalTranscription);
    }
  }, [externalTranscription]);
  
  const ANALYSIS_CREDITS = 5; // analyze_script_formula = 5 créditos

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setTranscription(text);
      setNoSubtitlesMessage(null);
      toast({ title: "Colado!", description: "Transcrição colada da área de transferência" });
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível acessar a área de transferência",
        variant: "destructive",
      });
    }
  };

  const handleCopyTranscription = async () => {
    if (!transcription) return;
    await navigator.clipboard.writeText(transcription);
    toast({ title: "Copiado!", description: "Transcrição copiada" });
  };

  const handleClearField = () => {
    setTranscription("");
    setFormulaAnalysis(null);
    setVideoDetails(null);
    setNoSubtitlesMessage(null);
  };

  const handleAnalyzeFormula = async () => {
    if (!transcription.trim()) {
      toast({
        title: "Erro",
        description: "Cole ou carregue uma transcrição primeiro",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);

    // CRÍTICO: Deduzir créditos ANTES da análise
    let deductionResult: { success: boolean; refund: () => Promise<void> } | null = null;
    
    if (usePlatformCredits !== false) {
      deductionResult = await deduct({
        operationType: 'analyze_script_formula',
        customAmount: ANALYSIS_CREDITS,
        details: { textLength: transcription.length }
      });

      if (!deductionResult.success) {
        setAnalyzing(false);
        return;
      }
    }

    try {
      const response = await supabase.functions.invoke("ai-assistant", {
        body: {
          type: "analyze_script_formula",
          text: transcription,
        },
      });

      if (response.error) throw response.error;

      let result = response.data.result;
      if (typeof result === "string") {
        const jsonMatch = result.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
          result = JSON.parse(jsonMatch[1].trim());
        } else {
          result = JSON.parse(result);
        }
      }

      setFormulaAnalysis(result);
      toast({ title: "Análise concluída!", description: "Fórmula viral identificada" });
    } catch (error) {
      console.error("Error analyzing formula:", error);
      toast({
        title: "Erro na análise",
        description: "Não foi possível analisar a fórmula do roteiro",
        variant: "destructive",
      });
      
      // Reembolsar créditos em caso de erro
      if (deductionResult?.refund) {
        await deductionResult.refund();
      }
    } finally {
      setAnalyzing(false);
    }
  };

  const handleAutoTranscribe = async () => {
    if (!videoUrl) {
      toast({
        title: "Erro",
        description: "Nenhuma URL de vídeo disponível. Analise um vídeo primeiro.",
        variant: "destructive",
      });
      return;
    }

    setTranscribing(true);
    setNoSubtitlesMessage(null);
    
    try {
      const response = await supabase.functions.invoke("transcribe-video", {
        body: { videoUrl },
      });

      if (response.error) throw response.error;

      // Store video details if available
      if (response.data.videoDetails) {
        setVideoDetails(response.data.videoDetails);
      }

      if (response.data.transcription && response.data.transcription.length > 0) {
        setTranscription(response.data.transcription);
        toast({
          title: "Transcrição concluída!",
          description: `Idioma detectado: ${response.data.language || "auto"}`,
        });
      } else if (response.data.message) {
        setNoSubtitlesMessage(response.data.message);
        toast({
          title: "Dados do vídeo carregados",
          description: response.data.message,
          variant: "destructive",
        });
      } else {
        setNoSubtitlesMessage("Este vídeo não possui legendas disponíveis. Cole a transcrição manualmente.");
        toast({
          title: "Sem legendas",
          description: "Este vídeo não possui legendas. Cole a transcrição manualmente.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error transcribing:", error);
      toast({
        title: "Erro na transcrição",
        description: "Não foi possível transcrever o vídeo automaticamente. Tente colar manualmente.",
        variant: "destructive",
      });
    } finally {
      setTranscribing(false);
    }
  };

  const handleLoadFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt,.srt,.vtt";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const text = await file.text();
        setTranscription(text);
        setNoSubtitlesMessage(null);
        toast({
          title: "Transcrição carregada!",
          description: `Arquivo ${file.name} carregado`,
        });
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      {/* Video Details Card */}
      {videoDetails && (
        <Card className="p-6 border-primary/30 bg-card">
          <div className="flex items-start gap-4">
            {videoDetails.thumbnail && (
              <img 
                src={videoDetails.thumbnail} 
                alt={videoDetails.title}
                className="w-48 h-28 object-cover rounded-lg border border-border"
              />
            )}
            <div className="flex-1 space-y-3">
              <h3 className="text-lg font-bold text-foreground line-clamp-2">{videoDetails.title}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="w-4 h-4" />
                <span>{videoDetails.channelTitle}</span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Eye className="w-4 h-4 text-primary" />
                  <span className="text-foreground font-medium">{formatNumber(videoDetails.views)}</span> views
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <ThumbsUp className="w-4 h-4 text-primary" />
                  <span className="text-foreground font-medium">{formatNumber(videoDetails.likes)}</span> likes
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  <span className="text-foreground font-medium">{formatNumber(videoDetails.comments)}</span> comentários
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="text-foreground font-medium">{videoDetails.daysAgo}</span> dias atrás
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  <span className="text-foreground font-medium">{formatDuration(videoDetails.duration)}</span>
                </div>
              </div>
              {videoDetails.tags && videoDetails.tags.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap">
                  <Tag className="w-4 h-4 text-primary" />
                  {videoDetails.tags.slice(0, 6).map((tag, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {videoDetails.tags.length > 6 && (
                    <span className="text-xs text-muted-foreground">+{videoDetails.tags.length - 6} mais</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* No Subtitles Warning */}
      {noSubtitlesMessage && (
        <Card className="p-4 border-destructive/50 bg-destructive/10">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <p className="text-sm text-destructive">{noSubtitlesMessage}</p>
          </div>
        </Card>
      )}

      {/* Transcription Card */}
      <Card className="p-6 border-border/50">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <FileText className="w-6 h-6 text-primary" />
            <h3 className="text-xl font-bold text-foreground">Transcrição Completa do Vídeo</h3>
          </div>
          <div className="flex items-center gap-2">
            {usePlatformCredits === false ? (
              <Badge variant="outline" className="text-green-500 border-green-500/50 bg-green-500/10 text-sm px-3 py-1">
                <Key className="w-4 h-4 mr-1" />
                Usando sua API
              </Badge>
            ) : (
              <Badge variant="outline" className="text-primary border-primary text-sm px-3 py-1">
                <Zap className="w-4 h-4 mr-1" />
                Custo estimado: {ANALYSIS_CREDITS} créditos
              </Badge>
            )}
          </div>
        </div>

        <p className="text-base text-muted-foreground mb-4">
          Cole o roteiro manualmente ou clique em &quot;Buscar Transcrição&quot; para carregar automaticamente.
        </p>

        <Textarea
          placeholder="Cole aqui a transcrição completa do vídeo ou clique em 'Buscar Transcrição' para carregar automaticamente."
          value={transcription}
          onChange={(e) => setTranscription(e.target.value)}
          className="min-h-[200px] bg-secondary border-border resize-y mb-4 text-base"
        />

        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={handleAutoTranscribe}
            disabled={transcribing || !videoUrl}
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground h-11 text-base"
          >
            {transcribing ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Download className="w-5 h-5 mr-2" />
            )}
            Buscar Transcrição
          </Button>
          <Button variant="outline" size="lg" onClick={handlePasteFromClipboard} className="h-11 text-base">
            <Clipboard className="w-5 h-5 mr-2" />
            Colar do Clipboard
          </Button>
          <Button variant="outline" size="lg" onClick={handleCopyTranscription} disabled={!transcription} className="h-11 text-base">
            <Copy className="w-5 h-5 mr-2" />
            Copiar
          </Button>
          <Button variant="outline" size="lg" onClick={handleClearField} className="h-11 text-base">
            <Trash2 className="w-5 h-5 mr-2" />
            Limpar
          </Button>
          <Button 
            size="lg"
            onClick={handleAnalyzeFormula}
            disabled={analyzing || !transcription.trim()}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 h-11 text-base"
          >
            {analyzing ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Rocket className="w-5 h-5 mr-2" />
            )}
            Analisar Fórmula Viral
          </Button>
          <Button 
            size="lg"
            onClick={() => onCreateAgent(formulaAnalysis, transcription)}
            disabled={!formulaAnalysis}
            className="bg-success text-success-foreground hover:bg-success/90 h-11 text-base"
          >
            <Bot className="w-5 h-5 mr-2" />
            Criar Agente
          </Button>
        </div>
      </Card>

      {/* Formula Analysis Result */}
      <Card className="p-6 border-border/50 bg-secondary/30">
        <h3 className="text-xl font-bold text-foreground mb-4">Fórmula de Sucesso Detectada</h3>
        {formulaAnalysis ? (
          <div className="space-y-4">
            <div>
              <span className="font-semibold text-foreground">Motivo do Sucesso: </span>
              <span className="text-muted-foreground">{formulaAnalysis.motivoSucesso}</span>
            </div>
            <div>
              <span className="font-semibold text-foreground">Fórmula: </span>
              <code className="bg-primary/20 text-primary px-2 py-1 rounded text-sm">
                {formulaAnalysis.formula}
              </code>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-secondary/50 p-4 rounded-lg">
                <p className="text-xs text-primary font-semibold mb-2">ESTRUTURA DO ROTEIRO</p>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium text-foreground">Hook:</span> <span className="text-muted-foreground">{formulaAnalysis.estrutura.hook}</span></p>
                  <p><span className="font-medium text-foreground">Desenvolvimento:</span> <span className="text-muted-foreground">{formulaAnalysis.estrutura.desenvolvimento}</span></p>
                  <p><span className="font-medium text-foreground">Clímax:</span> <span className="text-muted-foreground">{formulaAnalysis.estrutura.climax}</span></p>
                  <p><span className="font-medium text-foreground">CTA:</span> <span className="text-muted-foreground">{formulaAnalysis.estrutura.cta}</span></p>
                </div>
              </div>
              <div className="bg-secondary/50 p-4 rounded-lg">
                <p className="text-xs text-primary font-semibold mb-2">GATILHOS MENTAIS IDENTIFICADOS</p>
                <div className="flex flex-wrap gap-2">
                  {formulaAnalysis.gatilhosMentais.map((gatilho, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {gatilho}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  <span className="font-medium text-foreground">Tempo ideal:</span> {formulaAnalysis.tempoTotal}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">
            Cole ou carregue o roteiro e clique em &quot;Analisar Fórmula Viral&quot;.
          </p>
        )}
      </Card>
    </div>
  );
};
