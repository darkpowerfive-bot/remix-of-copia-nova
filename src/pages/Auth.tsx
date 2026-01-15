import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Mail, Lock, Eye, EyeOff, Shield, ArrowRight, ArrowLeft, Rocket, Gift } from "lucide-react";
import { z } from "zod";
import logo from "@/assets/logo.gif";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { SEOHead } from "@/components/seo/SEOHead";
import { getAppBaseUrl } from "@/lib/appUrl";
// Use WebP from public folder for faster loading
const authBg = "/images/auth-porsche.webp";

const authSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  fullName: z.string().optional(),
  whatsapp: z.string().optional(),
});

const signupSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  fullName: z.string().min(2, "Nome é obrigatório"),
  whatsapp: z.string().min(10, "WhatsApp é obrigatório (mínimo 10 dígitos)"),
});

interface MigrationInvite {
  id: string;
  email: string;
  full_name: string | null;
  plan_name: string;
  credits_amount: number;
  token: string;
  status: string;
  expires_at: string | null;
}

const Auth = () => {
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get("invite");
  
  const [isLogin, setIsLogin] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);
  const [isMigration, setIsMigration] = useState(false);
  const [migrationInvite, setMigrationInvite] = useState<MigrationInvite | null>(null);
  const [migrationLoading, setMigrationLoading] = useState(false);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Carregar credenciais salvas
    const savedEmail = localStorage.getItem("remembered-email");
    const savedPassword = localStorage.getItem("remembered-password");
    if (savedEmail && savedPassword) {
      setEmail(savedEmail);
      setPassword(atob(savedPassword));
      setRememberPassword(true);
    }
    
    return () => clearTimeout(timer);
  }, []);

  // Check for migration invite
  useEffect(() => {
    if (inviteToken) {
      fetchMigrationInvite(inviteToken);
    }
  }, [inviteToken]);

  const fetchMigrationInvite = async (token: string) => {
    setMigrationLoading(true);
    try {
      const { data, error } = await supabase
        .from("migration_invites")
        .select("*")
        .eq("token", token)
        .maybeSingle();

      if (error || !data) {
        toast({
          title: "Convite inválido",
          description: "Este link de convite não é válido ou expirou",
          variant: "destructive",
        });
        return;
      }

      if (data.status === "completed") {
        toast({
          title: "Convite já utilizado",
          description: "Este convite já foi utilizado. Faça login normalmente.",
          variant: "default",
        });
        return;
      }

      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        toast({
          title: "Convite expirado",
          description: "Este convite expirou. Entre em contato com o suporte.",
          variant: "destructive",
        });
        return;
      }

      // Valid invite - set up migration form
      setMigrationInvite(data);
      setIsMigration(true);
      setEmail(data.email);
      setFullName(data.full_name || "");
    } catch (error) {
      console.error("Error fetching invite:", error);
    } finally {
      setMigrationLoading(false);
    }
  };

  const handleMigrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!migrationInvite) return;
    
    if (password !== confirmPassword) {
      toast({
        title: "Senhas não conferem",
        description: "A senha e a confirmação devem ser iguais",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter no mínimo 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    if (whatsapp.length < 10) {
      toast({
        title: "WhatsApp inválido",
        description: "Digite um número de WhatsApp válido",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create user account
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: migrationInvite.email,
        password,
        options: {
          emailRedirectTo: `${getAppBaseUrl()}/dashboard`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) {
        // Check if user already exists
        if (signUpError.message.includes("already registered")) {
          toast({
            title: "Email já cadastrado",
            description: "Este email já possui uma conta. Tente fazer login.",
            variant: "destructive",
          });
          setIsMigration(false);
          return;
        }
        throw signUpError;
      }

      if (authData.user) {
        // Wait a bit for the trigger to create the profile
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update profile with WhatsApp and set status to active
        await supabase
          .from("profiles")
          .update({ 
            whatsapp, 
            full_name: fullName,
            status: "active" 
          })
          .eq("id", authData.user.id);

        // Update user role based on plan
        const roleMap: Record<string, "free" | "pro" | "admin"> = {
          "FREE": "free",
          "START CREATOR": "pro",
          "TURBO MAKER": "pro",
          "MASTER PRO": "pro",
        };
        const role = roleMap[migrationInvite.plan_name] || "free";

        if (role !== "free") {
          await supabase
            .from("user_roles")
            .update({ role })
            .eq("user_id", authData.user.id);
        }

        // Add credits
        await supabase
          .from("user_credits")
          .upsert({
            user_id: authData.user.id,
            balance: migrationInvite.credits_amount,
          }, { onConflict: "user_id" });

        // Log credit transaction
        await supabase.from("credit_transactions").insert({
          user_id: authData.user.id,
          amount: migrationInvite.credits_amount,
          transaction_type: "add",
          description: `Créditos de migração - Plano ${migrationInvite.plan_name}`,
        });

        // Mark invite as completed
        await supabase
          .from("migration_invites")
          .update({ 
            status: "completed", 
            completed_at: new Date().toISOString() 
          })
          .eq("id", migrationInvite.id);

        toast({
          title: "🎉 Conta criada com sucesso!",
          description: `Bem-vindo! Você recebeu ${migrationInvite.credits_amount} créditos do plano ${migrationInvite.plan_name}.`,
        });

        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Migration error:", error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar conta",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submit
    if (loading) return;
    
    setLoading(true);

    try {
      // Use different validation for login vs signup
      const schema = isLogin ? authSchema : signupSchema;
      const validation = schema.safeParse({ 
        email, 
        password, 
        fullName: isLogin ? undefined : fullName,
        whatsapp: isLogin ? undefined : whatsapp 
      });
      
      if (!validation.success) {
        toast({
          title: "Erro de validação",
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (isLogin) {
        // Salvar credenciais se "Lembrar-me" estiver ativo
        if (rememberPassword) {
          localStorage.setItem("remembered-email", email);
          localStorage.setItem("remembered-password", btoa(password));
        } else {
          localStorage.removeItem("remembered-email");
          localStorage.removeItem("remembered-password");
        }
        
        const { error } = await signIn(email, password);
        if (error) {
          let message = "Erro ao fazer login";
          if (error.message.includes("Invalid login credentials")) {
            message = "Email ou senha incorretos";
          }
          toast({
            title: "Erro",
            description: message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Bem-vindo!",
            description: "Login realizado com sucesso",
          });

          // Espera a sessão persistir antes de navegar (evita precisar logar 2x)
          const start = Date.now();
          while (Date.now() - start < 2500) {
            const { data } = await supabase.auth.getSession();
            if (data.session?.user) break;
            await new Promise((r) => setTimeout(r, 150));
          }

          navigate("/dashboard", { replace: true });
        }
      } else {
        const { error } = await signUp(email, password, fullName, whatsapp);
        if (error) {
          let message = "Erro ao criar conta";
          if (error.message.includes("already registered")) {
            message = "Este email já está cadastrado";
          }
          toast({
            title: "Erro",
            description: message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Cadastro realizado!",
            description: "Aguarde aprovação do administrador para acessar",
          });
          navigate("/pending-approval");
        }
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

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryLoading(true);

    try {
      if (!email || !z.string().email().safeParse(email).success) {
        toast({
          title: "Erro",
          description: "Digite um email válido",
          variant: "destructive",
        });
        setRecoveryLoading(false);
        return;
      }

      const { error } = await resetPassword(email);
      
      if (error) {
        toast({
          title: "Erro",
          description: "Não foi possível enviar o email de recuperação",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Email enviado!",
          description: "Verifique sua caixa de entrada para redefinir sua senha",
        });
        setIsRecovery(false);
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setRecoveryLoading(false);
    }
  };

  return (
    <>
      <SEOHead
        title="Login"
        description="Acesse sua conta La Casa Dark CORE. Ferramentas de IA para criadores de canais dark no YouTube."
        canonical="/auth"
        noindex={true}
      />
      
      {/* PWA Install Prompt */}
      <InstallPrompt />
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

      {/* Back to Landing Button */}
      <Link 
        to="/landing" 
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span>Voltar</span>
      </Link>
      
      {/* Glass Login Card */}
      <div 
        className={`relative z-10 w-full max-w-md transition-all duration-700 ease-out ${
          isVisible 
            ? 'opacity-100 translate-y-0 scale-100' 
            : 'opacity-0 translate-y-8 scale-95'
        }`}
      >
        {/* Glass card with glossy effect - more transparent */}
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
              <span className="text-xs font-semibold text-primary tracking-wide">PRIVATE CORE</span>
            </div>
          </div>

          {/* Logo */}
          <div className="flex flex-col items-center mb-6 relative">
            <div className="w-32 h-32 rounded-full overflow-hidden mb-5">
              <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            </div>
            
            <h1 className="text-3xl font-bold text-foreground tracking-tight">
              LA CASA DARK
            </h1>
            <span className="text-2xl font-bold text-primary mt-1">CORE</span>
            
            <p className="text-base text-foreground mt-4 text-center">
              Acesso ao Núcleo Privado
            </p>
            <p className="text-sm text-muted-foreground mt-2 text-center">
              Ferramentas usadas por criadores que operam canais dark em escala
            </p>
          </div>


          {/* Migration Loading */}
          {migrationLoading ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">Verificando convite...</p>
            </div>
          ) : isMigration && migrationInvite ? (
            /* Migration Form */
            <form onSubmit={handleMigrationSubmit} className="space-y-4 relative">
              {/* Welcome banner */}
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-5 h-5 text-primary" />
                  <span className="font-semibold text-primary">Bem-vindo de volta!</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Você receberá <strong className="text-primary">{migrationInvite.credits_amount} créditos</strong> do plano <strong className="text-primary">{migrationInvite.plan_name}</strong>
                </p>
              </div>

              {/* Email (readonly) */}
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  E-mail
                </label>
                <Input
                  type="email"
                  value={email}
                  disabled
                  className="bg-secondary/30 border-border/50 h-11 text-muted-foreground"
                />
              </div>

              {/* Full Name */}
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 flex items-center gap-2">
                  Nome completo <span className="text-destructive">*</span>
                </label>
                <Input
                  type="text"
                  placeholder="Seu nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="bg-secondary/50 border-border/50 h-11"
                  required
                />
              </div>

              {/* WhatsApp */}
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 flex items-center gap-2">
                  WhatsApp <span className="text-destructive">*</span>
                </label>
                <Input
                  type="tel"
                  placeholder="5511999999999"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                  className="bg-secondary/50 border-border/50 h-11"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">Apenas números com DDD</p>
              </div>

              {/* Password */}
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  Nova Senha <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
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
                  Confirmar Senha <span className="text-destructive">*</span>
                </label>
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirme sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-secondary/50 border-border/50 h-11"
                  required
                />
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
                  <ArrowRight className="w-5 h-5 mr-2" />
                )}
                Ativar Minha Conta
              </Button>
            </form>
          ) : isRecovery ? (
            /* Recovery Form */
            <form onSubmit={handleRecovery} className="space-y-4 relative">
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold text-foreground">Recuperar Acesso</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Digite seu email para receber o link de recuperação
                </p>
              </div>
              
              {/* Email */}
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  E-mail
                </label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary/50 border-border/50 h-11"
                  required
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-14 text-base font-semibold gradient-button text-primary-foreground mt-4"
                disabled={recoveryLoading}
              >
                {recoveryLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <Mail className="w-5 h-5 mr-2" />
                )}
                Enviar Link de Recuperação
              </Button>

              {/* Back to Login */}
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => setIsRecovery(false)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar ao Login
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 relative">
              {!isLogin && (
                <>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1.5 flex items-center gap-2">
                      Nome completo <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="Seu nome completo"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="bg-secondary/50 border-border/50 h-11"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-1.5 flex items-center gap-2">
                      WhatsApp <span className="text-destructive">*</span>
                    </label>
                    <Input
                      type="tel"
                      placeholder="5511999999999"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ''))}
                      className="bg-secondary/50 border-border/50 h-11"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1">Apenas números com DDD</p>
                  </div>
                </>
              )}
              
              {/* Email */}
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" />
                  E-mail
                </label>
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary/50 border-border/50 h-11"
                  required
                />
              </div>

              {/* Password */}
              <div>
                <label className="text-sm text-muted-foreground mb-1.5 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  Senha
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

              {/* Lembrar-me e Recover access */}
              {isLogin && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={rememberPassword}
                      onCheckedChange={(checked) => setRememberPassword(checked as boolean)}
                      className="border-border/50 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label 
                      htmlFor="remember" 
                      className="text-sm text-muted-foreground cursor-pointer select-none"
                    >
                      Lembrar meus dados
                    </label>
                  </div>
                  <div className="text-left">
                    <button 
                      type="button" 
                      onClick={() => setIsRecovery(true)}
                      className="text-primary text-sm hover:underline"
                    >
                      Recuperar acesso ao Core
                    </button>
                    <p className="text-xs text-muted-foreground mt-1 italic">
                      Sessão vinculada à infraestrutura do operador
                    </p>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full h-14 text-base font-semibold gradient-button text-primary-foreground mt-4"
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="w-5 h-5 mr-2" />
                )}
                {isLogin ? "Acessar o Core" : "Criar Acesso"}
              </Button>
            </form>
          )}

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border/30" />
            <span className="text-xs text-muted-foreground">ou continue com</span>
            <div className="flex-1 h-px bg-border/30" />
          </div>

          {/* Google Sign In */}
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 text-base font-medium border-border/50 bg-secondary/30 hover:bg-secondary/50"
            onClick={async () => {
              setGoogleLoading(true);
              const { error } = await signInWithGoogle();
              if (error) {
                toast({
                  title: "Erro",
                  description: "Não foi possível conectar com o Google",
                  variant: "destructive",
                });
              }
              setGoogleLoading(false);
            }}
            disabled={googleLoading}
          >
            {googleLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            Google
          </Button>

          {/* Motivational text */}
          <p className="text-xs text-muted-foreground text-center mt-4 italic">
            Canais dark não crescem por sorte. Crescem por sistema.
          </p>

          {/* Toggle Login/Signup */}
          <div className="text-center mt-6 pt-5 border-t border-border/30">
            <p className="text-sm text-muted-foreground">
              {isLogin ? "Acesso restrito · Validação obrigatória" : "Já tem acesso?"}
            </p>
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary text-sm font-semibold hover:underline mt-1"
            >
              {isLogin ? "Solicitar acesso ao Core" : "Fazer login"}
            </button>
          </div>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 mt-5 text-muted-foreground">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs">Ambiente isolado para operações dark</span>
          </div>

          {/* Terms */}
          <p className="text-xs text-muted-foreground text-center mt-4">
            Ao continuar, você concorda com nossos{" "}
            <Link to="/terms" className="text-primary hover:underline">Termos de Uso</Link>
            {" "}e{" "}
            <Link to="/privacy" className="text-primary hover:underline">Política de Privacidade</Link>.
          </p>

          {/* Footer taglines */}
          <p className="text-xs text-muted-foreground/60 text-center mt-3 italic">
            Operadores reconhecem operadores.
          </p>
        </div>
      </div>
    </div>
    </>
  );
};

export default Auth;
