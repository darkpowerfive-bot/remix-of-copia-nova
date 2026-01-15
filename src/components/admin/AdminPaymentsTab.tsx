import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CreditCard, 
  Info, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Save,
  ExternalLink,
  Settings2,
  Plus,
  Trash2,
  Pencil
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface PlanConfig {
  id: string;
  plan_name: string;
  price_amount: number;
  stripe_price_id: string | null;
  is_annual: boolean;
}

interface CreditPackage {
  id: string;
  credits: number;
  price: number;
  stripe_price_id: string | null;
  label: string | null;
  is_active: boolean;
  display_order: number;
}

export function AdminPaymentsTab() {
  const { session } = useAuth();
  const [publicKey, setPublicKey] = useState("");
  const [secretKey, setSecretKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [webhookEmail, setWebhookEmail] = useState("");
  const [plans, setPlans] = useState<PlanConfig[]>([]);
  const [creditPackages, setCreditPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openingPortal, setOpeningPortal] = useState(false);
  const [editingPackage, setEditingPackage] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
    fetchPlans();
    fetchCreditPackages();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "stripe")
      .single();

    if (data?.value) {
      const s = data.value as Record<string, string>;
      setPublicKey(s.public_key || "");
      setSecretKey(s.secret_key || "");
      setWebhookSecret(s.webhook_secret || "");
      setWebhookEmail(s.webhook_email || "");
    }
    setLoading(false);
  };

  const fetchPlans = async () => {
    const { data } = await supabase
      .from("plan_permissions")
      .select("id, plan_name, price_amount, stripe_price_id, is_annual")
      .order("is_annual")
      .order("price_amount");
    if (data) setPlans(data);
  };

  const fetchCreditPackages = async () => {
    const { data } = await supabase
      .from("credit_packages")
      .select("*")
      .order("display_order");
    if (data) setCreditPackages(data as CreditPackage[]);
  };

  const saveStripeSettings = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("admin_settings")
      .upsert({
        key: "stripe",
        value: {
          public_key: publicKey,
          secret_key: secretKey,
          webhook_secret: webhookSecret,
          webhook_email: webhookEmail,
        },
        updated_at: new Date().toISOString(),
      }, { onConflict: "key" });

    if (error) {
      console.error("Erro ao salvar Stripe:", error);
      toast.error("Erro ao salvar configurações");
    } else {
      toast.success("Configurações do Stripe salvas!");
    }
    setSaving(false);
  };

  const updatePlanPriceId = async (planId: string, priceId: string) => {
    const { error } = await supabase
      .from("plan_permissions")
      .update({ stripe_price_id: priceId, updated_at: new Date().toISOString() })
      .eq("id", planId);

    if (error) {
      toast.error("Erro ao salvar Price ID");
    } else {
      toast.success("Price ID atualizado!");
      fetchPlans();
    }
  };

  const updateCreditPackage = async (pkg: CreditPackage) => {
    const { error } = await supabase
      .from("credit_packages")
      .update({
        credits: pkg.credits,
        price: pkg.price,
        stripe_price_id: pkg.stripe_price_id,
        label: pkg.label,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pkg.id);

    if (error) {
      toast.error("Erro ao atualizar pacote");
    } else {
      toast.success("Pacote atualizado!");
      setEditingPackage(null);
      fetchCreditPackages();
    }
  };

  const deleteCreditPackage = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este pacote?")) return;
    
    const { error } = await supabase
      .from("credit_packages")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Erro ao excluir pacote");
    } else {
      toast.success("Pacote excluído!");
      fetchCreditPackages();
    }
  };

  const addNewCreditPackage = async () => {
    const maxOrder = Math.max(...creditPackages.map(p => p.display_order), 0);
    const { error } = await supabase
      .from("credit_packages")
      .insert({
        credits: 1000,
        price: 49.90,
        label: "Novo pacote",
        display_order: maxOrder + 1,
      });

    if (error) {
      toast.error("Erro ao criar pacote");
    } else {
      toast.success("Pacote criado!");
      fetchCreditPackages();
    }
  };

  const handlePackageChange = (id: string, field: keyof CreditPackage, value: any) => {
    setCreditPackages(prev => prev.map(pkg => 
      pkg.id === id ? { ...pkg, [field]: value } : pkg
    ));
  };

  const openCustomerPortal = async () => {
    if (!session?.access_token) {
      toast.error("Você precisa estar logado");
      return;
    }

    setOpeningPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
        toast.success("Portal do Stripe aberto!");
      } else {
        throw new Error("URL do portal não retornada");
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      toast.error(error instanceof Error ? error.message : "Erro ao abrir portal");
    } finally {
      setOpeningPortal(false);
    }
  };

  const monthlyPlans = plans.filter((p) => !p.is_annual);
  const annualPlans = plans.filter((p) => p.is_annual);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stripe Customer Portal */}
      <Card className="p-6 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Settings2 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Portal de Gerenciamento Stripe</h3>
              <p className="text-sm text-muted-foreground">
                Gerencie assinaturas, altere planos, cancele ou atualize métodos de pagamento
              </p>
            </div>
          </div>
          <Button 
            onClick={openCustomerPortal} 
            disabled={openingPortal}
            className="gap-2"
          >
            {openingPortal ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ExternalLink className="w-4 h-4" />
            )}
            Abrir Portal Stripe
          </Button>
        </div>
        <Alert className="mt-4 border-amber-500/30 bg-amber-500/10">
          <Info className="w-4 h-4 text-amber-500" />
          <AlertDescription className="text-amber-200">
            O portal permite que você (admin) gerencie sua própria assinatura. Para gerenciar assinaturas de outros usuários, acesse o Dashboard do Stripe diretamente.
          </AlertDescription>
        </Alert>
      </Card>

      {/* Stripe Configuration */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Configuração do Stripe</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Chave Pública (Publishable Key)
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="pk_live_..."
                value={publicKey}
                onChange={(e) => setPublicKey(e.target.value)}
                className="bg-secondary border-border flex-1 font-mono text-sm"
              />
              <Button onClick={saveStripeSettings} disabled={saving}>
                Salvar
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Chave Secreta (Secret Key)
            </label>
            <Input
              placeholder="sk_live_..."
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              className="bg-secondary border-border font-mono text-sm"
              type="password"
            />
            <p className="text-xs text-muted-foreground mt-1">
              A chave secreta é necessária para processar pagamentos e ver assinaturas.
            </p>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Webhook Secret (opcional)
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="whsec_..."
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                className="bg-secondary border-border flex-1 font-mono text-sm"
                type="password"
              />
              <Button onClick={saveStripeSettings} disabled={saving}>
                Salvar
              </Button>
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Webhook Email
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Ex: admin@..."
                value={webhookEmail}
                onChange={(e) => setWebhookEmail(e.target.value)}
                className="bg-secondary border-border flex-1"
              />
              <Button onClick={saveStripeSettings} disabled={saving}>
                Salvar
              </Button>
            </div>
          </div>
        </div>

        <Alert className="mt-4 border-primary/50 bg-primary/10">
          <Info className="w-4 h-4 text-primary" />
          <AlertDescription className="text-primary">
            Configure os preços nas tabelas abaixo com IDs retornados pelo API do Stripe.
          </AlertDescription>
        </Alert>
      </Card>

      {/* Configuration Status */}
      <Card className="p-6">
        <h3 className="font-semibold text-foreground mb-4">Status de Configuração</h3>
        <div className="flex gap-4 flex-wrap">
          <Badge className={publicKey ? "bg-success/20 text-success" : "bg-secondary"}>
            <span className="mr-2">Chave Pública</span>
            {publicKey ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          </Badge>
          <Badge className={secretKey ? "bg-success/20 text-success" : "bg-secondary"}>
            <span className="mr-2">Chave Secreta</span>
            {secretKey ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          </Badge>
          <Badge className={webhookSecret ? "bg-success/20 text-success" : "bg-secondary"}>
            <span className="mr-2">Webhook</span>
            {webhookSecret ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
          </Badge>
        </div>
      </Card>

      {/* Plans Configuration */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="font-semibold text-foreground">Configuração de Planos</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Configure os Price IDs do Stripe para cada plano.
        </p>

        {/* Monthly Plans */}
        <h4 className="text-sm font-semibold text-foreground mb-3">Planos Mensais</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {monthlyPlans.map((plan) => (
            <div
              key={plan.id}
              className={`p-4 rounded-lg border ${
                plan.plan_name === "TURBO MAKER"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-secondary/30"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground">{plan.plan_name}</span>
                {plan.plan_name === "TURBO MAKER" && (
                  <Badge className="bg-primary text-primary-foreground">MAIS POPULAR</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                R$ {plan.price_amount?.toFixed(2) || "0.00"} / mês
              </p>
              <label className="text-xs text-muted-foreground mb-1 block">Price ID do Stripe</label>
              <div className="flex gap-2">
                <Input
                  placeholder="price_..."
                  defaultValue={plan.stripe_price_id || ""}
                  className="bg-secondary border-border text-xs font-mono"
                  onBlur={(e) => {
                    if (e.target.value !== plan.stripe_price_id) {
                      updatePlanPriceId(plan.id, e.target.value);
                    }
                  }}
                />
                <Badge variant={plan.stripe_price_id ? "default" : "secondary"}>
                  {plan.stripe_price_id ? "Ativo" : "Pendente"}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Annual Plans */}
        {annualPlans.length > 0 && (
          <>
            <h4 className="text-sm font-semibold text-foreground mb-3">Planos Anuais</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {annualPlans.map((plan) => (
                <div
                  key={plan.id}
                  className={`p-4 rounded-lg border ${
                    plan.plan_name.includes("TURBO")
                      ? "border-primary bg-primary/5"
                      : "border-border bg-secondary/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">{plan.plan_name}</span>
                    {plan.plan_name.includes("TURBO") && (
                      <Badge className="bg-primary text-primary-foreground">MAIS POPULAR</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    R$ {plan.price_amount?.toFixed(2) || "0.00"} / ano
                  </p>
                  <label className="text-xs text-muted-foreground mb-1 block">Price ID do Stripe</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="price_..."
                      defaultValue={plan.stripe_price_id || ""}
                      className="bg-secondary border-border text-xs font-mono"
                      onBlur={(e) => {
                        if (e.target.value !== plan.stripe_price_id) {
                          updatePlanPriceId(plan.id, e.target.value);
                        }
                      }}
                    />
                    <Badge variant={plan.stripe_price_id ? "default" : "secondary"}>
                      {plan.stripe_price_id ? "Ativo" : "Pendente"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Credit Packages */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Pacotes de Créditos</h3>
          <Button onClick={addNewCreditPackage} size="sm" className="gap-2">
            <Plus className="w-4 h-4" />
            Adicionar Pacote
          </Button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Gerencie os pacotes de créditos disponíveis para compra.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {creditPackages.map((pkg) => (
            <div 
              key={pkg.id} 
              className={`p-4 rounded-lg border transition-all ${
                editingPackage === pkg.id 
                  ? "border-primary bg-primary/5" 
                  : "border-border bg-secondary/30"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  {editingPackage === pkg.id ? (
                    <Input
                      value={pkg.label || ""}
                      onChange={(e) => handlePackageChange(pkg.id, "label", e.target.value)}
                      className="h-7 text-sm w-32"
                      placeholder="Rótulo"
                    />
                  ) : (
                    <span className="text-xs text-muted-foreground">{pkg.label}</span>
                  )}
                </div>
                <div className="flex gap-1">
                  {editingPackage === pkg.id ? (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => updateCreditPackage(pkg)}
                      className="h-7 w-7 p-0"
                    >
                      <Save className="w-3.5 h-3.5 text-success" />
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setEditingPackage(pkg.id)}
                      className="h-7 w-7 p-0"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => deleteCreditPackage(pkg.id)}
                    className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground w-16">Créditos:</label>
                  {editingPackage === pkg.id ? (
                    <Input
                      type="number"
                      value={pkg.credits}
                      onChange={(e) => handlePackageChange(pkg.id, "credits", parseInt(e.target.value) || 0)}
                      className="h-7 text-sm flex-1"
                    />
                  ) : (
                    <span className="font-semibold text-foreground">{pkg.credits.toLocaleString()}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground w-16">Preço:</label>
                  {editingPackage === pkg.id ? (
                    <Input
                      type="number"
                      step="0.01"
                      value={pkg.price}
                      onChange={(e) => handlePackageChange(pkg.id, "price", parseFloat(e.target.value) || 0)}
                      className="h-7 text-sm flex-1"
                    />
                  ) : (
                    <span className="text-foreground">R$ {Number(pkg.price).toFixed(2)}</span>
                  )}
                </div>

                <div className="pt-2 border-t border-border/50">
                  <label className="text-xs text-muted-foreground block mb-1">Price ID Stripe:</label>
                  <Input
                    placeholder="price_..."
                    value={pkg.stripe_price_id || ""}
                    onChange={(e) => handlePackageChange(pkg.id, "stripe_price_id", e.target.value)}
                    onBlur={() => {
                      if (editingPackage !== pkg.id) {
                        updateCreditPackage(pkg);
                      }
                    }}
                    className="bg-secondary border-border text-xs font-mono h-7"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
