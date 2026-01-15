import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Tags, Copy } from "lucide-react";

interface ChannelNicheEditorProps {
  isOpen: boolean;
  onClose: () => void;
  channelId: string;
  channelName: string;
  currentNiche?: string | null;
  currentSubniche?: string | null;
  currentMicronicho?: string | null;
}

export const ChannelNicheEditor = ({
  isOpen,
  onClose,
  channelId,
  channelName,
  currentNiche,
  currentSubniche,
  currentMicronicho,
}: ChannelNicheEditorProps) => {
  const [niche, setNiche] = useState(currentNiche || "");
  const [subniche, setSubniche] = useState(currentSubniche || "");
  const [micronicho, setMicronicho] = useState(currentMicronicho || "");
  const [saving, setSaving] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("monitored_channels")
        .update({
          niche: niche.trim() || null,
          subniche: subniche.trim() || null,
          micronicho: micronicho.trim() || null,
        })
        .eq("id", channelId);

      if (error) throw error;

      toast({
        title: "Nicho salvo!",
        description: "As informações do canal foram atualizadas",
      });
      
      queryClient.invalidateQueries({ queryKey: ["monitored-channels"] });
      onClose();
    } catch (error) {
      console.error("Error saving niche:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o nicho",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: `${label} copiado!`,
      description: text,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tags className="w-5 h-5 text-primary" />
            Definir Nicho - {channelName}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Niche */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-destructive" />
              Nicho
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: História, Finanças, Tecnologia..."
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="bg-secondary border-border"
              />
              {niche && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(niche, "Nicho")}
                  className="shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Subniche */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary" />
              Subnicho
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Civilizações Antigas, Investimentos..."
                value={subniche}
                onChange={(e) => setSubniche(e.target.value)}
                className="bg-secondary border-border"
              />
              {subniche && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(subniche, "Subnicho")}
                  className="shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Micronicho */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-muted-foreground" />
              Micro-nicho
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: Império Asteca, Day Trade..."
                value={micronicho}
                onChange={(e) => setMicronicho(e.target.value)}
                className="bg-secondary border-border"
              />
              {micronicho && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => copyToClipboard(micronicho, "Micro-nicho")}
                  className="shrink-0"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Defina o nicho do canal para organizar melhor seus canais monitorados 
            e facilitar a busca de vídeos virais do mesmo segmento.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
