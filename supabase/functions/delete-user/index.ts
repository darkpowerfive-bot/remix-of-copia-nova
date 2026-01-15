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
        }
      );
    }

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing Authorization" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

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

    // Check if caller is admin
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get the user ID to delete
    const { userId } = await req.json();
    
    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Prevent self-deletion
    if (userId === userData.user.id) {
      return new Response(JSON.stringify({ error: "Cannot delete yourself" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Admin ${userData.user.email} deleting user ${userId}`);

    // Delete all user data from all tables
    const tables = [
      { table: "user_credits", column: "user_id" },
      { table: "credit_transactions", column: "user_id" },
      { table: "credit_usage", column: "user_id" },
      { table: "user_preferences", column: "user_id" },
      { table: "user_api_settings", column: "user_id" },
      { table: "activity_logs", column: "user_id" },
      { table: "analyzed_videos", column: "user_id" },
      { table: "generated_titles", column: "user_id" },
      { table: "generated_images", column: "user_id" },
      { table: "generated_audios", column: "user_id" },
      { table: "generated_scripts", column: "user_id" },
      { table: "scene_prompts", column: "user_id" },
      { table: "saved_prompts", column: "user_id" },
      { table: "folders", column: "user_id" },
      { table: "monitored_channels", column: "user_id" },
      { table: "pinned_videos", column: "user_id" },
      { table: "video_analyses", column: "user_id" },
      { table: "video_notifications", column: "user_id" },
      { table: "viral_library", column: "user_id" },
      { table: "viral_thumbnails", column: "user_id" },
      { table: "reference_thumbnails", column: "user_id" },
      { table: "script_agents", column: "user_id" },
      { table: "agent_files", column: "user_id" },
      { table: "srt_history", column: "user_id" },
      { table: "tags", column: "user_id" },
      { table: "channel_analyses", column: "user_id" },
      { table: "channel_goals", column: "user_id" },
      { table: "saved_analytics_channels", column: "user_id" },
      { table: "batch_generation_history", column: "user_id" },
      { table: "imagefx_monthly_usage", column: "user_id" },
      { table: "user_file_uploads", column: "user_id" },
      { table: "user_roles", column: "user_id" },
      { table: "profiles", column: "id" },
    ];

    // Delete from all tables
    for (const { table, column } of tables) {
      const { error } = await adminClient
        .from(table)
        .delete()
        .eq(column, userId);
      
      if (error) {
        console.log(`Warning: Error deleting from ${table}:`, error.message);
        // Continue with other tables
      }
    }

    // Finally, delete the user from auth.users
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (authDeleteError) {
      console.error("Error deleting auth user:", authDeleteError);
      return new Response(
        JSON.stringify({ error: `Failed to delete auth user: ${authDeleteError.message}` }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`Successfully deleted user ${userId} and all related data`);

    return new Response(
      JSON.stringify({ success: true, message: "User and all data deleted successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("delete-user: unexpected error", error);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});
