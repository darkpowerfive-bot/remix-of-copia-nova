import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { startOfMonth, subMonths, endOfMonth } from "date-fns";
import { useQuery } from "@tanstack/react-query";

interface ComparisonMetric {
  label: string;
  current: number;
  previous: number;
  change: number;
}

// Cache de 10 minutos
const COMPARISON_STALE_TIME = 10 * 60 * 1000;

export function MonthlyComparisonCard() {
  const { user } = useAuth();

  const { data: metrics = [], isLoading: loading } = useQuery({
    queryKey: ['monthly-comparison', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const now = new Date();
      const currentStart = startOfMonth(now);
      const currentEnd = now;
      const previousStart = startOfMonth(subMonths(now, 1));
      const previousEnd = endOfMonth(subMonths(now, 1));

      const [
        currentVideos,
        previousVideos,
        currentScripts,
        previousScripts,
        currentImages,
        previousImages,
        currentTitles,
        previousTitles,
      ] = await Promise.all([
        supabase.from("analyzed_videos").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", currentStart.toISOString()).lte("created_at", currentEnd.toISOString()),
        supabase.from("analyzed_videos").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", previousStart.toISOString()).lte("created_at", previousEnd.toISOString()),
        supabase.from("generated_scripts").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", currentStart.toISOString()).lte("created_at", currentEnd.toISOString()),
        supabase.from("generated_scripts").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", previousStart.toISOString()).lte("created_at", previousEnd.toISOString()),
        supabase.from("generated_images").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", currentStart.toISOString()).lte("created_at", currentEnd.toISOString()),
        supabase.from("generated_images").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", previousStart.toISOString()).lte("created_at", previousEnd.toISOString()),
        supabase.from("generated_titles").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", currentStart.toISOString()).lte("created_at", currentEnd.toISOString()),
        supabase.from("generated_titles").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", previousStart.toISOString()).lte("created_at", previousEnd.toISOString()),
      ]);

      const calculateChange = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100 : 0;
        return Math.round(((current - previous) / previous) * 100);
      };

      return [
        {
          label: "Vídeos Analisados",
          current: currentVideos.count || 0,
          previous: previousVideos.count || 0,
          change: calculateChange(currentVideos.count || 0, previousVideos.count || 0),
        },
        {
          label: "Roteiros",
          current: currentScripts.count || 0,
          previous: previousScripts.count || 0,
          change: calculateChange(currentScripts.count || 0, previousScripts.count || 0),
        },
        {
          label: "Imagens",
          current: currentImages.count || 0,
          previous: previousImages.count || 0,
          change: calculateChange(currentImages.count || 0, previousImages.count || 0),
        },
        {
          label: "Títulos",
          current: currentTitles.count || 0,
          previous: previousTitles.count || 0,
          change: calculateChange(currentTitles.count || 0, previousTitles.count || 0),
        },
      ];
    },
    enabled: !!user?.id,
    staleTime: COMPARISON_STALE_TIME,
    gcTime: 30 * 60 * 1000,
  });

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  const getTrendColor = (change: number) => {
    if (change > 0) return "text-green-500";
    if (change < 0) return "text-red-500";
    return "text-muted-foreground";
  };

  return (
    <Card className="border-border/50 bg-gradient-to-br from-card to-card/80 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          Comparativo Mensal
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-24 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground text-sm">Carregando...</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {metrics.map((metric) => (
              <div
                key={metric.label}
                className="p-3 rounded-lg bg-muted/30 border border-border/30"
              >
                <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold text-foreground">{metric.current}</span>
                  <div className="flex items-center gap-1">
                    {getTrendIcon(metric.change)}
                    <span className={`text-sm font-medium ${getTrendColor(metric.change)}`}>
                      {metric.change > 0 ? "+" : ""}{metric.change}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  vs mês anterior: {metric.previous}
                </p>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
