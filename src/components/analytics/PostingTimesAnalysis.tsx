import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Calendar, 
  TrendingUp, 
  Sparkles,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Globe,
  BarChart3,
  AlertCircle,
  Target,
  CheckCircle2,
  Info
} from "lucide-react";
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface VideoData {
  videoId: string;
  title: string;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
}

interface PostingTimesAnalysisProps {
  allVideos: VideoData[];
  channelName?: string;
}

interface DayAnalysis {
  day: string;
  dayPt: string;
  avgViews: number;
  videoCount: number;
  percentage: number;
}

interface HourAnalysis {
  hour: string;
  avgViews: number;
  videoCount: number;
  percentage: number;
}

interface ComboAnalysis {
  day: string;
  dayPt: string;
  hour: string;
  avgViews: number;
  videoCount: number;
}

interface WeeklyStats {
  weekKey: string;
  weekLabel: string;
  videoCount: number;
  totalViews: number;
  avgViewsPerVideo: number;
}

interface FrequencyRecommendation {
  level: 'low' | 'moderate' | 'good' | 'excellent';
  idealMin: number;
  idealMax: number;
  color: string;
  icon: 'warning' | 'info' | 'success';
  message: string;
  tip: string;
}

// Get frequency recommendation based on current average
const getFrequencyRecommendation = (avgPerWeek: number): FrequencyRecommendation => {
  if (avgPerWeek >= 5) {
    return {
      level: 'excellent',
      idealMin: 5,
      idealMax: 7,
      color: 'text-green-500',
      icon: 'success',
      message: 'Frequência excelente!',
      tip: 'Você está no ritmo ideal para canais de alto crescimento. Mantenha a consistência!'
    };
  } else if (avgPerWeek >= 3) {
    return {
      level: 'good',
      idealMin: 3,
      idealMax: 5,
      color: 'text-primary',
      icon: 'success',
      message: 'Boa frequência!',
      tip: 'Você está dentro do recomendado pelo YouTube (3-5 vídeos/semana). Para crescimento acelerado, considere aumentar para 5+.'
    };
  } else if (avgPerWeek >= 1) {
    return {
      level: 'moderate',
      idealMin: 1,
      idealMax: 3,
      color: 'text-amber-500',
      icon: 'info',
      message: 'Frequência moderada',
      tip: 'O algoritmo do YouTube favorece canais com 3+ vídeos semanais. Tente aumentar gradualmente sua produção.'
    };
  } else {
    return {
      level: 'low',
      idealMin: 0,
      idealMax: 1,
      color: 'text-red-500',
      icon: 'warning',
      message: 'Frequência baixa',
      tip: 'Postar menos de 1 vídeo por semana dificulta o crescimento. Meta inicial: pelo menos 2 vídeos/semana.'
    };
  }
};

const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toLocaleString("pt-BR");
};

const dayNames: Record<string, string> = {
  sunday: 'Domingo',
  monday: 'Segunda',
  tuesday: 'Terça',
  wednesday: 'Quarta',
  thursday: 'Quinta',
  friday: 'Sexta',
  saturday: 'Sábado'
};

const dayNamesEn = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const getTimeIcon = (hour: number) => {
  if (hour >= 5 && hour < 12) return <Sunrise className="w-4 h-4 text-amber-400" />;
  if (hour >= 12 && hour < 18) return <Sun className="w-4 h-4 text-yellow-500" />;
  if (hour >= 18 && hour < 21) return <Sunset className="w-4 h-4 text-orange-500" />;
  return <Moon className="w-4 h-4 text-indigo-400" />;
};

// Convert UTC date to Brazil timezone (UTC-3)
const toBrazilTime = (dateStr: string): Date => {
  const date = new Date(dateStr);
  // Brazil is UTC-3, so we subtract 3 hours from UTC
  // The publishedAt from YouTube is in UTC
  const brazilOffset = -3 * 60; // -3 hours in minutes
  const utcOffset = date.getTimezoneOffset(); // Current offset in minutes
  const brazilTime = new Date(date.getTime() + (utcOffset + brazilOffset) * 60000);
  return brazilTime;
};

// Get week number and year for grouping
const getWeekKey = (date: Date): string => {
  const startOfYear = new Date(date.getFullYear(), 0, 1);
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
  const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
  return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
};

const getWeekLabel = (weekKey: string): string => {
  const [year, week] = weekKey.split('-W');
  return `Semana ${parseInt(week)}/${year}`;
};

export const PostingTimesAnalysis = ({ allVideos, channelName }: PostingTimesAnalysisProps) => {
  if (!allVideos || allVideos.length < 5) {
    return null;
  }

  // Analyze posting patterns using Brazil timezone
  const byDay: Record<string, { views: number[]; count: number }> = {};
  const byHour: Record<string, { views: number[]; count: number }> = {};
  const byDayHour: Record<string, { views: number[]; count: number }> = {};
  const byWeek: Record<string, { views: number[]; count: number }> = {};

  for (const video of allVideos) {
    // Convert to Brazil timezone
    const brazilDate = toBrazilTime(video.publishedAt);
    const dayIndex = brazilDate.getDay();
    const hour = brazilDate.getHours();
    const dayName = dayNamesEn[dayIndex];
    const hourStr = `${hour.toString().padStart(2, '0')}:00`;
    const dayHourKey = `${dayName}-${hourStr}`;
    const weekKey = getWeekKey(brazilDate);

    // By day
    if (!byDay[dayName]) byDay[dayName] = { views: [], count: 0 };
    byDay[dayName].views.push(video.views);
    byDay[dayName].count++;

    // By hour
    if (!byHour[hourStr]) byHour[hourStr] = { views: [], count: 0 };
    byHour[hourStr].views.push(video.views);
    byHour[hourStr].count++;

    // By day + hour combo
    if (!byDayHour[dayHourKey]) byDayHour[dayHourKey] = { views: [], count: 0 };
    byDayHour[dayHourKey].views.push(video.views);
    byDayHour[dayHourKey].count++;

    // By week
    if (!byWeek[weekKey]) byWeek[weekKey] = { views: [], count: 0 };
    byWeek[weekKey].views.push(video.views);
    byWeek[weekKey].count++;
  }

  // Calculate averages
  const calculateAvg = (views: number[]) => views.length > 0 
    ? Math.round(views.reduce((a, b) => a + b, 0) / views.length) 
    : 0;
  
  const calculateTotal = (views: number[]) => views.reduce((a, b) => a + b, 0);

  // Weekly stats analysis
  const weeklyStats: WeeklyStats[] = Object.entries(byWeek)
    .map(([weekKey, data]) => ({
      weekKey,
      weekLabel: getWeekLabel(weekKey),
      videoCount: data.count,
      totalViews: calculateTotal(data.views),
      avgViewsPerVideo: calculateAvg(data.views)
    }))
    .sort((a, b) => b.weekKey.localeCompare(a.weekKey))
    .slice(0, 8); // Last 8 weeks

  // Calculate average videos per week
  const totalWeeks = Object.keys(byWeek).length;
  const avgVideosPerWeek = totalWeeks > 0 
    ? Math.round((allVideos.length / totalWeeks) * 10) / 10 
    : 0;

  // Find best week
  const bestWeek = weeklyStats.reduce((best, week) => 
    week.totalViews > (best?.totalViews || 0) ? week : best
  , weeklyStats[0]);

  // Get frequency recommendation
  const frequencyRec = getFrequencyRecommendation(avgVideosPerWeek);

  // Find max views for percentage calculation
  const allDayAvgs = Object.entries(byDay).map(([, data]) => calculateAvg(data.views));
  const maxDayAvg = Math.max(...allDayAvgs, 1);

  const bestDays: DayAnalysis[] = Object.entries(byDay)
    .map(([day, data]) => ({
      day,
      dayPt: dayNames[day],
      avgViews: calculateAvg(data.views),
      videoCount: data.count,
      percentage: Math.round((calculateAvg(data.views) / maxDayAvg) * 100),
    }))
    .sort((a, b) => b.avgViews - a.avgViews);

  const allHourAvgs = Object.entries(byHour).map(([, data]) => calculateAvg(data.views));
  const maxHourAvg = Math.max(...allHourAvgs, 1);

  const bestHours: HourAnalysis[] = Object.entries(byHour)
    .map(([hour, data]) => ({
      hour,
      avgViews: calculateAvg(data.views),
      videoCount: data.count,
      percentage: Math.round((calculateAvg(data.views) / maxHourAvg) * 100),
    }))
    .sort((a, b) => b.avgViews - a.avgViews)
    .slice(0, 6);

  // Only include day-hour combos with at least 2 videos for statistical significance
  const bestCombos: ComboAnalysis[] = Object.entries(byDayHour)
    .filter(([_, data]) => data.count >= 2)
    .map(([key, data]) => {
      const [day, hour] = key.split('-');
      return {
        day,
        dayPt: dayNames[day],
        hour,
        avgViews: calculateAvg(data.views),
        videoCount: data.count,
      };
    })
    .sort((a, b) => b.avgViews - a.avgViews)
    .slice(0, 5);

  // Generate insights
  const insights: string[] = [];
  const topDay = bestDays[0];
  const topHour = bestHours[0];
  const worstDay = bestDays[bestDays.length - 1];

  if (topDay && topDay.avgViews > 0) {
    const viewsDiff = topDay.avgViews - worstDay.avgViews;
    const percentage = worstDay.avgViews > 0 ? Math.round((viewsDiff / worstDay.avgViews) * 100) : 0;
    insights.push(`🔥 ${topDay.dayPt} é seu melhor dia! Vídeos postados nesse dia têm ${percentage > 0 ? `${percentage}% mais views` : 'melhor performance'} que ${worstDay.dayPt}.`);
  }

  if (topHour && topHour.avgViews > 0) {
    insights.push(`⏰ Melhor horário: ${topHour.hour} (horário de Brasília). Seus vídeos postados nesse horário alcançam em média ${formatNumber(topHour.avgViews)} views.`);
  }

  if (bestCombos.length > 0) {
    const bestCombo = bestCombos[0];
    insights.push(`💎 Combinação de ouro: ${bestCombo.dayPt} às ${bestCombo.hour} (BRT) - média de ${formatNumber(bestCombo.avgViews)} views.`);
  }

  // Weekly posting insights
  if (avgVideosPerWeek > 0) {
    if (avgVideosPerWeek >= 3) {
      insights.push(`📊 Frequência alta: você posta em média ${avgVideosPerWeek.toFixed(1)} vídeos por semana. Excelente consistência!`);
    } else if (avgVideosPerWeek >= 1) {
      insights.push(`📊 Frequência moderada: você posta em média ${avgVideosPerWeek.toFixed(1)} vídeos por semana. Tente aumentar para 3+ vídeos semanais.`);
    } else {
      insights.push(`📊 Frequência baixa: você posta menos de 1 vídeo por semana. Aumente a frequência para melhorar o alcance.`);
    }
  }

  if (bestWeek && bestWeek.videoCount > 1) {
    insights.push(`🏆 Sua melhor semana teve ${bestWeek.videoCount} vídeos com total de ${formatNumber(bestWeek.totalViews)} views.`);
  }

  // Weekend vs weekday analysis
  const weekendViews = (byDay['saturday']?.views || []).concat(byDay['sunday']?.views || []);
  const weekdayViews = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    .flatMap(d => byDay[d]?.views || []);
  
  if (weekendViews.length > 0 && weekdayViews.length > 0) {
    const avgWeekend = calculateAvg(weekendViews);
    const avgWeekday = calculateAvg(weekdayViews);
    
    if (avgWeekend > avgWeekday * 1.2) {
      insights.push(`📆 Fins de semana performam ${Math.round((avgWeekend / avgWeekday - 1) * 100)}% melhor que dias úteis no seu canal.`);
    } else if (avgWeekday > avgWeekend * 1.2) {
      insights.push(`💼 Dias úteis performam ${Math.round((avgWeekday / avgWeekend - 1) * 100)}% melhor que fins de semana no seu canal.`);
    }
  }

  // Evening analysis (Brazil prime time)
  const eveningHours = bestHours.filter(h => {
    const hour = parseInt(h.hour.split(':')[0]);
    return hour >= 18 && hour <= 22;
  });
  if (eveningHours.length > 0) {
    const bestEveningHour = eveningHours.reduce((a, b) => a.avgViews > b.avgViews ? a : b);
    insights.push(`🇧🇷 Horário nobre brasileiro (18h-22h): seu pico é às ${bestEveningHour.hour} com ${formatNumber(bestEveningHour.avgViews)} views em média.`);
  }

  return (
    <Card className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Melhores Dias e Horários</h3>
            <p className="text-xs text-muted-foreground">
              Baseado em {allVideos.length} vídeos analisados
            </p>
          </div>
        </div>
        <TooltipProvider>
          <UITooltip>
            <TooltipTrigger>
              <Badge variant="outline" className="text-xs gap-1">
                <Globe className="w-3 h-3" />
                Horário de Brasília
              </Badge>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">
                Todos os horários são convertidos para o fuso de Brasília (UTC-3) 
                para facilitar sua análise, independente do fuso do canal.
              </p>
            </TooltipContent>
          </UITooltip>
        </TooltipProvider>
      </div>

      {/* Weekly Stats Summary */}
      <div className="mb-6 p-4 rounded-lg bg-secondary/30 border border-border/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-medium text-foreground">Frequência de Postagem</h4>
          </div>
          <Badge 
            variant="outline" 
            className={`${frequencyRec.color} border-current`}
          >
            {frequencyRec.icon === 'success' && <CheckCircle2 className="w-3 h-3 mr-1" />}
            {frequencyRec.icon === 'info' && <Info className="w-3 h-3 mr-1" />}
            {frequencyRec.icon === 'warning' && <AlertCircle className="w-3 h-3 mr-1" />}
            {frequencyRec.message}
          </Badge>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className={`text-2xl font-bold ${frequencyRec.color}`}>{avgVideosPerWeek.toFixed(1)}</p>
            <p className="text-xs text-muted-foreground">Vídeos/Semana (média)</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{totalWeeks}</p>
            <p className="text-xs text-muted-foreground">Semanas analisadas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-500">{bestWeek?.videoCount || 0}</p>
            <p className="text-xs text-muted-foreground">Máximo em 1 semana</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-500">{formatNumber(bestWeek?.totalViews || 0)}</p>
            <p className="text-xs text-muted-foreground">Melhor semana (views)</p>
          </div>
        </div>

        {/* Frequency recommendation */}
        <div className="mt-4 p-3 rounded-lg bg-background/50 border border-border/30">
          <div className="flex items-start gap-2">
            <Target className={`w-4 h-4 ${frequencyRec.color} mt-0.5 shrink-0`} />
            <div>
              <p className="text-sm text-foreground font-medium">
                Meta ideal: <span className="text-primary">3-5 vídeos por semana</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {frequencyRec.tip}
              </p>
            </div>
          </div>
        </div>

        {/* YouTube Best Practices */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <div className={`p-2 rounded border ${avgVideosPerWeek >= 1 && avgVideosPerWeek < 3 ? 'border-amber-500/50 bg-amber-500/10' : 'border-border/30'}`}>
            <p className="text-xs font-medium text-muted-foreground">Mínimo</p>
            <p className="text-lg font-bold text-foreground">1-2</p>
            <p className="text-xs text-muted-foreground">vídeos/sem</p>
          </div>
          <div className={`p-2 rounded border ${avgVideosPerWeek >= 3 && avgVideosPerWeek < 5 ? 'border-primary/50 bg-primary/10' : 'border-border/30'}`}>
            <p className="text-xs font-medium text-muted-foreground">Ideal</p>
            <p className="text-lg font-bold text-primary">3-5</p>
            <p className="text-xs text-muted-foreground">vídeos/sem</p>
          </div>
          <div className={`p-2 rounded border ${avgVideosPerWeek >= 5 ? 'border-green-500/50 bg-green-500/10' : 'border-border/30'}`}>
            <p className="text-xs font-medium text-muted-foreground">Crescimento</p>
            <p className="text-lg font-bold text-green-500">5+</p>
            <p className="text-xs text-muted-foreground">vídeos/sem</p>
          </div>
        </div>
        
        {/* Weekly breakdown - last 4 weeks */}
        {weeklyStats.length > 0 && (
          <div className="mt-4 pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground mb-2">Últimas semanas:</p>
            <div className="flex flex-wrap gap-2">
              {weeklyStats.slice(0, 4).map((week) => (
                <Badge 
                  key={week.weekKey} 
                  variant="outline" 
                  className={`text-xs ${week.weekKey === bestWeek?.weekKey ? 'border-primary bg-primary/10' : ''}`}
                >
                  {week.weekLabel}: {week.videoCount} vídeo{week.videoCount !== 1 ? 's' : ''}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Best Days */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" />
            Melhores Dias da Semana
          </h4>
          <div className="space-y-2">
            {bestDays.map((day, idx) => (
              <div key={day.day} className="flex items-center gap-3">
                <span className={`w-20 text-sm font-medium ${idx === 0 ? 'text-primary' : 'text-foreground'}`}>
                  {day.dayPt}
                </span>
                <div className="flex-1 h-6 bg-secondary/50 rounded-full overflow-hidden relative">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      idx === 0 ? 'bg-gradient-to-r from-primary to-primary/70' : 
                      idx === 1 ? 'bg-gradient-to-r from-amber-500/80 to-amber-500/50' :
                      'bg-muted-foreground/30'
                    }`}
                    style={{ width: `${day.percentage}%` }}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-foreground">
                    {formatNumber(day.avgViews)}
                  </span>
                </div>
                <TooltipProvider>
                  <UITooltip>
                    <TooltipTrigger>
                      <Badge variant="outline" className="text-xs">
                        {day.videoCount}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{day.videoCount} vídeos postados</p>
                    </TooltipContent>
                  </UITooltip>
                </TooltipProvider>
              </div>
            ))}
          </div>
        </div>

        {/* Best Hours */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Melhores Horários - BRT (Top 6)
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {bestHours.map((hourData, idx) => {
              const hourNum = parseInt(hourData.hour.split(':')[0]);
              return (
                <div 
                  key={hourData.hour} 
                  className={`p-3 rounded-lg border ${
                    idx === 0 ? 'border-primary bg-primary/5' : 'border-border bg-secondary/30'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      {getTimeIcon(hourNum)}
                      <span className={`font-bold ${idx === 0 ? 'text-primary' : 'text-foreground'}`}>
                        {hourData.hour}
                      </span>
                    </div>
                    {idx === 0 && (
                      <Badge className="bg-primary/20 text-primary text-xs">
                        <Sparkles className="w-3 h-3 mr-1" />
                        Top
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatNumber(hourData.avgViews)} views média
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {hourData.videoCount} vídeos
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Golden Combos */}
      {bestCombos.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Combinações de Ouro (Dia + Horário BRT)
          </h4>
          <div className="flex flex-wrap gap-2">
            {bestCombos.map((combo, idx) => (
              <Badge 
                key={`${combo.day}-${combo.hour}`}
                variant={idx === 0 ? "default" : "outline"}
                className={`py-2 px-3 ${idx === 0 ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white' : ''}`}
              >
                <Calendar className="w-3 h-3 mr-1" />
                {combo.dayPt} às {combo.hour}
                <span className="ml-2 opacity-75">
                  ({formatNumber(combo.avgViews)} views)
                </span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* AI Insights */}
      {insights.length > 0 && (
        <div className="mt-6 pt-4 border-t border-border">
          <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            Insights Personalizados
          </h4>
          <div className="space-y-2">
            {insights.map((insight, idx) => (
              <div 
                key={idx}
                className="p-3 rounded-lg bg-secondary/50 border border-border/50 text-sm text-muted-foreground"
              >
                {insight}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timezone Notice */}
      <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
        <div className="flex items-start gap-2">
          <Globe className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-blue-500 mb-1">
              🇧🇷 Horários convertidos para Brasília (UTC-3)
            </p>
            <p className="text-xs text-muted-foreground">
              Os horários do YouTube são em UTC e foram convertidos para o fuso de Brasília para facilitar sua análise.
              {channelName && (
                <span className="block mt-1">
                  <strong>Dica:</strong> Se o canal "{channelName}" está em outro país (ex: Espanha UTC+1), 
                  os horários exibidos representam quando o vídeo foi postado no horário brasileiro - 
                  útil para entender quando seu público BR está online.
                </span>
              )}
            </p>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <Badge variant="outline" className="text-xs">
                🇧🇷 Brasil: UTC-3
              </Badge>
              <Badge variant="outline" className="text-xs">
                🇪🇸 Espanha: UTC+1 (+4h)
              </Badge>
              <Badge variant="outline" className="text-xs">
                🇺🇸 EUA (NY): UTC-5 (-2h)
              </Badge>
              <Badge variant="outline" className="text-xs">
                🇵🇹 Portugal: UTC+0 (+3h)
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendation */}
      <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
        <p className="text-sm text-foreground">
          <strong className="text-primary">📌 Recomendação:</strong>{' '}
          {topDay && topHour ? (
            <>
              Poste seus vídeos preferencialmente às <strong className="text-primary">{topHour.hour}</strong> (horário de Brasília)
              {' '}na <strong className="text-primary">{topDay.dayPt}</strong> para maximizar seu alcance inicial.
              {avgVideosPerWeek < 3 && (
                <> Tente manter uma frequência de pelo menos <strong className="text-primary">3 vídeos por semana</strong>.</>
              )}
            </>
          ) : (
            'Continue postando regularmente para coletar mais dados de análise.'
          )}
        </p>
      </div>
    </Card>
  );
};