import { Clock, Eye, MessageCircle, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RecentVideo {
  id: string;
  title: string;
  views: number | null;
  comments: number | null;
  channel: string;
  thumbnail_url: string;
  created_at: string;
}

interface RecentVideosCardProps {
  videos?: RecentVideo[];
  onRefresh?: () => void;
}

export function RecentVideosCard({ videos = [], onRefresh }: RecentVideosCardProps) {
  // Limitar a apenas 2 vídeos
  const displayedVideos = videos.slice(0, 2);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const displayStat = (num: number | null) => (num === null ? "—" : formatNumber(num));

  const handleDelete = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { error } = await supabase
        .from('analyzed_videos')
        .delete()
        .eq('id', videoId);

      if (error) throw error;

      toast.success('Vídeo removido com sucesso');
      onRefresh?.();
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Erro ao remover vídeo');
    }
  };

  return (
    <div className="group bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground text-sm">Vídeos Recentes</h3>
        </div>
        <span className="text-[10px] text-muted-foreground">{displayedVideos.length} de {videos.length}</span>
      </div>
      <div className="space-y-3">
        {displayedVideos.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-xs">
            Nenhum vídeo analisado ainda. Comece analisando vídeos virais!
          </div>
        ) : (
          displayedVideos.map((video) => (
            <motion.div
              key={video.id}
              className="relative bg-secondary/30 border border-border/30 rounded-lg p-4 transition-all duration-200 hover:bg-secondary/50 hover:border-primary/20 cursor-pointer overflow-hidden group/item"
              whileHover={{ x: 4 }}
              transition={{ duration: 0.2 }}
            >
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover/item:opacity-100 transition-opacity text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => handleDelete(video.id, e)}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
              <h4 className="font-medium text-foreground text-sm mb-2 line-clamp-1 pr-10">
                {video.title}
              </h4>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {displayStat(video.views)}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" />
                  {displayStat(video.comments)}
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground/70 mt-2">{video.channel}</p>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}