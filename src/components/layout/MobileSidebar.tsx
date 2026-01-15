import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useCredits } from "@/hooks/useCredits";
import { useNavigate, useLocation } from "react-router-dom";
import logo from "@/assets/logo.gif";
import {
  Home,
  Video,
  Compass,
  FolderOpen,
  Eye,
  BarChart3,
  Library,
  Bot,
  Image,
  Mic,
  Film,
  Youtube,
  FileText,
  Settings,
  Crown,
  Shield,
  LogOut,
  History,
  Menu,
  X,
  Coins,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  id: string;
}

const navItems: NavItem[] = [
  { id: "home", icon: Home, label: "Início", href: "/" },
  { id: "explore", icon: Compass, label: "Explorar Nicho", href: "/explore" },
  { id: "channel-analyzer", icon: BarChart3, label: "Análise de Canais", href: "/channel-analyzer" },
  { id: "library", icon: Library, label: "Biblioteca Virais", href: "/library" },
  { id: "channels", icon: Eye, label: "Canais Monitorados", href: "/channels" },
  { id: "analyzer", icon: Video, label: "Analisador de Vídeos", href: "/analyzer" },
  { id: "history", icon: History, label: "Histórico de Análises", href: "/history" },
  { id: "agents", icon: Bot, label: "Agentes Virais", href: "/agents" },
  { id: "scenes", icon: Film, label: "Gerador de Cenas", href: "/scenes" },
  { id: "prompts", icon: Image, label: "Prompts e Imagens", href: "/prompts" },
  { id: "voice", icon: Mic, label: "Gerador de Voz", href: "/voice" },
  { id: "srt", icon: FileText, label: "Conversor SRT", href: "/srt" },
  { id: "youtube", icon: Youtube, label: "Integração YouTube", href: "/youtube" },
  { id: "analytics", icon: BarChart3, label: "Analytics", href: "/analytics" },
  { id: "folders", icon: FolderOpen, label: "Pastas e Histórico", href: "/folders" },
  { id: "settings", icon: Settings, label: "Configurações", href: "/settings" },
];

export function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const { signOut } = useAuth();
  const { role } = useProfile();
  const { balance: creditsBalance, loading: creditsLoading } = useCredits();
  const navigate = useNavigate();
  const location = useLocation();

  const userRole = role?.role ?? "free";
  const isLowCredits = creditsBalance < 50;

  const roleLabels = {
    admin: "ADMIN",
    pro: "PRO",
    free: "FREE",
  };

  const handleNavigate = (href: string) => {
    navigate(href);
    setOpen(false);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden fixed top-4 left-4 z-50 bg-background/80 backdrop-blur-sm border border-border"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0 bg-sidebar border-r border-sidebar-border">
        <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
        
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
          <div className="relative flex-shrink-0">
            <div className="w-12 h-12 rounded-full ring-2 ring-primary overflow-hidden">
              <img src={logo} alt="Logo" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-playfair text-lg font-semibold text-foreground tracking-wide">La Casa Dark</span>
            <span className="text-primary text-sm font-bold tracking-widest">CORE</span>
          </div>
        </div>

        {/* Credits */}
        <div className={cn(
          "mx-4 mt-4 p-3 rounded-xl bg-secondary/50 border transition-all",
          isLowCredits 
            ? "border-primary/50 shadow-[0_0_15px_hsl(var(--primary)/0.3)]" 
            : "border-border"
        )}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Coins className={cn("w-4 h-4", isLowCredits ? "text-destructive" : "text-primary")} />
              <span className="text-sm">Créditos</span>
            </div>
            <div className={cn(
              "text-xl font-bold",
              isLowCredits ? "text-destructive" : "text-primary"
            )}>
              {creditsLoading ? "..." : creditsBalance.toLocaleString()}
            </div>
          </div>
          <Button 
            className={cn(
              "w-full mt-2",
              isLowCredits 
                ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                : "bg-primary text-primary-foreground hover:bg-primary/90"
            )}
            size="sm"
            onClick={() => handleNavigate("/plans")}
          >
            Comprar Créditos
          </Button>
        </div>

        {/* Plan badge */}
        <div className="mx-4 mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/30">
          <Crown className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">Plano:</span>
          <span className="text-sm font-semibold text-foreground">{roleLabels[userRole]}</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 max-h-[calc(100vh-320px)]">
          <div className="space-y-1">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.href)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 text-left",
                  location.pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>

        {/* Bottom actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-sidebar-border bg-sidebar space-y-2">
          {userRole === "admin" && (
            <button
              onClick={() => handleNavigate("/admin")}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-primary hover:bg-sidebar-accent transition-colors"
            >
              <Shield className="w-5 h-5" />
              <span className="text-sm font-medium">Painel Admin</span>
            </button>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm font-medium">Sair</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
