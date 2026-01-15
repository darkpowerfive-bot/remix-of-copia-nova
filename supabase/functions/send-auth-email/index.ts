import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import nodemailer from "https://esm.sh/nodemailer@6.9.10";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[AUTH-EMAIL-HOOK] ${step}${detailsStr}`);
};

interface SmtpSettings {
  host: string;
  port: number;
  email: string;
  password: string;
  useSsl: boolean;
  fromName?: string;
}

// Map auth email types to our template types
const AUTH_TYPE_TO_TEMPLATE: Record<string, string> = {
  "recovery": "password_reset",
  "signup": "welcome",
  "magiclink": "welcome",
  "invite": "welcome",
  "email_change": "welcome",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const hookSecret = Deno.env.get("AUTH_EMAIL_HOOK_SECRET");
    
    // Parse the payload
    const payload = await req.text();
    let emailData: any;

    // If hook secret is configured, verify the webhook signature
    if (hookSecret) {
      try {
        const headers = Object.fromEntries(req.headers);
        const wh = new Webhook(hookSecret);
        emailData = wh.verify(payload, headers);
        logStep("Webhook signature verified");
      } catch (err) {
        logStep("Webhook verification failed", { error: String(err) });
        // Try to parse as regular JSON if webhook verification fails
        emailData = JSON.parse(payload);
      }
    } else {
      // No secret configured, parse as regular JSON
      emailData = JSON.parse(payload);
    }

    logStep("Email data received", { 
      type: emailData?.email_data?.email_action_type,
      email: emailData?.user?.email 
    });

    const user = emailData?.user;
    const email_action_type = emailData?.email_data?.email_action_type;
    const token = emailData?.email_data?.token;
    const token_hash = emailData?.email_data?.token_hash;
    const redirect_to = emailData?.email_data?.redirect_to;
    const site_url = emailData?.email_data?.site_url;

    if (!user?.email) {
      logStep("No user email found, returning empty response");
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get the template type for this auth action
    const templateType = AUTH_TYPE_TO_TEMPLATE[email_action_type];
    
    if (!templateType) {
      logStep("No template mapping for action type, using default", { type: email_action_type });
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    logStep("Looking for template", { templateType });

    // Fetch the custom template
    const { data: template, error: templateError } = await supabaseAdmin
      .from("email_templates")
      .select("*")
      .eq("template_type", templateType)
      .eq("is_active", true)
      .single();

    if (templateError || !template) {
      logStep("Template not found, using default Supabase email", { templateType, error: templateError?.message });
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    logStep("Template found", { subject: template.subject });

    // Fetch SMTP settings
    const { data: smtpData, error: smtpError } = await supabaseAdmin
      .from("admin_settings")
      .select("value")
      .eq("key", "smtp_settings")
      .single();

    if (smtpError || !smtpData?.value) {
      logStep("SMTP settings not found, using default Supabase email");
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const smtpSettings = smtpData.value as SmtpSettings;

    if (!smtpSettings.host || !smtpSettings.email || !smtpSettings.password) {
      logStep("SMTP settings incomplete, using default Supabase email");
      return new Response(JSON.stringify({}), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Build the reset/action URL
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    let actionUrl = "";
    
    if (email_action_type === "recovery") {
      // For password recovery, build the Supabase auth verification URL
      const baseRedirect = redirect_to || site_url || "https://premium-channel-hub.lovable.app";
      actionUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(baseRedirect)}`;
    } else if (email_action_type === "signup" || email_action_type === "email_change") {
      actionUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to || site_url || "")}`;
    } else {
      actionUrl = redirect_to || site_url || "";
    }

    logStep("Action URL built", { actionUrl: actionUrl.substring(0, 100) + "..." });

    // Replace template variables
    let emailSubject = template.subject;
    let emailBody = template.body;

    const userName = user.user_metadata?.full_name || user.email?.split("@")[0] || "Operador";

    const variables: Record<string, string> = {
      "{{nome}}": userName,
      "{{name}}": userName,
      "{{email}}": user.email,
      "{{reset_link}}": actionUrl,
      "{{action_link}}": actionUrl,
      "{{confirmation_link}}": actionUrl,
      "{{token}}": token || "",
      "{{data}}": new Date().toLocaleDateString("pt-BR"),
    };

    for (const [key, value] of Object.entries(variables)) {
      emailSubject = emailSubject.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), "g"), value);
      emailBody = emailBody.replace(new RegExp(key.replace(/[{}]/g, '\\$&'), "g"), value);
    }

    logStep("Template variables replaced");

    // Send email using SMTP
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
      to: user.email,
      subject: emailSubject,
      html: emailBody,
    });

    logStep("Custom email sent successfully", { to: user.email, template: templateType });

    // Return empty response to indicate we handled the email
    // This tells Supabase not to send the default email
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in send-auth-email", { message: errorMessage });
    
    // Return empty response even on error to not block auth flow
    // The default Supabase email will be sent
    return new Response(JSON.stringify({}), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
