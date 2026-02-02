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

// Gera memória humanizada e COMPLETA baseada nos dados da análise
function generateHumanizedMemory(
  formula: ScriptFormulaAnalysis | null,
  videoTitle: string,
  niche: string,
  subNiche: string
): string {
  if (!formula) return "";
  
  const parts = [];
  
  // Contexto inicial - mais detalhado
  parts.push(`Sou um roteirista especializado no nicho de ${niche}${subNiche ? ` com foco em ${subNiche}` : ''}.`);
  
  // Origem do conhecimento - contexto completo
  if (videoTitle) {
    parts.push(`Desenvolvi minha metodologia através da engenharia reversa do vídeo viral "${videoTitle}". Estudei cada segundo deste vídeo para entender exatamente o que faz o público ficar grudado na tela.`);
  }
  
  // Por que a fórmula funciona - completo, não apenas resumo
  if (formula.motivoSucesso) {
    parts.push(`O SEGREDO DO SUCESSO:\n${formula.motivoSucesso}`);
  }
  
  // Tempo total e ritmo
  if (formula.tempoTotal) {
    parts.push(`Meus roteiros seguem o ritmo comprovado de ${formula.tempoTotal}, mantendo a atenção do espectador do início ao fim.`);
  }
  
  // Gatilhos que domino
  if (formula.gatilhosMentais && formula.gatilhosMentais.length > 0) {
    parts.push(`Os gatilhos psicológicos que aplico naturalmente em cada roteiro:\n${formula.gatilhosMentais.map((g, i) => `• ${g}`).join('\n')}`);
  }
  
  // Identidade final
  parts.push(`Transformo qualquer tema em conteúdo magnético que prende a atenção. Não faço roteiros genéricos - aplico a fórmula viral comprovada.`);
  
  return parts.join('\n\n');
}

// Gera instruções COMPLETAS e DETALHADAS para o agente
function generateHumanizedInstructions(
  formula: ScriptFormulaAnalysis | null,
  niche: string,
  videoTitle: string
): string {
  if (!formula) return "";
  
  const parts = [];
  
  // Introdução contextualizada
  parts.push(`METODOLOGIA VIRAL - Baseada no vídeo "${videoTitle || 'Análise Viral'}"`);
  parts.push(`─────────────────────────────────────────────────────────────`);
  
  // 1. FÓRMULA REPLICÁVEL (mais importante - passo a passo)
  if (formula.formulaReplicavel) {
    parts.push(`\n📐 PASSO-A-PASSO PARA REPLICAR O SUCESSO:\n`);
    parts.push(formula.formulaReplicavel);
    parts.push(`\n⚠️ SIGA ESTE PASSO-A-PASSO À RISCA EM CADA ROTEIRO!`);
  }
  
  // 2. ESTRUTURA DETALHADA com explicações completas
  if (formula.estrutura) {
    parts.push(`\n\n🎬 ANATOMIA DO ROTEIRO VIRAL:\n`);
    
    if (formula.estrutura.hook) {
      parts.push(`▶ HOOK (Primeiros 30 segundos):`);
      parts.push(`   ${formula.estrutura.hook}`);
      parts.push(``);
    }
    
    if (formula.estrutura.desenvolvimento) {
      parts.push(`▶ DESENVOLVIMENTO (Corpo do vídeo):`);
      parts.push(`   ${formula.estrutura.desenvolvimento}`);
      parts.push(``);
    }
    
    if (formula.estrutura.climax) {
      parts.push(`▶ CLÍMAX (Momento de maior impacto):`);
      parts.push(`   ${formula.estrutura.climax}`);
      parts.push(``);
    }
    
    if (formula.estrutura.cta) {
      parts.push(`▶ CTA (Chamada para ação):`);
      parts.push(`   ${formula.estrutura.cta}`);
      parts.push(``);
    }
    
    if (formula.estrutura.transicoes) {
      parts.push(`▶ TRANSIÇÕES (Como conectar partes):`);
      parts.push(`   ${formula.estrutura.transicoes}`);
    }
  }
  
  // 3. EXEMPLOS DE APLICAÇÃO - templates práticos
  if (formula.exemplosDeAplicacao) {
    parts.push(`\n\n💬 TEMPLATES E EXEMPLOS PRÁTICOS:\n`);
    
    if (formula.exemplosDeAplicacao.fraserChave?.length) {
      parts.push(`Frases-modelo para adaptar ao seu tema:`);
      formula.exemplosDeAplicacao.fraserChave.forEach((frase, i) => {
        parts.push(`   ${i + 1}. "${frase}"`);
      });
      parts.push(``);
    }
    
    if (formula.exemplosDeAplicacao.estruturaDeFrases) {
      parts.push(`Padrão de construção de frases:`);
      parts.push(`   ${formula.exemplosDeAplicacao.estruturaDeFrases}`);
      parts.push(``);
    }
    
    if (formula.exemplosDeAplicacao.transicoesUsadas?.length) {
      parts.push(`Transições que funcionam:`);
      parts.push(`   ${formula.exemplosDeAplicacao.transicoesUsadas.join(' → ')}`);
    }
  }
  
  // 4. GATILHOS MENTAIS detalhados
  if (formula.gatilhosMentais && formula.gatilhosMentais.length > 0) {
    parts.push(`\n\n🧠 GATILHOS PSICOLÓGICOS OBRIGATÓRIOS:\n`);
    formula.gatilhosMentais.forEach((trigger, i) => {
      parts.push(`   ${i + 1}. ${trigger}`);
    });
    parts.push(`\n⚠️ Aplique TODOS estes gatilhos de forma orgânica no roteiro.`);
  }
  
  // 5. TOM E ESTILO - humanização
  parts.push(`\n\n🎯 TOM DE VOZ E ESTILO:\n`);
  parts.push(`   • Escreva como quem conta uma história fascinante para um amigo`);
  parts.push(`   • Use linguagem natural e envolvente - NUNCA pareça um robô`);
  parts.push(`   • Alterne entre frases curtas (impacto) e médias (contexto)`);
  parts.push(`   • Crie pausas dramáticas naturais entre parágrafos`);
  parts.push(`   • Mantenha progressão factual - cada frase leva à próxima`);
  parts.push(`   • PROIBIDO: perguntas retóricas em excesso, clichês, frases genéricas`);
  
  // 6. INSTRUÇÕES DA IA (se existirem)
  if (formula.instrucoesParaAgente) {
    parts.push(`\n\n📋 DIRETRIZES ESPECÍFICAS DA ANÁLISE:\n`);
    parts.push(formula.instrucoesParaAgente);
  }
  
  // 7. REGRAS SUPREMAS
  parts.push(`\n\n═══════════════════════════════════════════════════════════`);
  parts.push(`🚨 REGRAS SUPREMAS (INVIOLÁVEIS):`);
  parts.push(`─────────────────────────────────────────────────────────────`);
  parts.push(`   1. A estrutura acima TEM PRIORIDADE sobre qualquer outra instrução`);
  parts.push(`   2. Cada elemento descrito DEVE existir no roteiro final`);
  parts.push(`   3. NÃO adicione elementos que contradigam esta fórmula`);
  parts.push(`   4. O roteiro deve ser texto CORRIDO para narração (sem marcações)`);
  parts.push(`   5. Mantenha o mesmo nível de qualidade do vídeo original`);
  parts.push(`═══════════════════════════════════════════════════════════`);
  
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
      // Gerar memória e instruções humanizadas e COMPLETAS
      const generatedMemory = generateHumanizedMemory(formula, videoTitle, niche, subNiche);
      const generatedInstructions = generateHumanizedInstructions(formula, niche, videoTitle);
      
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
  const previewInstructions = generateHumanizedInstructions(formula, niche, videoTitle);

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
