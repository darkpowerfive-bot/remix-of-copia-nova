import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Play, 
  Zap, 
  Clock, 
  TrendingUp,
  Users,
  AlertTriangle,
  Rocket,
  BarChart3,
  Image,
  FileText,
  Layers,
  ImagePlus,
  FileType,
  Video,
  Palette,
  Mic,
  Search,
  Key,
  Youtube,
  Check,
  Mail,
  ArrowRight,
  Star,
  Crown,
  ChevronDown,
  Flame,
  Diamond,
  Eye,
  Shield,
  Cpu,
  Globe,
  Target,
  Gauge,
  Bot
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AnimatedSection, AnimatedItem } from "@/components/landing/AnimatedSection";
import { ParallaxLayer, ParallaxBackground } from "@/components/landing/ParallaxSection";
import { PurchaseNotifications } from "@/components/landing/PurchaseNotifications";
import { AutoChat } from "@/components/landing/AutoChat";
import { TestimonialCarousel } from "@/components/landing/TestimonialCarousel";
import { OperatorsOnline } from "@/components/landing/OperatorsOnline";
import { ParticleBackground } from "@/components/landing/ParticleBackground";
import { GlassCard } from "@/components/landing/GlassCard";
import { AdSenseCard } from "@/components/landing/AdSenseCard";
import FloatingElements from "@/components/landing/FloatingElements";
import { ScrollIndicator } from "@/components/landing/ScrollIndicator";
import { MobileMenu } from "@/components/landing/MobileMenu";
import { ComparisonSlider } from "@/components/landing/ComparisonSlider";
import { AnimatedCounter } from "@/components/landing/AnimatedCounter";
import { StylesCarousel } from "@/components/landing/StylesCarousel";
import { SEOHead } from "@/components/seo/SEOHead";

import { Tool3DCard } from "@/components/landing/Tool3DCard";
import { Dream3DCard } from "@/components/landing/Dream3DCard";
import logo from "@/assets/logo.gif";
import demoCoverFuturistic from "@/assets/video-cover-futuristic.jpg";

// Style preview images for showcase
import cinematograficoImg from "@/assets/style-previews/cinematografico.jpg";
import cyberpunk3dImg from "@/assets/style-previews/cyberpunk-3d.jpg";
import pixarDisneyImg from "@/assets/style-previews/pixar-disney.jpg";
import animeImg from "@/assets/style-previews/anime.jpg";
import fotoRealistaImg from "@/assets/style-previews/foto-realista.jpg";
import neonCyberpunkImg from "@/assets/style-previews/neon-cyberpunk.jpg";
import viralMinimalistaImg from "@/assets/style-previews/3d-viral-minimalista.jpg";
import unrealEngineImg from "@/assets/style-previews/unreal-engine.jpg";
import fantasiaImg from "@/assets/style-previews/fantasia.jpg";
import documentarioImg from "@/assets/style-previews/documentario.jpg";
import synthwaveImg from "@/assets/style-previews/synthwave.jpg";
import noirClassicoImg from "@/assets/style-previews/noir-classico.jpg";

// Dream images
import creditCardImg from "@/assets/dreams/credit-card.jpg";
import firstClassImg from "@/assets/dreams/first-class.jpg";
import luxuryCarImg from "@/assets/dreams/luxury-car.jpg";
import luxuryMansionImg from "@/assets/dreams/luxury-mansion.jpg";
import luxuryWatchImg from "@/assets/dreams/luxury-watch.jpg";
import freedomBeachImg from "@/assets/dreams/freedom-beach.jpg";

const Landing = () => {
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const features = [
    { icon: Zap, title: "Inteligente", desc: "Automação Avançada", color: "bg-gradient-to-br from-green-500 to-emerald-600" },
    { icon: Clock, title: "24/7", desc: "Suporte Premium", color: "bg-gradient-to-br from-purple-500 to-violet-600" },
    { icon: TrendingUp, title: "Otimizada", desc: "Performance Alta", color: "bg-gradient-to-br from-orange-500 to-amber-600" },
    { icon: Users, title: "Exclusiva", desc: "Comunidade VIP", color: "bg-gradient-to-br from-cyan-500 to-blue-600" },
    { icon: Play, title: "Constantes", desc: "Updates Semanais", color: "bg-gradient-to-br from-pink-500 to-rose-600" },
  ];

  const tools = [
    { icon: BarChart3, title: "Analisador de Títulos Virais", desc: "Análise de títulos com métricas de viralidade e sugestões de otimização.", badge: "POPULAR", color: "bg-gradient-to-br from-green-500 to-emerald-600" },
    { icon: Image, title: "Gerador de Thumbnails 4x", desc: "Crie 4 variações de thumbnails otimizadas para CTR máximo.", badge: "NOVO", color: "bg-gradient-to-br from-orange-500 to-amber-600" },
    { icon: FileText, title: "Gerador de Roteiros", desc: "Roteiros completos com estrutura viral e ganchos de retenção.", color: "bg-gradient-to-br from-emerald-500 to-teal-600" },
    { icon: Layers, title: "Gerador de Prompts Cenas", desc: "Prompts detalhados para cada cena do seu vídeo.", color: "bg-gradient-to-br from-purple-500 to-violet-600" },
    { icon: ImagePlus, title: "Gerador de Imagens Ilimitado", desc: "Criação ilimitada de imagens para seus vídeos.", badge: "∞", color: "bg-gradient-to-br from-pink-500 to-rose-600" },
    { icon: FileType, title: "Gerador de SRT", desc: "Legendas sincronizadas automaticamente em formato SRT.", color: "bg-gradient-to-br from-primary to-accent" },
    { icon: Video, title: "Geração de Vídeo VO3 & Sora", desc: "Integração com VO3 e Sora para geração de vídeos.", badge: "PRO", color: "bg-gradient-to-br from-blue-500 to-indigo-600" },
    { icon: Rocket, title: "Criação de Agente Automático", desc: "Agentes que trabalham 24/7 automatizando suas operações.", badge: "AUTO", color: "bg-gradient-to-br from-amber-500 to-orange-600" },
    { icon: TrendingUp, title: "Analytics Avançado", desc: "Métricas em tempo real: CTR, views, likes, comentários e RPM.", color: "bg-gradient-to-br from-indigo-500 to-purple-600" },
    { icon: Users, title: "Análise de Canais Virais", desc: "Monitore e analise os canais mais virais do seu nicho.", color: "bg-gradient-to-br from-teal-500 to-cyan-600" },
    { icon: FileText, title: "Modelagem de Roteiro Avançada", desc: "Modelagem avançada de roteiros baseados em padrões virais.", badge: "PRO", color: "bg-gradient-to-br from-rose-500 to-pink-600" },
    { icon: Palette, title: "Modelagem de Thumbnail", desc: "Templates e modelagem inteligente de thumbnails.", color: "bg-gradient-to-br from-fuchsia-500 to-purple-600" },
    { icon: Video, title: "Processamento de Vídeos YouTube", desc: "Processamento e análise de vídeos diretamente do YouTube.", color: "bg-gradient-to-br from-red-500 to-rose-600" },
    { icon: Mic, title: "Geração de Áudio (TTS)", desc: "Text-to-Speech com vozes ultra-realistas e naturais.", color: "bg-gradient-to-br from-violet-500 to-purple-600" },
    { icon: FileText, title: "Análise de Transcrições", desc: "Transcreva e analise conteúdo de vídeos automaticamente.", color: "bg-gradient-to-br from-sky-500 to-blue-600" },
    { icon: Search, title: "Explorador de Nicho", desc: "Descubra nichos lucrativos antes da concorrência.", badge: "HOT", color: "bg-gradient-to-br from-lime-500 to-green-600" },
    { icon: Key, title: "Gerenciamento de API Keys", desc: "Gerencie suas API keys com segurança e controle total.", color: "bg-gradient-to-br from-slate-500 to-zinc-600" },
    { icon: Youtube, title: "Integração YouTube Completa", desc: "Upload, gerenciamento e automação direto na plataforma.", color: "bg-gradient-to-br from-red-500 to-red-700" },
  ];

  const dreams = [
    { image: creditCardImg, title: "Cartão Black Ilimitado", desc: "Acesso a benefícios exclusivos e limites sem preocupação" },
    { image: firstClassImg, title: "Viagens Primeira Classe", desc: "Conheça o mundo com conforto e exclusividade" },
    { image: luxuryCarImg, title: "Carros dos Sonhos", desc: "Porsche, BMW, Mercedes... a escolha é sua" },
    { image: luxuryMansionImg, title: "Imóvel de Luxo", desc: "Penthouse com vista para o mar ou mansão" },
    { image: luxuryWatchImg, title: "Relógios de Luxo", desc: "Rolex, Patek Philippe, Audemars Piguet" },
    { image: freedomBeachImg, title: "Liberdade Geográfica", desc: "Trabalhe de qualquer lugar paradisíaco" },
  ];

  const steps = [
    { step: 1, title: "Solicite Acesso", desc: "Preencha o formulário e aguarde a validação da sua conta.", badges: ["Análise de perfil", "Validação em 24h", "Onboarding exclusivo"] },
    { step: 2, title: "Configure seus Canais", desc: "Conecte sua conta do YouTube e configure os parâmetros.", badges: ["Integração automática", "Multi-canal", "Dashboard unificado"] },
    { step: 3, title: "Ative os Agentes", desc: "Coloque os agentes para trabalhar e escale suas operações.", badges: ["Automação 24/7", "IA avançada", "Escalabilidade"] },
    { step: 4, title: "Colete os Lucros", desc: "Acompanhe seus ganhos crescerem enquanto os agentes trabalham.", badges: ["Relatórios em tempo real", "Otimização contínua", "Suporte dedicado"] },
  ];

  const testimonials = [
    { name: "Marina Silva", role: "Trader", earnings: "$11.600/mês", channels: "7 canais", growth: "+520%", quote: "A análise de nichos me ajudou a encontrar oportunidades que ninguém estava explorando. Hoje faturo 5 dígitos." },
    { name: "Pedro Alves", role: "Engenheiro", earnings: "$3.800/mês", channels: "3 canais", growth: "+180%", quote: "Comecei do zero, sem experiência. Em 6 meses já estava vivendo apenas dos canais." },
    { name: "Juliana Santos", role: "Advogada", earnings: "$20.500/mês", channels: "12 canais", growth: "+447%", quote: "O suporte no Telegram é incrível. Sempre que tenho dúvidas, resolvem em minutos." },
    { name: "Carlos Eduardo", role: "Contador", earnings: "$13.800/mês", channels: "10 canais", growth: "+725%", quote: "O sistema de agentes automáticos mudou completamente minha operação. Escala real." },
    { name: "Fernanda Lima", role: "Designer", earnings: "$8.200/mês", channels: "5 canais", growth: "+340%", quote: "As ferramentas de thumbnail e roteiro são incríveis. Meu CTR dobrou em 2 semanas." },
    { name: "Ricardo Mendes", role: "Empresário", earnings: "$25.000/mês", channels: "15 canais", growth: "+890%", quote: "Já testei várias plataformas. Essa é de longe a mais completa e profissional do mercado." },
  ];

  const metrics = [
    { icon: Video, value: "127", label: "Total de Vídeos", status: "ATIVO" },
    { icon: TrendingUp, value: "11.7K", label: "Views Mensais", status: "ATIVO" },
    { icon: Clock, value: "2,340h", label: "Horas Economizadas", status: "ATIVO" },
    { icon: BarChart3, value: "9.9%", label: "CTR Médio" },
    { icon: Users, value: "8,432", label: "Comentários" },
    { icon: Star, value: "67%", label: "Taxa de Retenção" },
  ];

  const faqs = [
    { question: "Os créditos expiram?", answer: "Não, seus créditos nunca expiram. Você pode usar quando quiser." },
    { question: "Posso ajustar minha capacidade?", answer: "Sim, você pode fazer upgrade ou downgrade a qualquer momento." },
    { question: "Como funciona a integração com o YouTube?", answer: "A integração é feita via API oficial do YouTube, de forma segura e automatizada." },
    { question: "O que são os Agentes Virais?", answer: "São IAs que automatizam processos de criação e otimização de conteúdo 24/7." },
    { question: "Existe suporte técnico?", answer: "Sim, oferecemos suporte via Telegram e email, com tempo médio de resposta de 15 minutos." },
    { question: "Posso testar antes de assinar?", answer: "Sim, oferecemos 50 créditos gratuitos para você testar a plataforma." },
  ];

  // Removed static operatorsOnline - now using dynamic component

  return (
    <>
      <SEOHead
        title="Canal Dark YouTube: Ferramenta #1 para Vídeos Virais 2026"
        description="Crie vídeos virais para canal dark no YouTube sem aparecer. Gerador de voz IA, thumbnails otimizadas, roteiros virais e automação completa. 847+ criadores faturando $10K+/mês."
        canonical="/"
        keywords="canal dark youtube, vídeos virais, faceless channel, canal sem aparecer, ganhar dinheiro youtube 2026, automação youtube, gerador de voz ia, thumbnails virais, roteiro viral, como criar canal dark, monetização youtube, nicho lucrativo youtube, canal faceless, vídeo viral ia, dark channel, youtube sem aparecer, renda passiva youtube, criar vídeos com ia, canal automático youtube, edição davinci resolve"
        jsonLd={[
          {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "La Casa Dark CORE",
            "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web",
            "url": "https://canaisdarks.com.br",
            "offers": {
              "@type": "Offer",
              "price": "97",
              "priceCurrency": "BRL",
              "availability": "https://schema.org/InStock"
            },
            "aggregateRating": {
              "@type": "AggregateRating",
              "ratingValue": "4.9",
              "reviewCount": "847",
              "bestRating": "5",
              "worstRating": "1"
            },
            "description": "Plataforma completa para criadores de canal dark no YouTube. Gerador de voz IA, análise de nichos virais, thumbnails otimizadas, roteiros com gatilhos mentais e automação 24/7.",
            "featureList": [
              "Gerador de Voz IA Ultra-Realista",
              "Análise de Títulos Virais",
              "Gerador de Thumbnails 4x",
              "Roteiros com Gatilhos Mentais",
              "Automação de Canal 24/7",
              "Analytics Avançado",
              "Integração YouTube Completa"
            ]
          },
          {
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": "La Casa Dark",
            "alternateName": "La Casa Dark CORE",
            "url": "https://canaisdarks.com.br",
            "logo": "https://canaisdarks.com.br/logo.gif",
            "description": "Plataforma líder em automação de canais dark no YouTube. Ajudamos criadores a faturar $10K+/mês com vídeos virais sem aparecer.",
            "contactPoint": {
              "@type": "ContactPoint",
              "email": "suporte@canaisdarks.com.br",
              "contactType": "customer service",
              "availableLanguage": ["Portuguese"]
            }
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "O que é um canal dark no YouTube?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Canal dark (ou faceless channel) é um canal do YouTube onde o criador não aparece nos vídeos. Usa narração com IA, imagens e vídeos de stock para criar conteúdo viral sem expor sua identidade."
                }
              },
              {
                "@type": "Question",
                "name": "Quanto tempo leva para monetizar um canal dark?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Com nossa plataforma, membros geralmente atingem os requisitos de monetização (1.000 inscritos e 4.000 horas) em 30-90 dias. Com dedicação, você pode alcançar $10K/mês em 6-12 meses."
                }
              },
              {
                "@type": "Question",
                "name": "Preciso saber editar vídeos?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Não! Nossa plataforma gera roteiros, prompts de imagens, narração com IA e até legendas SRT automaticamente. Você pode usar o DaVinci Resolve (gratuito) para montar tudo facilmente."
                }
              },
              {
                "@type": "Question",
                "name": "Como funciona o gerador de voz IA?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Nossa IA gera narrações profissionais em português brasileiro a partir do seu roteiro. Escolha entre diferentes vozes masculinas e femininas com qualidade de estúdio."
                }
              },
              {
                "@type": "Question",
                "name": "Quais nichos funcionam para canal dark?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Os nichos mais lucrativos incluem: finanças, curiosidades, mistérios, história, tecnologia, motivação, true crime, ciência e natureza. Nossa ferramenta de análise ajuda você a encontrar sub-nichos inexplorados."
                }
              },
              {
                "@type": "Question",
                "name": "A plataforma é segura para uso no YouTube?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Sim! Nosso conteúdo é 100% original, gerado por IA proprietária. Não há risco de copyright strikes. Mais de 847 criadores usam nossa plataforma com sucesso."
                }
              }
            ]
          },
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "La Casa Dark CORE - Plataforma de Vídeos Virais",
            "description": "Crie vídeos virais para canal dark no YouTube sem aparecer",
            "url": "https://canaisdarks.com.br/landing",
            "mainEntity": {
              "@type": "Product",
              "name": "La Casa Dark CORE",
              "description": "Plataforma completa para criação de canais dark no YouTube",
              "brand": {
                "@type": "Brand",
                "name": "La Casa Dark"
              },
              "review": {
                "@type": "Review",
                "reviewRating": {
                  "@type": "Rating",
                  "ratingValue": "5",
                  "bestRating": "5"
                },
                "author": {
                  "@type": "Person",
                  "name": "Ricardo Mendes"
                },
                "reviewBody": "Já testei várias plataformas. Essa é de longe a mais completa e profissional do mercado."
              }
            }
          }
        ]}
      />
      
      <div className="min-h-screen bg-background text-foreground overflow-x-hidden relative">
        {/* Global Floating Elements */}
        <FloatingElements />
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-amber-400 to-primary animate-spin-slow opacity-75 blur-sm" />
                <div className="w-14 h-14 rounded-full overflow-hidden relative z-10 border-2 border-primary bg-black">
                  <img src={logo} alt="La Casa Dark CORE" className="w-full h-full object-cover" />
                </div>
              </div>
              <span className="font-bold text-xl">La Casa Dark <span className="text-primary">CORE</span></span>
            </div>
            
            <div className="hidden md:flex items-center gap-10">
              <button onClick={() => scrollToSection("funcionalidades")} className="text-lg text-muted-foreground hover:text-foreground transition-colors">Funcionalidades</button>
              <button onClick={() => scrollToSection("como-funciona")} className="text-lg text-muted-foreground hover:text-foreground transition-colors">Como Funciona</button>
              <button onClick={() => scrollToSection("planos")} className="text-lg text-muted-foreground hover:text-foreground transition-colors">Planos</button>
              <Link to="/blog" className="text-lg text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
              <button onClick={() => scrollToSection("faq")} className="text-lg text-muted-foreground hover:text-foreground transition-colors">FAQ</button>
            </div>

            {/* Mobile Menu */}
            <div className="flex items-center gap-3 md:hidden">
              <MobileMenu scrollToSection={scrollToSection} />
            </div>

            {/* Desktop CTA */}
            <Link to="/auth" className="hidden md:block">
              <Button className="gradient-button text-primary-foreground font-semibold text-lg h-12 px-8">
                Acessar Core
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-28 md:pt-36 pb-16 md:pb-24 px-4 relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Particle Background - reduced for mobile */}
        <ParticleBackground particleCount={40} className="opacity-40 md:opacity-60" />

        {/* Background Image - Porsche with Parallax */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <ParallaxBackground speed={0.15} className="h-[120%] -top-[10%]">
            <img
              src="/images/hero-porsche.jpg?v=20260102"
              alt="Porsche de luxo no fundo da landing page"
              className="h-full w-full object-cover object-center opacity-60 md:opacity-80"
              loading="eager"
            />
          </ParallaxBackground>

          {/* Gradient overlay - left side dark for text readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
          {/* Vertical fade for seamless section transitions */}
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-transparent to-background" />
        </div>

        {/* Parallax orbs - desktop only */}
        <ParallaxLayer depth={0.3} className="absolute top-32 left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none animate-float hidden md:block" />
        <ParallaxLayer depth={0.5} className="absolute bottom-0 right-1/4 w-60 md:w-80 h-60 md:h-80 bg-primary/8 rounded-full blur-2xl pointer-events-none hidden lg:block" />

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16 items-center relative z-10 w-full">
          <AnimatedSection animation="fade-right" className="space-y-5 md:space-y-6">

              {/* Warning Badge */}
              <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2 md:py-3 rounded-full bg-primary/20 border border-primary/30">
                <AlertTriangle className="w-4 h-4 md:w-5 md:h-5 text-primary flex-shrink-0" />
                <span className="text-sm md:text-base font-medium text-primary">Fuja dos "marketeiros" e de quem só vende curso!</span>
              </div>

              {/* Main Heading */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                <span className="block">Escale seus</span>
                <span className="block text-primary">Canais Dark</span>
                <span className="block">com IA</span>
              </h1>

              {/* Description */}
              <p className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed">
                Criado por quem <span className="text-primary font-semibold">vive e respira</span> o mercado do YouTube diariamente. Nada de promessas vazias — aqui é <span className="text-primary font-semibold">ferramenta real</span> feita por quem está no campo de batalha.
              </p>

              {/* Quote - hide on mobile */}
              <p className="text-sm md:text-base text-muted-foreground italic hidden sm:block">
                "Enquanto outros vendem sonhos, nós entregamos resultados com tecnologia de ponta."
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 md:gap-5">
                <Link to="/auth" className="w-full sm:w-auto">
                  <Button size="lg" className="gradient-button text-primary-foreground font-semibold h-14 md:h-16 px-6 md:px-10 text-lg md:text-xl glow-primary hover:scale-105 transition-transform w-full">
                    <Zap className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
                    Solicitar Acesso Elite
                    <ArrowRight className="w-5 h-5 md:w-6 md:h-6 ml-2 md:ml-3" />
                  </Button>
                </Link>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="h-14 md:h-16 px-6 md:px-10 text-lg md:text-xl border-border hover:bg-card hover:scale-105 transition-transform w-full sm:w-auto"
                  onClick={() => scrollToSection("demo")}
                >
                  <Play className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3" />
                  Ver Demonstração
                </Button>
              </div>

              {/* Operators Online - Dynamic */}
              <OperatorsOnline />

          </AnimatedSection>

          {/* AdSense Card - hide on very small screens */}
          <AnimatedSection animation="fade-left" delay={200} className="hidden sm:block">
            <AdSenseCard />
          </AnimatedSection>
        </div>

      </section>

      {/* Scroll indicator - mouse style */}
      <ScrollIndicator variant="mouse" />

      {/* Marquee Strip - "A revolução chegou" with shimmer effect */}
      <div className="relative overflow-hidden py-3 md:py-4 bg-gradient-to-r from-primary via-amber-500 to-primary">
        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        <div className="flex animate-marquee whitespace-nowrap relative z-10">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="mx-8 md:mx-16 text-sm md:text-lg font-bold uppercase tracking-widest text-primary-foreground flex items-center gap-3 md:gap-4 drop-shadow-lg">
              <Diamond className="w-4 h-4 md:w-5 md:h-5" />
              A REVOLUÇÃO CHEGOU
              <span className="text-primary-foreground/80">•</span>
              NÃO HÁ ESPAÇO PARA AMADORES
            </span>
          ))}
        </div>
      </div>


      {/* Features Strip - Glass Premium */}
      <section className="py-12 md:py-20 px-4 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5 animate-gradient-x pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative">
          {/* Section badge */}
          <div className="flex justify-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-amber-500/20 border border-primary/30 backdrop-blur-xl">
              <Diamond className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-xs font-bold tracking-wider text-primary uppercase">Elite Features</span>
              <Diamond className="w-4 h-4 text-primary animate-pulse" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {features.map((feature, index) => (
              <AnimatedItem key={index} index={index} staggerDelay={100}>
                <Card className={`group relative p-4 md:p-8 bg-card/40 backdrop-blur-xl border border-white/10 hover:border-primary/50 transition-all duration-500 overflow-hidden shadow-2xl hover:shadow-primary/20 ${index === 0 ? 'ring-1 ring-primary/30' : ''}`}>
                  {/* Animated gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  {/* Top glow line */}
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  
                  <div className="relative">
                    <div className={`w-12 h-12 md:w-16 md:h-16 rounded-xl ${feature.color} flex items-center justify-center mb-3 md:mb-5 shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}>
                      <feature.icon className="w-6 h-6 md:w-8 md:h-8 text-white" />
                    </div>
                    <h3 className="font-bold text-lg md:text-2xl">{feature.title}</h3>
                    <p className="text-sm md:text-base text-muted-foreground/80 mt-1">{feature.desc}</p>
                  </div>
                </Card>
              </AnimatedItem>
            ))}
          </div>
        </div>
      </section>

      {/* Demo Section - Glass Premium */}
      <section id="demo" className="py-16 md:py-24 px-4 scroll-mt-20 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
        
        <ParallaxLayer depth={0.2} className="absolute top-0 left-0 w-full h-full hidden md:block">
          <div className="absolute top-10 left-10 w-3 h-3 rounded-full bg-primary/50 animate-pulse" />
          <div className="absolute top-20 right-20 w-2 h-2 rounded-full bg-primary/30 animate-pulse" />
          <div className="absolute bottom-40 left-1/4 w-2 h-2 rounded-full bg-primary/40 animate-pulse" />
        </ParallaxLayer>

        <AnimatedSection className="max-w-5xl mx-auto text-center space-y-8 md:space-y-10 relative">
          <div className="space-y-4 md:space-y-5">
            {/* Elite badge with counter */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2 md:py-3 rounded-full bg-gradient-to-r from-primary/20 to-amber-500/20 border border-primary/30 backdrop-blur-xl">
                <Rocket className="w-4 h-4 md:w-5 md:h-5 text-primary animate-bounce" />
                <span className="text-sm md:text-base font-bold text-primary">VEJA EM AÇÃO</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 backdrop-blur-xl">
                <Crown className="w-4 h-4 text-red-400" />
                <span className="text-xs font-bold text-red-400">ACESSO VIP</span>
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold italic">
              Conheça o Poder do
            </h2>
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold italic text-primary">
              La Casa Dark CORE
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Assista uma demonstração completa das funcionalidades que vão revolucionar sua operação no YouTube.
            </p>
          </div>

          <AnimatedSection animation="scale" delay={200}>
            <Card className="group relative aspect-video bg-card/40 backdrop-blur-xl border border-white/10 hover:border-primary/50 overflow-hidden shadow-2xl hover:shadow-primary/20 transition-all duration-500">
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              {/* Top glow line */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
              
              {/* Futuristic demo cover */}
              <img
                src={demoCoverFuturistic}
                alt="Capa futurista da demonstração da plataforma"
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="w-20 h-20 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 shadow-2xl shadow-primary/50">
                  <Play className="w-10 h-10 md:w-16 md:h-16 text-primary-foreground ml-1 md:ml-2" fill="currentColor" />
                </div>
              </div>
              
              {/* Bottom info - responsive */}
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-2 md:gap-0">
                <div>
                  <p className="text-primary font-semibold text-sm md:text-lg">DEMONSTRAÇÃO COMPLETA</p>
                  <p className="text-muted-foreground text-xs md:text-base">Duração: 5 minutos</p>
                </div>
                <div className="hidden md:flex items-center gap-3 text-muted-foreground">
                  <Zap className="w-5 h-5 text-primary" />
                  <span className="text-base">Tour pelas funcionalidades</span>
                </div>
              </div>
            </Card>

            {/* Bottom bar - Glass Premium */}
            <Card className="relative bg-card/40 backdrop-blur-xl rounded-xl p-4 md:p-6 mt-4 md:mt-6 flex flex-col md:flex-row items-start md:items-center justify-between border border-white/10 gap-4 overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              
              <div className="relative">
                <h3 className="font-bold text-lg md:text-xl">Tour Completo das Funcionalidades</h3>
                <p className="text-sm md:text-base text-muted-foreground">Veja como criar conteúdo viral em minutos</p>
              </div>
              <Link to="/auth" className="w-full md:w-auto relative">
                <Button className="gradient-button text-primary-foreground font-semibold text-base md:text-lg h-11 md:h-12 px-5 md:px-6 w-full md:w-auto">
                  <Zap className="w-4 h-4 md:w-5 md:h-5 mr-2" />
                  Começar Agora
                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 ml-2" />
                </Button>
              </Link>
            </Card>
          </AnimatedSection>

          {/* Demo Stats - Glass Premium */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-8 md:pt-10">
            {[
              { value: "PRO", label: "Geração de Roteiros", color: "from-emerald-500/20 to-green-500/10" },
              { value: "4x", label: "Thumbnails Premium", color: "from-orange-500/20 to-amber-500/10" },
              { value: "24/7", label: "Automação Total", color: "from-purple-500/20 to-violet-500/10" },
              { value: "Real-time", label: "Analytics Avançado", color: "from-blue-500/20 to-cyan-500/10" },
            ].map((stat, i) => (
              <Card key={i} className="group relative text-center p-6 bg-card/40 backdrop-blur-xl border border-white/10 hover:border-primary/30 transition-all duration-300 overflow-hidden">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <p className="text-2xl md:text-3xl lg:text-4xl font-black text-gradient">{stat.value}</p>
                  <p className="text-sm md:text-base text-muted-foreground/80 mt-1">{stat.label}</p>
                </div>
              </Card>
            ))}
          </div>
        </AnimatedSection>
      </section>

      {/* Scroll indicator - arrow style */}
      <ScrollIndicator variant="arrow" />

      {/* Dreams Section - Glass Premium */}
      <section className="py-16 md:py-24 px-4 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-primary/5 pointer-events-none" />
        <ParallaxLayer depth={0.4} className="absolute -top-20 -right-20 w-64 md:w-96 h-64 md:h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none hidden md:block animate-pulse" />
        <ParallaxLayer depth={0.3} className="absolute bottom-0 -left-20 w-48 md:w-72 h-48 md:h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none hidden md:block animate-pulse" />
        
        <div className="max-w-7xl mx-auto text-center space-y-10 md:space-y-14 relative">
          <AnimatedSection className="space-y-4 md:space-y-5">
            {/* Premium badges */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2 md:py-3 rounded-full bg-gradient-to-r from-primary/20 to-amber-500/20 border border-primary/30 backdrop-blur-xl">
                <Diamond className="w-4 h-4 md:w-5 md:h-5 text-primary animate-pulse" />
                <span className="text-sm md:text-base font-bold text-primary">REALIZE SEUS SONHOS</span>
                <Diamond className="w-4 h-4 md:w-5 md:h-5 text-primary animate-pulse" />
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 backdrop-blur-xl">
                <Crown className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-purple-400">LIFESTYLE VIP</span>
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold italic">
              O Que Você Pode
            </h2>
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold italic text-primary">
              Conquistar Com YouTube
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Dedicando apenas <span className="text-primary font-semibold">2 a 3 horas por dia</span>, você pode transformar sua vida e conquistar tudo isso com canais Dark no YouTube.
            </p>
          </AnimatedSection>

          {/* Dreams Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-8">
            {dreams.map((dream, index) => (
              <AnimatedItem key={index} index={index} staggerDelay={100}>
                <Dream3DCard
                  image={dream.image}
                  title={dream.title}
                  desc={dream.desc}
                />
              </AnimatedItem>
            ))}
          </div>

          {/* CTA - Glass Premium */}
          <AnimatedSection animation="scale" delay={400}>
            <Card className="relative max-w-2xl mx-auto p-8 md:p-10 bg-card/40 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl">
              {/* Decorative elements */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
              
              <div className="relative space-y-4 md:space-y-5">
                <h3 className="text-2xl md:text-3xl font-bold">
                  Tudo isso é <span className="text-primary">possível</span> para você
                </h3>
                <p className="text-base md:text-lg text-muted-foreground/80">Milhares de criadores já estão vivendo esse estilo de vida</p>
                <Link to="/auth">
                  <Button size="lg" className="gradient-button text-primary-foreground font-semibold h-14 md:h-16 px-6 md:px-10 mt-4 md:mt-5 text-base md:text-lg glow-primary group">
                    <Check className="w-5 h-5 md:w-6 md:h-6 mr-2 md:mr-3 group-hover:scale-110 transition-transform" />
                    <span className="hidden sm:inline">Faça o teste e comprove você mesmo</span>
                    <span className="sm:hidden">Faça o teste agora</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </Card>
          </AnimatedSection>
        </div>
      </section>

      {/* Middle Marquee Strip */}
      <div className="relative overflow-hidden py-3 md:py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500">
        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        <div className="flex animate-marquee-fast whitespace-nowrap relative z-10">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="mx-8 md:mx-16 text-sm md:text-lg font-bold uppercase tracking-widest text-primary-foreground flex items-center gap-3 md:gap-4 drop-shadow-lg">
              <Crown className="w-4 h-4 md:w-5 md:h-5" />
              FERRAMENTAS PROFISSIONAIS
              <span className="text-primary-foreground/80">•</span>
              RESULTADOS REAIS
            </span>
          ))}
        </div>
      </div>

      {/* Scroll indicator - dots style */}
      <ScrollIndicator variant="dots" />

      {/* Tools Section - Glass Premium */}
      <section id="funcionalidades" className="py-16 md:py-24 px-4 scroll-mt-20 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
        <ParallaxLayer depth={0.3} className="absolute top-40 -left-32 w-60 md:w-80 h-60 md:h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none hidden md:block animate-pulse" />
        <ParallaxLayer depth={0.4} className="absolute bottom-20 -right-20 w-48 md:w-64 h-48 md:h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none hidden md:block animate-pulse" />
        
        <div className="max-w-7xl mx-auto space-y-10 md:space-y-14 relative">
          <AnimatedSection className="text-center space-y-4 md:space-y-5">
            {/* Premium badges with counter */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 rounded-full bg-gradient-to-r from-primary to-amber-500 text-primary-foreground shadow-lg shadow-primary/30">
                <Crown className="w-4 h-4 md:w-5 md:h-5" />
                <span className="text-sm md:text-base font-bold">18+ FUNCIONALIDADES PREMIUM</span>
                <Crown className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 backdrop-blur-xl animate-pulse">
                <Flame className="w-4 h-4 text-red-400" />
                <span className="text-xs font-bold text-red-400">APENAS 23 VAGAS</span>
              </div>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold italic">
              Arsenal Completo para
            </h2>
            <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold italic text-primary">
              Operações Dark
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
              Todas as ferramentas que você precisa para criar, otimizar e escalar seus canais de forma automatizada.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {tools.map((tool, index) => (
              <AnimatedItem key={index} index={index} staggerDelay={50}>
                <Tool3DCard
                  icon={tool.icon}
                  title={tool.title}
                  desc={tool.desc}
                  badge={tool.badge}
                  color={tool.color}
                  isHighlighted={index === 5}
                />
              </AnimatedItem>
            ))}
          </div>

          {/* Bottom Stats - Glass Premium */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 pt-6 md:pt-10">
            {[
              { icon: Zap, value: "18+", label: "Ferramentas", color: "from-primary/20 to-amber-500/10" },
              { icon: ImagePlus, value: "∞", label: "Imagens/Mês", color: "from-purple-500/20 to-violet-500/10" },
              { icon: Clock, value: "24/7", label: "Automação", color: "from-emerald-500/20 to-green-500/10" },
              { icon: Star, value: "5min", label: "Setup Rápido", color: "from-blue-500/20 to-cyan-500/10" },
            ].map((stat, i) => (
              <Card key={i} className="group relative p-4 md:p-6 bg-card/40 backdrop-blur-xl border border-white/10 text-center hover:border-primary/30 transition-all duration-300 overflow-hidden shadow-xl hover:shadow-primary/10">
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <stat.icon className="w-6 h-6 md:w-8 md:h-8 text-primary mx-auto mb-2 md:mb-3 group-hover:scale-110 transition-transform" />
                  <p className="text-2xl md:text-3xl font-black text-gradient">{stat.value}</p>
                  <p className="text-sm md:text-base text-muted-foreground/80">{stat.label}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Models Transparency Section */}
      <section className="py-20 md:py-32 px-4 relative overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background" />
        <div className="absolute inset-0 opacity-30">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-amber-500/5 to-transparent animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        </div>
        <ParallaxLayer depth={0.2} className="absolute top-20 left-0 w-80 md:w-[500px] h-80 md:h-[500px] bg-primary/8 rounded-full blur-[120px] pointer-events-none" />
        <ParallaxLayer depth={0.4} className="absolute bottom-20 right-0 w-60 md:w-[400px] h-60 md:h-[400px] bg-purple-500/8 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto relative">
          {/* Header with Elite Badge */}
          <AnimatedSection className="text-center space-y-6 md:space-y-8 mb-16 md:mb-20">
            <div className="flex flex-col items-center gap-4">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 border border-primary/30 backdrop-blur-xl">
                <Eye className="w-5 h-5 text-primary animate-pulse" />
                <span className="text-sm md:text-base font-bold tracking-wider text-primary uppercase">Transparência Total</span>
                <Shield className="w-5 h-5 text-primary" />
              </div>
              
              {/* Elite Only Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/30 to-yellow-500/20 border border-amber-400/50 backdrop-blur-xl shadow-lg shadow-amber-500/20">
                <Crown className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold tracking-wider text-amber-300 uppercase">Exclusivo Elite</span>
                <Diamond className="w-4 h-4 text-amber-400" />
              </div>
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-7xl font-black">
              <span className="text-foreground">Você no</span>
              <span className="block mt-2 bg-gradient-to-r from-primary via-amber-400 to-primary bg-clip-text text-transparent">
                Controle Absoluto
              </span>
            </h2>
            
            <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto px-4 leading-relaxed">
              Nada de <span className="text-destructive font-semibold line-through">caixa preta</span> ou 
              <span className="text-destructive font-semibold line-through"> sistema oculto</span>. 
              Aqui você <span className="text-primary font-bold">escolhe exatamente</span> qual motor usar em cada ferramenta.
            </p>

            {/* Vacancy Counter */}
            <div className="inline-flex items-center gap-4 px-8 py-4 rounded-2xl bg-gradient-to-r from-red-500/10 via-orange-500/10 to-red-500/10 border border-red-500/30 backdrop-blur-xl">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 font-bold text-lg">Vagas Limitadas:</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-3xl md:text-4xl font-black text-foreground">47</span>
                <span className="text-muted-foreground font-medium">restantes</span>
              </div>
            </div>
          </AnimatedSection>

          {/* AI Models Grid - Glass Premium Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8 mb-16">
            {/* GPT-4.1 */}
            <AnimatedItem index={0} staggerDelay={100}>
              <Card className="group relative p-8 bg-card/40 backdrop-blur-xl border border-white/10 hover:border-green-500/50 transition-all duration-500 overflow-hidden h-full shadow-2xl hover:shadow-green-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-400/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-400/30 to-transparent" />
                
                <div className="relative space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-sm border border-green-500/30 flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:scale-110 group-hover:shadow-green-500/40 transition-all duration-300">
                      <Cpu className="w-8 h-8 text-green-400" />
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/30 backdrop-blur-sm">
                      <span className="text-xs font-bold text-green-400">PREMIUM</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-black text-xl text-foreground">GPT-4.1</h3>
                    <p className="text-sm text-green-400/80 font-semibold">OpenAI</p>
                  </div>
                  
                  <p className="text-sm text-muted-foreground/80 leading-relaxed">
                    O mais avançado da OpenAI. Roteiros criativos e análises com precisão cirúrgica.
                  </p>
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="text-xs px-3 py-1.5 rounded-full bg-green-500/10 text-green-400/90 border border-green-500/20 font-medium backdrop-blur-sm">Roteiros</span>
                    <span className="text-xs px-3 py-1.5 rounded-full bg-green-500/10 text-green-400/90 border border-green-500/20 font-medium backdrop-blur-sm">Análises</span>
                  </div>
                </div>
              </Card>
            </AnimatedItem>

            {/* Claude 4 Sonnet */}
            <AnimatedItem index={1} staggerDelay={100}>
              <Card className="group relative p-8 bg-card/40 backdrop-blur-xl border border-white/10 hover:border-orange-500/50 transition-all duration-500 overflow-hidden h-full shadow-2xl hover:shadow-orange-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-400/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-400/30 to-transparent" />
                
                <div className="relative space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-600/20 backdrop-blur-sm border border-orange-500/30 flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-110 group-hover:shadow-orange-500/40 transition-all duration-300">
                      <Target className="w-8 h-8 text-orange-400" />
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-orange-500/20 border border-orange-500/30 backdrop-blur-sm">
                      <span className="text-xs font-bold text-orange-400">CRIATIVO</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-black text-xl text-foreground">Claude 4 Sonnet</h3>
                    <p className="text-sm text-orange-400/80 font-semibold">Anthropic</p>
                  </div>
                  
                  <p className="text-sm text-muted-foreground/80 leading-relaxed">
                    Raciocínio avançado e respostas equilibradas. Conteúdo de altíssima qualidade.
                  </p>
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="text-xs px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-400/90 border border-orange-500/20 font-medium backdrop-blur-sm">Títulos</span>
                    <span className="text-xs px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-400/90 border border-orange-500/20 font-medium backdrop-blur-sm">Criativo</span>
                  </div>
                </div>
              </Card>
            </AnimatedItem>

            {/* Gemini 2.5 Pro */}
            <AnimatedItem index={2} staggerDelay={100}>
              <Card className="group relative p-8 bg-card/40 backdrop-blur-xl border border-white/10 hover:border-blue-500/50 transition-all duration-500 overflow-hidden h-full shadow-2xl hover:shadow-blue-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent" />
                
                <div className="relative space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-600/20 backdrop-blur-sm border border-blue-500/30 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-110 group-hover:shadow-blue-500/40 transition-all duration-300">
                      <Globe className="w-8 h-8 text-blue-400" />
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 backdrop-blur-sm">
                      <span className="text-xs font-bold text-blue-400">MULTIMODAL</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-black text-xl text-foreground">Gemini 2.5 Pro</h3>
                    <p className="text-sm text-blue-400/80 font-semibold">Google</p>
                  </div>
                  
                  <p className="text-sm text-muted-foreground/80 leading-relaxed">
                    Multimodal com contexto massivo. Análises visuais e textuais integradas.
                  </p>
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="text-xs px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400/90 border border-blue-500/20 font-medium backdrop-blur-sm">Imagens</span>
                    <span className="text-xs px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400/90 border border-blue-500/20 font-medium backdrop-blur-sm">Contexto</span>
                  </div>
                </div>
              </Card>
            </AnimatedItem>

            {/* DeepSeek */}
            <AnimatedItem index={3} staggerDelay={100}>
              <Card className="group relative p-8 bg-card/40 backdrop-blur-xl border border-white/10 hover:border-purple-500/50 transition-all duration-500 overflow-hidden h-full shadow-2xl hover:shadow-purple-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-400/30 to-transparent" />
                
                <div className="relative space-y-5">
                  <div className="flex items-center justify-between">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-violet-600/20 backdrop-blur-sm border border-purple-500/30 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:scale-110 group-hover:shadow-purple-500/40 transition-all duration-300">
                      <Gauge className="w-8 h-8 text-purple-400" />
                    </div>
                    <div className="px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 backdrop-blur-sm">
                      <span className="text-xs font-bold text-purple-400">EFICIENTE</span>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-black text-xl text-foreground">DeepSeek V3</h3>
                    <p className="text-sm text-purple-400/80 font-semibold">DeepSeek AI</p>
                  </div>
                  
                  <p className="text-sm text-muted-foreground/80 leading-relaxed">
                    Alta performance com custo otimizado. Raciocínio profundo e rápido.
                  </p>
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="text-xs px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-400/90 border border-purple-500/20 font-medium backdrop-blur-sm">Raciocínio</span>
                    <span className="text-xs px-3 py-1.5 rounded-full bg-purple-500/10 text-purple-400/90 border border-purple-500/20 font-medium backdrop-blur-sm">Veloz</span>
                  </div>
                </div>
              </Card>
            </AnimatedItem>
          </div>

          {/* High-Quality Image Generation Section */}
          <AnimatedSection className="mb-16">
            <Card className="relative overflow-hidden bg-gradient-to-br from-violet-500/10 via-card/40 to-fuchsia-500/10 backdrop-blur-2xl border border-violet-500/30 shadow-2xl shadow-violet-500/10">
              {/* Animated gradient background */}
              <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-transparent to-fuchsia-500/5" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-400/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-fuchsia-400/40 to-transparent" />
              
              {/* Floating orbs */}
              <div className="absolute -top-32 -left-32 w-64 h-64 bg-violet-500/20 rounded-full blur-[100px]" />
              <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-fuchsia-500/20 rounded-full blur-[100px]" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]" />
              
              <div className="relative p-4 sm:p-8 md:p-12 lg:p-16">
                {/* Header */}
                <div className="text-center mb-8 md:mb-12">
                  <div className="inline-flex items-center gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 border border-violet-500/30 backdrop-blur-xl mb-4 sm:mb-6">
                    <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400 animate-pulse" />
                    <span className="text-xs sm:text-sm font-bold tracking-wider text-violet-400 uppercase">Velocidade Industrial</span>
                  </div>
                  
                  <h3 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black leading-tight mb-3 sm:mb-4 px-2">
                    <span className="text-foreground">Gere até </span>
                    <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-purple-500 bg-clip-text text-transparent">100 Imagens</span>
                    <br className="sm:hidden" />
                    <span className="text-foreground"> por Minuto</span>
                  </h3>
                  
                  <p className="text-sm sm:text-lg md:text-xl text-muted-foreground/80 leading-relaxed max-w-3xl mx-auto px-2">
                    Infraestrutura de ponta com <span className="text-violet-400 font-semibold">24 gerações paralelas</span>. 
                    Enquanto outros fazem 1 imagem por vez, nós entregamos <span className="text-fuchsia-400 font-semibold">100+ em 60 segundos</span>.
                  </p>
                </div>

                {/* Image Grid - Real previews */}
                <div className="relative mb-8 md:mb-12">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
                    {[
                      { src: cinematograficoImg, label: "Cinemático" },
                      { src: cyberpunk3dImg, label: "Cyberpunk" },
                      { src: pixarDisneyImg, label: "Pixar" },
                      { src: animeImg, label: "Anime" },
                      { src: fotoRealistaImg, label: "Realista" },
                      { src: neonCyberpunkImg, label: "Neon" },
                      { src: viralMinimalistaImg, label: "3D Viral" },
                      { src: unrealEngineImg, label: "Unreal" },
                      { src: fantasiaImg, label: "Fantasia" },
                      { src: documentarioImg, label: "Documentário" },
                      { src: synthwaveImg, label: "Synthwave" },
                      { src: noirClassicoImg, label: "Noir" },
                    ].map((item, i) => (
                      <div 
                        key={i}
                        className="group relative aspect-video rounded-lg sm:rounded-xl overflow-hidden border border-white/10 sm:border-2 hover:border-violet-500/50 transition-all duration-500 hover:scale-105 hover:z-10 shadow-lg hover:shadow-violet-500/30"
                        style={{ animationDelay: `${i * 50}ms` }}
                      >
                        <img 
                          src={item.src} 
                          alt={item.label}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        <div className="absolute bottom-0 left-0 right-0 p-1.5 sm:p-2">
                          <span className="text-[10px] sm:text-xs font-bold text-white drop-shadow-lg">{item.label}</span>
                        </div>
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                      </div>
                    ))}
                  </div>
                  
                  {/* Speed badge */}
                  <div className="absolute -top-3 -right-3 md:-top-4 md:-right-4 z-20">
                    <div className="px-4 py-2 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-500/40 animate-pulse">
                      <span className="text-xs md:text-sm font-black text-white whitespace-nowrap">⚡ TURBO MODE</span>
                    </div>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-10">
                  <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-violet-500/10 to-violet-500/5 backdrop-blur-sm border border-violet-500/20 text-center group hover:border-violet-500/40 transition-all duration-300">
                    <div className="text-2xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-violet-400 to-violet-300 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">24x</div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-1">Paralelo</div>
                  </div>
                  <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-fuchsia-500/10 to-fuchsia-500/5 backdrop-blur-sm border border-fuchsia-500/20 text-center group hover:border-fuchsia-500/40 transition-all duration-300">
                    <div className="text-2xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-fuchsia-400 to-fuchsia-300 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">100+</div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-1">Imagens/min</div>
                  </div>
                  <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-500/5 backdrop-blur-sm border border-purple-500/20 text-center group hover:border-purple-500/40 transition-all duration-300">
                    <div className="text-2xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-purple-400 to-purple-300 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">85+</div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-1">Estilos</div>
                  </div>
                  <div className="p-3 sm:p-5 rounded-xl sm:rounded-2xl bg-gradient-to-br from-pink-500/10 to-pink-500/5 backdrop-blur-sm border border-pink-500/20 text-center group hover:border-pink-500/40 transition-all duration-300">
                    <div className="text-2xl sm:text-4xl md:text-5xl font-black bg-gradient-to-r from-pink-400 to-pink-300 bg-clip-text text-transparent group-hover:scale-110 transition-transform duration-300">∞</div>
                    <div className="text-xs sm:text-sm text-muted-foreground mt-1">Sem Limites</div>
                  </div>
                </div>
                
                {/* Live generation progress */}
                <div className="max-w-2xl mx-auto mb-6 sm:mb-10">
                  <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-xs sm:text-sm text-muted-foreground">Gerando imagens em tempo real...</span>
                      </div>
                      <span className="text-xs sm:text-sm font-bold text-violet-400">98 img/min</span>
                    </div>
                    <div className="h-2 sm:h-3 rounded-full bg-white/10 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-purple-500 relative overflow-hidden"
                        style={{ width: '92%' }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                      </div>
                    </div>
                    <div className="flex justify-between mt-1.5 sm:mt-2 text-[10px] sm:text-xs text-muted-foreground/60">
                      <span>92 de 100 imagens</span>
                      <span>ETA: 5s</span>
                    </div>
                  </div>
                </div>
                
                {/* Bottom features */}
                <div className="pt-4 sm:pt-8 border-t border-white/10">
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center sm:gap-4 md:gap-8">
                    <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-violet-400 flex-shrink-0" />
                      <span className="text-[10px] sm:text-sm">Qualidade Cinematográfica</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-fuchsia-400 flex-shrink-0" />
                      <span className="text-[10px] sm:text-sm">Ken Burns Automático</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400 flex-shrink-0" />
                      <span className="text-[10px] sm:text-sm">Consistência de Personagem</span>
                    </div>
                    <div className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10">
                      <Check className="w-4 h-4 sm:w-5 sm:h-5 text-pink-400 flex-shrink-0" />
                      <span className="text-[10px] sm:text-sm">Exportação DaVinci XML</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </AnimatedSection>

          {/* Transparency Features - Glass Premium */}
          <AnimatedSection>
            <Card className="relative p-8 md:p-14 bg-card/30 backdrop-blur-2xl border border-white/10 overflow-hidden shadow-2xl">
              {/* Decorative Elements */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
              <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/10 rounded-full blur-[80px]" />
              <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-500/10 rounded-full blur-[80px]" />
              
              <div className="relative">
                <div className="text-center mb-12">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/20 to-amber-500/20 border border-primary/30 backdrop-blur-xl mb-6">
                    <Crown className="w-4 h-4 text-primary" />
                    <span className="text-xs font-bold tracking-wider text-primary uppercase">Vantagens Exclusivas</span>
                  </div>
                  <h3 className="text-2xl md:text-4xl font-black mb-3">Por que somos diferentes?</h3>
                  <p className="text-muted-foreground/80 text-lg">Enquanto outros escondem, nós mostramos tudo</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                  <div className="text-center space-y-4 group p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5 hover:border-primary/30 transition-all duration-300">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center mx-auto group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
                      <Eye className="w-10 h-10 text-primary" />
                    </div>
                    <h4 className="font-bold text-xl">Zero Segredos</h4>
                    <p className="text-muted-foreground/80 leading-relaxed text-sm">
                      Você vê exatamente qual motor está gerando cada conteúdo. Nada é escondido.
                    </p>
                  </div>

                  <div className="text-center space-y-4 group p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5 hover:border-purple-500/30 transition-all duration-300">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 border border-purple-500/30 flex items-center justify-center mx-auto group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-purple-500/20 transition-all duration-300">
                      <Key className="w-10 h-10 text-purple-400" />
                    </div>
                    <h4 className="font-bold text-xl">Suas Próprias Chaves</h4>
                    <p className="text-muted-foreground/80 leading-relaxed text-sm">
                      Quer usar suas próprias API keys? Você pode. O sistema suporta nativamente.
                    </p>
                  </div>

                  <div className="text-center space-y-4 group p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5 hover:border-amber-500/30 transition-all duration-300">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 border border-amber-500/30 flex items-center justify-center mx-auto group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-amber-500/20 transition-all duration-300">
                      <Bot className="w-10 h-10 text-amber-400" />
                    </div>
                    <h4 className="font-bold text-xl">Agentes Personalizados</h4>
                    <p className="text-muted-foreground/80 leading-relaxed text-sm">
                      Crie seus próprios agentes com o modelo de IA que preferir. Totalmente customizável.
                    </p>
                  </div>

                  <div className="text-center space-y-4 group p-6 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/5 hover:border-green-500/30 transition-all duration-300">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/30 flex items-center justify-center mx-auto group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-green-500/20 transition-all duration-300">
                      <Shield className="w-10 h-10 text-green-400" />
                    </div>
                    <h4 className="font-bold text-xl">Você Manda</h4>
                    <p className="text-muted-foreground/80 leading-relaxed text-sm">
                      Escolha o motor ideal para cada tarefa. O poder está nas suas mãos.
                    </p>
                  </div>
                </div>

                <div className="mt-12 pt-10 border-t border-white/10">
                  <div className="flex flex-col md:flex-row items-center justify-center gap-6 md:gap-10">
                    <div className="flex items-center gap-4 px-6 py-4 rounded-2xl bg-gradient-to-r from-primary/10 to-purple-500/10 border border-white/10 backdrop-blur-sm">
                      <Layers className="w-8 h-8 text-primary" />
                      <div>
                        <p className="font-bold text-lg">Modo Multimodal</p>
                        <p className="text-sm text-muted-foreground/80">Compare 4 motores simultaneamente</p>
                      </div>
                    </div>
                    
                    <Link to="/auth">
                      <Button size="lg" className="gradient-button text-primary-foreground font-bold h-14 md:h-16 px-8 md:px-12 text-lg glow-primary group">
                        <Rocket className="w-6 h-6 mr-3 group-hover:animate-bounce" />
                        Garantir Minha Vaga
                        <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </Card>
          </AnimatedSection>
        </div>
      </section>

      {/* Viral Detection Section - Competitive Advantage */}
      <section className="py-20 md:py-28 px-4 relative overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 via-transparent to-orange-500/5 pointer-events-none" />
        <ParallaxLayer depth={0.3} className="absolute top-20 -right-20 w-72 h-72 bg-red-500/10 rounded-full blur-3xl pointer-events-none hidden md:block animate-pulse" />
        <ParallaxLayer depth={0.4} className="absolute bottom-20 -left-20 w-56 h-56 bg-orange-500/10 rounded-full blur-3xl pointer-events-none hidden md:block animate-pulse" />
        
        <div className="max-w-6xl mx-auto relative">
          <AnimatedSection className="text-center space-y-6 mb-14">
            {/* Premium badges */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30">
                <Flame className="w-5 h-5 animate-pulse" />
                <span className="text-base font-bold uppercase tracking-wide">Detecção de Virais</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 backdrop-blur-xl">
                <Zap className="w-4 h-4 text-green-400" />
                <span className="text-xs font-bold text-green-400">ALERTAS EMAIL + WHATSAPP</span>
              </div>
            </div>
            
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-black leading-tight">
              <span className="text-foreground">Saia na </span>
              <span className="bg-gradient-to-r from-red-400 via-orange-400 to-amber-400 bg-clip-text text-transparent">Frente da Concorrência</span>
            </h2>
            
            <p className="text-lg md:text-xl text-muted-foreground/80 leading-relaxed max-w-3xl mx-auto">
              Enquanto seus concorrentes ainda estão <span className="text-red-400 font-semibold">descobrindo o que viralizou ontem</span>, 
              você recebe alertas em <span className="text-orange-400 font-semibold">tempo real</span> sobre vídeos 
              explodindo no seu nicho.
            </p>
          </AnimatedSection>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12">
            {/* Real-time Detection */}
            <AnimatedItem index={0} staggerDelay={100}>
              <Card className="group relative p-8 bg-card/40 backdrop-blur-xl border border-white/10 hover:border-red-500/50 transition-all duration-500 overflow-hidden h-full shadow-2xl hover:shadow-red-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-400/60 to-transparent" />
                
                <div className="relative space-y-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-600/20 backdrop-blur-sm border border-red-500/30 flex items-center justify-center shadow-lg shadow-red-500/20 group-hover:scale-110 transition-all duration-300">
                    <Flame className="w-8 h-8 text-red-400" />
                  </div>
                  
                  <div>
                    <h3 className="font-black text-xl text-foreground">Detecção em Tempo Real</h3>
                    <p className="text-sm text-red-400/80 font-semibold">Monitoramento 24/7</p>
                  </div>
                  
                  <p className="text-sm text-muted-foreground/80 leading-relaxed">
                    Nossa IA monitora milhares de vídeos por hora e detecta padrões de viralização 
                    <span className="text-red-400 font-medium"> antes de explodirem</span>.
                  </p>
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="text-xs px-3 py-1.5 rounded-full bg-red-500/10 text-red-400/90 border border-red-500/20 font-medium">+1000 views/hora</span>
                    <span className="text-xs px-3 py-1.5 rounded-full bg-red-500/10 text-red-400/90 border border-red-500/20 font-medium">Filtro por nicho</span>
                  </div>
                </div>
              </Card>
            </AnimatedItem>

            {/* Email & WhatsApp Alerts */}
            <AnimatedItem index={1} staggerDelay={100}>
              <Card className="group relative p-8 bg-card/40 backdrop-blur-xl border border-white/10 hover:border-green-500/50 transition-all duration-500 overflow-hidden h-full shadow-2xl hover:shadow-green-500/20">
                <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-green-400/60 to-transparent" />
                <div className="absolute top-4 right-4 px-2 py-1 rounded-full bg-green-500/20 border border-green-500/30">
                  <span className="text-xs font-bold text-green-400">ATIVO</span>
                </div>
                
                <div className="relative space-y-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-sm border border-green-500/30 flex items-center justify-center shadow-lg shadow-green-500/20 group-hover:scale-110 transition-all duration-300">
                    <Mail className="w-8 h-8 text-green-400" />
                  </div>
                  
                  <div>
                    <h3 className="font-black text-xl text-foreground">Alertas por Email & WhatsApp</h3>
                    <p className="text-sm text-green-400/80 font-semibold">Notificações Instantâneas</p>
                  </div>
                  
                  <p className="text-sm text-muted-foreground/80 leading-relaxed">
                    Receba os vídeos virais do seu nicho diretamente no seu <span className="text-green-400 font-medium">email e WhatsApp</span>. 
                    Nunca mais perca uma oportunidade.
                  </p>
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="text-xs px-3 py-1.5 rounded-full bg-green-500/10 text-green-400/90 border border-green-500/20 font-medium">📧 Email</span>
                    <span className="text-xs px-3 py-1.5 rounded-full bg-green-500/10 text-green-400/90 border border-green-500/20 font-medium">📱 WhatsApp</span>
                  </div>
                </div>
              </Card>
            </AnimatedItem>

            {/* Competitive Edge */}
            <AnimatedItem index={2} staggerDelay={100}>
              <Card className="group relative p-8 bg-card/40 backdrop-blur-xl border border-white/10 hover:border-primary/50 transition-all duration-500 overflow-hidden h-full shadow-2xl hover:shadow-primary/20">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
                
                <div className="relative space-y-5">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-amber-600/20 backdrop-blur-sm border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/20 group-hover:scale-110 transition-all duration-300">
                    <TrendingUp className="w-8 h-8 text-primary" />
                  </div>
                  
                  <div>
                    <h3 className="font-black text-xl text-foreground">Vantagem Competitiva</h3>
                    <p className="text-sm text-primary/80 font-semibold">Horas na Frente</p>
                  </div>
                  
                  <p className="text-sm text-muted-foreground/80 leading-relaxed">
                    Publique seu vídeo sobre o tema viral <span className="text-primary font-medium">enquanto ainda está quente</span>. 
                    Chegue primeiro e pegue a onda do algoritmo.
                  </p>
                  
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary/90 border border-primary/20 font-medium">📊 Análise IA</span>
                    <span className="text-xs px-3 py-1.5 rounded-full bg-primary/10 text-primary/90 border border-primary/20 font-medium">🚀 1-Click Roteiro</span>
                  </div>
                </div>
              </Card>
            </AnimatedItem>
          </div>

          {/* CTA */}
          <AnimatedSection className="text-center">
            <Card className="inline-block p-8 md:p-10 bg-gradient-to-r from-red-500/10 via-card/40 to-orange-500/10 backdrop-blur-xl border border-red-500/20 shadow-2xl">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center animate-pulse">
                      <Flame className="w-7 h-7 text-white" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                      <span className="text-xs font-bold text-white">✓</span>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-lg">Detecte vídeos viralizando AGORA</p>
                    <p className="text-sm text-muted-foreground">Receba alertas por Email e WhatsApp!</p>
                  </div>
                </div>
                
                <Link to="/auth">
                  <Button size="lg" className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white font-bold h-14 px-8 text-lg shadow-lg shadow-red-500/30 group">
                    <Rocket className="w-5 h-5 mr-2 group-hover:animate-bounce" />
                    Quero Sair na Frente
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </Card>
          </AnimatedSection>
        </div>
      </section>

      {/* Styles Carousel Section */}
      <StylesCarousel />

      {/* DaVinci Resolve Section - Professional Upgrade */}
      <section className="py-16 md:py-24 px-4 relative overflow-hidden">
        <ParallaxLayer depth={0.3} className="absolute -top-20 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none hidden md:block" />
        
        <div className="max-w-5xl mx-auto relative">
          <AnimatedSection className="text-center space-y-6 md:space-y-8">
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-purple-500/20 to-violet-500/20 border border-purple-500/30">
              <Video className="w-5 h-5 text-purple-400" />
              <span className="text-sm md:text-base font-medium text-purple-300">WORKFLOW PROFISSIONAL</span>
            </div>
            
            {/* Animated DaVinci Icon */}
            <div className="flex justify-center mb-4">
              <div className="relative">
                {/* Outer glow ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-orange-500 via-purple-500 to-orange-500 animate-spin-slow blur-md opacity-60" style={{ width: '100px', height: '100px', margin: '-10px' }} />
                {/* Inner circle with icon */}
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 via-red-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-purple-500/30 animate-pulse-glow">
                  <div className="w-16 h-16 rounded-full bg-background/90 flex items-center justify-center">
                    <span className="text-2xl font-black bg-gradient-to-r from-orange-400 via-red-400 to-purple-400 bg-clip-text text-transparent">DR</span>
                  </div>
                </div>
                {/* Orbiting dot */}
                <div className="absolute w-3 h-3 rounded-full bg-primary animate-spin-slow" style={{ top: '50%', left: '-8px', transformOrigin: '48px center' }} />
              </div>
            </div>

            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold">
              Chega de edição
              <span className="block text-purple-400">amadora no celular</span>
            </h2>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Enquanto a maioria perde tempo com templates genéricos de CapCut, 
              nossos operadores dominam o <span className="text-primary font-semibold">DaVinci Resolve 20</span> — 
              o mesmo software usado por Hollywood. Exportação XML nativa, color grading cinematográfico 
              e workflow que separa <span className="text-purple-400 font-semibold">amadores de profissionais</span>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6">
              {/* Amateur Side */}
              <Card className="p-6 md:p-8 bg-card/50 border-destructive/30 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-destructive/50" />
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-destructive" />
                    </div>
                    <h3 className="text-xl font-bold text-destructive">Caminho Amador</h3>
                  </div>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive/50" />
                      Templates prontos e genéricos
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive/50" />
                      Marca d'água em tudo
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive/50" />
                      Qualidade limitada a 1080p
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive/50" />
                      Zero controle de cor
                    </li>
                  </ul>
                </div>
              </Card>

              {/* Pro Side */}
              <Card className="p-6 md:p-8 bg-card/50 border-primary/30 relative overflow-hidden group">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-500 to-primary" />
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <Rocket className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold text-primary">La Casa Dark CORE</h3>
                  </div>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      Exportação XML nativa para DaVinci
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      Color grading cinematográfico
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      Resolução 4K e HDR
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-primary" />
                      Workflow profissional completo
                    </li>
                  </ul>
                </div>
              </Card>
            </div>

            {/* Interactive Comparison Slider */}
            <div className="pt-8">
              <p className="text-sm text-muted-foreground mb-6 text-center">Arraste para ver a diferença</p>
              <ComparisonSlider />
            </div>

            <div className="pt-6">
              <Link to="/auth">
                <Button size="lg" className="gradient-button text-primary-foreground font-semibold h-14 md:h-16 px-8 md:px-12 text-lg glow-primary">
                  <Rocket className="w-5 h-5 md:w-6 md:h-6 mr-3" />
                  Elevar Meu Nível Agora
                  <ArrowRight className="w-5 h-5 md:w-6 md:h-6 ml-3" />
                </Button>
              </Link>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* Scroll indicator - line style */}
      <ScrollIndicator variant="line" />

      {/* How it Works - Zigzag Timeline - Glass Premium */}
      <section id="como-funciona" className="py-24 px-4 scroll-mt-20 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
        <ParallaxLayer depth={0.3} className="absolute top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none hidden md:block animate-pulse" />
        <ParallaxLayer depth={0.4} className="absolute bottom-20 -right-20 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none hidden md:block animate-pulse" />
        
        <div className="max-w-5xl mx-auto space-y-14 relative">
          <AnimatedSection className="text-center space-y-5">
            {/* Premium badges */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-primary to-amber-500 text-primary-foreground shadow-lg shadow-primary/30">
                <Zap className="w-5 h-5" />
                <span className="text-base font-bold">COMO FUNCIONA</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-emerald-500/20 to-green-500/20 border border-emerald-500/30 backdrop-blur-xl">
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400">MÉTODO VALIDADO</span>
              </div>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold italic">
              Do zero ao lucro em
            </h2>
            <h2 className="text-4xl md:text-6xl font-bold italic text-primary">
              4 passos simples
            </h2>
          </AnimatedSection>

          {/* Timeline - Glass Premium */}
          <div className="relative">
            {/* Vertical line with gradient */}
            <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-amber-500/50 to-purple-500/20 transform -translate-x-1/2 hidden md:block" />

            {steps.map((step, index) => (
              <AnimatedItem key={index} index={index} staggerDelay={150}>
                <div className={`flex items-center gap-10 mb-20 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
                  {/* Content - Glass Premium */}
                  <div className={`flex-1 ${index % 2 === 0 ? 'md:text-right md:pr-10' : 'md:text-left md:pl-10'}`}>
                    <Card className="group relative p-8 bg-card/40 backdrop-blur-xl border border-white/10 hover:border-primary/30 inline-block text-left overflow-hidden shadow-xl hover:shadow-primary/10 transition-all duration-300">
                      {/* Decorative elements */}
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="relative">
                        <h3 className="font-bold text-2xl mb-3">{step.title}</h3>
                        <p className="text-lg text-muted-foreground/80 mb-5">{step.desc}</p>
                        <div className="flex flex-wrap gap-3">
                          {step.badges.map((badge, i) => (
                            <span key={i} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 text-sm hover:border-primary/30 transition-colors">
                              <Check className="w-4 h-4 text-primary" />
                              {badge}
                            </span>
                          ))}
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Step number - Enhanced */}
                  <div className="relative z-10">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-amber-500 flex items-center justify-center text-primary-foreground font-black text-2xl shadow-2xl shadow-primary/50 ring-4 ring-primary/20">
                      {String(step.step).padStart(2, '0')}
                    </div>
                  </div>

                  {/* Spacer for zigzag */}
                  <div className="flex-1 hidden md:block" />
                </div>
              </AnimatedItem>
            ))}
          </div>
        </div>
      </section>

      {/* Scroll indicator - mouse style */}
      <ScrollIndicator variant="mouse" />

      {/* Results Section - Glass Premium */}
      <section className="py-24 px-4 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-primary/5 pointer-events-none" />
        
        <div className="max-w-7xl mx-auto space-y-14 relative">
          <AnimatedSection className="text-center space-y-5">
            {/* Premium badges */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-primary/20 to-amber-500/20 border border-primary/30 backdrop-blur-xl">
                <Star className="w-5 h-5 text-primary" />
                <span className="text-base font-bold text-primary">RESULTADOS COMPROVADOS</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 backdrop-blur-xl animate-pulse">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-xs font-bold text-green-400">+847 OPERADORES</span>
              </div>
            </div>
            <h2 className="text-4xl md:text-6xl font-bold italic">
              Operadores que estão
            </h2>
            <h2 className="text-4xl md:text-6xl font-bold italic text-primary">
              faturando alto
            </h2>
            <p className="text-xl text-muted-foreground/80">
              Resultados reais de pessoas que usam o Core para escalar seus canais dark
            </p>
          </AnimatedSection>

          {/* Testimonials Carousel */}
          <TestimonialCarousel testimonials={testimonials} />

          {/* Stats Strip - Glass Premium */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-10">
            {[
              { value: "50K+", label: "Vídeos gerados", color: "from-primary/20 to-amber-500/10" },
              { value: "847+", label: "Canais gerenciados", color: "from-purple-500/20 to-violet-500/10" },
              { value: "98%", label: "Taxa de satisfação", color: "from-emerald-500/20 to-green-500/10" },
              { value: "15K+", label: "Vídeos analisados", color: "from-blue-500/20 to-cyan-500/10" },
            ].map((stat, i) => (
              <Card key={i} className={`group relative p-6 bg-card/40 backdrop-blur-xl border border-white/10 hover:border-primary/30 transition-all duration-300 overflow-hidden shadow-xl hover:shadow-primary/10`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative text-center">
                  <p className="text-3xl md:text-4xl font-black text-gradient">{stat.value}</p>
                  <p className="text-sm text-muted-foreground/80 mt-1">{stat.label}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Metrics Dashboard - Glass Premium */}
          <AnimatedSection className="pt-10">
            <Card className="relative p-8 bg-card/40 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl">
              {/* Decorative elements */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/30 to-transparent" />
              
              <div className="relative">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="font-bold text-2xl">Dashboard em Tempo Real</h3>
                    <p className="text-base text-muted-foreground/80">Métricas atualizadas de um operador ativo</p>
                  </div>
                  <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-green-500/20 border border-green-500/30">
                    <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-sm font-bold text-green-400">Live</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {metrics.map((metric, i) => (
                    <Card key={i} className="group relative p-5 bg-white/5 backdrop-blur-sm border border-white/10 hover:border-primary/30 text-center transition-all duration-300 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <div className="relative">
                        {metric.status && (
                          <span className="inline-block px-3 py-1 rounded-full text-xs bg-green-500/20 text-green-400 font-bold mb-3">{metric.status}</span>
                        )}
                        <metric.icon className="w-7 h-7 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
                        <p className="text-2xl font-black">{metric.value}</p>
                        <p className="text-sm text-muted-foreground/80">{metric.label}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </Card>
          </AnimatedSection>
        </div>
      </section>

      {/* Marquee Strip - Premium Transition */}
      <div className="relative py-6 bg-gradient-to-r from-black via-background to-black overflow-hidden border-y border-primary/20">
        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent animate-pulse" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
        
        <div className="flex whitespace-nowrap animate-[marquee_25s_linear_infinite]">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-8">
              <span className="flex items-center gap-3 text-lg font-bold">
                <Diamond className="w-5 h-5 text-primary" />
                <span className="bg-gradient-to-r from-primary via-amber-400 to-primary bg-clip-text text-transparent">
                  ESCALE SUA OPERAÇÃO COM IA AVANÇADA
                </span>
              </span>
              <span className="text-primary/40">★</span>
              <span className="flex items-center gap-3 text-lg font-bold">
                <Rocket className="w-5 h-5 text-primary" />
                <span className="bg-gradient-to-r from-amber-400 via-primary to-amber-400 bg-clip-text text-transparent">
                  +15.000 VÍDEOS PRODUZIDOS NA PLATAFORMA
                </span>
              </span>
              <span className="text-primary/40">★</span>
              <span className="flex items-center gap-3 text-lg font-bold">
                <Crown className="w-5 h-5 text-primary" />
                <span className="bg-gradient-to-r from-primary via-amber-400 to-primary bg-clip-text text-transparent">
                  AUTOMATIZE 100% DO SEU FLUXO DE TRABALHO
                </span>
              </span>
              <span className="text-primary/40">★</span>
              <span className="flex items-center gap-3 text-lg font-bold">
                <Flame className="w-5 h-5 text-primary" />
                <span className="bg-gradient-to-r from-amber-400 via-primary to-amber-400 bg-clip-text text-transparent">
                  ACESSO EXCLUSIVO PARA MEMBROS ELITE
                </span>
              </span>
              <span className="text-primary/40">★</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Scroll indicator - arrow style */}
      <ScrollIndicator variant="arrow" />

      {/* Plans Section - Glass Premium */}
      <section id="planos" className="py-24 px-4 scroll-mt-20 relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
        <ParallaxLayer depth={0.25} className="absolute -top-10 right-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <ParallaxLayer depth={0.3} className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
        
        <div className="max-w-7xl mx-auto space-y-14 relative">
          <AnimatedSection className="text-center space-y-5">
            {/* Premium badges */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-primary/20 to-amber-500/20 border border-primary/30 backdrop-blur-xl">
                <Star className="w-5 h-5 text-primary" />
                <span className="text-base font-bold text-primary">$PRIVATE CORE - Alocação de Recursos</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 backdrop-blur-xl animate-pulse">
                <Crown className="w-4 h-4 text-red-400" />
                <span className="text-xs font-bold text-red-400">ELITE ONLY</span>
              </div>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold">
              Defina sua
            </h2>
            <h2 className="text-4xl md:text-5xl font-bold text-primary">
              Capacidade Operacional
            </h2>
            <p className="text-xl text-muted-foreground/80 max-w-2xl mx-auto">
              Os créditos determinam o volume, a frequência e a complexidade das execuções dentro do CORE. <Link to="/auth" className="text-primary underline hover:no-underline">Comece com o teste gratuito!</Link>
            </p>
          </AnimatedSection>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Free Plan - Glass Premium */}
            <AnimatedItem index={0} staggerDelay={100}>
              <Card className="group relative p-8 bg-card/40 backdrop-blur-xl border border-white/10 hover:border-white/20 h-full overflow-hidden shadow-xl transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
                
                <div className="relative">
                  <div className="mb-6">
                    <p className="text-sm text-muted-foreground/80 mb-2">50 créditos/mês</p>
                    <h3 className="font-bold text-xl">Acesso Inicial</h3>
                  </div>
                  <ul className="space-y-3 text-base text-muted-foreground/80 mb-8">
                    <li className="flex items-center gap-3"><Check className="w-5 h-5 text-muted-foreground/60" /> Ambiente de avaliação</li>
                    <li className="flex items-center gap-3"><Check className="w-5 h-5 text-muted-foreground/60" /> Recursos limitados</li>
                    <li className="flex items-center gap-3"><Check className="w-5 h-5 text-muted-foreground/60" /> Execuções básicas limitadas</li>
                    <li className="flex items-center gap-3"><Check className="w-5 h-5 text-muted-foreground/60" /> Análise de vídeos (restrita)</li>
                  </ul>
                  <Link to="/auth" className="block">
                    <Button variant="outline" className="w-full h-12 text-base border-white/20 hover:border-white/40">ATIVAR ACESSO INICIAL</Button>
                  </Link>
                </div>
              </Card>
            </AnimatedItem>

            {/* Start Plan - Glass Premium */}
            <AnimatedItem index={1} staggerDelay={100}>
              <Card className="group relative p-8 bg-card/40 backdrop-blur-xl border border-white/10 hover:border-primary/30 h-full overflow-hidden shadow-xl hover:shadow-primary/10 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-amber-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                
                <div className="relative">
                  <div className="mb-6">
                    <p className="text-sm text-primary font-semibold mb-2">800 créditos/mês</p>
                    <h3 className="font-bold text-xl">START CREATOR</h3>
                  </div>
                  <ul className="space-y-3 text-base text-muted-foreground/80 mb-8">
                    <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> 30-50 execuções mensais</li>
                    <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> ~200 min de processamento</li>
                    <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> Áudio: até ~30 min</li>
                    <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> Até 5 agentes operacionais</li>
                    <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> Armazenamento: 10 GB</li>
                  </ul>
                  <Link to="/auth" className="block">
                    <Button className="gradient-button w-full text-primary-foreground h-12 text-base">ATIVAR CAPACIDADE</Button>
                  </Link>
                </div>
              </Card>
            </AnimatedItem>

            {/* Turbo Plan - Glass Premium Featured */}
            <AnimatedItem index={2} staggerDelay={100}>
              <Card className="group relative pt-10 p-8 bg-card/40 backdrop-blur-xl border border-primary/50 h-full overflow-visible shadow-2xl shadow-primary/20 ring-2 ring-primary/30 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-amber-500/10 rounded-lg" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full bg-gradient-to-r from-primary to-amber-500 text-primary-foreground text-xs sm:text-sm font-bold shadow-lg shadow-primary/30 whitespace-nowrap z-10">
                  MAIS POPULAR
                </div>
                
                <div className="relative">
                  <div className="mb-6">
                    <p className="text-sm text-primary font-bold mb-2">1.600 créditos/mês</p>
                    <h3 className="font-bold text-xl">TURBO MAKER</h3>
                  </div>
                  <ul className="space-y-3 text-base text-muted-foreground/80 mb-8">
                    <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> 80-130 execuções mensais</li>
                    <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> ~400 min de processamento</li>
                    <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> Áudio: até ~60 min</li>
                    <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> Até 10 agentes operacionais</li>
                    <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> Armazenamento: 25 GB</li>
                    <li className="flex items-center gap-3"><Check className="w-5 h-5 text-primary" /> Geração de imagens premium</li>
                  </ul>
                  <Link to="/auth" className="block">
                    <Button className="gradient-button w-full text-primary-foreground h-12 text-base glow-primary">HABILITAR EXECUÇÃO</Button>
                  </Link>
                </div>
              </Card>
            </AnimatedItem>

            {/* Master Plan - Glass Premium */}
            <AnimatedItem index={3} staggerDelay={100}>
              <Card className="group relative pt-10 p-8 bg-card/40 backdrop-blur-xl border border-white/10 hover:border-purple-500/30 h-full overflow-visible shadow-xl hover:shadow-purple-500/10 transition-all duration-300">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
                
                <div className="absolute -top-3 right-4 px-3 py-1.5 rounded-full text-xs bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold shadow-lg z-10">
                  PRO
                </div>
                
                <div className="relative">
                  <div className="mb-6">
                    <p className="text-sm text-purple-400 font-semibold mb-2">3.200 créditos/mês</p>
                    <h3 className="font-bold text-xl">MASTER PRO</h3>
                  </div>
                  <ul className="space-y-3 text-base text-muted-foreground/80 mb-8">
                    <li className="flex items-center gap-3"><Check className="w-5 h-5 text-purple-400" /> 200-250 execuções mensais</li>
                    <li className="flex items-center gap-3"><Check className="w-5 h-5 text-purple-400" /> ~800 min de processamento</li>
                    <li className="flex items-center gap-3"><Check className="w-5 h-5 text-purple-400" /> Áudio: até ~120 min</li>
                    <li className="flex items-center gap-3"><Check className="w-5 h-5 text-purple-400" /> Agentes ilimitados</li>
                    <li className="flex items-center gap-3"><Check className="w-5 h-5 text-purple-400" /> Armazenamento: 50 GB</li>
                    <li className="flex items-center gap-3"><Check className="w-5 h-5 text-purple-400" /> API própria liberada</li>
                    <li className="flex items-center gap-3"><Check className="w-5 h-5 text-purple-400" /> Priority support</li>
                  </ul>
                  <Link to="/auth" className="block">
                    <Button variant="outline" className="w-full border-purple-500/50 text-purple-400 hover:bg-purple-500 hover:text-white h-12 text-base">ATIVAR INFRAESTRUTURA</Button>
                  </Link>
                </div>
              </Card>
            </AnimatedItem>
          </div>

          {/* Credit Packages - Glass Premium */}
          <AnimatedSection className="pt-14">
            <div className="text-center mb-10">
              <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-primary/20 to-amber-500/20 border border-primary/30 backdrop-blur-xl">
                <Zap className="w-5 h-5 text-primary" />
                <span className="text-base font-bold text-primary">Expansão Pontual de Capacidade</span>
              </div>
              <h3 className="text-3xl font-bold mt-5">
                Pacotes de <span className="text-primary">Créditos Avulsos</span>
              </h3>
              <p className="text-lg text-muted-foreground/80 mt-2">Ao final do mês, expanda seus gastos de Alocação</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { credits: "800", label: "Alocação básica", color: "from-primary/10 to-amber-500/5" },
                { credits: "1.600", label: "Expansão moderada", color: "from-emerald-500/10 to-green-500/5" },
                { credits: "2.400", label: "Escala Prolongada", color: "from-blue-500/10 to-cyan-500/5" },
                { credits: "10.000", label: "Enterprise", color: "from-purple-500/10 to-violet-500/5" },
                { credits: "20.000", label: "Enterprise Plus", color: "from-red-500/10 to-rose-500/5" },
              ].map((pkg, i) => (
                <Card key={i} className="group relative p-6 bg-card/40 backdrop-blur-xl border border-white/10 text-center hover:border-primary/30 transition-all duration-300 cursor-pointer overflow-hidden shadow-lg hover:shadow-primary/10">
                  <div className={`absolute inset-0 bg-gradient-to-br ${pkg.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="relative">
                    <p className="text-sm text-primary font-bold mb-2">{pkg.credits} CRÉDITOS</p>
                    <p className="text-base text-muted-foreground/80">{pkg.label}</p>
                    <Button variant="outline" size="sm" className="mt-4 w-full border-white/20 hover:border-primary/50">ALOCAR CRÉDITOS</Button>
                  </div>
                </Card>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* FAQ Section - Glass Premium */}
      <section id="faq" className="py-24 px-4 scroll-mt-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-purple-500/5 pointer-events-none" />
        
        <div className="max-w-4xl mx-auto space-y-14 relative">
          <AnimatedSection className="text-center space-y-5">
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-gradient-to-r from-primary/20 to-amber-500/20 border border-primary/30 backdrop-blur-xl">
              <Diamond className="w-5 h-5 text-primary" />
              <span className="text-base font-bold text-primary">TIRE SUAS DÚVIDAS</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold">
              Perguntas <span className="text-primary">Frequentes</span>
            </h2>
            <p className="text-xl text-muted-foreground/80">
              Tire suas dúvidas sobre o La Casa Dark Core
            </p>
          </AnimatedSection>

          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="group border border-white/10 rounded-xl px-8 bg-card/40 backdrop-blur-xl hover:border-primary/30 transition-all duration-300 overflow-hidden">
                <AccordionTrigger className="hover:no-underline py-6">
                  <span className="text-left text-lg font-semibold">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-lg text-muted-foreground/80 pb-6">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA - Glass Premium */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-purple-500/5 via-transparent to-primary/5 pointer-events-none" />
        
        <Card className="relative max-w-4xl mx-auto p-10 md:p-14 bg-card/40 backdrop-blur-xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
          
          <div className="relative text-center space-y-8">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-primary to-amber-500 text-primary-foreground shadow-lg shadow-primary/30">
                <Zap className="w-5 h-5" />
                <span className="text-base font-bold">PERÍODO DE TESTE DISPONÍVEL</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 backdrop-blur-xl animate-pulse">
                <Flame className="w-4 h-4 text-red-400" />
                <span className="text-xs font-bold text-red-400">APENAS 23 VAGAS</span>
              </div>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-bold">
              Pronto para <span className="text-primary">dominar seu nicho?</span>
            </h2>
            
            <p className="text-xl text-muted-foreground/80 max-w-xl mx-auto">
              Junte-se a <span className="text-primary font-semibold">milhares de criadores</span> que já estão escalando com ferramentas de nível enterprise.
            </p>

            <Link to="/auth">
              <Button size="lg" className="gradient-button text-primary-foreground font-bold h-16 md:h-18 px-10 md:px-14 text-xl glow-primary group">
                <Zap className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                Começar Período de Teste
                <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>

            <div className="flex flex-wrap items-center justify-center gap-6 text-base text-muted-foreground/80">
              <span className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                Suporte 24/7
              </span>
              <span className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                <div className="w-3 h-3 rounded-full bg-primary" />
                Teste grátis para começar
              </span>
              <span className="flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/10">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                Comunidade exclusiva
              </span>
            </div>
          </div>
        </Card>
      </section>

      {/* Second Marquee Strip - Before Footer */}
      <div className="relative overflow-hidden py-3 md:py-4 bg-gradient-to-r from-primary via-amber-500 to-primary">
        {/* Shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        <div className="flex animate-marquee-reverse whitespace-nowrap relative z-10">
          {[...Array(10)].map((_, i) => (
            <span key={i} className="mx-8 md:mx-16 text-sm md:text-lg font-bold uppercase tracking-widest text-primary-foreground flex items-center gap-3 md:gap-4 drop-shadow-lg">
              <Flame className="w-4 h-4 md:w-5 md:h-5" />
              AUTOMATIZE SUA OPERAÇÃO
              <span className="text-primary-foreground/80">•</span>
              ESCALE SEUS RESULTADOS
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="py-20 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-14">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-amber-400 to-primary animate-spin-slow opacity-75 blur-sm" />
                <div className="w-16 h-16 rounded-full overflow-hidden relative z-10 border-2 border-primary bg-black">
                  <img src={logo} alt="La Casa Dark CORE" className="w-full h-full object-cover" />
                </div>
              </div>
              <span className="font-bold text-2xl">La Casa Dark <span className="text-primary">CORE</span></span>
            </div>
            <p className="text-lg text-muted-foreground">
              A plataforma mais completa para criação e gestão de canais dark no YouTube. Ferramentas de IA, automação e analytics em um só lugar.
            </p>
            <div className="flex gap-4">
              <Button variant="outline" size="icon" className="rounded-full w-12 h-12">
                <Youtube className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full w-12 h-12">
                <Users className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full w-12 h-12">
                <Mail className="w-5 h-5" />
              </Button>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-5">Navegação</h4>
            <ul className="space-y-3 text-lg text-muted-foreground">
              <li><button onClick={() => scrollToSection("funcionalidades")} className="hover:text-foreground transition-colors">Funcionalidades</button></li>
              <li><button onClick={() => scrollToSection("como-funciona")} className="hover:text-foreground transition-colors">Como Funciona</button></li>
              <li><button onClick={() => scrollToSection("planos")} className="hover:text-foreground transition-colors">Planos</button></li>
              <li><button onClick={() => scrollToSection("faq")} className="hover:text-foreground transition-colors">FAQ</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-lg mb-5">Contato</h4>
            <ul className="space-y-3 text-lg text-muted-foreground">
              <li>
                <span className="text-foreground">Email:</span><br />
                <a href="mailto:suporte@canaisdarks.com.br" className="text-primary hover:underline">suporte@canaisdarks.com.br</a>
              </li>
              <li>
                <span className="text-foreground">Horário:</span><br />
                Seg-Sex, 9h às 18h
              </li>
            </ul>
            <Card className="mt-5 p-5 bg-primary/10 border-primary/30">
              <p className="font-semibold text-base">Período de Teste</p>
              <p className="text-sm text-muted-foreground">Experimente gratuitamente antes de assinar!</p>
            </Card>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-14 pt-10 border-t border-border flex flex-col md:flex-row items-center justify-between gap-5 text-base text-muted-foreground">
          <p>© 2026 La Casa Dark CORE. Todos os direitos reservados.</p>
          <div className="flex gap-8">
            <Link to="/terms" className="hover:text-foreground transition-colors">Termos de Uso</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Política de Privacidade</Link>
          </div>
        </div>
      </footer>

      {/* Purchase Notifications */}
      <PurchaseNotifications />

      {/* Auto Chat */}
      <AutoChat />
      </div>
    </>
  );
};

export default Landing;
