import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[SEND-NEWSLETTER-WELCOME] ${step}${detailsStr}`);
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

    const { email } = await req.json();
    
    if (!email) {
      throw new Error("Email é obrigatório");
    }

    logStep("Email received", { email });

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Fetch newsletter_welcome template
    const { data: template, error: templateError } = await supabaseAdmin
      .from("email_templates")
      .select("*")
      .eq("template_type", "newsletter_welcome")
      .eq("is_active", true)
      .maybeSingle();

    if (templateError || !template) {
      logStep("Template not found, using default");
      // If template doesn't exist, we'll skip sending (admin can add it later)
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "Template not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
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
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "SMTP not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const smtpSettings = smtpData.value as SmtpSettings;

    if (!smtpSettings.host || !smtpSettings.email || !smtpSettings.password) {
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "SMTP incomplete" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Replace template variables
    let emailSubject = template.subject;
    let emailBody = template.body;

    const blogUrl = `${req.headers.get("origin") || "https://app.canaisdarks.com.br"}/blog`;

    const variables: Record<string, string> = {
      "{{email}}": email,
      "{{blog_url}}": blogUrl,
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
    
    // Return success anyway to not block the subscription
    return new Response(JSON.stringify({ success: true, emailError: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});
