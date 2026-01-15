import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Wrench, Clock, ArrowLeft, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MaintenanceModalProps {
  isOpen: boolean;
  toolName: string;
  message?: string;
  estimatedEndTime?: string;
}

export const MaintenanceModal = ({
  isOpen,
  toolName,
  message,
  estimatedEndTime
}: MaintenanceModalProps) => {
  const navigate = useNavigate();

  const formattedTime = estimatedEndTime 
    ? format(new Date(estimatedEndTime), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={() => navigate('/dashboard')}>
      <DialogContent className="sm:max-w-md border-primary/50 bg-card rounded-xl shadow-xl">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 animate-pulse">
            <Wrench className="w-8 h-8 text-primary" />
          </div>
          <DialogTitle className="text-xl font-bold text-foreground text-center">
            Ferramenta em Manutenção
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-center gap-2 text-amber-500 bg-amber-500/10 py-2 px-4 rounded-lg">
            <AlertTriangle className="w-4 h-4" />
            <span className="font-medium text-sm">{toolName}</span>
          </div>

          <p className="text-center text-muted-foreground">
            {message || "Estamos trabalhando para melhorar esta ferramenta. Em breve estará disponível novamente!"}
          </p>

          {formattedTime && (
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground bg-secondary/30 py-2 px-4 rounded-lg">
              <Clock className="w-4 h-4" />
              <span>Previsão de retorno: <strong className="text-foreground">{formattedTime}</strong></span>
            </div>
          )}

          <div className="bg-secondary/20 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">
              💡 Enquanto isso, você pode explorar outras ferramentas da plataforma.
            </p>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          <Button
            className="flex-1"
            onClick={() => navigate('/dashboard')}
          >
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
