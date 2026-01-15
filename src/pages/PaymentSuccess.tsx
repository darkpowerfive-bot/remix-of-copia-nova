import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SEOHead } from "@/components/seo/SEOHead";
import { 
  CheckCircle2, 
  Zap, 
  ArrowRight, 
  LayoutDashboard,
  Rocket,
  Crown,
  Star
} from "lucide-react";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  const nextSteps = [
    {
      icon: LayoutDashboard,
      title: "Acesse seu Dashboard",
      description: "Seus novos créditos já estão disponíveis para uso imediato"
    },
    {
      icon: Zap,
      title: "Comece a Produzir",
      description: "Use as ferramentas de IA para criar conteúdo viral"
    },
    {
      icon: Star,
      title: "Explore Recursos Premium",
      description: "Desbloqueie agentes avançados e funcionalidades exclusivas"
    },
  ];

  return (
    <>
      <SEOHead
        title="Pagamento Confirmado"
        description="Sua assinatura foi ativada com sucesso."
        noindex={true}
      />
      <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[600px] h-[600px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(142, 76%, 36%, 0.15) 0%, transparent 60%)' }}
          animate={{ x: [0, 50, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div 
          className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, hsl(38, 92%, 50%, 0.1) 0%, transparent 60%)' }}
          animate={{ x: [0, -40, 0], y: [0, -20, 0], scale: [1, 1.15, 1] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        
        {/* Confetti-like particles */}
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full"
            style={{ 
              left: `${Math.random() * 100}%`, 
              top: `${Math.random() * 100}%`,
              background: i % 3 === 0 ? 'hsl(var(--primary))' : i % 3 === 1 ? 'hsl(142, 76%, 36%)' : 'hsl(38, 92%, 50%)'
            }}
            animate={{ 
              y: [0, -50, 0], 
              opacity: [0, 0.8, 0],
              scale: [0, 1, 0]
            }}
            transition={{ 
              duration: 2 + Math.random() * 2, 
              repeat: Infinity, 
              delay: Math.random() * 3,
              ease: "easeOut"
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-2xl"
      >
        <Card className="border-2 border-green-500/30 bg-card/90 backdrop-blur-xl shadow-2xl shadow-green-500/10 overflow-hidden">
          {/* Top gradient bar */}
          <div className="h-1.5 bg-gradient-to-r from-green-500 via-primary to-green-500" />
          
          <CardContent className="pt-10 pb-8 px-8 space-y-8 text-center">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="relative mx-auto w-24 h-24"
            >
              <motion.div
                className="absolute inset-0 rounded-full bg-green-500/20"
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-green-500 to-green-600 shadow-lg shadow-green-500/30">
                <CheckCircle2 className="w-12 h-12 text-white" />
              </div>
            </motion.div>

            {/* Success Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <h1 className="text-3xl md:text-4xl font-black text-foreground">
                Pagamento <span className="text-green-500">Confirmado!</span>
              </h1>
              <p className="text-lg text-muted-foreground">
                Sua assinatura foi ativada com sucesso. Bem-vindo ao <span className="text-primary font-semibold">CORE</span>!
              </p>
            </motion.div>

            {/* Visual Confirmation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center justify-center gap-3 py-4"
            >
              <motion.div
                animate={{ rotate: [0, 360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Rocket className="w-6 h-6 text-primary" />
              </motion.div>
              <span className="text-xl font-bold text-foreground">
                Seus créditos já estão disponíveis!
              </span>
              <motion.div
                animate={{ rotate: [0, -360] }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              >
                <Rocket className="w-6 h-6 text-primary" />
              </motion.div>
            </motion.div>

            {/* Next Steps */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-4"
            >
              <h3 className="text-lg font-bold text-foreground flex items-center justify-center gap-2">
                <Rocket className="w-5 h-5 text-primary" />
                Próximos Passos
              </h3>
              
              <div className="grid gap-3">
                {nextSteps.map((step, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + idx * 0.1 }}
                    className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 border border-border/50 text-left hover:border-primary/30 transition-colors"
                  >
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <step.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground">{step.title}</h4>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              className="space-y-4 pt-4"
            >
              <Button 
                size="lg"
                className="w-full gradient-button text-primary-foreground font-bold text-lg py-6"
                onClick={() => navigate('/dashboard')}
              >
                <LayoutDashboard className="w-5 h-5 mr-2" />
                Ir para o Dashboard
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <p className="text-sm text-muted-foreground">
                Redirecionando automaticamente em <span className="text-primary font-bold">{countdown}s</span>
              </p>
            </motion.div>

            {/* Footer note */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="pt-4 border-t border-border/50"
            >
              <p className="text-xs text-muted-foreground">
                Um email de confirmação foi enviado para sua caixa de entrada. 
                Se precisar de ajuda, entre em contato com nosso suporte.
              </p>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
    </>
  );
}
