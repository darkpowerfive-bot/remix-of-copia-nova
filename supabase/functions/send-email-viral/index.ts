import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import nodemailer from "npm:nodemailer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ViralVideoPayload {
  user_id: string;
  video_id: string;
  title: string;
  channel_name: string;
  views: number;
  viral_score: number;
  thumbnail_url?: string;
  video_url: string;
  niche?: string;
  hours_ago?: number;
}

interface SmtpSettings {
  host: string;
  port: number;
  secure?: boolean;
  useSsl?: boolean;
  user?: string;
  pass?: string;
  password?: string;
  email?: string;
  from_email?: string;
  fromName?: string;
  from_name?: string;
}

// Format numbers for display
const formatNumber = (num: number): string => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString("pt-BR");
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[send-email-viral] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });
    
    const payload = await req.json();
    
    logStep("Received payload", payload);

    // Support single video or array of videos
    const videos: ViralVideoPayload[] = Array.isArray(payload.videos) 
      ? payload.videos 
      : [payload];

    const userId = payload.user_id || videos[0]?.user_id;
    
    if (!userId) {
      throw new Error("No user_id provided");
    }

    // Get user's email and profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", userId)
      .single();

    if (profileError || !profile?.email) {
      logStep("User email not found", { error: profileError });
      return new Response(
        JSON.stringify({ error: "User email not found", success: false }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Found user profile", { email: profile.email, name: profile.full_name });

    // Get email template
    const { data: template, error: templateError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("template_type", "viral_video_alert")
      .eq("is_active", true)
      .maybeSingle();

    if (templateError || !template) {
      logStep("Email template not found", { error: templateError });
      return new Response(
        JSON.stringify({ error: "Email template not found", success: false }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    logStep("Found email template", { subject: template.subject });

    // Get SMTP settings
    const { data: smtpSettingsData } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "smtp_settings")
      .maybeSingle();

    if (!smtpSettingsData?.value) {
      logStep("SMTP settings not configured");
      return new Response(
        JSON.stringify({ error: "SMTP not configured", success: false }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const smtpSettings = smtpSettingsData.value as SmtpSettings;

    // Normalize SMTP settings (handle different field names)
    const normalizedSmtp = {
      host: smtpSettings.host,
      port: Number(smtpSettings.port) || 587,
      secure: smtpSettings.secure ?? smtpSettings.useSsl ?? false,
      user: smtpSettings.user ?? smtpSettings.email ?? "",
      pass: smtpSettings.pass ?? smtpSettings.password ?? "",
      from_email: smtpSettings.from_email ?? smtpSettings.email ?? "",
      from_name: smtpSettings.from_name ?? smtpSettings.fromName ?? "La Casa Dark Core",
    };

    logStep("SMTP settings loaded", { host: normalizedSmtp.host, port: normalizedSmtp.port });

    // Create Nodemailer transporter
    const secure = normalizedSmtp.secure || normalizedSmtp.port === 465;
    
    const transporter = nodemailer.createTransport({
      host: normalizedSmtp.host,
      port: normalizedSmtp.port,
      secure,
      auth: {
        user: normalizedSmtp.user,
        pass: normalizedSmtp.pass,
      },
      requireTLS: !secure,
      tls: { rejectUnauthorized: false },
    });

    await transporter.verify();
    logStep("SMTP connection verified");

    const results: { video_id: string; success: boolean; error?: string }[] = [];
    const appUrl = "https://viralizaai.com";

    for (const video of videos) {
      try {
        // Replace template variables
        let emailBody = template.body;
        let emailSubject = template.subject;

        const analyzeUrl = `${appUrl}/video-analyzer?url=${encodeURIComponent(video.video_url)}&title=${encodeURIComponent(video.title)}&thumbnail=${encodeURIComponent(video.thumbnail_url || "")}`;

        const replacements: Record<string, string> = {
          "{{video_title}}": video.title,
          "{{thumbnail_url}}": video.thumbnail_url || "",
          "{{channel_name}}": video.channel_name,
          "{{niche}}": video.niche || "Geral",
          "{{views}}": formatNumber(video.views),
          "{{viral_score}}": formatNumber(video.viral_score),
          "{{hours_ago}}": String(video.hours_ago || "N/A"),
          "{{video_url}}": video.video_url,
          "{{analyze_url}}": analyzeUrl,
          "{{user_name}}": profile.full_name || "Usuário",
        };

        for (const [key, value] of Object.entries(replacements)) {
          const regex = new RegExp(key.replace(/[{}]/g, '\\$&'), "g");
          emailBody = emailBody.replace(regex, value);
          emailSubject = emailSubject.replace(regex, value);
        }

        logStep(`Sending email to ${profile.email} for video ${video.video_id}`);

        await transporter.sendMail({
          from: `"${normalizedSmtp.from_name}" <${normalizedSmtp.from_email}>`,
          to: profile.email,
          subject: emailSubject,
          html: emailBody,
        });

        logStep(`Email sent successfully for video ${video.video_id}`);
        results.push({ video_id: video.video_id, success: true });

      } catch (videoError) {
        logStep(`Error sending email for video ${video.video_id}`, { 
          error: videoError instanceof Error ? videoError.message : "Unknown error" 
        });
        results.push({
          video_id: video.video_id,
          success: false,
          error: videoError instanceof Error ? videoError.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;

    logStep(`Email sending completed: ${successCount} sent, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: successCount,
        errors: errorCount,
        results,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    logStep("Error in send-email-viral", { error: error instanceof Error ? error.message : "Unknown error" });
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
        success: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
