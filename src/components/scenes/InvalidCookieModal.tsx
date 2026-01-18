import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Settings, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface InvalidCookieModalProps {
  isOpen: boolean;
  onClose: () => void;
  cookieIndex?: number;
  totalCookies?: number;
  isGlobalCookie?: boolean;
}

export const InvalidCookieModal = ({ 
  isOpen, 
  onClose, 
  cookieIndex,
  totalCookies,
  isGlobalCookie 
}: InvalidCookieModalProps) => {
  const navigate = useNavigate();

  const handleGoToSettings = () => {
    onClose();
    navigate("/settings");
  };

  const getCookieLabel = () => {
    if (!cookieIndex) return null;
    return `Cookie ${cookieIndex}${totalCookies ? ` de ${totalCookies}` : ''}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-full bg-destructive/10">
              <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <div className="flex flex-col gap-1">
              <DialogTitle className="text-xl">Cookie do ImageFX Inválido</DialogTitle>
              {cookieIndex && (
                <div className="flex items-center gap-2">
                  <Badge variant="destructive" className="text-xs">
                    {getCookieLabel()}
                  </Badge>
                  {isGlobalCookie && (
                    <Badge variant="outline" className="text-xs">
                      Cookie Global
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogDescription className="text-base pt-2">
            {cookieIndex 
              ? `O Cookie ${cookieIndex} do ImageFX está inválido ou expirou. A geração de imagens foi interrompida.`
              : `Os cookies do ImageFX estão inválidos ou expiraram. A geração de imagens foi interrompida.`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 rounded-lg p-4 my-4 space-y-3">
          <h4 className="font-medium text-sm">Para resolver{cookieIndex ? ` o Cookie ${cookieIndex}` : ''}:</h4>
          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Acesse <a href="https://labs.google/fx/tools/image-fx" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">labs.google/fx/tools/image-fx</a></li>
            <li>Faça login com sua conta Google{cookieIndex && cookieIndex > 1 ? ` (conta ${cookieIndex})` : ''}</li>
            <li>Gere qualquer imagem de teste</li>
            <li>Copie os cookies atualizados</li>
            <li>Cole nas Configurações do sistema{cookieIndex ? ` no campo Cookie ${cookieIndex}` : ''}</li>
          </ol>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} className="flex-1 sm:flex-none">
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar Depois
          </Button>
          <Button onClick={handleGoToSettings} className="flex-1 sm:flex-none">
            <Settings className="h-4 w-4 mr-2" />
            Ir para Configurações
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
