import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Zap, Shield, Rocket, Play, Star, Crown, Flame } from "lucide-react";
import { Link } from "react-router-dom";
import { useLandingSettings } from "@/hooks/useLandingSettings";

// Use WebP for faster loading (served directly by CDN/Nginx)
const heroBg = "/images/hero-porsche.webp";

const allOperators = [
  { initials: "JM" }, { initials: "AL" }, { initials: "CS" }, { initials: "RB" },
  { initials: "MF" }, { initials: "LP" }, { initials: "TS" }, { initials: "GR" },
  { initials: "DV" }, { initials: "FC" }, { initials: "PN" }, { initials: "KM" },
];

const HeroSection = () => {
  const { settings } = useLandingSettings();
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef, offset: ["start start", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 100]);

  const [visibleOperators, setVisibleOperators] = useState(allOperators.slice(0, 8));

  useEffect(() => {
    const interval = setInterval(() => {
      setVisibleOperators(prev => {
        const indexToReplace = Math.floor(Math.random() * prev.length);
        const currentInitials = prev.map(op => op.initials);
        const availableOperators = allOperators.filter(op => !currentInitials.includes(op.initials));
        if (availableOperators.length === 0) return prev;
        const newOperator = availableOperators[Math.floor(Math.random() * availableOperators.length)];
        const newList = [...prev];
        newList[indexToReplace] = newOperator;
        return newList;
      });
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section ref={containerRef} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Premium Background Image with Parallax */}
      <motion.div 
        style={{ scale, y: bgY }}
        className="absolute inset-0 z-0"
      >
        <img 
          src={heroBg}
          alt="Luxury Porsche"
          className="absolute inset-0 w-full h-full object-cover"
          style={{ opacity: 0.7 }}
          loading="eager"
          fetchPriority="high"
          decoding="async"
        />
        {/* Minimal overlay - only on left side for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        {/* Subtle shimmer */}
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent"
          animate={{
            backgroundPosition: ["0% 0%", "100% 0%", "0% 0%"],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{ backgroundSize: "200% 100%" }}
        />
      </motion.div>

      {/* Floating strategic elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
        {/* Top left decorative element */}
        <motion.div
          className="absolute top-32 left-10 md:left-20"
          animate={{ 
            y: [0, -15, 0],
            rotate: [0, 5, 0],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 backdrop-blur-sm border border-primary/30 flex items-center justify-center">
            <Crown className="w-8 h-8 md:w-10 md:h-10 text-primary" />
          </div>
        </motion.div>

        {/* Top right decorative element */}
        <motion.div
          className="absolute top-40 right-10 md:right-24"
          animate={{ 
            y: [0, 20, 0],
            rotate: [0, -8, 0],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/10 backdrop-blur-sm border border-yellow-500/30 flex items-center justify-center">
            <Star className="w-6 h-6 md:w-8 md:h-8 text-yellow-500" />
          </div>
        </motion.div>

        {/* Bottom left decorative element */}
        <motion.div
          className="absolute bottom-40 left-16 md:left-32"
          animate={{ 
            y: [0, -20, 0],
            x: [0, 10, 0],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
        >
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg bg-gradient-to-br from-emerald-500/20 to-teal-500/10 backdrop-blur-sm border border-emerald-500/30 flex items-center justify-center">
            <Flame className="w-5 h-5 md:w-7 md:h-7 text-emerald-500" />
          </div>
        </motion.div>

        {/* Bottom right decorative element */}
        <motion.div
          className="absolute bottom-32 right-16 md:right-40"
          animate={{ 
            y: [0, 15, 0],
            rotate: [0, 10, 0],
          }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        >
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-lg bg-gradient-to-br from-purple-500/20 to-pink-500/10 backdrop-blur-sm border border-purple-500/30 flex items-center justify-center">
            <Rocket className="w-4 h-4 md:w-6 md:h-6 text-purple-400" />
          </div>
        </motion.div>

        {/* Floating money/success indicators */}
        <motion.div
          className="absolute top-1/3 right-1/4 hidden lg:block"
          animate={{ 
            y: [0, -25, 0],
            opacity: [0.6, 1, 0.6],
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="px-4 py-2 rounded-full bg-emerald-500/20 border border-emerald-500/40 backdrop-blur-sm">
            <span className="text-emerald-400 font-bold text-sm">+$2.4K</span>
          </div>
        </motion.div>

        <motion.div
          className="absolute bottom-1/3 left-1/4 hidden lg:block"
          animate={{ 
            y: [0, 20, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        >
          <div className="px-4 py-2 rounded-full bg-primary/20 border border-primary/40 backdrop-blur-sm">
            <span className="text-primary font-bold text-sm">+847 views</span>
          </div>
        </motion.div>
      </div>

      {/* Animated glowing orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, hsl(38, 92%, 50%, 0.2) 0%, transparent 60%)',
          }}
          animate={{
            x: [0, 60, 0],
            y: [0, 40, 0],
            scale: [1, 1.2, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, hsl(32, 95%, 45%, 0.15) 0%, transparent 60%)',
          }}
          animate={{
            x: [0, -50, 0],
            y: [0, -30, 0],
            scale: [1, 1.15, 1],
            opacity: [0.4, 0.7, 0.4],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, hsl(38, 92%, 50%, 0.1) 0%, transparent 50%)',
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Floating particles - more of them */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(50)].map((_, i) => (
          <motion.div
            key={i}
            className={`absolute rounded-full ${i % 3 === 0 ? 'bg-primary' : i % 3 === 1 ? 'bg-yellow-400' : 'bg-orange-400'}`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: `${2 + Math.random() * 4}px`,
              height: `${2 + Math.random() * 4}px`,
            }}
            animate={{
              y: [0, -40 - Math.random() * 30, 0],
              x: [0, (Math.random() - 0.5) * 40, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [0.5, 1.2, 0.5],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      {/* Sparkle effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={`sparkle-${i}`}
            className="absolute"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${10 + Math.random() * 80}%`,
            }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1, 0],
              rotate: [0, 180, 360],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 5,
              ease: "easeInOut",
            }}
          >
            <Rocket className="w-3 h-3 text-primary/60" />
          </motion.div>
        ))}
      </div>

      <motion.div style={{ y, opacity }} className="container mx-auto px-6 relative z-20 text-center">
        {/* Operators Online with glass effect */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="inline-flex items-center gap-3 px-5 py-3 rounded-2xl glass mb-8"
        >
          <div className="flex items-center gap-2">
            <motion.div 
              className="w-2.5 h-2.5 rounded-full bg-emerald-500"
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <span className="text-sm text-muted-foreground font-medium">Operadores online</span>
          </div>
          <div className="flex -space-x-2">
            <AnimatePresence mode="popLayout">
              {visibleOperators.map((operator) => (
                <motion.div 
                  key={operator.initials} 
                  initial={{ opacity: 0, scale: 0 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  exit={{ opacity: 0, scale: 0 }} 
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-amber-600 flex items-center justify-center border-2 border-background text-xs font-bold text-primary-foreground shadow-lg"
                >
                  {operator.initials}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Badge with shimmer */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }} 
          transition={{ delay: 0.1 }} 
          className="relative inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/40 text-primary mb-6 overflow-hidden"
        >
          <div className="absolute inset-0 animate-shimmer" />
          <Rocket className="w-4 h-4 relative z-10" />
          <span className="text-sm font-bold relative z-10">{settings.heroBadge}</span>
        </motion.div>

        {/* Title with enhanced gradient */}
        <motion.h1 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.2 }} 
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight"
        >
          {settings.heroTitle}<br />
          <span className="relative">
            <span className="bg-gradient-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              {settings.heroHighlight}
            </span>
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.3 }} 
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
        >
          {settings.heroSubtitle}
        </motion.p>

        {/* CTAs with glow effects */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ delay: 0.4 }} 
          className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
        >
          <Link to="/auth">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="relative group"
            >
              <motion.div 
                className="absolute -inset-1 bg-gradient-to-r from-primary via-yellow-500 to-primary rounded-xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity"
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                }}
                style={{ backgroundSize: "200% 200%" }}
              />
              <Button variant="hero" size="xl" className="relative w-full sm:w-auto">
                <Zap className="w-5 h-5" />
                {settings.heroCta}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </motion.div>
          </Link>
          <a href="#demo">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button variant="heroOutline" size="xl" className="w-full sm:w-auto group">
                <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
                {settings.heroCtaSecondary}
              </Button>
            </motion.div>
          </a>
        </motion.div>

        {/* Trust badges with glass effect */}
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          transition={{ delay: 0.5 }} 
          className="flex flex-wrap justify-center gap-4 md:gap-6 text-muted-foreground"
        >
          <motion.div 
            className="flex items-center gap-2 px-4 py-2 rounded-full glass"
            whileHover={{ scale: 1.05, y: -2 }}
          >
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-sm">Pagamento Seguro</span>
          </motion.div>
          <motion.div 
            className="flex items-center gap-2 px-4 py-2 rounded-full glass"
            whileHover={{ scale: 1.05, y: -2 }}
          >
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm">Acesso Imediato</span>
          </motion.div>
          <motion.div 
            className="flex items-center gap-2 px-4 py-2 rounded-full glass"
            whileHover={{ scale: 1.05, y: -2 }}
          >
            <Rocket className="w-4 h-4 text-primary" />
            <span className="text-sm">Suporte 24/7</span>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background via-background/80 to-transparent z-20" />
    </section>
  );
};

export default HeroSection;