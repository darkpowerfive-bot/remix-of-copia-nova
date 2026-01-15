import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Diamond, CheckCircle } from "lucide-react";

// Use existing dream images from assets
import lifestyleCard from "@/assets/dreams/credit-card.jpg";
import lifestyleTravel from "@/assets/dreams/first-class.jpg";
import lifestyleCar from "@/assets/dreams/luxury-car.jpg";
import lifestyleHouse from "@/assets/dreams/luxury-mansion.jpg";
import lifestyleWatch from "@/assets/dreams/luxury-watch.jpg";
import lifestyleFreedom from "@/assets/dreams/freedom-beach.jpg";

const lifestyleItems = [
  {
    image: lifestyleCard,
    title: "Cartão Black Ilimitado",
    description: "Acesso a benefícios exclusivos e limites sem preocupação",
  },
  {
    image: lifestyleTravel,
    title: "Viagens Primeira Classe",
    description: "Conheça o mundo com conforto e exclusividade",
  },
  {
    image: lifestyleCar,
    title: "Carros dos Sonhos",
    description: "Porsche, BMW, Mercedes... a escolha é sua",
  },
  {
    image: lifestyleHouse,
    title: "Imóvel de Luxo",
    description: "Penthouse com vista para o mar ou mansão",
  },
  {
    image: lifestyleWatch,
    title: "Relógios de Luxo",
    description: "Rolex, Patek Philippe, Audemars Piguet",
  },
  {
    image: lifestyleFreedom,
    title: "Liberdade Geográfica",
    description: "Trabalhe de qualquer lugar paradisíaco",
  },
];

const LifestyleSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-16 sm:py-20 md:py-24 relative overflow-hidden">
      {/* Premium Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(38, 92%, 50%, 0.12) 0%, transparent 60%)',
          }}
          animate={{
            scale: [1, 1.15, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        {/* Moving gradient orbs */}
        <motion.div 
          className="absolute top-1/4 left-1/4 w-[300px] h-[300px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(45, 90%, 55%, 0.08) 0%, transparent 70%)',
          }}
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
          animate={isInView ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-10 sm:mb-16"
        >
          <motion.span 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 rounded-full bg-gradient-to-r from-primary/20 to-yellow-500/20 border border-primary/30 text-primary text-xs sm:text-sm font-bold mb-4 sm:mb-6 backdrop-blur-sm"
            whileHover={{ scale: 1.05 }}
          >
            <Diamond className="w-3 h-3 sm:w-4 sm:h-4" />
            REALIZE SEUS SONHOS
            <Diamond className="w-3 h-3 sm:w-4 sm:h-4" />
          </motion.span>
          
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4 sm:mb-6"
          >
            O Que Você Pode
            <span className="block mt-2 sm:mt-3 bg-gradient-to-r from-primary via-yellow-400 to-primary bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              Conquistar Com YouTube
            </span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-muted-foreground text-sm sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed px-4"
          >
            Dedicando apenas <span className="text-primary font-bold">2 a 3 horas por dia</span>, você pode transformar 
            sua vida e conquistar tudo isso com canais Dark no YouTube.
          </motion.p>
        </motion.div>

        {/* Image Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {lifestyleItems.map((item, index) => (
            <motion.a
              key={item.title}
              href="/auth"
              initial={{ opacity: 0, y: 60, scale: 0.85, rotateX: 15 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1, rotateX: 0 } : {}}
              transition={{ 
                duration: 0.7, 
                delay: 0.5 + index * 0.12,
                ease: [0.22, 1, 0.36, 1]
              }}
              whileHover={{ y: -12, scale: 1.03 }}
              className="group cursor-pointer"
            >
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-card border border-border hover:border-primary/50 transition-all duration-300">
                {/* Image */}
                <img 
                  src={item.image} 
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                  <h3 className="font-bold text-sm sm:text-lg text-white mb-1 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[11px] sm:text-sm text-white/70 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Hover Glow */}
                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </motion.a>
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-10 sm:mt-16 text-center"
        >
          <p className="text-xl sm:text-2xl md:text-3xl font-bold mb-4">
            Tudo isso é <span className="text-primary italic">possível</span> para você
          </p>
          <p className="text-muted-foreground text-sm sm:text-base mb-8">
            Milhares de criadores já estão vivendo esse estilo de vida
          </p>
          
          {/* Test CTA with gradient border */}
          <motion.a
            href="/auth"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 1 }}
            whileHover={{ scale: 1.02 }}
            className="relative inline-flex items-center gap-3 px-8 py-5 rounded-xl cursor-pointer group"
          >
            {/* Gradient border effect */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary via-yellow-600 to-primary p-[1px]">
              <div className="absolute inset-[1px] rounded-xl bg-card" />
            </div>
            
            {/* Content */}
            <div className="relative flex items-center gap-3">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              <span className="text-sm sm:text-base md:text-lg font-medium">
                <span className="text-primary font-bold">Faça o teste</span> e comprove você mesmo os resultados
              </span>
            </div>
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default LifestyleSection;