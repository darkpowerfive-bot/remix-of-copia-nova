import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

interface Dream3DCardProps {
  image: string;
  title: string;
  desc: string;
}

export const Dream3DCard = ({ image, title, desc }: Dream3DCardProps) => {
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
    
    const rotateXValue = (mouseY / (rect.height / 2)) * -10;
    const rotateYValue = (mouseX / (rect.width / 2)) * 10;
    
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
        scale: isHovered ? 1.03 : 1,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
      className="relative group cursor-pointer"
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-primary/30 to-amber-500/20 opacity-0 rounded-2xl blur-xl -z-10"
        animate={{
          opacity: isHovered ? 0.4 : 0,
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{ duration: 0.3 }}
      />

      <Card 
        className="overflow-hidden border-border hover:border-primary/50 transition-all duration-300 rounded-2xl"
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="aspect-[4/3] relative overflow-hidden">
          {/* Image with parallax effect */}
          <motion.img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover"
            animate={{
              scale: isHovered ? 1.15 : 1,
              x: isHovered ? rotateY * 0.5 : 0,
              y: isHovered ? rotateX * -0.5 : 0,
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          
          {/* Shimmer effect on hover */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
            initial={{ x: "-100%" }}
            animate={{ x: isHovered ? "100%" : "-100%" }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
          />

          {/* Premium corner accent */}
          <motion.div
            className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/30 to-transparent"
            animate={{
              opacity: isHovered ? 1 : 0,
            }}
            transition={{ duration: 0.3 }}
          />
          
          {/* Content with 3D depth */}
          <motion.div 
            className="absolute bottom-0 left-0 right-0 p-6"
            style={{ transform: "translateZ(25px)" }}
          >
            <motion.h3 
              className="font-bold text-xl mb-1"
              animate={{
                y: isHovered ? -5 : 0,
              }}
              transition={{ duration: 0.3 }}
            >
              {title}
            </motion.h3>
            <motion.p 
              className="text-base text-muted-foreground"
              animate={{
                y: isHovered ? -3 : 0,
                opacity: isHovered ? 1 : 0.8,
              }}
              transition={{ duration: 0.3, delay: 0.05 }}
            >
              {desc}
            </motion.p>
          </motion.div>
        </div>

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

export default Dream3DCard;