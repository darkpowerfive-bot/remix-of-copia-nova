import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { getAppBaseUrl } from "@/lib/appUrl";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string, whatsapp?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let sessionChecked = false;
    let didSettleLoading = false;

    const settleLoadingIfReady = () => {
      if (!didSettleLoading && sessionChecked && isMounted) {
        didSettleLoading = true;
        setLoading(false);
      }
    };

    // Listener primeiro (evita perder eventos)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      setSession(session);
      setUser(session?.user ?? null);

      // Para eventos reais (login/logout/refresh), pode liberar loading na hora.
      // Para INITIAL_SESSION, esperamos o getSession finalizar pelo menos 1x
      // (evita "piscar" user=null e ProtectedRoute mandar de volta pro /auth).
      if (event !== "INITIAL_SESSION") {
        didSettleLoading = true;
        setLoading(false);
      } else {
        settleLoadingIfReady();
      }
    });

    // Depois checa sessão atual
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        if (!isMounted) return;
        sessionChecked = true;
        setSession(session);
        setUser(session?.user ?? null);
        settleLoadingIfReady();
      })
      .catch(() => {
        sessionChecked = true;
        settleLoadingIfReady();
      });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName?: string, whatsapp?: string) => {
    const redirectUrl = `${getAppBaseUrl()}/`;
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
          whatsapp: whatsapp,
        },
      },
    });
    
    // Se cadastro bem-sucedido, atualizar profile com whatsapp e enviar emails
    if (!error && data.user) {
      // Atualizar o profile com o whatsapp
      try {
        await supabase
          .from("profiles")
          .update({ whatsapp: whatsapp })
          .eq("id", data.user.id);
      } catch (e) {
        console.error("Erro ao atualizar whatsapp:", e);
      }
      
      // Enviar email de pendente de aprovação para o usuário
      try {
        await supabase.functions.invoke("send-pending-email", {
          body: { email, fullName },
        });
      } catch (e) {
        console.error("Erro ao enviar email de pendente:", e);
      }
      
      // Notificar admins sobre novo cadastro
      try {
        await supabase.functions.invoke("send-admin-notification", {
          body: { userEmail: email, userName: fullName, userWhatsapp: whatsapp },
        });
      } catch (e) {
        console.error("Erro ao notificar admins:", e);
      }
    }
    
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    return { error: error as Error | null };
  };

  const signInWithGoogle = async () => {
    // Redirect to root - ProtectedRoute will handle checking status and redirect appropriately
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${getAppBaseUrl()}/`,
      },
    });
    
    return { error: error as Error | null };
  };

  const resetPassword = async (email: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("send-password-reset", {
        body: { email },
      });

      if (error) {
        return { error: new Error(error.message || "Erro ao enviar email") };
      }

      if (data && !data.success && data.error) {
        return { error: new Error(data.error) };
      }

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signInWithGoogle, resetPassword, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
