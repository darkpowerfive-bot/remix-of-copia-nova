import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Mic, Play, Download, Pause, Volume2, Loader2, Trash2, Headphones } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { usePersistedState } from "@/hooks/usePersistedState";
import { SessionIndicator } from "@/components/ui/session-indicator";
import { useCreditDeduction } from "@/hooks/useCreditDeduction";
import { Label } from "@/components/ui/label";

interface GeneratedAudio {
  id: string;
  text: string;
  audio_url: string | null;
  voice_id: string | null;
  duration: number | null;
  created_at: string | null;
}

// Lemonfox voices organized by language based on official documentation
const voicesByLanguage: Record<string, { id: string; name: string; gender: string }[]> = {
  "en-us": [
    { id: "heart", name: "Heart", gender: "Feminino" },
    { id: "bella", name: "Bella", gender: "Feminino" },
    { id: "nova", name: "Nova", gender: "Feminino" },
    { id: "sarah", name: "Sarah", gender: "Feminino" },
    { id: "sky", name: "Sky", gender: "Feminino" },
    { id: "jessica", name: "Jessica", gender: "Feminino" },
    { id: "nicole", name: "Nicole", gender: "Feminino" },
    { id: "river", name: "River", gender: "Feminino" },
    { id: "aoede", name: "Aoede", gender: "Feminino" },
    { id: "kore", name: "Kore", gender: "Feminino" },
    { id: "alloy", name: "Alloy", gender: "Neutro" },
    { id: "michael", name: "Michael", gender: "Masculino" },
    { id: "echo", name: "Echo", gender: "Masculino" },
    { id: "onyx", name: "Onyx", gender: "Masculino Grave" },
    { id: "liam", name: "Liam", gender: "Masculino" },
    { id: "fenrir", name: "Fenrir", gender: "Masculino" },
    { id: "eric", name: "Eric", gender: "Masculino" },
    { id: "puck", name: "Puck", gender: "Masculino" },
    { id: "adam", name: "Adam", gender: "Masculino" },
    { id: "santa", name: "Santa", gender: "Masculino" },
  ],
  "en-gb": [
    { id: "alice", name: "Alice", gender: "Feminino" },
    { id: "emma", name: "Emma", gender: "Feminino" },
    { id: "isabella", name: "Isabella", gender: "Feminino" },
    { id: "lily", name: "Lily", gender: "Feminino" },
    { id: "daniel", name: "Daniel", gender: "Masculino" },
    { id: "fable", name: "Fable", gender: "Masculino" },
    { id: "george", name: "George", gender: "Masculino" },
    { id: "lewis", name: "Lewis", gender: "Masculino" },
  ],
  "pt-br": [
    // PT-BR voices (per Lemonfox docs)
    { id: "clara", name: "Clara", gender: "Feminino" },
    { id: "tiago", name: "Tiago", gender: "Masculino" },
    { id: "papai", name: "Papai", gender: "Masculino" },
  ],
  "ja": [
    // Japanese native voices
    { id: "sakura", name: "Sakura", gender: "Feminino" },
    { id: "gongitsune", name: "Gongitsune", gender: "Feminino" },
    { id: "nezumi", name: "Nezumi", gender: "Feminino" },
    { id: "tebukuro", name: "Tebukuro", gender: "Feminino" },
    { id: "kumo", name: "Kumo", gender: "Masculino" },
  ],
  "zh": [
    // Mandarin Chinese native voices
    { id: "xiaobei", name: "Xiaobei", gender: "Feminino" },
    { id: "xiaoni", name: "Xiaoni", gender: "Feminino" },
    { id: "xiaoxiao", name: "Xiaoxiao", gender: "Feminino" },
    { id: "xiaoyi", name: "Xiaoyi", gender: "Feminino" },
    { id: "yunjian", name: "Yunjian", gender: "Masculino" },
    { id: "yunxi", name: "Yunxi", gender: "Masculino" },
    { id: "yunxia", name: "Yunxia", gender: "Masculino" },
    { id: "yunyang", name: "Yunyang", gender: "Masculino" },
  ],
  "es": [
    // Spanish native voices
    { id: "dora", name: "Dora", gender: "Feminino" },
    { id: "alex", name: "Alex", gender: "Masculino" },
    { id: "noel", name: "Noel", gender: "Masculino" },
  ],
  "fr": [
    // French native voice
    { id: "siwis", name: "Siwis", gender: "Feminino" },
  ],
  "hi": [
    // Hindi native voices
    { id: "alpha", name: "Alpha", gender: "Feminino" },
    { id: "beta", name: "Beta", gender: "Feminino" },
    { id: "omega", name: "Omega", gender: "Masculino" },
    { id: "psi", name: "Psi", gender: "Masculino" },
  ],
  "it": [
    // Italian native voices
    { id: "sara", name: "Sara", gender: "Feminino" },
    { id: "nicola", name: "Nicola", gender: "Masculino" },
  ],
};

const languages = [
  { id: "pt-br", name: "🇧🇷 Português (Brasil)", flag: "🇧🇷" },
  { id: "en-us", name: "🇺🇸 Inglês (EUA)", flag: "🇺🇸" },
  { id: "en-gb", name: "🇬🇧 Inglês (UK)", flag: "🇬🇧" },
  { id: "es", name: "🇪🇸 Espanhol", flag: "🇪🇸" },
  { id: "fr", name: "🇫🇷 Francês", flag: "🇫🇷" },
  { id: "it", name: "🇮🇹 Italiano", flag: "🇮🇹" },
  { id: "ja", name: "🇯🇵 Japonês", flag: "🇯🇵" },
  { id: "zh", name: "🇨🇳 Chinês", flag: "🇨🇳" },
  { id: "hi", name: "🇮🇳 Hindi", flag: "🇮🇳" },
];

const VoiceGenerator = () => {
  const { user } = useAuth();
  const { executeWithDeduction } = useCreditDeduction();
  
  // Persisted states
  const [text, setText] = usePersistedState("voice_text", "");
  const [selectedLanguage, setSelectedLanguage] = usePersistedState("voice_selectedLanguage", "pt-br");
  const [selectedVoice, setSelectedVoice] = usePersistedState("voice_selectedVoice", "clara");
  const [speed, setSpeed] = usePersistedState("voice_speed", [1]);
  
  // Non-persisted states
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [audios, setAudios] = useState<GeneratedAudio[]>([]);
  const [loadingAudios, setLoadingAudios] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Get available voices for selected language
  const availableVoices = voicesByLanguage[selectedLanguage] || voicesByLanguage["pt-br"];

  // Reset voice when language changes if current voice is not available
  useEffect(() => {
    const voiceExists = availableVoices.some(v => v.id === selectedVoice);
    if (!voiceExists && availableVoices.length > 0) {
      setSelectedVoice(availableVoices[0].id);
    }
  }, [selectedLanguage, availableVoices, selectedVoice, setSelectedVoice]);

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
          const { data, error } = await supabase.functions.invoke('generate-tts-lemonfox', {
            body: {
              text: text,
              voiceId: selectedVoice,
              language: selectedLanguage,
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

  const handlePreviewVoice = async () => {
    const previewText = 'La Casa Dark, a ferramenta número 1 de canais darks.';

    setPreviewLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-tts-lemonfox', {
        body: {
          text: previewText,
          voiceId: selectedVoice,
          language: selectedLanguage,
          speed: speed[0],
          isPreview: true
        }
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      if (data.audioUrl) {
        if (previewAudioRef.current) {
          previewAudioRef.current.pause();
        }
        previewAudioRef.current = new Audio(data.audioUrl);
        previewAudioRef.current.play();
      }
    } catch (error) {
      console.error('Error previewing voice:', error);
      toast.error('Erro ao reproduzir prévia da voz');
    } finally {
      setPreviewLoading(false);
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
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Idioma</Label>
                <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue placeholder="Selecione o idioma" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang.id} value={lang.id}>
                        {lang.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">Voz ({availableVoices.length} disponíveis)</Label>
                <div className="flex gap-2">
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger className="bg-secondary border-border flex-1">
                      <SelectValue placeholder="Selecione uma voz" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableVoices.map((voice) => (
                        <SelectItem key={voice.id} value={voice.id}>
                          {voice.name} - {voice.gender}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePreviewVoice}
                    disabled={previewLoading}
                    title="Ouvir prévia da voz"
                  >
                    {previewLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Headphones className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block">
                  Velocidade: {speed[0]}x ({Math.round(150 * speed[0])} WPM)
                </Label>
                <Slider
                  value={speed}
                  onValueChange={setSpeed}
                  min={0.5}
                  max={4}
                  step={0.1}
                  className="mt-4"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>0.5x (75 WPM)</span>
                  <span>4x (600 WPM)</span>
                </div>
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
                        Voz: {Object.values(voicesByLanguage).flat().find(v => v.id === audio.voice_id)?.name || audio.voice_id}
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
