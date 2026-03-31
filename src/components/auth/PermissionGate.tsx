import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { usePermissions, PermissionKey } from "@/hooks/usePermissions";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface PermissionGateProps {
  permission: PermissionKey;
  children: ReactNode;
  featureName?: string;
}

export function PermissionGate({ permission, children, featureName }: PermissionGateProps) {
  const { hasPermission, loading, planName } = usePermissions();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (hasPermission(permission)) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-primary/20 bg-gradient-to-br from-background to-muted/30">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-foreground">
              Recurso Bloqueado
            </h2>
            <p className="text-muted-foreground">
              {featureName ? (
                <>O recurso <span className="font-semibold text-foreground">{featureName}</span> não está disponível no seu plano atual.</>
              ) : (
                <>Este recurso não está disponível no seu plano atual.</>
              )}
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Seu plano atual: <span className="font-semibold text-foreground">{planName || "FREE"}</span>
            </p>
          </div>

          <Button 
            onClick={() => navigate("/planos-creditos")}
            className="w-full gap-2"
            size="lg"
          >
            <Sparkles className="w-4 h-4" />
            Fazer Upgrade
          </Button>
          
          <p className="text-xs text-muted-foreground">
            Desbloqueie todas as ferramentas com um plano superior
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
