import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { INTRO_PRESETS, IntroNiche, IntroPreset, MusicRecommendation } from "@/lib/xmlGenerator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, ChevronDown, ChevronUp, Clock, Music, Palette, Lightbulb, StopCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { MusicPreviewPlayer } from "./MusicPreviewPlayer";
import { NicheVisualPreview } from "./NicheVisualPreview";

interface IntroPresetSelectorProps {
  selectedNiche: IntroNiche | null;
  onSelect: (niche: IntroNiche) => void;
  onDownloadGuide: (preset: IntroPreset) => void;
  className?: string;
}

export const IntroPresetSelector = ({ 
  selectedNiche, 
  onSelect, 
  onDownloadGuide,
  className 
}: IntroPresetSelectorProps) => {
  const [expandedPreset, setExpandedPreset] = useState<IntroNiche | null>(null);
  const [playingMusicIndex, setPlayingMusicIndex] = useState<number | null>(null);
  
  const selectedPreset = INTRO_PRESETS.find(p => p.id === selectedNiche);

  const handlePlayMusic = useCallback((index: number) => {
    setPlayingMusicIndex(index);
  }, []);

  const handlePauseMusic = useCallback(() => {
    setPlayingMusicIndex(null);
  }, []);

  const stopAllMusic = useCallback(() => {
    setPlayingMusicIndex(null);
  }, []);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Grid de Presets */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {INTRO_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={() => {
              onSelect(preset.id);
              setExpandedPreset(expandedPreset === preset.id ? null : preset.id);
            }}
            className={cn(
              "flex flex-col items-center gap-1 p-2 rounded-lg border text-center transition-all group relative",
              selectedNiche === preset.id
                ? "border-amber-500 bg-gradient-to-br from-amber-500/20 to-orange-500/10 text-foreground shadow-lg shadow-amber-500/10"
                : "border-border/50 bg-secondary/30 text-muted-foreground hover:bg-secondary/50 hover:border-amber-500/30"
            )}
          >
            <span className={cn(
              "text-xl transition-transform",
              selectedNiche === preset.id && "scale-110"
            )}>{preset.icon}</span>
            <p className="text-[10px] font-medium leading-tight">{preset.name}</p>
            <Badge 
              variant="outline" 
              className={cn(
                "text-[8px] px-1 py-0",
                selectedNiche === preset.id ? "border-amber-500/50 text-amber-500" : "border-border/50"
              )}
            >
              {preset.introDuration}s
            </Badge>
          </button>
        ))}
      </div>

      {/* Detalhes do Preset Selecionado */}
      <AnimatePresence>
        {selectedPreset && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-br from-primary/5 to-amber-500/5 border border-amber-500/30 rounded-xl p-4 space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{selectedPreset.icon}</span>
                  <div>
                    <h4 className="font-semibold text-foreground">{selectedPreset.name}</h4>
                    <p className="text-xs text-muted-foreground">{selectedPreset.description}</p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => onDownloadGuide(selectedPreset)}
                  className="text-xs border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                >
                  <Download className="w-3 h-3 mr-1" />
                  Baixar Guia
                </Button>
              </div>

              {/* Preview Visual Animado */}
              <NicheVisualPreview niche={selectedPreset.id} className="mb-2" />
              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-2">
                <div className="bg-background/50 rounded-lg p-2 text-center">
                  <Clock className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                  <p className="text-[10px] text-muted-foreground">Duração</p>
                  <p className="text-sm font-bold text-foreground">{selectedPreset.introDuration}s</p>
                </div>
                <div className="bg-background/50 rounded-lg p-2 text-center">
                  <Palette className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                  <p className="text-[10px] text-muted-foreground">Cor</p>
                  <p className="text-[10px] font-medium text-foreground truncate">{selectedPreset.colorTone.replace('_', ' ')}</p>
                </div>
                <div className="bg-background/50 rounded-lg p-2 text-center">
                  <Music className="w-4 h-4 mx-auto text-amber-500 mb-1" />
                  <p className="text-[10px] text-muted-foreground">Texto</p>
                  <p className="text-[10px] font-medium text-foreground">{selectedPreset.textAnimation}</p>
                </div>
                <div className="bg-background/50 rounded-lg p-2 text-center">
                  <div className="flex justify-center gap-0.5 mb-1">
                    {selectedPreset.effects.vignette && <span className="text-[8px]">V</span>}
                    {selectedPreset.effects.kenBurns && <span className="text-[8px]">KB</span>}
                    {selectedPreset.effects.letterbox && <span className="text-[8px]">LB</span>}
                    {selectedPreset.effects.fadeIn && <span className="text-[8px]">F</span>}
                  </div>
                  <p className="text-[10px] text-muted-foreground">Efeitos</p>
                  <p className="text-[10px] font-medium text-foreground">
                    {Object.values(selectedPreset.effects).filter(Boolean).length}/4
                  </p>
                </div>
              </div>

              {/* Estrutura do Gancho */}
              <div>
                <p className="text-xs font-medium text-amber-500 mb-1">📌 Estrutura do Gancho:</p>
                <p className="text-xs text-muted-foreground bg-background/50 rounded-lg p-2 font-mono">
                  {selectedPreset.hookStructure}
                </p>
              </div>

              {/* Exemplos de Ganchos */}
              <div>
                <p className="text-xs font-medium text-amber-500 mb-2">💬 Exemplos de Ganchos:</p>
                <div className="space-y-1.5">
                  {selectedPreset.hookExamples.map((hook, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className="text-amber-500 font-bold">{i + 1}.</span>
                      <p className="text-muted-foreground italic">{hook}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Dicas */}
              <div>
                <p className="text-xs font-medium text-amber-500 mb-2 flex items-center gap-1">
                  <Lightbulb className="w-3 h-3" />
                  Dicas Pro:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedPreset.tipsPt.map((tip, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
                      <span className="text-amber-500">•</span>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual e Música */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background/50 rounded-lg p-2">
                  <p className="text-[10px] font-medium text-amber-500 mb-1">🎥 Visual:</p>
                  <p className="text-[10px] text-muted-foreground">{selectedPreset.visualStyle}</p>
                </div>
                <div className="bg-background/50 rounded-lg p-2">
                  <p className="text-[10px] font-medium text-amber-500 mb-1">🎵 Estilo:</p>
                  <p className="text-[10px] text-muted-foreground">{selectedPreset.musicStyle}</p>
                </div>
              </div>

              {/* Biblioteca de Músicas Royalty-Free */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-amber-500 flex items-center gap-1">
                    <Music className="w-3 h-3" />
                    Músicas Recomendadas (Royalty-Free):
                  </p>
                  {playingMusicIndex !== null && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={stopAllMusic}
                      className="text-[10px] h-6 px-2 text-muted-foreground hover:text-red-500"
                    >
                      <StopCircle className="w-3 h-3 mr-1" />
                      Parar
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedPreset.recommendedMusic.map((music, i) => (
                    <MusicPreviewPlayer
                      key={i}
                      music={music}
                      isPlaying={playingMusicIndex === i}
                      onPlay={() => handlePlayMusic(i)}
                      onPause={handlePauseMusic}
                    />
                  ))}
                </div>
                <p className="text-[8px] text-muted-foreground mt-2 text-center">
                  🎵 Clique no ▶ para preview • 🔗 Clique no ícone de link para abrir no site
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
