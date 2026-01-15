import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Pause, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  Download,
  FolderOpen,
  MousePointer,
  Palette,
  Monitor,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  animation: 'download' | 'folder' | 'click' | 'palette' | 'done';
  tip?: string;
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 1,
    title: "Baixe o ZIP Completo",
    description: "Clique em 'ZIP Completo' para baixar o pacote com Power Grade incluído",
    icon: <Download className="w-8 h-8" />,
    animation: 'download',
    tip: "O arquivo _POWER_GRADE.drp está dentro do ZIP"
  },
  {
    id: 2,
    title: "Extraia e Localize o Arquivo",
    description: "Extraia o ZIP e encontre o arquivo '_POWER_GRADE.drp'",
    icon: <FolderOpen className="w-8 h-8" />,
    animation: 'folder',
    tip: "O arquivo .drp é o Power Grade do DaVinci"
  },
  {
    id: 3,
    title: "Abra a Galeria no DaVinci",
    description: "No DaVinci, vá para a aba COLOR e clique com botão direito na Galeria (canto superior esquerdo)",
    icon: <MousePointer className="w-8 h-8" />,
    animation: 'click',
    tip: "Selecione 'Import' no menu de contexto"
  },
  {
    id: 4,
    title: "Importe o Power Grade",
    description: "Selecione o arquivo .drp e importe. Ele aparecerá na sua galeria",
    icon: <Palette className="w-8 h-8" />,
    animation: 'palette',
    tip: "Arraste o Power Grade para aplicar nos clipes"
  },
  {
    id: 5,
    title: "Aplique com Um Clique!",
    description: "Arraste o Power Grade da galeria para qualquer clipe na timeline para aplicar instantaneamente",
    icon: <Check className="w-8 h-8" />,
    animation: 'done',
    tip: "Você pode aplicar em múltiplos clipes de uma vez!"
  }
];

// Componente de animação visual para cada passo
const StepAnimation = ({ animation, isActive }: { animation: string; isActive: boolean }) => {
  if (!isActive) return null;

  return (
    <div className="relative w-full h-40 bg-gradient-to-br from-secondary/80 to-secondary/40 rounded-xl overflow-hidden border border-border/50">
      <AnimatePresence mode="wait">
        {animation === 'download' && (
          <motion.div
            key="download"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            <div className="relative">
              {/* Botão ZIP simulado */}
              <motion.div
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-medium flex items-center gap-2"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <Download className="w-5 h-5" />
                ZIP Completo
              </motion.div>
              {/* Cursor animado */}
              <motion.div
                className="absolute w-6 h-6 bg-foreground rounded-full opacity-50"
                initial={{ x: 50, y: 50 }}
                animate={{ x: 0, y: 10 }}
                transition={{ duration: 0.8, repeat: Infinity, repeatType: 'reverse', repeatDelay: 0.5 }}
              />
            </div>
          </motion.div>
        )}

        {animation === 'folder' && (
          <motion.div
            key="folder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center gap-4"
          >
            {/* ZIP File */}
            <motion.div
              className="flex flex-col items-center gap-1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <div className="w-16 h-20 bg-amber-500/20 rounded-lg border-2 border-amber-500/50 flex items-center justify-center">
                <span className="text-xs font-mono text-amber-500">.ZIP</span>
              </div>
            </motion.div>
            
            {/* Seta */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <ChevronRight className="w-8 h-8 text-muted-foreground" />
            </motion.div>

            {/* Arquivo DRP destacado */}
            <motion.div
              className="flex flex-col items-center gap-1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8 }}
            >
              <motion.div 
                className="w-16 h-20 bg-gradient-to-br from-green-500/30 to-emerald-500/20 rounded-lg border-2 border-green-500 flex items-center justify-center"
                animate={{ boxShadow: ['0 0 0 0 rgba(34, 197, 94, 0)', '0 0 20px 5px rgba(34, 197, 94, 0.3)', '0 0 0 0 rgba(34, 197, 94, 0)'] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span className="text-xs font-mono text-green-500">.DRP</span>
              </motion.div>
              <span className="text-[10px] text-green-500 font-medium">Power Grade</span>
            </motion.div>
          </motion.div>
        )}

        {animation === 'click' && (
          <motion.div
            key="click"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {/* Interface DaVinci simulada */}
            <div className="relative w-64 h-32 bg-zinc-900 rounded border border-zinc-700">
              {/* Header */}
              <div className="h-6 bg-zinc-800 border-b border-zinc-700 flex items-center px-2">
                <span className="text-[8px] text-zinc-400">DaVinci Resolve - COLOR</span>
              </div>
              
              {/* Gallery area */}
              <motion.div 
                className="absolute top-8 left-2 w-20 h-16 bg-zinc-800 rounded border border-zinc-600"
                animate={{ borderColor: ['#52525b', '#22c55e', '#52525b'] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <div className="p-1">
                  <span className="text-[7px] text-zinc-400">Gallery</span>
                </div>
              </motion.div>

              {/* Menu de contexto */}
              <motion.div
                className="absolute top-10 left-24 w-20 bg-zinc-700 rounded shadow-lg border border-zinc-600"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
              >
                <motion.div 
                  className="px-2 py-1 text-[8px] text-white bg-blue-500/50 rounded-sm"
                  animate={{ backgroundColor: ['rgba(59, 130, 246, 0.5)', 'rgba(59, 130, 246, 0.8)', 'rgba(59, 130, 246, 0.5)'] }}
                  transition={{ duration: 1, repeat: Infinity }}
                >
                  Import...
                </motion.div>
                <div className="px-2 py-1 text-[8px] text-zinc-400">Export...</div>
              </motion.div>

              {/* Cursor */}
              <motion.div
                className="absolute w-4 h-4"
                initial={{ top: 40, left: 60 }}
                animate={{ top: 35, left: 80 }}
                transition={{ duration: 0.6, repeat: Infinity, repeatType: 'reverse', repeatDelay: 1 }}
              >
                <MousePointer className="w-4 h-4 text-white fill-white" />
              </motion.div>
            </div>
          </motion.div>
        )}

        {animation === 'palette' && (
          <motion.div
            key="palette"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {/* Power Grade sendo arrastado */}
            <div className="relative w-64 h-32 bg-zinc-900 rounded border border-zinc-700">
              {/* Gallery com Power Grade */}
              <div className="absolute top-2 left-2 w-20 h-16 bg-zinc-800 rounded border border-zinc-600 p-1">
                <motion.div 
                  className="w-full h-full bg-gradient-to-br from-amber-500/40 to-orange-500/40 rounded flex items-center justify-center"
                  initial={{ scale: 1 }}
                  animate={{ scale: [1, 1.1, 1], x: [0, 60, 60], y: [0, 30, 30] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                >
                  <Palette className="w-4 h-4 text-amber-500" />
                </motion.div>
              </div>

              {/* Timeline com clipes */}
              <div className="absolute bottom-2 left-2 right-2 h-8 flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="flex-1 bg-zinc-700 rounded-sm"
                    animate={i === 2 ? { 
                      backgroundColor: ['#3f3f46', '#f59e0b', '#3f3f46'],
                      boxShadow: ['0 0 0 0 transparent', '0 0 10px rgba(245, 158, 11, 0.5)', '0 0 0 0 transparent']
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity, repeatDelay: 1, delay: 1.5 }}
                  />
                ))}
              </div>

              {/* Seta indicando arraste */}
              <motion.div
                className="absolute top-10 left-24"
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 1, 1, 0] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
              >
                <ChevronRight className="w-6 h-6 text-amber-500" />
              </motion.div>
            </div>
          </motion.div>
        )}

        {animation === 'done' && (
          <motion.div
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3"
          >
            <motion.div
              className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5 }}
            >
              <Check className="w-8 h-8 text-white" />
            </motion.div>
            <motion.p
              className="text-sm font-medium text-green-500"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Color Grading Aplicado!
            </motion.p>
            
            {/* Clipes coloridos */}
            <motion.div
              className="flex gap-1"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.div
                  key={i}
                  className="w-10 h-6 rounded-sm bg-gradient-to-r from-amber-500/60 to-orange-500/60 border border-amber-500/50"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

interface PowerGradeTutorialProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const PowerGradeTutorial = ({ open, onOpenChange }: PowerGradeTutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  // Auto-avançar passos
  const handleNext = () => {
    if (currentStep < TUTORIAL_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-green-500/30 rounded-xl shadow-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Monitor className="w-5 h-5 text-green-500" />
            Tutorial: Power Grade no DaVinci
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Área de animação */}
          <StepAnimation 
            animation={TUTORIAL_STEPS[currentStep].animation} 
            isActive={true}
          />

          {/* Indicadores de passo */}
          <div className="flex justify-center gap-2">
            {TUTORIAL_STEPS.map((step, idx) => (
              <button
                key={step.id}
                onClick={() => setCurrentStep(idx)}
                className={cn(
                  "w-2.5 h-2.5 rounded-full transition-all",
                  idx === currentStep 
                    ? "bg-green-500 scale-125" 
                    : idx < currentStep
                      ? "bg-green-500/50"
                      : "bg-muted-foreground/30"
                )}
              />
            ))}
          </div>

          {/* Conteúdo do passo atual */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-green-500">
              {TUTORIAL_STEPS[currentStep].icon}
              <span className="text-xs font-medium text-muted-foreground">
                Passo {currentStep + 1} de {TUTORIAL_STEPS.length}
              </span>
            </div>
            <h3 className="text-lg font-semibold text-foreground">
              {TUTORIAL_STEPS[currentStep].title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {TUTORIAL_STEPS[currentStep].description}
            </p>
            {TUTORIAL_STEPS[currentStep].tip && (
              <p className="text-xs text-green-500/80 bg-green-500/10 rounded-lg px-3 py-2 mt-2">
                💡 {TUTORIAL_STEPS[currentStep].tip}
              </p>
            )}
          </div>

          {/* Controles de navegação */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="gap-1"
            >
              <X className="w-4 h-4" />
              Fechar
            </Button>

            <Button
              size="sm"
              onClick={handleNext}
              disabled={currentStep === TUTORIAL_STEPS.length - 1}
              className={cn(
                "gap-1",
                currentStep === TUTORIAL_STEPS.length - 1
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-primary"
              )}
            >
              {currentStep === TUTORIAL_STEPS.length - 1 ? (
                <>
                  <Check className="w-4 h-4" />
                  Concluído
                </>
              ) : (
                <>
                  Próximo
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
