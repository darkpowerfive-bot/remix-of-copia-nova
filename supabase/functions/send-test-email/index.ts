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
}

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value);

serve(async (req) => {
  // Handle CORS preflight requests
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

    // 1) Validate user session (do NOT trust client)
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
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

    // 2) Use service role for privileged reads and admin role check
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    const { data: adminRole, error: roleErr } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleErr) {
      console.error("Role check error:", roleErr);
      throw new Error("Erro ao validar permissões");
    }

    if (!adminRole) {
      return new Response(JSON.stringify({ success: false, error: "Apenas admins podem enviar email de teste" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // 3) Parse request
    const body: RequestBody = await req.json();
    const toEmail = (body?.toEmail ?? "").trim();

    if (!toEmail || !isValidEmail(toEmail) || toEmail.length > 255) {
      throw new Error("Email de destino inválido");
    }

    console.log(`Sending SMTP test email to: ${toEmail}`);

    // 4) Fetch SMTP settings from DB
    const { data: smtpData, error: smtpError } = await adminClient
      .from("admin_settings")
      .select("value")
      .eq("key", "smtp_settings")
      .maybeSingle();

    if (smtpError) {
      console.error("SMTP settings read error:", smtpError);
      throw new Error("Erro ao carregar configurações SMTP");
    }

    if (!smtpData?.value) {
      throw new Error("Configurações SMTP não encontradas. Salve o SMTP antes de testar.");
    }

    const smtpSettings = smtpData.value as SmtpSettings;

    if (!smtpSettings.host || !smtpSettings.email || !smtpSettings.password) {
      throw new Error("Configurações SMTP incompletas");
    }

    const port = Number(smtpSettings.port) || 587;
    const secure = !!smtpSettings.useSsl || port === 465; // SSL on connect (SMTPS)

    console.log(`SMTP: ${smtpSettings.host}:${port} secure=${secure}`);

    const transporter = nodemailer.createTransport({
      host: smtpSettings.host,
      port,
      secure,
      auth: {
        user: smtpSettings.email,
        pass: smtpSettings.password,
      },
      // Useful for Gmail/STARTTLS environments
      requireTLS: !secure,
      tls: {
        // Some providers use different cert chains; keep permissive for testing.
        rejectUnauthorized: false,
      },
    });

    // Verify connection/auth
    await transporter.verify();

    const fromName = smtpSettings.fromName || "La Casa Dark Core";

    await transporter.sendMail({
      from: `${fromName} <${smtpSettings.email}>`,
      to: toEmail,
      subject: `✅ Teste SMTP - ${fromName}`,
      text: "Suas configurações SMTP estão funcionando corretamente!",
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2>Teste SMTP</h2>
          <p>Suas configurações SMTP estão funcionando corretamente.</p>
          <p><strong>Servidor:</strong> ${smtpSettings.host}:${port}</p>
          <p><strong>Modo:</strong> ${secure ? "SSL" : "STARTTLS"}</p>
        </div>
      `,
    });

    return new Response(
      JSON.stringify({ success: true, message: `Email de teste enviado com sucesso para ${toEmail}` }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending test email:", error);

    let errorMessage = error?.message || "Erro desconhecido ao enviar email";

    if (String(errorMessage).includes("EAUTH") || String(errorMessage).includes("535")) {
      errorMessage =
        "Falha na autenticação SMTP. Para Gmail, use uma 'App Password' (não a senha normal).";
    }

    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
