import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-APPROVED-EMAIL] ${step}${detailsStr}`);
};

interface SmtpSettings {
  host: string;
  port: number;
  email: string;
  password: string;
  useSsl: boolean;
  fromName?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { email, fullName, planName, whatsapp } = await req.json();
    
    if (!email) {
      throw new Error("Email é obrigatório");
    }

    logStep("Email received", { email, fullName, planName });

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Fetch user's plan and whatsapp if not provided
    let userPlanName = planName || "FREE";
    let userId: string | undefined;
    let profileWhatsapp: string | undefined;
    
    // Always fetch user profile to get id and whatsapp
    const { data: profileData } = await supabaseAdmin
      .from("profiles")
      .select("id, whatsapp")
      .eq("email", email)
      .maybeSingle();
    
    if (profileData?.id) {
      userId = profileData.id;
      profileWhatsapp = profileData.whatsapp ?? undefined;
      
      if (!planName) {
        const { data: roleData } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", profileData.id)
          .maybeSingle();
        
        if (roleData?.role) {
          // Map role to display name
          const roleMap: Record<string, string> = {
            'admin': 'ADMIN',
            'pro': 'PRO',
            'free': 'FREE'
          };
          userPlanName = roleMap[roleData.role] || 'FREE';
        }
      }
    }

    logStep("Plan determined", { userPlanName });

    // Fetch access_approved template
    const { data: template, error: templateError } = await supabaseAdmin
      .from("email_templates")
      .select("*")
      .eq("template_type", "access_approved")
      .eq("is_active", true)
      .maybeSingle();

    if (templateError || !template) {
      logStep("Template not found", { error: templateError?.message });
      throw new Error("Template de email não encontrado");
    }

    logStep("Template loaded", { subject: template.subject });

    // Fetch SMTP settings
    const { data: smtpData, error: smtpError } = await supabaseAdmin
      .from("admin_settings")
      .select("value")
      .eq("key", "smtp_settings")
      .maybeSingle();

    if (smtpError || !smtpData?.value) {
      logStep("SMTP settings not found");
      throw new Error("Configurações SMTP não encontradas");
    }

    const smtpSettings = smtpData.value as SmtpSettings;

    if (!smtpSettings.host || !smtpSettings.email || !smtpSettings.password) {
      throw new Error("Configurações SMTP incompletas");
    }

    // Replace template variables
    let emailSubject = template.subject;
    let emailBody = template.body;

    const userName = fullName || email.split("@")[0] || "Operador";
    const dashboardUrl = `${req.headers.get("origin") || "https://app.canaisdarks.com.br"}/dashboard`;

    const variables: Record<string, string> = {
      "{{nome}}": userName,
      "{{name}}": userName,
      "{{email}}": email,
      "{{plan_name}}": userPlanName,
      "{{plano}}": userPlanName,
      "{{dashboard_link}}": dashboardUrl,
      "{{action_link}}": dashboardUrl,
      "{{data}}": new Date().toLocaleDateString("pt-BR"),
    };

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(key.replace(/[{}]/g, '\\$&'), "g");
      emailSubject = emailSubject.replace(regex, value);
      emailBody = emailBody.replace(regex, value);
    }

    logStep("Variables replaced");

    // Send email via SMTP
    const port = Number(smtpSettings.port) || 587;
    const secure = !!smtpSettings.useSsl || port === 465;

    const transporter = nodemailer.createTransport({
      host: smtpSettings.host,
      port,
      secure,
      auth: {
        user: smtpSettings.email,
        pass: smtpSettings.password,
      },
      requireTLS: !secure,
      tls: { rejectUnauthorized: false },
    });

    await transporter.verify();
    logStep("SMTP connection verified");

    const fromName = smtpSettings.fromName || "La Casa Dark Core";

    await transporter.sendMail({
      from: `${fromName} <${smtpSettings.email}>`,
      to: email,
      subject: emailSubject,
      html: emailBody,
    });

    logStep("Email sent successfully", { to: email });

    // Resolve WhatsApp number (payload or already saved in profile)
    const resolvedWhatsapp: string | undefined = whatsapp || profileWhatsapp;
    
    if (resolvedWhatsapp) {
      logStep("WhatsApp resolved", { resolvedWhatsapp });
    }

    // Send WhatsApp message if we have a number
    if (resolvedWhatsapp) {
      try {
        logStep("Sending WhatsApp approved message", { whatsapp: resolvedWhatsapp });

        const { data: whatsappResult, error: whatsappError } = await supabaseAdmin
          .functions
          .invoke("send-whatsapp-welcome", {
            body: {
              whatsapp: resolvedWhatsapp,
              fullName,
              email,
              planName: userPlanName,
              messageType: "approved",
            },
          });

        if (whatsappError) {
          throw whatsappError;
        }

        logStep("WhatsApp result", whatsappResult);
      } catch (whatsappError) {
        logStep("WhatsApp error (non-blocking)", { error: String(whatsappError) });
      }
    } else {
      logStep("No WhatsApp number available, skipping WhatsApp notification");
    }

    return new Response(JSON.stringify({ success: true }), {
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
