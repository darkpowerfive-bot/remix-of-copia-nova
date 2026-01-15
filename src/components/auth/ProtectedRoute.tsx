import { useEffect, useState, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// Cache global para status do usuário - evita re-fetch em cada navegação
const statusCache = new Map<string, { status: string; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minuto

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (user && !hasCheckedRef.current) {
      hasCheckedRef.current = true;
      checkUserStatus();
    } else if (user) {
      // Se já verificou antes, usa cache
      const cached = statusCache.get(user.id);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setUserStatus(cached.status);
        setCheckingStatus(false);
        
        if (cached.status === "pending" && location.pathname !== "/pending-approval") {
          navigate("/pending-approval", { replace: true });
        } else if (cached.status === "active" && location.pathname === "/pending-approval") {
          navigate("/dashboard", { replace: true });
        }
      } else {
        checkUserStatus();
      }
    }
  }, [user, loading, navigate]);

  // Re-check quando pathname muda se status é pending
  useEffect(() => {
    if (user && userStatus === "pending" && location.pathname !== "/pending-approval") {
      navigate("/pending-approval", { replace: true });
    }
  }, [location.pathname, user, userStatus, navigate]);

  const checkUserStatus = async () => {
    if (!user?.id) {
      setCheckingStatus(false);
      return;
    }

    // Verifica cache primeiro
    const cached = statusCache.get(user.id);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setUserStatus(cached.status);
      setCheckingStatus(false);
      return;
    }

    try {
      const provider = user.app_metadata?.provider;
      const isGoogleUser = provider === "google";

      // Para Google users novos, garante profile existe
      if (isGoogleUser && !cached) {
        try {
          await supabase.functions.invoke("ensure-user-profile");
        } catch (e) {
          console.error("Erro ao garantir profile:", e);
        }
      }

      // Busca status com retry rápido
      let data: { status: string | null } | null = null;
      let retries = 0;
      const maxRetries = isGoogleUser && !cached ? 3 : 1;

      while (retries < maxRetries) {
        const result = await supabase
          .from("profiles")
          .select("status")
          .eq("id", user.id)
          .maybeSingle();

        data = result.data as { status: string | null } | null;
        if (data?.status) break;
        
        retries++;
        if (retries < maxRetries) {
          await new Promise(r => setTimeout(r, 300));
        }
      }

      if (data?.status) {
        // Atualiza cache
        statusCache.set(user.id, { status: data.status, timestamp: Date.now() });
        setUserStatus(data.status);

        if (data.status === "pending" && location.pathname !== "/pending-approval") {
          navigate("/pending-approval", { replace: true });
          return;
        }
        
        if (data.status === "active" && location.pathname === "/pending-approval") {
          navigate("/dashboard", { replace: true });
          return;
        }
      } else if (isGoogleUser && location.pathname !== "/pending-approval") {
        setUserStatus("pending");
        statusCache.set(user.id, { status: "pending", timestamp: Date.now() });
        navigate("/pending-approval", { replace: true });
        return;
      }
    } catch (e) {
      console.error("Erro ao verificar status:", e);
    } finally {
      setCheckingStatus(false);
    }
  };

  // Loading mínimo - só mostra se realmente está carregando auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se está verificando status mas já tem cache válido, renderiza children
  if (checkingStatus && user) {
    const cached = statusCache.get(user.id);
    if (cached && cached.status === "active") {
      return <>{children}</>;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (userStatus === "pending" && location.pathname !== "/pending-approval") {
    return null;
  }

  return <>{children}</>;
}
