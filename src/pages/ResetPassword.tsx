import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SEOHead } from "@/components/seo/SEOHead";
import { Loader2, Lock, Eye, EyeOff, Shield, ArrowLeft, CheckCircle } from "lucide-react";
import { z } from "zod";
import logo from "@/assets/logo.gif";
import authBg from "@/assets/auth-porsche.jpg";

const passwordSchema = z.object({
  password: z.string()
    .min(8, "Senha deve ter no mínimo 8 caracteres")
    .regex(/[A-Z]/, "Senha deve conter pelo menos uma letra maiúscula")
    .regex(/[a-z]/, "Senha deve conter pelo menos uma letra minúscula")
    .regex(/[0-9]/, "Senha deve conter pelo menos um número")
    .regex(/[^A-Za-z0-9]/, "Senha deve conter pelo menos um caractere especial"),
  confirmPassword: z.string().min(8, "Confirme sua senha"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

// Password strength checker
const getPasswordStrength = (password: string) => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  return strength;
};

const getStrengthLabel = (strength: number) => {
  if (strength <= 2) return { label: "Fraca", color: "bg-red-500" };
  if (strength <= 4) return { label: "Média", color: "bg-yellow-500" };
  return { label: "Forte", color: "bg-green-500" };
};

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = passwordSchema.safeParse({ password, confirmPassword });
      
      if (!validation.success) {
        toast({
          title: "Erro de validação",
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        toast({
          title: "Erro",
          description: error.message || "Não foi possível atualizar a senha",
          variant: "destructive",
        });
      } else {
        setSuccess(true);
        toast({
          title: "Senha atualizada!",
          description: "Sua senha foi alterada com sucesso",
        });
        
        // Redirect after 3 seconds
        setTimeout(() => {
          navigate("/dashboard");
        }, 3000);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Redefinir Senha"
        description="Redefina sua senha para recuperar o acesso à plataforma."
        noindex={true}
      />
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background with Porsche - animated */}
      <div className="absolute inset-0 overflow-hidden">
        <img
          src={authBg}
          alt="Background"
          className="absolute inset-0 h-full w-full object-cover object-center animate-[slowZoom_25s_ease-in-out_infinite_alternate]"
          style={{
            filter: 'brightness(0.85) contrast(1.1) saturate(1.05)',
          }}
        />
        {/* Lighter overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/40 to-transparent" />
        {/* Subtle vignette effect */}
        <div 
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(10, 10, 15, 0.5) 100%)',
          }}
        />
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes slowZoom {
          0% {
            transform: scale(1) translateX(0);
          }
          100% {
            transform: scale(1.08) translateX(-1%);
          }
        }
      `}</style>

      {/* Subtle floating orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-primary/10 blur-[100px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-primary/5 blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Back to Login Button */}
      <Link 
        to="/auth" 
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Voltar ao Login</span>
      </Link>
      
      {/* Glass Card */}
      <div 
        className={`relative z-10 w-full max-w-md transition-all duration-700 ease-out ${
          isVisible 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-8 scale-95'
        }`}
      >
        {/* Glass card with glossy effect */}
        <div 
          className="relative rounded-3xl p-8 backdrop-blur-xl overflow-hidden"
          style={{
            background: 'linear-gradient(180deg, rgba(20, 20, 25, 0.6) 0%, rgba(10, 10, 15, 0.75) 100%)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          }}
        >
          {/* Top glossy shine */}
          <div 
            className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
            style={{
              background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.06) 0%, transparent 100%)',
              borderRadius: '1.5rem 1.5rem 0 0',
            }}
          />

          {/* Private Core badge */}
          <div className="flex justify-center mb-6 relative">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/40">
              <Lock className="w-3 h-3 text-primary" />
              <span className="text-xs font-semibold text-primary tracking-wide">REDEFINIR SENHA</span>
            </div>
          </div>

          {/* Logo */}
          <div className="flex flex-col items-center mb-6 relative">
            <div className="w-24 h-24 rounded-full overflow-hidden mb-4">
              <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            </div>
            
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              Nova Senha
            </h1>
            
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Digite sua nova senha para recuperar o acesso ao Core
            </p>
          </div>

          {success ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Senha Atualizada!</h2>
              <p className="text-sm text-muted-foreground">
                Você será redirecionado para o dashboard em instantes...
              </p>
              <Button
                onClick={() => navigate("/dashboard")}
                className="w-full h-12 gradient-button text-primary-foreground"
              >
                Ir para o Dashboard
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 relative">
              {/* New Password */}
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  Nova Senha
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-secondary/50 border-border/50 h-11 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-secondary/50 border-border/50 h-11 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Strength Indicator */}
              {password.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Força da senha:</span>
                    <span className={`font-medium ${
                      getStrengthLabel(getPasswordStrength(password)).color === "bg-red-500" ? "text-red-500" :
                      getStrengthLabel(getPasswordStrength(password)).color === "bg-yellow-500" ? "text-yellow-500" :
                      "text-green-500"
                    }`}>
                      {getStrengthLabel(getPasswordStrength(password)).label}
                    </span>
                  </div>
                  <div className="h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${getStrengthLabel(getPasswordStrength(password)).color}`}
                      style={{ width: `${(getPasswordStrength(password) / 6) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Password Requirements */}
              <div className="text-xs text-muted-foreground space-y-1.5 p-3 rounded-lg bg-secondary/30">
                <p className="font-medium text-foreground mb-2">Requisitos da senha:</p>
                <p className={password.length >= 8 ? "text-green-500" : ""}>
                  • Mínimo de 8 caracteres {password.length >= 8 && "✓"}
                </p>
                <p className={/[A-Z]/.test(password) ? "text-green-500" : ""}>
                  • Uma letra maiúscula {/[A-Z]/.test(password) && "✓"}
                </p>
                <p className={/[a-z]/.test(password) ? "text-green-500" : ""}>
                  • Uma letra minúscula {/[a-z]/.test(password) && "✓"}
                </p>
                <p className={/[0-9]/.test(password) ? "text-green-500" : ""}>
                  • Um número {/[0-9]/.test(password) && "✓"}
                </p>
                <p className={/[^A-Za-z0-9]/.test(password) ? "text-green-500" : ""}>
                  • Um caractere especial (!@#$%...) {/[^A-Za-z0-9]/.test(password) && "✓"}
                </p>
                <p className={password === confirmPassword && password.length > 0 ? "text-green-500" : ""}>
                  • As senhas devem coincidir {password === confirmPassword && password.length > 0 && "✓"}
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-14 text-base font-semibold gradient-button text-primary-foreground mt-4"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Lock className="w-5 h-5 mr-2" />
                )}
                Atualizar Senha
              </Button>
            </form>
          )}

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 mt-6 text-muted-foreground">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs">Conexão segura e criptografada</span>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ResetPassword;
