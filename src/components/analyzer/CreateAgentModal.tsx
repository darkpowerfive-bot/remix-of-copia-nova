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
import { Bot, Loader2, Check } from "lucide-react";
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
      // Construir formula_structure com todas as informações necessárias para replicar
      const formulaStructure = formula ? {
        ...formula.estrutura,
        motivoSucesso: formula.motivoSucesso,
        formulaReplicavel: formula.formulaReplicavel,
        exemplosDeAplicacao: formula.exemplosDeAplicacao,
        instrucoesParaAgente: formula.instrucoesParaAgente,
        tempoTotal: formula.tempoTotal,
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
        times_used: 0,
      });

      if (error) throw error;

      toast({
        title: "Agente criado com sucesso!",
        description: "Redirecionando para a biblioteca de agentes...",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            <Bot className="w-7 h-7 text-primary" />
            Criar Agente de Roteiro
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Agent Name */}
          <div>
            <Label className="text-base font-semibold">Nome do Agente *</Label>
            <Input
              placeholder="Ex: Agente História Mistérios"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              className="mt-2 bg-secondary border-border h-12 text-base"
            />
            <p className="text-sm text-muted-foreground mt-2">
              Escolha um nome descritivo para identificar este agente
            </p>
          </div>

          {/* Detected Info - Read Only */}
          <div className="bg-secondary/50 p-5 rounded-xl space-y-4">
            <div className="flex items-center gap-3">
              <Check className="w-5 h-5 text-success" />
              <span className="font-semibold text-foreground text-base">Informações Detectadas</span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm text-muted-foreground">Nicho</Label>
                <p className="font-medium text-foreground text-base mt-1">{niche || "Não detectado"}</p>
              </div>
              <div>
                <Label className="text-sm text-muted-foreground">Sub-nicho</Label>
                <p className="font-medium text-foreground text-base mt-1">{subNiche || "Não detectado"}</p>
              </div>
            </div>

            {videoTitle && (
              <div>
                <Label className="text-sm text-muted-foreground">Baseado em</Label>
                <p className="font-medium text-foreground text-base mt-1 line-clamp-2">{videoTitle}</p>
              </div>
            )}

            {formula?.formula && (
              <div>
                <Label className="text-sm text-muted-foreground">Fórmula</Label>
                <code className="block mt-1 text-sm bg-primary/20 text-primary px-3 py-2 rounded-lg">
                  {formula.formula}
                </code>
              </div>
            )}
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex gap-4 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 h-12 text-base"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSaveAgent}
            disabled={saving || !agentName.trim()}
            className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-12 text-base"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Bot className="w-5 h-5 mr-2" />
                Criar Agente
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
