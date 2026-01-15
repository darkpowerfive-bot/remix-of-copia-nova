import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Wrench, Save, Loader2, Edit2, CheckCircle, AlertTriangle, RefreshCw, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TOOL_REGISTRY, ToolMaintenanceData, ToolMaintenanceStatus } from "@/hooks/useToolMaintenance";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// Key for localStorage to persist simulation mode
const SIMULATE_USER_KEY = 'admin_simulate_user_maintenance';

export const AdminMaintenanceTab = () => {
  const [maintenanceData, setMaintenanceData] = useState<ToolMaintenanceData>({ tools: {} });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [simulateUserView, setSimulateUserView] = useState(() => {
    return localStorage.getItem(SIMULATE_USER_KEY) === 'true';
  });
  
  // Edit modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTool, setEditingTool] = useState<{ path: string; name: string } | null>(null);
  const [editMessage, setEditMessage] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

  const handleSimulateToggle = (enabled: boolean) => {
    setSimulateUserView(enabled);
    localStorage.setItem(SIMULATE_USER_KEY, enabled.toString());
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event('simulateUserModeChanged'));
    if (enabled) {
      toast.info('Modo simulação ativado! Você verá os modais de manutenção como usuário normal.');
    } else {
      toast.success('Modo simulação desativado.');
    }
  };

  const fetchMaintenanceData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('value')
        .eq('key', 'tool_maintenance')
        .maybeSingle();

      if (error) throw error;

      if (data?.value) {
        setMaintenanceData(data.value as unknown as ToolMaintenanceData);
      }
    } catch (error) {
      console.error('Error fetching maintenance data:', error);
      toast.error('Erro ao carregar dados de manutenção');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaintenanceData();
  }, []);

  const saveMaintenanceData = async (newData: ToolMaintenanceData) => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('admin_settings')
        .update({ 
          value: JSON.parse(JSON.stringify(newData)),
          updated_at: new Date().toISOString()
        })
        .eq('key', 'tool_maintenance');

      if (error) throw error;

      setMaintenanceData(newData);
      toast.success('Configurações de manutenção salvas!');
    } catch (error) {
      console.error('Error saving maintenance data:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleMaintenance = async (toolPath: string, enabled: boolean) => {
    const newData = { ...maintenanceData };
    if (!newData.tools) newData.tools = {};
    
    const toolName = TOOL_REGISTRY.find(t => t.path === toolPath)?.name || toolPath;
    
    if (enabled) {
      newData.tools[toolPath] = {
        enabled: true,
        message: "Estamos trabalhando para melhorar esta ferramenta.",
        updatedAt: new Date().toISOString()
      };
    } else {
      if (newData.tools[toolPath]) {
        newData.tools[toolPath] = {
          ...newData.tools[toolPath],
          enabled: false,
          updatedAt: new Date().toISOString(),
          // Mark when maintenance ended for notification purposes
          endedAt: new Date().toISOString()
        };
      }
      // Show success message that maintenance ended
      toast.success(`✅ ${toolName} está online novamente!`, {
        description: 'Usuários serão notificados automaticamente.'
      });
    }

    await saveMaintenanceData(newData);
  };

  const openEditModal = (tool: { path: string; name: string }) => {
    const currentStatus = maintenanceData.tools?.[tool.path];
    setEditingTool(tool);
    setEditMessage(currentStatus?.message || "Estamos trabalhando para melhorar esta ferramenta.");
    setEditEndTime(currentStatus?.estimatedEndTime || "");
    setEditModalOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingTool) return;

    const newData = { ...maintenanceData };
    if (!newData.tools) newData.tools = {};

    newData.tools[editingTool.path] = {
      ...newData.tools[editingTool.path],
      enabled: newData.tools[editingTool.path]?.enabled ?? false,
      message: editMessage,
      estimatedEndTime: editEndTime || undefined,
      updatedAt: new Date().toISOString()
    };

    await saveMaintenanceData(newData);
    setEditModalOpen(false);
    setEditingTool(null);
  };

  const getToolStatus = (toolPath: string): ToolMaintenanceStatus | undefined => {
    return maintenanceData.tools?.[toolPath];
  };

  const activeMaintenanceCount = Object.values(maintenanceData.tools || {}).filter(t => t.enabled === true).length;

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
            <Wrench className="w-5 h-5 text-primary" />
            Modo Manutenção
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Coloque ferramentas individuais em manutenção sem parar a plataforma
          </p>
        </div>
        <div className="flex items-center gap-3">
          {activeMaintenanceCount > 0 && (
            <Badge variant="destructive" className="animate-pulse">
              {activeMaintenanceCount} em manutenção
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={fetchMaintenanceData}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Simulate User View Toggle */}
      <Card className={`p-4 ${simulateUserView ? 'bg-purple-500/10 border-purple-500/30' : 'bg-card'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {simulateUserView ? (
              <Eye className="w-5 h-5 text-purple-500" />
            ) : (
              <EyeOff className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-medium text-foreground">Simular Visualização de Usuário</p>
              <p className="text-xs text-muted-foreground">
                {simulateUserView 
                  ? 'Ativo: Você verá os modais de manutenção como um usuário normal' 
                  : 'Desativado: Você tem acesso de admin às ferramentas em manutenção'}
              </p>
            </div>
          </div>
          <Switch
            checked={simulateUserView}
            onCheckedChange={handleSimulateToggle}
          />
        </div>
      </Card>

      {/* Tools List */}
      <Card className="p-4">
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-2">
            {TOOL_REGISTRY.map((tool) => {
              const status = getToolStatus(tool.path);
              const isEnabled = status?.enabled === true;

              return (
                <div
                  key={tool.path}
                  className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                    isEnabled 
                      ? 'bg-amber-500/10 border-amber-500/30' 
                      : 'bg-card border-border hover:border-primary/30'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{tool.icon}</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{tool.name}</span>
                        {isEnabled ? (
                          <Badge variant="outline" className="bg-amber-500/20 text-amber-500 border-amber-500/30 text-xs">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Em Manutenção
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-emerald-500/20 text-emerald-500 border-emerald-500/30 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Online
                          </Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">{tool.path}</span>
                      {isEnabled && status?.message && (
                        <p className="text-xs text-muted-foreground mt-1 max-w-md truncate">
                          {status.message}
                        </p>
                      )}
                      {isEnabled && status?.estimatedEndTime && (
                        <p className="text-xs text-amber-500 mt-0.5">
                          Previsão: {format(new Date(status.estimatedEndTime), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(tool)}
                      disabled={isSaving}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Switch
                      checked={isEnabled}
                      onCheckedChange={(checked) => toggleMaintenance(tool.path, checked)}
                      disabled={isSaving}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </Card>

      {/* Info Card */}
      <Card className="p-4 bg-secondary/30 border-dashed">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Wrench className="w-4 h-4 text-primary" />
          </div>
          <div className="text-sm">
            <p className="font-medium text-foreground mb-1">Como funciona?</p>
            <ul className="text-muted-foreground space-y-1 text-xs">
              <li>• Ative o modo manutenção para qualquer ferramenta</li>
              <li>• Usuários verão um modal amigável ao tentar acessar</li>
              <li>• Administradores ainda podem acessar normalmente</li>
              <li>• Configure mensagens personalizadas e previsão de retorno</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="sm:max-w-md border-primary/50 bg-card rounded-xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-primary" />
              Configurar Manutenção
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {editingTool && (
              <div className="flex items-center gap-2 p-3 bg-secondary/30 rounded-lg">
                <span className="text-xl">{TOOL_REGISTRY.find(t => t.path === editingTool.path)?.icon}</span>
                <span className="font-medium">{editingTool.name}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="message">Mensagem de Manutenção</Label>
              <Textarea
                id="message"
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                placeholder="Descreva o motivo da manutenção..."
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime">Previsão de Retorno (opcional)</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={editEndTime}
                onChange={(e) => setEditEndTime(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Deixe em branco se não souber a previsão
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
