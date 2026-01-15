import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageSquare, Clock, Shield, AlertTriangle, Moon, CheckCircle2 } from "lucide-react";

export type WhatsAppLimitType = 
  | "daily_limit" 
  | "hourly_limit" 
  | "quiet_hours" 
  | "success";

interface WhatsAppLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: WhatsAppLimitType;
  details?: {
    limit?: number;
    remaining?: number;
    nextAvailable?: string;
    sentCount?: number;
  };
}

const LIMIT_MESSAGES: Record<WhatsAppLimitType, {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  bgColor: string;
}> = {
  daily_limit: {
    icon: <Shield className="w-8 h-8" />,
    title: "Limite Diário Atingido",
    description: "Para proteger seu número de bloqueios, limitamos o envio de mensagens. Seu limite será resetado amanhã às 00:00.",
    color: "text-amber-500",
    bgColor: "bg-amber-500/20",
  },
  hourly_limit: {
    icon: <Clock className="w-8 h-8" />,
    title: "Limite por Hora Atingido",
    description: "Muitas mensagens foram enviadas nesta hora. Aguarde alguns minutos para continuar enviando alertas.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/20",
  },
  quiet_hours: {
    icon: <Moon className="w-8 h-8" />,
    title: "Horário de Silêncio",
    description: "Para evitar bloqueios, não enviamos mensagens entre 22h e 7h. Os alertas serão enviados quando o horário permitir.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/20",
  },
  success: {
    icon: <CheckCircle2 className="w-8 h-8" />,
    title: "Mensagens Enviadas!",
    description: "Seus alertas de vídeos virais foram enviados com sucesso via WhatsApp.",
    color: "text-green-500",
    bgColor: "bg-green-500/20",
  },
};

export const WhatsAppLimitModal = ({
  isOpen,
  onClose,
  type,
  details,
}: WhatsAppLimitModalProps) => {
  const config = LIMIT_MESSAGES[type];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md border-primary/50 bg-card rounded-xl shadow-xl">
        <DialogHeader className="text-center pb-2">
          <div className={`mx-auto w-16 h-16 ${config.bgColor} rounded-full flex items-center justify-center mb-4`}>
            <span className={config.color}>{config.icon}</span>
          </div>
          <DialogTitle className="text-xl font-bold text-foreground text-center">
            {config.title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className={`flex items-center justify-center gap-2 ${config.color} ${config.bgColor} py-2 px-4 rounded-lg`}>
            <MessageSquare className="w-4 h-4" />
            <span className="font-medium text-sm">Sistema de Proteção WhatsApp</span>
          </div>

          <p className="text-center text-muted-foreground">
            {config.description}
          </p>

          {details && (
            <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
              {details.sentCount !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Mensagens enviadas:</span>
                  <span className="font-medium text-foreground">{details.sentCount}</span>
                </div>
              )}
              {details.limit !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Limite diário:</span>
                  <span className="font-medium text-foreground">{details.limit} mensagens</span>
                </div>
              )}
              {details.remaining !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Restante hoje:</span>
                  <span className="font-medium text-foreground">{details.remaining} mensagens</span>
                </div>
              )}
              {details.nextAvailable && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Próximo envio:</span>
                  <span className="font-medium text-foreground">{details.nextAvailable}</span>
                </div>
              )}
            </div>
          )}

          <div className="bg-primary/10 rounded-lg p-4 text-center">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Dica:</strong> O sistema de proteção evita que seu número seja marcado como spam pelo WhatsApp.
            </p>
          </div>
        </div>

        <div className="flex pt-2">
          <Button
            className="flex-1"
            onClick={onClose}
          >
            Entendi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
