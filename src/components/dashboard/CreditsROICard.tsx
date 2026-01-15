import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coins, TrendingUp, FileText, Image, Mic, Type } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { startOfMonth, endOfMonth } from "date-fns";
import { useQuery } from "@tanstack/react-query";

interface ToolUsage {
  label: string;
  icon: React.ReactNode;
  count: number;
  credits: number;
  avgCost: number;
}

// Cache de 10 minutos
const ROI_STALE_TIME = 10 * 60 * 1000;

export function CreditsROICard() {
  const { user } = useAuth();

  const { data, isLoading: loading } = useQuery({
    queryKey: ['credits-roi', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      // Fetch credit usage this month
      const { data: creditUsage } = await supabase
        .from("credit_usage")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", monthStart.toISOString())
        .lte("created_at", monthEnd.toISOString());

      // Aggregate by operation type
      const usageByType: Record<string, { count: number; credits: number }> = {};
      let total = 0;

      creditUsage?.forEach(usage => {
        const type = usage.operation_type;
        if (!usageByType[type]) {
          usageByType[type] = { count: 0, credits: 0 };
        }
        usageByType[type].count++;
        usageByType[type].credits += usage.credits_used;
        total += usage.credits_used;
      });

      // Map to display format
      const typeLabels: Record<string, { label: string; icon: React.ReactNode }> = {
        "script_generation": { label: "Roteiros", icon: <FileText className="w-4 h-4" /> },
        "generate_script_with_formula": { label: "Roteiros", icon: <FileText className="w-4 h-4" /> },
        "image_generation": { label: "Imagens", icon: <Image className="w-4 h-4" /> },
        "batch_images": { label: "Imagens Lote", icon: <Image className="w-4 h-4" /> },
        "audio_generation": { label: "Áudios", icon: <Mic className="w-4 h-4" /> },
        "title_generation": { label: "Títulos", icon: <Type className="w-4 h-4" /> },
        "analyze_video_titles": { label: "Títulos", icon: <Type className="w-4 h-4" /> },
        "video_analysis": { label: "Análises", icon: <TrendingUp className="w-4 h-4" /> },
        "scene_generation": { label: "Cenas", icon: <Image className="w-4 h-4" /> },
        "scene_prompts": { label: "Cenas", icon: <Image className="w-4 h-4" /> },
        "thumbnail_generation": { label: "Thumbnails", icon: <Image className="w-4 h-4" /> },
        "dashboard_insight": { label: "Insights IA", icon: <TrendingUp className="w-4 h-4" /> },
      };

      const toolsUsage: ToolUsage[] = Object.entries(usageByType)
        .map(([type, data]) => ({
          label: typeLabels[type]?.label || type.replace(/_/g, ' ').slice(0, 15),
          icon: typeLabels[type]?.icon || <Coins className="w-4 h-4" />,
          count: data.count,
          credits: data.credits,
          avgCost: data.count > 0 ? Math.round(data.credits / data.count) : 0,
        }))
        .sort((a, b) => b.credits - a.credits)
        .slice(0, 5);

      const totalContent = toolsUsage.reduce((sum, t) => sum + t.count, 0);

      return { totalSpent: total, totalContent, toolsUsage };
    },
    enabled: !!user?.id,
    staleTime: ROI_STALE_TIME,
    gcTime: 30 * 60 * 1000,
  });

  const totalSpent = data?.totalSpent || 0;
  const totalContent = data?.totalContent || 0;
  const toolsUsage = data?.toolsUsage || [];
  const costPerContent = totalContent > 0 ? Math.round(totalSpent / totalContent) : 0;

  return (
    <Card className="h-full flex flex-col border-border/50 bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Coins className="w-4 h-4 text-primary" />
          ROI de Créditos (Mês)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-32 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground text-sm">Carregando...</div>
          </div>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2 rounded-lg bg-muted/30 min-w-0">
                <p className="text-lg font-bold text-primary truncate">{totalSpent.toLocaleString()}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">Créditos gastos</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/30 min-w-0">
                <p className="text-lg font-bold text-foreground">{totalContent}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">Conteúdos</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-muted/30 min-w-0">
                <p className="text-lg font-bold text-green-500">{costPerContent}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">Custo médio</p>
              </div>
            </div>

            {/* Tools Breakdown */}
            {toolsUsage.length > 0 ? (
              <TooltipProvider>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Uso por Ferramenta</p>
                  {toolsUsage.map((tool, index) => (
                    <Tooltip key={`${tool.label}-${index}`}>
                      <TooltipTrigger asChild>
                        <div className="flex items-center justify-between p-2 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors cursor-default gap-2">
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <div className="text-primary flex-shrink-0">{tool.icon}</div>
                            <span className="text-sm text-foreground truncate">{tool.label}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{tool.count}x</span>
                            <span className="text-sm font-medium text-primary whitespace-nowrap">{tool.credits.toLocaleString()} cr</span>
                          </div>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left">
                        <p>Custo médio: {tool.avgCost} créditos</p>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TooltipProvider>
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                <Coins className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhum uso de créditos este mês</p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
