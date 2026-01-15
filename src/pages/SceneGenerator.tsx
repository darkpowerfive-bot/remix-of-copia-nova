import { useState, useMemo, useRef } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { PermissionGate } from "@/components/auth/PermissionGate";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Loader2, Film, Copy, Check, Image, Images, Download, ArrowRight, Upload, FileText, Sparkles, CheckCircle2, Rocket, Clock, AlertCircle, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { addBrandingFooter } from "@/lib/utils";
import { usePersistedState } from "@/hooks/usePersistedState";
import { SessionIndicator } from "@/components/ui/session-indicator";
import BatchImageGenerator from "@/components/scenes/BatchImageGenerator";
import { useCreditDeduction } from "@/hooks/useCreditDeduction";
import { StyleSelector } from "@/components/scenes/StyleSelector";
import { getStyleById } from "@/lib/thumbnailStyles";
import logo1 from "@/assets/logo_1.gif";

// Exportar interface para uso em outros componentes
export interface ScenePrompt {
  number: number;
  text: string;
  imagePrompt: string;
  wordCount: number;
}

const WORDS_PER_SCENE_OPTIONS = [
  { value: "25", label: "25 palavras" },
  { value: "30", label: "30 palavras" },
  { value: "35", label: "35 palavras" },
  { value: "40", label: "40 palavras" },
  { value: "50", label: "50 palavras" },
  { value: "60", label: "60 palavras" },
  { value: "75", label: "75 palavras" },
  { value: "100", label: "100 palavras" },
  { value: "custom", label: "Personalizado..." },
];

const SceneGenerator = () => {
  // Credit deduction hook
  const { executeWithDeduction, getEstimatedCost } = useCreditDeduction();
  
  // Tab state
  const [activeTab, setActiveTab] = usePersistedState("scene_active_tab", "scenes");
  
  // Persisted states
  const [script, setScript] = usePersistedState("scene_script", "");
  const [title, setTitle] = usePersistedState("scene_title", "");
  const [niche, setNiche] = usePersistedState("scene_niche", "");
  const [style, setStyle] = usePersistedState("scene_style", "photorealistic");
  const [wordsPerScene, setWordsPerScene] = usePersistedState("scene_wordsPerScene", "40");
  const [selectedModel, setSelectedModel] = usePersistedState("scene_model", "gpt-4.1-fast");
  const [scenes, setScenes] = usePersistedState<ScenePrompt[]>("scene_scenes", []);
  const [batchPrompts, setBatchPrompts] = usePersistedState("batch_prompts", "");

  // AI Model options (Laozhang standard)
  const AI_MODEL_OPTIONS = [
    { value: "gpt-4.1-fast", label: "GPT-4.1 Fast", provider: "OpenAI" },
    { value: "claude-sonnet-4-20250514", label: "Claude 4 Sonnet", provider: "Anthropic" },
    { value: "gemini-2.5-pro-preview-05-06", label: "Gemini 2.5 Pro", provider: "Google" },
    { value: "deepseek-chat", label: "DeepSeek V3", provider: "DeepSeek" },
  ];
  
  // Non-persisted states
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showCustomWps, setShowCustomWps] = useState(false);
  const [customWps, setCustomWps] = useState("");
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<"generating" | "complete">("generating");
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentSceneCount, setCurrentSceneCount] = useState(0);
  const [totalExpectedScenes, setTotalExpectedScenes] = useState(0);
  const [shouldAutoStartBatch, setShouldAutoStartBatch] = useState(false);
  
  // Novo: Modal de pré-análise de timeline
  const [preAnalysisOpen, setPreAnalysisOpen] = useState(false);
  const [wpmConfig, setWpmConfig] = usePersistedState("scene_wpm", "140");
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check if current value is custom
  const isCustomValue = !WORDS_PER_SCENE_OPTIONS.some(opt => opt.value === wordsPerScene && opt.value !== "custom");

  // Handle words per scene selection
  const handleWordsPerSceneChange = (value: string) => {
    if (value === "custom") {
      setShowCustomWps(true);
      setCustomWps(wordsPerScene === "custom" ? "" : wordsPerScene);
    } else {
      setWordsPerScene(value);
      setShowCustomWps(false);
    }
  };

  // Apply custom WPS
  const applyCustomWps = () => {
    const num = parseInt(customWps);
    if (num >= 10 && num <= 500) {
      setWordsPerScene(customWps);
      setShowCustomWps(false);
    } else {
      toast.error("Digite um valor entre 10 e 500 palavras");
    }
  };

  // Handle TXT file - shared logic for upload and drop
  const processFile = (file: File) => {
    if (!file.name.endsWith('.txt')) {
      toast.error("Por favor, selecione um arquivo .txt");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setScript(content);
        toast.success(`Arquivo "${file.name}" carregado com sucesso!`);
      }
    };
    reader.onerror = () => {
      toast.error("Erro ao ler o arquivo");
    };
    reader.readAsText(file);
  };

  // Handle TXT file upload via input
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    processFile(file);
    
    // Reset input to allow re-uploading same file
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Drag and drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  // Calculate estimated scenes based on word count
  const wordCount = useMemo(() => {
    return script.split(/\s+/).filter(w => w).length;
  }, [script]);

  const estimatedScenes = useMemo(() => {
    const wps = parseInt(wordsPerScene);
    if (wordCount === 0 || wps === 0) return 0;
    return Math.ceil(wordCount / wps);
  }, [wordCount, wordsPerScene]);

  // Cálculos de timeline
  const wpmValue = parseInt(wpmConfig) || 140;
  const totalDurationSeconds = useMemo(() => {
    if (wordCount === 0) return 0;
    return Math.round((wordCount / wpmValue) * 60);
  }, [wordCount, wpmValue]);
  
  const totalDurationFormatted = useMemo(() => {
    const minutes = Math.floor(totalDurationSeconds / 60);
    const seconds = totalDurationSeconds % 60;
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMins = minutes % 60;
      return `${hours}h ${remainingMins}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  }, [totalDurationSeconds]);

  const averageSceneDuration = useMemo(() => {
    if (estimatedScenes === 0) return 0;
    return Math.round((totalDurationSeconds / estimatedScenes) * 10) / 10;
  }, [totalDurationSeconds, estimatedScenes]);

  // Função para abrir modal de pré-análise
  const handleOpenPreAnalysis = () => {
    if (!script.trim()) {
      toast.error("Cole o roteiro para gerar prompts de cenas");
      return;
    }
    setPreAnalysisOpen(true);
  };

  // Função para confirmar e iniciar geração
  const handleConfirmAndGenerate = () => {
    setPreAnalysisOpen(false);
    handleGenerate();
  };

  const handleGenerate = async () => {
    if (!script.trim()) {
      toast.error("Cole o roteiro para gerar prompts de cenas");
      return;
    }

    // Calcular créditos baseado em lotes de 10 cenas
    const scenesMultiplier = Math.ceil(estimatedScenes / 10);
    
    setIsGenerating(true);
    setScenes([]);
    setProgressModalOpen(true);
    setGenerationStatus("generating");
    setGenerationProgress(0);
    setCurrentSceneCount(0);
    setTotalExpectedScenes(estimatedScenes);

    // Retry logic
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          toast.info(`Tentativa ${attempt + 1}/${maxRetries}...`);
          await new Promise(r => setTimeout(r, 2000 * attempt));
        }

        // Usar streaming com fetch direto para SSE
        const { data: { session } } = await supabase.auth.getSession();
        const accessToken = session?.access_token;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 min timeout total

        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-scenes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream",
            Authorization: `Bearer ${accessToken || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            script,
            title,
            niche,
            style,
            stylePrefix: getStyleById(style)?.promptPrefix || "",
            estimatedScenes,
            wordsPerScene: parseInt(wordsPerScene),
            model: selectedModel,
            stream: true,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        // Se não for SSE, faz fallback para JSON.
        const contentType = response.headers.get("content-type") || "";

        if (!response.ok) {
          let msg = "Erro ao gerar cenas";
          try {
            const errorData = await response.json();
            msg = errorData?.error || msg;
          } catch {
            msg = (await response.text()) || msg;
          }
          throw new Error(msg);
        }

        if (contentType.includes("application/json")) {
          const json = await response.json();
          const jsonScenes = (json?.scenes || []) as ScenePrompt[];

          if (!Array.isArray(jsonScenes) || jsonScenes.length === 0) {
            throw new Error(json?.error || "Não foi possível gerar os prompts.");
          }

          setScenes(jsonScenes);
          setCurrentSceneCount(jsonScenes.length);
          setTotalExpectedScenes(jsonScenes.length);
          setGenerationProgress(100);
          setGenerationStatus("complete");
          setIsGenerating(false);
          return;
        }

        if (!response.body) {
          throw new Error("Streaming não suportado");
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        const collectedScenes: ScenePrompt[] = [];
        let maxTotal = estimatedScenes;
        let lastDataTime = Date.now();
        let streamCompleted = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          lastDataTime = Date.now();
          buffer += decoder.decode(value, { stream: true });
          buffer = buffer.replace(/\r/g, "");

          const chunks = buffer.split("\n\n");
          buffer = chunks.pop() || "";

          for (const chunk of chunks) {
            // Ignorar heartbeats (mantém conexão viva)
            if (chunk.startsWith(":")) continue;
            if (!chunk.startsWith("data: ")) continue;

            try {
              const data = JSON.parse(chunk.slice(6));

              if (data.type === "init") {
                maxTotal = data.estimatedScenes || estimatedScenes;
                setTotalExpectedScenes(maxTotal);
              } else if (data.type === "batch_start") {
                // Atualizar UI com progresso do lote
                console.log(`[Stream] Batch ${data.batch}/${data.totalBatches} starting...`);
              } else if (data.type === "batch_retry") {
                // Notificar retry de lote
                console.log(`[Stream] Batch ${data.batch} using fallback`);
              } else if (data.type === "scene") {
                collectedScenes.push(data.scene);
                setScenes([...collectedScenes]);

                const actualTotal = Math.max(data.total || maxTotal, collectedScenes.length);
                setCurrentSceneCount(collectedScenes.length);
                setTotalExpectedScenes(actualTotal);

                const progress = Math.min(95, (collectedScenes.length / actualTotal) * 100);
                setGenerationProgress(progress);
              } else if (data.type === "complete") {
                setCurrentSceneCount(collectedScenes.length);
                setTotalExpectedScenes(collectedScenes.length);
                setGenerationProgress(100);
                setGenerationStatus("complete");
                streamCompleted = true;
              } else if (data.type === "error") {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.log("[Stream] Parse error:", parseError);
            }
          }
        }

        // Verificar se o stream completou com sucesso
        if (collectedScenes.length > 0) {
          if (!streamCompleted) {
            // Stream terminou mas não recebeu 'complete' - assumir sucesso
            setCurrentSceneCount(collectedScenes.length);
            setTotalExpectedScenes(collectedScenes.length);
            setGenerationProgress(100);
            setGenerationStatus("complete");
          }
          setIsGenerating(false);
          return; // Sucesso - sair do loop de retry
        } else {
          throw new Error("Nenhuma cena gerada. Tente novamente.");
        }

      } catch (error) {
        console.error(`[Generate] Attempt ${attempt + 1} failed:`, error);
        lastError = error instanceof Error ? error : new Error("Erro desconhecido");
        
        // Se for erro de créditos insuficientes, não retry
        if (lastError.message.includes("insuficiente") || lastError.message.includes("402")) {
          break;
        }
        
        // Se foi a última tentativa
        if (attempt === maxRetries - 1) {
          toast.error(`Falha após ${maxRetries} tentativas: ${lastError.message}`);
          setProgressModalOpen(false);
        }
      }
    }

    setIsGenerating(false);
  };

  const handleCloseProgressModal = () => {
    setProgressModalOpen(false);
  };

  const handleGoToBatch = () => {
    const prompts = scenes.map(s => s.imagePrompt).join("\n\n");
    console.log("[SceneGenerator] Going to batch with prompts:", prompts.substring(0, 200));
    
    // Primeiro atualizar prompts e fechar modal
    setBatchPrompts(prompts);
    setProgressModalOpen(false);
    
    // Depois ativar auto-start e mudar aba (com pequeno delay para garantir estado atualizado)
    setTimeout(() => {
      setShouldAutoStartBatch(true);
      setActiveTab("batch");
    }, 100);
  };

  const copyPrompt = (prompt: string, index: number) => {
    navigator.clipboard.writeText(prompt);
    setCopiedIndex(index);
    toast.success("Prompt copiado!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const copyAllPrompts = () => {
    const allPrompts = scenes.map(s => `CENA ${s.number}:\n${s.imagePrompt}`).join("\n\n---\n\n");
    navigator.clipboard.writeText(allPrompts);
    toast.success("Todos os prompts copiados!");
  };

  const downloadTxt = () => {
    const content = addBrandingFooter(scenes.map(s => s.imagePrompt).join("\n\n"));
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prompts-cenas-${title || "video"}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo TXT baixado!");
  };

  const sendToBatchGenerator = () => {
    const prompts = scenes.map(s => s.imagePrompt).join("\n\n");
    setBatchPrompts(prompts);
    setActiveTab("batch");
    toast.success("Prompts enviados para Imagens em Lote!");
  };

  return (
    <>
      <SEOHead
        title="Gerador de Cenas"
        description="Gere prompts de imagem para cada cena do seu roteiro com IA."
        noindex={true}
      />
      <MainLayout>
        <PermissionGate permission="gerador_cenas" featureName="Gerador de Cenas">
      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <div className="max-w-6xl mx-auto">
          {/* Session Indicator */}
          <SessionIndicator 
            storageKeys={["scene_script", "scene_title", "scene_niche", "scene_scenes"]}
            label="Cenas anteriores"
            onClear={() => {
              setScript("");
              setTitle("");
              setNiche("");
              setScenes([]);
            }}
          />

          <div className="mb-6 mt-4 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Gerador de Cenas</h1>
              <p className="text-muted-foreground">
                Gere prompts de imagem para cada cena do seu roteiro ou imagens em lote
              </p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs 
            value={activeTab} 
            onValueChange={(tab) => {
              setActiveTab(tab);
              // Reset autoStart flag when switching tabs manually
              if (tab !== "batch") {
                setShouldAutoStartBatch(false);
              }
            }} 
            className="space-y-6"
          >
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="scenes" className="flex items-center gap-2">
                <Film className="w-4 h-4" />
                Prompts de Cenas
              </TabsTrigger>
              <TabsTrigger value="batch" className="flex items-center gap-2">
                <Images className="w-4 h-4" />
                Imagens em Lote
              </TabsTrigger>
            </TabsList>

            {/* Scenes Tab */}
            <TabsContent value="scenes">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Form */}
                <div className="lg:col-span-2">
                  <Card className="p-6">
                    <div className="flex items-center gap-2 mb-6">
                      <Film className="w-5 h-5 text-primary" />
                      <h3 className="font-semibold text-foreground">Roteiro</h3>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="title">Título do Vídeo</Label>
                          <Input
                            id="title"
                            placeholder="Ex: Como ganhar dinheiro online"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="niche">Nicho</Label>
                          <Input
                            id="niche"
                            placeholder="Ex: Marketing Digital"
                            value={niche}
                            onChange={(e) => setNiche(e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Modelo de IA</Label>
                          <Select value={selectedModel} onValueChange={setSelectedModel}>
                            <SelectTrigger className="mt-1">
                              <SelectValue placeholder="Selecione o modelo" />
                            </SelectTrigger>
                            <SelectContent>
                              {AI_MODEL_OPTIONS.map((model) => (
                                <SelectItem key={model.value} value={model.value}>
                                  <span className="flex items-center gap-2">
                                    <Sparkles className="w-3 h-3 text-primary" />
                                    {model.label}
                                    <span className="text-muted-foreground text-xs">({model.provider})</span>
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Estilo Visual</Label>
                          <div className="mt-1">
                            <StyleSelector 
                              selectedStyleId={style} 
                              onStyleSelect={setStyle} 
                            />
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        <div>
                          <Label>Palavras por Cena</Label>
                          {showCustomWps ? (
                            <div className="flex gap-2 mt-1">
                              <Input
                                type="number"
                                min="10"
                                max="500"
                                placeholder="Ex: 45"
                                value={customWps}
                                onChange={(e) => setCustomWps(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") applyCustomWps();
                                  if (e.key === "Escape") setShowCustomWps(false);
                                }}
                                className="flex-1"
                                autoFocus
                              />
                              <Button size="sm" onClick={applyCustomWps}>
                                OK
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => setShowCustomWps(false)}
                              >
                                ✕
                              </Button>
                            </div>
                          ) : (
                            <Select 
                              value={isCustomValue ? "custom" : wordsPerScene} 
                              onValueChange={handleWordsPerSceneChange}
                            >
                              <SelectTrigger className="mt-1">
                                <SelectValue>
                                  {isCustomValue ? `${wordsPerScene} palavras` : undefined}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {WORDS_PER_SCENE_OPTIONS.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>
                      </div>

                      {/* Estimated scenes info */}
                      {wordCount > 0 && (
                        <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                          <p className="text-sm text-foreground">
                            <span className="font-medium">{wordCount}</span> palavras ÷{" "}
                            <span className="font-medium">{wordsPerScene}</span> = aproximadamente{" "}
                            <span className="font-bold text-primary">{estimatedScenes}</span> cenas
                          </p>
                        </div>
                      )}

                      <div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="script">Roteiro Completo</Label>
                          <div className="flex gap-2">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".txt"
                              onChange={handleFileUpload}
                              className="hidden"
                              id="script-file-upload"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => fileInputRef.current?.click()}
                              className="h-7 text-xs"
                            >
                              <Upload className="w-3 h-3 mr-1" />
                              Carregar TXT
                            </Button>
                          </div>
                        </div>
                        <div
                          className={`relative mt-1 ${isDragging ? "ring-2 ring-primary ring-offset-2 ring-offset-background rounded-md" : ""}`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        >
                          <Textarea
                            id="script"
                            placeholder="Cole seu roteiro aqui, carregue ou arraste um arquivo .txt..."
                            value={script}
                            onChange={(e) => setScript(e.target.value)}
                            className={`min-h-64 transition-colors ${isDragging ? "bg-primary/5 border-primary" : ""}`}
                          />
                          {isDragging && (
                            <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-md pointer-events-none">
                              <div className="flex flex-col items-center gap-2 text-primary">
                                <Upload className="w-8 h-8" />
                                <span className="font-medium">Solte o arquivo .txt aqui</span>
                              </div>
                            </div>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {wordCount} palavras
                        </p>
                      </div>

                      <Button
                        onClick={handleOpenPreAnalysis}
                        disabled={isGenerating || !script.trim()}
                        className="w-full"
                      >
                        {isGenerating ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Gerando prompts...
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 mr-2" />
                            Analisar Timeline {estimatedScenes > 0 && `(~${estimatedScenes} cenas)`}
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                </div>

                {/* Results */}
                <div>
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-foreground">Cenas Geradas</h3>
                      {scenes.length > 0 && (
                        <Button variant="outline" size="sm" onClick={copyAllPrompts}>
                          <Copy className="w-3 h-3 mr-1" />
                          Copiar Todos
                        </Button>
                      )}
                    </div>

                    {scenes.length === 0 ? (
                      <div className="text-center py-8">
                        <Film className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-sm text-muted-foreground">
                          Os prompts de cenas aparecerão aqui
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-3 max-h-[500px] overflow-y-auto">
                          {scenes.map((scene, index) => (
                            <div
                              key={index}
                              className="p-3 bg-secondary/50 rounded-lg space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-primary">
                                  Cena {scene.number}
                                </span>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => copyPrompt(scene.imagePrompt, index)}
                                >
                                  {copiedIndex === index ? (
                                    <Check className="w-3 h-3 text-success" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                </Button>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {scene.text.substring(0, 100)}...
                              </p>
                              <p className="text-sm text-foreground">
                                {scene.imagePrompt.substring(0, 150)}...
                              </p>
                            </div>
                          ))}
                        </div>

                        {/* Action buttons */}
                        <div className="mt-4 pt-4 border-t border-border space-y-2">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={downloadTxt}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Baixar TXT
                          </Button>
                          <Button
                            className="w-full"
                            onClick={sendToBatchGenerator}
                          >
                            <ArrowRight className="w-4 h-4 mr-2" />
                            Gerar Imagens em Lote
                          </Button>
                        </div>
                      </>
                    )}
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* Batch Image Generation Tab */}
            <TabsContent value="batch">
              <BatchImageGenerator 
                initialPrompts={batchPrompts} 
                autoStart={shouldAutoStartBatch}
                scenesData={scenes}
                projectTitle={title}
                wordsPerMinute={150}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Progress/Complete Modal */}
      <Dialog open={progressModalOpen} onOpenChange={setProgressModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {generationStatus === "generating" ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  Gerando Prompts de Cenas
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Prompts Gerados com Sucesso!
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {generationStatus === "generating" ? (
              <>
                <div className="flex items-center justify-center py-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden shadow-[0_0_30px_hsl(var(--primary)/0.4)]">
                      <img 
                        src={logo1}
                        alt="Processando"
                        className="w-full h-full object-cover scale-110"
                      />
                    </div>
                    <div className="absolute inset-0 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Progress value={generationProgress} className="h-2" />
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Gerando prompts otimizados...
                    </span>
                    <span className="font-mono font-semibold text-primary">
                      {currentSceneCount}/{totalExpectedScenes}
                    </span>
                  </div>
                </div>
                <div className="text-center text-xs text-muted-foreground">
                  <p>{wordCount} palavras • {wordsPerScene} palavras/cena</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-center py-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-1">
                      {scenes.length}
                    </div>
                    <p className="text-sm text-muted-foreground">prompts gerados</p>
                  </div>
                </div>

                <div className="p-3 bg-secondary/50 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Preview do primeiro prompt:</p>
                  <p className="text-sm text-foreground line-clamp-3">
                    {scenes[0]?.imagePrompt || "..."}
                  </p>
                </div>

                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      downloadTxt();
                      handleCloseProgressModal();
                    }}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Baixar TXT
                  </Button>
                  <Button
                    className="w-full"
                    onClick={handleGoToBatch}
                  >
                    <Images className="w-4 h-4 mr-2" />
                    Gerar Imagens em Lote
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground"
                    onClick={handleCloseProgressModal}
                  >
                    Ver Prompts Detalhados
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Pre-Analysis Timeline Modal */}
      <Dialog open={preAnalysisOpen} onOpenChange={setPreAnalysisOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary" />
              Análise de Timeline
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Resumo Principal */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="text-2xl font-bold text-primary">{totalDurationFormatted}</div>
                <p className="text-xs text-muted-foreground mt-1">Duração Total</p>
              </div>
              <div className="text-center p-4 bg-secondary/50 rounded-lg border border-border">
                <div className="text-2xl font-bold text-foreground">{estimatedScenes}</div>
                <p className="text-xs text-muted-foreground mt-1">Cenas Necessárias</p>
              </div>
              <div className="text-center p-4 bg-secondary/50 rounded-lg border border-border">
                <div className="text-2xl font-bold text-foreground">{averageSceneDuration}s</div>
                <p className="text-xs text-muted-foreground mt-1">Média por Cena</p>
              </div>
            </div>

            {/* Detalhes */}
            <div className="p-4 bg-secondary/30 rounded-lg space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Palavras no roteiro:</span>
                <span className="font-medium">{wordCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Palavras por cena:</span>
                <span className="font-medium">{wordsPerScene}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Velocidade de narração:</span>
                <span className="font-medium">{wpmValue} WPM</span>
              </div>
            </div>

            {/* Configurações Ajustáveis */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Settings className="w-4 h-4" />
                Ajustar Configurações
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Palavras por Cena</Label>
                  <Select value={wordsPerScene} onValueChange={setWordsPerScene}>
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WORDS_PER_SCENE_OPTIONS.filter(o => o.value !== "custom").map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">WPM (Velocidade)</Label>
                  <Select value={wpmConfig} onValueChange={setWpmConfig}>
                    <SelectTrigger className="mt-1 h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100 WPM (Lento)</SelectItem>
                      <SelectItem value="120">120 WPM (Pausado)</SelectItem>
                      <SelectItem value="140">140 WPM (Normal)</SelectItem>
                      <SelectItem value="160">160 WPM (Rápido)</SelectItem>
                      <SelectItem value="180">180 WPM (Muito Rápido)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Aviso */}
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-200">
                Este é o número exato de cenas que serão geradas. Cada cena terá ~{averageSceneDuration}s 
                de duração na narração. Ajuste as configurações se precisar de mais ou menos cenas.
              </p>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setPreAnalysisOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                className="flex-1"
                onClick={handleConfirmAndGenerate}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Gerar {estimatedScenes} Cenas
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

        </PermissionGate>
      </MainLayout>
    </>
  );
};

export default SceneGenerator;
