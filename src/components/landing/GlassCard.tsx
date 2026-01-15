import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  glowColor?: "primary" | "green" | "purple" | "cyan" | "pink";
  hoverEffect?: boolean;
  gradient?: boolean;
}

export const GlassCard = ({
  children,
  className,
  glowColor = "primary",
  hoverEffect = true,
  gradient = false,
}: GlassCardProps) => {
  const glowColors = {
    primary: "hover:shadow-primary/30 hover:border-primary/50",
    green: "hover:shadow-green-500/30 hover:border-green-500/50",
    purple: "hover:shadow-purple-500/30 hover:border-purple-500/50",
    cyan: "hover:shadow-cyan-500/30 hover:border-cyan-500/50",
    pink: "hover:shadow-pink-500/30 hover:border-pink-500/50",
  };

  const gradientOverlays = {
    primary: "from-primary/10 via-transparent to-transparent",
    green: "from-green-500/10 via-transparent to-transparent",
    purple: "from-purple-500/10 via-transparent to-transparent",
    cyan: "from-cyan-500/10 via-transparent to-transparent",
    pink: "from-pink-500/10 via-transparent to-transparent",
  };

  return (
    <div
      className={cn(
        "relative rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl overflow-hidden transition-all duration-500",
        hoverEffect && [
          "hover:scale-[1.02] hover:shadow-2xl",
          glowColors[glowColor],
        ],
        className
      )}
    >
      {gradient && (
        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-br pointer-events-none opacity-50",
            gradientOverlays[glowColor]
          )}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );
};
