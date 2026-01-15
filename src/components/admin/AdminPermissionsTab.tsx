import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Plus, Trash2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface PlanPermission {
  id: string;
  plan_name: string;
  monthly_credits: number;
  permissions: Record<string, boolean>;
  stripe_price_id: string | null;
  price_amount: number;
  is_annual: boolean;
  storage_limit_gb: number;
}

// Ferramentas reais da plataforma baseadas nas rotas
const FEATURES = [
  { key: "analisador_videos", label: "Analisador de Vídeos", route: "/analyzer", description: "Análise de vídeos virais" },
  { key: "gerador_cenas", label: "Gerador de Cenas", route: "/scenes", description: "Criação de prompts para cenas" },
  { key: "gerador_roteiro_viral", label: "Gerador de Roteiro Viral", route: "/viral-script", description: "Criação de roteiros virais com IA" },
  { key: "agentes_virais", label: "Agentes Virais", route: "/agents", description: "Agentes de roteiro com IA" },
  { key: "gerador_voz", label: "Gerador de Voz", route: "/voice", description: "TTS com ElevenLabs" },
  { key: "prompts_imagens", label: "Prompts e Imagens", route: "/prompts", description: "Geração de imagens com IA" },
  { key: "biblioteca_viral", label: "Biblioteca Viral", route: "/library", description: "Salvamento de vídeos virais" },
  { key: "explorar_nicho", label: "Explorar Nicho", route: "/explore", description: "Descoberta de nichos" },
  { key: "canais_monitorados", label: "Canais Monitorados", route: "/channels", description: "Monitoramento de canais" },
  { key: "analytics_youtube", label: "Analytics YouTube", route: "/youtube", description: "Estatísticas do YouTube" },
  { key: "buscar_canais", label: "Buscar Canais", route: "/search-channels", description: "Pesquisa de canais" },
  { key: "analisador_canal", label: "Analisador de Canal", route: "/channel-analyzer", description: "Análise completa de canal" },
  { key: "conversor_srt", label: "Conversor SRT", route: "/srt", description: "Conversão de legendas" },
  { key: "analytics", label: "Analytics da Plataforma", route: "/analytics", description: "Métricas e gráficos" },
  { key: "pastas", label: "Pastas", route: "/folders", description: "Organização de conteúdo" },
  { key: "usar_api_propria", label: "Usar API Própria", route: "/settings", description: "Configurar chaves OpenAI/Gemini" },
  { key: "baixar_xml", label: "Baixar XML", route: "/scenes", description: "Exportar XML para DaVinci" },
  { key: "imagefx_cookies", label: "ImageFX Cookies", route: "/scenes", description: "Geração de imagens via ImageFX" },
];

export const AdminPermissionsTab = () => {
  const [plans, setPlans] = useState<PlanPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [addPlanOpen, setAddPlanOpen] = useState(false);
  const [newPlanName, setNewPlanName] = useState("");
  const [newPlanCredits, setNewPlanCredits] = useState("100");
  const [newPlanPrice, setNewPlanPrice] = useState("0");
  const [newPlanStorage, setNewPlanStorage] = useState("1");
  const [newPlanIsAnnual, setNewPlanIsAnnual] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("plan_permissions")
      .select("*")
      .order("is_annual", { ascending: true })
      .order("price_amount", { ascending: true });

    if (error) {
      toast.error("Erro ao carregar planos");
    } else {
      setPlans(
        data?.map((p) => ({
          ...p,
          permissions: (p.permissions as Record<string, boolean>) || {},
          storage_limit_gb: p.storage_limit_gb || 1,
        })) || []
      );
    }
    setLoading(false);
  };

  const updatePlanField = (planId: string, field: keyof PlanPermission, value: number | string) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === planId ? { ...p, [field]: value } : p))
    );
  };

  const togglePermission = (planId: string, feature: string) => {
    setPlans((prev) =>
      prev.map((p) =>
        p.id === planId
          ? {
              ...p,
              permissions: {
                ...p.permissions,
                [feature]: !p.permissions[feature],
              },
            }
          : p
      )
    );
  };

  const toggleAllPermissions = (planId: string, enabled: boolean) => {
    const allPermissions: Record<string, boolean> = {};
    FEATURES.forEach((f) => {
      allPermissions[f.key] = enabled;
    });
    
    setPlans((prev) =>
      prev.map((p) =>
        p.id === planId ? { ...p, permissions: allPermissions } : p
      )
    );
  };

  const saveAllPlans = async () => {
    setSaving(true);
    try {
      for (const plan of plans) {
        const { error } = await supabase
          .from("plan_permissions")
          .update({
            monthly_credits: plan.monthly_credits,
            permissions: plan.permissions,
            storage_limit_gb: plan.storage_limit_gb,
            updated_at: new Date().toISOString(),
          })
          .eq("id", plan.id);

        if (error) throw error;
      }
      toast.success("Todas as configurações foram salvas!");
    } catch (error) {
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const handleAddPlan = async () => {
    if (!newPlanName.trim()) {
      toast.error("Nome do plano é obrigatório");
      return;
    }

    // Initialize with all permissions disabled
    const initialPermissions: Record<string, boolean> = {};
    FEATURES.forEach((f) => {
      initialPermissions[f.key] = false;
    });

    const { error } = await supabase.from("plan_permissions").insert({
      plan_name: newPlanName,
      monthly_credits: Number(newPlanCredits),
      price_amount: Number(newPlanPrice),
      storage_limit_gb: Number(newPlanStorage),
      is_annual: newPlanIsAnnual,
      permissions: initialPermissions,
    });

    if (error) {
      toast.error("Erro ao criar plano");
    } else {
      toast.success("Plano criado!");
      setNewPlanName("");
      setNewPlanCredits("100");
      setNewPlanPrice("0");
      setNewPlanStorage("1");
      setNewPlanIsAnnual(false);
      setAddPlanOpen(false);
      fetchPlans();
    }
  };

  const openDeleteDialog = (planId: string, planName: string) => {
    setPlanToDelete({ id: planId, name: planName });
    setDeleteDialogOpen(true);
  };

  const confirmDeletePlan = async () => {
    if (!planToDelete) return;

    const { error } = await supabase.from("plan_permissions").delete().eq("id", planToDelete.id);

    if (error) {
      toast.error("Erro ao excluir plano");
    } else {
      toast.success("Plano excluído!");
      fetchPlans();
    }
    
    setDeleteDialogOpen(false);
    setPlanToDelete(null);
  };

  const monthlyPlans = plans.filter((p) => !p.is_annual);
  const annualPlans = plans.filter((p) => p.is_annual);

  const countEnabledFeatures = (permissions: Record<string, boolean>) => {
    return Object.values(permissions).filter(Boolean).length;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const renderPlanCard = (plan: PlanPermission) => (
    <Card key={plan.id} className="p-6 border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h4 className="text-lg font-semibold text-foreground">{plan.plan_name}</h4>
          {plan.is_annual && (
            <Badge variant="outline" className="text-primary border-primary">Anual</Badge>
          )}
          <Badge variant="secondary" className="text-muted-foreground">
            {countEnabledFeatures(plan.permissions)}/{FEATURES.length} recursos
          </Badge>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="text-destructive hover:bg-destructive/10"
          onClick={() => openDeleteDialog(plan.id, plan.plan_name)}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Plan Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-secondary/50 p-3 rounded-lg">
          <label className="text-xs text-muted-foreground block mb-1">Créditos Mensais</label>
          <Input
            type="number"
            value={plan.monthly_credits}
            onChange={(e) => updatePlanField(plan.id, "monthly_credits", Number(e.target.value))}
            className="bg-secondary border-border h-8"
          />
        </div>
        <div className="bg-secondary/50 p-3 rounded-lg">
          <label className="text-xs text-muted-foreground block mb-1">Preço (R$)</label>
          <Input
            type="number"
            value={plan.price_amount}
            onChange={(e) => updatePlanField(plan.id, "price_amount", Number(e.target.value))}
            className="bg-secondary border-border h-8"
            step="0.01"
            disabled
          />
        </div>
        <div className="bg-secondary/50 p-3 rounded-lg">
          <label className="text-xs text-muted-foreground block mb-1">Storage (GB)</label>
          <Input
            type="number"
            value={plan.storage_limit_gb}
            onChange={(e) => updatePlanField(plan.id, "storage_limit_gb", Number(e.target.value))}
            className="bg-secondary border-border h-8"
            step="0.5"
          />
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 mb-4">
        <Button
          size="sm"
          variant="outline"
          onClick={() => toggleAllPermissions(plan.id, true)}
          className="text-success border-success/50 hover:bg-success/10"
        >
          Ativar Todos
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => toggleAllPermissions(plan.id, false)}
          className="text-destructive border-destructive/50 hover:bg-destructive/10"
        >
          Desativar Todos
        </Button>
      </div>

      {/* Feature Permissions */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {FEATURES.map((feature) => (
          <div
            key={feature.key}
            className={`flex items-start gap-2 p-2 rounded-lg transition-colors cursor-pointer ${
              plan.permissions[feature.key]
                ? "bg-success/10 border border-success/30"
                : "bg-secondary/30 border border-transparent"
            }`}
            onClick={() => togglePermission(plan.id, feature.key)}
          >
            <Checkbox
              checked={plan.permissions[feature.key] || false}
              onCheckedChange={() => togglePermission(plan.id, feature.key)}
              className="mt-0.5 border-primary data-[state=checked]:bg-primary"
            />
            <div className="flex-1 min-w-0">
              <span className="text-sm font-medium text-foreground block truncate">
                {feature.label}
              </span>
              <span className="text-xs text-muted-foreground block truncate">
                {feature.route}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Gerenciar Permissões de Planos</h2>
          <p className="text-sm text-muted-foreground">Configure quais recursos cada plano pode acessar</p>
        </div>
        <Button onClick={() => setAddPlanOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Plano
        </Button>
      </div>

      {/* Monthly Plans */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
          Planos Mensais ({monthlyPlans.length})
        </h3>
        {monthlyPlans.map(renderPlanCard)}
      </div>

      {/* Annual Plans */}
      {annualPlans.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
            Planos Anuais ({annualPlans.length})
          </h3>
          {annualPlans.map(renderPlanCard)}
        </div>
      )}

      {/* Save All Button */}
      <Button onClick={saveAllPlans} disabled={saving} className="w-full bg-primary" size="lg">
        {saving ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        Salvar Todas as Configurações
      </Button>

      {/* Add Plan Dialog */}
      <Dialog open={addPlanOpen} onOpenChange={setAddPlanOpen}>
        <DialogContent className="bg-card border-primary/50 rounded-xl">
          <DialogHeader>
            <DialogTitle>Adicionar Novo Plano</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Nome do Plano</label>
              <Input
                value={newPlanName}
                onChange={(e) => setNewPlanName(e.target.value)}
                className="bg-secondary border-border"
                placeholder="Ex: STARTER"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Créditos Mensais</label>
                <Input
                  type="number"
                  value={newPlanCredits}
                  onChange={(e) => setNewPlanCredits(e.target.value)}
                  className="bg-secondary border-border"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Preço (R$)</label>
                <Input
                  type="number"
                  value={newPlanPrice}
                  onChange={(e) => setNewPlanPrice(e.target.value)}
                  className="bg-secondary border-border"
                  step="0.01"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Storage (GB)</label>
              <Input
                type="number"
                value={newPlanStorage}
                onChange={(e) => setNewPlanStorage(e.target.value)}
                className="bg-secondary border-border"
                step="0.5"
              />
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={newPlanIsAnnual}
                onCheckedChange={(v) => setNewPlanIsAnnual(!!v)}
              />
              <span className="text-sm text-muted-foreground">Plano Anual</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddPlanOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddPlan}>Criar Plano</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Plan Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-primary/50 rounded-xl shadow-xl">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-destructive/20">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <AlertDialogTitle className="text-xl text-foreground">
                Excluir Plano
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-muted-foreground">
              Tem certeza que deseja excluir o plano{" "}
              <span className="text-primary font-semibold">{planToDelete?.name}</span>?
              <br /><br />
              Esta ação não pode ser desfeita. Usuários com este plano podem perder acesso a recursos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="bg-secondary border-border text-foreground hover:bg-secondary/80">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeletePlan}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
