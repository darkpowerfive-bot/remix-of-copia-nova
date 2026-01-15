import { motion, Easing } from "framer-motion";
import { cn } from "@/lib/utils";
import { CapcutTemplate } from "@/lib/capcutTemplates";

interface TemplatePreviewProps {
  template: CapcutTemplate;
  isActive: boolean;
}

/**
 * Preview visual animado mostrando como cada transição funciona
 */
export const TemplatePreview = ({ template, isActive }: TemplatePreviewProps) => {
  // Cores das "cenas" na mini-timeline
  const sceneColors = [
    "bg-gradient-to-br from-primary/60 to-primary/40",
    "bg-gradient-to-br from-amber-500/60 to-amber-500/40",
    "bg-gradient-to-br from-emerald-500/60 to-emerald-500/40",
  ];

  const easeInOut: Easing = "easeInOut";
  const easeOut: Easing = "easeOut";

  // Animações baseadas no tipo de transição
  const getTransitionAnimation = () => {
    const baseDuration = template.transitionDuration || 0.5;
    
    switch (template.transitionType) {
      case 'fade':
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: baseDuration, ease: easeInOut }
        };
      case 'slide':
        return {
          initial: { x: "100%" },
          animate: { x: 0 },
          transition: { duration: baseDuration, ease: easeOut }
        };
      case 'zoom':
        return {
          initial: { scale: 0.5, opacity: 0 },
          animate: { scale: 1, opacity: 1 },
          transition: { duration: baseDuration, ease: easeOut }
        };
      case 'blur':
        return {
          initial: { opacity: 0, filter: "blur(10px)" },
          animate: { opacity: 1, filter: "blur(0px)" },
          transition: { duration: baseDuration, ease: easeInOut }
        };
      default: // 'none' - corte direto
        return {
          initial: { opacity: 1 },
          animate: { opacity: 1 },
          transition: { duration: 0, ease: easeInOut }
        };
    }
  };

  // Obter cor do color grading
  const getColorGradingOverlay = () => {
    if (!template.hasColorGrading) return null;
    switch (template.colorGradingType) {
      case 'warm':
        return 'bg-gradient-to-br from-orange-500/20 to-amber-500/10';
      case 'cold':
        return 'bg-gradient-to-br from-blue-500/20 to-cyan-500/10';
      case 'vintage':
        return 'bg-gradient-to-br from-amber-600/30 to-yellow-500/10 sepia';
      case 'cinematic':
        return 'bg-gradient-to-br from-amber-500/15 to-orange-500/10';
      case 'bw':
        return 'bg-black/0'; // Handled separately with grayscale
      default:
        return null;
    }
  };

  const colorGradingOverlay = getColorGradingOverlay();
  const isBlackAndWhite = template.colorGradingType === 'bw';

  return (
    <div className="w-full space-y-2">
      {/* Mini Timeline Visual */}
      <div className="relative h-16 bg-background/80 rounded-lg border border-border overflow-hidden">
        {/* Fundo com grid */}
        <div className="absolute inset-0 opacity-30">
          <div className="h-full w-full" style={{
            backgroundImage: "repeating-linear-gradient(90deg, hsl(var(--border)) 0px, hsl(var(--border)) 1px, transparent 1px, transparent 20px)",
            backgroundSize: "20px 100%"
          }} />
        </div>

        {/* Cenas na timeline */}
        <div className={cn(
          "relative h-full flex items-center px-2 gap-1",
          isBlackAndWhite && "grayscale"
        )}>
          {sceneColors.map((color, idx) => (
            <motion.div
              key={idx}
              className={cn(
                "relative h-10 flex-1 rounded overflow-hidden",
                color
              )}
              initial={isActive ? getTransitionAnimation().initial : { opacity: 1 }}
              animate={isActive ? getTransitionAnimation().animate : { opacity: 1 }}
              transition={{
                ...getTransitionAnimation().transition,
                delay: idx * 0.8
              }}
              style={template.hasSlowMotion ? { 
                animationDuration: `${2 / (template.slowMotionFactor || 1)}s` 
              } : undefined}
            >
              {/* Conteúdo da cena */}
              <motion.div 
                className="absolute inset-0 flex items-center justify-center"
                animate={isActive && template.hasKenBurns ? { scale: [1, 1.05, 1] } : undefined}
                transition={isActive && template.hasKenBurns ? { duration: 3, repeat: Infinity, ease: easeInOut } : undefined}
              >
                <span className="text-[10px] font-bold text-white/80 drop-shadow">
                  {idx + 1}
                </span>
              </motion.div>

              {/* Color grading overlay */}
              {colorGradingOverlay && (
                <div className={cn("absolute inset-0 pointer-events-none", colorGradingOverlay)} />
              )}

              {/* Efeito vinheta */}
              {template.hasVignette && (
                <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/30 pointer-events-none" />
              )}

              {/* Blur overlay */}
              {template.hasBlur && idx === 1 && isActive && (
                <motion.div 
                  className="absolute inset-0 backdrop-blur-sm pointer-events-none"
                  animate={{ opacity: [0, 0.5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: easeInOut }}
                />
              )}

              {/* Indicador de transição entre cenas */}
              {idx < sceneColors.length - 1 && template.transitionType !== 'none' && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10">
                  <motion.div
                    className="w-3 h-3 rounded-full bg-primary/80 border border-primary shadow-lg shadow-primary/50"
                    animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                    transition={{ duration: 0.5, repeat: Infinity, delay: idx * 0.8 + 0.3 }}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Label do tempo */}
        <div className="absolute bottom-0 left-0 right-0 h-3 bg-secondary/80 flex items-center justify-between px-2">
          <span className="text-[8px] text-muted-foreground">00:00</span>
          <span className="text-[8px] text-muted-foreground">00:15</span>
          <span className="text-[8px] text-muted-foreground">00:30</span>
        </div>
      </div>

      {/* Preview de transição em tempo real */}
      {isActive && template.transitionType !== 'none' && (
        <div className="relative h-20 bg-background/50 rounded-lg border border-border overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-32 h-16 overflow-hidden rounded">
              {/* Cena A (saindo) */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center"
                animate={
                  template.transitionType === 'fade' ? { opacity: [1, 0, 1] } :
                  template.transitionType === 'slide' ? { x: [0, "-100%", 0] } :
                  template.transitionType === 'zoom' ? { scale: [1, 0.5, 1], opacity: [1, 0, 1] } :
                  {}
                }
                transition={{ duration: 2, repeat: Infinity, ease: easeInOut }}
              >
                <span className="text-xs font-bold text-white">Cena A</span>
              </motion.div>

              {/* Cena B (entrando) */}
              <motion.div
                className={cn(
                  "absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-500/60 flex items-center justify-center",
                  isBlackAndWhite && "grayscale"
                )}
                initial={{ opacity: 0 }}
                animate={
                  template.transitionType === 'fade' ? { opacity: [0, 1, 0] } :
                  template.transitionType === 'slide' ? { x: ["100%", 0, "100%"] } :
                  template.transitionType === 'zoom' ? { scale: [0.5, 1, 0.5], opacity: [0, 1, 0] } :
                  template.transitionType === 'blur' ? { opacity: [0, 1, 0], filter: ["blur(10px)", "blur(0px)", "blur(10px)"] } :
                  {}
                }
                transition={{ duration: 2, repeat: Infinity, ease: easeInOut }}
              >
                <span className="text-xs font-bold text-white">Cena B</span>
              </motion.div>

              {/* Color grading overlay no preview */}
              {colorGradingOverlay && (
                <div className={cn("absolute inset-0 pointer-events-none rounded", colorGradingOverlay)} />
              )}
            </div>
          </div>

          {/* Label do tipo de transição */}
          <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
            <span className="text-[10px] text-muted-foreground bg-background/80 px-2 py-0.5 rounded">
              {template.transitionType === 'fade' ? '⬛→⬜ Fade' :
               template.transitionType === 'slide' ? '➡️ Slide' :
               template.transitionType === 'zoom' ? '🔍 Zoom' :
               template.transitionType === 'blur' ? '💫 Blur' : ''}
            </span>
          </div>
        </div>
      )}

      {/* Efeitos adicionais */}
      {isActive && (template.hasKenBurns || template.hasVignette || template.hasColorGrading || template.hasSlowMotion || template.hasBlur) && (
        <div className="flex flex-wrap gap-2 justify-center">
          {template.hasKenBurns && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                🔍
              </motion.span>
              Ken Burns
            </div>
          )}
          {template.hasVignette && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
              <span>🌑</span>
              Vinheta
            </div>
          )}
          {template.hasColorGrading && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
              <span>🎨</span>
              {template.colorGradingType === 'warm' ? 'Tons Quentes' :
               template.colorGradingType === 'cold' ? 'Tons Frios' :
               template.colorGradingType === 'vintage' ? 'Vintage' :
               template.colorGradingType === 'cinematic' ? 'Cinematográfico' :
               template.colorGradingType === 'bw' ? 'P&B' : 'Color Grading'}
            </div>
          )}
          {template.hasSlowMotion && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                🐌
              </motion.span>
              Slow Motion {Math.round((template.slowMotionFactor || 1) * 100)}%
            </div>
          )}
          {template.hasBlur && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
              <span>💫</span>
              Blur {template.blurIntensity}%
            </div>
          )}
        </div>
      )}
    </div>
  );
};
