import { motion } from "framer-motion";
import { Play, Zap, Rocket, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useLandingSettings } from "@/hooks/useLandingSettings";
import videoCover from "@/assets/video-cover-futuristic.jpg";

const VideoShowcaseSection = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const { settings } = useLandingSettings();
  const [thumbnailSrc, setThumbnailSrc] = useState(() =>
    settings.videoId
      ? `https://img.youtube.com/vi/${settings.videoId}/maxresdefault.jpg`
      : videoCover
  );

  useEffect(() => {
    setThumbnailSrc(
      settings.videoId
        ? `https://img.youtube.com/vi/${settings.videoId}/maxresdefault.jpg`
        : videoCover
    );
  }, [settings.videoId]);


  return (
    <section id="demo" className="py-24 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/30 to-background" />
        
        {/* Animated gradient orbs */}
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] rounded-full"
          style={{
            background: 'radial-gradient(ellipse, hsl(38, 92%, 50%, 0.1) 0%, transparent 60%)',
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.5, 0.8, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div 
          className="absolute top-1/4 right-0 w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(32, 95%, 50%, 0.1) 0%, transparent 70%)',
          }}
          animate={{
            x: [0, -30, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div 
          className="absolute bottom-1/4 left-0 w-[400px] h-[400px] rounded-full"
          style={{
            background: 'radial-gradient(circle, hsl(45, 90%, 50%, 0.08) 0%, transparent 70%)',
          }}
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/50 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -50, 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 4 + Math.random() * 3,
              repeat: Infinity,
              delay: Math.random() * 3,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center mb-12"
        >
          <motion.span 
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            whileInView={{ opacity: 1, scale: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 text-primary text-sm font-bold mb-6"
          >
            <Rocket className="w-4 h-4" />
            {settings.videoSectionBadge}
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black mb-4"
          >
            {settings.videoSectionTitle}
            <span className="block text-gradient mt-2">{settings.videoSectionHighlight}</span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            {settings.videoSectionSubtitle}
          </motion.p>
        </motion.div>

        {/* Video Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative max-w-5xl mx-auto"
        >
          {/* Animated outer glow */}
          <motion.div 
            className="absolute -inset-4 bg-gradient-to-r from-primary/30 via-orange-500/20 to-yellow-500/30 rounded-3xl blur-2xl"
            animate={{
              opacity: [0.4, 0.7, 0.4],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
          
          {/* Video frame */}
          <div className="relative rounded-2xl overflow-hidden border-2 border-primary/30 bg-card/80 backdrop-blur-xl shadow-2xl shadow-primary/20">
            {/* Premium border glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-orange-500/10" />
            
            {/* Video placeholder - replace with actual video */}
            <div className="relative aspect-video bg-gradient-to-br from-card via-background to-card flex items-center justify-center">
                  {!isPlaying ? (
                    <>
                      {/* Custom cover image - La Casa Dark Core themed */}
                      <img 
                        src={settings.videoId 
                          ? `https://img.youtube.com/vi/${settings.videoId}/maxresdefault.jpg`
                          : videoCover
                        }
                        alt="Video thumbnail"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
                      
                      {/* Animated background pattern */}
                      <div className="absolute inset-0 opacity-10">
                        <div className="absolute inset-0" style={{
                          backgroundImage: `radial-gradient(circle at 2px 2px, hsl(var(--primary)) 1px, transparent 1px)`,
                          backgroundSize: '40px 40px'
                        }} />
                      </div>
                      
                      {/* Play button */}
                      <motion.button
                        onClick={() => setIsPlaying(true)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="relative z-10 group"
                      >
                        <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                        <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-primary via-orange-500 to-yellow-500 flex items-center justify-center shadow-2xl shadow-primary/50 group-hover:shadow-primary/70 transition-all">
                          <Play className="w-10 h-10 sm:w-14 sm:h-14 text-white fill-white ml-2" />
                        </div>
                        {/* Ripple effect */}
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-primary/50"
                          animate={{ scale: [1, 1.5, 1.5], opacity: [0.5, 0, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-primary/30"
                          animate={{ scale: [1, 1.8, 1.8], opacity: [0.3, 0, 0] }}
                          transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                        />
                      </motion.button>
                      
                      {/* Video info overlay */}
                      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between">
                        <div>
                          <p className="text-sm text-primary font-bold mb-1">DEMONSTRAÇÃO COMPLETA</p>
                          <p className="text-xs text-muted-foreground">Duração: {settings.videoDuration}</p>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Zap className="w-4 h-4 text-primary" />
                          <span>Tour pelas funcionalidades</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* YouTube embed */
                    settings.videoId ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${settings.videoId}?autoplay=1&rel=0`}
                        title="Demonstração La Casa Dark Core"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-black text-muted-foreground">
                        <p className="text-center">
                          <span className="block text-2xl mb-2">🎬</span>
                          Nenhum vídeo configurado
                          <br />
                          <span className="text-xs">(Configure no painel admin)</span>
                        </p>
                      </div>
                    )
                  )}
            </div>
            
            {/* Bottom info bar */}
            <div className="p-4 sm:p-6 bg-card/90 border-t border-border/30">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-lg mb-1">Tour Completo das Funcionalidades</h3>
                  <p className="text-sm text-muted-foreground">
                    Veja como criar conteúdo viral em minutos com IA avançada
                  </p>
                </div>
                <Button variant="hero" size="sm" className="group shrink-0" asChild>
                  <a href="/auth">
                    <Zap className="w-4 h-4" />
                    Começar Agora
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Feature highlights below video */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
        >
          {[
            { label: "Geração de Roteiros", value: "IA" },
            { label: "Thumbnails Premium", value: "4x" },
            { label: "Automação Total", value: "24/7" },
            { label: "Analytics Avançado", value: "Real-time" },
          ].map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="text-center p-4 rounded-xl bg-card/50 border border-border/30 hover:border-primary/30 transition-colors"
            >
              <p className="text-2xl font-black text-gradient mb-1">{item.value}</p>
              <p className="text-xs text-muted-foreground">{item.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default VideoShowcaseSection;
