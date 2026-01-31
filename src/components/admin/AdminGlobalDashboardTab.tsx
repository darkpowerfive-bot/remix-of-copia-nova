import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Video,
  Eye,
  Type,
  Image,
  TrendingUp,
  FileText,
  Mic,
  Coins,
  RefreshCw,
  Users,
  Loader2,
} from "lucide-react";
import { motion } from "framer-motion";

interface GlobalStats {
  totalVideosAnalyzed: number;
  totalViews: number;
  totalTitlesGenerated: number;
  totalImagesGenerated: number;
  totalScriptsGenerated: number;
  totalAudiosGenerated: number;
  totalViralVideos: number;
  totalCreditsUsed: number;
  totalUsers: number;
  activeUsers: number;
}

interface TopUser {
  id: string;
  email: string | null;
  full_name: string | null;
  count: number;
}

export function AdminGlobalDashboardTab() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<GlobalStats>({
    totalVideosAnalyzed: 0,
    totalViews: 0,
    totalTitlesGenerated: 0,
    totalImagesGenerated: 0,
    totalScriptsGenerated: 0,
    totalAudiosGenerated: 0,
    totalViralVideos: 0,
    totalCreditsUsed: 0,
    totalUsers: 0,
    activeUsers: 0,
  });
  const [topVideoUsers, setTopVideoUsers] = useState<TopUser[]>([]);
  const [topImageUsers, setTopImageUsers] = useState<TopUser[]>([]);
  const [topScriptUsers, setTopScriptUsers] = useState<TopUser[]>([]);

  const fetchGlobalStats = async () => {
    setLoading(true);
    try {
      // Fetch all stats in parallel
      const [
        videosResult,
        titlesResult,
        imagesResult,
        scriptsResult,
        audiosResult,
        usersResult,
        creditsUsageResult,
      ] = await Promise.all([
        supabase.from("analyzed_videos").select("original_views", { count: "exact" }),
        supabase.from("generated_titles").select("*", { count: "exact", head: true }),
        supabase.from("generated_images").select("*", { count: "exact", head: true }),
        supabase.from("generated_scripts").select("*", { count: "exact", head: true }),
        supabase.from("generated_audios").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("status", { count: "exact" }),
        supabase.from("credit_usage").select("credits_used"),
      ]);

      const videos = videosResult.data || [];
      const totalViews = videos.reduce((sum, v) => sum + (v.original_views || 0), 0);
      const viralVideos = videos.filter((v) => (v.original_views || 0) >= 100000).length;

      const activeUsers = (usersResult.data || []).filter(u => u.status === "active").length;

      const totalCreditsUsed = (creditsUsageResult.data || []).reduce(
        (sum, u) => sum + (u.credits_used || 0),
        0
      );

      setStats({
        totalVideosAnalyzed: videosResult.count || 0,
        totalViews,
        totalTitlesGenerated: titlesResult.count || 0,
        totalImagesGenerated: imagesResult.count || 0,
        totalScriptsGenerated: scriptsResult.count || 0,
        totalAudiosGenerated: audiosResult.count || 0,
        totalViralVideos: viralVideos,
        totalCreditsUsed: Math.round(totalCreditsUsed),
        totalUsers: usersResult.count || 0,
        activeUsers,
      });

      // Fetch top users by category
      await fetchTopUsers();
    } catch (error) {
      console.error("Error fetching global stats:", error);
      toast.error("Erro ao carregar estatísticas globais");
    } finally {
      setLoading(false);
    }
  };

  const fetchTopUsers = async () => {
    try {
      // Top users by videos analyzed
      const { data: videoStats } = await supabase
        .from("analyzed_videos")
        .select("user_id");

      const videoCountByUser = (videoStats || []).reduce((acc, v) => {
        acc[v.user_id] = (acc[v.user_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topVideoUserIds = Object.entries(videoCountByUser)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      // Top users by images generated
      const { data: imageStats } = await supabase
        .from("generated_images")
        .select("user_id");

      const imageCountByUser = (imageStats || []).reduce((acc, i) => {
        acc[i.user_id] = (acc[i.user_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topImageUserIds = Object.entries(imageCountByUser)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      // Top users by scripts generated
      const { data: scriptStats } = await supabase
        .from("generated_scripts")
        .select("user_id");

      const scriptCountByUser = (scriptStats || []).reduce((acc, s) => {
        acc[s.user_id] = (acc[s.user_id] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topScriptUserIds = Object.entries(scriptCountByUser)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

      // Fetch user details
      const allUserIds = [
        ...topVideoUserIds.map(([id]) => id),
        ...topImageUserIds.map(([id]) => id),
        ...topScriptUserIds.map(([id]) => id),
      ];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .in("id", allUserIds);

      const profileMap = (profiles || []).reduce((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {} as Record<string, { id: string; email: string | null; full_name: string | null }>);

      setTopVideoUsers(
        topVideoUserIds.map(([id, count]) => ({
          id,
          email: profileMap[id]?.email || null,
          full_name: profileMap[id]?.full_name || null,
          count,
        }))
      );

      setTopImageUsers(
        topImageUserIds.map(([id, count]) => ({
          id,
          email: profileMap[id]?.email || null,
          full_name: profileMap[id]?.full_name || null,
          count,
        }))
      );

      setTopScriptUsers(
        topScriptUserIds.map(([id, count]) => ({
          id,
          email: profileMap[id]?.email || null,
          full_name: profileMap[id]?.full_name || null,
          count,
        }))
      );
    } catch (error) {
      console.error("Error fetching top users:", error);
    }
  };

  useEffect(() => {
    fetchGlobalStats();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString("pt-BR");
  };

  const StatCard = ({
    icon: Icon,
    label,
    value,
    subLabel,
    color = "primary",
  }: {
    icon: React.ElementType;
    label: string;
    value: string | number;
    subLabel?: string;
    color?: string;
  }) => (
    <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
      <Card className="p-5 bg-card/60 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all">
        <div className="flex items-start justify-between mb-3">
          <div
            className={`w-10 h-10 rounded-lg bg-${color}/10 border border-${color}/20 flex items-center justify-center`}
          >
            <Icon className={`w-5 h-5 text-${color}`} />
          </div>
          {subLabel && (
            <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
              {subLabel}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mb-1">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </Card>
    </motion.div>
  );

  const TopUsersList = ({
    title,
    users,
    icon: Icon,
  }: {
    title: string;
    users: TopUser[];
    icon: React.ElementType;
  }) => (
    <Card className="p-5 bg-card/60 backdrop-blur-sm border-border/50">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-primary" />
        <h4 className="font-semibold text-foreground text-sm">{title}</h4>
      </div>
      {users.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
      ) : (
        <div className="space-y-3">
          {users.map((user, index) => (
            <div key={user.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground w-5">
                  #{index + 1}
                </span>
                <span className="text-sm text-foreground truncate max-w-[180px]">
                  {user.full_name || user.email || "Usuário"}
                </span>
              </div>
              <span className="text-sm font-semibold text-primary">{user.count}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Dashboard Global</h3>
          <p className="text-sm text-muted-foreground">
            Métricas agregadas de todos os usuários da plataforma
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchGlobalStats}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Atualizar
        </Button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <StatCard
          icon={Users}
          label="Total de Usuários"
          value={stats.totalUsers}
          subLabel={`${stats.activeUsers} ativos`}
        />
        <StatCard
          icon={Video}
          label="Vídeos Analisados"
          value={formatNumber(stats.totalVideosAnalyzed)}
          subLabel="TOTAL"
        />
        <StatCard
          icon={Eye}
          label="Views Analisadas"
          value={formatNumber(stats.totalViews)}
          subLabel="SOMA"
        />
        <StatCard
          icon={Type}
          label="Títulos Gerados"
          value={formatNumber(stats.totalTitlesGenerated)}
          subLabel="TOTAL"
        />
        <StatCard
          icon={Image}
          label="Imagens Geradas"
          value={formatNumber(stats.totalImagesGenerated)}
          subLabel="TOTAL"
        />
        <StatCard
          icon={FileText}
          label="Roteiros Criados"
          value={formatNumber(stats.totalScriptsGenerated)}
          subLabel="TOTAL"
        />
        <StatCard
          icon={Mic}
          label="Áudios Gerados"
          value={formatNumber(stats.totalAudiosGenerated)}
          subLabel="TOTAL"
        />
        <StatCard
          icon={TrendingUp}
          label="Vídeos Virais"
          value={formatNumber(stats.totalViralVideos)}
          subLabel="100K+ views"
        />
        <StatCard
          icon={Coins}
          label="Créditos Consumidos"
          value={formatNumber(stats.totalCreditsUsed)}
          subLabel="TOTAL"
        />
      </div>

      {/* Top Users Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TopUsersList
          title="Top Analisadores de Vídeos"
          users={topVideoUsers}
          icon={Video}
        />
        <TopUsersList
          title="Top Geradores de Imagens"
          users={topImageUsers}
          icon={Image}
        />
        <TopUsersList
          title="Top Criadores de Roteiros"
          users={topScriptUsers}
          icon={FileText}
        />
      </div>
    </div>
  );
}
