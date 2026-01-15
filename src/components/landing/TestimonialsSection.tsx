import { motion } from "framer-motion";
import { Star, Quote, TrendingUp, DollarSign, Youtube } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const testimonials = [
  {
    name: "Rafael Costa",
    role: "Empresário",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    content: "Em 3 meses consegui escalar de 0 para $8,000/mês. As ferramentas de automação são insanas.",
    revenue: "$8,200/mês",
    channels: 4,
    growth: "+340%",
  },
  {
    name: "Marina Silva",
    role: "Publicitária",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    content: "A análise de nichos me ajudou a encontrar oportunidades que ninguém estava explorando. Hoje faturo 5 dígitos.",
    revenue: "$12,500/mês",
    channels: 7,
    growth: "+520%",
  },
  {
    name: "Lucas Mendes",
    role: "Advogado",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    content: "Gerencio 15 canais com a mesma equipe que antes cuidava de 3. A eficiência é absurda.",
    revenue: "$45,000/mês",
    channels: 15,
    growth: "+890%",
  },
  {
    name: "Ana Beatriz",
    role: "Médica",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    content: "O gerador de voz economiza 20 horas por semana da minha equipe. ROI absurdo.",
    revenue: "$18,300/mês",
    channels: 9,
    growth: "+670%",
  },
  {
    name: "Pedro Alves",
    role: "Engenheiro",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face",
    content: "Comecei do zero, sem experiência. Em 6 meses já estava vivendo apenas dos canais.",
    revenue: "$6,800/mês",
    channels: 3,
    growth: "+∞",
  },
  {
    name: "Juliana Santos",
    role: "Arquiteta",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face",
    content: "O suporte no Telegram é incrível. Sempre que tenho dúvidas, resolvem em minutos.",
    revenue: "$22,100/mês",
    channels: 12,
    growth: "+445%",
  },
];

const TestimonialsSection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const duplicatedTestimonials = [...testimonials, ...testimonials];

  // Intersection Observer - only animate when visible
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const shouldAnimate = isVisible && !isPaused;

  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-medium mb-4">
            ⭐ DEPOIMENTOS REAIS
          </span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Histórias de
            <span className="text-gradient"> Sucesso</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Veja o que nossos membros estão conquistando com o La Casa Dark CORE.
          </p>
        </motion.div>
      </div>

      {/* Carousel - CSS animation for GPU acceleration */}
      <div 
        ref={containerRef}
        className="relative overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <style>{`
          @keyframes scrollTestimonials2 {
            from { transform: translateX(0); }
            to { transform: translateX(-50%); }
          }
          .testimonial-track-2 {
            animation: scrollTestimonials2 50s linear infinite;
            will-change: transform;
          }
          .testimonial-paused-2 {
            animation-play-state: paused;
          }
        `}</style>

        {/* Gradient masks */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
        
        <div 
          className={`flex gap-6 py-4 px-6 testimonial-track-2 ${!shouldAnimate ? 'testimonial-paused-2' : ''}`}
          style={{ width: 'max-content' }}
        >
          {duplicatedTestimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              whileHover={{ y: -5 }}
              className="flex-shrink-0 w-[400px] p-6 rounded-2xl bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/40 transition-all"
            >
              {/* Quote */}
              <div className="flex items-start gap-3 mb-6">
                <Quote className="w-8 h-8 text-primary/40 flex-shrink-0" />
                <p className="text-foreground leading-relaxed">
                  "{testimonial.content}"
                </p>
              </div>

              {/* Stats */}
              <div className="flex gap-3 mb-6 flex-wrap">
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 text-sm font-semibold">
                  <DollarSign className="w-4 h-4" />
                  {testimonial.revenue}
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-card border border-border text-sm">
                  <Youtube className="w-4 h-4" />
                  {testimonial.channels} canais
                </span>
                <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/20 text-primary text-sm font-semibold">
                  <TrendingUp className="w-4 h-4" />
                  {testimonial.growth}
                </span>
              </div>

              {/* Author */}
              <div className="flex items-center gap-4 pt-4 border-t border-border/50">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <p className="font-bold text-foreground">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
                <div className="ml-auto flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
