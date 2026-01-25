import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Mic, Volume2, Loader2, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface VoiceGenerationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  progress: { current: number; total: number } | null;
  voiceName: string;
  estimatedDuration: string;
  isComplete?: boolean;
}

export const VoiceGenerationModal = ({
  open,
  onOpenChange,
  progress,
  voiceName,
  estimatedDuration,
  isComplete = false,
}: VoiceGenerationModalProps) => {
  const progressPercent = progress 
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-md"
        hideCloseButton
      >
        <DialogHeader>
          <DialogTitle className="text-center flex items-center justify-center gap-2">
            <Mic className="w-5 h-5 text-primary" />
            Gerando Narração
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-6">
          {/* Animated Waveform */}
          <div className="relative w-32 h-32 flex items-center justify-center">
            {/* Outer pulse rings */}
            <motion.div
              className="absolute inset-0 rounded-full bg-primary/20"
              animate={{
                scale: [1, 1.2, 1],
                opacity: [0.5, 0.2, 0.5],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute inset-2 rounded-full bg-primary/30"
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.6, 0.3, 0.6],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.3,
              }}
            />
            
            {/* Center circle with icon */}
            <motion.div 
              className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg"
              animate={isComplete ? {} : {
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              <AnimatePresence mode="wait">
                {isComplete ? (
                  <motion.div
                    key="complete"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 200 }}
                  >
                    <CheckCircle2 className="w-10 h-10 text-primary-foreground" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Volume2 className="w-10 h-10 text-primary-foreground" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Waveform bars animation */}
          {!isComplete && (
            <div className="flex items-center justify-center gap-1 h-8">
              {[...Array(9)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-1 bg-primary rounded-full"
                  animate={{
                    height: [8, 24, 8],
                  }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.1,
                  }}
                />
              ))}
            </div>
          )}

          {/* Status text */}
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-foreground">
              {isComplete ? 'Áudio gerado com sucesso!' : 'Processando sua narração...'}
            </p>
            <p className="text-sm text-muted-foreground">
              Voz: <span className="text-foreground font-medium">{voiceName}</span>
              {estimatedDuration && (
                <span className="ml-2">• Duração: {estimatedDuration}</span>
              )}
            </p>
          </div>

          {/* Progress bar - show when multiple chunks */}
          {progress && progress.total > 1 && (
            <div className="w-full space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Parte {progress.current} de {progress.total}</span>
                <span>{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </div>
          )}

          {/* Single chunk indicator */}
          {(!progress || progress.total === 1) && !isComplete && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Gerando áudio em alta qualidade...</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
