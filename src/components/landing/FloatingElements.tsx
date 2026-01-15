import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

const FloatingElements = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll();

  const y1 = useTransform(scrollYProgress, [0, 1], [0, -300]);
  const y2 = useTransform(scrollYProgress, [0, 1], [0, -500]);
  const y3 = useTransform(scrollYProgress, [0, 1], [0, -200]);
  const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const rotate2 = useTransform(scrollYProgress, [0, 1], [0, -90]);

  return (
    <div ref={containerRef} className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
      {/* Subtle gradient orbs - very low opacity */}
      <motion.div
        style={{ y: y1 }}
        className="absolute top-[10%] left-[5%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-primary/10 via-primary/5 to-transparent blur-[100px] hidden md:block"
      />
      
      <motion.div
        style={{ y: y2 }}
        className="absolute top-[30%] right-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-purple-500/8 via-primary/5 to-transparent blur-[120px] hidden md:block"
      />
      
      <motion.div
        style={{ y: y3 }}
        className="absolute top-[60%] left-[20%] w-[350px] h-[350px] rounded-full bg-gradient-to-br from-emerald-500/8 via-primary/5 to-transparent blur-[80px] hidden lg:block"
      />

      {/* Subtle geometric shapes - desktop only */}
      <motion.div
        style={{ y: y1, rotate: rotate1 }}
        className="absolute top-[15%] right-[15%] w-20 h-20 border border-primary/10 rounded-xl hidden lg:block"
      />
      <motion.div
        style={{ y: y2, rotate: rotate2 }}
        className="absolute top-[45%] left-[8%] w-14 h-14 border border-primary/10 rounded-full hidden lg:block"
      />
      <motion.div
        style={{ y: y3, rotate: rotate1 }}
        className="absolute top-[75%] right-[20%] w-16 h-16 border border-primary/8 hidden lg:block"
      />

      {/* Very subtle grid pattern - desktop only */}
      <div 
        className="absolute inset-0 opacity-[0.015] hidden md:block"
        style={{
          backgroundImage: `
            linear-gradient(hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)
          `,
          backgroundSize: '100px 100px'
        }}
      />

      {/* Radial gradient overlay for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,hsl(var(--background))_70%)]" />
    </div>
  );
};

export default FloatingElements;