import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all active viral monitoring configs with user API keys
    const { data: configs, error: configError } = await supabase
      .from("viral_monitoring_config")
      .select("*")
      .eq("is_active", true);

    if (configError) {
      console.error("Error fetching configs:", configError);
      throw configError;
    }

    // For each config, get the user's YouTube API key
    const configsWithApiKeys = await Promise.all(
      (configs || []).map(async (config) => {
        const { data: apiSettings } = await supabase
          .from("user_api_settings")
          .select("youtube_api_key")
          .eq("user_id", config.user_id)
          .maybeSingle();

        return {
          user_id: config.user_id,
          niches: config.niches || [],
          viral_threshold: config.viral_threshold || 1000,
          video_types: config.video_types || ["long", "short"],
          country: config.country || "BR",
          youtube_api_key: apiSettings?.youtube_api_key || null,
          notify_whatsapp: config.notify_whatsapp || false,
          notify_email: config.notify_email || false,
        };
      })
    );

    // Filter out configs without API key or without niches
    const validConfigs = configsWithApiKeys.filter(
      (c) => c.youtube_api_key && c.niches.length > 0
    );

    console.log(`Found ${validConfigs.length} valid configs to process`);

    return new Response(
      JSON.stringify({
        success: true,
        configs: validConfigs,
        total: validConfigs.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in get-viral-monitoring-configs:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
