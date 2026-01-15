import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { channelUrl, youtubeApiKey } = await req.json();

    if (!channelUrl) {
      return new Response(
        JSON.stringify({ error: 'URL do canal é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use provided API key or fallback to environment variable
    const apiKey = youtubeApiKey || Deno.env.get('YOUTUBE_API_KEY');
    
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'Chave de API do YouTube não configurada' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Fetching videos for channel:', channelUrl);

    // Decode URL to handle encoded characters (like %C3%A9 for é)
    const decodedUrl = decodeURIComponent(channelUrl);
    console.log('Decoded URL:', decodedUrl);

    // Extract channel ID from URL
    let channelId = '';
    let channelHandle = '';

    // Handle different URL formats
    if (decodedUrl.includes('/channel/')) {
      const match = decodedUrl.match(/\/channel\/([a-zA-Z0-9_-]+)/);
      if (match) channelId = match[1];
    } else if (decodedUrl.includes('/@')) {
      // Extract everything after @ until / or end of string
      const match = decodedUrl.match(/@([^\/\?]+)/);
      if (match) channelHandle = match[1];
    } else if (decodedUrl.includes('/user/')) {
      const match = decodedUrl.match(/\/user\/([^\/\?]+)/);
      if (match) channelHandle = match[1];
    } else if (decodedUrl.includes('/c/')) {
      const match = decodedUrl.match(/\/c\/([^\/\?]+)/);
      if (match) channelHandle = match[1];
    }

    console.log('Extracted handle:', channelHandle);

    // If we have a handle, we need to get the channel ID first using forHandle (more reliable)
    if (channelHandle && !channelId) {
      console.log('Looking up channel ID for handle:', channelHandle);
      
      // First try forHandle which is more accurate
      const handleUrl = `https://www.googleapis.com/youtube/v3/channels?part=id,snippet&forHandle=${encodeURIComponent(channelHandle)}&key=${apiKey}`;
      const handleResponse = await fetch(handleUrl);
      const handleData = await handleResponse.json();
      
      if (handleData.items && handleData.items.length > 0) {
        channelId = handleData.items[0].id;
        console.log('Found channel ID via forHandle:', channelId);
      } else {
        // Fallback to search if forHandle doesn't work
        console.log('forHandle failed, trying search...');
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(channelHandle)}&maxResults=1&key=${apiKey}`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();

        if (searchData.items && searchData.items.length > 0) {
          channelId = searchData.items[0].snippet.channelId;
          console.log('Found channel ID via search:', channelId);
        }
      }
    }

    if (!channelId) {
      // Last resort: try using the URL directly as channel ID
      const urlParts = channelUrl.split('/');
      const lastPart = urlParts[urlParts.length - 1] || urlParts[urlParts.length - 2];
      if (lastPart && lastPart.startsWith('UC')) {
        channelId = lastPart;
      }
    }

    if (!channelId) {
      return new Response(
        JSON.stringify({ error: 'Não foi possível identificar o canal' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Using channel ID:', channelId);

    // Get channel info
    const channelInfoUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&id=${channelId}&key=${apiKey}`;
    const channelInfoResponse = await fetch(channelInfoUrl);
    const channelInfo = await channelInfoResponse.json();

    let channelName = 'Canal';
    let uploadsPlaylistId = '';

    if (channelInfo.items && channelInfo.items.length > 0) {
      channelName = channelInfo.items[0].snippet.title;
      uploadsPlaylistId = channelInfo.items[0].contentDetails?.relatedPlaylists?.uploads;
    }

    console.log('Channel name:', channelName);
    console.log('Uploads playlist:', uploadsPlaylistId);

    // Fetch recent videos from uploads playlist
    let recentVideos: any[] = [];
    if (uploadsPlaylistId) {
      const recentUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=3&key=${apiKey}`;
      const recentResponse = await fetch(recentUrl);
      const recentData = await recentResponse.json();

      if (recentData.items) {
        recentVideos = recentData.items.map((item: any) => ({
          videoId: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          thumbnail: item.snippet.thumbnails?.maxres?.url || 
                     item.snippet.thumbnails?.high?.url || 
                     item.snippet.thumbnails?.medium?.url ||
                     `https://i.ytimg.com/vi/${item.snippet.resourceId.videoId}/maxresdefault.jpg`,
          publishedAt: item.snippet.publishedAt,
          url: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
        }));
      }
    }

    // Get video IDs for statistics
    const recentVideoIds = recentVideos.map((v: any) => v.videoId).join(',');
    
    if (recentVideoIds) {
      const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${recentVideoIds}&key=${apiKey}`;
      const statsResponse = await fetch(statsUrl);
      const statsData = await statsResponse.json();

      if (statsData.items) {
        recentVideos = recentVideos.map((video: any) => {
          const stats = statsData.items.find((s: any) => s.id === video.videoId);
          return {
            ...video,
            views: stats?.statistics?.viewCount || '0',
            likes: stats?.statistics?.likeCount || '0',
          };
        });
      }
    }

    // Search for popular videos from this channel
    const popularUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&order=viewCount&maxResults=3&key=${apiKey}`;
    const popularResponse = await fetch(popularUrl);
    const popularData = await popularResponse.json();

    let popularVideos: any[] = [];
    if (popularData.items) {
      popularVideos = popularData.items.map((item: any) => ({
        videoId: item.id.videoId,
        title: item.snippet.title,
        thumbnail: item.snippet.thumbnails?.high?.url || 
                   `https://i.ytimg.com/vi/${item.id.videoId}/maxresdefault.jpg`,
        publishedAt: item.snippet.publishedAt,
        url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      }));
    }

    // Get statistics for popular videos
    const popularVideoIds = popularVideos.map((v: any) => v.videoId).join(',');
    
    if (popularVideoIds) {
      const statsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${popularVideoIds}&key=${apiKey}`;
      const statsResponse = await fetch(statsUrl);
      const statsData = await statsResponse.json();

      if (statsData.items) {
        popularVideos = popularVideos.map((video: any) => {
          const stats = statsData.items.find((s: any) => s.id === video.videoId);
          return {
            ...video,
            views: stats?.statistics?.viewCount || '0',
            likes: stats?.statistics?.likeCount || '0',
          };
        });
      }
    }

    // Format view counts
    const formatNumber = (num: string) => {
      const n = parseInt(num);
      if (n >= 1000000) return (n / 1000000).toFixed(1).replace('.0', '') + 'M';
      if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K';
      return num;
    };

    recentVideos = recentVideos.map((v: any) => ({
      ...v,
      views: formatNumber(v.views),
      likes: formatNumber(v.likes),
    }));

    popularVideos = popularVideos.map((v: any) => ({
      ...v,
      views: formatNumber(v.views),
      likes: formatNumber(v.likes),
    }));

    console.log('Found', recentVideos.length, 'recent videos and', popularVideos.length, 'popular videos');

    return new Response(
      JSON.stringify({
        channelName,
        channelId,
        recentVideos,
        popularVideos,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Error fetching channel videos:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro ao buscar vídeos do canal';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
