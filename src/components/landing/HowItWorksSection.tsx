import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Check } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Solicite Acesso",
    description: "Preencha o formulário e aguarde a validação da sua conta.",
    features: ["Análise de perfil", "Validação em 24h", "Onboarding exclusivo"],
  },
  {
    number: "02",
    title: "Configure seus Canais",
    description: "Conecte sua conta do YouTube e configure os parâmetros.",
    features: ["Integração automática", "Multi-canal", "Dashboard unificado"],
  },
  {
    number: "03",
    title: "Ative os Agentes",
    description: "Coloque os agentes para trabalhar e escale suas operações.",
    features: ["Automação 24/7", "IA avançada", "Escalabilidade"],
  },
  {
    number: "04",
    title: "Colete os Lucros",
    description: "Acompanhe seus ganhos crescerem enquanto os agentes trabalham.",
    features: ["Relatórios em tempo real", "Otimização contínua", "Suporte dedicado"],
  },
];

const HowItWorksSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  const lineHeight = useTransform(scrollYProgress, [0.1, 0.9], ["0%", "100%"]);

  return (
    <section id="como-funciona" ref={containerRef} className="py-24 relative overflow-hidden">
      {/* Background with animated orbs */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />
        <motion.div 
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(38, 92%, 50%, 0.08) 0%, transparent 60%)',
          }}
          animate={{
            x: [0, -30, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div 
          className="absolute bottom-0 left-0 w-[600px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(220, 80%, 50%, 0.05) 0%, transparent 60%)',
          }}
          animate={{
            x: [0, 30, 0],
            y: [0, -30, 0],
            scale: [1, 1.15, 1],
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
          className="text-center mb-20"
        >
          <motion.span 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium mb-4"
          >
            🚀 COMO FUNCIONA
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-4xl md:text-5xl font-bold mb-4"
          >
            Do zero ao lucro em
            <span className="text-gradient"> 4 passos</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            Um processo simples e comprovado para você começar a faturar com canais dark.
          </motion.p>
        </motion.div>

        <div className="relative">
          {/* Animated vertical line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border -translate-x-1/2 hidden lg:block">
            <motion.div
              style={{ height: lineHeight }}
              className="w-full bg-gradient-to-b from-primary via-primary to-primary/50"
            />
          </div>

          <div className="space-y-16 lg:space-y-24">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-16 ${
                  index % 2 === 1 ? "lg:flex-row-reverse" : ""
                }`}
              >
                {/* Content */}
                <div className="flex-1 lg:text-left text-center">
                  <div className={`${index % 2 === 1 ? "lg:text-right" : ""}`}>
                    <span className="text-6xl md:text-8xl font-black text-primary/20">
                      {step.number}
                    </span>
                    <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4 -mt-4">
                      {step.title}
                    </h3>
                    <p className="text-muted-foreground text-lg mb-6">
                      {step.description}
                    </p>
                    <div className={`flex flex-wrap gap-3 ${index % 2 === 1 ? "lg:justify-end" : ""} justify-center lg:justify-start`}>
                      {step.features.map((feature, fi) => (
                        <motion.span
                          key={feature}
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 + fi * 0.1 }}
                          whileHover={{ scale: 1.05 }}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm cursor-default"
                        >
                          <Check className="w-4 h-4" />
                          {feature}
                        </motion.span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Center dot */}
                <div className="relative hidden lg:flex items-center justify-center">
                  <motion.div
                    whileInView={{ scale: [0, 1.2, 1] }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="w-6 h-6 rounded-full bg-primary shadow-lg shadow-primary/50"
                  />
                  <div className="absolute w-12 h-12 rounded-full bg-primary/20 animate-ping" />
                </div>

                {/* Spacer for alignment */}
                <div className="flex-1 hidden lg:block" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
