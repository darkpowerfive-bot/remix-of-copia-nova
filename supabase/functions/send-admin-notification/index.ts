import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-ADMIN-NOTIFICATION] ${step}${detailsStr}`);
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

    const { userEmail, userName, userWhatsapp } = await req.json();
    
    if (!userEmail) {
      throw new Error("Email do usuário é obrigatório");
    }

    logStep("New user registration", { userEmail, userName, userWhatsapp });

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Fetch all admin users to notify
    const { data: adminRoles, error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");

    if (rolesError) {
      logStep("Error fetching admin roles", { error: rolesError.message });
      throw new Error("Erro ao buscar administradores");
    }

    if (!adminRoles || adminRoles.length === 0) {
      logStep("No admin users found");
      return new Response(JSON.stringify({ success: true, message: "Nenhum admin para notificar" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Get admin emails from profiles
    const adminUserIds = adminRoles.map(r => r.user_id);
    const { data: adminProfiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("email")
      .in("id", adminUserIds)
      .not("email", "is", null);

    if (profilesError || !adminProfiles || adminProfiles.length === 0) {
      logStep("Error fetching admin profiles", { error: profilesError?.message });
      throw new Error("Erro ao buscar emails dos administradores");
    }

    const adminEmails = adminProfiles.map(p => p.email).filter(Boolean);
    logStep("Admin emails found", { count: adminEmails.length, emails: adminEmails });

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

    // Create email content
    const displayName = userName || userEmail.split("@")[0] || "Novo usuário";
    const whatsappLink = userWhatsapp 
      ? `<a href="https://wa.me/${userWhatsapp.replace(/\D/g, '')}" style="color: #22c55e;">WhatsApp: ${userWhatsapp}</a>`
      : "WhatsApp: Não informado";

    const emailSubject = `🆕 Novo cadastro pendente: ${displayName}`;
    const emailBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0a0a0f; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, #14141a 0%, #0a0a0f 100%); border: 1px solid rgba(34, 197, 94, 0.3); border-radius: 16px; overflow: hidden;">
          
          <!-- Header -->
          <div style="background: linear-gradient(135deg, rgba(34, 197, 94, 0.2) 0%, rgba(34, 197, 94, 0.05) 100%); padding: 30px 20px; text-align: center; border-bottom: 1px solid rgba(34, 197, 94, 0.2);">
            <h1 style="color: #22c55e; margin: 0; font-size: 24px; font-weight: 700;">
              🔔 Novo Cadastro Pendente
            </h1>
          </div>

          <!-- Content -->
          <div style="padding: 30px 20px;">
            <p style="color: #e5e5e5; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
              Um novo usuário se cadastrou e está aguardando aprovação:
            </p>

            <div style="background: rgba(255, 255, 255, 0.05); border-radius: 12px; padding: 20px; margin-bottom: 25px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="color: #9ca3af; padding: 8px 0; font-size: 14px;">Nome:</td>
                  <td style="color: #ffffff; padding: 8px 0; font-size: 14px; text-align: right; font-weight: 600;">${displayName}</td>
                </tr>
                <tr>
                  <td style="color: #9ca3af; padding: 8px 0; font-size: 14px;">Email:</td>
                  <td style="color: #ffffff; padding: 8px 0; font-size: 14px; text-align: right;">${userEmail}</td>
                </tr>
                <tr>
                  <td style="color: #9ca3af; padding: 8px 0; font-size: 14px;">Contato:</td>
                  <td style="padding: 8px 0; font-size: 14px; text-align: right;">${whatsappLink}</td>
                </tr>
                <tr>
                  <td style="color: #9ca3af; padding: 8px 0; font-size: 14px;">Data:</td>
                  <td style="color: #ffffff; padding: 8px 0; font-size: 14px; text-align: right;">${new Date().toLocaleString("pt-BR")}</td>
                </tr>
              </table>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center;">
              <a href="${supabaseUrl.replace('.supabase.co', '.lovable.app')}/admin" 
                 style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #000000; padding: 14px 32px; font-size: 16px; font-weight: 600; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 14px rgba(34, 197, 94, 0.3);">
                Acessar Painel Admin
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background: rgba(0, 0, 0, 0.3); padding: 20px; text-align: center; border-top: 1px solid rgba(255, 255, 255, 0.05);">
            <p style="color: #6b7280; font-size: 12px; margin: 0;">
              Esta é uma notificação automática do sistema La Casa Dark Core
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    logStep("Email content prepared");

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

    // Send to all admins
    for (const adminEmail of adminEmails) {
      try {
        await transporter.sendMail({
          from: `${fromName} <${smtpSettings.email}>`,
          to: adminEmail,
          subject: emailSubject,
          html: emailBody,
        });
        logStep("Email sent to admin", { to: adminEmail });
      } catch (sendError) {
        logStep("Failed to send to admin", { to: adminEmail, error: String(sendError) });
      }
    }

    logStep("All admin notifications sent");

    return new Response(JSON.stringify({ success: true, notifiedAdmins: adminEmails.length }), {
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
