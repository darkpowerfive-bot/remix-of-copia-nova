import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const { channelUrl, youtubeApiKey } = await req.json();

    if (!youtubeApiKey) {
      return new Response(
        JSON.stringify({ error: "YouTube API key is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!channelUrl) {
      return new Response(
        JSON.stringify({ error: "Channel URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Fetching analytics for channel:", channelUrl);

    // Decode URL to handle encoded characters
    const decodedUrl = decodeURIComponent(channelUrl);

    // Extract channel ID from URL
    let channelId = "";
    let channelHandle = "";

    if (decodedUrl.includes("/channel/")) {
      const match = decodedUrl.match(/\/channel\/([a-zA-Z0-9_-]+)/);
      if (match) channelId = match[1];
    } else if (decodedUrl.includes("/@")) {
      const match = decodedUrl.match(/@([^\/\?]+)/);
      if (match) channelHandle = match[1];
    } else if (decodedUrl.includes("/user/")) {
      const match = decodedUrl.match(/\/user\/([^\/\?]+)/);
      if (match) channelHandle = match[1];
    } else if (decodedUrl.includes("/c/")) {
      const match = decodedUrl.match(/\/c\/([^\/\?]+)/);
      if (match) channelHandle = match[1];
    }

    // Get channel ID from handle if needed
    if (channelHandle && !channelId) {
      const handleUrl = `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(channelHandle)}&key=${youtubeApiKey}`;
      const handleResponse = await fetch(handleUrl);
      const handleData = await handleResponse.json();

      if (handleData.items && handleData.items.length > 0) {
        channelId = handleData.items[0].id;
      } else {
        // Fallback to search
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(channelHandle)}&maxResults=1&key=${youtubeApiKey}`;
        const searchResponse = await fetch(searchUrl);
        const searchData = await searchResponse.json();

        if (searchData.items && searchData.items.length > 0) {
          channelId = searchData.items[0].snippet.channelId;
        }
      }
    }

    if (!channelId) {
      return new Response(
        JSON.stringify({ error: "Could not find channel ID" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Found channel ID:", channelId);

    // Fetch channel statistics
    const channelStatsUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet,brandingSettings&id=${channelId}&key=${youtubeApiKey}`;
    const channelStatsResponse = await fetch(channelStatsUrl);
    const channelStatsData = await channelStatsResponse.json();

    if (!channelStatsData.items || channelStatsData.items.length === 0) {
      return new Response(
        JSON.stringify({ error: "Channel not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const channel = channelStatsData.items[0];
    const stats = channel.statistics;

    // Get channel's uploads playlist
    const uploadsPlaylistId = `UU${channelId.substring(2)}`; // Convert channel ID to uploads playlist ID

    // Fetch ALL videos from the channel (paginated)
    let allVideoIds: string[] = [];
    let nextPageToken: string | undefined = undefined;
    let pageCount = 0;
    const maxPages = 10; // Up to 500 videos total

    while (pageCount < maxPages) {
      const paginatedUrl: string = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50${nextPageToken ? `&pageToken=${nextPageToken}` : ''}&key=${youtubeApiKey}`;
      const paginatedResponse: Response = await fetch(paginatedUrl);
      const paginatedData: any = await paginatedResponse.json();

      if (paginatedData.items && paginatedData.items.length > 0) {
        const videoIds = paginatedData.items.map((item: any) => item.snippet.resourceId.videoId);
        allVideoIds = [...allVideoIds, ...videoIds];
      }

      nextPageToken = paginatedData.nextPageToken;
      pageCount++;
      
      if (!nextPageToken) break;
    }

    console.log(`Fetched ${allVideoIds.length} video IDs from channel`);

    let recentVideos: any[] = [];
    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let videoStats: any[] = [];
    let allVideoStats: any[] = [];

    // Process videos in batches of 50 (API limit)
    const batchSize = 50;
    for (let i = 0; i < allVideoIds.length; i += batchSize) {
      const batchIds = allVideoIds.slice(i, i + batchSize).join(",");
      
      const videosStatsUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${batchIds}&key=${youtubeApiKey}`;
      const videosStatsResponse = await fetch(videosStatsUrl);
      const videosStatsData = await videosStatsResponse.json();

      if (videosStatsData.items) {
        const batchStats = videosStatsData.items.map((video: any) => {
          const views = parseInt(video.statistics.viewCount || "0", 10);
          const likes = parseInt(video.statistics.likeCount || "0", 10);
          const comments = parseInt(video.statistics.commentCount || "0", 10);

          return {
            videoId: video.id,
            title: video.snippet.title,
            thumbnail: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.default?.url,
            publishedAt: video.snippet.publishedAt,
            views,
            likes,
            comments,
            duration: video.contentDetails?.duration,
            engagementRate: views > 0 ? ((likes + comments) / views * 100).toFixed(2) : "0",
          };
        });
        allVideoStats = [...allVideoStats, ...batchStats];
      }
    }

    // Calculate totals from first 50 videos (recent) for recent metrics
    const recentVideoStats = allVideoStats.slice(0, 50);
    recentVideoStats.forEach((video: any) => {
      totalViews += video.views;
      totalLikes += video.likes;
      totalComments += video.comments;
    });
    videoStats = recentVideoStats;

    // Sort ALL videos by views for top videos (descending) - this gets the true most viewed
    recentVideos = [...allVideoStats].sort((a, b) => b.views - a.views);
    
    console.log(`Total videos analyzed: ${allVideoStats.length}`);
    console.log(`Top 5 most viewed: ${recentVideos.slice(0, 5).map((v: any) => `${v.title} (${v.views})`).join(', ')}`);

    // Get current month videos count
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const currentMonthVideos = allVideoStats.filter((video: any) => {
      const publishedDate = new Date(video.publishedAt);
      const videoMonthKey = `${publishedDate.getFullYear()}-${String(publishedDate.getMonth() + 1).padStart(2, "0")}`;
      return videoMonthKey === currentMonthKey;
    });

    // Calculate averages
    const videoCount = videoStats.length || 1;
    const avgViewsPerVideo = Math.round(totalViews / videoCount);
    const avgLikesPerVideo = Math.round(totalLikes / videoCount);
    const avgCommentsPerVideo = Math.round(totalComments / videoCount);
    const avgEngagementRate = totalViews > 0 ? ((totalLikes + totalComments) / totalViews * 100).toFixed(2) : "0";

    // Estimate RPM and earnings (YouTube API doesn't provide real monetization data)
    // Average RPM varies: $1-3 for general content, $3-8 for finance/tech, $0.5-2 for entertainment
    // Using a conservative estimate of $2.50 per 1000 views
    const estimatedRPM = 2.50;
    
    // Calculate monthly average views (based on recent analyzed videos)
    const monthlyViewsEstimate = videoStats.length > 0 ? totalViews : 0;
    const estimatedMonthlyEarnings = (monthlyViewsEstimate / 1000) * estimatedRPM;
    
    // Total earnings based on monthly estimate (NOT total lifetime views)
    const estimatedTotalEarnings = estimatedMonthlyEarnings;

    // Group ALL videos by month for trends
    const monthlyData: Record<string, { views: number; videos: number; likes: number }> = {};
    allVideoStats.forEach((video: any) => {
      const date = new Date(video.publishedAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { views: 0, videos: 0, likes: 0 };
      }
      monthlyData[monthKey].views += video.views;
      monthlyData[monthKey].videos += 1;
      monthlyData[monthKey].likes += video.likes;
    });

    // Convert to array for charts
    const trendsData = Object.entries(monthlyData)
      .map(([month, data]) => ({
        month,
        views: data.views,
        videos: data.videos,
        likes: data.likes,
        avgViews: Math.round(data.views / data.videos),
      }))
      .sort((a, b) => a.month.localeCompare(b.month));

    // Log top videos for debugging
    console.log("Top videos count:", recentVideos.length);
    if (recentVideos.length > 0) {
      console.log("Top video:", recentVideos[0].title, "with", recentVideos[0].views, "views");
    }

    const result = {
      channel: {
        id: channelId,
        name: channel.snippet.title,
        description: channel.snippet.description,
        customUrl: channel.snippet.customUrl,
        thumbnail: channel.snippet.thumbnails?.high?.url || channel.snippet.thumbnails?.default?.url,
        banner: channel.brandingSettings?.image?.bannerExternalUrl,
        country: channel.snippet.country,
        publishedAt: channel.snippet.publishedAt,
      },
      statistics: {
        subscribers: parseInt(stats.subscriberCount || "0", 10),
        totalViews: parseInt(stats.viewCount || "0", 10),
        totalVideos: parseInt(stats.videoCount || "0", 10),
        hiddenSubscriberCount: stats.hiddenSubscriberCount || false,
      },
      recentMetrics: {
        analyzedVideos: videoCount,
        totalViewsRecent: totalViews,
        avgViewsPerVideo,
        avgLikesPerVideo,
        avgCommentsPerVideo,
        avgEngagementRate: parseFloat(avgEngagementRate),
      },
      monetization: {
        estimatedRPM,
        estimatedTotalEarnings: Math.round(estimatedTotalEarnings),
        estimatedMonthlyEarnings: Math.round(estimatedMonthlyEarnings),
        disclaimer: "Valores estimados baseados em RPM médio de mercado. Dados reais de monetização requerem acesso ao YouTube Studio.",
      },
      topVideos: recentVideos.slice(0, 10),
      trendsData,
      allVideos: allVideoStats,
      currentMonth: {
        key: currentMonthKey,
        videosCount: currentMonthVideos.length,
        views: currentMonthVideos.reduce((sum: number, v: any) => sum + v.views, 0),
        likes: currentMonthVideos.reduce((sum: number, v: any) => sum + v.likes, 0),
      },
    };

    console.log("Analytics fetched successfully");

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error fetching YouTube analytics:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
