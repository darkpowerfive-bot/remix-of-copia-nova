import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Compass, TrendingUp, Star, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface NicheData {
  niche: string;
  count: number;
  avgViews: number;
  viralRate: number;
}

export function NicheSuggestionsCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [niches, setNiches] = useState<NicheData[]>([]);
  const [topNiche, setTopNiche] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const analyzeNiches = async () => {
      // Fetch all analyzed videos
      const { data: videos } = await supabase
        .from("analyzed_videos")
        .select("detected_niche, original_views")
        .eq("user_id", user.id);

      if (!videos || videos.length === 0) {
        setLoading(false);
        return;
      }

      // Aggregate by niche
      const nicheStats: Record<string, { count: number; totalViews: number; viralCount: number }> = {};

      videos.forEach(video => {
        const niche = video.detected_niche || "Outros";
        if (!nicheStats[niche]) {
          nicheStats[niche] = { count: 0, totalViews: 0, viralCount: 0 };
        }
        nicheStats[niche].count++;
        nicheStats[niche].totalViews += video.original_views || 0;
        if ((video.original_views || 0) >= 100000) {
          nicheStats[niche].viralCount++;
        }
      });

      // Convert to array and calculate metrics
      const nicheArray: NicheData[] = Object.entries(nicheStats)
        .map(([niche, stats]) => ({
          niche,
          count: stats.count,
          avgViews: Math.round(stats.totalViews / stats.count),
          viralRate: Math.round((stats.viralCount / stats.count) * 100),
        }))
        .sort((a, b) => b.count - a.count);

      setNiches(nicheArray.slice(0, 5));
      setTopNiche(nicheArray[0]?.niche || null);
      setLoading(false);
    };

    analyzeNiches();
  }, [user?.id]);

  const formatViews = (views: number) => {
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(0)}K`;
    return views.toString();
  };

  return (
    <Card className="border-border/50 bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" />
            Sugestões de Nicho
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => navigate("/explore-niche")}
          >
            Explorar <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-32 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground text-sm">Carregando...</div>
          </div>
        ) : niches.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Compass className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Analise vídeos para descobrir seu nicho ideal</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => navigate("/analyzer")}
            >
              Analisar vídeo
            </Button>
          </div>
        ) : (
          <>
            {/* Top Niche Highlight */}
            {topNiche && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Star className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-foreground">Seu foco principal</span>
                </div>
                <p className="text-lg font-bold text-primary">{topNiche}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {niches[0].count} vídeos analisados • {niches[0].viralRate}% taxa de viralização
                </p>
              </div>
            )}

            {/* Niches List */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nichos mais analisados</p>
              {niches.map((niche, index) => (
                <div
                  key={niche.niche}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-4">#{index + 1}</span>
                    <span className="text-sm text-foreground">{niche.niche}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {niche.count} vídeos
                    </Badge>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <TrendingUp className="w-3 h-3" />
                      {formatViews(niche.avgViews)} avg
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
