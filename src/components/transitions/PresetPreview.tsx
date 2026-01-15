import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { CinematicSettings } from "@/lib/xmlGenerator";
import { motion, AnimatePresence } from "framer-motion";

interface PresetPreviewProps {
  settings: CinematicSettings;
  className?: string;
}

export const PresetPreview = ({ settings, className }: PresetPreviewProps) => {
  const [currentImage, setCurrentImage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Simular transição entre imagens
  useEffect(() => {
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentImage(prev => (prev + 1) % 3);
        setIsTransitioning(false);
      }, settings.transitionDuration * 1000);
    }, 2500);
    
    return () => clearInterval(interval);
  }, [settings.transitionDuration]);

  // Cores simulando imagens diferentes
  const imageColors = [
    "from-amber-600/80 via-orange-500/60 to-red-600/70",
    "from-blue-600/80 via-purple-500/60 to-pink-600/70",
    "from-emerald-600/80 via-teal-500/60 to-cyan-600/70",
  ];

  // Calcular aspect ratio para letterbox
  const getLetterboxBars = () => {
    if (!settings.letterbox) return 0;
    switch (settings.aspectRatio) {
      case '2.35:1': return 18;
      case '2.39:1': return 20;
      case '1.85:1': return 8;
      default: return 0;
    }
  };

  const letterboxHeight = getLetterboxBars();

  // Determinar animação de transição
  const getTransitionAnimation = () => {
    switch (settings.transitionType) {
      case 'cross_dissolve':
        return { opacity: isTransitioning ? 0 : 1 };
      case 'fade_to_black':
        return { 
          opacity: isTransitioning ? 0 : 1,
          filter: isTransitioning ? 'brightness(0)' : 'brightness(1)'
        };
      case 'dip_to_color':
        return { 
          opacity: isTransitioning ? 0.3 : 1,
          filter: isTransitioning ? 'brightness(0.2)' : 'brightness(1)'
        };
      case 'wipe':
        return { 
          clipPath: isTransitioning 
            ? 'inset(0 100% 0 0)' 
            : 'inset(0 0% 0 0)'
        };
      case 'push':
        return { 
          x: isTransitioning ? '-100%' : '0%'
        };
      default:
        return { opacity: 1 };
    }
  };

  // Ken Burns animation
  const getKenBurnsAnimation = () => {
    if (!settings.kenBurnsEffect) return {};
    return {
      scale: [1, 1.08],
      transition: {
        duration: 2.5,
        repeat: Infinity,
        repeatType: "reverse" as const,
        ease: "easeInOut"
      }
    };
  };

  return (
    <div className={cn("relative rounded-lg overflow-hidden bg-black", className)}>
      {/* Container com aspect ratio */}
      <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
        {/* Letterbox superior */}
        {settings.letterbox && letterboxHeight > 0 && (
          <div 
            className="absolute top-0 left-0 right-0 bg-black z-20"
            style={{ height: `${letterboxHeight}%` }}
          />
        )}
        
        {/* Letterbox inferior */}
        {settings.letterbox && letterboxHeight > 0 && (
          <div 
            className="absolute bottom-0 left-0 right-0 bg-black z-20"
            style={{ height: `${letterboxHeight}%` }}
          />
        )}

        {/* Imagem/Cena com animações */}
        <motion.div
          className={cn(
            "absolute inset-0 bg-gradient-to-br",
            imageColors[currentImage]
          )}
          animate={{
            ...getTransitionAnimation(),
            ...(settings.kenBurnsEffect ? { scale: [1, 1.08, 1] } : {})
          }}
          transition={{
            duration: settings.transitionDuration,
            scale: {
              duration: 2.5,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }
          }}
        >
          {/* Elementos decorativos simulando cena */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm"
              animate={settings.kenBurnsEffect ? {
                scale: [1, 1.1, 1],
                rotate: [0, 5, -5, 0]
              } : {}}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          </div>
          
          {/* Grid de pontos para dar textura */}
          <div className="absolute inset-0 opacity-30">
            <div className="grid grid-cols-8 grid-rows-4 h-full w-full gap-1 p-2">
              {Array.from({ length: 32 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="rounded-full bg-white/30"
                  animate={{
                    opacity: [0.2, 0.5, 0.2],
                    scale: [0.8, 1, 0.8]
                  }}
                  transition={{
                    duration: 2,
                    delay: i * 0.05,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Vinheta */}
        {settings.addVignette && (
          <div 
            className="absolute inset-0 z-10 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)'
            }}
          />
        )}

        {/* Fade In/Out indicator */}
        {settings.fadeInOut && (
          <motion.div
            className="absolute inset-0 bg-black z-15 pointer-events-none"
            animate={{
              opacity: [0.8, 0, 0, 0, 0, 0, 0, 0.8]
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        )}

        {/* Indicadores de efeitos ativos */}
        <div className="absolute bottom-1 right-1 flex gap-1 z-30">
          {settings.kenBurnsEffect && (
            <span className="text-[8px] bg-black/60 text-white px-1 rounded">KB</span>
          )}
          {settings.addVignette && (
            <span className="text-[8px] bg-black/60 text-white px-1 rounded">V</span>
          )}
          {settings.letterbox && (
            <span className="text-[8px] bg-black/60 text-white px-1 rounded">LB</span>
          )}
          {settings.fadeInOut && (
            <span className="text-[8px] bg-black/60 text-white px-1 rounded">F</span>
          )}
        </div>

        {/* Número da cena */}
        <div className="absolute top-1 left-1 z-30">
          <span className="text-[8px] bg-amber-500/80 text-black font-bold px-1.5 py-0.5 rounded">
            {currentImage + 1}/3
          </span>
        </div>

        {/* Transição indicator */}
        <AnimatePresence>
          {isTransitioning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-1 right-1 z-30"
            >
              <span className="text-[8px] bg-primary/80 text-primary-foreground px-1.5 py-0.5 rounded animate-pulse">
                {settings.transitionType.replace('_', ' ')}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info bar */}
      <div className="bg-card/90 backdrop-blur-sm px-2 py-1 flex items-center justify-between text-[9px] text-muted-foreground">
        <span>{settings.aspectRatio} • {settings.fps}fps</span>
        <span>{settings.transitionDuration}s trans</span>
      </div>
    </div>
  );
};
