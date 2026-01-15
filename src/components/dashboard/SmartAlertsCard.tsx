import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Type, Video, TrendingUp, Lightbulb, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { subDays, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Alert {
  id: string;
  type: "unused_titles" | "viral_video" | "goal_reminder" | "tip";
  title: string;
  description: string;
  icon: React.ReactNode;
  action?: string;
  route?: string;
  priority: "high" | "medium" | "low";
}

export function SmartAlertsCard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;

    const generateAlerts = async () => {
      const newAlerts: Alert[] = [];

      // Check unused titles
      const { data: unusedTitles, count: unusedCount } = await supabase
        .from("generated_titles")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .eq("is_used", false)
        .limit(1);

      if (unusedCount && unusedCount > 0) {
        newAlerts.push({
          id: "unused-titles",
          type: "unused_titles",
          title: `${unusedCount} título${unusedCount > 1 ? "s" : ""} não usado${unusedCount > 1 ? "s" : ""}`,
          description: "Você tem títulos prontos para usar no seu próximo vídeo",
          icon: <Type className="w-4 h-4" />,
          action: "Ver títulos",
          route: "/library",
          priority: "medium",
        });
      }

      // Check for viral videos from monitored channels
      const { data: notifications } = await supabase
        .from("video_notifications")
        .select("*, monitored_channels!inner(channel_name)")
        .eq("user_id", user.id)
        .eq("is_read", false)
        .limit(3);

      if (notifications && notifications.length > 0) {
        newAlerts.push({
          id: "viral-videos",
          type: "viral_video",
          title: `${notifications.length} novo${notifications.length > 1 ? "s" : ""} vídeo${notifications.length > 1 ? "s" : ""} de canais monitorados`,
          description: "Analise os novos vídeos para se inspirar",
          icon: <Video className="w-4 h-4" />,
          action: "Ver notificações",
          route: "/monitored-channels",
          priority: "high",
        });
      }

      // Check inactivity
      const weekAgo = subDays(new Date(), 7);
      const { data: recentActivity } = await supabase
        .from("activity_logs")
        .select("created_at")
        .eq("user_id", user.id)
        .gte("created_at", weekAgo.toISOString())
        .limit(1);

      if (!recentActivity || recentActivity.length === 0) {
        newAlerts.push({
          id: "inactivity",
          type: "goal_reminder",
          title: "Hora de voltar à ação!",
          description: "Você não produziu conteúdo esta semana. Que tal analisar um vídeo viral?",
          icon: <Clock className="w-4 h-4" />,
          action: "Analisar vídeo",
          route: "/analyzer",
          priority: "high",
        });
      }

      // Check niches analyzed
      const { data: videos } = await supabase
        .from("analyzed_videos")
        .select("detected_niche")
        .eq("user_id", user.id);

      if (videos && videos.length >= 5) {
        const nicheCount: Record<string, number> = {};
        videos.forEach(v => {
          if (v.detected_niche) {
            nicheCount[v.detected_niche] = (nicheCount[v.detected_niche] || 0) + 1;
          }
        });
        const topNiche = Object.entries(nicheCount).sort((a, b) => b[1] - a[1])[0];
        if (topNiche) {
          newAlerts.push({
            id: "niche-tip",
            type: "tip",
            title: `Seu nicho favorito: ${topNiche[0]}`,
            description: `Você já analisou ${topNiche[1]} vídeos deste nicho. Continue explorando!`,
            icon: <Lightbulb className="w-4 h-4" />,
            priority: "low",
          });
        }
      }

      // Check viral library size
      const { count: viralCount } = await supabase
        .from("viral_library")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      if (viralCount && viralCount >= 10) {
        newAlerts.push({
          id: "viral-library",
          type: "tip",
          title: `${viralCount} vídeos na biblioteca viral`,
          description: "Ótima coleção! Use esses vídeos como referência para seus roteiros",
          icon: <TrendingUp className="w-4 h-4" />,
          action: "Ver biblioteca",
          route: "/viral-library",
          priority: "low",
        });
      }

      setAlerts(newAlerts);
      setLoading(false);
    };

    generateAlerts();
  }, [user?.id]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "medium": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default: return "bg-primary/10 text-primary border-primary/20";
    }
  };

  return (
    <Card className="h-full flex flex-col border-border/50 bg-gradient-to-br from-card to-card/80">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            Alertas Inteligentes
          </CardTitle>
          {alerts.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {alerts.length} alerta{alerts.length > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="h-24 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground text-sm">Carregando...</div>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum alerta no momento</p>
            <p className="text-xs">Continue produzindo conteúdo!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.slice(0, 4).map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:scale-[1.02] ${getPriorityColor(alert.priority)}`}
                onClick={() => alert.route && navigate(alert.route)}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{alert.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{alert.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                    {alert.action && (
                      <p className="text-xs font-medium text-primary mt-1">{alert.action} →</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
