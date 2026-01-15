import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createTransport } from "npm:nodemailer";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[RENEWAL-REMINDERS] ${step}${detailsStr}`);
};

interface SmtpSettings {
  host: string;
  port: number;
  email: string;
  password: string;
  useSsl?: boolean;
  fromName?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials");
    }

    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not set");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Get SMTP settings
    const { data: smtpData, error: smtpError } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "smtp")
      .single();

    if (smtpError || !smtpData?.value) {
      throw new Error("SMTP settings not configured");
    }

    const smtpSettings = smtpData.value as SmtpSettings;
    logStep("SMTP settings loaded", { host: smtpSettings.host });

    // Get email template
    const { data: templateData, error: templateError } = await supabase
      .from("email_templates")
      .select("*")
      .eq("template_type", "renewal_reminder")
      .single();

    if (templateError || !templateData) {
      throw new Error("renewal_reminder template not found");
    }

    logStep("Email template loaded");

    // Get email logo
    const { data: brandingData } = await supabase
      .from("admin_settings")
      .select("value")
      .eq("key", "email_branding")
      .single();

    const logoUrl = (brandingData?.value as any)?.logo_url || "https://kabnbvnephjifeazaiis.supabase.co/storage/v1/object/public/avatars/logo-email.gif";

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Get all active subscriptions
    const subscriptions = await stripe.subscriptions.list({
      status: "active",
      limit: 100,
      expand: ["data.customer"],
    });

    logStep("Fetched subscriptions", { count: subscriptions.data.length });

    const now = new Date();
    const reminderDays = [5, 3, 1]; // Days before expiration to send reminders
    const emailsSent: string[] = [];
    const errors: string[] = [];

    // Configure SMTP transporter
    const port = smtpSettings.port || 587;
    const secure = port === 465;
    
    const transporter = createTransport({
      host: smtpSettings.host,
      port: port,
      secure: secure,
      auth: {
        user: smtpSettings.email,
        pass: smtpSettings.password,
      },
      requireTLS: !secure,
      tls: {
        rejectUnauthorized: false,
      },
    });

    for (const subscription of subscriptions.data) {
      const endDate = new Date(subscription.current_period_end * 1000);
      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Check if this subscription needs a reminder
      if (!reminderDays.includes(daysUntilExpiry)) {
        continue;
      }

      const customer = subscription.customer as Stripe.Customer;
      if (!customer.email) {
        logStep("Skipping subscription - no customer email", { subscriptionId: subscription.id });
        continue;
      }

      // Get user name from Supabase profiles
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("email", customer.email)
        .single();

      const userName = profileData?.full_name || customer.name || customer.email.split("@")[0];

      // Get plan name from the subscription
      const priceId = subscription.items.data[0]?.price?.id;
      const { data: planData } = await supabase
        .from("plan_permissions")
        .select("plan_name")
        .or(`stripe_price_id_monthly.eq.${priceId},stripe_price_id_yearly.eq.${priceId}`)
        .single();

      const planName = planData?.plan_name || "Seu Plano";

      // Format date
      const formattedDate = endDate.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });

      // Prepare email body with variables
      let emailBody = templateData.body
        .replace(/\{\{name\}\}/g, userName)
        .replace(/\{\{plan_name\}\}/g, planName)
        .replace(/\{\{days_remaining\}\}/g, String(daysUntilExpiry))
        .replace(/\{\{date_end\}\}/g, formattedDate)
        .replace(/\{\{renewal_link\}\}/g, `${req.headers.get("origin") || "https://lacasadark.com"}/plans`);

      // Update logo in email body
      emailBody = emailBody.replace(
        /https:\/\/kabnbvnephjifeazaiis\.supabase\.co\/storage\/v1\/object\/public\/avatars\/logo-email\.gif/g,
        logoUrl
      );

      const emailSubject = templateData.subject
        .replace(/\{\{days_remaining\}\}/g, String(daysUntilExpiry))
        .replace(/\{\{plan_name\}\}/g, planName);

      try {
        await transporter.sendMail({
          from: `"${smtpSettings.fromName || "La Casa Dark"}" <${smtpSettings.email}>`,
          to: customer.email,
          subject: emailSubject,
          html: emailBody,
        });

        emailsSent.push(`${customer.email} (${daysUntilExpiry} dias)`);
        logStep("Email sent", { email: customer.email, daysUntilExpiry });

        // Log activity
        await supabase.from("activity_logs").insert({
          action: "renewal_reminder_sent",
          details: {
            email: customer.email,
            days_remaining: daysUntilExpiry,
            plan_name: planName,
            subscription_id: subscription.id,
          },
        });
      } catch (emailError: any) {
        errors.push(`${customer.email}: ${emailError.message}`);
        logStep("Failed to send email", { email: customer.email, error: emailError.message });
      }
    }

    logStep("Function completed", { emailsSent: emailsSent.length, errors: errors.length });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Enviados ${emailsSent.length} lembretes de renovação`,
        emailsSent,
        errors: errors.length > 0 ? errors : undefined,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: any) {
    logStep("ERROR", { message: error.message });
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
