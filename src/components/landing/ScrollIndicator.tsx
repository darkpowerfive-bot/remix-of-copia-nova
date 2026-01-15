import { ChevronDown } from "lucide-react";

interface ScrollIndicatorProps {
  variant?: "mouse" | "arrow" | "dots" | "line";
}

export const ScrollIndicator = ({ variant = "mouse" }: ScrollIndicatorProps) => {
  if (variant === "mouse") {
    return (
      <div className="flex justify-center py-6 relative z-20">
        <div className="w-8 md:w-10 h-14 md:h-16 rounded-full border-2 border-border/50 bg-background/50 backdrop-blur-sm flex items-start justify-center p-2">
          <div className="w-1.5 md:w-2 h-4 md:h-5 rounded-full bg-primary animate-bounce" />
        </div>
      </div>
    );
  }

  if (variant === "arrow") {
    return (
      <div className="flex justify-center py-6 relative z-20">
        <div className="flex flex-col items-center gap-1">
          <ChevronDown className="w-6 h-6 text-primary animate-bounce" />
          <ChevronDown className="w-6 h-6 text-primary/60 animate-bounce [animation-delay:100ms] -mt-3" />
          <ChevronDown className="w-6 h-6 text-primary/30 animate-bounce [animation-delay:200ms] -mt-3" />
        </div>
      </div>
    );
  }

  if (variant === "dots") {
    return (
      <div className="flex justify-center py-6 relative z-20">
        <div className="flex flex-col items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
          <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse [animation-delay:150ms]" />
          <div className="w-2 h-2 rounded-full bg-primary/30 animate-pulse [animation-delay:300ms]" />
        </div>
      </div>
    );
  }

  if (variant === "line") {
    return (
      <div className="flex justify-center py-8 relative z-20">
        <div className="flex flex-col items-center gap-2">
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-primary to-transparent" />
          <div className="w-3 h-3 rounded-full border-2 border-primary animate-pulse" />
          <div className="w-px h-8 bg-gradient-to-b from-transparent via-primary/50 to-transparent" />
        </div>
      </div>
    );
  }

  return null;
};
