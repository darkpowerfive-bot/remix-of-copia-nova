import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Video, Loader2, Sparkles, Download, Play, AlertCircle, Coins } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCreditDeduction } from "@/hooks/useCreditDeduction";

interface VideoGenerationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sceneNumber: number;
  sceneText: string;
  sceneImage?: string;
  onVideoGenerated?: (sceneNumber: number, videoUrl: string) => void;
}

const VIDEO_MODELS = [
  { id: 'veo31-fast', name: 'Veo 3.1 Fast', description: 'Rápido e econômico', credits: 50, duration: '~8s' },
  { id: 'veo31', name: 'Veo 3.1 Standard', description: 'Alta qualidade', credits: 80, duration: '~8s' },
  { id: 'sora2', name: 'Sora 2 (10s)', description: 'OpenAI Sora', credits: 60, duration: '10s' },
  { id: 'sora2-15s', name: 'Sora 2 (15s)', description: 'OpenAI Sora longo', credits: 80, duration: '15s' },
];

export function VideoGenerationModal({
  open,
  onOpenChange,
  sceneNumber,
  sceneText,
  sceneImage,
  onVideoGenerated
}: VideoGenerationModalProps) {
  const { deduct, checkBalance, usePlatformCredits } = useCreditDeduction();
  
  const [selectedModel, setSelectedModel] = useState('veo31-fast');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1'>('16:9');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedVideo, setGeneratedVideo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedModelData = VIDEO_MODELS.find(m => m.id === selectedModel);
  const creditCost = selectedModelData?.credits || 50;

  const generateVideoPrompt = () => {
    if (customPrompt.trim()) return customPrompt;
    
    // Gerar prompt baseado no texto da cena
    return `Cinematic video scene: ${sceneText}. High quality, smooth motion, professional cinematography, 4K resolution.`;
  };

  const handleGenerate = async () => {
    setError(null);
    setIsGenerating(true);
    setProgress(10);

    try {
      // Deduzir créditos
      const deductResult = await deduct({
        operationType: 'video_generation',
        customAmount: creditCost,
        details: { model: selectedModel, sceneNumber },
        showToast: false
      });

      if (!deductResult.success) {
        throw new Error('Créditos insuficientes para gerar vídeo');
      }

      setProgress(30);

      const prompt = generateVideoPrompt();

      // Chamar edge function
      const { data, error: fnError } = await supabase.functions.invoke('generate-video-laozhang', {
        body: {
          prompt,
          model: selectedModel,
          aspect_ratio: aspectRatio,
          resolution: '1080p'
        }
      });

      setProgress(70);

      if (fnError) {
        throw new Error(fnError.message || 'Erro ao gerar vídeo');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (data?.status === 'processing') {
        toast.info('Vídeo em processamento. Pode levar alguns minutos.');
        setProgress(90);
        // Poll for completion (simplified - in production you'd want better polling)
        setTimeout(() => {
          setProgress(100);
          toast.info('Verifique novamente em alguns minutos');
        }, 5000);
        return;
      }

      if (data?.video_url) {
        setGeneratedVideo(data.video_url);
        setProgress(100);
        toast.success('Vídeo gerado com sucesso!');
        onVideoGenerated?.(sceneNumber, data.video_url);
      }

    } catch (err: any) {
      console.error('[VideoGeneration] Error:', err);
      setError(err.message || 'Erro ao gerar vídeo');
      toast.error(err.message || 'Erro ao gerar vídeo');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!generatedVideo) return;
    const a = document.createElement('a');
    a.href = generatedVideo;
    a.download = `cena_${sceneNumber}_video.mp4`;
    a.click();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-primary" />
            Gerar Vídeo - Cena {sceneNumber}
            <Badge variant="secondary" className="ml-2">
              <Sparkles className="w-3 h-3 mr-1" />
              AI Video
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview da cena */}
          <div className="flex gap-4">
            {sceneImage && (
              <img 
                src={sceneImage} 
                alt={`Cena ${sceneNumber}`}
                className="w-40 h-24 object-cover rounded-lg border border-border/50"
              />
            )}
            <div className="flex-1">
              <p className="text-sm text-muted-foreground line-clamp-3">
                {sceneText}
              </p>
            </div>
          </div>

          {/* Seleção de modelo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Modelo de IA</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VIDEO_MODELS.map(model => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex items-center justify-between w-full gap-2">
                        <span>{model.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {model.credits} créditos
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedModelData && (
                <p className="text-xs text-muted-foreground">
                  {selectedModelData.description} • Duração: {selectedModelData.duration}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Proporção</Label>
              <Select value={aspectRatio} onValueChange={(v: '16:9' | '9:16' | '1:1') => setAspectRatio(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="16:9">16:9 (Paisagem)</SelectItem>
                  <SelectItem value="9:16">9:16 (Retrato/Shorts)</SelectItem>
                  <SelectItem value="1:1">1:1 (Quadrado)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Prompt customizado */}
          <div className="space-y-2">
            <Label>Prompt personalizado (opcional)</Label>
            <Textarea
              placeholder="Deixe vazio para gerar automaticamente baseado na cena..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Custo */}
          <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Custo estimado</span>
            </div>
            <div className="flex items-center gap-2">
              {usePlatformCredits === false ? (
                <Badge variant="outline" className="text-emerald-400 border-emerald-500/50">
                  Usando sua API - Sem consumo
                </Badge>
              ) : (
                <Badge variant="default">
                  {creditCost} créditos
                </Badge>
              )}
            </div>
          </div>

          {/* Progress */}
          {isGenerating && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-muted-foreground">
                Gerando vídeo... {progress}%
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Video preview */}
          {generatedVideo && (
            <div className="space-y-2">
              <Label>Vídeo gerado</Label>
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                <video 
                  src={generatedVideo} 
                  controls 
                  className="w-full h-full"
                  poster={sceneImage}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {generatedVideo ? (
            <>
              <Button variant="outline" onClick={() => setGeneratedVideo(null)}>
                Gerar Novo
              </Button>
              <Button onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Baixar Vídeo
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleGenerate} 
                disabled={isGenerating}
                className="bg-gradient-to-r from-primary to-purple-500"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Gerar Vídeo
                  </>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
