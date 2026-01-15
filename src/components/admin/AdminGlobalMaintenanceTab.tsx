import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Globe, Save, Loader2, Clock, AlertTriangle, ExternalLink, Monitor, Wrench, Rocket, RefreshCw, BellRing } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Json } from "@/integrations/supabase/types";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import logo from "@/assets/logo_1.gif";

interface GlobalMaintenanceSettings {
  is_active: boolean;
  message: string;
  estimated_end_time: string | null;
  show_countdown: boolean;
}

const DEFAULT_SETTINGS: GlobalMaintenanceSettings = {
  is_active: false,
  message: "Estamos realizando uma atualização programada. Voltamos em breve!",
  estimated_end_time: null,
  show_countdown: true,
};

export const AdminGlobalMaintenanceTab = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<GlobalMaintenanceSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'global_maintenance')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data?.value && typeof data.value === 'object' && !Array.isArray(data.value)) {
        const value = data.value as Record<string, unknown>;
        setSettings({
          is_active: Boolean(value.is_active),
          message: String(value.message || DEFAULT_SETTINGS.message),
          estimated_end_time: value.estimated_end_time ? String(value.estimated_end_time) : null,
          show_countdown: value.show_countdown !== false,
        });
      }
    } catch (error) {
      console.error('Error fetching global maintenance settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      // Check if the setting exists
      const { data: existing } = await supabase
        .from('admin_settings')
        .select('id')
        .eq('key', 'global_maintenance')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('admin_settings')
          .update({
            value: settings as unknown as Json,
            updated_at: new Date().toISOString(),
            updated_by: user?.id,
          })
          .eq('key', 'global_maintenance');

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('admin_settings')
          .insert([{
            key: 'global_maintenance',
            value: settings as unknown as Json,
            updated_by: user?.id,
          }]);

        if (error) throw error;
      }

      toast.success('Configurações salvas!');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleMaintenance = async (enabled: boolean) => {
    const newSettings = { ...settings, is_active: enabled };
    setSettings(newSettings);

    // Auto-save when toggling
    setIsSaving(true);
    try {
      const { data: existing } = await supabase
        .from('admin_settings')
        .select('id')
        .eq('key', 'global_maintenance')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('admin_settings')
          .update({
            value: newSettings as unknown as Json,
            updated_at: new Date().toISOString(),
            updated_by: user?.id,
          })
          .eq('key', 'global_maintenance');
      } else {
        await supabase
          .from('admin_settings')
          .insert([{
            key: 'global_maintenance',
            value: newSettings as unknown as Json,
            updated_by: user?.id,
          }]);
      }

      if (enabled) {
        toast.warning('🚧 Modo manutenção ATIVADO! Todos os usuários serão redirecionados.');
      } else {
        toast.success('✅ Modo manutenção desativado. Plataforma online!');
      }
    } catch (error) {
      console.error('Error toggling maintenance:', error);
      toast.error('Erro ao salvar');
      setSettings(settings); // Revert
    } finally {
      setIsSaving(false);
    }
  };

  const sendMaintenanceEndNotification = async () => {
    setIsSendingNotification(true);
    try {
      // Broadcast maintenance end notification to all connected users
      const channel = supabase.channel('maintenance-broadcast');
      
      await channel.send({
        type: 'broadcast',
        event: 'maintenance_end',
        payload: {
          message: '🎉 A manutenção foi concluída! A plataforma está online novamente.',
          timestamp: new Date().toISOString(),
        },
      });
      
      await supabase.removeChannel(channel);
      
      toast.success('📢 Notificação de teste enviada para usuários conectados!');
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Erro ao enviar notificação');
    } finally {
      setIsSendingNotification(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" />
            Manutenção Global
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Ative para redirecionar todos os usuários para a página de manutenção
          </p>
        </div>
        {settings.is_active && (
          <Badge variant="destructive" className="animate-pulse">
            <AlertTriangle className="w-3 h-3 mr-1" />
            MODO MANUTENÇÃO ATIVO
          </Badge>
        )}
      </div>

      {/* Main Toggle Card */}
      <Card className={`p-6 ${settings.is_active ? 'bg-destructive/10 border-destructive/30' : 'bg-card'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              settings.is_active ? 'bg-destructive/20' : 'bg-primary/20'
            }`}>
              <Globe className={`w-6 h-6 ${settings.is_active ? 'text-destructive' : 'text-primary'}`} />
            </div>
            <div>
              <p className="font-medium text-lg text-foreground">
                {settings.is_active ? 'Plataforma em Manutenção' : 'Plataforma Online'}
              </p>
              <p className="text-sm text-muted-foreground">
                {settings.is_active 
                  ? 'Todos os usuários estão sendo redirecionados para /maintenance'
                  : 'Usuários podem acessar normalmente'}
              </p>
            </div>
          </div>
          <Switch
            checked={settings.is_active}
            onCheckedChange={toggleMaintenance}
            disabled={isSaving}
            className="scale-125"
          />
        </div>
      </Card>

      {/* Settings */}
      <Card className="p-6 space-y-6">
        <h3 className="font-medium text-foreground flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Configurações da Página
        </h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem para Usuários</Label>
            <Textarea
              id="message"
              value={settings.message}
              onChange={(e) => setSettings({ ...settings, message: e.target.value })}
              placeholder="Descreva o motivo da manutenção..."
              className="min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="endTime">Previsão de Retorno</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={settings.estimated_end_time || ''}
                onChange={(e) => setSettings({ ...settings, estimated_end_time: e.target.value || null })}
              />
            </div>

            <div className="space-y-2">
              <Label>Mostrar Contador</Label>
              <div className="flex items-center gap-2 h-10">
                <Switch
                  checked={settings.show_countdown}
                  onCheckedChange={(checked) => setSettings({ ...settings, show_countdown: checked })}
                />
                <span className="text-sm text-muted-foreground">
                  {settings.show_countdown ? 'Sim, exibir contador regressivo' : 'Não, apenas mostrar data'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => window.open('/maintenance', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Visualizar Página
            </Button>
            
            <Button
              variant="secondary"
              onClick={sendMaintenanceEndNotification}
              disabled={isSendingNotification}
            >
              {isSendingNotification ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <BellRing className="w-4 h-4 mr-2" />
              )}
              Testar Notificação
            </Button>
          </div>

          <Button onClick={saveSettings} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Salvar Configurações
          </Button>
        </div>
      </Card>

      {/* Live Preview */}
      <Card className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <Monitor className="w-4 h-4" />
            Preview ao Vivo
          </h3>
          <Badge variant="outline" className="text-xs">
            Atualiza em tempo real
          </Badge>
        </div>

        {/* Preview Container */}
        <div className="border border-border rounded-xl overflow-hidden bg-background">
          <MaintenancePreview settings={settings} />
        </div>
      </Card>

      {/* Info */}
      <Card className="p-4 bg-secondary/30 border-dashed">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-primary" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-foreground mb-1">Quando usar?</p>
            <ul className="text-muted-foreground space-y-1 text-xs">
              <li>• Durante deploys ou atualizações críticas</li>
              <li>• Manutenção de banco de dados</li>
              <li>• Migrações que podem causar instabilidade</li>
              <li>• Administradores ainda podem navegar normalmente</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Live Preview Component
const MaintenancePreview = ({ settings }: { settings: GlobalMaintenanceSettings }) => {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    if (!settings.estimated_end_time || !settings.show_countdown) return;

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
  }, [settings.estimated_end_time, settings.show_countdown]);

  const formattedTime = settings.estimated_end_time
    ? format(new Date(settings.estimated_end_time), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })
    : null;

  return (
    <div className="relative bg-background p-6 min-h-[400px] flex flex-col items-center justify-center overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
      <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      
      {/* Content */}
      <div className="relative z-10 max-w-md w-full text-center space-y-5">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-card/80 backdrop-blur-sm border border-primary/30 flex items-center justify-center overflow-hidden shadow-xl shadow-primary/20">
            <img 
              src={logo} 
              alt="Logo" 
              className="w-14 h-14 object-cover scale-110 rounded-full"
            />
          </div>
        </div>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-14 h-14 bg-primary/20 rounded-full flex items-center justify-center animate-pulse">
            <Wrench className="w-7 h-7 text-primary" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-xl md:text-2xl font-bold text-foreground">
            Estamos em Manutenção
          </h1>
          <p className="text-muted-foreground text-sm">
            {settings.message || "Estamos trabalhando para melhorar sua experiência. Voltamos em breve!"}
          </p>
        </div>

        {/* Countdown */}
        {settings.show_countdown && timeLeft && (
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4 space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">
              Tempo estimado de retorno
            </p>
            <div className="text-3xl font-mono font-bold text-primary tracking-widest">
              {timeLeft}
            </div>
          </div>
        )}

        {/* Estimated time */}
        {formattedTime && !settings.show_countdown && (
          <div className="flex items-center justify-center gap-2 text-muted-foreground bg-secondary/30 py-2 px-4 rounded-lg border border-border text-sm">
            <Clock className="w-4 h-4" />
            <span>Previsão: <strong className="text-foreground">{formattedTime}</strong></span>
          </div>
        )}

        {/* Info card */}
        <div className="bg-card/30 backdrop-blur-sm border border-border rounded-lg p-4 text-left">
          <div className="flex items-start gap-2">
            <Rocket className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-foreground text-sm">Estamos atualizando!</p>
              <p className="text-xs text-muted-foreground">
                Novas funcionalidades e melhorias estão sendo implementadas.
              </p>
            </div>
          </div>
        </div>

        {/* Refresh button (visual only) */}
        <Button 
          variant="outline"
          size="sm"
          className="gap-2 pointer-events-none opacity-70"
        >
          <RefreshCw className="w-3 h-3" />
          Verificar Novamente
        </Button>

        {/* Footer */}
        <p className="text-[10px] text-muted-foreground/60">
          La Casa Dark CORE © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
};
