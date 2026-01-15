import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Generate a hash from visitor info for unique counting
function generateVisitorHash(ip: string, userAgent: string): string {
  const data = `${ip}-${userAgent}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { pagePath, articleId } = await req.json();

    if (!pagePath) {
      return new Response(
        JSON.stringify({ error: "pagePath is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get visitor info
    const ip = req.headers.get("cf-connecting-ip") || 
               req.headers.get("x-forwarded-for") || 
               req.headers.get("x-real-ip") || 
               "unknown";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const referrer = req.headers.get("referer") || null;

    const visitorHash = generateVisitorHash(ip, userAgent);
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    console.log(`[TrackView] Path: ${pagePath}, Article: ${articleId || 'none'}, Visitor: ${visitorHash}`);

    // Try to insert (unique constraint will prevent duplicates for same visitor/day)
    const { error: insertError } = await supabase
      .from("blog_page_views")
      .insert({
        article_id: articleId || null,
        page_path: pagePath,
        visitor_hash: visitorHash,
        user_agent: userAgent.slice(0, 500),
        referrer: referrer?.slice(0, 500) || null,
        view_date: today,
      });

    // Ignore duplicate key errors (visitor already viewed today)
    if (insertError && !insertError.message.includes("duplicate key")) {
      console.error("[TrackView] Insert error:", insertError);
      throw insertError;
    }

    // Update article view_count if articleId provided
    if (articleId) {
      // Count all views for this article
      const { count } = await supabase
        .from("blog_page_views")
        .select("*", { count: "exact", head: true })
        .eq("article_id", articleId);

      console.log(`[TrackView] Article ${articleId} total views: ${count}`);

      const { error: updateError } = await supabase
        .from("blog_articles")
        .update({ view_count: count || 0 })
        .eq("id", articleId);

      if (updateError) {
        console.error("[TrackView] Update view_count error:", updateError);
      }
    }

    return new Response(
      JSON.stringify({ success: true, tracked: !insertError }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[TrackView] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
