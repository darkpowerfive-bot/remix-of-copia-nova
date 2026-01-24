// Protected Route Component - Copie para src/components/auth/ProtectedRoute.tsx no novo projeto
import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  requireApproval?: boolean; // Se precisa de aprovação de admin
  requiredStatus?: 'pending' | 'approved' | 'rejected';
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requireApproval = true,
  requiredStatus,
  redirectTo = '/auth',
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Mostra loading enquanto carrega
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não está logado, redireciona para auth
  if (!user) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Se precisa de perfil mas não tem
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Perfil não encontrado</h2>
          <p className="text-muted-foreground mt-2">
            Houve um problema ao carregar seu perfil.
          </p>
        </div>
      </div>
    );
  }

  // Verifica status específico se necessário
  if (requiredStatus && profile.status !== requiredStatus) {
    if (profile.status === 'pending') {
      return <Navigate to="/pending-approval" replace />;
    }
    if (profile.status === 'rejected') {
      return <Navigate to="/access-denied" replace />;
    }
  }

  // Verifica se precisa de aprovação
  if (requireApproval && profile.status !== 'approved') {
    if (profile.status === 'pending') {
      return <Navigate to="/pending-approval" replace />;
    }
    return <Navigate to="/access-denied" replace />;
  }

  return <>{children}</>;
}

// ============================================
// Componente para rotas públicas (só para não logados)
// ============================================
interface PublicRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export function PublicRoute({
  children,
  redirectTo = '/dashboard',
}: PublicRouteProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se está logado, redireciona
  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

// ============================================
// HOC para verificar permissões (opcional)
// ============================================
interface RequirePermissionProps {
  children: ReactNode;
  permission: string;
  fallback?: ReactNode;
}

export function RequirePermission({
  children,
  permission,
  fallback = null,
}: RequirePermissionProps) {
  const { profile } = useAuth();

  // Implemente sua lógica de permissões aqui
  // Exemplo simples:
  // const hasPermission = profile?.permissions?.includes(permission);
  
  const hasPermission = true; // Placeholder

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
