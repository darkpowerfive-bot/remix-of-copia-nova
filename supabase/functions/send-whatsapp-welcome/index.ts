import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-WHATSAPP-WELCOME] ${step}${detailsStr}`);
};

type MessageType = "pending" | "approved";

interface WhatsAppTemplateSettings {
  pendingMessage: string;
  approvedMessage: string;
  enabled: boolean;
  logoUrl?: string;
  sendLogo?: boolean;
}

const DEFAULT_TEMPLATES: WhatsAppTemplateSettings = {
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

  enabled: true
};

const normalizeWhatsAppMessage = (text: string) => {
  const lines = text.split("\n");

  const filtered = lines
    .map((line) => {
      // Add crown only on the signature line (where La Casa Dark Core® appears)
      if (line.includes("La Casa Dark Core®") && !line.includes("👑")) {
        return line.replace("La Casa Dark Core®", "👑 La Casa Dark Core®");
      }
      return line;
    })
    .filter((line) => {
      const t = line.trim();
      if (!t) return true;

      // Remove separator lines and old headers
      if (/^[━]{6,}$/u.test(t)) return false;
      if (/^[▬]{6,}$/u.test(t)) return false;
      if (/^🏠\s*\*LA CASA DARK CORE\*/i.test(t)) return false;
      if (/^📬\s*\*CADASTRO RECEBIDO\*/i.test(t)) return false;
      if (/^🎉\s*\*ACESSO APROVADO!?\*/i.test(t)) return false;

      // Avoid WhatsApp link preview
      if (/www\.canaisdarks\.com\.br/i.test(t)) return false;

      return true;
    });

  return filtered.join("\n").replace(/\n{3,}/g, "\n\n").trim();
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { 
      whatsapp, 
      fullName, 
      email,
      planName,
      messageType 
    }: { 
      whatsapp: string; 
      fullName?: string; 
      email?: string;
      planName?: string;
      messageType: MessageType;
    } = await req.json();
    
    if (!whatsapp) {
      logStep("No WhatsApp provided, skipping");
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "no_whatsapp" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Request received", { whatsapp, fullName, email, messageType });

    // Get Evolution API settings
    const evolutionApiUrl = Deno.env.get("EVOLUTION_API_URL");
    const evolutionApiKey = Deno.env.get("EVOLUTION_API_KEY");
    const evolutionInstanceName = Deno.env.get("EVOLUTION_INSTANCE_NAME");

    if (!evolutionApiUrl || !evolutionApiKey || !evolutionInstanceName) {
      logStep("Evolution API not configured, skipping WhatsApp");
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "evolution_not_configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Fetch WhatsApp welcome templates from admin_settings
    let templates = DEFAULT_TEMPLATES;
    
    const { data: settingsData } = await supabaseAdmin
      .from("admin_settings")
      .select("value")
      .eq("key", "whatsapp_welcome_templates")
      .maybeSingle();

    if (settingsData?.value) {
      templates = { ...DEFAULT_TEMPLATES, ...settingsData.value };
    }

    if (!templates.enabled) {
      logStep("WhatsApp welcome messages disabled");
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Select template based on message type
    let messageTemplate = messageType === "pending" 
      ? templates.pendingMessage 
      : templates.approvedMessage;

    // Replace variables
    const userName = fullName || email?.split("@")[0] || "Operador";
    const dashboardLink = "https://app.canaisdarks.com.br/dashboard";

    const variables: Record<string, string> = {
      "{{nome}}": userName,
      "{{name}}": userName,
      "{{email}}": email || "",
      "{{plano}}": planName || "FREE",
      "{{plan_name}}": planName || "FREE",
      "{{dashboard_link}}": dashboardLink,
      "{{data}}": new Date().toLocaleDateString("pt-BR"),
    };

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(key.replace(/[{}]/g, "\\$&"), "g");
      messageTemplate = messageTemplate.replace(regex, value);
    }

    messageTemplate = normalizeWhatsAppMessage(messageTemplate);

    logStep("Message prepared", { messageType, templateLength: messageTemplate.length });

    // Format phone number
    let phone = whatsapp.replace(/\D/g, '');
    if (!phone.startsWith('55')) {
      phone = '55' + phone;
    }

    // Check if we should send logo
    const shouldSendLogo = templates.sendLogo && templates.logoUrl;
    
    if (shouldSendLogo) {
      // Send logo image first, then message separately
      logStep("Sending logo first", { logoUrl: templates.logoUrl });
      
      const sendMediaUrl = `${evolutionApiUrl}/message/sendMedia/${evolutionInstanceName}`;
      
      // Send logo without caption
      const mediaResponse = await fetch(sendMediaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
        body: JSON.stringify({
          number: phone,
          mediatype: "image",
          media: templates.logoUrl,
        }),
      });

      if (!mediaResponse.ok) {
        const errorText = await mediaResponse.text();
        logStep("Evolution API media error", { status: mediaResponse.status, error: errorText });
      } else {
        logStep("Logo sent successfully");
      }

      // Small delay then send text message
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Send text message
      const textResponse = await fetch(`${evolutionApiUrl}/message/sendText/${evolutionInstanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
        body: JSON.stringify({
          number: phone,
          text: messageTemplate,
        }),
      });

      if (!textResponse.ok) {
        const textErrorText = await textResponse.text();
        throw new Error(`Evolution API error: ${textResponse.status} - ${textErrorText}`);
      }
      
      const result = await textResponse.json();
      logStep("WhatsApp with logo sent successfully", { phone, messageType, result });
    } else {
      // Send text-only message
      const sendUrl = `${evolutionApiUrl}/message/sendText/${evolutionInstanceName}`;
      
      const response = await fetch(sendUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': evolutionApiKey,
        },
        body: JSON.stringify({
          number: phone,
          text: messageTemplate,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logStep("Evolution API error", { status: response.status, error: errorText });
        throw new Error(`Evolution API error: ${response.status}`);
      }

      const result = await response.json();
      logStep("WhatsApp sent successfully", { phone, messageType, result });
    }

    // Log the message sent
    await supabaseAdmin
      .from("activity_logs")
      .insert({
        user_id: "00000000-0000-0000-0000-000000000000", // System action
        action: "whatsapp_welcome_sent",
        description: `WhatsApp ${messageType} enviado para ${phone}${shouldSendLogo ? ' (com logo)' : ''}`,
        metadata: {
          phone,
          messageType,
          email,
          fullName,
          withLogo: shouldSendLogo,
        }
      });

    return new Response(JSON.stringify({ success: true, messageType }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
