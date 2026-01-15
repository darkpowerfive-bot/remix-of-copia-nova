import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import adsenseLogo from "@/assets/adsense-logo.png";

// Different payment amounts to cycle through
const paymentAmounts = [
  { amount: "12,847.56", next: "14,230.00", impressions: "2.4M", rpm: "5.35", growth: "47" },
  { amount: "15,234.89", next: "16,890.00", impressions: "2.8M", rpm: "5.89", growth: "52" },
  { amount: "18,456.23", next: "20,100.00", impressions: "3.1M", rpm: "6.12", growth: "61" },
  { amount: "21,789.45", next: "23,500.00", impressions: "3.6M", rpm: "6.45", growth: "73" },
  { amount: "9,567.12", next: "11,200.00", impressions: "1.9M", rpm: "4.98", growth: "38" },
  { amount: "27,345.67", next: "29,800.00", impressions: "4.2M", rpm: "6.78", growth: "84" },
];

// 5 different dates to cycle through
const displayDates = [
  "1 de janeiro, 2026",
  "15 de fevereiro, 2026",
  "3 de março, 2026",
  "22 de abril, 2026",
  "10 de maio, 2026",
];

export const AdSenseCard = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dateIndex, setDateIndex] = useState(0);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % paymentAmounts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Cycle through dates every 4 seconds (synced with payment amounts)
  useEffect(() => {
    const dateInterval = setInterval(() => {
      setDateIndex((prev) => (prev + 1) % displayDates.length);
    }, 4000);
    return () => clearInterval(dateInterval);
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    const rotateXValue = (mouseY / (rect.height / 2)) * -8;
    const rotateYValue = (mouseX / (rect.width / 2)) * 8;
    
    setRotateX(rotateXValue);
    setRotateY(rotateYValue);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const current = paymentAmounts[currentIndex];
  const currentDate = displayDates[dateIndex];

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transformStyle: "preserve-3d",
        perspective: "1000px",
      }}
      animate={{
        rotateX,
        rotateY,
        scale: isHovered ? 1.02 : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
      className="relative max-w-md mx-auto"
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-primary/20 opacity-0 rounded-2xl blur-2xl -z-10"
        animate={{
          opacity: isHovered ? 0.5 : 0,
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{ duration: 0.3 }}
      />

      <Card 
        className="p-0 bg-card border-border overflow-hidden shadow-2xl rounded-2xl"
        style={{ transformStyle: "preserve-3d" }}
      >
        {/* Shimmer overlay on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent z-20 pointer-events-none"
          initial={{ x: "-100%" }}
          animate={{ x: isHovered ? "100%" : "-100%" }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />

        {/* Header - Blue like reference */}
        <motion.div 
          className="bg-gradient-to-r from-[#1a73e8] to-[#1557b0] p-5 flex items-center justify-between relative overflow-hidden"
          style={{ transform: "translateZ(10px)" }}
        >
          {/* Header shimmer */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            animate={{
              x: isHovered ? ["0%", "100%"] : "0%",
            }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />

          <div className="flex items-center gap-4 relative z-10">
            <motion.div 
              className="w-14 h-14 rounded-xl bg-white p-2 flex items-center justify-center overflow-hidden shadow-lg"
              animate={{
                scale: isHovered ? 1.1 : 1,
                rotate: isHovered ? 5 : 0,
              }}
              transition={{ duration: 0.3 }}
              style={{ transform: "translateZ(20px)" }}
            >
              <img 
                src={adsenseLogo} 
                alt="Google AdSense Logo" 
                className="w-full h-full object-contain"
              />
            </motion.div>
            <div>
              <p className="font-bold text-white text-lg tracking-tight">Google AdSense</p>
              <p className="text-sm text-white/80">Pagamento processado</p>
            </div>
          </div>
          <motion.span 
            className="px-4 py-1.5 rounded-full text-xs bg-green-500/30 text-green-100 flex items-center gap-2 backdrop-blur-sm border border-green-400/30 relative z-10"
            animate={{
              scale: isHovered ? 1.05 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            <motion.div 
              className="w-2 h-2 rounded-full bg-green-400"
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            Ativo
          </motion.span>
        </motion.div>

        {/* Content */}
        <motion.div 
          className="p-6 space-y-6 relative"
          style={{ transform: "translateZ(5px)" }}
        >
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Pagamento Recebido</p>
            <AnimatePresence mode="wait">
              <motion.p 
                key={current.amount}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.5 }}
                className="text-5xl font-bold mt-2"
                style={{ transform: "translateZ(15px)" }}
              >
                <span className="text-muted-foreground text-2xl">$</span>
                {current.amount}
              </motion.p>
            </AnimatePresence>
            <AnimatePresence mode="wait">
              <motion.p 
                key={currentDate}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-sm text-muted-foreground mt-2"
              >
                USD · {currentDate}
              </motion.p>
            </AnimatePresence>
          </div>

          <div className="space-y-3 border-t border-border pt-5">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Método de pagamento</span>
              <span className="font-medium">Transferência bancária</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Conta</span>
              <span className="font-medium">****4892</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <span className="text-green-500 flex items-center gap-1.5 font-medium">
                <Check className="w-4 h-4" />
                Concluído
              </span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 border-t border-border pt-5">
            <div className="text-center">
              <AnimatePresence mode="wait">
                <motion.p 
                  key={current.impressions}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-2xl font-bold"
                >
                  {current.impressions}
                </motion.p>
              </AnimatePresence>
              <p className="text-xs text-muted-foreground">Impressões</p>
            </div>
            <div className="text-center border-x border-border">
              <AnimatePresence mode="wait">
                <motion.p 
                  key={current.rpm}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-2xl font-bold text-blue-500"
                >
                  ${current.rpm}
                </motion.p>
              </AnimatePresence>
              <p className="text-xs text-muted-foreground">RPM</p>
            </div>
            <div className="text-center">
              <AnimatePresence mode="wait">
                <motion.p 
                  key={current.growth}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="text-2xl font-bold text-green-500"
                >
                  +{current.growth}%
                </motion.p>
              </AnimatePresence>
              <p className="text-xs text-muted-foreground">vs mês anterior</p>
            </div>
          </div>

          {/* Next Payment */}
          <motion.div 
            className="bg-muted/30 rounded-xl p-4 text-center border border-border"
            animate={{
              borderColor: isHovered ? "hsl(38, 92%, 50%, 0.3)" : "hsl(var(--border))",
            }}
            transition={{ duration: 0.3 }}
          >
            <p className="text-sm text-muted-foreground">
              Próximo pagamento estimado:{" "}
              <AnimatePresence mode="wait">
                <motion.span 
                  key={current.next}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-foreground font-bold text-lg"
                >
                  ${current.next}
                </motion.span>
              </AnimatePresence>
            </p>
          </motion.div>
        </motion.div>

        {/* Bottom gradient line on hover */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-primary to-blue-500"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ 
            scaleX: isHovered ? 1 : 0,
            opacity: isHovered ? 1 : 0,
          }}
          transition={{ duration: 0.3 }}
          style={{ transformOrigin: "left" }}
        />
      </Card>
    </motion.div>
  );
};
