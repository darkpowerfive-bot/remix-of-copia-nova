import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { TransitionType } from "@/lib/xmlGenerator";

interface TransitionPreviewProps {
  transitionType: TransitionType;
  className?: string;
}

export const TransitionPreview = ({ transitionType, className }: TransitionPreviewProps) => {
  const [showSecond, setShowSecond] = useState(false);

  // Loop da animação
  useEffect(() => {
    const interval = setInterval(() => {
      setShowSecond(prev => !prev);
    }, 2000);
    return () => clearInterval(interval);
  }, [transitionType]);

  // Reset ao mudar transição
  useEffect(() => {
    setShowSecond(false);
  }, [transitionType]);

  // Render based on transition type
  const renderScenes = () => {
    const scene1Content = (
      <div className="text-center">
        <span className="text-white/90 font-bold text-lg drop-shadow-lg">Cena 1</span>
        <div className="w-8 h-1 bg-white/50 mx-auto mt-1 rounded-full" />
      </div>
    );
    
    const scene2Content = (
      <div className="text-center">
        <span className="text-white/90 font-bold text-lg drop-shadow-lg">Cena 2</span>
        <div className="w-8 h-1 bg-white/50 mx-auto mt-1 rounded-full" />
      </div>
    );

    switch (transitionType) {
      case 'cross_dissolve':
        return (
          <>
            <AnimatePresence mode="sync">
              {!showSecond && (
                <motion.div
                  key="scene1"
                  className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  {scene1Content}
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence mode="sync">
              {showSecond && (
                <motion.div
                  key="scene2"
                  className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                >
                  {scene2Content}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        );

      case 'fade_to_black':
        return (
          <>
            <motion.div
              className="absolute inset-0 bg-black z-10"
              animate={{ opacity: showSecond ? [0, 1, 0] : 0 }}
              transition={{ duration: 0.8, times: [0, 0.5, 1] }}
            />
            <AnimatePresence mode="sync">
              {!showSecond && (
                <motion.div
                  key="scene1"
                  className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {scene1Content}
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence mode="sync">
              {showSecond && (
                <motion.div
                  key="scene2"
                  className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  {scene2Content}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        );

      case 'dip_to_color':
        return (
          <>
            <motion.div
              className="absolute inset-0 bg-white z-10"
              animate={{ opacity: showSecond ? [0, 1, 0] : 0 }}
              transition={{ duration: 0.6, times: [0, 0.5, 1] }}
            />
            <AnimatePresence mode="sync">
              {!showSecond && (
                <motion.div
                  key="scene1"
                  className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {scene1Content}
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence mode="sync">
              {showSecond && (
                <motion.div
                  key="scene2"
                  className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {scene2Content}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        );

      case 'wipe':
        return (
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              {scene1Content}
            </div>
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
              animate={{ 
                clipPath: showSecond ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)" 
              }}
              transition={{ duration: 0.8 }}
            >
              {scene2Content}
            </motion.div>
          </>
        );

      case 'push':
        return (
          <>
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center"
              animate={{ x: showSecond ? "-100%" : "0%" }}
              transition={{ duration: 0.6 }}
            >
              {scene1Content}
            </motion.div>
            <motion.div
              className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
              animate={{ x: showSecond ? "0%" : "100%" }}
              transition={{ duration: 0.6 }}
            >
              {scene2Content}
            </motion.div>
          </>
        );

      case 'none':
      default:
        return (
          <>
            <AnimatePresence mode="wait">
              {!showSecond ? (
                <motion.div
                  key="scene1"
                  className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center"
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0 }}
                >
                  {scene1Content}
                </motion.div>
              ) : (
                <motion.div
                  key="scene2"
                  className="absolute inset-0 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0 }}
                >
                  {scene2Content}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        );
    }
  };

  const getTransitionLabel = () => {
    const labels: Record<string, string> = {
      cross_dissolve: 'Cross Dissolve',
      fade_to_black: 'Fade to Black',
      dip_to_color: 'Dip to White',
      additive_dissolve: 'Additive Dissolve',
      non_additive_dissolve: 'Non-Additive',
      blur_dissolve: 'Blur Dissolve',
      iris_circle: 'Íris Círculo',
      iris_diamond: 'Íris Diamante',
      iris_cross: 'Íris Cruz',
      iris_oval: 'Íris Oval',
      iris_star: 'Íris Estrela',
      iris_hexagon: 'Íris Hexagonal',
      wipe: 'Wipe',
      wipe_up: 'Wipe Cima',
      wipe_down: 'Wipe Baixo',
      push: 'Push',
      slide: 'Slide',
      split: 'Split',
      door_open: 'Porta',
      center_curtain: 'Cortina Central',
      band_curtain: 'Cortina Banda',
      edge_curtain: 'Cortina Borda',
      clock_curtain: 'Relógio',
      spiral_curtain: 'Espiral',
      heart_shape: 'Coração',
      star_shape: 'Estrela',
      box_shape: 'Caixa',
      none: 'Corte Seco'
    };
    return labels[transitionType] || transitionType;
  };

  return (
    <div className={cn(
      "relative w-full aspect-video rounded-lg overflow-hidden border border-border/50",
      className
    )}>
      {renderScenes()}

      {/* Label da transição */}
      <div className="absolute bottom-1 left-1 right-1 flex justify-center z-20">
        <span className="text-[10px] text-white/80 bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
          {getTransitionLabel()}
        </span>
      </div>
    </div>
  );
};
