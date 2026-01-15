import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export interface GuidedStep {
  title: string;
  description: string;
  icon?: string;
  selector?: string; // CSS selector for the element to highlight
  position?: "top" | "bottom" | "left" | "right" | "center";
}

interface GuidedTutorialProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  steps: GuidedStep[];
  onComplete: () => void;
}

export function GuidedTutorial({
  open,
  onOpenChange,
  title,
  steps,
  onComplete,
}: GuidedTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [arrowDirection, setArrowDirection] = useState<"top" | "bottom" | "left" | "right">("top");
  const tooltipRef = useRef<HTMLDivElement>(null);

  const step = steps[currentStep];

  // Find and highlight the target element
  const updateTargetElement = useCallback(() => {
    if (!step?.selector) {
      setTargetRect(null);
      return;
    }

    const element = document.querySelector(step.selector);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect(rect);

      // Calculate tooltip position based on step position preference
      const padding = 20;
      const tooltipWidth = 340;
      const tooltipHeight = 200;
      
      let x = rect.left + rect.width / 2 - tooltipWidth / 2;
      let y = rect.bottom + padding;

      let preferredPosition = step.position || "bottom";
      let arrow: "top" | "bottom" | "left" | "right" = "top";

      // Auto-adjust position if element is near screen edges
      const spaceLeft = rect.left;
      const spaceRight = window.innerWidth - rect.right;
      const spaceTop = rect.top;
      const spaceBottom = window.innerHeight - rect.bottom;

      // If preferred position doesn't fit, find best alternative
      if (preferredPosition === "left" && spaceLeft < tooltipWidth + padding + 20) {
        preferredPosition = spaceRight > spaceLeft ? "right" : spaceBottom > spaceTop ? "bottom" : "top";
      }
      if (preferredPosition === "right" && spaceRight < tooltipWidth + padding + 20) {
        preferredPosition = spaceLeft > spaceRight ? "left" : spaceBottom > spaceTop ? "bottom" : "top";
      }
      if (preferredPosition === "top" && spaceTop < tooltipHeight + padding + 20) {
        preferredPosition = "bottom";
      }
      if (preferredPosition === "bottom" && spaceBottom < tooltipHeight + padding + 20) {
        preferredPosition = "top";
      }

      switch (preferredPosition) {
        case "top":
          x = rect.left + rect.width / 2 - tooltipWidth / 2;
          y = rect.top - tooltipHeight - padding - 16;
          arrow = "bottom";
          break;
        case "bottom":
          x = rect.left + rect.width / 2 - tooltipWidth / 2;
          y = rect.bottom + padding + 16;
          arrow = "top";
          break;
        case "left":
          x = rect.left - tooltipWidth - padding - 16;
          y = rect.top + rect.height / 2 - tooltipHeight / 2;
          arrow = "right";
          break;
        case "right":
          x = rect.right + padding + 16;
          y = rect.top + rect.height / 2 - tooltipHeight / 2;
          arrow = "left";
          break;
        case "center":
          x = window.innerWidth / 2 - tooltipWidth / 2;
          y = window.innerHeight / 2 - tooltipHeight / 2;
          break;
      }
      
      setArrowDirection(arrow);

      // Keep tooltip within viewport with better margins
      x = Math.max(padding, Math.min(x, window.innerWidth - tooltipWidth - padding));
      y = Math.max(padding, Math.min(y, window.innerHeight - tooltipHeight - padding));

      setTooltipPosition({ x, y });

      // Scroll element into view if needed
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setTargetRect(null);
      // Center tooltip if no element found
      setTooltipPosition({
        x: window.innerWidth / 2 - 170,
        y: window.innerHeight / 2 - 100,
      });
    }
  }, [step]);

  useEffect(() => {
    if (open) {
      updateTargetElement();
      
      // Update on resize/scroll
      const handleUpdate = () => updateTargetElement();
      window.addEventListener("resize", handleUpdate);
      window.addEventListener("scroll", handleUpdate, true);
      
      return () => {
        window.removeEventListener("resize", handleUpdate);
        window.removeEventListener("scroll", handleUpdate, true);
      };
    }
  }, [open, currentStep, updateTargetElement]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    onComplete();
    setCurrentStep(0);
    onOpenChange(false);
  };

  const handleSkip = () => {
    handleComplete();
  };

  if (!open) return null;

  const progress = ((currentStep + 1) / steps.length) * 100;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[9999]">
          {/* Backdrop with cutout */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={handleSkip}
          >
            <svg className="absolute inset-0 w-full h-full">
              <defs>
                <mask id="spotlight-mask">
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  {targetRect && (
                    <rect
                      x={targetRect.left - 8}
                      y={targetRect.top - 8}
                      width={targetRect.width + 16}
                      height={targetRect.height + 16}
                      rx="8"
                      fill="black"
                    />
                  )}
                </mask>
              </defs>
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="rgba(0, 0, 0, 0.75)"
                mask="url(#spotlight-mask)"
              />
            </svg>
          </motion.div>

          {/* Highlight border around target element with pulse animations */}
          {targetRect && (
            <>
              {/* Outer expanding pulse ring */}
              <motion.div
                className="absolute pointer-events-none rounded-lg"
                style={{
                  left: targetRect.left - 16,
                  top: targetRect.top - 16,
                  width: targetRect.width + 32,
                  height: targetRect.height + 32,
                }}
                initial={{ opacity: 0.6, scale: 1 }}
                animate={{ 
                  opacity: [0.6, 0.3, 0],
                  scale: [1, 1.15, 1.25],
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  ease: "easeOut" 
                }}
              >
                <div className="w-full h-full rounded-lg border-2 border-amber-500/60" />
              </motion.div>

              {/* Second pulse ring (delayed) */}
              <motion.div
                className="absolute pointer-events-none rounded-lg"
                style={{
                  left: targetRect.left - 12,
                  top: targetRect.top - 12,
                  width: targetRect.width + 24,
                  height: targetRect.height + 24,
                }}
                initial={{ opacity: 0.5, scale: 1 }}
                animate={{ 
                  opacity: [0.5, 0.2, 0],
                  scale: [1, 1.1, 1.2],
                }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  ease: "easeOut",
                  delay: 0.5 
                }}
              >
                <div className="w-full h-full rounded-lg border border-amber-400/40" />
              </motion.div>

              {/* Main highlight border with glow */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute pointer-events-none"
                style={{
                  left: targetRect.left - 8,
                  top: targetRect.top - 8,
                  width: targetRect.width + 16,
                  height: targetRect.height + 16,
                }}
              >
                {/* Animated glow effect */}
                <motion.div
                  className="absolute inset-0 rounded-lg"
                  animate={{
                    boxShadow: [
                      "0 0 20px 4px rgba(245, 158, 11, 0.3)",
                      "0 0 35px 8px rgba(245, 158, 11, 0.5)",
                      "0 0 20px 4px rgba(245, 158, 11, 0.3)",
                    ],
                  }}
                  transition={{
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                
                {/* Solid border */}
                <div className="w-full h-full rounded-lg border-2 border-amber-500 bg-amber-500/5" />
                
                {/* Corner sparkles */}
                <motion.div
                  className="absolute -top-1 -left-1 w-2 h-2 bg-amber-400 rounded-full"
                  animate={{ 
                    scale: [1, 1.5, 1], 
                    opacity: [0.8, 1, 0.8] 
                  }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
                <motion.div
                  className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full"
                  animate={{ 
                    scale: [1, 1.5, 1], 
                    opacity: [0.8, 1, 0.8] 
                  }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className="absolute -bottom-1 -left-1 w-2 h-2 bg-amber-400 rounded-full"
                  animate={{ 
                    scale: [1, 1.5, 1], 
                    opacity: [0.8, 1, 0.8] 
                  }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                />
                <motion.div
                  className="absolute -bottom-1 -right-1 w-2 h-2 bg-amber-400 rounded-full"
                  animate={{ 
                    scale: [1, 1.5, 1], 
                    opacity: [0.8, 1, 0.8] 
                  }}
                  transition={{ duration: 0.8, repeat: Infinity, delay: 0.6 }}
                />
              </motion.div>
            </>
          )}

          {/* Arrow pointing to target */}
          {targetRect && step?.position !== "center" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute pointer-events-none"
              style={{
                left: arrowDirection === "left" ? tooltipPosition.x - 12 :
                      arrowDirection === "right" ? tooltipPosition.x + 340 :
                      tooltipPosition.x + 170 - 8,
                top: arrowDirection === "top" ? tooltipPosition.y - 12 :
                     arrowDirection === "bottom" ? tooltipPosition.y + 180 :
                     tooltipPosition.y + 90 - 8,
              }}
            >
              {/* Arrow with bounce animation */}
              <motion.div
                animate={{
                  x: arrowDirection === "left" ? [-4, 0, -4] :
                     arrowDirection === "right" ? [4, 0, 4] : 0,
                  y: arrowDirection === "top" ? [-4, 0, -4] :
                     arrowDirection === "bottom" ? [4, 0, 4] : 0,
                }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  className={cn(
                    "text-amber-500 drop-shadow-lg",
                    arrowDirection === "top" && "rotate-0",
                    arrowDirection === "bottom" && "rotate-180",
                    arrowDirection === "left" && "-rotate-90",
                    arrowDirection === "right" && "rotate-90"
                  )}
                >
                  <path
                    d="M8 0L14 10H2L8 0Z"
                    fill="currentColor"
                  />
                </svg>
              </motion.div>
              
              {/* Glowing trail effect */}
              <motion.div
                className="absolute w-1 bg-gradient-to-b from-amber-500 to-transparent rounded-full"
                style={{
                  height: arrowDirection === "top" || arrowDirection === "bottom" ? 20 : 0,
                  width: arrowDirection === "left" || arrowDirection === "right" ? 20 : 4,
                  left: arrowDirection === "left" ? 16 : arrowDirection === "right" ? -16 : 6,
                  top: arrowDirection === "top" ? 14 : arrowDirection === "bottom" ? -16 : 6,
                  transform: arrowDirection === "left" || arrowDirection === "right" 
                    ? "rotate(90deg)" : "none",
                }}
                animate={{
                  opacity: [0.3, 0.7, 0.3],
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          )}

          {/* Tooltip */}
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute w-[340px] bg-card border border-amber-500/30 rounded-xl shadow-2xl overflow-hidden"
            style={{
              left: tooltipPosition.x,
              top: tooltipPosition.y,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="relative p-4 pb-3 border-b border-border/50 bg-gradient-to-br from-amber-500/10 to-transparent">
              <button
                onClick={handleSkip}
                className="absolute top-3 right-3 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{step.icon || "📚"}</span>
                <span className="text-xs text-muted-foreground font-medium">
                  {title} • {currentStep + 1}/{steps.length}
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-1 bg-secondary/50 rounded-full overflow-hidden mt-2">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <h3 className="text-base font-semibold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>

            {/* Navigation */}
            <div className="p-4 pt-2 flex items-center justify-between border-t border-border/30">
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                disabled={currentStep === 0}
                className="text-muted-foreground h-8 px-2"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Anterior
              </Button>

              <div className="flex gap-1">
                {steps.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentStep(index)}
                    className={cn(
                      "w-1.5 h-1.5 rounded-full transition-all",
                      index === currentStep
                        ? "bg-amber-500 w-3"
                        : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                    )}
                  />
                ))}
              </div>

              <Button
                size="sm"
                onClick={handleNext}
                className={cn(
                  "h-8 px-3",
                  currentStep === steps.length - 1
                    ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:opacity-90"
                    : ""
                )}
              >
                {currentStep === steps.length - 1 ? (
                  <>
                    Começar!
                    <Rocket className="w-4 h-4 ml-1" />
                  </>
                ) : (
                  <>
                    Próximo
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
