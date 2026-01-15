import { HardDrive, AlertTriangle } from "lucide-react";
import { useStorage } from "@/hooks/useStorage";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export function StorageIndicator() {
  const { storageUsed, storageLimit, usagePercent } = useStorage();
  const navigate = useNavigate();

  const isWarning = usagePercent >= 80;
  const isCritical = usagePercent >= 95;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={cn(
            "h-9 w-9 relative",
            isWarning && "text-primary",
            isCritical && "text-destructive animate-pulse"
          )}
        >
          <HardDrive className="h-4 w-4" />
          {isWarning && (
            <span className={cn(
              "absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background",
              isCritical ? "bg-destructive" : "bg-primary"
            )} />
          )}
          <span className="sr-only">Armazenamento</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 border-primary/30">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <HardDrive className={cn(
              "w-5 h-5",
              isCritical ? "text-destructive" : isWarning ? "text-primary" : "text-primary"
            )} />
            <span className="font-semibold">Armazenamento</span>
            {isWarning && (
              <span className={cn(
                "ml-auto text-xs font-medium px-2 py-0.5 rounded-full",
                isCritical 
                  ? "bg-destructive/20 text-destructive" 
                  : "bg-primary/20 text-primary"
              )}>
                {isCritical ? "Crítico" : "Alerta"}
              </span>
            )}
          </div>

          {isWarning && (
            <div className={cn(
              "flex items-start gap-2 p-2.5 rounded-lg text-sm",
              isCritical 
                ? "bg-destructive/10 border border-destructive/30" 
                : "bg-primary/10 border border-primary/30"
            )}>
              <AlertTriangle className={cn(
                "w-4 h-4 mt-0.5 shrink-0",
                isCritical ? "text-destructive" : "text-primary"
              )} />
              <span className={isCritical ? "text-destructive" : "text-primary"}>
                {isCritical 
                  ? "Armazenamento quase cheio! Exclua arquivos ou faça upgrade."
                  : "Você está usando mais de 80% do seu armazenamento."
                }
              </span>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Usado</span>
              <span className={cn(
                "font-medium",
                isCritical ? "text-destructive" : isWarning ? "text-primary" : ""
              )}>
                {storageUsed.toFixed(2)} GB
              </span>
            </div>
            <Progress 
              value={Math.min(usagePercent, 100)} 
              className={cn(
                "h-2",
                isCritical && "[&>div]:bg-destructive",
                isWarning && !isCritical && "[&>div]:bg-primary"
              )} 
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{usagePercent.toFixed(0)}% usado</span>
              <span>de {storageLimit.toFixed(1)} GB</span>
            </div>
          </div>

          {isWarning && (
            <Button 
              size="sm" 
              className="w-full"
              onClick={() => navigate('/plans')}
            >
              Fazer Upgrade
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
