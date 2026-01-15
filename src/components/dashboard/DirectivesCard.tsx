import { Lightbulb, Rocket, TrendingUp, Target, Zap, Brain, RefreshCw, Loader2, Coins, AlertTriangle } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface DirectivesCardProps {
  stats?: {
    totalVideos: number;
    totalViews: number;
    scriptsGenerated: number;
    imagesGenerated: number;
    audiosGenerated: number;
    titlesGenerated: number;
    viralVideos: number;
  };
}

interface AIDirective {
  title: string;
  tip: string;
  icon: 'target' | 'brain' | 'zap' | 'trending' | 'rocket';
}

interface CachedDirective {
  directive: AIDirective;
  timestamp: number;
  statsHash: string;
}

const CACHE_KEY = 'dashboard_directive_cache';

const iconMap = {
  target: Target,
  brain: Brain,
  zap: Zap,
  trending: TrendingUp,
  rocket: Rocket,
};

// Gera hash das stats para detectar mudanças significativas
function generateStatsHash(stats: DirectivesCardProps['stats']): string {
  const s = stats || { totalVideos: 0, totalViews: 0, scriptsGenerated: 0, imagesGenerated: 0, audiosGenerated: 0, titlesGenerated: 0, viralVideos: 0 };
  return `${s.totalVideos}-${s.scriptsGenerated}-${s.imagesGenerated}-${s.audiosGenerated}`;
}

export function DirectivesCard({ stats }: DirectivesCardProps) {
  const { user } = useAuth();
  const { directiveUpdateHours } = useUserPreferences();
  const [directive, setDirective] = useState<AIDirective | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [showRefreshConfirm, setShowRefreshConfirm] = useState(false);
  const [isFromCache, setIsFromCache] = useState(false);
  
  // Cache duration based on user preference (convert hours to ms)
  const cacheDurationMs = directiveUpdateHours * 60 * 60 * 1000;

  // Carrega do cache
  const loadFromCache = (): CachedDirective | null => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;
      return JSON.parse(cached) as CachedDirective;
    } catch {
      return null;
    }
  };

  // Salva no cache
  const saveToCache = (dir: AIDirective, statsHash: string) => {
    try {
      const cacheData: CachedDirective = {
        directive: dir,
        timestamp: Date.now(),
        statsHash,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    } catch (e) {
      console.error('Error saving directive cache:', e);
    }
  };

  // Verifica se o cache é válido
  const isCacheValid = (cached: CachedDirective, currentStatsHash: string): boolean => {
    const now = Date.now();
    const isExpired = now - cached.timestamp > cacheDurationMs;
    const statsChanged = cached.statsHash !== currentStatsHash;
    
    // Cache inválido se expirou OU se stats mudaram significativamente
    return !isExpired && !statsChanged;
  };

  const fetchAIDirective = async (forceRefresh = false) => {
    if (!user) return;

    const currentStatsHash = generateStatsHash(stats);
    
    // Se não for forçado, tenta usar cache
    if (!forceRefresh) {
      const cached = loadFromCache();
      if (cached && isCacheValid(cached, currentStatsHash)) {
        console.log('[DirectivesCard] Using cached directive');
        setDirective(cached.directive);
        setLastFetch(new Date(cached.timestamp));
        setIsFromCache(true);
        return;
      }
    }
    
    setLoading(true);
    setIsFromCache(false);
    
    try {
      const s = stats || { totalVideos: 0, totalViews: 0, scriptsGenerated: 0, imagesGenerated: 0, audiosGenerated: 0, titlesGenerated: 0, viralVideos: 0 };
      
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          type: 'dashboard_insight',
          stats: {
            totalVideos: s.totalVideos,
            totalViews: s.totalViews,
            scriptsGenerated: s.scriptsGenerated,
            imagesGenerated: s.imagesGenerated,
            audiosGenerated: s.audiosGenerated,
            titlesGenerated: s.titlesGenerated,
            viralVideos: s.viralVideos,
          }
        }
      });

      if (error) throw error;

      if (data?.directive) {
        setDirective(data.directive);
        setLastFetch(new Date());
        saveToCache(data.directive, currentStatsHash);
      }
    } catch (error) {
      console.error('Error fetching AI directive:', error);
      // Fallback to local directive
      const fallback = getLocalDirective(stats);
      setDirective(fallback);
      setLastFetch(new Date());
    } finally {
      setLoading(false);
    }
  };

  // Handle manual refresh with confirmation
  const handleRefreshClick = () => {
    // Mostra confirmação apenas se já tiver uma diretiva
    if (directive) {
      setShowRefreshConfirm(true);
    } else {
      fetchAIDirective(true);
    }
  };

  const confirmRefresh = () => {
    setShowRefreshConfirm(false);
    fetchAIDirective(true);
  };

  // Local fallback
  const getLocalDirective = (stats: DirectivesCardProps['stats']): AIDirective => {
    const s = stats || { totalVideos: 0, totalViews: 0, scriptsGenerated: 0, imagesGenerated: 0, audiosGenerated: 0, titlesGenerated: 0, viralVideos: 0 };
    
    if (s.totalVideos === 0) {
      return {
        icon: 'target',
        title: "Inicie sua Pesquisa Viral",
        tip: "Canais Dark precisam de padrões. Analise 5-10 vídeos virais do seu nicho para identificar thumbnails, hooks e estruturas que geram milhões de views.",
      };
    }
    
    if (s.totalVideos > 0 && s.scriptsGenerated === 0) {
      return {
        icon: 'brain',
        title: "Crie seu Primeiro Roteiro",
        tip: `Você analisou ${s.totalVideos} vídeos. Use os Agentes de Roteiro para transformar esses padrões virais em scripts otimizados para narração Dark.`,
      };
    }
    
    if (s.scriptsGenerated > 0 && s.audiosGenerated === 0) {
      return {
        icon: 'zap',
        title: "Gere Narração Profissional",
        tip: `${s.scriptsGenerated} roteiros prontos! Canais Dark dependem de voz grave e envolvente. Use o Gerador de Voz para criar narrações impactantes.`,
      };
    }
    
    const avgViews = s.totalViews / Math.max(s.totalVideos, 1);
    if (avgViews >= 50000) {
      return {
        icon: 'rocket',
        title: "Escale sua Produção",
        tip: `Excelente! Média de ${(avgViews / 1000).toFixed(0)}K views. Mantenha consistência: 3-4 vídeos/semana é o sweet spot para canais Dark viralizarem.`,
      };
    }
    
    return {
      icon: 'trending',
      title: "Otimize para Algoritmo",
      tip: "Foque em thumbnails com rostos, expressões intensas e texto bold. Títulos Dark com palavras como 'Proibido', 'Segredo' e 'Nunca Revelado' têm 3x mais CTR.",
    };
  };

  useEffect(() => {
    // Carrega diretiva do cache ou da API no mount
    if (!directive && user) {
      fetchAIDirective(false);
    }
  }, [user]);

  // Recarrega se stats mudarem significativamente (não a cada hora)
  useEffect(() => {
    if (!user || !directive) return;
    
    const currentStatsHash = generateStatsHash(stats);
    const cached = loadFromCache();
    
    // Só recarrega se as stats mudaram E já passou 1 hora desde última atualização
    if (cached && cached.statsHash !== currentStatsHash) {
      const timeSinceLastFetch = Date.now() - cached.timestamp;
      if (timeSinceLastFetch > 60 * 60 * 1000) { // 1 hora
        console.log('[DirectivesCard] Stats changed significantly, refreshing');
        fetchAIDirective(false);
      }
    }
  }, [stats?.totalVideos, stats?.scriptsGenerated, stats?.imagesGenerated]);

  const currentDirective = directive || getLocalDirective(stats);
  const IconComponent = iconMap[currentDirective.icon] || Rocket;

  // Formata o tempo desde última atualização
  const getLastUpdateText = () => {
    if (!lastFetch) return null;
    
    const now = new Date();
    const diffMs = now.getTime() - lastFetch.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}min atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    return lastFetch.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  };

  return (
    <>
      <div className="group h-full bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Lightbulb className="w-4 h-4 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground text-sm">Diretivas IA</h3>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={handleRefreshClick}
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                  ) : (
                    <RefreshCw className="w-3 h-3 text-muted-foreground hover:text-primary" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Atualizar diretiva (gratuito 1x/dia)</p>
              </TooltipContent>
            </Tooltip>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              Especialista Dark
            </span>
          </div>
        </div>
        <motion.div 
          className="bg-gradient-to-br from-primary/5 to-transparent border border-primary/10 rounded-lg p-4"
          whileHover={{ scale: 1.01 }}
          transition={{ duration: 0.2 }}
          key={currentDirective.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/25 flex items-center justify-center flex-shrink-0 mt-0.5">
              <IconComponent className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <h4 className="font-medium text-primary text-sm mb-2">
                {currentDirective.title}
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {currentDirective.tip}
              </p>
            </div>
          </div>
        </motion.div>
        {lastFetch && (
          <div className="flex items-center justify-end gap-1 mt-2">
            {isFromCache && (
              <span className="text-[10px] text-muted-foreground/50 mr-1">(cache)</span>
            )}
            <p className="text-[10px] text-muted-foreground/50">
              {getLastUpdateText()}
            </p>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showRefreshConfirm} onOpenChange={setShowRefreshConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-primary" />
              Atualizar Diretiva IA
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                A diretiva atual ainda está válida. Deseja atualizar mesmo assim?
              </p>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <Coins className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-500 font-medium">
                  Gratuito - Não consome créditos
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                A diretiva é atualizada automaticamente 1x por dia ou quando suas estatísticas mudam significativamente.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRefresh}>
              Atualizar Agora
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
