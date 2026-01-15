import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Rocket, X, RotateCcw } from "lucide-react";

interface SessionIndicatorProps {
  storageKeys: string[];
  onClear?: () => void;
  label?: string;
}

export function SessionIndicator({ storageKeys, onClear, label = "Sessão anterior" }: SessionIndicatorProps) {
  const [hasData, setHasData] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkForData = () => {
      const hasSavedData = storageKeys.some(key => {
        const value = localStorage.getItem(key);
        if (!value) return false;
        try {
          const parsed = JSON.parse(value);
          // Check if the value is meaningful (not empty string, empty array, or null)
          if (parsed === "" || parsed === null) return false;
          if (Array.isArray(parsed) && parsed.length === 0) return false;
          if (typeof parsed === "object" && Object.keys(parsed).length === 0) return false;
          return true;
        } catch {
          return value && value !== '""' && value !== "null" && value !== "[]";
        }
      });
      setHasData(hasSavedData);
    };

    checkForData();
  }, [storageKeys]);

  const handleClear = () => {
    storageKeys.forEach(key => localStorage.removeItem(key));
    setHasData(false);
    onClear?.();
  };

  if (!hasData || dismissed) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-card/80 backdrop-blur-sm border border-primary/30 rounded-xl shadow-lg mb-4">
      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
        <Rocket className="w-4 h-4 text-primary" />
      </div>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
        Dados restaurados
      </Badge>
      <div className="flex items-center gap-2 ml-auto">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-3 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
          onClick={handleClear}
        >
          <RotateCcw className="w-3 h-3 mr-1" />
          Limpar
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg"
          onClick={() => setDismissed(true)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
