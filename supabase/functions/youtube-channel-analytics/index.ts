import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const userId = claimsData.claims.sub;

    let requestedChannelId: string | undefined;
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        requestedChannelId = typeof body?.channelId === 'string' ? body.channelId : undefined;
      } catch {
        // ignore invalid/empty body
      }
    }

    // Get user's YouTube connection (optionally for a specific channel)
    let connectionQuery = supabase
      .from('youtube_connections')
      .select('*')
      .eq('user_id', userId);

    if (requestedChannelId) {
      connectionQuery = connectionQuery.eq('channel_id', requestedChannelId);
    } else {
      connectionQuery = connectionQuery.order('updated_at', { ascending: false }).limit(1);
    }

    const { data: connection, error: connError } = await connectionQuery.maybeSingle();

    if (connError || !connection) {
      return new Response(JSON.stringify({ error: 'YouTube not connected for this channel' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let accessToken = connection.access_token;
    const channelId = connection.channel_id;

    // Check if token is expired and refresh if needed
    if (connection.token_expires_at) {
      const expiresAt = new Date(connection.token_expires_at);
      if (expiresAt <= new Date()) {
        console.log('Token expired, refreshing...');
        
        const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: Deno.env.get('YOUTUBE_CLIENT_ID')!,
            client_secret: Deno.env.get('YOUTUBE_CLIENT_SECRET')!,
            refresh_token: connection.refresh_token,
            grant_type: 'refresh_token'
          })
        });

        if (!refreshResponse.ok) {
          return new Response(JSON.stringify({ error: 'Token expired' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const refreshData = await refreshResponse.json();
        accessToken = refreshData.access_token;

        // Update token in database
        const newExpiry = new Date(Date.now() + refreshData.expires_in * 1000);
        await supabase
          .from('youtube_connections')
          .update({ 
            access_token: accessToken, 
            token_expires_at: newExpiry.toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId);
      }
    }

    console.log('Fetching analytics for channel:', channelId);

    // Fetch channel statistics
    const channelStatsUrl = `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet,contentDetails&id=${channelId}`;
    const channelStatsResponse = await fetch(channelStatsUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!channelStatsResponse.ok) {
      const error = await channelStatsResponse.text();
      console.error('Channel stats failed:', error);
      return new Response(JSON.stringify({ error: 'Failed to fetch channel stats' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const channelStatsData = await channelStatsResponse.json();

    if (!channelStatsData.items || channelStatsData.items.length === 0) {
      return new Response(JSON.stringify({ error: 'Channel not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const channel = channelStatsData.items[0];
    const stats = channel.statistics;

    // Get uploads playlist ID
    const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      return new Response(JSON.stringify({ error: 'No uploads playlist found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch recent uploads (last 20)
    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=20`;
    const playlistResponse = await fetch(playlistUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    let recentVideos: any[] = [];
    let videoStats: any[] = [];

    if (playlistResponse.ok) {
      const playlistData = await playlistResponse.json();

      if (playlistData.items && playlistData.items.length > 0) {
        const videoIds = playlistData.items
          .map((item: any) => item.snippet.resourceId.videoId)
          .join(',');

        // Fetch video statistics
        const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${videoIds}`;
        const videosResponse = await fetch(videosUrl, {
          headers: { 'Authorization': `Bearer ${accessToken}` }
        });

        if (videosResponse.ok) {
          const videosData = await videosResponse.json();

          videoStats = videosData.items.map((video: any) => {
            const views = parseInt(video.statistics.viewCount || '0', 10);
            const likes = parseInt(video.statistics.likeCount || '0', 10);
            const comments = parseInt(video.statistics.commentCount || '0', 10);

            return {
              videoId: video.id,
              title: video.snippet.title,
              thumbnail: video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url,
              publishedAt: video.snippet.publishedAt,
              views,
              likes,
              comments,
              engagementRate: views > 0 ? ((likes + comments) / views * 100).toFixed(2) : '0',
            };
          });

          recentVideos = [...videoStats].sort((a, b) => b.views - a.views);
        }
      }
    }

    // Fetch TOP videos by views (overall channel)
    let topVideosOverall: any[] = [];
    try {
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&maxResults=25&order=viewCount&type=video`;
      const searchResponse = await fetch(searchUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        const ids = (searchData.items || [])
          .map((it: any) => it?.id?.videoId)
          .filter(Boolean)
          .slice(0, 25)
          .join(',');

        if (ids) {
          const topUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet,contentDetails&id=${ids}`;
          const topResp = await fetch(topUrl, {
            headers: { 'Authorization': `Bearer ${accessToken}` }
          });

          if (topResp.ok) {
            const topData = await topResp.json();
            topVideosOverall = (topData.items || [])
              .map((video: any) => {
                const views = parseInt(video.statistics.viewCount || '0', 10);
                const likes = parseInt(video.statistics.likeCount || '0', 10);
                const comments = parseInt(video.statistics.commentCount || '0', 10);
                return {
                  videoId: video.id,
                  title: video.snippet.title,
                  thumbnail: video.snippet.thumbnails?.medium?.url || video.snippet.thumbnails?.default?.url,
                  publishedAt: video.snippet.publishedAt,
                  views,
                  likes,
                  comments,
                  engagementRate: views > 0 ? ((likes + comments) / views * 100).toFixed(2) : '0',
                };
              })
              .sort((a: any, b: any) => b.views - a.views)
              .slice(0, 20);
          }
        }
      }
    } catch (e) {
      console.log('Failed to fetch overall top videos, falling back to recent videos');
    }

    if (topVideosOverall.length === 0) {
      topVideosOverall = recentVideos.slice(0, 20);
    }

    // Calculate metrics
    const totalRecentViews = videoStats.reduce((sum, v) => sum + v.views, 0);
    const totalRecentLikes = videoStats.reduce((sum, v) => sum + v.likes, 0);
    const totalRecentComments = videoStats.reduce((sum, v) => sum + v.comments, 0);
    const videoCount = videoStats.length || 1;

    const avgViewsPerVideo = Math.round(totalRecentViews / videoCount);
    const avgLikesPerVideo = Math.round(totalRecentLikes / videoCount);
    const avgEngagementRate = totalRecentViews > 0 
      ? ((totalRecentLikes + totalRecentComments) / totalRecentViews * 100).toFixed(2) 
      : '0';

    // Calculate videos this week
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const videosThisWeek = videoStats.filter(v => new Date(v.publishedAt) >= oneWeekAgo).length;

    // Calculate videos this month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const videosThisMonth = videoStats.filter(v => new Date(v.publishedAt) >= oneMonthAgo).length;

    // Get last video date
    const lastVideoDate = videoStats.length > 0 
      ? new Date(videoStats[0].publishedAt)
      : null;
    const daysSinceLastVideo = lastVideoDate 
      ? Math.floor((Date.now() - lastVideoDate.getTime()) / (1000 * 60 * 60 * 24))
      : null;

    // Generate AI-powered tips based on data
    const tips: { type: 'success' | 'warning' | 'info'; title: string; message: string }[] = [];

    // Engagement tips
    const engagementNum = parseFloat(avgEngagementRate);
    if (engagementNum < 2) {
      tips.push({
        type: 'warning',
        title: 'Engajamento Baixo',
        message: 'Seu engajamento médio está abaixo de 2%. Tente fazer mais perguntas aos espectadores e incentivar comentários no início e fim dos vídeos.'
      });
    } else if (engagementNum >= 5) {
      tips.push({
        type: 'success',
        title: 'Excelente Engajamento!',
        message: `Taxa de ${engagementNum}% está acima da média do YouTube. Continue incentivando a interação!`
      });
    }

    // Upload frequency tips
    if (daysSinceLastVideo !== null) {
      if (daysSinceLastVideo > 14) {
        tips.push({
          type: 'warning',
          title: 'Frequência de Upload',
          message: `Faz ${daysSinceLastVideo} dias desde o último vídeo. O algoritmo favorece canais com uploads consistentes. Tente postar pelo menos 1x por semana.`
        });
      } else if (daysSinceLastVideo <= 3 && videosThisWeek >= 2) {
        tips.push({
          type: 'success',
          title: 'Ótima Frequência!',
          message: 'Você está mantendo uma frequência consistente de uploads. Isso ajuda muito no crescimento do canal!'
        });
      }
    }

    // Views tips
    const subscribers = parseInt(stats.subscriberCount || '0', 10);
    if (subscribers > 0 && avgViewsPerVideo > 0) {
      const viewToSubRatio = (avgViewsPerVideo / subscribers) * 100;
      
      if (viewToSubRatio < 10) {
        tips.push({
          type: 'info',
          title: 'Alcance de Inscritos',
          message: 'Seus vídeos estão alcançando menos de 10% dos inscritos. Experimente notificar seus seguidores nas redes sociais e usar títulos mais chamativos.'
        });
      } else if (viewToSubRatio > 50) {
        tips.push({
          type: 'success',
          title: 'Ótimo Alcance!',
          message: 'Seus vídeos estão alcançando mais de 50% dos inscritos - excelente retenção de audiência!'
        });
      }
    }

    // Growth tip
    if (subscribers < 1000) {
      tips.push({
        type: 'info',
        title: 'Caminho para Monetização',
        message: `Faltam ${1000 - subscribers} inscritos para atingir os 1.000 necessários para monetização. Foque em conteúdo de nicho e SEO.`
      });
    } else if (subscribers >= 1000 && subscribers < 10000) {
      tips.push({
        type: 'info',
        title: 'Próximo Marco',
        message: 'Você já pode monetizar! O próximo marco é 10K inscritos. Continue crescendo com consistência.'
      });
    }

    // Best performing video tip
    if (recentVideos.length > 0) {
      const bestVideo = recentVideos[0];
      if (bestVideo.views > avgViewsPerVideo * 2) {
        tips.push({
          type: 'success',
          title: 'Vídeo em Destaque',
          message: `"${bestVideo.title.substring(0, 40)}..." está performando 2x acima da média. Considere criar conteúdo similar!`
        });
      }
    }

    const result = {
      channel: {
        id: channelId,
        name: channel.snippet.title,
        thumbnail: channel.snippet.thumbnails?.medium?.url,
      },
      statistics: {
        subscribers: parseInt(stats.subscriberCount || '0', 10),
        totalViews: parseInt(stats.viewCount || '0', 10),
        totalVideos: parseInt(stats.videoCount || '0', 10),
      },
      recentMetrics: {
        analyzedVideos: videoCount,
        totalViewsRecent: totalRecentViews,
        avgViewsPerVideo,
        avgLikesPerVideo,
        avgEngagementRate: parseFloat(avgEngagementRate),
        videosThisWeek,
        videosThisMonth,
        daysSinceLastVideo,
      },
      topVideos: topVideosOverall,
      tips,
      lastUpdated: new Date().toISOString(),
    };

    console.log('Analytics fetched successfully, tips generated:', tips.length);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Error fetching analytics:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
