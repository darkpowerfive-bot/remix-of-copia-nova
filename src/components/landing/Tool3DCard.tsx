import { useState, useRef, ReactNode } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface Tool3DCardProps {
  icon: LucideIcon;
  title: string;
  desc: string;
  badge?: string;
  color: string;
  isHighlighted?: boolean;
}

export const Tool3DCard = ({ icon: Icon, title, desc, badge, color, isHighlighted }: Tool3DCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const mouseX = e.clientX - centerX;
    const mouseY = e.clientY - centerY;
    
    // Calculate rotation (max 12 degrees)
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
      className="relative group"
    >
      {/* Glow effect behind card */}
      <motion.div
        className={`absolute inset-0 ${color} opacity-0 group-hover:opacity-20 rounded-2xl blur-xl -z-10`}
        animate={{
          opacity: isHovered ? 0.25 : 0,
          scale: isHovered ? 1.05 : 1,
        }}
        transition={{ duration: 0.3 }}
      />

      <Card 
        className={`p-6 bg-card/80 backdrop-blur-sm border-border hover:border-primary/40 transition-all duration-300 relative overflow-hidden rounded-2xl ${
          isHighlighted ? 'ring-1 ring-primary/50 bg-primary/5' : ''
        }`}
        style={{
          transformStyle: "preserve-3d",
        }}
      >
        {/* Shimmer overlay on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -z-0"
          initial={{ x: "-100%" }}
          animate={{ x: isHovered ? "100%" : "-100%" }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        />

        {/* Gradient border glow */}
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: "linear-gradient(135deg, hsl(38, 92%, 50%, 0.1) 0%, transparent 50%, hsl(38, 92%, 50%, 0.1) 100%)",
          }}
        />

        {/* Badge */}
        {badge && (
          <motion.span 
            className="absolute top-4 right-4 px-3 py-1 rounded-lg text-sm bg-gradient-to-r from-red-500 to-rose-600 text-white font-semibold shadow-lg"
            style={{ transform: "translateZ(20px)" }}
            animate={{
              scale: isHovered ? 1.1 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            {badge}
          </motion.span>
        )}

        {/* Icon */}
        <motion.div 
          className={`w-14 h-14 rounded-xl ${color} flex items-center justify-center mb-4 shadow-lg relative z-10`}
          style={{ transform: "translateZ(30px)" }}
          animate={{
            scale: isHovered ? 1.1 : 1,
            rotate: isHovered ? 5 : 0,
          }}
          transition={{ duration: 0.3 }}
        >
          <Icon className="w-7 h-7 text-white" />
        </motion.div>

        {/* Content */}
        <motion.div
          style={{ transform: "translateZ(15px)" }}
          className="relative z-10"
        >
          <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-base text-muted-foreground">
            {desc}
          </p>
        </motion.div>

        {/* Bottom gradient line on hover */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-amber-400 to-primary"
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

export default Tool3DCard;