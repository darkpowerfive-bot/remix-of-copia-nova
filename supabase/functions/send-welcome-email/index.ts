import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SEND-WELCOME-EMAIL] ${step}${detailsStr}`);
};

interface SmtpSettings {
  host: string;
  port: number;
  email: string;
  password: string;
  useSsl: boolean;
  fromName?: string;
}

const DEFAULT_EMAIL_LOGO_PATH = "/images/logo-email.gif";

const escapeRegExp = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const extractLogoUrlFromHtml = (html: string): string | null => {
  const m = html.match(/src\s*=\s*"([^"]*logo-email\.(?:gif|png|jpe?g|webp)(?:\?[^\"]*)?)"/i);
  return m?.[1] ?? null;
};

const resolveToAbsoluteUrl = (raw: string, origin: string | null): string | null => {
  if (!raw) return null;
  if (/^cid:/i.test(raw)) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("/") && origin) return `${origin}${raw}`;
  return null;
};

const embedLogoAsCid = async (html: string, origin: string | null) => {
  const extracted = extractLogoUrlFromHtml(html);
  const fallback = origin ? `${origin}${DEFAULT_EMAIL_LOGO_PATH}` : null;
  const logoUrl = resolveToAbsoluteUrl(extracted ?? "", origin) ?? fallback;

  // Replace placeholder + any logo-email.* src with cid
  let out = html.replace(/\{\{logo_url\}\}/g, "cid:logo-email");
  out = out.replace(
    /src\s*=\s*"[^"]*logo-email\.(?:gif|png|jpe?g|webp)(?:\?[^\"]*)?"/gi,
    'src="cid:logo-email"'
  );
  if (extracted) out = out.replace(new RegExp(escapeRegExp(extracted), "g"), "cid:logo-email");

  if (!logoUrl || /^cid:/i.test(logoUrl)) {
    return { html: out, attachments: [] as any[] };
  }

  try {
    const res = await fetch(logoUrl);
    if (!res.ok) {
      console.warn("Logo fetch failed", { logoUrl, status: res.status });
      return { html: out, attachments: [] as any[] };
    }

    const contentType = res.headers.get("content-type") || "image/gif";
    const bytes = new Uint8Array(await res.arrayBuffer());

    const filename = contentType.includes("png")
      ? "logo-email.png"
      : contentType.includes("jpeg")
        ? "logo-email.jpg"
        : contentType.includes("webp")
          ? "logo-email.webp"
          : "logo-email.gif";

    return {
      html: out,
      attachments: [
        {
          filename,
          content: bytes,
          cid: "logo-email",
          contentType,
        },
      ],
    };
  } catch (e) {
    console.warn("Logo fetch error", { logoUrl, error: String(e) });
    return { html: out, attachments: [] as any[] };
  }
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { email, fullName } = await req.json();

    if (!email) {
      throw new Error("Email é obrigatório");
    }

    logStep("Email received", { email, fullName });

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Fetch welcome template
    const { data: template, error: templateError } = await supabaseAdmin
      .from("email_templates")
      .select("*")
      .eq("template_type", "welcome")
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
    const origin = req.headers.get("origin");
    const dashboardUrl = `${origin || "https://premium-channel-hub.lovable.app"}/dashboard`;

    const variables: Record<string, string> = {
      "{{nome}}": userName,
      "{{name}}": userName,
      "{{email}}": email,
      "{{dashboard_link}}": dashboardUrl,
      "{{action_link}}": dashboardUrl,
      "{{confirmation_link}}": dashboardUrl,
      "{{data}}": new Date().toLocaleDateString("pt-BR"),
      "{{logo_url}}": origin ? `${origin}${DEFAULT_EMAIL_LOGO_PATH}` : DEFAULT_EMAIL_LOGO_PATH,
    };

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(key.replace(/[{}]/g, "\\$&"), "g");
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

    const embedded = await embedLogoAsCid(emailBody, origin);

    await transporter.sendMail({
      from: `${fromName} <${smtpSettings.email}>`,
      to: email,
      subject: emailSubject,
      html: embedded.html,
      attachments: embedded.attachments,
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

