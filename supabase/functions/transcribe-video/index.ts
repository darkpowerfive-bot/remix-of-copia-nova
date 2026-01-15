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

// Fallback: Fetch from YouTube directly
async function fetchYouTubeTranscriptFallback(videoId: string): Promise<{ 
  transcription: string; 
  language: string; 
  hasSubtitles: boolean;
  videoDetails: any;
}> {
  console.log("Fallback: Fetching from YouTube directly for:", videoId);
  
  const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
    headers: {
      "Accept-Language": "en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }
  });
  
  if (!response.ok) {
    console.error("Failed to fetch YouTube page:", response.status);
    return { transcription: "", language: "none", hasSubtitles: false, videoDetails: null };
  }
  
  const html = await response.text();
  
  // Extract basic video details from HTML
  let videoDetails: any = null;
  try {
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
  } catch (e) {
    console.error("Failed to extract video details:", e);
  }
  
  // Extract captions data from ytInitialPlayerResponse
  const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});/);
  if (!playerResponseMatch) {
    console.log("Could not find player response in YouTube page");
    return { transcription: "", language: "none", hasSubtitles: false, videoDetails };
  }
  
  let playerResponse;
  try {
    playerResponse = JSON.parse(playerResponseMatch[1]);
  } catch (e) {
    console.error("Failed to parse player response JSON");
    return { transcription: "", language: "none", hasSubtitles: false, videoDetails };
  }
  
  const captions = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  
  if (!captions || captions.length === 0) {
    console.log("No captions available for this video");
    return { transcription: "", language: "none", hasSubtitles: false, videoDetails };
  }
  
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
  if (!captionResponse.ok) {
    return { transcription: "", language: selectedCaption.languageCode, hasSubtitles: false, videoDetails };
  }
  
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