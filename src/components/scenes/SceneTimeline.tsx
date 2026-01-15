import { useMemo } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface SceneData {
  number: number;
  text: string;
  wordCount: number;
  durationSeconds: number;
  generatedImage?: string;
}

interface SceneTimelineProps {
  scenes: SceneData[];
  className?: string;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return mins > 0 ? `${mins}m${secs}s` : `${secs}s`;
};

const formatTimecode = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export function SceneTimeline({ scenes, className = "" }: SceneTimelineProps) {
  const totalDuration = useMemo(() => 
    scenes.reduce((acc, scene) => acc + scene.durationSeconds, 0), 
    [scenes]
  );

  const timelineData = useMemo(() => {
    let currentTime = 0;
    return scenes.map(scene => {
      const startTime = currentTime;
      currentTime += scene.durationSeconds;
      const widthPercent = (scene.durationSeconds / totalDuration) * 100;
      return {
        ...scene,
        startTime,
        endTime: currentTime,
        widthPercent: Math.max(widthPercent, 2), // Mínimo 2% para visibilidade
      };
    });
  }, [scenes, totalDuration]);

  // Gerar marcadores de tempo
  const timeMarkers = useMemo(() => {
    const markers: number[] = [0];
    const interval = totalDuration <= 60 ? 10 : totalDuration <= 180 ? 30 : 60;
    for (let t = interval; t < totalDuration; t += interval) {
      markers.push(t);
    }
    markers.push(totalDuration);
    return markers;
  }, [totalDuration]);

  if (scenes.length === 0) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Header com duração total */}
      <div className="flex justify-between items-center text-xs">
        <span className="text-muted-foreground font-medium">
          Timeline • {scenes.length} cenas
        </span>
        <span className="text-primary font-bold">
          Duração Total: {formatTime(totalDuration)}
        </span>
      </div>

      {/* Timeline visual */}
      <ScrollArea className="w-full">
        <div className="min-w-[500px] pb-2">
          {/* Barra de cenas */}
          <TooltipProvider delayDuration={100}>
            <div className="flex h-16 rounded-lg overflow-hidden border border-border bg-background/50">
              {timelineData.map((scene, index) => {
                const hasImage = !!scene.generatedImage;
                const colors = [
                  'from-primary/80 to-primary/60',
                  'from-accent/80 to-accent/60',
                  'from-secondary to-secondary/80',
                  'from-muted to-muted/80',
                ];
                const colorClass = colors[index % colors.length];
                
                return (
                  <Tooltip key={scene.number}>
                    <TooltipTrigger asChild>
                      <div
                        className={`
                          relative flex flex-col items-center justify-center
                          bg-gradient-to-b ${colorClass}
                          border-r border-background/30 last:border-r-0
                          cursor-pointer hover:brightness-110 transition-all
                          overflow-hidden group
                        `}
                        style={{ width: `${scene.widthPercent}%`, minWidth: '24px' }}
                      >
                        {/* Background image se existir */}
                        {hasImage && (
                          <div 
                            className="absolute inset-0 bg-cover bg-center opacity-60 group-hover:opacity-80 transition-opacity"
                            style={{ backgroundImage: `url(${scene.generatedImage})` }}
                          />
                        )}
                        
                        {/* Overlay escuro */}
                        <div className="absolute inset-0 bg-black/30" />
                        
                        {/* Conteúdo */}
                        <div className="relative z-10 text-center px-1">
                          <span className="text-[10px] font-bold text-white drop-shadow-md">
                            {scene.number}
                          </span>
                          {scene.widthPercent > 6 && (
                            <span className="block text-[8px] text-white/80 drop-shadow">
                              {formatTime(scene.durationSeconds)}
                            </span>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <div className="space-y-1">
                        <p className="font-bold">Cena {scene.number}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatTimecode(scene.startTime)} → {formatTimecode(scene.endTime)}
                        </p>
                        <p className="text-xs">
                          <span className="text-primary font-medium">{formatTime(scene.durationSeconds)}</span>
                          {" • "}
                          <span className="text-muted-foreground">{scene.wordCount} palavras</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground line-clamp-2">
                          {scene.text.substring(0, 80)}...
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>

          {/* Marcadores de tempo */}
          <div className="relative h-4 mt-1">
            {timeMarkers.map((time, i) => {
              const position = (time / totalDuration) * 100;
              return (
                <div 
                  key={i}
                  className="absolute flex flex-col items-center"
                  style={{ 
                    left: `${position}%`,
                    transform: i === timeMarkers.length - 1 ? 'translateX(-100%)' : 
                               i === 0 ? 'translateX(0)' : 'translateX(-50%)'
                  }}
                >
                  <div className="w-px h-1.5 bg-muted-foreground/50" />
                  <span className="text-[9px] text-muted-foreground">
                    {formatTimecode(time)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Legenda de cores */}
      <div className="flex flex-wrap gap-2 text-[10px] text-muted-foreground">
        <span>📊 Largura proporcional à duração</span>
        <span>•</span>
        <span>🖼️ Cenas com imagem mostram thumbnail</span>
      </div>
    </div>
  );
}
