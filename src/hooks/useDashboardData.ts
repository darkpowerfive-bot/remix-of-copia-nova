import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface DashboardStats {
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  viralVideos: number;
  avgCTR: number;
  scriptsGenerated: number;
  imagesGenerated: number;
  audiosGenerated: number;
  titlesGenerated: number;
}

interface RecentVideo {
  id: string;
  title: string;
  views: number | null;
  comments: number | null;
  channel: string;
  thumbnail_url: string;
  created_at: string;
}

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  created_at: string;
}

interface DashboardData {
  stats: DashboardStats;
  recentVideos: RecentVideo[];
  activityLogs: ActivityLog[];
}

// Cache mais agressivo: 10 minutos stale, 30 minutos garbage collection
// Isso evita refetch constante ao navegar entre ferramentas
const DASHBOARD_STALE_TIME = 10 * 60 * 1000;
const DASHBOARD_GC_TIME = 30 * 60 * 1000;

const defaultStats: DashboardStats = {
  totalVideos: 0,
  totalViews: 0,
  totalLikes: 0,
  totalComments: 0,
  viralVideos: 0,
  avgCTR: 0,
  scriptsGenerated: 0,
  imagesGenerated: 0,
  audiosGenerated: 0,
  titlesGenerated: 0,
};

export function useDashboardData() {
  const { user } = useAuth();

  const { data, isLoading: loading, refetch } = useQuery({
    queryKey: ['dashboard-data', user?.id],
    queryFn: async (): Promise<DashboardData> => {
      if (!user?.id) {
        return { stats: defaultStats, recentVideos: [], activityLogs: [] };
      }

      // Parallel queries for performance
      const [videosResult, scriptsResult, imagesResult, audiosResult, titlesResult, logsResult] = 
        await Promise.all([
          supabase.from("analyzed_videos").select("*").eq("user_id", user.id),
          supabase.from("generated_scripts").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("generated_images").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("generated_audios").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("generated_titles").select("*", { count: "exact", head: true }).eq("user_id", user.id),
          supabase.from("activity_logs").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
        ]);

      const videos = videosResult.data || [];
      
      const totalVideos = videos.length;
      const totalViews = videos.reduce((sum, v) => sum + (v.original_views || 0), 0);
      const totalComments = videos.reduce((sum, v) => sum + (v.original_comments || 0), 0);
      const viralVideos = videos.filter(v => (v.original_views || 0) >= 100000).length;

      const recentVids: RecentVideo[] = videos
        .sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime())
        .slice(0, 5)
        .map(v => ({
          id: v.id,
          title: v.original_title || v.translated_title || "Sem título",
          views: v.original_views ?? null,
          comments: v.original_comments ?? null,
          channel: v.detected_niche || "Canal",
          thumbnail_url: v.original_thumbnail_url || "",
          created_at: v.created_at || "",
        }));

      const activityLogs: ActivityLog[] = (logsResult.data || []).map(l => ({
        id: l.id,
        action: l.action,
        description: l.description || "",
        created_at: l.created_at || "",
      }));

      return {
        stats: {
          totalVideos,
          totalViews,
          totalLikes: 0,
          totalComments,
          viralVideos,
          avgCTR: 0,
          scriptsGenerated: scriptsResult.count || 0,
          imagesGenerated: imagesResult.count || 0,
          audiosGenerated: audiosResult.count || 0,
          titlesGenerated: titlesResult.count || 0,
        },
        recentVideos: recentVids,
        activityLogs,
      };
    },
    enabled: !!user?.id,
    staleTime: DASHBOARD_STALE_TIME,
    gcTime: DASHBOARD_GC_TIME,
  });

  return {
    stats: data?.stats || defaultStats,
    recentVideos: data?.recentVideos || [],
    activityLogs: data?.activityLogs || [],
    loading,
    refetch,
  };
}
