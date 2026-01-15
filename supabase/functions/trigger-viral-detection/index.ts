import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const n8nWebhookUrl = Deno.env.get('N8N_VIRAL_WEBHOOK_URL');
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[trigger-viral-detection] User:', user.id);

    // Get user's viral monitoring config
    const { data: config } = await supabase
      .from('viral_monitoring_config')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Get user's YouTube API key
    const { data: apiSettings } = await supabase
      .from('user_api_settings')
      .select('youtube_api_key')
      .eq('user_id', user.id)
      .single();

    // If n8n webhook is configured, call it directly
    if (n8nWebhookUrl) {
      console.log('[trigger-viral-detection] Calling n8n webhook:', n8nWebhookUrl);

      // HARDCODED callback URL - simplifies n8n configuration
      const callbackUrl = 'https://kabnbvnephjifeazaiis.supabase.co/functions/v1/viral-webhook';
      console.log('[trigger-viral-detection] Callback URL (hardcoded):', callbackUrl);

      const payload = {
        user_id: user.id,
        niches: config?.niches || ['dark psychology', 'stoicism', 'self improvement'],
        viral_threshold: config?.viral_threshold || 1000,
        video_types: config?.video_types || ['long', 'short'],
        country: config?.country || 'US',
        youtube_api_key: apiSettings?.youtube_api_key || null,
        // HARDCODED URL - n8n deve fazer POST para esta URL com os vídeos encontrados
        callback_url: callbackUrl,
        callbackUrl: callbackUrl,
        triggered_at: new Date().toISOString()
      };

      // Never log API keys
      const safeLogPayload = {
        ...payload,
        youtube_api_key: payload.youtube_api_key ? '[REDACTED]' : null,
      };
      console.log('[trigger-viral-detection] Payload:', JSON.stringify(safeLogPayload));

      // Quick validation: detects common YouTube API key restrictions (e.g. HTTP referrer only)
      const validateYoutubeApiKey = async (apiKey: string, country: string) => {
        try {
          const url = new URL('https://www.googleapis.com/youtube/v3/search');
          url.searchParams.set('part', 'id');
          url.searchParams.set('type', 'video');
          url.searchParams.set('maxResults', '1');
          url.searchParams.set('q', 'test');
          url.searchParams.set('regionCode', country || 'US');
          url.searchParams.set('key', apiKey);

          const res = await fetch(url.toString());
          const json = await res.json().catch(() => null);

          if (!res.ok || (json && (json as any).error)) {
            const message = (json as any)?.error?.message || `HTTP ${res.status}`;
            return message;
          }

          return null;
        } catch (e: unknown) {
          const msg = e instanceof Error ? e.message : 'Unknown error';
          return msg;
        }
      };

      if (payload.youtube_api_key) {
        const keyError = await validateYoutubeApiKey(payload.youtube_api_key, payload.country);
        if (keyError) {
          console.error('[trigger-viral-detection] YouTube API key validation failed:', keyError);
          return new Response(
            JSON.stringify({
              success: false,
              error: 'Sua chave da API do YouTube está inválida ou restrita para uso em servidor.',
              details: keyError,
              hint: 'Se sua chave estiver com restrição por "HTTP referrers" (sites), troque para "None" ou restrição por IP (permitindo o servidor do n8n).'
            }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      const buildGetUrl = () => {
        const url = new URL(n8nWebhookUrl);
        url.searchParams.set('user_id', payload.user_id);
        url.searchParams.set('niches', JSON.stringify(payload.niches));
        url.searchParams.set('viral_threshold', String(payload.viral_threshold));
        url.searchParams.set('video_types', JSON.stringify(payload.video_types));
        url.searchParams.set('country', payload.country);
        if (payload.youtube_api_key) {
          url.searchParams.set('youtube_api_key', payload.youtube_api_key);
        }
        // Ensure callback is always sent even if n8n webhook is GET-based
        url.searchParams.set('callback_url', payload.callback_url);
        url.searchParams.set('callbackUrl', payload.callback_url);
        url.searchParams.set('triggered_at', payload.triggered_at);
        return url.toString();
      };

      const callPost = () =>
        fetch(n8nWebhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

      const callGet = () => fetch(buildGetUrl(), { method: 'GET' });

      // Prefer POST (default in n8n). If n8n indicates the wrong method, retry once with the suggested method.
      let n8nResponse = await callPost();
      let responseText = await n8nResponse.text();

      if (
        !n8nResponse.ok &&
        responseText.includes('not registered for POST') &&
        responseText.toLowerCase().includes('get request')
      ) {
        console.log('[trigger-viral-detection] Retrying n8n webhook with GET');
        n8nResponse = await callGet();
        responseText = await n8nResponse.text();
      } else if (
        !n8nResponse.ok &&
        responseText.includes('not registered for GET') &&
        responseText.toLowerCase().includes('post request')
      ) {
        console.log('[trigger-viral-detection] Retrying n8n webhook with POST');
        n8nResponse = await callPost();
        responseText = await n8nResponse.text();
      }

      console.log(`[trigger-viral-detection] n8n response: ${n8nResponse.status} - ${responseText}`);

      if (!n8nResponse.ok) {
        console.error('[trigger-viral-detection] n8n webhook failed:', responseText);
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: 'Falha ao chamar workflow n8n',
            details: responseText 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update last_checked_at in config
      if (config) {
        await supabase
          .from('viral_monitoring_config')
          .update({ last_checked_at: new Date().toISOString() })
          .eq('user_id', user.id);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Busca de vídeos virais iniciada!',
          n8n_response: responseText
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fallback: call check-new-videos edge function
    console.log('[trigger-viral-detection] No n8n webhook, falling back to check-new-videos');
    
    const { data, error } = await supabase.functions.invoke("check-new-videos");
    
    if (error) {
      console.error('[trigger-viral-detection] check-new-videos error:', error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Falha na verificação',
          details: error.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verificação iniciada!',
        result: data 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('[trigger-viral-detection] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
