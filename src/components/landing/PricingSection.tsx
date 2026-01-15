import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Zap, Crown, Rocket, Star, Battery, HardDrive } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Acesso Inicial",
    icon: Zap,
    credits: "100 créditos/mês",
    subtitle: "Recursos limitados",
    features: [
      "Ambiente de avaliação",
      "Execuções básicas limitadas",
      "Análise de vídeos (restrita)",
      "Criação de agentes (1 agente)",
      "Geração de títulos e thumbnails (limitado)",
    ],
    cta: "ATIVAR ACESSO INICIAL",
    popular: false,
  },
  {
    name: "START CREATOR",
    icon: Star,
    credits: "1.000 créditos/mês",
    subtitle: null,
    features: [
      "30-50 execuções mensais",
      "Processamento de vídeo até ~200 min",
      "Até 5 agentes operacionais",
      "Analisador de vídeos",
      "Integração YouTube",
      "Armazenamento: 10 GB",
    ],
    cta: "ATIVAR CAPACIDADE",
    popular: false,
  },
  {
    name: "TURBO MAKER",
    icon: Rocket,
    credits: "2.500 créditos/mês",
    subtitle: null,
    features: [
      "60-125 execuções mensais",
      "Processamento de vídeo até ~500 min",
      "Até 15 agentes operacionais",
      "Biblioteca de títulos premium",
      "Análise avançada de canais",
      "Armazenamento: 20 GB",
    ],
    cta: "HABILITAR EXECUÇÃO",
    popular: true,
    highlight: "MAIS POPULAR",
  },
  {
    name: "MASTER PRO",
    icon: Crown,
    credits: "5.000 créditos/mês",
    subtitle: null,
    features: [
      "120-250 execuções mensais",
      "Processamento de vídeo até ~1.000 min",
      "Agentes ilimitados",
      "Todas as funcionalidades premium",
      "Suporte prioritário",
      "Armazenamento: 50 GB",
    ],
    cta: "ATIVAR MODO MASTER",
    popular: false,
    highlight: "COMPLETO",
  },
];

const creditPacks = [
  { credits: 500, bonus: 0, popular: false },
  { credits: 1000, bonus: 100, popular: false },
  { credits: 2500, bonus: 375, popular: true },
  { credits: 5000, bonus: 1000, popular: false },
  { credits: 10000, bonus: 2500, popular: false },
];

const PricingSection = () => {
  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      {/* Background with animated orbs */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background" />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(38, 92%, 50%, 0.08) 0%, transparent 50%)',
          }}
          animate={{
            scale: [1, 1.1, 1],
            rotate: [0, 5, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div 
          className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(45, 90%, 50%, 0.06) 0%, transparent 70%)',
          }}
          animate={{
            x: [0, 40, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-16"
        >
          <motion.span 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium mb-4"
          >
            💎 PLANOS E CAPACIDADE
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Escolha sua
            <span className="text-gradient"> Capacidade</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            Planos flexíveis que escalam com seu negócio. Comece pequeno, cresça grande.
          </motion.p>
        </motion.div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ 
                duration: 0.6, 
                delay: 0.4 + index * 0.12,
                ease: [0.22, 1, 0.36, 1]
              }}
              whileHover={{ y: -12, scale: 1.03 }}
              className={`relative p-6 rounded-2xl border transition-all overflow-hidden ${
                plan.popular
                  ? "bg-gradient-to-b from-primary/15 to-card border-primary/50 shadow-lg shadow-primary/20"
                  : "bg-card/60 backdrop-blur-sm border-border/50 hover:border-primary/30"
              }`}
            >
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute inset-0 animate-shimmer" />
              </div>
              {/* Highlight badge */}
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  {plan.highlight}
                </span>
              )}

              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                plan.popular
                  ? "bg-gradient-primary"
                  : "bg-primary/10"
              }`}>
                <plan.icon className={`w-6 h-6 ${plan.popular ? "text-primary-foreground" : "text-primary"}`} />
              </div>

              {/* Name & Credits */}
              <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
              <p className="text-primary font-semibold mb-4">{plan.credits}</p>
              {plan.subtitle && (
                <p className="text-xs text-muted-foreground mb-4">{plan.subtitle}</p>
              )}

              {/* Features */}
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <Link to="/auth" className="block">
                <Button
                  variant={plan.popular ? "hero" : "outline"}
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Credit Packs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h3 className="text-2xl font-bold text-foreground mb-2">
            Pacotes de <span className="text-gradient">Créditos Extras</span>
          </h3>
          <p className="text-muted-foreground">
            Precisa de mais capacidade? Adquira pacotes avulsos.
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-4">
          {creditPacks.map((pack, index) => (
            <motion.div
              key={pack.credits}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.05 }}
              className={`px-6 py-4 rounded-xl border transition-all cursor-pointer ${
                pack.popular
                  ? "bg-primary/10 border-primary/50"
                  : "bg-card/50 border-border/50 hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Battery className="w-4 h-4 text-primary" />
                <span className="font-bold text-foreground">{pack.credits.toLocaleString()}</span>
              </div>
              {pack.bonus > 0 && (
                <span className="text-xs text-emerald-400">+{pack.bonus} bônus</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
