import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEOHead } from "@/components/seo/SEOHead";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/useSubscription";
import { 
  Check, 
  X, 
  Zap, 
  ArrowLeft,
  Rocket,
  Crown,
  Star,
  Shield,
  ArrowRight,
  LayoutDashboard,
  Lock,
} from "lucide-react";

interface PlanData {
  id: string;
  plan_name: string;
  monthly_credits: number | null;
  price_amount: number | null;
  is_annual: boolean | null;
  permissions: Record<string, boolean>;
  stripe_price_id: string | null;
}

interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  stripe_price_id: string | null;
  label: string | null;
  is_active: boolean;
  display_order: number;
}

// Stripe Price IDs for monthly plans
const MONTHLY_PRICE_IDS: Record<string, string> = {
  "START CREATOR": "price_1SZbVEQlTxz1IgnVPqVN8CBf",
  "TURBO MAKER": "price_1SZbVnQlTxz1IgnVF9H4nqVX",
  "MASTER PRO": "price_1SZbWbQlTxz1IgnVQptpKRDn",
};

// Stripe Price IDs for annual plans
const ANNUAL_PRICE_IDS: Record<string, string> = {
  "START CREATOR": "price_1SZbX3QlTxz1IgnVJFVAmaR3",
  "TURBO MAKER": "price_1SZbXeQlTxz1IgnVfHPBr0PU",
  "MASTER PRO": "price_1SZbY0QlTxz1IgnVIryfTa3O",
};

// Map plan names to their db keys for matching
const PLAN_NAME_MAP: Record<string, string> = {
  "Acesso Inicial": "FREE",
  "START CREATOR": "START CREATOR",
  "TURBO MAKER": "TURBO MAKER", 
  "MASTER PRO": "MASTER PRO",
};

const MONTHLY_PLANS = [
  {
    name: "Acesso Inicial",
    credits: 50,
    price: 0,
    features: [
      { label: "Ambiente de avaliação", included: true },
      { label: "Ferramentas limitadas", included: true },
      { label: "Ambiente de exemplos", included: true },
      { label: "Análise de vídeos (restrito)", included: true },
      { label: "Geração de áudio", included: false },
      { label: "Agentes automatizados", included: false },
      { label: "Suporte prioritário", included: false },
    ],
    buttonLabel: "ATIVAR ACESSO",
    highlighted: false,
  },
  {
    name: "START CREATOR",
    credits: 800,
    price: 79.90,
    features: [
      { label: "Processamento de vídeo", included: true },
      { label: "Ambiente completo", included: true },
      { label: "Áudio: até 40 min", included: true },
      { label: "Transcrição ilimitada", included: true },
      { label: "8 agentes operacionais", included: true },
      { label: "Integração YouTube", included: true },
      { label: "Armazenamento: 10 GB", included: true },
    ],
    buttonLabel: "ATIVAR CAPACIDADE",
    highlighted: false,
  },
  {
    name: "TURBO MAKER",
    credits: 1600,
    price: 99.90,
    originalPrice: 149.90,
    features: [
      { label: "60-120 transcrições/mês", included: true },
      { label: "Modelos de IA Avançados", included: true },
      { label: "Multilíngua IA", included: true },
      { label: "360+ análises", included: true },
      { label: "10 agentes operacionais", included: true },
      { label: "Armazenamento: 30 GB", included: true },
      { label: "Atualizações semanais", included: true },
    ],
    buttonLabel: "HABILITAR EXECUÇÃO",
    highlighted: true,
    badge: "POPULAR",
  },
  {
    name: "MASTER PRO",
    credits: 2400,
    price: 149.90,
    features: [
      { label: "Capacidade máxima", included: true },
      { label: "Roteiros de 15+ min", included: true },
      { label: "Todos os estilos de vídeo", included: true },
      { label: "Transcrição ilimitada", included: true },
      { label: "API própria liberada", included: true },
      { label: "Recursos enterprise", included: true },
      { label: "Armazenamento: 50 GB", included: true },
    ],
    buttonLabel: "ATIVAR INFRAESTRUTURA",
    highlighted: false,
    badge: "PRO",
  },
];

const ANNUAL_PLANS = [
  {
    name: "START CREATOR",
    credits: 9600,
    price: 699.00,
    originalPrice: 959.00,
    savings: 350,
    features: [
      "Todos os recursos do START",
      "Execução prolongada segura",
      "API própria liberada",
      "Armazenamento: 15 GB",
    ],
    buttonLabel: "ATIVAR ANUAL",
    highlighted: false,
  },
  {
    name: "TURBO MAKER",
    credits: 19200,
    price: 999.00,
    originalPrice: 1199.00,
    savings: 600,
    features: [
      "Todos os recursos do TURBO",
      "Execução com escalabilidade",
      "API própria liberada",
      "Armazenamento: 30 GB",
    ],
    buttonLabel: "HABILITAR ANUAL",
    highlighted: true,
    badge: "MAIS VENDIDO",
  },
  {
    name: "MASTER PRO",
    credits: 28800,
    price: 1499.00,
    originalPrice: 1799.00,
    savings: 1000,
    features: [
      "Todos os recursos do MASTER",
      "Infraestrutura do CORE",
      "API própria liberada",
      "Recursos enterprise",
      "Armazenamento: 50 GB",
    ],
    buttonLabel: "ATIVAR ANUAL",
    highlighted: false,
    badge: "PRO",
  },
];

const COMPARISON_DATA = [
  { feature: "Avaliação", creditos: "50", roteiros: "~5", valor: "Grátis", audio: "5 min", transcricao: "1", agentes: "1" },
  { feature: "START", creditos: "800", roteiros: "50-85", valor: "R$80", audio: "40 min", transcricao: "35 min", agentes: "5" },
  { feature: "TURBO", creditos: "1.600", roteiros: "80-150", valor: "R$100", audio: "1.5h", transcricao: "50+", agentes: "10" },
  { feature: "MASTER", creditos: "2.400", roteiros: "100-180", valor: "R$150", audio: "Ilimitado", transcricao: "Ilimitado", agentes: "15+" },
];

export default function PlansCredits() {
  const navigate = useNavigate();
  const { isSubscribed, planName: currentPlan, loading: subscriptionLoading } = useSubscription();
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchPlans();
    fetchCreditPackages();
    // Check for success/cancel params
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
      toast.success("Pagamento realizado com sucesso! Sua assinatura está ativa.");
      window.history.replaceState({}, '', '/plans');
    } else if (params.get('canceled') === 'true') {
      toast.info("Pagamento cancelado.");
      window.history.replaceState({}, '', '/plans');
    }
  }, []);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("plan_permissions")
        .select("*")
        .order("is_annual", { ascending: true })
        .order("monthly_credits", { ascending: true });

      if (error) throw error;
      const typedPlans: PlanData[] = (data || []).map(p => ({
        ...p,
        permissions: (p.permissions as Record<string, boolean>) || {}
      }));
      setPlans(typedPlans);
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCreditPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("credit_packages")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      setCreditPackages((data || []) as CreditPackage[]);
    } catch (error) {
      console.error("Error fetching credit packages:", error);
    }
  };

  // Handle plan subscription click
  const handleSubscribe = async (planName: string, isAnnual: boolean = false) => {
    if (planName === "Acesso Inicial" || planName === "FREE") {
      toast.success("Você já está no plano gratuito!");
      return;
    }

    const priceId = isAnnual ? ANNUAL_PRICE_IDS[planName] : MONTHLY_PRICE_IDS[planName];
    
    if (!priceId) {
      toast.warning("Este plano ainda não está configurado para pagamento.");
      return;
    }

    setCheckoutLoading(`${planName}-${isAnnual ? 'annual' : 'monthly'}`);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId, mode: 'subscription' }
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('URL de checkout não retornada');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || "Erro ao iniciar checkout. Tente novamente.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  // Handle credit package purchase
  const handleCreditPurchase = async (pkg: CreditPackage) => {
    // Check if user has active subscription
    if (!isSubscribed) {
      toast.error("Você precisa ter um plano pago ativo para comprar créditos adicionais.");
      return;
    }
    
    if (!pkg.stripe_price_id) {
      toast.warning("Pacote ainda não configurado para compra.");
      return;
    }

    setCheckoutLoading(`credits-${pkg.credits}`);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { priceId: pkg.stripe_price_id, mode: 'payment' }
      });

      if (error) throw error;
      
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('URL de checkout não retornada');
      }
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || "Erro ao iniciar checkout. Tente novamente.");
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <MainLayout>
      <SEOHead
        title="Planos e Créditos"
        description="Escolha seu plano e gerencie seus créditos para acessar todas as ferramentas."
        noindex={true}
      />
      <div className="min-h-screen bg-background relative overflow-hidden">
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {/* Animated gradient orbs */}
          <motion.div 
            className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, hsl(38, 92%, 50%, 0.08) 0%, transparent 60%)' }}
            animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div 
            className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, hsl(32, 95%, 45%, 0.06) 0%, transparent 60%)' }}
            animate={{ x: [0, -40, 0], y: [0, -20, 0], scale: [1, 1.15, 1] }}
            transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Floating particles */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-primary/30 rounded-full"
              style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
              animate={{ y: [0, -30, 0], opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 4 + Math.random() * 3, repeat: Infinity, delay: Math.random() * 3 }}
            />
          ))}
        </div>

        {/* Header */}
        <div className="sticky top-0 z-50 border-b border-border/50 backdrop-blur-xl bg-background/80">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-primary font-bold text-lg">La Casa Dark <span className="text-foreground">Core</span></span>
                <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
                  <a href="#mensais" className="hover:text-primary transition-colors">Mensais</a>
                  <a href="#anuais" className="hover:text-primary transition-colors">Anuais</a>
                  <a href="#pacotes" className="hover:text-primary transition-colors">Pacotes</a>
                  <a href="#comparacao" className="hover:text-primary transition-colors">Comparação</a>
                  <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
                </nav>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="border-primary/50 text-primary hover:bg-primary/10"
              >
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar
              </Button>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 space-y-20 relative z-10">
          {/* Hero Section */}
          <motion.section 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center space-y-6"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/40"
            >
              <Rocket className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-primary">PRIVATE CORE - Alocação de Recursos</span>
            </motion.div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-foreground">
              Defina sua <span className="bg-gradient-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent">Capacidade Operacional</span>
            </h1>
            
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Os créditos determinam o volume, frequência e complexidade das suas operações dentro do CORE.
            </p>

            <div className="flex flex-wrap justify-center gap-4 text-muted-foreground">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border/50">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm">Pagamento Seguro</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border/50">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm">Ativação Imediata</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/50 border border-border/50">
                <Star className="w-4 h-4 text-primary" />
                <span className="text-sm">Suporte 24/7</span>
              </div>
            </div>
          </motion.section>

          {/* Monthly Plans Section */}
          <section id="mensais" className="space-y-8 scroll-mt-24">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center space-y-3"
            >
              <div className="flex items-center justify-center gap-3">
                <motion.div 
                  className="w-3 h-3 rounded-full bg-primary"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Execução Recorrente <span className="text-primary">(Mensal)</span>
                </h2>
              </div>
              <p className="text-muted-foreground">Escolha a capacidade ideal para sua operação</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {MONTHLY_PLANS.map((plan, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ 
                    y: -8, 
                    scale: 1.02,
                    transition: { duration: 0.3, ease: "easeOut" } 
                  }}
                  className="group perspective-1000"
                >
                  <Card 
                    className={`relative overflow-hidden h-full backdrop-blur-sm transition-all duration-500 ${
                      plan.highlighted 
                        ? "border-2 border-primary bg-card/80 shadow-xl shadow-primary/20 group-hover:shadow-2xl group-hover:shadow-primary/40" 
                        : "border-border/50 bg-card/60 group-hover:border-primary/50 group-hover:shadow-xl group-hover:shadow-primary/10"
                    }`}
                  >
                    {/* Animated glow effect on hover */}
                    <motion.div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: 'radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.15) 0%, transparent 60%)',
                      }}
                    />
                    
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-hidden">
                      <motion.div
                        className="absolute inset-0 -translate-x-full"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                        style={{
                          background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.1), transparent)',
                          width: '50%',
                        }}
                      />
                    </div>

                    {plan.highlighted && (
                      <>
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-yellow-400 to-primary" />
                        {/* Pulsing glow for highlighted card */}
                        <motion.div 
                          className="absolute -inset-[1px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none -z-10"
                          style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.3), transparent, hsl(var(--primary) / 0.3))' }}
                          animate={{ opacity: [0.3, 0.6, 0.3] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </>
                    )}
                    {plan.badge && (
                      <motion.div 
                        className="absolute top-3 right-3"
                        whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 0.3 }}
                      >
                        <Badge className={`${plan.badge === "POPULAR" ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground"} text-xs`}>
                          {plan.badge}
                        </Badge>
                      </motion.div>
                    )}
                    <CardContent className="pt-8 pb-6 space-y-5 relative z-10">
                      <div className="space-y-3">
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors duration-300">{plan.name}</h3>
                        <Badge className={`transition-all duration-300 ${plan.highlighted ? "bg-primary/20 text-primary border-primary/30 group-hover:bg-primary/30" : "bg-secondary text-secondary-foreground group-hover:bg-primary/20 group-hover:text-primary"}`}>
                          <Zap className="w-3 h-3 mr-1 group-hover:animate-pulse" />
                          {plan.credits.toLocaleString()} créditos/mês
                        </Badge>
                        <motion.div 
                          className="flex items-baseline gap-2"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.2 }}
                        >
                          <span className="text-3xl font-black text-foreground">
                            R${plan.price.toFixed(2).replace(".", ",")}
                          </span>
                          <span className="text-sm text-muted-foreground">/mês</span>
                        </motion.div>
                        {plan.originalPrice && (
                          <span className="text-sm text-muted-foreground line-through">
                            R${plan.originalPrice.toFixed(2).replace(".", ",")}
                          </span>
                        )}
                      </div>

                      <ul className="space-y-2 text-sm">
                        {plan.features.map((feature, fIdx) => (
                          <motion.li 
                            key={fIdx} 
                            className="flex items-start gap-2"
                            initial={{ opacity: 1, x: 0 }}
                            whileHover={{ x: 4 }}
                            transition={{ duration: 0.2 }}
                          >
                            {feature.included ? (
                              <Check className="w-4 h-4 text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200" />
                            ) : (
                              <X className="w-4 h-4 text-muted-foreground/50 shrink-0 mt-0.5" />
                            )}
                            <span className={`transition-colors duration-200 ${feature.included ? "text-muted-foreground group-hover:text-foreground" : "text-muted-foreground/50"}`}>
                              {feature.label}
                            </span>
                          </motion.li>
                        ))}
                      </ul>

                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button 
                          className={`w-full transition-all duration-300 ${plan.highlighted ? "gradient-button text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/30" : "group-hover:border-primary group-hover:text-primary group-hover:bg-primary/10"}`}
                          variant={plan.highlighted ? "default" : "outline"}
                          onClick={() => handleSubscribe(plan.name, false)}
                          disabled={checkoutLoading === `${plan.name}-monthly`}
                        >
                          {checkoutLoading === `${plan.name}-monthly` ? (
                            <>Processando...</>
                          ) : (
                            <>
                              {plan.buttonLabel}
                              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Annual Plans Section */}
          <section id="anuais" className="space-y-8 scroll-mt-24">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center space-y-3"
            >
              <div className="flex items-center justify-center gap-3">
                <Crown className="w-6 h-6 text-primary" />
                <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                  Execução Prolongada <span className="text-primary">(Anual)</span>
                </h2>
                <Badge className="bg-success/20 text-success border-success/50">
                  Economize até 40%
                </Badge>
              </div>
              <p className="text-muted-foreground">Maximize seus resultados com economia significativa</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {ANNUAL_PLANS.map((plan, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ 
                    y: -8, 
                    scale: 1.02,
                    transition: { duration: 0.3, ease: "easeOut" } 
                  }}
                  className="group perspective-1000"
                >
                  <Card 
                    className={`relative overflow-hidden h-full backdrop-blur-sm transition-all duration-500 ${
                      plan.highlighted 
                        ? "border-2 border-primary bg-card/80 shadow-xl shadow-primary/20 group-hover:shadow-2xl group-hover:shadow-primary/40" 
                        : "border-border/50 bg-card/60 group-hover:border-primary/50 group-hover:shadow-xl group-hover:shadow-primary/10"
                    }`}
                  >
                    {/* Animated glow effect on hover */}
                    <motion.div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: 'radial-gradient(circle at 50% 0%, hsl(var(--primary) / 0.15) 0%, transparent 60%)',
                      }}
                    />
                    
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none overflow-hidden">
                      <motion.div
                        className="absolute inset-0 -translate-x-full"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                        style={{
                          background: 'linear-gradient(90deg, transparent, hsl(var(--primary) / 0.1), transparent)',
                          width: '50%',
                        }}
                      />
                    </div>

                    {plan.highlighted && (
                      <>
                        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-yellow-400 to-primary" />
                        {/* Pulsing glow for highlighted card */}
                        <motion.div 
                          className="absolute -inset-[1px] rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none -z-10"
                          style={{ background: 'linear-gradient(135deg, hsl(var(--primary) / 0.3), transparent, hsl(var(--primary) / 0.3))' }}
                          animate={{ opacity: [0.3, 0.6, 0.3] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                      </>
                    )}
                    {plan.badge && (
                      <motion.div 
                        className="absolute top-3 right-3"
                        whileHover={{ scale: 1.1, rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 0.3 }}
                      >
                        <Badge className={`${plan.badge === "MAIS VENDIDO" ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground"} text-xs`}>
                          {plan.badge}
                        </Badge>
                      </motion.div>
                    )}
                    <CardContent className="pt-8 pb-6 space-y-5 relative z-10">
                      <div className="space-y-3">
                        <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors duration-300">{plan.name}</h3>
                        <Badge className={`transition-all duration-300 ${plan.highlighted ? "bg-primary/20 text-primary border-primary/30 group-hover:bg-primary/30" : "bg-secondary text-secondary-foreground group-hover:bg-primary/20 group-hover:text-primary"}`}>
                          <Zap className="w-3 h-3 mr-1 group-hover:animate-pulse" />
                          {plan.credits.toLocaleString()} créditos/ano
                        </Badge>
                        <motion.div 
                          className="flex items-baseline gap-2"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.2 }}
                        >
                          <span className="text-3xl font-black text-foreground">
                            R${plan.price.toFixed(2).replace(".", ",")}
                          </span>
                          <span className="text-sm text-muted-foreground">/ano</span>
                        </motion.div>
                        <div className="flex flex-col gap-1">
                          <span className="text-sm text-muted-foreground line-through">
                            R${plan.originalPrice.toFixed(2).replace(".", ",")}
                          </span>
                          <motion.div 
                            className="flex items-center gap-1 text-sm text-success font-semibold"
                            whileHover={{ scale: 1.05 }}
                          >
                            <Rocket className="w-3 h-3 group-hover:animate-spin" />
                            Economia de R$ {plan.savings.toFixed(0)}/ano
                          </motion.div>
                        </div>
                      </div>

                      <ul className="space-y-2 text-sm">
                        {plan.features.map((feature, fIdx) => (
                          <motion.li 
                            key={fIdx} 
                            className="flex items-start gap-2"
                            initial={{ opacity: 1, x: 0 }}
                            whileHover={{ x: 4 }}
                            transition={{ duration: 0.2 }}
                          >
                            <Check className="w-4 h-4 text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform duration-200" />
                            <span className="text-muted-foreground group-hover:text-foreground transition-colors duration-200">{feature}</span>
                          </motion.li>
                        ))}
                      </ul>

                      <motion.div
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button 
                          className={`w-full transition-all duration-300 ${plan.highlighted ? "gradient-button text-primary-foreground group-hover:shadow-lg group-hover:shadow-primary/30" : "group-hover:border-primary group-hover:text-primary group-hover:bg-primary/10"}`}
                          variant={plan.highlighted ? "default" : "outline"}
                          onClick={() => handleSubscribe(plan.name, true)}
                          disabled={checkoutLoading === `${plan.name}-annual`}
                        >
                          {checkoutLoading === `${plan.name}-annual` ? (
                            <>Processando...</>
                          ) : (
                            <>
                              {plan.buttonLabel}
                              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                            </>
                          )}
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Credit Packages Section */}
          <section id="pacotes" className="space-y-8 scroll-mt-24">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center space-y-3"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground flex items-center justify-center gap-3">
                <Zap className="w-6 h-6 text-primary" />
                Expansão Pontual de Capacidade
              </h2>
              <p className="text-muted-foreground">Reforço adicional para picos de execução</p>
              
              {/* Warning for users without subscription */}
              {!subscriptionLoading && !isSubscribed && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-warning/10 border border-warning/30 text-warning"
                >
                  <Lock className="w-4 h-4" />
                  <span className="text-sm font-medium">Disponível apenas para assinantes de planos pagos</span>
                </motion.div>
              )}
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {creditPackages.map((pkg, idx) => (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ 
                    scale: 1.05,
                    y: -5,
                    transition: { duration: 0.25, ease: "easeOut" }
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="group cursor-pointer"
                >
                  <Card 
                    className={`text-center backdrop-blur-sm transition-all duration-400 ${idx === creditPackages.length - 1 ? "border-2 border-primary bg-card/80 shadow-lg shadow-primary/20 group-hover:shadow-2xl group-hover:shadow-primary/40" : "border-border/50 bg-card/60 group-hover:border-primary/50 group-hover:shadow-lg group-hover:shadow-primary/10"}`}
                  >
                    {/* Hover glow */}
                    <motion.div 
                      className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
                      style={{
                        background: 'radial-gradient(circle at 50% 50%, hsl(var(--primary) / 0.1) 0%, transparent 70%)',
                      }}
                    />
                    
                    <CardContent className="pt-6 pb-4 space-y-3 relative z-10">
                      <motion.div 
                        className="flex items-center justify-center gap-1"
                        whileHover={{ scale: 1.1 }}
                      >
                        <Zap className="w-4 h-4 text-primary group-hover:animate-pulse" />
                        <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors duration-200">
                          {pkg.credits.toLocaleString()}
                        </span>
                      </motion.div>
                      <motion.div 
                        className="text-2xl font-black text-foreground"
                        whileHover={{ scale: 1.05 }}
                      >
                        R$ {Number(pkg.price).toFixed(2).replace(".", ",")}
                      </motion.div>
                      <p className="text-xs text-muted-foreground group-hover:text-foreground/70 transition-colors duration-200">{pkg.label}</p>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className={`w-full text-xs border-primary/30 transition-all duration-300 ${isSubscribed ? 'group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary' : 'opacity-50 cursor-not-allowed'}`}
                          onClick={() => handleCreditPurchase(pkg)}
                          disabled={checkoutLoading === `credits-${pkg.credits}` || !pkg.stripe_price_id || !isSubscribed}
                        >
                          {!isSubscribed ? (
                            <><Lock className="w-3 h-3 mr-1" /> BLOQUEADO</>
                          ) : checkoutLoading === `credits-${pkg.credits}` ? (
                            "Processando..."
                          ) : pkg.stripe_price_id ? (
                            "ALOCAR"
                          ) : (
                            "EM BREVE"
                          )}
                        </Button>
                      </motion.div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          {/* Comparison Table */}
          <section id="comparacao" className="space-y-8 scroll-mt-24">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center space-y-3"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Comparação de Planos</h2>
              <p className="text-muted-foreground">Compare todos os planos em uma única tabela</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="border-border/50 bg-card/60 backdrop-blur-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border/50 bg-card/80">
                        <TableHead className="text-foreground font-semibold">Plano</TableHead>
                        <TableHead className="text-foreground font-semibold">Créditos</TableHead>
                        <TableHead className="text-foreground font-semibold">Roteiros/mês</TableHead>
                        <TableHead className="text-foreground font-semibold">Valor</TableHead>
                        <TableHead className="text-foreground font-semibold">Áudio</TableHead>
                        <TableHead className="text-foreground font-semibold">Transcrição</TableHead>
                        <TableHead className="text-foreground font-semibold">Agentes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {COMPARISON_DATA.map((row, idx) => (
                        <TableRow 
                          key={idx} 
                          className={`border-border/50 ${row.feature === "TURBO" ? "bg-primary/10" : ""}`}
                        >
                          <TableCell className={`font-semibold ${row.feature === "TURBO" ? "text-primary" : "text-foreground"}`}>
                            {row.feature}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{row.creditos}</TableCell>
                          <TableCell className="text-muted-foreground">{row.roteiros}</TableCell>
                          <TableCell className="text-muted-foreground">{row.valor}</TableCell>
                          <TableCell className="text-muted-foreground">{row.audio}</TableCell>
                          <TableCell className="text-muted-foreground">{row.transcricao}</TableCell>
                          <TableCell className="text-muted-foreground">{row.agentes}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </motion.div>
          </section>

          {/* FAQ Section */}
          <section id="faq" className="space-y-8 scroll-mt-24">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-foreground">Perguntas Frequentes</h2>
            </motion.div>

            <div className="max-w-2xl mx-auto space-y-4">
              {[
                { q: "Os créditos expiram?", a: "Créditos de planos mensais expiram ao final do ciclo. Créditos de pacotes avulsos não expiram.", highlight: false },
                { q: "Posso ajustar minha capacidade?", a: "Sim. Você pode fazer upgrade ou downgrade a qualquer momento conforme sua necessidade.", highlight: false },
                { q: "O que acontece ao atingir o limite?", a: "As execuções são pausadas até nova alocação de créditos ou renovação do plano.", highlight: false },
                { q: "Posso combinar planos e pacotes?", a: "Sim! Pacotes funcionam como reforço adicional sobre qualquer plano ativo.", highlight: true },
              ].map((faq, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  whileHover={{ 
                    scale: 1.02,
                    x: 8,
                    transition: { duration: 0.25, ease: "easeOut" }
                  }}
                  className="group cursor-pointer"
                >
                  <Card className={`backdrop-blur-sm overflow-hidden transition-all duration-300 ${faq.highlight ? "border-2 border-primary bg-card/80 group-hover:shadow-xl group-hover:shadow-primary/30" : "border-border/50 bg-card/60 group-hover:border-primary/50 group-hover:shadow-lg group-hover:shadow-primary/10"}`}>
                    {/* Hover glow effect */}
                    <motion.div 
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
                      style={{
                        background: faq.highlight 
                          ? 'linear-gradient(90deg, hsl(var(--primary) / 0.1) 0%, transparent 50%)'
                          : 'linear-gradient(90deg, hsl(var(--primary) / 0.05) 0%, transparent 50%)',
                      }}
                    />
                    
                    {/* Left accent line on hover */}
                    <motion.div 
                      className="absolute left-0 top-0 bottom-0 w-1 bg-primary origin-top scale-y-0 group-hover:scale-y-100 transition-transform duration-300"
                    />
                    
                    <CardContent className="p-5 relative z-10">
                      <h3 className={`font-semibold text-base mb-2 transition-colors duration-200 ${faq.highlight ? "text-primary" : "text-foreground group-hover:text-primary"}`}>
                        {faq.q}
                      </h3>
                      <p className="text-sm text-muted-foreground group-hover:text-foreground/80 transition-colors duration-200">{faq.a}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <motion.section 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center space-y-6 py-12"
          >
            <div className="relative inline-block">
              <motion.div 
                className="absolute -inset-4 bg-gradient-to-r from-primary/30 via-yellow-500/20 to-primary/30 rounded-3xl blur-2xl"
                animate={{ opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
              <div className="relative p-8 rounded-2xl bg-card/80 backdrop-blur-xl border border-primary/30">
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">Pronto para escalar?</h2>
                <p className="text-muted-foreground mb-6">
                  Escolha seu plano e comece a criar conteúdo profissional hoje mesmo.
                </p>
                <Button 
                  className="gradient-button text-primary-foreground px-8 h-12 text-base"
                  onClick={() => navigate('/dashboard')}
                >
                  <LayoutDashboard className="w-5 h-5 mr-2" />
                  Ver meu Dashboard
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </motion.section>

          {/* Footer */}
          <footer className="text-center space-y-4 py-8 border-t border-border/30">
            <p className="text-sm text-muted-foreground">
              Ambiente validado para execução em escala.
            </p>
            <p className="text-xs text-muted-foreground">
              © 2026 La Casa Dark Core. Todos os direitos reservados.
            </p>
          </footer>
        </div>
      </div>
    </MainLayout>
  );
}
