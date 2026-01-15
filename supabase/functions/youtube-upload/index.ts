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

    // Get request body
    const { title, description, tags, privacyStatus, categoryId, madeForKids, fileBase64, fileName, mimeType } = await req.json();

    if (!title || !fileBase64) {
      return new Response(JSON.stringify({ error: 'Title and file are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get user's YouTube connection
    const { data: connection, error: connError } = await supabase
      .from('youtube_connections')
      .select('access_token, refresh_token, token_expires_at')
      .eq('user_id', userId)
      .single();

    if (connError || !connection) {
      console.error('No YouTube connection found:', connError);
      return new Response(JSON.stringify({ error: 'YouTube not connected' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let accessToken = connection.access_token;

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
          const error = await refreshResponse.text();
          console.error('Token refresh failed:', error);
          return new Response(JSON.stringify({ error: 'Token expired and refresh failed' }), {
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

    // Decode base64 file
    const binaryStr = atob(fileBase64);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    console.log('Uploading video:', title, 'Size:', bytes.length);

    // Create video metadata
    const metadata = {
      snippet: {
        title,
        description: description || '',
        tags: tags || [],
        categoryId: categoryId || '22'
      },
      status: {
        privacyStatus: privacyStatus || 'private',
        selfDeclaredMadeForKids: madeForKids || false
      }
    };

    // Step 1: Initialize resumable upload
    const initResponse = await fetch(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'X-Upload-Content-Length': bytes.length.toString(),
          'X-Upload-Content-Type': mimeType || 'video/mp4'
        },
        body: JSON.stringify(metadata)
      }
    );

    if (!initResponse.ok) {
      const error = await initResponse.text();
      console.error('Upload init failed:', error);
      return new Response(JSON.stringify({ error: 'Failed to initialize upload: ' + error }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const uploadUrl = initResponse.headers.get('Location');
    if (!uploadUrl) {
      return new Response(JSON.stringify({ error: 'No upload URL received' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Step 2: Upload the video file
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Length': bytes.length.toString(),
        'Content-Type': mimeType || 'video/mp4'
      },
      body: bytes
    });

    if (!uploadResponse.ok) {
      const error = await uploadResponse.text();
      console.error('Video upload failed:', error);
      return new Response(JSON.stringify({ error: 'Failed to upload video: ' + error }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const videoData = await uploadResponse.json();
    console.log('Video uploaded successfully:', videoData.id);

    return new Response(JSON.stringify({ 
      success: true,
      videoId: videoData.id,
      videoUrl: `https://www.youtube.com/watch?v=${videoData.id}`,
      status: videoData.status
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: unknown) {
    console.error('Error uploading video:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
