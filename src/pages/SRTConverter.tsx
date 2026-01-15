import { MainLayout } from "@/components/layout/MainLayout";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { SEOHead } from "@/components/seo/SEOHead";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Subtitles, Scissors, Play, Split, Clock, History, Trash2, Copy, Download, ChevronDown, ChevronUp } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import { addBrandingFooter } from "@/lib/utils";
import { usePersistedState } from "@/hooks/usePersistedState";
import { SessionIndicator } from "@/components/ui/session-indicator";
import { generateNarrationSrt, countSrtBlocks } from "@/lib/srtGenerator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useTutorial } from "@/hooks/useTutorial";
import { TutorialModal, TutorialHelpButton } from "@/components/tutorial/TutorialModal";
import { SRT_CONVERTER_TUTORIAL } from "@/lib/tutorialConfigs";

interface SrtHistoryItem {
  id: string;
  title: string | null;
  original_text: string;
  srt_content: string;
  word_count: number;
  block_count: number;
  created_at: string;
}

const SRTConverter = () => {
  const { user } = useAuth();
  
  // Tutorial
  const { showTutorial, completeTutorial, openTutorial } = useTutorial(SRT_CONVERTER_TUTORIAL.id);
  
  // Conversor SRT states
  const [srtInputText, setSrtInputText] = usePersistedState("srt_conversor_input", "");
  const [srtOutputText, setSrtOutputText] = usePersistedState("srt_conversor_output", "");
  
  // Divisor de Texto states
  const [divisorInputText, setDivisorInputText] = usePersistedState("srt_divisor_input", "");
  const [divisorOutputText, setDivisorOutputText] = usePersistedState("srt_divisor_output", "");
  const [wordsLimit, setWordsLimit] = useState("");
  const [charsLimit, setCharsLimit] = useState("");

  // History states
  const [history, setHistory] = useState<SrtHistoryItem[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState<SrtHistoryItem | null>(null);

  // Stats for Divisor
  const divisorStats = useMemo(() => {
    const text = divisorInputText.trim();
    if (!text) return { words: 0, chars: 0, duration: "0:00" };
    
    const words = text.split(/\s+/).filter(w => w.length > 0).length;
    const chars = text.length;
    const durationSeconds = Math.ceil(words / 2.5); // 150 WPM = 2.5 words/sec
    const mins = Math.floor(durationSeconds / 60);
    const secs = durationSeconds % 60;
    const duration = `${mins}:${String(secs).padStart(2, '0')}`;
    
    return { words, chars, duration };
  }, [divisorInputText]);

  // Load history
  const loadHistory = async () => {
    if (!user) return;
    
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('srt_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error('Error loading SRT history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [user]);

  // Save to history
  const saveToHistory = async (originalText: string, srtContent: string) => {
    if (!user) return;

    const wordCount = originalText.split(/\s+/).filter(w => w.length > 0).length;
    const blockCount = countSrtBlocks(srtContent);
    const title = originalText.slice(0, 50) + (originalText.length > 50 ? '...' : '');

    try {
      const { error } = await supabase
        .from('srt_history')
        .insert({
          user_id: user.id,
          title,
          original_text: originalText,
          srt_content: srtContent,
          word_count: wordCount,
          block_count: blockCount
        });

      if (error) throw error;
      loadHistory();
    } catch (error) {
      console.error('Error saving to history:', error);
    }
  };

  // Delete from history
  const deleteFromHistory = async (id: string) => {
    try {
      const { error } = await supabase
        .from('srt_history')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setHistory(prev => prev.filter(item => item.id !== id));
      if (selectedHistoryItem?.id === id) {
        setSelectedHistoryItem(null);
      }
      toast.success('Item removido do histórico');
    } catch (error) {
      console.error('Error deleting from history:', error);
      toast.error('Erro ao remover do histórico');
    }
  };

  // Load history item
  const loadHistoryItem = (item: SrtHistoryItem) => {
    setSrtInputText(item.original_text);
    setSrtOutputText(item.srt_content);
    setSelectedHistoryItem(item);
    toast.success('SRT carregado do histórico');
  };

  // Converte texto para SRT com blocos de 499 chars - narração contínua sem gaps
  const handleConvertToSrt = async () => {
    if (!srtInputText.trim()) {
      toast.error('Cole o texto primeiro');
      return;
    }

    const text = srtInputText.trim();
    
    // Create a single "scene" from the entire text
    // Calculate duration based on word count (150 WPM)
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
    const durationSeconds = Math.ceil(wordCount / 2.5);
    
    const scenes = [{
      number: 1,
      text: text,
      startSeconds: 0,
      endSeconds: durationSeconds
    }];

    // Gerar SRT com gap de 10s entre blocos para facilitar edição no CapCut
    // Evita encavalamento no voiceover e permite ajustes manuais
    const srtContent = generateNarrationSrt(scenes, {
      maxCharsPerBlock: 499,
      gapBetweenScenes: 10, // 10 segundos entre cada bloco
      wordsPerMinute: 150
    });

    setSrtOutputText(srtContent);
    toast.success('Texto convertido para SRT!');

    // Save to history
    await saveToHistory(text, srtContent);
  };

  // Divide por palavras
  const handleDivideByWords = () => {
    const limit = parseInt(wordsLimit);
    if (!limit || limit <= 0) {
      toast.error('Digite um número válido de palavras');
      return;
    }
    if (!divisorInputText.trim()) {
      toast.error('Cole o roteiro primeiro');
      return;
    }

    const words = divisorInputText.split(/\s+/).filter(w => w.length > 0);
    const parts: string[] = [];
    
    for (let i = 0; i < words.length; i += limit) {
      parts.push(words.slice(i, i + limit).join(' '));
    }

    const result = parts.map((part, idx) => `--- Parte ${idx + 1} ---\n${part}`).join('\n\n');
    setDivisorOutputText(result);
    toast.success(`Roteiro dividido em ${parts.length} partes!`);
  };

  // Divide por caracteres
  const handleDivideByChars = () => {
    const limit = parseInt(charsLimit);
    if (!limit || limit <= 0) {
      toast.error('Digite um número válido de caracteres');
      return;
    }
    if (!divisorInputText.trim()) {
      toast.error('Cole o roteiro primeiro');
      return;
    }

    const text = divisorInputText;
    const parts: string[] = [];
    const words = text.split(/\s+/).filter(w => w.length > 0);
    let currentPart = '';

    for (const word of words) {
      const testPart = currentPart ? `${currentPart} ${word}` : word;
      if (testPart.length <= limit) {
        currentPart = testPart;
      } else {
        if (currentPart) parts.push(currentPart);
        currentPart = word;
      }
    }
    if (currentPart) parts.push(currentPart);

    const result = parts.map((part, idx) => `--- Parte ${idx + 1} ---\n${part}`).join('\n\n');
    setDivisorOutputText(result);
    toast.success(`Roteiro dividido em ${parts.length} partes!`);
  };

  const handleCopySrt = () => {
    if (!srtOutputText) {
      toast.error('Nenhum conteúdo para copiar');
      return;
    }
    navigator.clipboard.writeText(srtOutputText);
    toast.success('SRT copiado!');
  };

  const handleDownloadSrt = () => {
    if (!srtOutputText) {
      toast.error('Nenhum conteúdo para baixar');
      return;
    }
    const blob = new Blob([srtOutputText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'legenda.srt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Arquivo SRT baixado!');
  };

  const handleDownloadDivisor = () => {
    if (!divisorOutputText) {
      toast.error('Nenhum conteúdo para baixar');
      return;
    }
    const blob = new Blob([addBrandingFooter(divisorOutputText)], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'roteiro-dividido.txt';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Arquivo TXT baixado!');
  };

  return (
    <MainLayout>
      <SEOHead
        title="Conversor SRT"
        description="Converta textos em legendas SRT e divida roteiros com facilidade."
        noindex={true}
      />
      <PermissionGate permission="conversor_srt" featureName="Conversor SRT">
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-5xl mx-auto">
          {/* Session Indicator */}
          <SessionIndicator 
            storageKeys={["srt_conversor_input", "srt_conversor_output", "srt_divisor_input", "srt_divisor_output"]}
            label="Conteúdo anterior"
            onClear={() => {
              setSrtInputText("");
              setSrtOutputText("");
              setDivisorInputText("");
              setDivisorOutputText("");
            }}
          />

          <div className="mb-8 mt-4 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Conversor SRT + Divisor de Texto</h1>
              <p className="text-muted-foreground">
                Converta textos em legendas SRT e divida roteiros com contador de palavras e tempo.
              </p>
            </div>
            <TutorialHelpButton onClick={openTutorial} />
          </div>

          {/* Conversor de SRT */}
          <Card className="p-6 mb-6 border-border">
            <div className="flex items-center gap-3 mb-2">
              <Subtitles className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Conversor de SRT</h2>
            </div>
            <p className="text-muted-foreground text-sm mb-6">
              Converte seu texto em legendas SRT, dividindo em blocos de no máximo 499 caracteres sem quebrar frases ou parágrafos, com 10 segundos entre cada legenda.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Cole seu texto aqui</label>
                <Textarea
                  data-tutorial="srt-input"
                  placeholder="Cole o texto que deseja converter em SRT..."
                  value={srtInputText}
                  onChange={(e) => setSrtInputText(e.target.value)}
                  className="bg-secondary/50 border-border min-h-48"
                />
              </div>

              <Button onClick={handleConvertToSrt} className="gap-2">
                <Play className="w-4 h-4" />
                Converter para SRT
              </Button>

              {srtOutputText && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-foreground">Resultado SRT</label>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={handleCopySrt}>
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleDownloadSrt} data-tutorial="download-srt">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={srtOutputText}
                    readOnly
                    className="bg-secondary/50 border-border min-h-48 font-mono text-sm"
                  />
                </div>
              )}
            </div>
          </Card>

          {/* Divisor de Texto */}
          <Card className="p-6 mb-6 border-border">
            <div className="flex items-center gap-3 mb-2">
              <Scissors className="w-5 h-5 text-purple-500" />
              <h2 className="text-xl font-semibold text-foreground">Divisor de Texto</h2>
            </div>
            <p className="text-muted-foreground text-sm mb-6">
              Divida seu roteiro em partes iguais por palavras ou caracteres, com contador automático de palavras, caracteres e tempo estimado de narração.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">Cole seu roteiro aqui</label>
                <Textarea
                  placeholder="Cole o roteiro que deseja analisar e dividir..."
                  value={divisorInputText}
                  onChange={(e) => setDivisorInputText(e.target.value)}
                  className="bg-secondary/50 border-border min-h-48"
                />
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4" data-tutorial="wpm-setting">
                <div className="bg-secondary/50 rounded-lg p-4 text-center border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Palavras</p>
                  <p className="text-2xl font-bold text-foreground">{divisorStats.words}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4 text-center border border-border">
                  <p className="text-xs text-muted-foreground mb-1">Caracteres</p>
                  <p className="text-2xl font-bold text-foreground">{divisorStats.chars}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4 text-center border border-border">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Tempo de Narração</p>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{divisorStats.duration}</p>
                </div>
              </div>

              {/* Dividir por palavras / caracteres */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Dividir por Palavras</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Ex: 100"
                      value={wordsLimit}
                      onChange={(e) => setWordsLimit(e.target.value)}
                      className="bg-secondary/50 border-border"
                    />
                    <Button 
                      onClick={handleDivideByWords}
                      variant="secondary"
                      className="gap-2 bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                    >
                      <Split className="w-4 h-4" />
                      Dividir
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">Dividir por Caracteres</label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Ex: 500"
                      value={charsLimit}
                      onChange={(e) => setCharsLimit(e.target.value)}
                      className="bg-secondary/50 border-border"
                    />
                    <Button 
                      onClick={handleDivideByChars}
                      variant="secondary"
                      className="gap-2 bg-purple-600 hover:bg-purple-700 text-white shrink-0"
                    >
                      <Split className="w-4 h-4" />
                      Dividir
                    </Button>
                  </div>
                </div>
              </div>

              {divisorOutputText && (
                <div className="mt-4">
                  <label className="text-sm font-medium text-foreground mb-2 block">Resultado</label>
                  <Textarea
                    value={divisorOutputText}
                    readOnly
                    className="bg-secondary/50 border-border min-h-48 font-mono text-sm"
                  />
                  <Button 
                    variant="outline" 
                    onClick={handleDownloadDivisor}
                    className="mt-2 gap-2"
                  >
                    Baixar TXT
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Histórico de SRT */}
          {user && (
            <Card className="p-6 border-border">
              <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between cursor-pointer">
                    <div className="flex items-center gap-3">
                      <History className="w-5 h-5 text-primary" />
                      <h2 className="text-xl font-semibold text-foreground">Histórico de SRT</h2>
                      <span className="text-sm text-muted-foreground">({history.length})</span>
                    </div>
                    {isHistoryOpen ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {loadingHistory ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Carregando histórico...
                    </div>
                  ) : history.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum SRT gerado ainda. Converta um texto para começar.
                    </div>
                  ) : (
                    <ScrollArea className="h-[400px] mt-4">
                      <div className="space-y-3 pr-4">
                        {history.map((item) => (
                          <div
                            key={item.id}
                            className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                              selectedHistoryItem?.id === item.id
                                ? 'bg-primary/10 border-primary/50'
                                : 'bg-secondary/30 border-border hover:bg-secondary/50'
                            }`}
                            onClick={() => loadHistoryItem(item)}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-foreground truncate">
                                  {item.title || 'Sem título'}
                                </p>
                                <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                  <span>{item.word_count} palavras</span>
                                  <span>{item.block_count} blocos</span>
                                  <span>
                                    {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                  </span>
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteFromHistory(item.id);
                                }}
                                className="text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )}
        </div>
      </div>
      
      {/* Tutorial Modal */}
      <TutorialModal
        open={showTutorial}
        onOpenChange={(open) => !open && completeTutorial()}
        title={SRT_CONVERTER_TUTORIAL.title}
        description={SRT_CONVERTER_TUTORIAL.description}
        steps={SRT_CONVERTER_TUTORIAL.steps}
        onComplete={completeTutorial}
      />
      </PermissionGate>
    </MainLayout>
  );
};

export default SRTConverter;
