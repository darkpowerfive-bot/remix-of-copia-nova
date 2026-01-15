import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, AlertTriangle, CheckCircle2 } from "lucide-react";

interface KenBurnsComparisonPreviewProps {
  className?: string;
}

export const KenBurnsComparisonPreview = ({ className }: KenBurnsComparisonPreviewProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showComparison, setShowComparison] = useState<'old' | 'new' | 'both'>('both');
  
  const animationDuration = 4000; // 4 seconds

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return prev + (100 / (animationDuration / 50));
        });
      }, 50);
    }

    return () => clearInterval(interval);
  }, [isPlaying]);

  const resetAnimation = () => {
    setProgress(0);
    setIsPlaying(false);
  };

  // Old scale values (1.0 base - causes black borders)
  const oldStartScale = 1.0;
  const oldEndScale = 1.12; // Zoom in effect
  const oldCurrentScale = oldStartScale + ((oldEndScale - oldStartScale) * (progress / 100));

  // New scale values (1.08 base - safe, no borders)
  const newStartScale = 1.08;
  const newEndScale = 1.14; // Zoom in effect
  const newCurrentScale = newStartScale + ((newEndScale - newStartScale) * (progress / 100));

  // Pan movement for demonstration
  const panX = Math.sin((progress / 100) * Math.PI) * 3;
  const panY = Math.cos((progress / 100) * Math.PI) * 2;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-semibold text-foreground">Comparação Ken Burns</h4>
          <p className="text-xs text-muted-foreground">Escala de segurança: evita bordas pretas</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowComparison(showComparison === 'both' ? 'old' : showComparison === 'old' ? 'new' : 'both')}
            className="text-xs h-7"
          >
            {showComparison === 'both' ? 'Lado a Lado' : showComparison === 'old' ? 'Antigo' : 'Novo'}
          </Button>
        </div>
      </div>

      {/* Preview Container */}
      <div className={cn(
        "grid gap-3",
        showComparison === 'both' ? "grid-cols-2" : "grid-cols-1"
      )}>
        {/* Old Method Preview */}
        {(showComparison === 'both' || showComparison === 'old') && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-xs font-medium text-red-500">Método Antigo (100%)</span>
            </div>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden border-2 border-red-500/50">
              {/* Black background visible when scale is 1.0 */}
              <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />
              
              {/* Image simulation with old scale */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-amber-600 via-orange-500 to-red-500"
                style={{
                  scale: oldCurrentScale,
                  x: panX,
                  y: panY,
                }}
              >
                {/* Simulated landscape */}
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-emerald-800 to-emerald-600 opacity-80" />
                <div className="absolute top-1/4 left-1/4 w-1/5 h-1/4 rounded-full bg-yellow-300/80" />
                <div className="absolute bottom-1/4 right-1/4 w-8 h-12 bg-emerald-900/50 rounded-t-full" />
                <div className="absolute bottom-1/4 right-1/3 w-6 h-8 bg-emerald-800/50 rounded-t-full" />
              </motion.div>
              
              {/* Border warning indicator */}
              {progress > 0 && oldCurrentScale < 1.05 && (
                <div className="absolute inset-0 border-4 border-red-500 animate-pulse pointer-events-none">
                  <div className="absolute top-1 left-1 bg-red-500 text-white text-[8px] px-1 rounded">
                    ⚠️ BORDA VISÍVEL
                  </div>
                </div>
              )}
              
              {/* Scale indicator */}
              <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                Scale: {(oldCurrentScale * 100).toFixed(0)}%
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground text-center">
              Escala inicial 100% → bordas pretas aparecem nos cantos
            </div>
          </div>
        )}

        {/* New Method Preview */}
        {(showComparison === 'both' || showComparison === 'new') && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-xs font-medium text-green-500">Método Novo (108%)</span>
            </div>
            <div className="relative aspect-video bg-black rounded-lg overflow-hidden border-2 border-green-500/50">
              {/* Black background - but won't be visible with safe scale */}
              <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />
              
              {/* Image simulation with new safe scale */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-amber-600 via-orange-500 to-red-500"
                style={{
                  scale: newCurrentScale,
                  x: panX,
                  y: panY,
                }}
              >
                {/* Simulated landscape */}
                <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-emerald-800 to-emerald-600 opacity-80" />
                <div className="absolute top-1/4 left-1/4 w-1/5 h-1/4 rounded-full bg-yellow-300/80" />
                <div className="absolute bottom-1/4 right-1/4 w-8 h-12 bg-emerald-900/50 rounded-t-full" />
                <div className="absolute bottom-1/4 right-1/3 w-6 h-8 bg-emerald-800/50 rounded-t-full" />
              </motion.div>
              
              {/* Safe indicator */}
              <div className="absolute top-1 right-1 bg-green-500/80 text-white text-[8px] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                <CheckCircle2 className="w-2.5 h-2.5" />
                SEGURO
              </div>
              
              {/* Scale indicator */}
              <div className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-mono">
                Scale: {(newCurrentScale * 100).toFixed(0)}%
              </div>
            </div>
            <div className="text-[10px] text-muted-foreground text-center">
              Escala mínima 108% → imagem sempre cobre toda a tela
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsPlaying(!isPlaying)}
          className="text-xs"
        >
          {isPlaying ? (
            <>
              <Pause className="w-3 h-3 mr-1" />
              Pausar
            </>
          ) : (
            <>
              <Play className="w-3 h-3 mr-1" />
              Reproduzir
            </>
          )}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={resetAnimation}
          className="text-xs"
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Reiniciar
        </Button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>0s</span>
          <span>{((progress / 100) * 4).toFixed(1)}s</span>
          <span>4s</span>
        </div>
      </div>

      {/* Technical Details */}
      <div className="bg-secondary/30 rounded-lg p-3 space-y-2">
        <p className="text-xs font-medium text-amber-500">📋 Detalhes Técnicos:</p>
        <div className="grid grid-cols-2 gap-3 text-[10px]">
          <div className="space-y-1">
            <p className="text-red-400 font-medium">❌ Antigo:</p>
            <ul className="text-muted-foreground space-y-0.5 ml-2">
              <li>• Escala base: 100%</li>
              <li>• Pan máximo: ±10%</li>
              <li>• Problema: bordas pretas</li>
            </ul>
          </div>
          <div className="space-y-1">
            <p className="text-green-400 font-medium">✅ Novo:</p>
            <ul className="text-muted-foreground space-y-0.5 ml-2">
              <li>• Escala base: 108%</li>
              <li>• Pan máximo: ±4%</li>
              <li>• Resultado: tela 100% coberta</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};