import { ReactNode } from "react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";
import { cn } from "@/lib/utils";

type AnimationType = "fade-up" | "fade-down" | "fade-left" | "fade-right" | "scale" | "blur";

interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  id?: string;
}

const animationClasses: Record<AnimationType, { initial: string; animate: string }> = {
  "fade-up": {
    initial: "opacity-0 translate-y-8",
    animate: "opacity-100 translate-y-0",
  },
  "fade-down": {
    initial: "opacity-0 -translate-y-8",
    animate: "opacity-100 translate-y-0",
  },
  "fade-left": {
    initial: "opacity-0 translate-x-8",
    animate: "opacity-100 translate-x-0",
  },
  "fade-right": {
    initial: "opacity-0 -translate-x-8",
    animate: "opacity-100 translate-x-0",
  },
  "scale": {
    initial: "opacity-0 scale-95",
    animate: "opacity-100 scale-100",
  },
  "blur": {
    initial: "opacity-0 blur-sm",
    animate: "opacity-100 blur-0",
  },
};

export function AnimatedSection({
  children,
  className,
  animation = "fade-up",
  delay = 0,
  duration = 600,
  id,
}: AnimatedSectionProps) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({ threshold: 0.1 });

  const { initial, animate } = animationClasses[animation];

  return (
    <div
      ref={ref}
      id={id}
      className={cn(
        "transition-all will-change-transform",
        isVisible ? animate : initial,
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionDelay: `${delay}ms`,
        transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {children}
    </div>
  );
}

interface AnimatedItemProps {
  children: ReactNode;
  className?: string;
  animation?: AnimationType;
  delay?: number;
  index?: number;
  staggerDelay?: number;
}

export function AnimatedItem({
  children,
  className,
  animation = "fade-up",
  delay = 0,
  index = 0,
  staggerDelay = 100,
}: AnimatedItemProps) {
  const { ref, isVisible } = useScrollAnimation<HTMLDivElement>({ threshold: 0.1 });

  const { initial, animate } = animationClasses[animation];
  const totalDelay = delay + index * staggerDelay;

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-500 will-change-transform",
        isVisible ? animate : initial,
        className
      )}
      style={{
        transitionDelay: `${totalDelay}ms`,
        transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {children}
    </div>
  );
}
