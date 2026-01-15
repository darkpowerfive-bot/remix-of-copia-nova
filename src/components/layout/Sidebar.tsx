import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useCredits } from "@/hooks/useCredits";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { useNavigate, useLocation, Link } from "react-router-dom";
import logo from "@/assets/logo.gif";

// Prefetch routes on hover for faster navigation
const prefetchedRoutes = new Set<string>();
const prefetchRoute = (href: string) => {
  if (prefetchedRoutes.has(href)) return;
  prefetchedRoutes.add(href);
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = href;
  document.head.appendChild(link);
};

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
  ChevronLeft,
  ChevronRight,
  LogOut,
  History,
  GripVertical,
  RotateCcw,
  Coins,
  Calendar,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CreditHistoryModal } from "@/components/credits/CreditHistoryModal";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  id: string;
  category?: string;
}

// Ordem cronológica de produção de vídeo
const defaultNavItems: NavItem[] = [
  { id: "home", icon: Home, label: "Início", href: "/", category: "home" },
  { id: "explore", icon: Compass, label: "Explorar Nicho", href: "/explore", category: "pesquisa" },
  { id: "channel-analyzer", icon: BarChart3, label: "Análise de Canais", href: "/channel-analyzer", category: "pesquisa" },
  { id: "library", icon: Library, label: "Biblioteca Virais", href: "/library", category: "planejamento" },
  { id: "channels", icon: Eye, label: "Canais Monitorados", href: "/channels", category: "planejamento" },
  { id: "schedule", icon: Calendar, label: "Agenda de Publicação", href: "/schedule", category: "planejamento" },
  { id: "analyzer", icon: Video, label: "Analisador de Vídeos", href: "/analyzer", category: "analise" },
  { id: "history", icon: History, label: "Histórico de Análises", href: "/history", category: "analise" },
  { id: "viral-script", icon: Flame, label: "Roteiro Viral", href: "/viral-script", category: "criacao" },
  { id: "agents", icon: Bot, label: "Agentes Virais", href: "/agents", category: "criacao" },
  { id: "scenes", icon: Film, label: "Gerador de Cenas", href: "/scenes", category: "criacao" },
  { id: "prompts", icon: Image, label: "Prompts e Imagens", href: "/prompts", category: "criacao" },
  { id: "voice", icon: Mic, label: "Gerador de Voz", href: "/voice", category: "producao" },
  { id: "srt", icon: FileText, label: "Conversor SRT", href: "/srt", category: "producao" },
  { id: "youtube", icon: Youtube, label: "Integração YouTube", href: "/youtube", category: "publicacao" },
  { id: "analytics", icon: BarChart3, label: "Analytics", href: "/analytics", category: "metricas" },
  { id: "folders", icon: FolderOpen, label: "Pastas e Histórico", href: "/folders", category: "organizacao" },
  { id: "settings", icon: Settings, label: "Configurações", href: "/settings", category: "organizacao" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>(defaultNavItems);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const dragOverId = useRef<string | null>(null);
  
  const { signOut } = useAuth();
  const { role } = useProfile();
  const { balance: creditsBalance, loading: creditsLoading } = useCredits();
  const { sidebarOrder, saveSidebarOrder, isLoading: prefsLoading } = useUserPreferences();
  
  const navigate = useNavigate();
  const location = useLocation();
  
  const isLowCredits = creditsBalance < 50;

  // Reorder items based on saved order
  const reorderItems = useCallback((orderIds: string[]) => {
    const reorderedItems = orderIds
      .map(id => defaultNavItems.find(item => item.id === id))
      .filter((item): item is NavItem => item !== undefined);
    
    // Add any new items that weren't in saved order
    defaultNavItems.forEach(item => {
      if (!reorderedItems.find(i => i.id === item.id)) {
        reorderedItems.push(item);
      }
    });
    
    return reorderedItems;
  }, []);

  // Apply saved order from useUserPreferences
  useEffect(() => {
    if (!prefsLoading && sidebarOrder && sidebarOrder.length > 0) {
      setNavItems(reorderItems(sidebarOrder));
    }
  }, [sidebarOrder, prefsLoading, reorderItems]);

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    dragOverId.current = id;
  };

  const handleDragEnd = () => {
    if (draggedId && dragOverId.current && draggedId !== dragOverId.current) {
      const draggedIndex = navItems.findIndex(item => item.id === draggedId);
      const overIndex = navItems.findIndex(item => item.id === dragOverId.current);
      
      if (draggedIndex !== -1 && overIndex !== -1) {
        const newItems = [...navItems];
        const [removed] = newItems.splice(draggedIndex, 1);
        newItems.splice(overIndex, 0, removed);
        setNavItems(newItems);
        saveSidebarOrder(newItems.map(i => i.id));
      }
    }
    setDraggedId(null);
    dragOverId.current = null;
  };

  const resetOrder = () => {
    setNavItems(defaultNavItems);
    saveSidebarOrder(defaultNavItems.map(i => i.id));
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/auth");
  };

  const userRole = role?.role ?? "free";

  const roleLabels = {
    admin: "ADMIN",
    pro: "PRO",
    free: "FREE",
  };

  return (
    <aside
      className={cn(
        "h-screen bg-sidebar border-r border-sidebar-border flex-col transition-all duration-300 hidden md:flex",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-full ring-2 ring-primary overflow-hidden">
            <img 
              src={logo} 
              alt="Logo" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-playfair text-lg font-semibold text-foreground tracking-wide">La Casa Dark</span>
            <span className="text-primary text-sm font-bold tracking-widest">CORE</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto text-muted-foreground hover:text-foreground"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        {!collapsed && (
          <div className="flex items-center justify-between px-3 mb-2">
            <span className="text-xs text-muted-foreground">Arraste para reordenar</span>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                  onClick={resetOrder}
                >
                  <RotateCcw className="w-3 h-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Restaurar ordem padrão</TooltipContent>
            </Tooltip>
          </div>
        )}
        
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || (item.href === "/" && location.pathname === "/dashboard");
            const Icon = item.icon;
            
            return (
              <div
                key={item.id}
                draggable={!collapsed}
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragOver={(e) => handleDragOver(e, item.id)}
                onDragEnd={handleDragEnd}
                className={cn(
                  draggedId === item.id && "opacity-50"
                )}
              >
                <Link
                  to={item.href}
                  onMouseEnter={() => prefetchRoute(item.href)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2.5 rounded-lg transition-colors duration-100",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
                  )}
                >
                  {!collapsed && (
                    <div className="cursor-grab active:cursor-grabbing touch-none">
                      <GripVertical className="w-4 h-4 flex-shrink-0 opacity-30 hover:opacity-70" />
                    </div>
                  )}
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && <span className="text-sm font-medium text-left flex-1">{item.label}</span>}
                </Link>
              </div>
            );
          })}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="p-4 border-t border-sidebar-border space-y-4">
        {/* Credits Section - Compact */}
        {!collapsed ? (
          <div className={cn(
            "p-2 rounded-lg bg-secondary/50 border space-y-1.5",
            isLowCredits 
              ? "border-primary/50 shadow-[0_0_10px_hsl(var(--primary)/0.2)]" 
              : "border-border"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Coins className={cn("w-3.5 h-3.5", isLowCredits ? "text-destructive" : "text-primary")} />
                <span className="text-xs text-muted-foreground">Créditos</span>
              </div>
              <span className={cn(
                "text-base font-bold",
                isLowCredits ? "text-destructive" : "text-primary"
              )}>
                {creditsLoading ? "..." : creditsBalance.toLocaleString()}
              </span>
            </div>
            <Button 
              className={cn(
                "w-full h-7 text-xs",
                isLowCredits 
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" 
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              )}
              size="sm"
              onClick={() => navigate("/plans")}
            >
              Comprar Créditos
            </Button>
            <button
              onClick={() => setHistoryModalOpen(true)}
              className="w-full text-[10px] text-muted-foreground hover:text-primary transition-colors"
            >
              Ver Histórico
            </button>
          </div>
        ) : (
          <div className="flex justify-center">
            <button onClick={() => setHistoryModalOpen(true)}>
              <Coins className={cn(
                "w-5 h-5 cursor-pointer hover:scale-110 transition-transform",
                isLowCredits ? "text-destructive" : "text-primary"
              )} />
            </button>
          </div>
        )}

        <CreditHistoryModal 
          open={historyModalOpen} 
          onOpenChange={setHistoryModalOpen} 
        />


        {/* Plan */}
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Crown className="w-5 h-5 text-primary flex-shrink-0" />
          {!collapsed && (
            <div className="flex-1">
              <div className="text-sm text-muted-foreground">Plano Atual</div>
              <div className="text-foreground font-semibold">{roleLabels[userRole]}</div>
            </div>
          )}
        </div>

        {/* Admin Panel */}
        {userRole === "admin" && (
          <button
            onClick={() => navigate("/admin")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-primary hover:bg-sidebar-accent transition-colors",
              collapsed && "justify-center"
            )}
          >
            <Shield className="w-5 h-5" />
            {!collapsed && <span className="text-sm font-medium">Painel Admin</span>}
          </button>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-colors",
            collapsed && "justify-center"
          )}
        >
          <LogOut className="w-5 h-5" />
          {!collapsed && <span className="text-sm font-medium">Sair</span>}
        </button>
      </div>
    </aside>
  );
}