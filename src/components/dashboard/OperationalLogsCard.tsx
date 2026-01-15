import { Zap, ClipboardList, Activity, Video, FileText, Image, Mic, Play, Rocket, FolderOpen, Tag, Settings, Search, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ActivityLog {
  id: string;
  action: string;
  description: string;
  created_at: string;
}

interface OperationalLogsCardProps {
  logs?: ActivityLog[];
}

const getActionIcon = (action: string) => {
  switch (action) {
    case 'video_analysis':
      return Video;
    case 'script_generated':
      return FileText;
    case 'image_generated':
      return Image;
    case 'tts_generated':
      return Mic;
    case 'scene_generated':
      return Play;
    case 'thumbnail_generated':
      return Rocket;
    case 'channel_analysis':
      return BarChart3;
    case 'title_generated':
      return Tag;
    case 'folder_created':
      return FolderOpen;
    case 'settings_updated':
      return Settings;
    case 'search_performed':
      return Search;
    default:
      return Activity;
  }
};

const getActionLabel = (action: string) => {
  switch (action) {
    case 'video_analysis':
      return 'Vídeo analisado';
    case 'script_generated':
      return 'Roteiro gerado';
    case 'image_generated':
      return 'Imagem gerada';
    case 'tts_generated':
      return 'Áudio gerado';
    case 'scene_generated':
      return 'Cenas geradas';
    case 'thumbnail_generated':
      return 'Thumbnail gerada';
    case 'channel_analysis':
      return 'Canal analisado';
    case 'title_generated':
      return 'Títulos gerados';
    case 'folder_created':
      return 'Pasta criada';
    case 'settings_updated':
      return 'Configurações atualizadas';
    case 'search_performed':
      return 'Pesquisa realizada';
    default:
      return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
};

const getActionColor = (action: string) => {
  switch (action) {
    case 'video_analysis':
      return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    case 'script_generated':
      return 'text-green-500 bg-green-500/10 border-green-500/20';
    case 'image_generated':
      return 'text-purple-500 bg-purple-500/10 border-purple-500/20';
    case 'tts_generated':
      return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    case 'scene_generated':
      return 'text-pink-500 bg-pink-500/10 border-pink-500/20';
    case 'thumbnail_generated':
      return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    case 'channel_analysis':
      return 'text-cyan-500 bg-cyan-500/10 border-cyan-500/20';
    default:
      return 'text-primary bg-primary/10 border-primary/20';
  }
};

export function OperationalLogsCard({ logs = [] }: OperationalLogsCardProps) {
  return (
    <div className="group bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground text-sm">Registros Operacionais</h3>
        </div>
        {logs.length > 0 && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
            {logs.length} recentes
          </span>
        )}
      </div>
      
      {logs.length === 0 ? (
        <motion.div 
          className="flex flex-col items-center justify-center py-10 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <div className="relative mb-4">
            <div className="w-14 h-14 rounded-full bg-secondary/50 border border-border/50 flex items-center justify-center">
              <ClipboardList className="w-6 h-6 text-muted-foreground/50" />
            </div>
            <motion.div 
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center"
              animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Activity className="w-2 h-2 text-primary" />
            </motion.div>
          </div>
          <p className="text-muted-foreground text-xs">Nenhum registro operacional ainda.</p>
          <p className="text-muted-foreground/60 text-[10px] mt-1">Suas atividades aparecerão aqui</p>
        </motion.div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
          {logs.map((log, index) => {
            const IconComponent = getActionIcon(log.action);
            const colorClass = getActionColor(log.action);
            
            return (
              <motion.div
                key={log.id}
                className="p-3 bg-secondary/30 border border-border/30 rounded-lg hover:bg-secondary/50 transition-colors"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <IconComponent className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-foreground font-medium">
                        {getActionLabel(log.action)}
                      </p>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                    {log.description && (
                      <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">{log.description}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
