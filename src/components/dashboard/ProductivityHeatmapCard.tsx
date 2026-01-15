import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame, Calendar, Trophy, Zap, Target, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format, subDays, eachDayOfInterval, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";

interface DayActivity {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
}

const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Cache de 10 minutos para evitar refetch constante
const HEATMAP_STALE_TIME = 10 * 60 * 1000;

export function ProductivityHeatmapCard() {
  const { user } = useAuth();

  const { data, isLoading: loading } = useQuery({
    queryKey: ['productivity-heatmap', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const endDate = new Date();
      const startDate = subDays(endDate, 83); // ~12 weeks

      const { data: logs } = await supabase
        .from("activity_logs")
        .select("created_at")
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      // Count activities per day
      const activityByDay: Record<string, number> = {};
      const activityByDayOfWeek: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
      
      logs?.forEach(log => {
        const date = new Date(log.created_at!);
        const day = format(date, "yyyy-MM-dd");
        activityByDay[day] = (activityByDay[day] || 0) + 1;
        activityByDayOfWeek[getDay(date)] = (activityByDayOfWeek[getDay(date)] || 0) + 1;
      });

      // Calculate stats
      const total = logs?.length || 0;
      const daysWithActivity = Object.keys(activityByDay).length;
      const avg = daysWithActivity > 0 ? Math.round(total / daysWithActivity * 10) / 10 : 0;
      
      // Find most active day of week
      const maxDayActivity = Math.max(...Object.values(activityByDayOfWeek));
      const mostActiveDayIndex = Object.entries(activityByDayOfWeek).find(([_, v]) => v === maxDayActivity)?.[0];
      const mostActiveDayName = mostActiveDayIndex !== undefined ? dayNames[parseInt(mostActiveDayIndex)] : "-";

      // Generate all days in range
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const maxCount = Math.max(...Object.values(activityByDay), 1);

      const heatmapData: DayActivity[] = days.map(day => {
        const dateStr = format(day, "yyyy-MM-dd");
        const count = activityByDay[dateStr] || 0;
        let level: 0 | 1 | 2 | 3 | 4 = 0;
        if (count > 0) {
          const ratio = count / maxCount;
          if (ratio >= 0.75) level = 4;
          else if (ratio >= 0.5) level = 3;
          else if (ratio >= 0.25) level = 2;
          else level = 1;
        }
        return { date: dateStr, count, level };
      });

      // Calculate streaks
      let currentStreak = 0;
      let maxStreak = 0;
      let tempStreak = 0;

      for (let i = heatmapData.length - 1; i >= 0; i--) {
        if (heatmapData[i].count > 0) {
          tempStreak++;
          if (i === heatmapData.length - 1 || i === heatmapData.length - 2) {
            currentStreak = tempStreak;
          }
        } else {
          if (tempStreak > maxStreak) maxStreak = tempStreak;
          tempStreak = 0;
          if (i === heatmapData.length - 1) currentStreak = 0;
        }
      }
      if (tempStreak > maxStreak) maxStreak = tempStreak;

      return {
        heatmapData,
        streak: currentStreak,
        bestStreak: maxStreak,
        totalActivities: total,
        avgPerDay: avg,
        mostActiveDay: mostActiveDayName,
        activeDays: daysWithActivity
      };
    },
    enabled: !!user?.id,
    staleTime: HEATMAP_STALE_TIME,
    gcTime: 30 * 60 * 1000,
  });

  const heatmapData = data?.heatmapData || [];
  const streak = data?.streak || 0;
  const bestStreak = data?.bestStreak || 0;
  const totalActivities = data?.totalActivities || 0;
  const avgPerDay = data?.avgPerDay || 0;
  const mostActiveDay = data?.mostActiveDay || "-";
  const activeDays = data?.activeDays || 0;

  // Group by weeks for display
  const weeks: DayActivity[][] = [];
  for (let i = 0; i < heatmapData.length; i += 7) {
    weeks.push(heatmapData.slice(i, i + 7));
  }

  const levelColors = [
    "bg-muted",
    "bg-primary/20",
    "bg-primary/40",
    "bg-primary/60",
    "bg-primary",
  ];

  return (
    <Card className="border-border/50 bg-gradient-to-br from-card to-card/80 h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Mapa de Produtividade
          </CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-muted-foreground">Streak:</span>
              <span className="font-bold text-foreground">{streak} dias</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <Trophy className="w-4 h-4 text-yellow-500" />
              <span className="text-muted-foreground">Recorde:</span>
              <span className="font-bold text-foreground">{bestStreak} dias</span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="h-24 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground text-sm">Carregando...</div>
          </div>
        ) : (
          <>
            {/* Stats Row */}
            <div className="grid grid-cols-4 gap-2">
              <div className="p-2 rounded-lg bg-muted/30 border border-border/30 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Zap className="w-3 h-3 text-primary" />
                </div>
                <p className="text-lg font-bold text-foreground">{totalActivities}</p>
                <p className="text-[10px] text-muted-foreground">Total Ações</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/30 border border-border/30 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Target className="w-3 h-3 text-green-500" />
                </div>
                <p className="text-lg font-bold text-foreground">{activeDays}</p>
                <p className="text-[10px] text-muted-foreground">Dias Ativos</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/30 border border-border/30 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="w-3 h-3 text-blue-500" />
                </div>
                <p className="text-lg font-bold text-foreground">{avgPerDay}</p>
                <p className="text-[10px] text-muted-foreground">Média/Dia</p>
              </div>
              <div className="p-2 rounded-lg bg-muted/30 border border-border/30 text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Calendar className="w-3 h-3 text-purple-500" />
                </div>
                <p className="text-lg font-bold text-foreground">{mostActiveDay}</p>
                <p className="text-[10px] text-muted-foreground">Melhor Dia</p>
              </div>
            </div>

            {/* Heatmap */}
            <TooltipProvider>
              <div className="flex gap-1 overflow-x-auto pb-1">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {week.map((day) => (
                      <Tooltip key={day.date}>
                        <TooltipTrigger asChild>
                          <div
                            className={`w-3 h-3 rounded-sm ${levelColors[day.level]} transition-all hover:scale-125 cursor-default`}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          <p className="font-medium">{format(new Date(day.date), "dd MMM yyyy", { locale: ptBR })}</p>
                          <p className="text-muted-foreground">{day.count} atividades</p>
                        </TooltipContent>
                      </Tooltip>
                    ))}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-end gap-1.5 text-xs text-muted-foreground">
                <span>Menos</span>
                {levelColors.map((color, i) => (
                  <div key={i} className={`w-3 h-3 rounded-sm ${color}`} />
                ))}
                <span>Mais</span>
              </div>
            </TooltipProvider>
          </>
        )}
      </CardContent>
    </Card>
  );
}
