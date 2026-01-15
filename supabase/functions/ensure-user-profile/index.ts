import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !anonKey || !serviceRoleKey) {
      return new Response(
        JSON.stringify({ error: "Missing backend configuration" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        },
      );
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // User-scoped client (to read the user from the JWT)
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const user = userData.user;

    // Service-role client (to write regardless of RLS)
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const fullName =
      (user.user_metadata?.full_name as string | undefined) ||
      (user.user_metadata?.name as string | undefined) ||
      user.email ||
      null;

    const avatarUrl =
      (user.user_metadata?.avatar_url as string | undefined) ||
      (user.user_metadata?.picture as string | undefined) ||
      null;

    // Check if profile exists first
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id, status, full_name")
      .eq("id", user.id)
      .maybeSingle();

    let profileError = null;
    
    if (!existingProfile) {
      // Create new profile with pending status
      const { error } = await adminClient
        .from("profiles")
        .insert({
          id: user.id,
          email: user.email,
          full_name: fullName,
          avatar_url: avatarUrl,
          status: "pending",
        });
      profileError = error;
      
      // Notify admins about new Google signup
      if (!error) {
        try {
          await fetch(`${supabaseUrl}/functions/v1/send-pending-email`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({ email: user.email, fullName }),
          });
          
          await fetch(`${supabaseUrl}/functions/v1/send-admin-notification`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({ 
              userEmail: user.email, 
              userName: fullName,
              userWhatsapp: null 
            }),
          });
        } catch (notifyError) {
          console.error("Error sending notifications:", notifyError);
        }
      }
    } else {
      // Update existing profile metadata but don't change status
      const { error } = await adminClient
        .from("profiles")
        .update({
          email: user.email,
          full_name: fullName || existingProfile.full_name,
          avatar_url: avatarUrl,
        })
        .eq("id", user.id);
      profileError = error;
    }

    if (profileError) {
      console.error("ensure-user-profile: profile upsert error", profileError);
      return new Response(JSON.stringify({ error: "Failed to ensure profile" }), {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Ensure user has at least one role row
    const { data: existingRole } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    let createdRole = false;
    if (!existingRole) {
      const { error: roleError } = await adminClient
        .from("user_roles")
        .insert({ user_id: user.id, role: "free" });

      if (roleError) {
        // Don't block login if role insert races with another request
        console.error("ensure-user-profile: role insert error", roleError);
      } else {
        createdRole = true;
      }
    }

    return new Response(
      JSON.stringify({ ok: true, ensured: true, createdRole }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      },
    );
  } catch (error) {
    console.error("ensure-user-profile: unexpected error", error);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
