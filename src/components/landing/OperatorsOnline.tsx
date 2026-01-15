import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const allOperators = [
  "JM", "AL", "CS", "RB", "MF", "LP", "TS", "GR", "DV", "FC", "MT", "KM",
  "RS", "CH", "VL", "BN", "PN", "SP", "LM", "DR"
];

export const OperatorsOnline = () => {
  const [visibleOperators, setVisibleOperators] = useState<string[]>([]);

  useEffect(() => {
    // Initialize with random selection of 10 operators
    const shuffled = [...allOperators].sort(() => Math.random() - 0.5);
    setVisibleOperators(shuffled.slice(0, 10));
  }, []);

  useEffect(() => {
    // Randomly swap one operator every 2.5 seconds for dynamic effect
    const interval = setInterval(() => {
      setVisibleOperators(prev => {
        const newList = [...prev];
        const indexToReplace = Math.floor(Math.random() * newList.length);
        const available = allOperators.filter(op => !newList.includes(op));
        if (available.length > 0) {
          const newOp = available[Math.floor(Math.random() * available.length)];
          newList[indexToReplace] = newOp;
        }
        return newList;
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-4 flex-wrap py-2">
      {/* Online indicator */}
      <div className="flex items-center gap-2">
        <motion.div 
          className="w-2.5 h-2.5 rounded-full bg-green-500"
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [1, 0.7, 1]
          }}
          transition={{ 
            duration: 1.5, 
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <span className="text-sm text-muted-foreground font-medium">Operadores online</span>
      </div>
      
      {/* Operator badges - circular style like reference */}
      <div className="flex items-center gap-2 flex-wrap">
        <AnimatePresence mode="popLayout">
          {visibleOperators.map((initials) => (
            <motion.div 
              key={initials}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ 
                type: "spring",
                stiffness: 500,
                damping: 30
              }}
              className="w-9 h-9 rounded-full bg-secondary/60 border border-border/50 flex items-center justify-center text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground hover:border-primary/30 transition-colors cursor-default"
            >
              {initials}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
