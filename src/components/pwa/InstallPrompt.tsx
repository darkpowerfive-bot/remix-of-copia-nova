import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X, Smartphone, Share, MoreVertical } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import logo from "@/assets/logo.gif";

// Detect iOS
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

// Detect if in standalone mode
const isStandalone = () => {
  return window.matchMedia("(display-mode: standalone)").matches || 
         (window.navigator as any).standalone === true;
};

// Detect Android
const isAndroid = () => {
  return /Android/.test(navigator.userAgent);
};

export function InstallPrompt() {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Initial check for mobile devices - run immediately
  useEffect(() => {
    // Check if already dismissed recently
    const wasDismissed = localStorage.getItem("pwa-install-dismissed");
    const dismissedAt = localStorage.getItem("pwa-install-dismissed-at");
    
    if (wasDismissed && dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const now = Date.now();
      const hoursElapsed = (now - dismissedTime) / (1000 * 60 * 60);
      
      if (hoursElapsed < 24) {
        setDismissed(true);
        setInitialCheckDone(true);
        return;
      } else {
        localStorage.removeItem("pwa-install-dismissed");
        localStorage.removeItem("pwa-install-dismissed-at");
      }
    }

    // Don't show if already installed or in standalone mode
    if (isInstalled || isStandalone()) {
      setInitialCheckDone(true);
      return;
    }

    // Show immediately on page load
    setShowPrompt(true);
    setInitialCheckDone(true);
  }, [isInstalled]);

  // Secondary check for native install prompt (desktop browsers)
  useEffect(() => {
    if (!initialCheckDone || dismissed || isInstalled || isStandalone()) {
      return;
    }

    // If native install prompt becomes available, show it
    if (isInstallable && !showPrompt) {
      setShowPrompt(true);
    }
  }, [isInstallable, initialCheckDone, dismissed, isInstalled, showPrompt]);

  const handleInstall = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setShowPrompt(false);
      }
    } else if (isIOS()) {
      setShowIOSInstructions(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem("pwa-install-dismissed", "true");
    localStorage.setItem("pwa-install-dismissed-at", Date.now().toString());
  };

  // Don't show if installed, dismissed, or prompt not active
  if (isInstalled || isStandalone() || dismissed || !showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[9999] animate-in slide-in-from-bottom-4 duration-500 md:left-auto md:right-6 md:max-w-sm">
      <div
        className="relative rounded-2xl p-5 backdrop-blur-xl overflow-hidden"
        style={{
          background: "linear-gradient(180deg, rgba(20, 20, 25, 0.95) 0%, rgba(10, 10, 15, 0.98) 100%)",
          border: "1px solid rgba(34, 197, 94, 0.3)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(34, 197, 94, 0.2)",
        }}
      >
        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border border-primary/30 shadow-[0_0_15px_rgba(34,197,94,0.3)]">
            <img src={logo} alt="La Casa Dark" className="w-full h-full object-cover" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Smartphone className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                Instalar App
              </span>
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">
              La Casa Dark CORE
            </h3>
            
            {showIOSInstructions ? (
              // iOS Manual Instructions
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Para instalar no iPhone/iPad:
                </p>
                <div className="flex items-center gap-2 text-xs text-foreground bg-secondary/50 rounded-lg p-2">
                  <Share className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Toque em <strong>Compartilhar</strong></span>
                </div>
                <div className="flex items-center gap-2 text-xs text-foreground bg-secondary/50 rounded-lg p-2">
                  <Download className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Depois <strong>"Adicionar à Tela Inicial"</strong></span>
                </div>
                <Button
                  onClick={handleDismiss}
                  variant="outline"
                  className="w-full h-9 text-xs mt-2"
                >
                  Entendi
                </Button>
              </div>
            ) : isIOS() ? (
              // iOS Initial State
              <>
                <p className="text-xs text-muted-foreground mb-3">
                  Instale para acesso rápido e experiência completa
                </p>
                <Button
                  onClick={handleInstall}
                  className="w-full h-10 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Share className="w-4 h-4 mr-2" />
                  Como Instalar
                </Button>
              </>
            ) : isAndroid() && !isInstallable ? (
              // Android without native prompt - show menu instructions
              <>
                <p className="text-xs text-muted-foreground mb-2">
                  Para instalar:
                </p>
                <div className="flex items-center gap-2 text-xs text-foreground bg-secondary/50 rounded-lg p-2 mb-2">
                  <MoreVertical className="w-4 h-4 text-primary flex-shrink-0" />
                  <span>Menu do navegador → <strong>"Instalar app"</strong></span>
                </div>
                <Button
                  onClick={handleDismiss}
                  variant="outline"
                  className="w-full h-9 text-xs"
                >
                  Entendi
                </Button>
              </>
            ) : (
              // Native Install Available
              <>
                <p className="text-xs text-muted-foreground mb-3">
                  Instale para acesso rápido e experiência completa offline
                </p>
                <Button
                  onClick={handleInstall}
                  className="w-full h-10 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Instalar Agora
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default InstallPrompt;