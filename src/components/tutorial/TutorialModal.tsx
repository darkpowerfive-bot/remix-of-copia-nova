import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { GuidedTutorial, type GuidedStep } from "./GuidedTutorial";

// Re-export GuidedTutorial as TutorialModal for backwards compatibility
export { GuidedTutorial as TutorialModal };
export type { GuidedStep as TutorialStep };

interface TutorialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  steps: GuidedStep[];
  onComplete: () => void;
}

// Wrapper component for backwards compatibility
export function LegacyTutorialModal(props: TutorialModalProps) {
  return <GuidedTutorial {...props} />;
}

// Button to reopen tutorial
export function TutorialHelpButton({
  onClick,
  className,
}: {
  onClick: () => void;
  className?: string;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn("h-8 px-2 text-muted-foreground hover:text-amber-500", className)}
    >
      <HelpCircle className="w-4 h-4 mr-1" />
      <span className="text-xs">Tutorial</span>
    </Button>
  );
}
