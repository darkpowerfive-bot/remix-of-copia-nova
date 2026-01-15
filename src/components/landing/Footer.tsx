import { Youtube, Instagram, Mail, Crown, Zap, Check } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card to-background" />
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
      
      <div className="container mx-auto px-6 relative z-10 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <Crown className="w-7 h-7 text-primary-foreground" />
              </div>
              <div>
                <span className="font-black text-2xl text-foreground">La Casa Dark</span>
                <span className="font-black text-2xl text-primary ml-1">CORE</span>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed max-w-md mb-6">
              A plataforma mais completa para criação e gestão de canais dark no YouTube.
            </p>
            <div className="flex gap-4">
              <a href="https://www.youtube.com/@lacasadarkcore" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-all hover:scale-110">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="https://www.instagram.com/lacasadarkcore" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-pink-500 transition-all hover:scale-110">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="mailto:suporte@canaisdarks.com.br" className="w-10 h-10 rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-primary transition-all hover:scale-110">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-foreground mb-4 text-lg">Legal</h4>
            <ul className="space-y-3">
              <li><a href="https://canaisdarks.com.br/termos-de-uso" className="text-muted-foreground hover:text-primary transition-colors">Termos de Uso</a></li>
              <li><a href="https://canaisdarks.com.br/politica-de-privacidade" className="text-muted-foreground hover:text-primary transition-colors">Política de Privacidade</a></li>
            </ul>
          </div>
        </div>
        {/* Feature Badges */}
        <div className="flex flex-wrap justify-center gap-3 md:gap-4 mb-8">
          <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2 md:py-3 rounded-full bg-card border border-primary/30">
            <Zap className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            <span className="text-sm md:text-base">Melhores APIs do mercado</span>
          </div>
          <div className="inline-flex items-center gap-2 md:gap-3 px-4 md:px-5 py-2 md:py-3 rounded-full bg-card border border-border">
            <Check className="w-4 h-4 md:w-5 md:h-5 text-muted-foreground" />
            <span className="text-sm md:text-base text-muted-foreground">Ferramenta em constante atualização</span>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border/50 text-center">
          <p className="text-muted-foreground text-sm">© 2026 La Casa Dark CORE. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
