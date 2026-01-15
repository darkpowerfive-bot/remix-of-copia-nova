import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.89.0";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SmtpSettings {
  host: string;
  port: number;
  email: string;
  password: string;
  useSsl: boolean;
  fromName?: string;
}

interface RequestBody {
  toEmail: string;
  subject: string;
  htmlBody: string;
}

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value);

const DEFAULT_EMAIL_LOGO_PATH = "/images/logo-email.gif";

const escapeRegExp = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const extractLogoUrlFromHtml = (html: string): string | null => {
  // common: src="https://.../logo-email.gif" or src="/images/logo-email.gif"
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

  if (!logoUrl || /^cid:/i.test(logoUrl)) {
    // Nothing to fetch/embed
    return { html, attachments: [] as any[] };
  }

  // Replace placeholder + any known logo-email.* src with cid
  let out = html.replace(/\{\{logo_url\}\}/g, "cid:logo-email");
  out = out.replace(
    /src\s*=\s*"[^"]*logo-email\.(?:gif|png|jpe?g|webp)(?:\?[^\"]*)?"/gi,
    'src="cid:logo-email"'
  );

  // Also replace the extracted src exactly (in case it doesn't match the logo-email.* pattern)
  if (extracted) {
    out = out.replace(new RegExp(escapeRegExp(extracted), "g"), "cid:logo-email");
  }

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
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      throw new Error("Configuração interna incompleta");
    }

    // Validate user session
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ success: false, error: "Não autorizado" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Check admin role
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: adminRole } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole) {
      return new Response(JSON.stringify({ success: false, error: "Apenas admins podem enviar templates" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Parse request
    const body: RequestBody = await req.json();
    const toEmail = (body?.toEmail ?? "").trim();
    const subject = (body?.subject ?? "").trim();
    const htmlBody = body?.htmlBody ?? "";

    if (!toEmail || !isValidEmail(toEmail) || toEmail.length > 255) {
      throw new Error("Email de destino inválido");
    }

    if (!subject) {
      throw new Error("Assunto é obrigatório");
    }

    if (!htmlBody) {
      throw new Error("Corpo do email é obrigatório");
    }

    console.log(`Sending template email to: ${toEmail}`);

    // Fetch SMTP settings
    const { data: smtpData, error: smtpError } = await adminClient
      .from("admin_settings")
      .select("value")
      .eq("key", "smtp_settings")
      .maybeSingle();

    if (smtpError || !smtpData?.value) {
      throw new Error("Configurações SMTP não encontradas. Salve o SMTP antes de testar.");
    }

    const smtpSettings = smtpData.value as SmtpSettings;

    if (!smtpSettings.host || !smtpSettings.email || !smtpSettings.password) {
      throw new Error("Configurações SMTP incompletas");
    }

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

    const fromName = smtpSettings.fromName || "La Casa Dark Core";

    const origin = req.headers.get("origin");
    const embedded = await embedLogoAsCid(htmlBody, origin);

    await transporter.sendMail({
      from: `${fromName} <${smtpSettings.email}>`,
      to: toEmail,
      subject: `[TESTE] ${subject}`,
      html: embedded.html,
      attachments: embedded.attachments,
    });

    console.log("Template email sent successfully");

    return new Response(JSON.stringify({ success: true, message: `Template enviado para ${toEmail}` }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending template email:", error);

    let errorMessage = error?.message || "Erro desconhecido ao enviar email";

    if (String(errorMessage).includes("EAUTH") || String(errorMessage).includes("535")) {
      errorMessage = "Falha na autenticação SMTP. Para Gmail, use uma 'App Password'.";
    }

    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
