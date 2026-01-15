import { useVersionCheck } from "@/hooks/useVersionCheck";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UpdateNotification() {
  const { updateAvailable, handleUpdate, dismissUpdate } = useVersionCheck(60000); // Check every 60 seconds

  return (
    <AnimatePresence>
      {updateAvailable && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999]"
        >
          <div className="bg-gradient-to-r from-primary/90 to-orange-500/90 backdrop-blur-md rounded-xl shadow-2xl border border-primary/30 p-4 flex items-center gap-4 max-w-md">
            <div className="flex-shrink-0">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"
              >
                <Sparkles className="w-5 h-5 text-white" />
              </motion.div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white text-sm">
                Nova versão disponível!
              </h4>
              <p className="text-white/80 text-xs mt-0.5">
                Atualize para ter acesso às últimas melhorias
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button
                onClick={handleUpdate}
                size="sm"
                className="bg-white text-primary hover:bg-white/90 h-8 px-3 gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Atualizar
              </Button>
              <button
                onClick={dismissUpdate}
                className="p-1.5 rounded-md text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
