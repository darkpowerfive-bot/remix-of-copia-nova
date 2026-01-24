import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Fetch subtitles using DownSub API
async function fetchFromDownSub(videoUrl: string): Promise<{
  transcription: string;
  language: string;
  hasSubtitles: boolean;
  videoDetails: any;
}> {
  const downsubApiKey = Deno.env.get("DOWNSUB_API_KEY");
  
  if (!downsubApiKey) {
    console.log("DOWNSUB_API_KEY not configured");
    throw new Error("DownSub API key not configured");
  }
  
  console.log("Fetching subtitles from DownSub API for:", videoUrl);
  
  const response = await fetch("https://api.downsub.com/download", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${downsubApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: videoUrl }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error("DownSub API error:", response.status, errorText);
    
    if (response.status === 401) {
      throw new Error("DownSub API: Chave API inválida");
    } else if (response.status === 403) {
      throw new Error("DownSub API: Limite de créditos excedido");
    } else if (response.status === 429) {
      throw new Error("DownSub API: Muitas requisições, tente novamente mais tarde");
    }
    
    throw new Error(`DownSub API error: ${response.status}`);
  }
  
  const data = await response.json();
  console.log("DownSub response state:", data.data?.state);
  
  if (data.status !== "success" || !data.data) {
    throw new Error("DownSub API returned invalid response");
  }
  
  const result = data.data;
  
  // Extract video details from DownSub response
  const videoDetails = {
    title: result.title || "",
    description: result.metadata?.description || "",
    channelTitle: result.metadata?.author || "",
    channelId: result.metadata?.channelId || "",
    publishedAt: result.metadata?.publishDate || "",
    daysAgo: result.metadata?.publishDate 
      ? Math.floor((Date.now() - new Date(result.metadata.publishDate).getTime()) / (1000 * 60 * 60 * 24))
      : 0,
    thumbnail: result.thumbnail || result.metadata?.thumbnail || "",
    tags: result.metadata?.keywords || [],
    categoryId: result.metadata?.category || "",
    views: parseInt(result.metadata?.viewCount || "0"),
    likes: 0,
    comments: 0,
    duration: parseInt(result.duration || "0"),
    durationFormatted: "",
  };
  
  console.log("Video details from DownSub:", videoDetails.title);
  
  // Check if subtitles are available
  if (result.state !== "subtitles_found" || !result.subtitles || result.subtitles.length === 0) {
    console.log("No subtitles found in DownSub response");
    return {
      transcription: "",
      language: "none",
      hasSubtitles: false,
      videoDetails,
    };
  }
  
  console.log("Found subtitles:", result.subtitles.length, "languages");
  
  // Prefer Portuguese, then English, then first available
  let selectedSubtitle = result.subtitles.find((s: any) => 
    s.language?.toLowerCase().includes("portuguese") || 
    s.language?.toLowerCase().includes("português")
  );
  
  if (!selectedSubtitle) {
    selectedSubtitle = result.subtitles.find((s: any) => 
      s.language?.toLowerCase().includes("english") ||
      s.language?.toLowerCase().includes("inglês")
    );
  }
  
  if (!selectedSubtitle) {
    selectedSubtitle = result.subtitles[0];
  }
  
  console.log("Selected subtitle language:", selectedSubtitle.language);
  
  // Find the TXT format (plain text) for easy reading
  const txtFormat = selectedSubtitle.formats?.find((f: any) => f.format === "txt");
  const srtFormat = selectedSubtitle.formats?.find((f: any) => f.format === "srt");
  
  const subtitleUrl = txtFormat?.url || srtFormat?.url;
  
  if (!subtitleUrl) {
    console.log("No subtitle URL found in formats");
    return {
      transcription: "",
      language: selectedSubtitle.language,
      hasSubtitles: false,
      videoDetails,
    };
  }
  
  // Fetch the subtitle content
  console.log("Fetching subtitle content from:", subtitleUrl);
  const subtitleResponse = await fetch(subtitleUrl);
  
  if (!subtitleResponse.ok) {
    console.error("Failed to fetch subtitle content:", subtitleResponse.status);
    return {
      transcription: "",
      language: selectedSubtitle.language,
      hasSubtitles: false,
      videoDetails,
    };
  }
  
  let transcription = await subtitleResponse.text();
  
  // If it's SRT format, clean it up (remove timestamps and numbers)
  if (srtFormat && !txtFormat) {
    transcription = transcription
      .replace(/^\d+\s*$/gm, '') // Remove sequence numbers
      .replace(/\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}/g, '') // Remove timestamps
      .replace(/\n+/g, ' ') // Replace multiple newlines with space
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }
  
  console.log("Transcription extracted, length:", transcription.length);
  
  return {
    transcription,
    language: selectedSubtitle.language,
    hasSubtitles: true,
    videoDetails,
  };
}

// Fetch video details from YouTube Data API
async function fetchVideoDetailsFromAPI(videoId: string): Promise<any> {
  // Try to get YouTube API key from admin settings first, then env
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  
  let youtubeApiKey: string | null = null;
  
  if (supabaseUrl && supabaseKey) {
    try {
      const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.89.0");
      const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
      
      // Try admin_settings first
      const { data: apiSettings } = await supabaseAdmin
        .from("admin_settings")
        .select("value")
        .eq("key", "api_keys")
        .maybeSingle();
      
      if (apiSettings?.value?.youtube) {
        youtubeApiKey = apiSettings.value.youtube;
        console.log("[YouTube API] Using API key from admin_settings");
      }
    } catch (e) {
      console.log("[YouTube API] Could not fetch from admin_settings:", e);
    }
  }
  
  // Fallback to env variable
  if (!youtubeApiKey) {
    youtubeApiKey = Deno.env.get("YOUTUBE_API_KEY") || null;
    if (youtubeApiKey) {
      console.log("[YouTube API] Using API key from env");
    }
  }
  
  if (!youtubeApiKey) {
    console.log("[YouTube API] No API key available");
    return null;
  }
  
  try {
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${youtubeApiKey}`;
    console.log("[YouTube API] Fetching video details...");
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("[YouTube API] Error:", response.status, errorText);
      return null;
    }
    
    const data = await response.json();
    
    if (!data.items || data.items.length === 0) {
      console.log("[YouTube API] Video not found");
      return null;
    }
    
    const item = data.items[0];
    const snippet = item.snippet;
    const stats = item.statistics;
    const contentDetails = item.contentDetails;
    
    // Parse duration (ISO 8601 format like PT1H2M3S)
    let durationSeconds = 0;
    const durationMatch = contentDetails?.duration?.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (durationMatch) {
      durationSeconds = 
        (parseInt(durationMatch[1] || "0") * 3600) +
        (parseInt(durationMatch[2] || "0") * 60) +
        parseInt(durationMatch[3] || "0");
    }
    
    // Calculate days ago
    const publishedAt = new Date(snippet.publishedAt);
    const daysAgo = Math.floor((Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24));
    
    const videoDetails = {
      title: snippet.title || "",
      description: snippet.description || "",
      channelTitle: snippet.channelTitle || "",
      channelId: snippet.channelId || "",
      publishedAt: snippet.publishedAt || "",
      daysAgo,
      thumbnail: snippet.thumbnails?.maxres?.url || 
                 snippet.thumbnails?.high?.url || 
                 snippet.thumbnails?.medium?.url ||
                 `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      tags: snippet.tags || [],
      categoryId: snippet.categoryId || "",
      views: parseInt(stats?.viewCount || "0"),
      likes: parseInt(stats?.likeCount || "0"),
      comments: parseInt(stats?.commentCount || "0"),
      duration: durationSeconds,
      durationFormatted: contentDetails?.duration || "",
    };
    
    console.log("[YouTube API] Video details fetched:", videoDetails.title, "Views:", videoDetails.views);
    return videoDetails;
  } catch (e) {
    console.error("[YouTube API] Fetch error:", e);
    return null;
  }
}

// Fallback: Fetch from YouTube directly (scraping)
async function fetchYouTubeTranscriptFallback(videoId: string): Promise<{ 
  transcription: string; 
  language: string; 
  hasSubtitles: boolean;
  videoDetails: any;
}> {
  console.log("Fallback: Fetching from YouTube directly for:", videoId);
  
  // First, try to get video details from YouTube Data API
  let videoDetails = await fetchVideoDetailsFromAPI(videoId);
  
  // If API failed, try scraping
  if (!videoDetails) {
    console.log("[Scraping] Trying HTML scraping fallback...");
    
    try {
      const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          "Accept-Language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });
      
      if (response.ok) {
        const html = await response.text();
        
        // Try to extract from ytInitialPlayerResponse (more reliable)
        const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/s);
        if (playerResponseMatch) {
          try {
            const playerResponse = JSON.parse(playerResponseMatch[1]);
            const videoData = playerResponse?.videoDetails;
            const microformat = playerResponse?.microformat?.playerMicroformatRenderer;
            
            if (videoData) {
              const publishDate = microformat?.publishDate || microformat?.uploadDate || "";
              const daysAgo = publishDate 
                ? Math.floor((Date.now() - new Date(publishDate).getTime()) / (1000 * 60 * 60 * 24))
                : 0;
              
              videoDetails = {
                title: videoData.title || "",
                description: videoData.shortDescription || "",
                channelTitle: videoData.author || "",
                channelId: videoData.channelId || "",
                publishedAt: publishDate,
                daysAgo,
                thumbnail: videoData.thumbnail?.thumbnails?.slice(-1)[0]?.url || 
                           `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
                tags: videoData.keywords || [],
                categoryId: microformat?.category || "",
                views: parseInt(videoData.viewCount || "0"),
                likes: 0,
                comments: 0,
                duration: parseInt(videoData.lengthSeconds || "0"),
                durationFormatted: "",
              };
              
              console.log("[Scraping] Extracted from ytInitialPlayerResponse:", videoDetails.title, "Views:", videoDetails.views);
            }
          } catch (parseError) {
            console.error("[Scraping] Failed to parse player response:", parseError);
          }
        }
        
        // If still no details, try basic HTML parsing
        if (!videoDetails) {
          const titleMatch = html.match(/<title>([^<]*)<\/title>/);
          const title = titleMatch ? titleMatch[1].replace(' - YouTube', '').trim() : '';
          
          const channelMatch = html.match(/"ownerChannelName":"([^"]+)"/);
          const channelTitle = channelMatch ? channelMatch[1] : '';
          
          const viewsMatch = html.match(/"viewCount":"(\d+)"/);
          const views = viewsMatch ? parseInt(viewsMatch[1]) : 0;
          
          videoDetails = {
            title,
            description: "",
            channelTitle,
            channelId: "",
            publishedAt: "",
            daysAgo: 0,
            thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            tags: [],
            categoryId: "",
            views,
            likes: 0,
            comments: 0,
            duration: 0,
            durationFormatted: "",
          };
          
          console.log("[Scraping] Basic extraction:", videoDetails.title, "Views:", videoDetails.views);
        }
        
        // Try to extract captions
        const captionsMatch = html.match(/ytInitialPlayerResponse\s*=\s*(\{.+?\});/s);
        if (captionsMatch) {
          try {
            const playerResponse = JSON.parse(captionsMatch[1]);
            const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
            
            if (captions && captions.length > 0) {
              // Prefer Portuguese, then English, then first available
              let selectedCaption = captions.find((c: any) => c.languageCode === 'pt' || c.languageCode === 'pt-BR');
              if (!selectedCaption) {
                selectedCaption = captions.find((c: any) => c.languageCode === 'en');
              }
              if (!selectedCaption) {
                selectedCaption = captions[0];
              }
              
              console.log("Selected caption language:", selectedCaption.languageCode);
              
              const captionResponse = await fetch(selectedCaption.baseUrl);
              if (captionResponse.ok) {
                const captionXml = await captionResponse.text();
                const textMatches = captionXml.matchAll(/<text[^>]*>([^<]*)<\/text>/g);
                const texts: string[] = [];
                
                for (const match of textMatches) {
                  let text = match[1]
                    .replace(/&amp;/g, '&')
                    .replace(/&lt;/g, '<')
                    .replace(/&gt;/g, '>')
                    .replace(/&quot;/g, '"')
                    .replace(/&#39;/g, "'")
                    .replace(/&apos;/g, "'")
                    .replace(/\n/g, ' ')
                    .trim();
                  
                  if (text) texts.push(text);
                }
                
                const transcription = texts.join(' ');
                console.log("Transcription extracted, length:", transcription.length);
                
                return {
                  transcription,
                  language: selectedCaption.languageCode,
                  hasSubtitles: true,
                  videoDetails
                };
              }
            }
          } catch (e) {
            console.error("[Scraping] Captions extraction error:", e);
          }
        }
      }
    } catch (scrapingError) {
      console.error("[Scraping] Failed:", scrapingError);
    }
  }
  
  // Return with whatever details we have
  return {
    transcription: "",
    language: "none",
    hasSubtitles: false,
    videoDetails: videoDetails || {
      title: "",
      description: "",
      channelTitle: "",
      channelId: "",
      publishedAt: "",
      daysAgo: 0,
      thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
      tags: [],
      categoryId: "",
      views: 0,
      likes: 0,
      comments: 0,
      duration: 0,
      durationFormatted: "",
    }
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { videoUrl } = await req.json();

    if (!videoUrl) {
      throw new Error("Video URL is required");
    }

    console.log("Processing video URL:", videoUrl);
    
    const videoId = extractVideoId(videoUrl);
    if (!videoId) {
      throw new Error("Invalid YouTube URL. Could not extract video ID.");
    }
    
    console.log("Extracted video ID:", videoId);

    let result;
    
    // Try DownSub API first
    try {
      result = await fetchFromDownSub(videoUrl);
      console.log("DownSub fetch successful");
    } catch (downsubError) {
      console.error("DownSub failed, using fallback:", downsubError);
      // Fallback to YouTube scraping
      result = await fetchYouTubeTranscriptFallback(videoId);
    }

    return new Response(
      JSON.stringify({
        transcription: result.transcription || "",
        language: result.language,
        videoId,
        videoDetails: result.videoDetails,
        hasSubtitles: result.hasSubtitles,
        message: result.hasSubtitles ? null : "Este vídeo não possui legendas disponíveis. Cole a transcrição manualmente.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in transcribe-video:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});