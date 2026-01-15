import { useEffect, useState } from "react";
import { Wrench, Clock, RefreshCw, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { SEOHead } from "@/components/seo/SEOHead";
import logo from "@/assets/logo_1.gif";

interface MaintenanceSettings {
  is_active: boolean;
  message: string;
  estimated_end_time: string | null;
  show_countdown: boolean;
}

const Maintenance = () => {
  const [settings, setSettings] = useState<MaintenanceSettings | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchMaintenanceSettings();
  }, []);

  useEffect(() => {
    if (!settings?.estimated_end_time || !settings.show_countdown) return;

    const updateCountdown = () => {
      const now = new Date().getTime();
      const end = new Date(settings.estimated_end_time!).getTime();
      const distance = end - now;

      if (distance < 0) {
        setTimeLeft("Em breve!");
        return;
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [settings?.estimated_end_time, settings?.show_countdown]);

  const fetchMaintenanceSettings = async () => {
    const { data } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'global_maintenance')
      .maybeSingle();

    if (data?.value && typeof data.value === 'object' && !Array.isArray(data.value)) {
      const value = data.value as Record<string, unknown>;
      setSettings({
        is_active: Boolean(value.is_active),
        message: String(value.message || ''),
        estimated_end_time: value.estimated_end_time ? String(value.estimated_end_time) : null,
        show_countdown: Boolean(value.show_countdown),
      });
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchMaintenanceSettings();
    
    // Check if maintenance is still active
    const { data } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'global_maintenance')
      .maybeSingle();

    const value = data?.value as Record<string, unknown> | null;
    if (!value || !value.is_active) {
      window.location.href = '/';
    }
    
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const formattedTime = settings?.estimated_end_time
    ? format(new Date(settings.estimated_end_time), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })
    : null;

  return (
    <>
      <SEOHead
        title="Em Manutenção"
        description="Estamos trabalhando para melhorar sua experiência. Voltamos em breve!"
        noindex={true}
      />
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse delay-1000" />
      
      {/* Content */}
      <div className="relative z-10 max-w-lg w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-card/80 backdrop-blur-sm border border-primary/30 flex items-center justify-center overflow-hidden shadow-2xl shadow-primary/20">
            <img 
              src={logo} 
              alt="Logo" 
              className="w-20 h-20 object-cover scale-110 rounded-full"
            />
          </div>
        </div>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
            <Wrench className="w-10 h-10 text-primary" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Estamos em Manutenção
          </h1>
          <p className="text-muted-foreground text-lg">
            {settings?.message || "Estamos trabalhando para melhorar sua experiência. Voltamos em breve!"}
          </p>
        </div>

        {/* Countdown */}
        {settings?.show_countdown && timeLeft && (
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-2xl p-6 space-y-3">
            <p className="text-sm text-muted-foreground uppercase tracking-wider">
              Tempo estimado de retorno
            </p>
            <div className="text-5xl font-mono font-bold text-primary tracking-widest">
              {timeLeft}
            </div>
          </div>
        )}

        {/* Estimated time */}
        {formattedTime && !settings?.show_countdown && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground bg-secondary/30 py-3 px-6 rounded-xl border border-border">
            <Clock className="w-5 h-5" />
            <span>Previsão: <strong className="text-foreground">{formattedTime}</strong></span>
          </div>
        )}

        {/* Info card */}
        <div className="bg-card/30 backdrop-blur-sm border border-border rounded-xl p-6 text-left space-y-4">
          <div className="flex items-start gap-3">
            <Rocket className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground">Estamos atualizando!</p>
              <p className="text-sm text-muted-foreground">
                Novas funcionalidades e melhorias estão sendo implementadas.
              </p>
            </div>
          </div>
        </div>

        {/* Refresh button */}
        <Button 
          onClick={handleRefresh}
          variant="outline"
          size="lg"
          className="gap-2"
          disabled={isRefreshing}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Verificar Novamente
        </Button>

        {/* Footer */}
        <p className="text-xs text-muted-foreground/60">
          La Casa Dark CORE © {new Date().getFullYear()}
        </p>
      </div>
    </div>
    </>
  );
};

export default Maintenance;
