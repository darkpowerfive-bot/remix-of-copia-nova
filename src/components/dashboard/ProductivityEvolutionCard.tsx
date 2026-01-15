import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, Minus, Video, FileText, Image, Type, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface MonthData {
  month: string;
  videos: number;
  scripts: number;
  images: number;
  titles: number;
  total: number;
}

interface MetricSummary {
  label: string;
  value: number;
  trend: number;
  icon: React.ElementType;
  color: string;
}

export function ProductivityEvolutionCard() {
  const { user } = useAuth();
  const [data, setData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const fetchEvolution = async () => {
      setLoading(true);
      const months = 6;
      const now = new Date();
      const monthsData: MonthData[] = [];

      for (let i = months - 1; i >= 0; i--) {
        const targetMonth = subMonths(now, i);
        const monthStart = startOfMonth(targetMonth);
        const monthEnd = endOfMonth(targetMonth);

        const [videos, scripts, images, titles] = await Promise.all([
          supabase.from("analyzed_videos").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", monthStart.toISOString()).lte("created_at", monthEnd.toISOString()),
          supabase.from("generated_scripts").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", monthStart.toISOString()).lte("created_at", monthEnd.toISOString()),
          supabase.from("generated_images").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", monthStart.toISOString()).lte("created_at", monthEnd.toISOString()),
          supabase.from("generated_titles").select("*", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", monthStart.toISOString()).lte("created_at", monthEnd.toISOString()),
        ]);

        const v = videos.count || 0;
        const s = scripts.count || 0;
        const img = images.count || 0;
        const t = titles.count || 0;

        monthsData.push({
          month: format(targetMonth, "MMM", { locale: ptBR }),
          videos: v,
          scripts: s,
          images: img,
          titles: t,
          total: v + s + img + t,
        });
      }

      setData(monthsData);
      setLoading(false);
    };

    fetchEvolution();
  }, [user?.id]);

  const metrics = useMemo((): MetricSummary[] => {
    if (data.length < 2) return [];
    
    const current = data[data.length - 1];
    const previous = data[data.length - 2];
    
    const calcTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    return [
      { label: "Vídeos", value: current.videos, trend: calcTrend(current.videos, previous.videos), icon: Video, color: "hsl(var(--primary))" },
      { label: "Roteiros", value: current.scripts, trend: calcTrend(current.scripts, previous.scripts), icon: FileText, color: "#22c55e" },
      { label: "Imagens", value: current.images, trend: calcTrend(current.images, previous.images), icon: Image, color: "#f59e0b" },
      { label: "Títulos", value: current.titles, trend: calcTrend(current.titles, previous.titles), icon: Type, color: "#8b5cf6" },
    ];
  }, [data]);

  const totalTrend = useMemo(() => {
    if (data.length < 2) return 0;
    const current = data[data.length - 1].total;
    const previous = data[data.length - 2].total;
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  }, [data]);

  const TrendIcon = totalTrend > 0 ? TrendingUp : totalTrend < 0 ? TrendingDown : Minus;
  const trendColor = totalTrend > 0 ? "text-green-500" : totalTrend < 0 ? "text-red-500" : "text-muted-foreground";

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-2 shadow-lg text-xs">
          <p className="font-medium text-foreground mb-1 capitalize">{label}</p>
          <p className="text-primary font-semibold">Total: {payload[0]?.payload?.total}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="border-border/50 bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            Produtividade
          </CardTitle>
          <div className={cn("flex items-center gap-1 text-xs font-medium", trendColor)}>
            <TrendIcon className="w-3 h-3" />
            <span>{totalTrend > 0 ? "+" : ""}{totalTrend}%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {loading ? (
          <div className="h-32 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground text-sm">Carregando...</div>
          </div>
        ) : (
          <>
            {/* Mini metrics grid */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {metrics.map((metric) => (
                <div key={metric.label} className="text-center p-1.5 rounded-lg bg-muted/30">
                  <metric.icon className="w-3 h-3 mx-auto mb-0.5" style={{ color: metric.color }} />
                  <p className="text-sm font-bold" style={{ color: metric.color }}>{metric.value}</p>
                  <p className={cn(
                    "text-[10px]",
                    metric.trend > 0 ? "text-green-500" : metric.trend < 0 ? "text-red-500" : "text-muted-foreground"
                  )}>
                    {metric.trend > 0 ? "↑" : metric.trend < 0 ? "↓" : "="}{Math.abs(metric.trend)}%
                  </p>
                </div>
              ))}
            </div>

            {/* Simplified area chart */}
            <div className="h-24">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="totalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} vertical={false} />
                  <XAxis 
                    dataKey="month" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="total" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fill="url(#totalGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
