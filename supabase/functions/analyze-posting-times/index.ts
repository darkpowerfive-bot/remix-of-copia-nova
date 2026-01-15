import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VideoData {
  videoId: string;
  title: string;
  publishedAt: string;
  views: number;
  likes: number;
  comments: number;
}

interface PostingTimeAnalysis {
  bestDays: { day: string; avgViews: number; videoCount: number }[];
  bestHours: { hour: string; avgViews: number; videoCount: number }[];
  bestDayHourCombos: { day: string; hour: string; avgViews: number }[];
  insights: string[];
  country?: string;
  niche?: string;
  channelName?: string;
  totalVideosAnalyzed: number;
}

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

    // Get user's YouTube connection
    const { data: connection, error: connError } = await supabase
      .from('youtube_connections')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (connError || !connection) {
      return new Response(JSON.stringify({ error: 'YouTube not connected', code: 'NO_CONNECTION' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let accessToken = connection.access_token;
    const channelId = connection.channel_id;

    // Refresh token if expired
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
          return new Response(JSON.stringify({ error: 'Token expired', code: 'TOKEN_EXPIRED' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

        const refreshData = await refreshResponse.json();
        accessToken = refreshData.access_token;

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

    console.log('Analyzing posting times for channel:', channelId);

    // Fetch channel info
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&id=${channelId}`;
    const channelResponse = await fetch(channelUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!channelResponse.ok) {
      return new Response(JSON.stringify({ error: 'Failed to fetch channel info' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const channelData = await channelResponse.json();
    const channel = channelData.items?.[0];
    
    if (!channel) {
      return new Response(JSON.stringify({ error: 'Channel not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const uploadsPlaylistId = channel.contentDetails?.relatedPlaylists?.uploads;
    const channelCountry = channel.snippet?.country || 'BR';
    const channelName = channel.snippet?.title;
    const channelDescription = channel.snippet?.description || '';

    if (!uploadsPlaylistId) {
      return new Response(JSON.stringify({ error: 'No uploads playlist found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch ALL videos (paginated) - up to 100 videos for better analysis
    const allVideoIds: string[] = [];
    let nextPageToken = '';
    let totalFetched = 0;
    const maxVideos = 100;

    while (totalFetched < maxVideos) {
      const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=50${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
      const playlistResponse = await fetch(playlistUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (!playlistResponse.ok) break;

      const playlistData = await playlistResponse.json();
      
      if (!playlistData.items || playlistData.items.length === 0) break;

      for (const item of playlistData.items) {
        allVideoIds.push(item.snippet.resourceId.videoId);
        totalFetched++;
        if (totalFetched >= maxVideos) break;
      }

      nextPageToken = playlistData.nextPageToken || '';
      if (!nextPageToken) break;
    }

    if (allVideoIds.length === 0) {
      return new Response(JSON.stringify({ error: 'No videos found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch video statistics in batches of 50
    const allVideos: VideoData[] = [];
    
    for (let i = 0; i < allVideoIds.length; i += 50) {
      const batchIds = allVideoIds.slice(i, i + 50).join(',');
      const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet&id=${batchIds}`;
      const videosResponse = await fetch(videosUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });

      if (videosResponse.ok) {
        const videosData = await videosResponse.json();
        
        for (const video of videosData.items || []) {
          allVideos.push({
            videoId: video.id,
            title: video.snippet.title,
            publishedAt: video.snippet.publishedAt,
            views: parseInt(video.statistics.viewCount || '0', 10),
            likes: parseInt(video.statistics.likeCount || '0', 10),
            comments: parseInt(video.statistics.commentCount || '0', 10),
          });
        }
      }
    }

    console.log(`Fetched ${allVideos.length} videos for analysis`);

    // Analyze posting patterns
    const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const dayNamesEn = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    
    // Group videos by day of week
    const byDay: Record<string, { views: number[]; count: number }> = {};
    const byHour: Record<string, { views: number[]; count: number }> = {};
    const byDayHour: Record<string, { views: number[]; count: number }> = {};

    for (const video of allVideos) {
      const publishDate = new Date(video.publishedAt);
      const dayIndex = publishDate.getDay();
      const hour = publishDate.getHours();
      const dayName = dayNamesEn[dayIndex];
      const hourStr = `${hour.toString().padStart(2, '0')}:00`;
      const dayHourKey = `${dayName}-${hourStr}`;

      // By day
      if (!byDay[dayName]) byDay[dayName] = { views: [], count: 0 };
      byDay[dayName].views.push(video.views);
      byDay[dayName].count++;

      // By hour
      if (!byHour[hourStr]) byHour[hourStr] = { views: [], count: 0 };
      byHour[hourStr].views.push(video.views);
      byHour[hourStr].count++;

      // By day + hour combo
      if (!byDayHour[dayHourKey]) byDayHour[dayHourKey] = { views: [], count: 0 };
      byDayHour[dayHourKey].views.push(video.views);
      byDayHour[dayHourKey].count++;
    }

    // Calculate averages and sort
    const calculateAvg = (views: number[]) => views.length > 0 ? Math.round(views.reduce((a, b) => a + b, 0) / views.length) : 0;

    const bestDays = Object.entries(byDay)
      .map(([day, data]) => ({
        day,
        avgViews: calculateAvg(data.views),
        videoCount: data.count,
      }))
      .sort((a, b) => b.avgViews - a.avgViews);

    const bestHours = Object.entries(byHour)
      .map(([hour, data]) => ({
        hour,
        avgViews: calculateAvg(data.views),
        videoCount: data.count,
      }))
      .sort((a, b) => b.avgViews - a.avgViews);

    // Only include day-hour combos with at least 2 videos for statistical significance
    const bestDayHourCombos = Object.entries(byDayHour)
      .filter(([_, data]) => data.count >= 2)
      .map(([key, data]) => {
        const [day, hour] = key.split('-');
        return {
          day,
          hour,
          avgViews: calculateAvg(data.views),
        };
      })
      .sort((a, b) => b.avgViews - a.avgViews)
      .slice(0, 5);

    // Detect niche from video titles
    const allTitles = allVideos.map(v => v.title.toLowerCase()).join(' ');
    let detectedNiche = 'geral';
    
    const nicheKeywords: Record<string, string[]> = {
      'finanças': ['investimento', 'dinheiro', 'renda', 'bolsa', 'criptomoeda', 'bitcoin', 'trading', 'mercado'],
      'tecnologia': ['tech', 'tecnologia', 'iphone', 'android', 'review', 'unboxing', 'gadget', 'software'],
      'educação': ['aprenda', 'como fazer', 'tutorial', 'aula', 'curso', 'estudar', 'explicando'],
      'entretenimento': ['react', 'gameplay', 'jogos', 'desafio', 'prank', 'vlog', 'humor'],
      'lifestyle': ['rotina', 'lifestyle', 'dia a dia', 'casa', 'decoração', 'organização'],
      'saúde': ['fitness', 'treino', 'dieta', 'saúde', 'emagrecer', 'exercício', 'academia'],
      'culinária': ['receita', 'cozinha', 'comida', 'chef', 'cooking', 'restaurante'],
      'dark': ['história', 'mistério', 'curiosidade', 'fato', 'verdade', 'segredo', 'incrível'],
    };

    for (const [niche, keywords] of Object.entries(nicheKeywords)) {
      const matchCount = keywords.filter(kw => allTitles.includes(kw)).length;
      if (matchCount >= 2) {
        detectedNiche = niche;
        break;
      }
    }

    // Generate AI insights
    const insights: string[] = [];
    const topDay = bestDays[0];
    const topHour = bestHours[0];
    const worstDay = bestDays[bestDays.length - 1];

    // Best day insight
    const dayPtBr: Record<string, string> = {
      sunday: 'Domingo', monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta',
      thursday: 'Quinta', friday: 'Sexta', saturday: 'Sábado'
    };

    if (topDay && topDay.avgViews > 0) {
      const viewsDiff = topDay.avgViews - worstDay.avgViews;
      const percentage = worstDay.avgViews > 0 ? Math.round((viewsDiff / worstDay.avgViews) * 100) : 0;
      insights.push(`🔥 ${dayPtBr[topDay.day]} é seu melhor dia! Vídeos postados nesse dia têm ${percentage > 0 ? `${percentage}% mais views` : 'melhor performance'} que ${dayPtBr[worstDay.day]}.`);
    }

    // Best hour insight
    if (topHour && topHour.avgViews > 0) {
      insights.push(`⏰ Melhor horário: ${topHour.hour}. Seus vídeos postados nesse horário alcançam em média ${topHour.avgViews.toLocaleString('pt-BR')} views.`);
    }

    // Best combo insight
    if (bestDayHourCombos.length > 0) {
      const bestCombo = bestDayHourCombos[0];
      insights.push(`💎 Combinação de ouro: ${dayPtBr[bestCombo.day]} às ${bestCombo.hour} - média de ${bestCombo.avgViews.toLocaleString('pt-BR')} views.`);
    }

    // Country-specific insights
    if (channelCountry === 'BR') {
      const eveningHours = bestHours.filter(h => {
        const hour = parseInt(h.hour.split(':')[0]);
        return hour >= 18 && hour <= 22;
      });
      if (eveningHours.length > 0) {
        const bestEveningHour = eveningHours.reduce((a, b) => a.avgViews > b.avgViews ? a : b);
        insights.push(`🇧🇷 Para o Brasil, o horário nobre é entre 18h-22h. Seu pico foi às ${bestEveningHour.hour}.`);
      }
    }

    // Consistency insight
    const videosPerMonth = allVideos.length / 12;
    if (videosPerMonth < 4) {
      insights.push(`📅 Consistência: Você posta em média ${Math.round(videosPerMonth)} vídeo(s)/mês. O algoritmo favorece canais que postam semanalmente.`);
    } else if (videosPerMonth >= 8) {
      insights.push(`🚀 Ótima consistência! Você mantém uma frequência de ~${Math.round(videosPerMonth)} vídeos/mês.`);
    }

    // Weekend vs weekday insight
    const weekendViews = (byDay['saturday']?.views || []).concat(byDay['sunday']?.views || []);
    const weekdayViews = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
      .flatMap(d => byDay[d]?.views || []);
    
    if (weekendViews.length > 0 && weekdayViews.length > 0) {
      const avgWeekend = calculateAvg(weekendViews);
      const avgWeekday = calculateAvg(weekdayViews);
      
      if (avgWeekend > avgWeekday * 1.2) {
        insights.push(`📆 Fins de semana performam ${Math.round((avgWeekend / avgWeekday - 1) * 100)}% melhor que dias úteis no seu canal.`);
      } else if (avgWeekday > avgWeekend * 1.2) {
        insights.push(`💼 Dias úteis performam ${Math.round((avgWeekday / avgWeekend - 1) * 100)}% melhor que fins de semana no seu canal.`);
      }
    }

    const result: PostingTimeAnalysis = {
      bestDays,
      bestHours: bestHours.slice(0, 6),
      bestDayHourCombos,
      insights,
      country: channelCountry,
      niche: detectedNiche,
      channelName,
      totalVideosAnalyzed: allVideos.length,
    };

    console.log('Posting time analysis completed');

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Error analyzing posting times:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
