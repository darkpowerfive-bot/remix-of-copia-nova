import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-MIGRATION-INVITE] ${step}${detailsStr}`);
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

    const { email, fullName, token, planName, credits } = await req.json();
    
    if (!email || !token) {
      throw new Error("Email e token são obrigatórios");
    }

    logStep("Data received", { email, planName, credits });

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Fetch migration invite template
    const { data: template, error: templateError } = await supabaseAdmin
      .from("email_templates")
      .select("*")
      .eq("template_type", "migration_invite")
      .eq("is_active", true)
      .maybeSingle();

    if (templateError || !template) {
      logStep("Template not found, using default", { error: templateError?.message });
    }

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

    // Get origin from request or use default
    const origin = req.headers.get("origin") || "https://premium-channel-hub.lovable.app";
    const inviteLink = `${origin}/auth?invite=${token}`;
    const userName = fullName || email.split("@")[0] || "Operador";

    // Use template or default HTML
    let emailSubject = template?.subject || "🎉 Seu acesso à La Casa Dark Core está liberado!";
    let emailBody = template?.body || getDefaultEmailTemplate();

    // Replace variables
    const variables: Record<string, string> = {
      "{{nome}}": userName,
      "{{name}}": userName,
      "{{email}}": email,
      "{{invite_link}}": inviteLink,
      "{{action_link}}": inviteLink,
      "{{plan_name}}": planName || "FREE",
      "{{credits}}": String(credits || 50),
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

function getDefaultEmailTemplate(): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', Arial, sans-serif;">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table cellpadding="0" cellspacing="0" border="0" width="600" style="max-width: 600px; background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border-radius: 16px; border: 1px solid rgba(245, 158, 11, 0.3); overflow: hidden;">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0.05) 100%); padding: 40px 40px 30px; text-align: center; border-bottom: 1px solid rgba(245, 158, 11, 0.2);">
              <h1 style="color: #f59e0b; margin: 0; font-size: 28px; font-weight: 700;">🎉 Bem-vindo de Volta!</h1>
              <p style="color: #a3a3a3; margin: 15px 0 0; font-size: 16px;">La Casa Dark Core</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <p style="color: #e5e5e5; font-size: 18px; margin: 0 0 20px;">
                Olá <strong style="color: #f59e0b;">{{nome}}</strong>! 👋
              </p>
              
              <p style="color: #a3a3a3; font-size: 15px; line-height: 1.6; margin: 0 0 25px;">
                Você foi convidado a migrar sua conta para a nova versão da plataforma. 
                Seus créditos e plano já estão preparados e esperando por você!
              </p>
              
              <!-- Benefits Box -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: rgba(245, 158, 11, 0.1); border-radius: 12px; border: 1px solid rgba(245, 158, 11, 0.2); margin: 25px 0;">
                <tr>
                  <td style="padding: 25px;">
                    <p style="color: #f59e0b; font-size: 14px; font-weight: 600; margin: 0 0 15px; text-transform: uppercase;">O que você vai receber:</p>
                    <p style="color: #e5e5e5; font-size: 15px; margin: 0 0 10px;">✅ Plano: <strong>{{plan_name}}</strong></p>
                    <p style="color: #e5e5e5; font-size: 15px; margin: 0 0 10px;">✅ Créditos: <strong>{{credits}} créditos</strong></p>
                    <p style="color: #e5e5e5; font-size: 15px; margin: 0;">✅ Acesso imediato a todas as ferramentas</p>
                  </td>
                </tr>
              </table>
              
              <p style="color: #a3a3a3; font-size: 15px; line-height: 1.6; margin: 0 0 30px;">
                Clique no botão abaixo para criar sua nova senha e ativar sua conta. 
                Você também poderá cadastrar seu número de WhatsApp.
              </p>
              
              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center">
                    <a href="{{invite_link}}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #000000; text-decoration: none; padding: 16px 40px; font-size: 16px; font-weight: 700; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                      Ativar Minha Conta
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="color: #737373; font-size: 13px; margin: 30px 0 0; text-align: center;">
                Este link expira em 7 dias. Se não conseguir clicar, copie e cole no navegador:<br>
                <a href="{{invite_link}}" style="color: #f59e0b; word-break: break-all;">{{invite_link}}</a>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: rgba(0,0,0,0.3); padding: 25px 40px; text-align: center; border-top: 1px solid rgba(245, 158, 11, 0.1);">
              <p style="color: #525252; font-size: 12px; margin: 0;">
                © 2026 La Casa Dark Core. Todos os direitos reservados.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
