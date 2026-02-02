import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Zap, Star, Info, Copy, Check, AlertTriangle } from "lucide-react";
import logoGif from "@/assets/logo.gif";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useActivityLog } from "@/hooks/useActivityLog";
import { useCreditDeduction } from "@/hooks/useCreditDeduction";
import { useNavigate } from "react-router-dom";

interface ScriptAgent {
  id: string;
  name: string;
  niche: string | null;
  sub_niche: string | null;
  based_on_title: string | null;
  formula: string | null;
  formula_structure: {
    hook?: string;
    desenvolvimento?: string;
    climax?: string;
    cta?: string;
    transicoes?: string;
    motivoSucesso?: string;
    formulaReplicavel?: string;
    instrucoesParaAgente?: string;
    exemplosDeAplicacao?: {
      fraserChave?: string[];
      estruturaDeFrases?: string;
      transicoesUsadas?: string[];
    };
    tempoTotal?: string;
  } | null;
  mental_triggers: string[] | null;
  times_used: number;
}

interface GenerateScriptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: ScriptAgent | null;
}

export const GenerateScriptModal = ({
  open,
  onOpenChange,
  agent,
}: GenerateScriptModalProps) => {
  const { user } = useAuth();
  const { logActivity } = useActivityLog();
  const { deduct, checkBalance, getEstimatedCost, usePlatformCredits } = useCreditDeduction();
  const navigate = useNavigate();
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentPart, setCurrentPart] = useState(0);
  const [totalParts, setTotalParts] = useState(0);
  const [insufficientCredits, setInsufficientCredits] = useState(false);
  const [currentBalance, setCurrentBalance] = useState(0);
  // Form state
  const [videoTitle, setVideoTitle] = useState("");
  const [duration, setDuration] = useState("5");
  const [language, setLanguage] = useState("pt-BR");
  const [aiModel, setAiModel] = useState("gemini-2.5-pro");
  const [additionalContext, setAdditionalContext] = useState("");
  
  // CTA options
  const [ctaInicio, setCtaInicio] = useState(false);
  const [ctaMeio, setCtaMeio] = useState(false);
  const [ctaFinal, setCtaFinal] = useState(true);

  // Calculated values
  const wordsPerMinute = 130;
  const durationNum = parseInt(duration || "1");
  
  // Duração mínima = solicitada, máxima = solicitada + 3 minutos
  const minDuration = durationNum;
  const maxDuration = durationNum + 3;
  const targetDuration = durationNum + 1; // Alvo: +1 minuto para garantir conteúdo suficiente
  
  const estimatedWords = targetDuration * wordsPerMinute;
  const estimatedParts = Math.max(1, Math.ceil(targetDuration / 3));
  
  // 1 crédito por minuto (independente do modelo)
  const estimatedCredits = Math.max(1, Math.ceil(targetDuration));

  // Result state
  const [generatedScript, setGeneratedScript] = useState<string | null>(null);

  // Check balance on open - skip if using own API
  useEffect(() => {
    const checkCredits = async () => {
      if (open && user) {
        // Se usa API própria, nunca mostra créditos insuficientes
        if (usePlatformCredits === false) {
          setInsufficientCredits(false);
          setCurrentBalance(0);
          return;
        }
        const { hasBalance, currentBalance: balance } = await checkBalance(estimatedCredits);
        setCurrentBalance(balance);
        setInsufficientCredits(!hasBalance);
      }
    };
    checkCredits();
  }, [open, user, estimatedCredits, checkBalance, usePlatformCredits]);

  const handleGenerateScript = async () => {
    if (!videoTitle.trim()) {
      toast.error("Por favor, insira o título do vídeo");
      return;
    }

    if (!user || !agent) {
      toast.error("Erro ao gerar roteiro");
      return;
    }

    // Check balance before generating
    const deductResult = await deduct({
      operationType: 'generate_script',
      multiplier: targetDuration,
      modelUsed: aiModel,
      details: { duration: targetDuration, model: aiModel },
      showToast: true
    });

    if (!deductResult.success) {
      return; // Toast already shown by deduct
    }

    setGenerating(true);
    setGeneratedScript(null);
    setProgress(0);
    
    // Determinar se precisa dividir em partes (mais de 5 minutos = dividir)
    const MINUTES_PER_PART = 5;
    const numParts = Math.max(1, Math.ceil(targetDuration / MINUTES_PER_PART));
    setTotalParts(numParts);
    
    try {
      // Build the CTA instructions conforme documentação
      const ctaPositions = [];
      if (ctaInicio) ctaPositions.push("início (primeiros 30 segundos)");
      if (ctaMeio) ctaPositions.push("meio (metade do vídeo)");
      if (ctaFinal) ctaPositions.push("final (últimos 30 segundos)");

      let fullScript = "";
      let totalCreditsUsed = 0;

      for (let partIndex = 0; partIndex < numParts; partIndex++) {
        setCurrentPart(partIndex + 1);
        setProgress(Math.round((partIndex / numParts) * 80) + 10);

        const partMinutes = Math.ceil(targetDuration / numParts);
        const partWords = partMinutes * wordsPerMinute;
        const isFirstPart = partIndex === 0;
        const isLastPart = partIndex === numParts - 1;

        // Construir prompt específico para esta parte
        const partPrompt = `
Gere ${numParts > 1 ? `a PARTE ${partIndex + 1} de ${numParts} de` : ''} um roteiro para um vídeo com o título: "${videoTitle}"

${numParts > 1 ? `
📍 CONTEXTO DESTA PARTE (${partIndex + 1}/${numParts}):
${isFirstPart ? '- Esta é a PRIMEIRA parte: inclua um HOOK poderoso para prender a atenção nos primeiros 30 segundos' : ''}
${!isFirstPart ? `- Roteiro anterior (resumo): Continue de onde parou, mantendo a narrativa fluida` : ''}
${isLastPart ? '- Esta é a ÚLTIMA parte: inclua uma conclusão impactante e CTA' : ''}
${!isLastPart ? '- NÃO conclua ainda - deixe um gancho para a continuação' : ''}

📏 ESPECIFICAÇÕES DESTA PARTE:
- Duração desta parte: ~${partMinutes} minutos (~${partWords} palavras)
` : `
📏 ESPECIFICAÇÕES DE DURAÇÃO:
- Duração MÍNIMA OBRIGATÓRIA: ${minDuration} minutos
- Duração ALVO: ${targetDuration} minutos (~${estimatedWords} palavras)
- Duração MÁXIMA PERMITIDA: ${maxDuration} minutos
- Palavras por minuto de narração: ${wordsPerMinute}
`}

⚠️ REGRA DE OURO: O roteiro NUNCA pode ter menos que o mínimo. É MELHOR passar um pouco do que faltar conteúdo!

- Idioma: ${language === "pt-BR" ? "Português (Brasil)" : language === "en-US" ? "English (US)" : "Español"}
${isFirstPart && ctaInicio ? '- Incluir CTA no início' : ''}
${numParts === 1 && ctaMeio ? '- Incluir CTA no meio' : ''}
${isLastPart && ctaFinal ? '- Incluir CTA no final' : ''}

${additionalContext ? `CONTEXTO ADICIONAL:\n${additionalContext}` : ""}

${!isFirstPart && fullScript ? `TEXTO ANTERIOR (para manter continuidade):\n...${fullScript.slice(-500)}` : ''}

Gere o roteiro seguindo a estrutura e fórmula do agente, otimizado para engajamento viral.
        `.trim();

        const { data, error } = await supabase.functions.invoke("ai-assistant", {
          body: {
            type: "generate_script_with_formula",
            prompt: partPrompt,
            model: aiModel,
            duration: partMinutes,
            minDuration: partMinutes,
            maxDuration: partMinutes + 1,
            language,
            userId: user.id,
            agentData: {
              name: agent.name,
              niche: agent.niche,
              sub_niche: agent.sub_niche,
              based_on_title: agent.based_on_title,
              formula: agent.formula,
              formula_structure: agent.formula_structure,
              mental_triggers: agent.mental_triggers,
              preferredModel: aiModel,
            },
          },
        });

        if (error) {
          console.error(`[GenerateScript] Error part ${partIndex + 1}:`, error);
          throw error;
        }

        if (data?.error) {
          toast.error(data.error);
          return;
        }

        const partContent = typeof data?.result === 'string' ? data.result : JSON.stringify(data?.result, null, 2);
        fullScript += (fullScript ? "\n\n" : "") + partContent;
        totalCreditsUsed += data?.creditsUsed || 0;

        // Toast de progresso para cada parte
        if (numParts > 1) {
          toast.success(`Parte ${partIndex + 1}/${numParts} concluída`);
        }
      }

      setProgress(90);
      setGeneratedScript(fullScript);

      // Salvar roteiro na tabela generated_scripts
      const { error: saveError } = await supabase
        .from('generated_scripts')
        .insert({
          user_id: user.id,
          agent_id: agent.id,
          title: videoTitle,
          content: fullScript,
          duration: targetDuration,
          language,
          model_used: aiModel,
          credits_used: totalCreditsUsed || estimatedCredits
        });

      if (saveError) {
        console.error("[GenerateScript] Error saving script:", saveError);
      }

      // Update agent usage count
      await supabase
        .from("script_agents")
        .update({ 
          times_used: (agent.times_used || 0) + 1,
          updated_at: new Date().toISOString()
        })
        .eq("id", agent.id);

      await logActivity({
        action: 'script_generated',
        description: `Roteiro "${videoTitle}" (${targetDuration} min) gerado com ${agent.name}`,
      });

      setProgress(100);
      toast.success(`Roteiro completo gerado! (${totalCreditsUsed || estimatedCredits} créditos)`);
      
    } catch (error) {
      console.error("[GenerateScript] Error generating script:", error);
      // Reembolsar créditos em caso de erro
      if (deductResult.shouldRefund) {
        await deductResult.refund();
      }
      toast.error("Erro ao gerar roteiro. Tente novamente.");
    } finally {
      setGenerating(false);
      setCurrentPart(0);
      setTotalParts(0);
      setProgress(0);
    }
  };

  // Função para limpar marcações de partes do roteiro
  const cleanScriptForCopy = (script: string): string => {
    return script
      // Remove linhas de título com # (ex: # TÍTULO DO VÍDEO)
      .replace(/^#+ .+$/gm, '')
      // Remove marcações de partes (ex: ## PARTE 1 - HOOK, PARTE 2:, etc)
      .replace(/^##?\s*(PARTE|PART|Part)\s*\d+.*$/gim, '')
      // Remove marcações de tempo entre colchetes (ex: [00:00 - 00:30])
      .replace(/\[\d{1,2}:\d{2}\s*[-–]\s*\d{1,2}:\d{2}\]/g, '')
      // Remove instruções entre colchetes (ex: [PAUSA], [Instruções])
      .replace(/\[.*?\]/g, '')
      // Remove linhas com --- (separadores)
      .replace(/^-{3,}$/gm, '')
      // Remove múltiplas linhas em branco consecutivas
      .replace(/\n{3,}/g, '\n\n')
      // Remove espaços extras no início e fim
      .trim();
  };

  const handleCopyScript = async () => {
    if (generatedScript) {
      const cleanScript = cleanScriptForCopy(generatedScript);
      await navigator.clipboard.writeText(cleanScript);
      toast.success("Roteiro copiado (sem marcações)!");
    }
  };

  const handleClose = () => {
    setGeneratedScript(null);
    onOpenChange(false);
  };

  // Loading messages for professional experience
  const loadingMessages = [
    "Analisando título e nicho",
    "Aplicando fórmula viral do agente",
    "Estruturando narrativa com gatilhos mentais",
    "Desenvolvendo hook poderoso",
    "Criando conteúdo otimizado para engajamento",
    "Finalizando roteiro"
  ];
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);

  // Rotate loading messages
  useEffect(() => {
    if (generating) {
      setLoadingMessageIndex(0);
      const interval = setInterval(() => {
        setLoadingMessageIndex(prev => (prev + 1) % loadingMessages.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [generating]);

  if (!agent) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto bg-card border-primary/30">
        {/* Loading Overlay - PADRONIZADO */}
        {generating && (
          <div className="absolute inset-0 bg-background/98 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-lg p-8">
            {/* Logo com efeito de pulso - PADRONIZADO w-24 */}
            <div className="relative w-24 h-24 mb-6">
              <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping" />
              <div className="absolute inset-0 bg-primary/10 rounded-full animate-pulse" />
              <div className="relative w-24 h-24 rounded-full border-2 border-primary/50 overflow-hidden">
                <img 
                  src={logoGif} 
                  alt="Logo" 
                  className="w-full h-full object-cover scale-110"
                />
              </div>
            </div>
            
            <h3 className="text-lg font-bold text-foreground mb-1">Gerando Roteiro</h3>
            
            <p className="text-sm text-muted-foreground mb-4 text-center">
              {loadingMessages[loadingMessageIndex]}...
            </p>

            {/* Indicador de partes */}
            {totalParts > 1 && (
              <div className="flex items-center gap-2 mb-4">
                {Array.from({ length: totalParts }, (_, i) => (
                  <div
                    key={i}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 ${
                      i < currentPart
                        ? "bg-primary text-primary-foreground"
                        : i === currentPart - 1
                        ? "bg-primary/80 text-primary-foreground animate-pulse"
                        : "bg-muted-foreground/20 text-muted-foreground"
                    }`}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            )}
            
            {/* Barra de progresso */}
            <div className="w-full space-y-2">
              <Progress value={progress} className="h-1.5 bg-secondary" />
              <p className="text-xs text-center text-muted-foreground">
                {progress}%
              </p>
            </div>
          </div>
        )}

        <DialogHeader className="pb-4 border-b border-border">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-foreground">
              {generatedScript ? "Roteiro Gerado" : "Gerar Roteiro com Agente"}
            </DialogTitle>
            <Badge className="bg-primary/20 text-primary border-primary/30 text-sm px-3 py-1.5">
              <Zap className="w-4 h-4 mr-1.5" />
              Custo estimado: {estimatedCredits} créditos
            </Badge>
          </div>
        </DialogHeader>

        {generatedScript ? (
          // Exibir roteiro gerado
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">{videoTitle}</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyScript}
                className="gap-2"
              >
                <Copy className="w-4 h-4" />
                Copiar Roteiro
              </Button>
            </div>
            
            <ScrollArea className="h-[400px] w-full rounded-lg border border-border bg-secondary/30 p-4">
              <pre className="text-sm text-foreground whitespace-pre-wrap font-mono">
                {generatedScript}
              </pre>
            </ScrollArea>

            <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 h-11 text-sm"
              >
                Fechar
              </Button>
              <Button
                onClick={() => setGeneratedScript(null)}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-11 text-sm"
              >
                Gerar Outro Roteiro
              </Button>
            </div>
          </div>
        ) : (
          // Formulário de geração
          <>
            <div className="space-y-5 py-4">
              {/* Agent Name (read-only) */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">
                  Agente <span className="text-primary">*</span>
                </Label>
                <Input
                  value={agent.name}
                  readOnly
                  className="bg-secondary/50 border-border h-11 text-sm opacity-80 cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Agente selecionado para gerar o roteiro
                </p>
              </div>

              {/* Video Title */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">
                  Título do Vídeo <span className="text-primary">*</span>
                </Label>
                <Input
                  placeholder="Cole aqui o título do vídeo para o qual deseja gerar o roteiro..."
                  value={videoTitle}
                  onChange={(e) => setVideoTitle(e.target.value)}
                  className="bg-secondary/50 border-border h-11 text-sm placeholder:text-muted-foreground/60"
                />
                <p className="text-xs text-muted-foreground">
                  O agente irá analisar o título e gerar um roteiro completo seguindo a estrutura do vídeo viral original.
                </p>
              </div>

              {/* Duration, Parts, Language - 3 columns */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">
                    Duração (min) <span className="text-primary">*</span>
                  </Label>
                  <Input
                    type="number"
                    min="1"
                    max="15"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="bg-secondary/50 border-border h-11 text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Alvo: ~{estimatedWords.toLocaleString()} palavras ({targetDuration} min)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">
                    Partes (Automático)
                  </Label>
                  <Input
                    value={estimatedParts}
                    readOnly
                    className="bg-secondary/50 border-border h-11 text-sm opacity-80 cursor-not-allowed"
                  />
                  <p className="text-xs text-muted-foreground">
                    ~{Math.ceil(targetDuration / estimatedParts)} min/parte
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-foreground">
                    Idioma do Roteiro <span className="text-primary">*</span>
                  </Label>
                  <Select value={language} onValueChange={setLanguage}>
                    <SelectTrigger className="bg-secondary/50 border-border h-11 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="z-[200] bg-popover" position="popper" sideOffset={4}>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* CTA Options Section */}
              <div className="bg-secondary/30 p-4 rounded-lg border border-border">
                <Label className="text-sm font-semibold text-foreground mb-3 block">
                  Call to Action (CTA) – Onde incluir?
                </Label>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="cta-inicio"
                      checked={ctaInicio}
                      onCheckedChange={(checked) => setCtaInicio(checked === true)}
                      className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label htmlFor="cta-inicio" className="text-sm cursor-pointer text-foreground">
                      CTA no Início (primeiros 30 segundos)
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="cta-meio"
                      checked={ctaMeio}
                      onCheckedChange={(checked) => setCtaMeio(checked === true)}
                      className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label htmlFor="cta-meio" className="text-sm cursor-pointer text-foreground">
                      CTA no Meio (aproximadamente na metade do vídeo)
                    </label>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="cta-final"
                      checked={ctaFinal}
                      onCheckedChange={(checked) => setCtaFinal(checked === true)}
                      className="border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label htmlFor="cta-final" className="text-sm cursor-pointer text-foreground">
                      CTA no Final (últimos 30 segundos)
                    </label>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-3">
                  Marque onde deseja incluir chamadas para ação (like, subscribe, comentar, etc.)
                </p>
              </div>

              {/* AI Model Selection */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">
                  Modelo de IA
                </Label>
                <Select value={aiModel} onValueChange={setAiModel}>
                  <SelectTrigger className="bg-secondary/50 border-primary/50 h-11 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[200] bg-popover" position="popper" sideOffset={4}>
                    <SelectItem value="gpt-4.1">
                      <span className="flex items-center gap-2">
                        GPT-4.1
                        <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                        <span className="text-xs text-primary font-medium">Recomendado</span>
                      </span>
                    </SelectItem>
                    <SelectItem value="claude-sonnet-4-20250514">Claude 4 Sonnet</SelectItem>
                    <SelectItem value="gemini-2.5-pro">Gemini 2.5 Pro</SelectItem>
                    <SelectItem value="deepseek-r1">DeepSeek R1</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Context */}
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-foreground">
                  Contexto Adicional
                </Label>
                <Textarea
                  placeholder="Opcional: Use apenas se quiser fornecer contexto adicional além do título."
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  className="bg-secondary/50 border-border min-h-[80px] text-sm resize-none placeholder:text-muted-foreground/60"
                />
              </div>
            </div>

            {/* Alerta de créditos insuficientes - só mostra se usa créditos da plataforma */}
            {insufficientCredits && usePlatformCredits !== false && (
              <div className="flex items-center gap-3 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-destructive">Créditos insuficientes</p>
                  <p className="text-xs text-muted-foreground">
                    Necessário: {estimatedCredits} créditos | Disponível: {Math.ceil(currentBalance)} créditos
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/plans')}
                  className="border-destructive/50 text-destructive hover:bg-destructive/10"
                >
                  Comprar Créditos
                </Button>
              </div>
            )}
            
            {/* Indicador de API própria */}
            {usePlatformCredits === false && (
              <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <Zap className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-primary">Usando sua API</p>
                  <p className="text-xs text-muted-foreground">
                    Sem consumo de créditos da plataforma
                  </p>
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={handleClose}
                className="flex-1 h-11 text-sm border-border hover:bg-secondary"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleGenerateScript}
                disabled={generating || !videoTitle.trim() || (insufficientCredits && usePlatformCredits !== false)}
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-11 text-sm font-semibold"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Gerando Roteiro...
                  </>
                ) : (
                  "Gerar Roteiro"
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
