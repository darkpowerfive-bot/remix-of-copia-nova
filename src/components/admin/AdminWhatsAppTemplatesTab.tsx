import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, MessageCircle, Eye, RotateCcw, Image as ImageIcon, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

interface WhatsAppTemplates {
  pendingMessage: string;
  approvedMessage: string;
  enabled: boolean;
  logoUrl: string;
  sendLogo: boolean;
}

const DEFAULT_TEMPLATES: WhatsAppTemplates = {
  pendingMessage: `Olá *{{nome}}*! 👋

Ficamos felizes em receber sua solicitação de acesso à plataforma *La Casa Dark Core* — a infraestrutura definitiva para canais dark profissionais.

📋 *INFORMAÇÕES*

👤 *Nome:* {{nome}}
📧 *Email:* {{email}}
📅 *Data:* {{data}}
🔄 *Status:* Aguardando Análise

⏰ *PRÓXIMOS PASSOS*

Nossa equipe está analisando sua solicitação.

⚡ *Prazo estimado:* Até 24 horas úteis

Você receberá uma notificação assim que seu acesso for liberado.

_Fique atento ao seu WhatsApp e email!_

_👑 La Casa Dark Core®_`,

  approvedMessage: `Parabéns *{{nome}}*! 🚀

Seu acesso à plataforma *La Casa Dark Core* foi aprovado com sucesso!

📋 *DETALHES DA SUA CONTA*

👤 *Nome:* {{nome}}
📧 *Email:* {{email}}
💎 *Plano:* {{plano}}
✅ *Status:* ATIVO
📅 *Ativação:* {{data}}

🚀 *COMECE AGORA*

Acesse sua dashboard e explore todas as ferramentas disponíveis:

👉 {{dashboard_link}}

✨ *O QUE VOCÊ PODE FAZER*

🎯 Analisar vídeos virais
🎨 Gerar thumbnails profissionais
📝 Criar roteiros otimizados
🔍 Detectar tendências
📊 Acompanhar métricas

*Bem-vindo à revolução dos canais dark!*
_Não há espaço para amadores._

_👑 La Casa Dark Core®_`,

  enabled: true,
  logoUrl: "https://app.canaisdarks.com.br/images/logo-email.gif",
  sendLogo: true,
};

const AVAILABLE_VARIABLES = [
  { key: "{{nome}}", description: "Nome do usuário" },
  { key: "{{email}}", description: "Email do usuário" },
  { key: "{{plano}}", description: "Nome do plano (FREE, PRO, etc)" },
  { key: "{{dashboard_link}}", description: "Link do dashboard" },
  { key: "{{data}}", description: "Data atual (DD/MM/AAAA)" },
];

export function AdminWhatsAppTemplatesTab() {
  const [templates, setTemplates] = useState<WhatsAppTemplates>(DEFAULT_TEMPLATES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [previewType, setPreviewType] = useState<"pending" | "approved">("pending");

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("admin_settings")
        .select("value")
        .eq("key", "whatsapp_welcome_templates")
        .maybeSingle();

      if (error) throw error;

      if (data?.value && typeof data.value === "object") {
        const val = data.value as Record<string, unknown>;
        setTemplates({
          pendingMessage: (val.pendingMessage as string) ?? DEFAULT_TEMPLATES.pendingMessage,
          approvedMessage: (val.approvedMessage as string) ?? DEFAULT_TEMPLATES.approvedMessage,
          enabled: typeof val.enabled === "boolean" ? val.enabled : DEFAULT_TEMPLATES.enabled,
          logoUrl: (val.logoUrl as string) ?? DEFAULT_TEMPLATES.logoUrl,
          sendLogo: typeof val.sendLogo === "boolean" ? val.sendLogo : DEFAULT_TEMPLATES.sendLogo,
        });
      }
    } catch (error) {
      console.error("Error fetching WhatsApp templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Check if record exists
      const { data: existing } = await supabase
        .from("admin_settings")
        .select("id")
        .eq("key", "whatsapp_welcome_templates")
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from("admin_settings")
          .update({
            value: templates as unknown as Json,
            updated_at: new Date().toISOString(),
          })
          .eq("key", "whatsapp_welcome_templates");
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("admin_settings")
          .insert([{
            key: "whatsapp_welcome_templates",
            value: templates as unknown as Json,
            updated_at: new Date().toISOString(),
          }]);
        if (error) throw error;
      }

      toast.success("Templates salvos com sucesso!");
    } catch (error) {
      console.error("Error saving templates:", error);
      toast.error("Erro ao salvar templates");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = (type: "pending" | "approved") => {
    if (type === "pending") {
      setTemplates((prev) => ({ ...prev, pendingMessage: DEFAULT_TEMPLATES.pendingMessage }));
    } else {
      setTemplates((prev) => ({ ...prev, approvedMessage: DEFAULT_TEMPLATES.approvedMessage }));
    }
    toast.info("Template restaurado para o padrão");
  };

  const getPreviewMessage = () => {
    const template = previewType === "pending" ? templates.pendingMessage : templates.approvedMessage;
    return template
      .replace(/\{\{nome\}\}/g, "João Silva")
      .replace(/\{\{email\}\}/g, "joao@email.com")
      .replace(/\{\{plano\}\}/g, "PRO")
      .replace(/\{\{dashboard_link\}\}/g, "https://app.canaisdarks.com.br/dashboard")
      .replace(/\{\{data\}\}/g, new Date().toLocaleDateString("pt-BR"));
  };

  const handleSendTest = async () => {
    if (!testPhone.trim()) {
      toast.error("Digite um número de WhatsApp para teste");
      return;
    }

    // Format phone number - remove spaces, dashes, parentheses
    let phone = testPhone.replace(/[\s\-\(\)]/g, "");
    
    // Add country code if not present
    if (!phone.startsWith("55") && !phone.startsWith("+55")) {
      phone = "55" + phone;
    }
    phone = phone.replace("+", "");

    setSendingTest(true);
    try {
      const { error } = await supabase.functions.invoke("send-whatsapp-welcome", {
        body: {
          whatsapp: phone,
          fullName: "Teste Admin",
          email: "teste@admin.com",
          messageType: previewType,
          planName: "PRO",
        },
      });

      if (error) throw error;
      toast.success(`Mensagem de teste enviada para ${phone}!`);
    } catch (error) {
      console.error("Error sending test:", error);
      toast.error("Erro ao enviar mensagem de teste");
    } finally {
      setSendingTest(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <MessageCircle className="w-6 h-6 text-green-500" />
          <div>
            <h2 className="text-xl font-semibold">Templates WhatsApp</h2>
            <p className="text-sm text-muted-foreground">
              Personalize as mensagens enviadas via WhatsApp
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              checked={templates.enabled}
              onCheckedChange={(enabled) => setTemplates((prev) => ({ ...prev, enabled }))}
            />
            <Label>WhatsApp ativo</Label>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar Templates
          </Button>
        </div>
      </div>

      {/* Logo Configuration */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center gap-3">
          <ImageIcon className="w-5 h-5 text-primary" />
          <h3 className="font-medium">Logo nas Mensagens</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>URL da Logo</Label>
            <Input
              value={templates.logoUrl}
              onChange={(e) => setTemplates((prev) => ({ ...prev, logoUrl: e.target.value }))}
              placeholder="https://exemplo.com/logo.png"
            />
            <p className="text-xs text-muted-foreground">
              Use uma URL pública acessível (PNG, JPG, GIF ou WEBP)
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Switch
                checked={templates.sendLogo}
                onCheckedChange={(sendLogo) => setTemplates((prev) => ({ ...prev, sendLogo }))}
              />
              <Label>Enviar logo junto com mensagens</Label>
            </div>
            {templates.logoUrl && templates.sendLogo && (
              <div className="p-3 border rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground mb-2">Preview da logo:</p>
                <img 
                  src={templates.logoUrl} 
                  alt="Logo preview" 
                  className="max-h-16 object-contain rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Variables Reference */}
      <Card className="p-4">
        <h3 className="font-medium mb-3">Variáveis disponíveis</h3>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_VARIABLES.map((v) => (
            <Badge key={v.key} variant="secondary" className="cursor-help" title={v.description}>
              {v.key}
            </Badge>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Use *texto* para negrito e _texto_ para itálico no WhatsApp
        </p>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Template */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">
                Cadastro Pendente
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleReset("pending")}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Resetar
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Mensagem de Cadastro Recebido</Label>
            <Textarea
              value={templates.pendingMessage}
              onChange={(e) => setTemplates((prev) => ({ ...prev, pendingMessage: e.target.value }))}
              rows={12}
              className="font-mono text-sm"
              placeholder="Digite a mensagem..."
            />
          </div>
        </Card>

        {/* Approved Template */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/30">
                Acesso Aprovado
              </Badge>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleReset("approved")}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Resetar
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Mensagem de Aprovação</Label>
            <Textarea
              value={templates.approvedMessage}
              onChange={(e) => setTemplates((prev) => ({ ...prev, approvedMessage: e.target.value }))}
              rows={12}
              className="font-mono text-sm"
              placeholder="Digite a mensagem..."
            />
          </div>
        </Card>
      </div>

      {/* Preview & Test */}
      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-medium">Pré-visualização & Teste</h3>
          </div>
          <div className="flex gap-2">
            <Button
              variant={previewType === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setPreviewType("pending")}
            >
              Pendente
            </Button>
            <Button
              variant={previewType === "approved" ? "default" : "outline"}
              size="sm"
              onClick={() => setPreviewType("approved")}
            >
              Aprovado
            </Button>
          </div>
        </div>
        
        <div className="bg-[#0b141a] rounded-xl p-4 max-w-md mx-auto">
          <div className="bg-[#005c4b] rounded-lg p-3 text-white text-sm whitespace-pre-wrap">
            {getPreviewMessage()}
          </div>
          <div className="text-right mt-1">
            <span className="text-xs text-gray-400">
              {new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>

        {/* Test Send Section */}
        <div className="border-t pt-4 mt-4">
          <div className="flex items-center gap-2 mb-3">
            <Send className="w-4 h-4 text-green-500" />
            <h4 className="font-medium text-sm">Enviar Mensagem de Teste</h4>
          </div>
          <div className="flex gap-3 items-end">
            <div className="flex-1 space-y-2">
              <Label className="text-xs text-muted-foreground">Número do WhatsApp</Label>
              <Input
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="11999999999"
                className="font-mono"
              />
            </div>
            <Button
              onClick={handleSendTest}
              disabled={sendingTest || !testPhone.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {sendingTest ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Enviar Teste
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Envia a mensagem de "{previewType === "pending" ? "Cadastro Pendente" : "Acesso Aprovado"}" para o número informado
          </p>
        </div>
      </Card>
    </div>
  );
}
