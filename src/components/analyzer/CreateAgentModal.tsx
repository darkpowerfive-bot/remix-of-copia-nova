import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Loader2, Check, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface ScriptFormulaAnalysis {
  motivoSucesso: string;
  formula: string;
  formulaReplicavel?: string;
  estrutura: {
    hook: string;
    desenvolvimento: string;
    climax: string;
    cta: string;
    transicoes?: string;
  };
  tempoTotal: string;
  gatilhosMentais: string[];
  exemplosDeAplicacao?: {
    fraserChave?: string[];
    estruturaDeFrases?: string;
    transicoesUsadas?: string[];
  };
  instrucoesParaAgente?: string;
}

interface CreateAgentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formula: ScriptFormulaAnalysis | null;
  videoTitle: string;
  niche: string;
  subNiche: string;
}

// Gera memória humanizada baseada nos dados da análise
function generateHumanizedMemory(
  formula: ScriptFormulaAnalysis | null,
  videoTitle: string,
  niche: string,
  subNiche: string
): string {
  if (!formula) return "";
  
  const parts = [];
  
  // Contexto inicial
  parts.push(`Sou um especialista em criar roteiros virais no nicho de ${niche}${subNiche ? `, especificamente sobre ${subNiche}` : ''}.`);
  
  // O que aprendi
  if (videoTitle) {
    parts.push(`Minha metodologia foi desenvolvida a partir da análise profunda do vídeo viral "${videoTitle}", onde identifiquei os padrões exatos que geram engajamento massivo.`);
  }
  
  // Meu diferencial
  if (formula.motivoSucesso) {
    const resumo = formula.motivoSucesso.split('.').slice(0, 2).join('.') + '.';
    parts.push(`O que descobri: ${resumo}`);
  }
  
  // Minha especialidade
  parts.push(`Minha especialidade é transformar qualquer tema em conteúdo envolvente usando técnicas comprovadas de retenção e gatilhos psicológicos.`);
  
  return parts.join('\n\n');
}

// Gera instruções humanizadas e completas
function generateHumanizedInstructions(
  formula: ScriptFormulaAnalysis | null,
  niche: string
): string {
  if (!formula) return "";
  
  const parts = [];
  
  // Introdução
  parts.push(`Como criar roteiros virais seguindo minha metodologia:`);
  
  // Estrutura base
  if (formula.estrutura) {
    parts.push(`\n📌 ESTRUTURA DO ROTEIRO:`);
    if (formula.estrutura.hook) {
      parts.push(`• Abertura: ${formula.estrutura.hook}`);
    }
    if (formula.estrutura.desenvolvimento) {
      parts.push(`• Desenvolvimento: ${formula.estrutura.desenvolvimento}`);
    }
    if (formula.estrutura.climax) {
      parts.push(`• Clímax: ${formula.estrutura.climax}`);
    }
    if (formula.estrutura.cta) {
      parts.push(`• Encerramento: ${formula.estrutura.cta}`);
    }
    if (formula.estrutura.transicoes) {
      parts.push(`• Transições: ${formula.estrutura.transicoes}`);
    }
  }
  
  // Fórmula replicável
  if (formula.formulaReplicavel) {
    parts.push(`\n📐 PASSO-A-PASSO:`);
    parts.push(formula.formulaReplicavel);
  }
  
  // Tom e estilo
  parts.push(`\n🎯 TOM E ESTILO:`);
  parts.push(`• Escreva como se estivesse contando uma história fascinante para um amigo`);
  parts.push(`• Use linguagem natural e envolvente, evitando parecer robótico`);
  parts.push(`• Mantenha o ritmo dinâmico com frases de tamanhos variados`);
  parts.push(`• Inclua pausas dramáticas naturais através de parágrafos curtos`);
  
  // Gatilhos a usar
  if (formula.gatilhosMentais && formula.gatilhosMentais.length > 0) {
    parts.push(`\n🧠 GATILHOS PSICOLÓGICOS A APLICAR:`);
    formula.gatilhosMentais.forEach((trigger, i) => {
      parts.push(`${i + 1}. ${trigger}`);
    });
  }
  
  // Exemplos
  if (formula.exemplosDeAplicacao?.fraserChave?.length) {
    parts.push(`\n💬 TEMPLATES DE FRASES QUE FUNCIONAM:`);
    formula.exemplosDeAplicacao.fraserChave.forEach(frase => {
      parts.push(`• "${frase}"`);
    });
  }
  
  // Regras finais
  parts.push(`\n⚠️ REGRAS IMPORTANTES:`);
  parts.push(`• Nunca use perguntas retóricas em excesso`);
  parts.push(`• Mantenha progressão factual contínua`);
  parts.push(`• Evite clichês e frases genéricas`);
  parts.push(`• Cada frase deve ter propósito e valor`);
  
  // Instruções originais da IA
  if (formula.instrucoesParaAgente) {
    parts.push(`\n📋 DIRETRIZES ESPECÍFICAS:`);
    parts.push(formula.instrucoesParaAgente);
  }
  
  return parts.join('\n');
}

export const CreateAgentModal = ({
  open,
  onOpenChange,
  formula,
  videoTitle,
  niche,
  subNiche,
}: CreateAgentModalProps) => {
  const [agentName, setAgentName] = useState("");
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSaveAgent = async () => {
    if (!agentName.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira um nome para o agente",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado para criar um agente",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      // Gerar memória e instruções humanizadas
      const generatedMemory = generateHumanizedMemory(formula, videoTitle, niche, subNiche);
      const generatedInstructions = generateHumanizedInstructions(formula, niche);
      
      // Construir formula_structure com todas as informações necessárias para replicar
      const formulaStructure = formula ? {
        ...formula.estrutura,
        motivoSucesso: formula.motivoSucesso,
        formulaReplicavel: formula.formulaReplicavel,
        exemplosDeAplicacao: formula.exemplosDeAplicacao,
        instrucoesParaAgente: formula.instrucoesParaAgente,
        tempoTotal: formula.tempoTotal,
        // Adicionar memória e instruções geradas na estrutura também
        memory: generatedMemory,
        instructions: generatedInstructions,
      } : null;

      const { error } = await supabase.from("script_agents").insert({
        user_id: user.id,
        name: agentName.trim(),
        niche: niche || null,
        sub_niche: subNiche || null,
        based_on_title: videoTitle || null,
        formula: formula?.formula || null,
        formula_structure: formulaStructure,
        mental_triggers: formula?.gatilhosMentais || null,
        // Salvar memória e instruções nos campos dedicados
        memory: generatedMemory,
        instructions: generatedInstructions,
        times_used: 0,
      });

      if (error) throw error;

      toast({
        title: "Agente criado com sucesso!",
        description: "Memória e instruções foram geradas automaticamente.",
      });

      onOpenChange(false);
      setAgentName("");
      
      // Navigate to the viral library agents tab
      setTimeout(() => {
        navigate("/library?tab=agents");
      }, 500);
    } catch (error) {
      console.error("Error saving agent:", error);
      toast({
        title: "Erro ao salvar agente",
        description: "Tente novamente mais tarde",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Preview das instruções geradas
  const previewMemory = generateHumanizedMemory(formula, videoTitle, niche, subNiche);
  const previewInstructions = generateHumanizedInstructions(formula, niche);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl flex items-center gap-2">
            <Bot className="w-6 h-6 text-primary" />
            Criar Agente de Roteiro
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4 py-2">
            {/* Agent Name */}
            <div>
              <Label className="text-sm font-semibold">Nome do Agente *</Label>
              <Input
                placeholder="Ex: Agente História Mistérios"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                className="mt-1.5 bg-secondary border-border h-10"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Escolha um nome descritivo para identificar este agente
              </p>
            </div>

            {/* Detected Info - Compact */}
            <div className="bg-secondary/50 p-4 rounded-lg space-y-3">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-success" />
                <span className="font-medium text-sm">Informações Detectadas</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Nicho:</span>{" "}
                  <span className="font-medium">{niche || "N/A"}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Sub-nicho:</span>{" "}
                  <span className="font-medium">{subNiche || "N/A"}</span>
                </div>
              </div>

              {videoTitle && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Baseado em:</span>{" "}
                  <span className="font-medium line-clamp-1">{videoTitle}</span>
                </div>
              )}

              {formula?.formula && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Fórmula:</span>
                  <code className="block mt-1 text-xs bg-primary/20 text-primary px-2 py-1.5 rounded break-words">
                    {formula.formula}
                  </code>
                </div>
              )}
            </div>

            {/* Generated Memory Preview */}
            {previewMemory && (
              <div className="bg-card border border-border p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Memória Gerada Automaticamente</span>
                </div>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-4">
                  {previewMemory}
                </p>
              </div>
            )}

            {/* Generated Instructions Preview */}
            {previewInstructions && (
              <div className="bg-card border border-border p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">Instruções Geradas Automaticamente</span>
                </div>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-6">
                  {previewInstructions}
                </p>
              </div>
            )}

            {/* Triggers summary */}
            {formula?.gatilhosMentais && formula.gatilhosMentais.length > 0 && (
              <div className="bg-secondary/30 p-3 rounded-lg">
                <span className="text-xs text-muted-foreground">
                  {formula.gatilhosMentais.length} gatilhos mentais serão salvos
                </span>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Buttons */}
        <div className="flex gap-3 pt-4 border-t border-border flex-shrink-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-10"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveAgent}
            disabled={saving || !agentName.trim()}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-10"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Bot className="w-4 h-4 mr-2" />
                Criar Agente
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
