import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting check-new-videos function...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all channels with notifications enabled
    const { data: channels, error: channelsError } = await supabase
      .from("monitored_channels")
      .select("id, user_id, channel_url, channel_name, last_video_id, last_checked")
      .eq("notify_new_videos", true);

    if (channelsError) {
      console.error("Error fetching channels:", channelsError);
      throw channelsError;
    }

    console.log(`Found ${channels?.length || 0} channels with notifications enabled`);

    if (!channels || channels.length === 0) {
      return new Response(JSON.stringify({ message: "No channels to check" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Group channels by user_id to use their API keys
    const channelsByUser: Record<string, typeof channels> = {};
    for (const channel of channels) {
      if (!channelsByUser[channel.user_id]) {
        channelsByUser[channel.user_id] = [];
      }
      channelsByUser[channel.user_id].push(channel);
    }

    let totalNewVideos = 0;

    // Process each user's channels
    for (const [userId, userChannels] of Object.entries(channelsByUser)) {
      // Get user's YouTube API key and check frequency preference
      const { data: apiSettings, error: apiError } = await supabase
        .from("user_api_settings")
        .select("youtube_api_key, video_check_frequency")
        .eq("user_id", userId)
        .maybeSingle();

      if (apiError || !apiSettings?.youtube_api_key) {
        console.log(`User ${userId} has no YouTube API key, skipping...`);
        continue;
      }

      const apiKey = apiSettings.youtube_api_key;
      const checkFrequencyMinutes = parseInt(apiSettings.video_check_frequency || "60", 10);

      // Process each channel for this user
      for (const channel of userChannels) {
        try {
          // Check if enough time has passed since last check based on user's frequency preference
          if (channel.last_checked) {
            const lastChecked = new Date(channel.last_checked);
            const now = new Date();
            const minutesSinceLastCheck = (now.getTime() - lastChecked.getTime()) / (1000 * 60);
            
            if (minutesSinceLastCheck < checkFrequencyMinutes) {
              console.log(`Skipping ${channel.channel_name}: checked ${Math.round(minutesSinceLastCheck)} min ago (frequency: ${checkFrequencyMinutes} min)`);
              continue;
            }
          }

          console.log(`Checking channel: ${channel.channel_name} (${channel.id})`);

          // Extract channel ID from URL
          const channelId = await getChannelId(channel.channel_url, apiKey);
          if (!channelId) {
            console.log(`Could not get channel ID for: ${channel.channel_url}`);
            continue;
          }

          // Fetch latest videos from channel
          const videos = await fetchLatestVideos(channelId, apiKey);
          if (!videos || videos.length === 0) {
            console.log(`No videos found for channel: ${channel.channel_name}`);
            continue;
          }

          // Check for new videos
          const newVideos = [];
          for (const video of videos) {
            // If this is the first check or video is newer than last saved
            if (!channel.last_video_id || video.videoId !== channel.last_video_id) {
              // Check if we already notified about this video
              const { data: existing } = await supabase
                .from("video_notifications")
                .select("id")
                .eq("user_id", userId)
                .eq("video_id", video.videoId)
                .maybeSingle();

              if (!existing) {
                newVideos.push(video);
              }
            } else {
              // We've reached videos we've already seen
              break;
            }
          }

          if (newVideos.length > 0) {
            console.log(`Found ${newVideos.length} new videos for ${channel.channel_name}`);

            // Insert notifications for new videos
            const notifications = newVideos.map((video) => ({
              user_id: userId,
              channel_id: channel.id,
              video_id: video.videoId,
              video_url: `https://www.youtube.com/watch?v=${video.videoId}`,
              video_title: video.title,
              thumbnail_url: video.thumbnail,
              published_at: video.publishedAt,
              is_read: false,
            }));

            const { error: insertError } = await supabase
              .from("video_notifications")
              .insert(notifications);

            if (insertError) {
              console.error("Error inserting notifications:", insertError);
            } else {
              totalNewVideos += newVideos.length;
            }

            // Update last_video_id with the most recent video
            await supabase
              .from("monitored_channels")
              .update({ last_video_id: videos[0].videoId, last_checked: new Date().toISOString() })
              .eq("id", channel.id);
          } else {
            // Just update last_checked
            await supabase
              .from("monitored_channels")
              .update({ last_checked: new Date().toISOString() })
              .eq("id", channel.id);
          }
        } catch (channelError) {
          console.error(`Error processing channel ${channel.id}:`, channelError);
        }
      }
    }

    console.log(`Check completed. Total new videos found: ${totalNewVideos}`);

    return new Response(
      JSON.stringify({
        success: true,
        channelsChecked: channels.length,
        newVideosFound: totalNewVideos,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: unknown) {
    console.error("Error in check-new-videos:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function getChannelId(channelUrl: string, apiKey: string): Promise<string | null> {
  const decodedUrl = decodeURIComponent(channelUrl);

  // Handle different URL formats
  if (decodedUrl.includes("/channel/")) {
    const match = decodedUrl.match(/\/channel\/([a-zA-Z0-9_-]+)/);
    if (match) return match[1];
  }

  let channelHandle = "";
  if (decodedUrl.includes("/@")) {
    const match = decodedUrl.match(/@([^\/\?]+)/);
    if (match) channelHandle = match[1];
  } else if (decodedUrl.includes("/user/")) {
    const match = decodedUrl.match(/\/user\/([^\/\?]+)/);
    if (match) channelHandle = match[1];
  } else if (decodedUrl.includes("/c/")) {
    const match = decodedUrl.match(/\/c\/([^\/\?]+)/);
    if (match) channelHandle = match[1];
  }

  if (channelHandle) {
    // Try forHandle first
    const handleUrl = `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(channelHandle)}&key=${apiKey}`;
    const handleResponse = await fetch(handleUrl);
    const handleData = await handleResponse.json();

    if (handleData.items && handleData.items.length > 0) {
      return handleData.items[0].id;
    }

    // Fallback to search
    const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(channelHandle)}&maxResults=1&key=${apiKey}`;
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (searchData.items && searchData.items.length > 0) {
      return searchData.items[0].snippet.channelId;
    }
  }

  return null;
}

async function fetchLatestVideos(
  channelId: string,
  apiKey: string
): Promise<Array<{ videoId: string; title: string; thumbnail: string; publishedAt: string }>> {
  // Get channel's uploads playlist
  const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${channelId}&key=${apiKey}`;
  const channelResponse = await fetch(channelUrl);
  const channelData = await channelResponse.json();

  if (!channelData.items || channelData.items.length === 0) {
    return [];
  }

  const uploadsPlaylistId = channelData.items[0].contentDetails.relatedPlaylists.uploads;

  // Get latest videos from uploads playlist
  const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=10&key=${apiKey}`;
  const playlistResponse = await fetch(playlistUrl);
  const playlistData = await playlistResponse.json();

  if (!playlistData.items) {
    return [];
  }

  return playlistData.items.map((item: any) => ({
    videoId: item.snippet.resourceId.videoId,
    title: item.snippet.title,
    thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || "",
    publishedAt: item.snippet.publishedAt,
  }));
}
