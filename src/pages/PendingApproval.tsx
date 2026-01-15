import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/seo/SEOHead";
import { Clock, Mail, ArrowLeft, RefreshCw, LogOut, CheckCircle } from "lucide-react";
import logo from "@/assets/logo.gif";
import authBg from "@/assets/auth-porsche.jpg";

const PendingApproval = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    // Verificar status automaticamente ao carregar a página
    checkStatusSilent();
  }, [user, navigate]);

  const checkStatusSilent = async () => {
    if (!user?.id) return;
    
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", user.id)
        .single();

      if (!error && (data?.status === "active" || data?.status === "approved")) {
        // Usuário já aprovado, redirecionar direto
        setIsApproved(true);
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      }
    } catch (e) {
      console.error("Erro ao verificar status:", e);
    }
  };

  const checkStatus = async () => {
    setChecking(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", user?.id)
        .single();

      if (!error && (data?.status === "active" || data?.status === "approved")) {
        // Mostrar estágio 3 antes de redirecionar
        setIsApproved(true);
        setTimeout(() => {
          navigate("/dashboard");
        }, 2000);
      }
    } catch (e) {
      console.error("Erro ao verificar status:", e);
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <>
      <SEOHead
        title="Aguardando Aprovação"
        description="Sua solicitação de acesso está sendo analisada pela nossa equipe."
        noindex={true}
      />
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={authBg}
          alt="Background"
          className="absolute inset-0 h-full w-full object-cover object-center"
          style={{ filter: 'brightness(0.85) contrast(1.1) saturate(1.05)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/60 to-transparent" />
      </div>

      {/* Back Button */}
      <Link 
        to="/landing" 
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Voltar</span>
      </Link>
      
      {/* Card */}
      <div 
        className={`relative z-10 w-full max-w-md transition-all duration-700 ease-out ${
          isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95'
        }`}
      >
        <div 
          className="relative rounded-3xl p-8 backdrop-blur-xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(20, 20, 25, 0.8) 0%, rgba(10, 10, 15, 0.9) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Glossy shine */}
          <div 
            className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
              borderRadius: '1.5rem 1.5rem 0 0',
            }}
          />

          {/* Logo */}
          <div className="flex flex-col items-center mb-6 relative">
            <div className="w-24 h-24 rounded-full overflow-hidden mb-4">
              <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            </div>
          </div>

          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            {isApproved ? (
              <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-full bg-yellow-500/20 border-2 border-yellow-500 flex items-center justify-center">
                <Clock className="w-10 h-10 text-yellow-500 animate-pulse" />
              </div>
            )}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-foreground text-center mb-2">
            {isApproved ? "Acesso Liberado!" : "Aguardando Aprovação"}
          </h1>
          
          <p className="text-muted-foreground text-center mb-6">
            {isApproved 
              ? "Seu acesso foi aprovado! Redirecionando para o dashboard..." 
              : "Sua solicitação de acesso foi recebida e está sendo analisada pela nossa equipe."}
          </p>

          {/* Info Box */}
          {!isApproved && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-foreground font-medium">
                    Você receberá um email quando seu acesso for aprovado
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Enviado para: {user?.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Timeline */}
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center">
                <span className="text-green-500 text-sm">✓</span>
              </div>
              <span className="text-sm text-muted-foreground">Cadastro realizado</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isApproved 
                  ? "bg-green-500/20 border border-green-500" 
                  : "bg-yellow-500/20 border border-yellow-500 animate-pulse"
              }`}>
                {isApproved ? (
                  <span className="text-green-500 text-sm">✓</span>
                ) : (
                  <Clock className="w-4 h-4 text-yellow-500" />
                )}
              </div>
              <span className={`text-sm ${isApproved ? "text-muted-foreground" : "text-foreground font-medium"}`}>
                {isApproved ? "Aprovado" : "Aguardando aprovação"}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isApproved 
                  ? "bg-green-500/20 border border-green-500 animate-pulse" 
                  : "bg-muted/50 border border-border"
              }`}>
                {isApproved ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <span className="text-muted-foreground text-sm">3</span>
                )}
              </div>
              <span className={`text-sm ${isApproved ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                Acesso liberado
              </span>
            </div>
          </div>

          {/* Actions */}
          {!isApproved && (
            <div className="space-y-3">
              <Button
                onClick={checkStatus}
                className="w-full h-12 gradient-button text-primary-foreground"
                disabled={checking}
              >
                {checking ? (
                  <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Verificar Status
              </Button>

              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full h-12"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          )}

          {/* Footer */}
          <p className="text-xs text-muted-foreground text-center mt-6 italic">
            {isApproved 
              ? "Bem-vindo ao La Casa Dark Core!" 
              : "O tempo médio de aprovação é de até 24 horas úteis."}
          </p>
        </div>
      </div>
    </div>
    </>
  );
};

export default PendingApproval;
