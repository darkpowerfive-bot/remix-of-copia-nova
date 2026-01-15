import { useBackgroundImageGeneration } from "@/hooks/useBackgroundImageGeneration";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { X, Image, Loader2, Rocket, Wand2, Clock } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

export const BackgroundGenerationIndicator = () => {
  const { state, cancelGeneration } = useBackgroundImageGeneration();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Timer em tempo real
  const [elapsedTime, setElapsedTime] = useState(0);
  
  useEffect(() => {
    if (!state.isGenerating || !state.startTime) {
      setElapsedTime(0);
      return;
    }
    
    // Atualizar imediatamente
    setElapsedTime(Math.floor((Date.now() - state.startTime) / 1000));
    
    // Atualizar a cada segundo
    const interval = setInterval(() => {
      if (state.startTime) {
        setElapsedTime(Math.floor((Date.now() - state.startTime) / 1000));
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [state.isGenerating, state.startTime]);

  // Não mostrar na página /prompts - lá já tem o progresso na interface
  if (!state.isGenerating || location.pathname === '/prompts') return null;

  const percentage = state.totalImages > 0 
    ? Math.round((state.completedImages / state.totalImages) * 100) 
    : 0;

  // Calcular tempo restante
  const elapsed = state.startTime ? (Date.now() - state.startTime) / 1000 : 0;
  const avgTimePerImage = state.completedImages > 0 ? elapsed / state.completedImages : 10;
  const remaining = state.totalImages - state.completedImages;
  const estimatedRemaining = Math.round(remaining * avgTimePerImage);
  
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const { rewriteProgress } = state;

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 bg-card border border-primary/30 rounded-lg shadow-lg p-4 w-80 cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => navigate('/prompts')}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            {rewriteProgress.isRewriting ? (
              <Rocket className="h-5 w-5 text-amber-500 animate-pulse" />
            ) : (
              <>
                <Image className="h-5 w-5 text-primary" />
                <Loader2 className="h-3 w-3 text-primary animate-spin absolute -top-1 -right-1" />
              </>
            )}
          </div>
          <span className="text-sm font-medium text-foreground">
            {rewriteProgress.isRewriting 
              ? `Reescrevendo prompt #${rewriteProgress.sceneNumber}`
              : 'Gerando imagens em background'
            }
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation();
            cancelGeneration();
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Timer em tempo real */}
      <div className="flex items-center gap-2 mb-2 px-2 py-1 bg-primary/10 rounded-md border border-primary/20">
        <Clock className="h-3.5 w-3.5 text-primary" />
        <span className="text-sm font-mono font-semibold text-primary">
          {formatTime(elapsedTime)}
        </span>
        <span className="text-xs text-muted-foreground ml-auto">
          Tempo decorrido
        </span>
      </div>

      {/* Indicador de reescrita de prompt bloqueado */}
      {rewriteProgress.isRewriting && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2 mb-2">
          <div className="flex items-center gap-2 mb-1">
            <Wand2 className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-medium text-amber-500">
              IA reescrevendo prompt bloqueado (tentativa {rewriteProgress.attemptNumber}/2)
            </span>
          </div>
          {rewriteProgress.originalPrompt && (
            <p className="text-[10px] text-muted-foreground line-clamp-1">
              Original: "{rewriteProgress.originalPrompt.substring(0, 40)}..."
            </p>
          )}
          {rewriteProgress.newPrompt && (
            <p className="text-[10px] text-amber-400/80 line-clamp-1 mt-0.5">
              Novo: "{rewriteProgress.newPrompt.substring(0, 40)}..."
            </p>
          )}
        </div>
      )}

      <Progress value={percentage} className="h-2 mb-2" />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{state.completedImages}/{state.totalImages} imagens</span>
        <span>{percentage}%</span>
        {estimatedRemaining > 0 && state.completedImages > 0 && (
          <span>~{formatTime(estimatedRemaining)} restante</span>
        )}
      </div>

      {state.currentPrompt && !rewriteProgress.isRewriting && (
        <p className="text-xs text-muted-foreground mt-2 line-clamp-1 italic">
          "{state.currentPrompt.substring(0, 50)}..."
        </p>
      )}
    </div>
  );
};
