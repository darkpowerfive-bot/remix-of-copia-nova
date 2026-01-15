import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ViralVideoPayload {
  user_id: string;
  phone_number?: string;
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

// Anti-blocking configurations
const ANTI_BLOCK_CONFIG = {
  // Minimum delay between messages (in ms)
  MIN_DELAY_MS: 3000,
  // Maximum delay between messages (in ms) - creates random variation
  MAX_DELAY_MS: 8000,
  // Maximum messages per user per day
  DAILY_LIMIT_PER_USER: 20,
  // Maximum messages per hour globally
  HOURLY_GLOBAL_LIMIT: 30,
  // Avoid sending during these hours (local Brazil time - UTC-3)
  QUIET_HOURS_START: 22, // 10 PM
  QUIET_HOURS_END: 7, // 7 AM
};

// Random delay to simulate human behavior
const randomDelay = (minMs: number, maxMs: number): Promise<void> => {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  console.log(`[Anti-Block] Waiting ${delay}ms before next message...`);
  return new Promise((resolve) => setTimeout(resolve, delay));
};

// Check if current time is within quiet hours
const isQuietHours = (): boolean => {
  const now = new Date();
  // Brazil time (UTC-3)
  const brazilHour = (now.getUTCHours() - 3 + 24) % 24;
  
  if (ANTI_BLOCK_CONFIG.QUIET_HOURS_START > ANTI_BLOCK_CONFIG.QUIET_HOURS_END) {
    // Quiet hours span midnight (e.g., 22:00 to 07:00)
    return brazilHour >= ANTI_BLOCK_CONFIG.QUIET_HOURS_START || brazilHour < ANTI_BLOCK_CONFIG.QUIET_HOURS_END;
  }
  return brazilHour >= ANTI_BLOCK_CONFIG.QUIET_HOURS_START && brazilHour < ANTI_BLOCK_CONFIG.QUIET_HOURS_END;
};

// Check daily message limit for user
const checkDailyLimit = async (
  supabase: any,
  userId: string
): Promise<{ allowed: boolean; count: number }> => {
  const today = new Date().toISOString().split("T")[0];
  
  const { data, error } = await supabase
    .from("whatsapp_message_log")
    .select("id")
    .eq("user_id", userId)
    .gte("sent_at", `${today}T00:00:00Z`)
    .lt("sent_at", `${today}T23:59:59Z`);

  if (error) {
    console.log("[Anti-Block] Could not check daily limit, allowing message:", error.message);
    return { allowed: true, count: 0 };
  }

  const count = data?.length || 0;
  const allowed = count < ANTI_BLOCK_CONFIG.DAILY_LIMIT_PER_USER;
  
  console.log(`[Anti-Block] User ${userId} daily count: ${count}/${ANTI_BLOCK_CONFIG.DAILY_LIMIT_PER_USER}`);
  
  return { allowed, count };
};

// Log message sent for rate limiting
const logMessageSent = async (
  supabase: any,
  userId: string,
  videoId: string,
  phoneNumber: string
): Promise<void> => {
  try {
    await supabase.from("whatsapp_message_log").insert({
      user_id: userId,
      video_id: videoId,
      phone_number: phoneNumber,
      sent_at: new Date().toISOString(),
    });
  } catch (error) {
    console.log("[Anti-Block] Could not log message:", error);
  }
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
    const EVOLUTION_INSTANCE_NAME = Deno.env.get("EVOLUTION_INSTANCE_NAME");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE_NAME) {
      console.error("Missing Evolution API configuration");
      return new Response(
        JSON.stringify({ error: "Evolution API not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const payload = await req.json();
    console.log("Received payload:", JSON.stringify(payload, null, 2));

    // Support single video or array of videos
    const videos: ViralVideoPayload[] = Array.isArray(payload.videos) 
      ? payload.videos 
      : [payload];

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
    const results: { video_id: string; success: boolean; error?: string; skipped?: boolean; limitType?: string }[] = [];

    // QUIET HOURS DISABLED FOR TESTING
    // Check if we're in quiet hours - just log, don't block
    if (isQuietHours()) {
      console.log("[Anti-Block] Currently in quiet hours (22:00-07:00 Brazil time), but TESTING MODE enabled - continuing...");
    }

    let messagesProcessed = 0;

    for (const video of videos) {
      try {
        // Get user's WhatsApp number from profiles if not provided
        let phoneNumber = video.phone_number;
        
        if (!phoneNumber && video.user_id) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("whatsapp")
            .eq("id", video.user_id)
            .single();
          
          phoneNumber = profile?.whatsapp;
        }

        if (!phoneNumber) {
          console.log(`No phone number for user ${video.user_id}, skipping...`);
          results.push({ video_id: video.video_id, success: false, error: "No phone number" });
          continue;
        }

        // Check daily limit for this user
        const { allowed, count } = await checkDailyLimit(supabase, video.user_id);
        if (!allowed) {
          console.log(`[Anti-Block] User ${video.user_id} reached daily limit (${count} messages)`);
          results.push({ 
            video_id: video.video_id, 
            success: false, 
            error: `Daily limit reached (${count}/${ANTI_BLOCK_CONFIG.DAILY_LIMIT_PER_USER})`,
            skipped: true 
          });
          continue;
        }

        // Add random delay between messages (except first one)
        if (messagesProcessed > 0) {
          await randomDelay(ANTI_BLOCK_CONFIG.MIN_DELAY_MS, ANTI_BLOCK_CONFIG.MAX_DELAY_MS);
        }

        // Format phone number (remove non-digits, ensure country code)
        const formattedPhone = phoneNumber.replace(/\D/g, "");
        const phoneWithCode = formattedPhone.startsWith("55") 
          ? formattedPhone 
          : `55${formattedPhone}`;

        // Format viral score for display
        const formatViralScore = (score: number) => {
          if (score >= 10000) return `${(score / 1000).toFixed(1)}k`;
          return score.toLocaleString("pt-BR");
        };

        // Format views for display
        const formatViews = (views: number) => {
          if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
          if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
          return views.toLocaleString("pt-BR");
        };

        // Format hours ago
        const hoursAgo = video.hours_ago ? `${video.hours_ago}h` : "N/A";

        // Create message with emojis and formatting - La Casa Dark Core branding
        const message = `🔥 *ALERTA DE VÍDEO VIRAL!* 🔥

📺 *${video.title}*

📊 *Métricas:*
👁️ Views: ${formatViews(video.views)}
⚡ Score Viral: ${formatViralScore(video.viral_score)} VPH
⏰ Idade: ${hoursAgo}
📁 Nicho: ${video.niche || "Geral"}
📺 Canal: ${video.channel_name}

🔗 ${video.video_url}

👑 *La Casa Dark Core®*
_A infraestrutura por trás de canais dark profissionais_`;

        console.log(`[Anti-Block] Sending message ${messagesProcessed + 1} to ${phoneWithCode}...`);

        // Ensure EVOLUTION_API_URL doesn't have trailing slash
        const baseUrl = EVOLUTION_API_URL.replace(/\/+$/, "");
        // Encode instance name to handle spaces
        const encodedInstance = encodeURIComponent(EVOLUTION_INSTANCE_NAME);

        // Send thumbnail image first if available
        if (video.thumbnail_url) {
          try {
            const imageUrl = `${baseUrl}/message/sendMedia/${encodedInstance}`;
            console.log(`[Thumbnail] Sending thumbnail: ${video.thumbnail_url}`);
            
            const imageResponse = await fetch(imageUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "apikey": EVOLUTION_API_KEY,
              },
              body: JSON.stringify({
                number: phoneWithCode,
                mediatype: "image",
                media: video.thumbnail_url,
                caption: message,
              }),
            });

            const imageData = await imageResponse.json();
            console.log("[Thumbnail] Response:", JSON.stringify(imageData, null, 2));

            if (imageResponse.ok) {
              // Image with caption sent successfully, skip text-only message
              await logMessageSent(supabase, video.user_id, video.video_id, phoneWithCode);
              results.push({ video_id: video.video_id, success: true });
              messagesProcessed++;
              continue;
            } else {
              console.log("[Thumbnail] Failed to send image, falling back to text-only");
            }
          } catch (imgError) {
            console.log("[Thumbnail] Error sending image, falling back to text-only:", imgError);
          }
        }
        
        // Fallback: Send text message via Evolution API (if image failed or no thumbnail)
        const evolutionUrl = `${baseUrl}/message/sendText/${encodedInstance}`;
        
        const response = await fetch(evolutionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": EVOLUTION_API_KEY,
          },
          body: JSON.stringify({
            number: phoneWithCode,
            text: message,
          }),
        });

        const responseData = await response.json();
        console.log("Evolution API response:", JSON.stringify(responseData, null, 2));

        if (!response.ok) {
          throw new Error(responseData.message || "Failed to send WhatsApp message");
        }

        // Log the message for rate limiting
        await logMessageSent(supabase, video.user_id, video.video_id, phoneWithCode);

        results.push({ video_id: video.video_id, success: true });
        messagesProcessed++;

        // Check global hourly limit
        if (messagesProcessed >= ANTI_BLOCK_CONFIG.HOURLY_GLOBAL_LIMIT) {
          console.log(`[Anti-Block] Reached hourly global limit (${messagesProcessed} messages), stopping...`);
          // Add remaining videos as skipped
          const remainingVideos = videos.slice(videos.indexOf(video) + 1);
          for (const remaining of remainingVideos) {
            results.push({
              video_id: remaining.video_id,
              success: false,
              error: "Hourly limit reached",
              skipped: true,
            });
          }
          break;
        }

      } catch (videoError) {
        console.error(`Error processing video ${video.video_id}:`, videoError);
        results.push({ 
          video_id: video.video_id, 
          success: false, 
          error: videoError instanceof Error ? videoError.message : "Unknown error" 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success && !r.skipped).length;
    const skippedCount = results.filter(r => r.skipped).length;

    console.log(`[Anti-Block] Completed: ${successCount} sent, ${errorCount} errors, ${skippedCount} skipped`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        sent: successCount, 
        errors: errorCount,
        skipped: skippedCount,
        results,
        antiBlockInfo: {
          dailyLimitPerUser: ANTI_BLOCK_CONFIG.DAILY_LIMIT_PER_USER,
          hourlyGlobalLimit: ANTI_BLOCK_CONFIG.HOURLY_GLOBAL_LIMIT,
          quietHours: `${ANTI_BLOCK_CONFIG.QUIET_HOURS_START}:00 - ${ANTI_BLOCK_CONFIG.QUIET_HOURS_END}:00 (Brazil)`,
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );

  } catch (error) {
    console.error("Error in send-whatsapp-viral:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Unknown error" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
