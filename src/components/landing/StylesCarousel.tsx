import { useRef, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette, Rocket, ArrowRight, Eye, Zap, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { AnimatedSection } from "./AnimatedSection";
import { Dialog, DialogContent } from "@/components/ui/dialog";

// Import style preview images - Row 1
import preview3DCinematic from "@/assets/style-previews/3d-cinematic-miniature.jpg";
import previewCinematografico from "@/assets/style-previews/cinematografico.jpg";
import previewAnime from "@/assets/style-previews/anime.jpg";
import previewNeonCyberpunk from "@/assets/style-previews/neon-cyberpunk.jpg";
import previewNoirClassico from "@/assets/style-previews/noir-classico.jpg";
import previewDiorama from "@/assets/style-previews/diorama-cinematografico.jpg";
import previewPixar from "@/assets/style-previews/pixar-disney.jpg";
import previewVaporwave from "@/assets/style-previews/vaporwave.jpg";
import previewDoubleExposure from "@/assets/style-previews/double-exposure.jpg";
import previewDreamworks from "@/assets/style-previews/dreamworks-style.jpg";
import preview3DViralMinimalista from "@/assets/style-previews/3d-viral-minimalista.jpg";
import previewPaperCraft from "@/assets/style-previews/paper-craft-3d.jpg";

// Import style preview images - Row 2
import previewTerrorAnalogico from "@/assets/style-previews/terror-analogico.jpg";
import previewSurrealismo from "@/assets/style-previews/surrealismo-psicologico.jpg";
import previewFantasia from "@/assets/style-previews/fantasia.jpg";
import previewApocaliptico from "@/assets/style-previews/apocaliptico.jpg";
import previewComicBook from "@/assets/style-previews/comic-book.jpg";
import previewGoticoVitoriano from "@/assets/style-previews/gotico-vitoriano.jpg";
import previewSynthwave from "@/assets/style-previews/synthwave.jpg";
import previewUnrealEngine from "@/assets/style-previews/unreal-engine.jpg";
import previewOleoClassico from "@/assets/style-previews/oleo-classico.jpg";
import previewAquarela from "@/assets/style-previews/aquarela-digital.jpg";
import previewNeonTokyo from "@/assets/style-previews/neon-tokyo.jpg";
import previewClaymation from "@/assets/style-previews/claymation-3d.jpg";

// Import style preview images - Row 3 (Minimalistas & Experimentais)
import previewFlatDesign from "@/assets/style-previews/flat-design.jpg";
import previewLineArt from "@/assets/style-previews/line-art.jpg";
import previewGlitchArt from "@/assets/style-previews/glitch-art.jpg";
import previewVoxelArt from "@/assets/style-previews/voxel-art.jpg";
import previewInfravermelho from "@/assets/style-previews/infravermelho.jpg";
import previewBauhaus from "@/assets/style-previews/bauhaus.jpg";
import previewPopArt from "@/assets/style-previews/pop-art.jpg";
import previewDataflow from "@/assets/style-previews/dataflow.jpg";
import previewMemoriaFragmentada from "@/assets/style-previews/memoria-fragmentada.jpg";
import previewIsometrico from "@/assets/style-previews/isometrico-arquitetonico.jpg";
import previewVHSNostalgico from "@/assets/style-previews/vhs-nostalgico.jpg";
import previewNarrativaFragmentada from "@/assets/style-previews/narrativa-fragmentada.jpg";

// Row 1 styles (left to right) - 12 estilos variados
const stylesRow1 = [
  { id: "3d-cinematic", name: "3D Cinematográfico", image: preview3DCinematic, category: "3D", description: "Miniaturas hiper-detalhadas com iluminação dramática e profundidade cinematográfica" },
  { id: "cinematografico", name: "Cinematográfico", image: previewCinematografico, category: "Realista", description: "Estética de cinema hollywoodiano com composição e cor profissionais" },
  { id: "anime", name: "Anime", image: previewAnime, category: "Artístico", description: "Traços fluidos e expressivos inspirados em animação japonesa" },
  { id: "neon-cyberpunk", name: "Neon Cyberpunk", image: previewNeonCyberpunk, category: "Vibrante", description: "Luzes néon vibrantes em cenários urbanos futuristas" },
  { id: "noir-classico", name: "Noir Clássico", image: previewNoirClassico, category: "Dramático", description: "Alto contraste P&B com sombras expressivas e atmosfera misteriosa" },
  { id: "diorama", name: "Diorama", image: previewDiorama, category: "Experimental", description: "Cenas em miniatura com efeito tilt-shift e detalhes intrincados" },
  { id: "pixar", name: "Pixar/Disney", image: previewPixar, category: "3D", description: "Personagens expressivos com visual polido de animação 3D" },
  { id: "vaporwave", name: "Vaporwave", image: previewVaporwave, category: "Vibrante", description: "Estética retrô-futurista com cores pastel e elementos 80s/90s" },
  { id: "double-exposure", name: "Double Exposure", image: previewDoubleExposure, category: "Experimental", description: "Sobreposição artística de duas imagens criando efeito visual único" },
  { id: "dreamworks", name: "DreamWorks", image: previewDreamworks, category: "3D", description: "Estilo de animação 3D com personagens carismáticos e expressivos" },
  { id: "3d-viral-minimalista", name: "3D Viral Time Lapse", image: preview3DViralMinimalista, category: "3D", description: "Time lapse cinematográfico com transições dia/noite e cenas em evolução" },
  { id: "paper-craft", name: "Paper Craft 3D", image: previewPaperCraft, category: "3D", description: "Cenas recortadas em papel com camadas e profundidade artesanal" },
];

// Row 2 styles (right to left) - 12 estilos variados
const stylesRow2 = [
  { id: "terror", name: "Terror Analógico", image: previewTerrorAnalogico, category: "Dramático", description: "Atmosfera perturbadora com grão de filme e degradação visual" },
  { id: "surrealismo", name: "Surrealismo", image: previewSurrealismo, category: "Experimental", description: "Composições oníricas que desafiam a realidade e a lógica" },
  { id: "fantasia", name: "Fantasia", image: previewFantasia, category: "Artístico", description: "Mundos mágicos com criaturas e paisagens encantadas" },
  { id: "apocaliptico", name: "Apocalíptico", image: previewApocaliptico, category: "Dramático", description: "Cenários pós-apocalípticos com atmosfera desoladora e épica" },
  { id: "comic", name: "Comic Book", image: previewComicBook, category: "Artístico", description: "Traços bold com cores vibrantes estilo HQ americana" },
  { id: "gotico", name: "Gótico Vitoriano", image: previewGoticoVitoriano, category: "Dramático", description: "Arquitetura sombria com elementos românticos e misteriosos" },
  { id: "synthwave", name: "Synthwave", image: previewSynthwave, category: "Vibrante", description: "Néon e gradientes com estética retrofuturista dos anos 80" },
  { id: "unreal", name: "Unreal Engine", image: previewUnrealEngine, category: "3D", description: "Realismo fotográfico com iluminação e texturas de alta fidelidade" },
  { id: "oleo-classico", name: "Óleo Clássico", image: previewOleoClassico, category: "Artístico", description: "Pintura renascentista com técnica de mestres clássicos" },
  { id: "aquarela", name: "Aquarela Digital", image: previewAquarela, category: "Artístico", description: "Pinceladas suaves e fluidas com cores delicadas" },
  { id: "neon-tokyo", name: "Neon Tokyo", image: previewNeonTokyo, category: "Vibrante", description: "Luzes noturnas de Tóquio com estética urbana japonesa" },
  { id: "claymation", name: "Claymation 3D", image: previewClaymation, category: "3D", description: "Animação em massa de modelar com textura artesanal" },
];

// Row 3 styles (left to right) - 12 estilos minimalistas e experimentais
const stylesRow3 = [
  { id: "flat-design", name: "Flat Design", image: previewFlatDesign, category: "Minimalista", description: "Vetorial moderno com cores sólidas e formas limpas" },
  { id: "line-art", name: "Line Art", image: previewLineArt, category: "Minimalista", description: "Traços finos e elegantes com estética sofisticada" },
  { id: "glitch-art", name: "Glitch Art", image: previewGlitchArt, category: "Experimental", description: "Erros digitais transformados em arte visual impactante" },
  { id: "voxel-art", name: "Voxel Art", image: previewVoxelArt, category: "3D", description: "Estética pixelada em 3D com cubos estilizados" },
  { id: "infravermelho", name: "Infravermelho", image: previewInfravermelho, category: "Experimental", description: "Cores surreais captadas além do espectro visível" },
  { id: "bauhaus", name: "Bauhaus", image: previewBauhaus, category: "Minimalista", description: "Design funcional alemão com formas geométricas primárias" },
  { id: "pop-art", name: "Pop Art", image: previewPopArt, category: "Artístico", description: "Cores vibrantes e repetição icônica estilo Andy Warhol" },
  { id: "dataflow", name: "Dataflow", image: previewDataflow, category: "Experimental", description: "Visualização de dados com estética tecnológica futurista" },
  { id: "memoria-fragmentada", name: "Memória Fragmentada", image: previewMemoriaFragmentada, category: "Experimental", description: "Fragmentos visuais que evocam memórias e nostalgia" },
  { id: "isometrico", name: "Isométrico", image: previewIsometrico, category: "Minimalista", description: "Perspectiva arquitetônica com profundidade calculada" },
  { id: "vhs-nostalgico", name: "VHS Nostálgico", image: previewVHSNostalgico, category: "Experimental", description: "Estética retrô com ruído analógico e tracking" },
  { id: "narrativa-fragmentada", name: "Narrativa Fragmentada", image: previewNarrativaFragmentada, category: "Experimental", description: "Composição em fragmentos que conta histórias visuais" },
];

type StyleType = { id: string; name: string; image: string; category: string; description: string };

interface StyleCardProps {
  style: StyleType;
  index: number;
  onSelect: (style: StyleType) => void;
}

const StyleCard = ({ style, index, onSelect }: StyleCardProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  
  return (
    <motion.div
      key={`${style.id}-${index}`}
      className="flex-shrink-0 w-56 md:w-72 group cursor-pointer"
      whileHover={{ scale: 1.08, y: -12 }}
      transition={{ duration: 0.3 }}
      onClick={() => onSelect(style)}
    >
      <div className="relative rounded-xl overflow-hidden border-2 border-border group-hover:border-primary/50 transition-all duration-300 shadow-lg group-hover:shadow-xl group-hover:shadow-primary/30">
        <div className="aspect-video bg-muted">
          {/* Placeholder skeleton */}
          {!isLoaded && (
            <div className="absolute inset-0 bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-pulse" />
          )}
          <img 
            src={style.image} 
            alt={style.name}
            className={`w-full h-full object-cover transition-all duration-500 group-hover:scale-110 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            decoding="async"
            onLoad={() => setIsLoaded(true)}
          />
        </div>
        
        {/* Overlay gradiente - expande no hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent opacity-80 group-hover:opacity-95 transition-opacity duration-300" />
        
        {/* Badge categoria */}
        <div className="absolute top-3 right-3">
          <span className="px-2 py-1 text-xs font-medium bg-primary/90 text-primary-foreground rounded-full shadow-lg">
            {style.category}
          </span>
        </div>
        
        {/* Conteúdo - expande no hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 transform transition-all duration-300">
          <h4 className="font-bold text-base md:text-lg text-foreground mb-0 group-hover:mb-2 transition-all duration-300">
            {style.name}
          </h4>
          
          {/* Descrição - aparece no hover */}
          <p className="text-xs md:text-sm text-muted-foreground leading-tight max-h-0 opacity-0 group-hover:max-h-20 group-hover:opacity-100 transition-all duration-300 overflow-hidden">
            {style.description}
          </p>
          
          {/* Indicador visual */}
          <div className="flex items-center gap-1.5 mt-0 group-hover:mt-2 max-h-0 opacity-0 group-hover:max-h-8 group-hover:opacity-100 transition-all duration-300">
            <Eye className="w-3 h-3 text-primary" />
            <span className="text-xs text-primary font-medium">Clique para explorar</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Todos os estilos combinados para navegação
const allStyles = [...stylesRow1, ...stylesRow2, ...stylesRow3];

// Modal de Preview do Estilo com navegação
const StylePreviewModal = ({ 
  style, 
  isOpen, 
  onClose,
  onNavigate
}: { 
  style: StyleType | null; 
  isOpen: boolean; 
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
}) => {
  if (!style) return null;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowLeft') onNavigate('prev');
      if (e.key === 'ArrowRight') onNavigate('next');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onNavigate]);

  const currentIndex = allStyles.findIndex(s => s.id === style.id);
  const prevStyle = allStyles[(currentIndex - 1 + allStyles.length) % allStyles.length];
  const nextStyle = allStyles[(currentIndex + 1) % allStyles.length];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-card border-primary/30 rounded-xl shadow-2xl">
        <div className="relative">
          {/* Main image area with side thumbnails */}
          <div className="relative flex items-stretch">
            {/* Previous style thumbnail */}
            <motion.button
              onClick={() => onNavigate('prev')}
              className="hidden md:flex flex-col items-center justify-center w-24 bg-background/50 hover:bg-background/80 transition-all group cursor-pointer border-r border-border/30"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              aria-label="Estilo anterior"
            >
              <div className="relative w-16 h-16 rounded-lg overflow-hidden mb-2 ring-2 ring-transparent group-hover:ring-primary/50 transition-all">
                <img 
                  src={prevStyle.image} 
                  alt={prevStyle.name}
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
              </div>
              <ChevronLeft className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors text-center px-1 line-clamp-2 max-w-full leading-tight">
                {prevStyle.name}
              </span>
            </motion.button>

            {/* Main image with swipe support */}
            <motion.div 
              className="relative aspect-video flex-1 overflow-hidden touch-pan-y"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={(_, info) => {
                const threshold = 50;
                if (info.offset.x > threshold) {
                  onNavigate('prev');
                } else if (info.offset.x < -threshold) {
                  onNavigate('next');
                }
              }}
            >
              <AnimatePresence mode="wait">
                <motion.img 
                  key={style.id}
                  src={style.image} 
                  alt={style.name}
                  className="w-full h-full object-cover absolute inset-0 pointer-events-none"
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </AnimatePresence>
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent pointer-events-none" />
              
              {/* Badge categoria com animação */}
              <div className="absolute top-4 right-4 pointer-events-none">
                <AnimatePresence mode="wait">
                  <motion.span 
                    key={style.category}
                    className="px-3 py-1.5 text-sm font-semibold bg-primary text-primary-foreground rounded-full shadow-lg inline-block"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {style.category}
                  </motion.span>
                </AnimatePresence>
              </div>

              {/* Mobile Navigation Arrows */}
              <button
                onClick={() => onNavigate('prev')}
                className="md:hidden absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background border border-border/50 shadow-lg transition-all hover:scale-110 z-10"
                aria-label="Estilo anterior"
              >
                <ChevronLeft className="w-6 h-6 text-foreground" />
              </button>
              <button
                onClick={() => onNavigate('next')}
                className="md:hidden absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/80 hover:bg-background border border-border/50 shadow-lg transition-all hover:scale-110 z-10"
                aria-label="Próximo estilo"
              >
                <ChevronRight className="w-6 h-6 text-foreground" />
              </button>
              
              {/* Swipe hint for mobile */}
              <div className="md:hidden absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/70 backdrop-blur-sm pointer-events-none">
                <ChevronLeft className="w-3 h-3 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground">Arraste para navegar</span>
                <ChevronRight className="w-3 h-3 text-muted-foreground" />
              </div>
            </motion.div>

            {/* Next style thumbnail */}
            <motion.button
              onClick={() => onNavigate('next')}
              className="hidden md:flex flex-col items-center justify-center w-24 bg-background/50 hover:bg-background/80 transition-all group cursor-pointer border-l border-border/30"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              aria-label="Próximo estilo"
            >
              <div className="relative w-16 h-16 rounded-lg overflow-hidden mb-2 ring-2 ring-transparent group-hover:ring-primary/50 transition-all">
                <img 
                  src={nextStyle.image} 
                  alt={nextStyle.name}
                  className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors text-center px-1 line-clamp-2 max-w-full leading-tight">
                {nextStyle.name}
              </span>
            </motion.button>
          </div>
          
          {/* Conteúdo com animação */}
          <div className="p-6 space-y-4">
            <AnimatePresence mode="wait">
              <motion.div 
                key={style.id}
                className="flex items-start justify-between"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold text-foreground">{style.name}</h3>
                  <p className="text-muted-foreground mt-2 text-base md:text-lg">{style.description}</p>
                </div>
                <span className="text-sm text-muted-foreground whitespace-nowrap ml-4">
                  {currentIndex + 1} / {allStyles.length}
                </span>
              </motion.div>
            </AnimatePresence>
            
            {/* Features */}
            <div className="flex flex-wrap gap-2">
              {["Alta Qualidade", "Pronto para Uso", "Totalmente Editável"].map((feature) => (
                <span 
                  key={feature}
                  className="px-3 py-1 text-xs font-medium bg-primary/10 text-primary border border-primary/20 rounded-full"
                >
                  {feature}
                </span>
              ))}
            </div>
            
            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link to="/auth" className="flex-1">
                <Button className="w-full gradient-button text-primary-foreground font-semibold h-12 text-base">
                  <Zap className="w-5 h-5 mr-2" />
                  Começar a Usar Agora
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button 
                variant="outline" 
                onClick={onClose}
                className="h-12 px-6 border-border hover:bg-muted"
              >
                Fechar
              </Button>
            </div>
            
            {/* Info extra */}
            <p className="text-xs text-muted-foreground text-center">
              Use as setas ← → para navegar • Este é 1 dos <span className="text-primary font-semibold">85 estilos</span> disponíveis
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const StylesCarousel = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<StyleType | null>(null);
  
  // Intersection Observer - pause animations when not visible
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const shouldAnimate = isVisible && !isPaused;

  const duplicatedRow1 = [...stylesRow1, ...stylesRow1];
  const duplicatedRow2 = [...stylesRow2, ...stylesRow2];
  const duplicatedRow3 = [...stylesRow3, ...stylesRow3];

  return (
    <section className="py-16 md:py-24 px-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background pointer-events-none" />
      
      <div className="max-w-7xl mx-auto space-y-8 md:space-y-12 relative">
        <AnimatedSection className="text-center space-y-4 md:space-y-5">
          <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 rounded-full bg-card border border-primary/30">
            <Palette className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            <span className="text-sm md:text-base font-medium text-primary">BIBLIOTECA VISUAL</span>
            <Rocket className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          </div>
          <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold italic">
            <span className="text-primary">85 Estilos</span> Visuais
          </h2>
          <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold italic">
            Prontos para Usar
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            De <span className="text-primary font-semibold">Cinematográfico</span> a <span className="text-primary font-semibold">Anime</span>, 
            de <span className="text-primary font-semibold">Terror</span> a <span className="text-primary font-semibold">Fantasia</span>. 
            Encontre o estilo perfeito para cada vídeo.
          </p>
        </AnimatedSection>

        {/* Carousels Container - CSS animations for GPU acceleration */}
        <div 
          ref={containerRef}
          className="relative space-y-4 md:space-y-6"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
          style={{
            WebkitMaskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
            maskImage: "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          }}
        >
          {/* CSS Keyframes for GPU-accelerated animations */}
          <style>{`
            @keyframes scrollLeft {
              from { transform: translateX(0); }
              to { transform: translateX(-50%); }
            }
            @keyframes scrollRight {
              from { transform: translateX(-50%); }
              to { transform: translateX(0); }
            }
            .carousel-row-1 {
              animation: scrollLeft 80s linear infinite;
              will-change: transform;
            }
            .carousel-row-2 {
              animation: scrollRight 60s linear infinite;
              will-change: transform;
            }
            .carousel-row-3 {
              animation: scrollLeft 70s linear infinite;
              will-change: transform;
            }
            .carousel-paused {
              animation-play-state: paused !important;
            }
          `}</style>
          
          {/* Row 1 - Left to Right */}
          <div className="overflow-hidden py-2">
            <div 
              className={`flex gap-4 md:gap-5 carousel-row-1 ${!shouldAnimate ? 'carousel-paused' : ''}`}
              style={{ width: 'max-content' }}
            >
              {duplicatedRow1.map((style, index) => (
                <StyleCard key={`row1-${style.id}-${index}`} style={style} index={index} onSelect={setSelectedStyle} />
              ))}
            </div>
          </div>

          {/* Row 2 - Right to Left */}
          <div className="overflow-hidden py-2">
            <div 
              className={`flex gap-4 md:gap-5 carousel-row-2 ${!shouldAnimate ? 'carousel-paused' : ''}`}
              style={{ width: 'max-content' }}
            >
              {duplicatedRow2.map((style, index) => (
                <StyleCard key={`row2-${style.id}-${index}`} style={style} index={index} onSelect={setSelectedStyle} />
              ))}
            </div>
          </div>

          {/* Row 3 - Left to Right (Minimalistas & Experimentais) */}
          <div className="overflow-hidden py-2">
            <div 
              className={`flex gap-4 md:gap-5 carousel-row-3 ${!shouldAnimate ? 'carousel-paused' : ''}`}
              style={{ width: 'max-content' }}
            >
              {duplicatedRow3.map((style, index) => (
                <StyleCard key={`row3-${style.id}-${index}`} style={style} index={index} onSelect={setSelectedStyle} />
              ))}
            </div>
          </div>
        </div>

        {/* Stats and CTA */}
        <AnimatedSection animation="fade-up" delay={200}>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 pt-4">
            <div className="flex items-center gap-8 md:gap-12">
              {[
                { value: "85", label: "Estilos" },
                { value: "7", label: "Categorias" },
                { value: "∞", label: "Possibilidades" },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-gradient">{stat.value}</p>
                  <p className="text-sm md:text-base text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
            
            <Link to="/auth">
              <Button className="gradient-button text-primary-foreground font-semibold h-12 md:h-14 px-6 md:px-8 text-base md:text-lg">
                <Palette className="w-5 h-5 mr-2" />
                Explorar Todos os Estilos
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </AnimatedSection>
      </div>

      {/* Modal de Preview */}
      <StylePreviewModal 
        style={selectedStyle} 
        isOpen={!!selectedStyle} 
        onClose={() => setSelectedStyle(null)}
        onNavigate={(direction) => {
          if (!selectedStyle) return;
          const currentIndex = allStyles.findIndex(s => s.id === selectedStyle.id);
          if (direction === 'prev') {
            const prevIndex = currentIndex <= 0 ? allStyles.length - 1 : currentIndex - 1;
            setSelectedStyle(allStyles[prevIndex]);
          } else {
            const nextIndex = currentIndex >= allStyles.length - 1 ? 0 : currentIndex + 1;
            setSelectedStyle(allStyles[nextIndex]);
          }
        }}
      />
    </section>
  );
};
