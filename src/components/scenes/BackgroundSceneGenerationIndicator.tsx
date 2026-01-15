import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { X, FileText, Loader2, CheckCircle2, Clock, Sparkles, Download, Images } from "lucide-react";
import { useState, useEffect } from "react";
import logo1 from "@/assets/logo_1.gif";

export interface SceneGenerationState {
  isGenerating: boolean;
  status: "generating" | "complete";
  currentSceneCount: number;
  totalExpectedScenes: number;
  progress: number;
  wordCount: number;
  wordsPerScene: string;
  startTime: number | null;
}

interface BackgroundSceneGenerationIndicatorProps {
  state: SceneGenerationState;
  onCancel: () => void;
  onComplete: () => void;
  onDownloadTxt: () => void;
  onGoToBatch: () => void;
  firstPromptPreview?: string;
}

export const BackgroundSceneGenerationIndicator = ({
  state,
  onCancel,
  onComplete,
  onDownloadTxt,
  onGoToBatch,
  firstPromptPreview
}: BackgroundSceneGenerationIndicatorProps) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  
  useEffect(() => {
    if (!state.isGenerating || !state.startTime) {
      setElapsedTime(0);
      return;
    }
    
    setElapsedTime(Math.floor((Date.now() - state.startTime) / 1000));
    
    const interval = setInterval(() => {
      if (state.startTime) {
        setElapsedTime(Math.floor((Date.now() - state.startTime) / 1000));
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [state.isGenerating, state.startTime]);

  if (!state.isGenerating && state.status !== "complete") return null;

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Calcular tempo restante estimado
  const elapsed = state.startTime ? (Date.now() - state.startTime) / 1000 : 0;
  const avgTimePerScene = state.currentSceneCount > 0 ? elapsed / state.currentSceneCount : 5;
  const remaining = state.totalExpectedScenes - state.currentSceneCount;
  const estimatedRemaining = Math.round(remaining * avgTimePerScene);

  if (isMinimized && state.status === "generating") {
    return (
      <div 
        className="fixed bottom-4 right-4 z-50 bg-card border border-primary/30 rounded-full shadow-lg p-3 cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => setIsMinimized(false)}
      >
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
            <img 
              src={logo1}
              alt="Processando"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute inset-0 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {state.currentSceneCount}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-card border border-primary/30 rounded-lg shadow-lg p-4 w-80">
      {state.status === "generating" ? (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                  <img 
                    src={logo1}
                    alt="Processando"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute inset-0 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
              </div>
              <span className="text-sm font-medium text-foreground">
                Gerando Prompts de Cenas
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setIsMinimized(true)}
                title="Minimizar"
              >
                <span className="text-xs">−</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive"
                onClick={onCancel}
                title="Cancelar"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-2 mb-2 px-2 py-1 bg-primary/10 rounded-md border border-primary/20">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span className="text-sm font-mono font-semibold text-primary">
              {formatTime(elapsedTime)}
            </span>
            <span className="text-xs text-muted-foreground ml-auto">
              {estimatedRemaining > 0 && state.currentSceneCount > 0 && `~${formatTime(estimatedRemaining)} restante`}
            </span>
          </div>

          <Progress value={state.progress} className="h-2 mb-2" />

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{state.currentSceneCount}/{state.totalExpectedScenes} cenas</span>
            <span>{Math.round(state.progress)}%</span>
          </div>

          <div className="text-center text-xs text-muted-foreground mt-2">
            <p>{state.wordCount} palavras • {state.wordsPerScene} palavras/cena</p>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              <span className="text-sm font-medium text-foreground">
                Prompts Gerados!
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onComplete}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center justify-center py-2">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-1">
                {state.currentSceneCount}
              </div>
              <p className="text-xs text-muted-foreground">prompts gerados</p>
            </div>
          </div>

          {firstPromptPreview && (
            <div className="p-2 bg-secondary/50 rounded-lg mb-3">
              <p className="text-[10px] text-muted-foreground mb-0.5">Preview:</p>
              <p className="text-xs text-foreground line-clamp-2">
                {firstPromptPreview.substring(0, 100)}...
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8"
              onClick={onDownloadTxt}
            >
              <Download className="w-3 h-3 mr-2" />
              Baixar TXT
            </Button>
            <Button
              size="sm"
              className="w-full h-8"
              onClick={onGoToBatch}
            >
              <Images className="w-3 h-3 mr-2" />
              Gerar Imagens em Lote
            </Button>
          </div>
        </>
      )}
    </div>
  );
};
