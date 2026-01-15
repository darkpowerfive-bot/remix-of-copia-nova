import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

// Map Stripe events to email template types
const EVENT_TO_TEMPLATE: Record<string, string> = {
  "checkout.session.completed": "payment_confirmation",
  "customer.subscription.created": "plan_start",
  "invoice.payment_succeeded": "plan_renewal",
  "customer.subscription.deleted": "plan_cancellation",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
    apiVersion: "2025-08-27.basil",
  });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    const body = await req.text();
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new Error("STRIPE_WEBHOOK_SECRET not configured");
    }

    // Verify the webhook signature
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    logStep("Event received", { type: event.type, id: event.id });

    // Get the template type for this event
    const templateType = EVENT_TO_TEMPLATE[event.type];
    if (!templateType) {
      logStep("Event type not mapped to template, skipping", { type: event.type });
      return new Response(JSON.stringify({ received: true, skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Extract customer email and other data based on event type
    let customerEmail: string | null = null;
    let customerName: string | null = null;
    let planName: string | null = null;
    let amount: number | null = null;
    let currency: string | null = null;
    let subscriptionEnd: string | null = null;

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      customerEmail = session.customer_email;
      
      if (session.customer && !customerEmail) {
        const customer = await stripe.customers.retrieve(session.customer as string);
        if (!customer.deleted) {
          customerEmail = customer.email;
          customerName = customer.name;
        }
      }
      
      amount = session.amount_total ? session.amount_total / 100 : null;
      currency = session.currency?.toUpperCase();
      
      // Get plan name from subscription if available
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const priceId = subscription.items.data[0]?.price.id;
        
        // Fetch plan name from database
        const { data: planData } = await supabaseAdmin
          .from("plan_permissions")
          .select("plan_name")
          .eq("stripe_price_id", priceId)
          .single();
        
        planName = planData?.plan_name || "Plano Premium";
      }
    } else if (event.type === "customer.subscription.created") {
      const subscription = event.data.object as Stripe.Subscription;
      
      if (subscription.customer) {
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if (!customer.deleted) {
          customerEmail = customer.email;
          customerName = customer.name;
        }
      }
      
      const priceId = subscription.items.data[0]?.price.id;
      const price = subscription.items.data[0]?.price;
      amount = price?.unit_amount ? price.unit_amount / 100 : null;
      currency = price?.currency?.toUpperCase();
      subscriptionEnd = new Date(subscription.current_period_end * 1000).toLocaleDateString("pt-BR");
      
      // Fetch plan name from database
      const { data: planData } = await supabaseAdmin
        .from("plan_permissions")
        .select("plan_name")
        .eq("stripe_price_id", priceId)
        .single();
      
      planName = planData?.plan_name || "Plano Premium";
    } else if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      
      // Only process renewal invoices (not the first payment)
      if (invoice.billing_reason !== "subscription_cycle") {
        logStep("Not a renewal invoice, skipping", { reason: invoice.billing_reason });
        return new Response(JSON.stringify({ received: true, skipped: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }
      
      customerEmail = invoice.customer_email;
      
      if (invoice.customer && !customerEmail) {
        const customer = await stripe.customers.retrieve(invoice.customer as string);
        if (!customer.deleted) {
          customerEmail = customer.email;
          customerName = customer.name;
        }
      }
      
      amount = invoice.amount_paid ? invoice.amount_paid / 100 : null;
      currency = invoice.currency?.toUpperCase();
      
      // Get subscription end date
      if (invoice.subscription) {
        const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
        subscriptionEnd = new Date(subscription.current_period_end * 1000).toLocaleDateString("pt-BR");
        
        const priceId = subscription.items.data[0]?.price.id;
        const { data: planData } = await supabaseAdmin
          .from("plan_permissions")
          .select("plan_name")
          .eq("stripe_price_id", priceId)
          .single();
        
        planName = planData?.plan_name || "Plano Premium";
      }
    } else if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object as Stripe.Subscription;
      
      if (subscription.customer) {
        const customer = await stripe.customers.retrieve(subscription.customer as string);
        if (!customer.deleted) {
          customerEmail = customer.email;
          customerName = customer.name;
        }
      }
      
      const priceId = subscription.items.data[0]?.price.id;
      
      // Fetch plan name from database
      const { data: planData } = await supabaseAdmin
        .from("plan_permissions")
        .select("plan_name")
        .eq("stripe_price_id", priceId)
        .single();
      
      planName = planData?.plan_name || "Plano Premium";
    }

    if (!customerEmail) {
      logStep("No customer email found, skipping email", { eventType: event.type });
      return new Response(JSON.stringify({ received: true, skipped: true, reason: "no_email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    logStep("Customer data extracted", { email: customerEmail, name: customerName, plan: planName });

    // Fetch the email template from database
    const { data: template, error: templateError } = await supabaseAdmin
      .from("email_templates")
      .select("*")
      .eq("template_type", templateType)
      .eq("is_active", true)
      .single();

    if (templateError || !template) {
      logStep("Template not found or inactive", { templateType, error: templateError?.message });
      return new Response(JSON.stringify({ received: true, skipped: true, reason: "no_template" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Fetch SMTP settings
    const { data: smtpData } = await supabaseAdmin
      .from("admin_settings")
      .select("value")
      .eq("key", "smtp_settings")
      .single();

    if (!smtpData?.value) {
      logStep("SMTP settings not configured");
      return new Response(JSON.stringify({ received: true, skipped: true, reason: "no_smtp" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const smtpSettings = smtpData.value as {
      host: string;
      port: number;
      user: string;
      pass: string;
      from_email: string;
      from_name: string;
    };

    // Replace template variables
    let emailSubject = template.subject;
    let emailBody = template.body;

    const formattedAmount = amount ? `R$ ${amount.toFixed(2).replace(".", ",")}` : "N/A";
    const formattedPlanName = planName || "Premium";
    
    const variables: Record<string, string> = {
      "{{nome}}": customerName || customerEmail.split("@")[0],
      "{{name}}": customerName || customerEmail.split("@")[0],
      "{{email}}": customerEmail,
      "{{plano}}": formattedPlanName,
      "{{plan_name}}": formattedPlanName,
      "{{valor}}": formattedAmount,
      "{{amount}}": formattedAmount,
      "{{data_renovacao}}": subscriptionEnd || new Date().toLocaleDateString("pt-BR"),
      "{{data_expiracao}}": subscriptionEnd || new Date().toLocaleDateString("pt-BR"),
      "{{data}}": new Date().toLocaleDateString("pt-BR"),
    };

    for (const [key, value] of Object.entries(variables)) {
      emailSubject = emailSubject.replace(new RegExp(key, "g"), value);
      emailBody = emailBody.replace(new RegExp(key, "g"), value);
    }

    // Send email using SMTP via fetch to avoid import issues
    const emailPayload = {
      host: smtpSettings.host,
      port: smtpSettings.port,
      user: smtpSettings.user,
      pass: smtpSettings.pass,
      from: `"${smtpSettings.from_name}" <${smtpSettings.from_email}>`,
      to: customerEmail,
      subject: emailSubject,
      html: emailBody,
    };

    // Use the existing send-test-email function approach with direct SMTP
    const smtpResponse = await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/send-template-test`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
      },
      body: JSON.stringify({
        to: customerEmail,
        subject: emailSubject,
        html: emailBody,
      }),
    });

    if (!smtpResponse.ok) {
      const errorData = await smtpResponse.json();
      logStep("Error sending email", { error: errorData });
      throw new Error(`Failed to send email: ${JSON.stringify(errorData)}`);
    }
    
    logStep("Email sent successfully", { to: customerEmail, template: templateType });

    // Update user role if this is a new subscription
    if (event.type === "customer.subscription.created" || event.type === "checkout.session.completed") {
      // Find user by email
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", customerEmail)
        .single();

      if (profile) {
        // Update user role to 'pro'
        await supabaseAdmin
          .from("user_roles")
          .upsert(
            { user_id: profile.id, role: "pro" },
            { onConflict: "user_id" }
          );
        
        logStep("User role updated to pro", { userId: profile.id });
      }
    }

    // If subscription is cancelled, downgrade user role
    if (event.type === "customer.subscription.deleted") {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("email", customerEmail)
        .single();

      if (profile) {
        await supabaseAdmin
          .from("user_roles")
          .upsert(
            { user_id: profile.id, role: "free" },
            { onConflict: "user_id" }
          );
        
        logStep("User role downgraded to free", { userId: profile.id });
      }
    }

    return new Response(JSON.stringify({ received: true, processed: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR in stripe-webhook", { message: errorMessage });
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
