import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { MusicRecommendation } from "@/lib/xmlGenerator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, Pause, Volume2, VolumeX, ExternalLink, Music } from "lucide-react";
import { motion } from "framer-motion";

interface MusicPreviewPlayerProps {
  music: MusicRecommendation;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  className?: string;
}

export const MusicPreviewPlayer = ({ 
  music, 
  isPlaying, 
  onPlay, 
  onPause,
  className 
}: MusicPreviewPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [duration, setDuration] = useState(0);

  // Handle audio playback
  useEffect(() => {
    if (!music.previewUrl) return;
    
    if (!audioRef.current) {
      audioRef.current = new Audio(music.previewUrl);
      audioRef.current.volume = 0.5;
      
      audioRef.current.addEventListener('loadstart', () => setIsLoading(true));
      audioRef.current.addEventListener('canplay', () => setIsLoading(false));
      audioRef.current.addEventListener('error', () => {
        setHasError(true);
        setIsLoading(false);
      });
      audioRef.current.addEventListener('loadedmetadata', () => {
        setDuration(audioRef.current?.duration || 0);
      });
      audioRef.current.addEventListener('timeupdate', () => {
        if (audioRef.current) {
          const prog = (audioRef.current.currentTime / audioRef.current.duration) * 100;
          setProgress(prog);
        }
      });
      audioRef.current.addEventListener('ended', () => {
        setProgress(0);
        onPause();
      });
    }

    if (isPlaying && audioRef.current) {
      audioRef.current.play().catch(() => setHasError(true));
    } else if (audioRef.current) {
      audioRef.current.pause();
    }

    return () => {
      if (audioRef.current && !isPlaying) {
        audioRef.current.pause();
      }
    };
  }, [isPlaying, music.previewUrl, onPause]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Mute/unmute
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMuted;
    }
  }, [isMuted]);

  const togglePlay = () => {
    if (isPlaying) {
      onPause();
    } else {
      onPlay();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const hasPreview = !!music.previewUrl && !hasError;

  return (
    <div 
      className={cn(
        "flex items-start gap-2 p-2 bg-background/50 rounded-lg transition-colors border",
        isPlaying ? "border-amber-500/50 bg-amber-500/5" : "border-transparent hover:border-amber-500/30 hover:bg-amber-500/10",
        className
      )}
    >
      {/* Play Button / Icon */}
      <div className="relative">
        {hasPreview ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={togglePlay}
            disabled={isLoading}
            className={cn(
              "w-10 h-10 rounded-full p-0 flex-shrink-0",
              isPlaying ? "bg-amber-500 text-background hover:bg-amber-600" : "bg-gradient-to-br from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30"
            )}
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full"
              />
            ) : isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </Button>
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center flex-shrink-0">
            <Music className="w-4 h-4 text-amber-500" />
          </div>
        )}
        
        {/* Progress ring for playing state */}
        {isPlaying && hasPreview && (
          <svg className="absolute inset-0 w-10 h-10 -rotate-90">
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-amber-500/20"
            />
            <circle
              cx="20"
              cy="20"
              r="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray={`${2 * Math.PI * 18}`}
              strokeDashoffset={`${2 * Math.PI * 18 * (1 - progress / 100)}`}
              className="text-amber-500 transition-all duration-300"
            />
          </svg>
        )}
      </div>

      {/* Music Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className={cn(
              "text-[10px] font-medium truncate",
              isPlaying ? "text-amber-500" : "text-foreground"
            )}>
              {music.name}
            </p>
            <p className="text-[8px] text-muted-foreground">{music.artist}</p>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {hasPreview && isPlaying && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setIsMuted(!isMuted)}
                className="w-5 h-5 p-0"
              >
                {isMuted ? (
                  <VolumeX className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <Volume2 className="w-3 h-3 text-amber-500" />
                )}
              </Button>
            )}
            <a
              href={music.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-5 h-5 flex items-center justify-center text-muted-foreground hover:text-amber-500 transition-colors"
              title="Abrir no site"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
        
        {/* Tags */}
        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
          <Badge variant="outline" className="text-[7px] px-1 py-0 border-border/50">
            {music.genre}
          </Badge>
          <Badge variant="outline" className="text-[7px] px-1 py-0 border-border/50">
            {music.mood}
          </Badge>
          {music.bpm && music.bpm > 0 && (
            <span className="text-[7px] text-muted-foreground">{music.bpm} BPM</span>
          )}
          {hasPreview ? (
            <Badge variant="outline" className="text-[7px] px-1 py-0 border-green-500/50 text-green-500">
              ▶ Preview
            </Badge>
          ) : (
            <Badge variant="outline" className="text-[7px] px-1 py-0 border-muted-foreground/50 text-muted-foreground">
              Sem preview
            </Badge>
          )}
          <Badge 
            variant="outline" 
            className={cn(
              "text-[7px] px-1 py-0",
              music.isPremium ? "border-orange-500/50 text-orange-500" : "border-green-500/50 text-green-500"
            )}
          >
            {music.isPremium ? 'Premium' : 'Grátis'}
          </Badge>
        </div>

        {/* Duration display when playing */}
        {isPlaying && duration > 0 && (
          <p className="text-[8px] text-amber-500 mt-1">
            {formatTime((progress / 100) * duration)} / {formatTime(duration)}
          </p>
        )}
      </div>
    </div>
  );
};