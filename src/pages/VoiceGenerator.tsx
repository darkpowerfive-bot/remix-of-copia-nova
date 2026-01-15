import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Mic, Play, Download, Pause, Volume2, Loader2, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { usePersistedState } from "@/hooks/usePersistedState";
import { SessionIndicator } from "@/components/ui/session-indicator";
import { useCreditDeduction } from "@/hooks/useCreditDeduction";

interface GeneratedAudio {
  id: string;
  text: string;
  audio_url: string | null;
  voice_id: string | null;
  duration: number | null;
  created_at: string | null;
}

const voices = [
  { id: "alloy", name: "Alloy - Neutro" },
  { id: "echo", name: "Echo - Masculino" },
  { id: "fable", name: "Fable - Expressivo" },
  { id: "onyx", name: "Onyx - Masculino Grave" },
  { id: "nova", name: "Nova - Feminino" },
  { id: "shimmer", name: "Shimmer - Feminino Suave" },
];

const VoiceGenerator = () => {
  const { user } = useAuth();
  const { executeWithDeduction, getEstimatedCost } = useCreditDeduction();
  
  // Persisted states
  const [text, setText] = usePersistedState("voice_text", "");
  const [selectedVoice, setSelectedVoice] = usePersistedState("voice_selectedVoice", "nova");
  const [speed, setSpeed] = usePersistedState("voice_speed", [1]);
  
  // Non-persisted states
  const [loading, setLoading] = useState(false);
  const [audios, setAudios] = useState<GeneratedAudio[]>([]);
  const [loadingAudios, setLoadingAudios] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (user) fetchAudios();
  }, [user]);

  const fetchAudios = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_audios')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setAudios(data || []);
    } catch (error) {
      console.error('Error fetching audios:', error);
    } finally {
      setLoadingAudios(false);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error('Digite o texto para converter em áudio');
      return;
    }

    if (!user) {
      toast.error('Faça login para gerar áudio');
      return;
    }

    if (text.length > 4096) {
      toast.error('Texto muito longo. Máximo de 4096 caracteres.');
      return;
    }

    // TTS cobra por 100 caracteres
    const multiplier = Math.ceil(text.length / 100);

    setLoading(true);
    try {
      const { result, success, error } = await executeWithDeduction(
        {
          operationType: 'generate_tts',
          multiplier,
          details: { textLength: text.length, voice: selectedVoice },
          showToast: true
        },
        async () => {
          const { data, error } = await supabase.functions.invoke('generate-tts', {
            body: {
              text: text,
              voiceId: selectedVoice,
              speed: speed[0]
            }
          });

          if (error) throw error;
          if (data.error) throw new Error(data.error);
          
          return data;
        }
      );

      if (!success) {
        if (error !== 'Saldo insuficiente') {
          toast.error(error || 'Erro ao gerar áudio');
        }
        return;
      }

      if (result) {
        // Save to database
        const { error: insertError } = await supabase
          .from('generated_audios')
          .insert({
            user_id: user.id,
            text: text.substring(0, 500),
            voice_id: selectedVoice,
            audio_url: result.audioUrl || null,
            duration: result.duration || 0
          });

        if (insertError) console.error('Error saving audio:', insertError);

        toast.success(`Áudio gerado com sucesso!`);
        setText('');
        fetchAudios();
      }
    } catch (error) {
      console.error('Error generating audio:', error);
      toast.error('Erro ao gerar áudio. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (audio: GeneratedAudio) => {
    if (!audio.audio_url) {
      toast.error('Áudio não disponível');
      return;
    }

    if (playingId === audio.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) audioRef.current.pause();
      audioRef.current = new Audio(audio.audio_url);
      audioRef.current.play();
      audioRef.current.onended = () => setPlayingId(null);
      setPlayingId(audio.id);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from('generated_audios')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Áudio removido!');
      setAudios(audios.filter(a => a.id !== id));
    } catch (error) {
      console.error('Error deleting audio:', error);
      toast.error('Erro ao remover áudio');
    }
  };

  const handleDownload = (audio: GeneratedAudio) => {
    if (!audio.audio_url) {
      toast.error('Áudio não disponível');
      return;
    }
    window.open(audio.audio_url, '_blank');
  };

  return (
    <>
      <SEOHead
        title="Gerador de Voz"
        description="Converta texto em áudio com vozes realistas usando IA."
        noindex={true}
      />
      <MainLayout>
        <PermissionGate permission="gerador_voz" featureName="Gerador de Voz">
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Session Indicator */}
          <SessionIndicator 
            storageKeys={["voice_text"]}
            label="Texto anterior"
            onClear={() => setText("")}
          />

          <div className="mb-8 mt-4">
            <h1 className="text-3xl font-bold text-foreground mb-2">Gerador de Voz</h1>
            <p className="text-muted-foreground">
              Converta texto em áudio com vozes realistas usando IA
            </p>
          </div>

          <Card className="p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Mic className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Texto para Áudio</h3>
            </div>
            <Textarea
              placeholder="Digite ou cole o texto que deseja converter em áudio..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="bg-secondary border-border min-h-40 mb-4"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Voz</label>
                <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Selecione uma voz" />
                  </SelectTrigger>
                  <SelectContent>
                    {voices.map((voice) => (
                      <SelectItem key={voice.id} value={voice.id}>
                        {voice.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">
                  Velocidade: {speed[0]}x
                </label>
                <Slider
                  value={speed}
                  onValueChange={setSpeed}
                  min={0.5}
                  max={2}
                  step={0.1}
                  className="mt-4"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleGenerate}
                disabled={loading || !text.trim()}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2" />
                )}
                Gerar Áudio
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Máximo de 4096 caracteres por geração
            </p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Volume2 className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Áudios Gerados</h3>
            </div>
            {loadingAudios ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : audios.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                Nenhum áudio gerado ainda
              </p>
            ) : (
              <div className="space-y-3">
                {audios.map((audio) => (
                  <div key={audio.id} className="flex items-center gap-4 p-4 bg-secondary/50 rounded-lg">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-primary"
                      onClick={() => handlePlay(audio)}
                    >
                      {playingId === audio.id ? (
                        <Pause className="w-5 h-5" />
                      ) : (
                        <Play className="w-5 h-5" />
                      )}
                    </Button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{audio.text}</p>
                      <p className="text-xs text-muted-foreground">
                        Voz: {voices.find(v => v.id === audio.voice_id)?.name || audio.voice_id}
                      </p>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {audio.duration ? `${Math.floor(audio.duration / 60)}:${String(Math.floor(audio.duration % 60)).padStart(2, '0')}` : '--:--'}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-foreground"
                      onClick={() => handleDownload(audio)}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(audio.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
        </PermissionGate>
      </MainLayout>
    </>
  );
};

export default VoiceGenerator;
