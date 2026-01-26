import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Mic, Play, Download, Pause, Volume2, Loader2, Trash2, Headphones, Clock, Sparkles } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { usePersistedState } from "@/hooks/usePersistedState";
import { SessionIndicator } from "@/components/ui/session-indicator";
import { useCreditDeduction } from "@/hooks/useCreditDeduction";
import { Label } from "@/components/ui/label";
import { VoiceGenerationModal } from "@/components/voice/VoiceGenerationModal";

interface GeneratedAudio {
  id: string;
  text: string;
  audio_url: string | null;
  voice_id: string | null;
  duration: number | null;
  created_at: string | null;
}

// Deepgram Aura-2 voices - native voices per language
// Based on https://developers.deepgram.com/docs/tts-models
const voicesByLanguage: Record<string, { id: string; name: string; gender: string; description?: string }[]> = {
  "en-us": [
    // Female voices - English
    { id: "aura-2-asteria-en", name: "Asteria", gender: "Feminino", description: "Clara e profissional" },
    { id: "aura-2-luna-en", name: "Luna", gender: "Feminino", description: "Suave e acolhedora" },
    { id: "aura-2-stella-en", name: "Stella", gender: "Feminino", description: "Quente e envolvente" },
    { id: "aura-2-athena-en", name: "Athena", gender: "Feminino", description: "Elegante e sofisticada" },
    { id: "aura-2-hera-en", name: "Hera", gender: "Feminino", description: "Madura e confiante" },
    // Male voices - English
    { id: "aura-2-orion-en", name: "Orion", gender: "Masculino", description: "Profundo e autoritário" },
    { id: "aura-2-arcas-en", name: "Arcas", gender: "Masculino", description: "Jovem e dinâmico" },
    { id: "aura-2-perseus-en", name: "Perseus", gender: "Masculino", description: "Equilibrado e versátil" },
    { id: "aura-2-angus-en", name: "Angus", gender: "Masculino", description: "Robusto e marcante" },
    { id: "aura-2-orpheus-en", name: "Orpheus", gender: "Masculino", description: "Melódico e expressivo" },
    { id: "aura-2-helios-en", name: "Helios", gender: "Masculino", description: "Vibrante e energético" },
    { id: "aura-2-zeus-en", name: "Zeus", gender: "Masculino", description: "Poderoso e imponente" },
  ],
  "en-gb": [
    // UK English - same English model works
    { id: "aura-2-athena-en", name: "Athena", gender: "Feminino", description: "Elegante, tom britânico" },
    { id: "aura-2-luna-en", name: "Luna", gender: "Feminino", description: "Suave e refinada" },
    { id: "aura-2-stella-en", name: "Stella", gender: "Feminino", description: "Quente e sofisticada" },
    { id: "aura-2-orion-en", name: "Orion", gender: "Masculino", description: "Tom britânico clássico" },
    { id: "aura-2-perseus-en", name: "Perseus", gender: "Masculino", description: "Equilibrado e formal" },
  ],
  "pt-br": [
    // Portuguese - NATIVE Portuguese voices (aura-2-*-pt)
    { id: "aura-2-thalia-pt", name: "Thalia", gender: "Feminino", description: "Voz portuguesa natural" },
    { id: "aura-2-stella-en", name: "Stella (EN)", gender: "Feminino", description: "Inglês para PT (fallback)" },
  ],
  "es": [
    // Spanish - NATIVE Spanish voices (aura-2-*-es)
    { id: "aura-2-lucia-es", name: "Lucía", gender: "Feminino", description: "Espanhol nativo, claro" },
    { id: "aura-2-maria-es", name: "María", gender: "Feminino", description: "Espanhol caloroso" },
    { id: "aura-2-carlos-es", name: "Carlos", gender: "Masculino", description: "Espanhol profissional" },
  ],
  "fr": [
    // French - NATIVE French voices (aura-2-*-fr)
    { id: "aura-2-chloe-fr", name: "Chloé", gender: "Feminino", description: "Francês elegante" },
    { id: "aura-2-marie-fr", name: "Marie", gender: "Feminino", description: "Francês suave" },
    { id: "aura-2-louis-fr", name: "Louis", gender: "Masculino", description: "Francês clássico" },
  ],
  "de": [
    // German - NATIVE German voices (aura-2-*-de)
    { id: "aura-2-hannah-de", name: "Hannah", gender: "Feminino", description: "Alemão profissional" },
    { id: "aura-2-lena-de", name: "Lena", gender: "Feminino", description: "Alemão suave" },
    { id: "aura-2-felix-de", name: "Felix", gender: "Masculino", description: "Alemão versátil" },
  ],
  "it": [
    // Italian - NATIVE Italian voices (aura-2-*-it)
    { id: "aura-2-giulia-it", name: "Giulia", gender: "Feminino", description: "Italiano natural" },
    { id: "aura-2-sofia-it", name: "Sofia", gender: "Feminino", description: "Italiano elegante" },
    { id: "aura-2-marco-it", name: "Marco", gender: "Masculino", description: "Italiano clássico" },
  ],
  "ja": [
    // Japanese - NATIVE Japanese voices (aura-2-*-ja)
    { id: "aura-2-sakura-ja", name: "Sakura", gender: "Feminino", description: "Japonês natural" },
    { id: "aura-2-yuki-ja", name: "Yuki", gender: "Feminino", description: "Japonês suave" },
    { id: "aura-2-kenji-ja", name: "Kenji", gender: "Masculino", description: "Japonês profissional" },
  ],
  "nl": [
    // Dutch - NATIVE Dutch voices (aura-2-*-nl)
    { id: "aura-2-emma-nl", name: "Emma", gender: "Feminino", description: "Holandês natural" },
    { id: "aura-2-daan-nl", name: "Daan", gender: "Masculino", description: "Holandês claro" },
  ],
  "zh": [
    // Chinese - use English as fallback (Deepgram doesn't have native Chinese yet)
    { id: "aura-2-luna-en", name: "Luna (EN)", gender: "Feminino", description: "Inglês (fallback)" },
    { id: "aura-2-stella-en", name: "Stella (EN)", gender: "Feminino", description: "Inglês (fallback)" },
  ],
  "hi": [
    // Hindi - use English as fallback 
    { id: "aura-2-luna-en", name: "Luna (EN)", gender: "Feminino", description: "Inglês (fallback)" },
    { id: "aura-2-orion-en", name: "Orion (EN)", gender: "Masculino", description: "Inglês (fallback)" },
  ],
};

const languages = [
  { id: "pt-br", name: "🇧🇷 Português (Brasil)", flag: "🇧🇷" },
  { id: "en-us", name: "🇺🇸 Inglês (EUA)", flag: "🇺🇸" },
  { id: "en-gb", name: "🇬🇧 Inglês (UK)", flag: "🇬🇧" },
  { id: "es", name: "🇪🇸 Espanhol", flag: "🇪🇸" },
  { id: "fr", name: "🇫🇷 Francês", flag: "🇫🇷" },
  { id: "de", name: "🇩🇪 Alemão", flag: "🇩🇪" },
  { id: "it", name: "🇮🇹 Italiano", flag: "🇮🇹" },
  { id: "ja", name: "🇯🇵 Japonês", flag: "🇯🇵" },
  { id: "nl", name: "🇳🇱 Holandês", flag: "🇳🇱" },
  { id: "zh", name: "🇨🇳 Chinês (fallback EN)", flag: "🇨🇳" },
  { id: "hi", name: "🇮🇳 Hindi (fallback EN)", flag: "🇮🇳" },
];

const VoiceGenerator = () => {
  const { user } = useAuth();
  const { executeWithDeduction } = useCreditDeduction();
  
  // Persisted states
  const [text, setText] = usePersistedState("voice_text", "");
  const [selectedLanguage, setSelectedLanguage] = usePersistedState("voice_selectedLanguage", "pt-br");
  const [selectedVoice, setSelectedVoice] = usePersistedState("voice_selectedVoice", "clara");
  const [speed, setSpeed] = usePersistedState("voice_speed", [1]);
  const [audioQuality, setAudioQuality] = usePersistedState<'standard' | 'high' | 'ultra'>("voice_quality", "high");
  
  // Non-persisted states
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [audios, setAudios] = useState<GeneratedAudio[]>([]);
  const [loadingAudios, setLoadingAudios] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState<{ current: number; total: number } | null>(null);
  const [showGenerationModal, setShowGenerationModal] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Maximum characters per API call
  // Lemonfox API doesn't specify a limit, but we use 6000 for reliability
  // This balances fewer chunk splits with API stability
  const MAX_CHUNK_SIZE = 6000;
  
  // Split text into manageable chunks only if very long
  const splitTextIfNeeded = (inputText: string): string[] => {
    if (inputText.length <= MAX_CHUNK_SIZE) {
      return [inputText];
    }
    
    // Split at sentence boundaries for natural breaks
    const sentences = inputText.split(/(?<=[.!?。！？])\s+/);
    const chunks: string[] = [];
    let currentChunk = '';
    
    for (const sentence of sentences) {
      if ((currentChunk + ' ' + sentence).length > MAX_CHUNK_SIZE && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk = currentChunk ? currentChunk + ' ' + sentence : sentence;
      }
    }
    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks.length > 0 ? chunks : [inputText];
  };

  // Calculate estimated duration based on text and speed
  const calculateEstimatedDuration = (inputText: string, speedValue: number): string => {
    if (!inputText.trim()) return '';
    
    // Count words (split by whitespace)
    const wordCount = inputText.trim().split(/\s+/).length;
    
    // Base speaking rate: ~2.5 words per second at 1x speed
    // Lower speed = slower speaking = MORE time
    // Higher speed = faster speaking = LESS time
    const wordsPerSecond = 2.5 * speedValue;
    
    // Calculate duration in seconds
    const durationSeconds = wordCount / wordsPerSecond;
    
    if (durationSeconds < 60) {
      return `~${Math.ceil(durationSeconds)}s`;
    } else if (durationSeconds < 3600) {
      const minutes = Math.floor(durationSeconds / 60);
      const seconds = Math.ceil(durationSeconds % 60);
      return `~${minutes}:${String(seconds).padStart(2, '0')}`;
    } else {
      const hours = Math.floor(durationSeconds / 3600);
      const minutes = Math.floor((durationSeconds % 3600) / 60);
      return `~${hours}h${String(minutes).padStart(2, '0')}min`;
    }
  };

  // Get estimated duration for current text
  const estimatedDuration = calculateEstimatedDuration(text, speed[0]);
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

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

    if (text.length > 150000) {
      toast.error('Texto muito longo. Máximo de 150.000 caracteres (~2 horas de áudio).');
      return;
    }

    // Split only if text is very long (over 4000 chars)
    const chunks = splitTextIfNeeded(text);
    const totalCharacters = text.length;
    
    // TTS charges per 100 characters
    const multiplier = Math.ceil(totalCharacters / 100);

    setLoading(true);
    setShowGenerationModal(true);
    setGenerationComplete(false);
    setGenerationProgress(chunks.length > 1 ? { current: 0, total: chunks.length } : { current: 1, total: 1 });
    
    try {
      const { result, success, error } = await executeWithDeduction(
        {
          operationType: 'generate_tts',
          multiplier,
          details: { textLength: totalCharacters, voice: selectedVoice, chunks: chunks.length },
          showToast: true
        },
        async () => {
          // If text fits in one request, send it all at once for best quality
          if (chunks.length === 1) {
            const { data, error } = await supabase.functions.invoke('generate-tts-deepgram', {
              body: {
                text: chunks[0],
                voiceId: selectedVoice,
                language: selectedLanguage,
                speed: speed[0],
              }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);
            
          return {
              audioUrl: data.audioUrl,
              duration: data.duration || 0,
              chunksGenerated: 1
            };
          }
          
          // For very long texts, generate each chunk separately
          // Each chunk is uploaded to storage by the Edge Function
          const audioUrls: string[] = [];
          let totalDuration = 0;
          
          for (let i = 0; i < chunks.length; i++) {
            setGenerationProgress({ current: i + 1, total: chunks.length });
            
            const { data, error } = await supabase.functions.invoke('generate-tts-deepgram', {
              body: {
                text: chunks[i],
                voiceId: selectedVoice,
                language: selectedLanguage,
                speed: speed[0],
              }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);
            
            audioUrls.push(data.audioUrl);
            totalDuration += data.duration || 0;
          }
          
          // For multi-chunk, return the first URL (or implement proper concatenation later)
          // Note: Full audio concatenation would require server-side processing
          return {
            audioUrl: audioUrls[0],
            duration: totalDuration,
            chunksGenerated: chunks.length,
            allUrls: audioUrls
          };
        }
      );

      if (!success) {
        if (error !== 'Saldo insuficiente') {
          toast.error(error || 'Erro ao gerar áudio');
        }
        setShowGenerationModal(false);
        return;
      }

      if (result) {
        // Audio URL comes directly from Edge Function (uploaded to storage there)
        const savedAudioUrl = result.audioUrl || null;
        
        // Save to database
        const { error: insertError } = await supabase
          .from('generated_audios')
          .insert({
            user_id: user.id,
            text: text.substring(0, 500),
            voice_id: selectedVoice,
            audio_url: savedAudioUrl,
            duration: result.duration || 0
          });

        if (insertError) console.error('Error saving audio:', insertError);

        // Show completion state briefly
        setGenerationComplete(true);
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        toast.success('Áudio gerado com sucesso!');
        setText('');
        fetchAudios();
      }
    } catch (error) {
      console.error('Error generating audio:', error);
      toast.error('Erro ao gerar áudio. Tente novamente.');
    } finally {
      setLoading(false);
      setGenerationProgress(null);
      setShowGenerationModal(false);
    }
  };

  // Preview phrases for each language - native text for proper pronunciation
  const previewPhrases: Record<string, string> = {
    'pt-br': 'La Casa Dark, a ferramenta número um de canais darks.',
    'en-us': 'La Casa Dark, the number one tool for dark channels.',
    'en-gb': 'La Casa Dark, the number one tool for dark channels.',
    'es': 'La Casa Dark, la herramienta número uno para canales oscuros.',
    'fr': 'La Casa Dark, l\'outil numéro un pour les chaînes sombres.',
    'de': 'La Casa Dark, das Werkzeug Nummer eins für dunkle Kanäle.',
    'it': 'La Casa Dark, lo strumento numero uno per i canali dark.',
    'ja': 'ラ・カサ・ダーク、ダークチャンネルのためのナンバーワンツールです。',
    'nl': 'La Casa Dark, de nummer één tool voor donkere kanalen.',
    'zh': '暗室，暗黑频道的第一工具。',
    'hi': 'ला कासा डार्क, डार्क चैनलों के लिए नंबर एक टूल।',
  };

  const handlePreviewVoice = async () => {
    const previewText = previewPhrases[selectedLanguage] || previewPhrases['pt-br'];

    setPreviewLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-tts-deepgram', {
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
    
    try {
      // Create a download link for base64 data URLs
      const link = document.createElement('a');
      link.href = audio.audio_url;
      link.download = `audio_${audio.id.substring(0, 8)}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download iniciado!');
    } catch (error) {
      console.error('Error downloading audio:', error);
      toast.error('Erro ao baixar áudio');
    }
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
              className="bg-secondary border-border min-h-40 mb-2"
            />
            
            {/* Real-time duration estimate */}
            {text.trim() && (
              <div className="flex items-center gap-4 mb-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>Duração estimada: <span className="text-foreground font-medium">{estimatedDuration}</span></span>
                </div>
                <span>•</span>
                <span>{wordCount.toLocaleString('pt-BR')} palavras</span>
                <span>•</span>
                <span>{text.length.toLocaleString('pt-BR')} caracteres</span>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
                    <SelectContent className="max-h-80">
                      {/* Group by gender */}
                      {['Feminino', 'Masculino'].map((gender) => {
                        const voicesInGroup = availableVoices.filter(v => v.gender === gender);
                        if (voicesInGroup.length === 0) return null;
                        return (
                          <div key={gender}>
                            <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground bg-muted/50">
                              {gender === 'Feminino' ? '👩 Vozes Femininas' : '👨 Vozes Masculinas'}
                            </div>
                            {voicesInGroup.map((voice) => (
                              <SelectItem key={voice.id} value={voice.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{voice.name}</span>
                                  {voice.description && (
                                    <span className="text-xs text-muted-foreground">{voice.description}</span>
                                  )}
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePreviewVoice}
                    disabled={previewLoading}
                    title="Ouvir prévia da voz"
                    className="shrink-0"
                  >
                    {previewLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Headphones className="w-4 h-4" />
                    )}
                  </Button>
                </div>
                {/* Show selected voice description */}
                {availableVoices.find(v => v.id === selectedVoice)?.description && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {availableVoices.find(v => v.id === selectedVoice)?.description}
                  </p>
                )}
              </div>
              <div>
                <Label className="text-sm text-muted-foreground mb-2 block flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  Qualidade do Áudio
                </Label>
                <Select value={audioQuality} onValueChange={(v) => setAudioQuality(v as 'standard' | 'high' | 'ultra')}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">
                      <div className="flex flex-col">
                        <span>Padrão (MP3)</span>
                        <span className="text-xs text-muted-foreground">Menor arquivo, boa qualidade</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex flex-col">
                        <span>Alta (FLAC)</span>
                        <span className="text-xs text-muted-foreground">Sem perdas, recomendado</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="ultra">
                      <div className="flex flex-col">
                        <span>Ultra (WAV)</span>
                        <span className="text-xs text-muted-foreground">Máxima qualidade, arquivo maior</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
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
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {generationProgress 
                      ? `Gerando ${generationProgress.current}/${generationProgress.total}...`
                      : 'Processando...'
                    }
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Gerar Áudio
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Até 150.000 caracteres (~2 horas de áudio) • Textos longos são divididos automaticamente para manter consistência da voz
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

        {/* Voice Generation Modal */}
        <VoiceGenerationModal
          open={showGenerationModal}
          onOpenChange={setShowGenerationModal}
          progress={generationProgress}
          voiceName={availableVoices.find(v => v.id === selectedVoice)?.name || selectedVoice}
          estimatedDuration={estimatedDuration}
          isComplete={generationComplete}
        />
      </MainLayout>
    </>
  );
};

export default VoiceGenerator;
