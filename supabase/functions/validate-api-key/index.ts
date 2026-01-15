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
    const { provider, apiKey } = await req.json();

    if (!provider || !apiKey) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Provider and API key are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let valid = false;
    let error = '';

    switch (provider) {
      case 'openai':
        valid = await validateOpenAI(apiKey);
        break;
      case 'claude':
        valid = await validateClaude(apiKey);
        break;
      case 'gemini':
        valid = await validateGemini(apiKey);
        break;
      case 'elevenlabs':
        valid = await validateElevenLabs(apiKey);
        break;
      case 'youtube':
        valid = await validateYouTube(apiKey);
        break;
      case 'laozhang':
        valid = await validateLaozhang(apiKey);
        break;
      case 'downsub':
        valid = await validateDownsub(apiKey);
        break;
      case 'imagefx':
        valid = await validateImageFX(apiKey);
        break;
      default:
        error = 'Unknown provider';
    }

    console.log(`Validation result for ${provider}: ${valid}`);

    return new Response(
      JSON.stringify({ valid, error }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error validating API key:', error);
    return new Response(
      JSON.stringify({ valid: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function validateOpenAI(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function validateClaude(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'Hi' }]
      })
    });
    return response.ok || response.status === 400;
  } catch {
    return false;
  }
}

async function validateGemini(apiKey: string): Promise<boolean> {
  try {
    console.log('Gemini validation: starting...');
    console.log(`Gemini key format: starts with "${apiKey.substring(0, 6)}...", length: ${apiKey.length}`);
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    
    console.log(`Gemini validation response status: ${response.status}`);
    
    if (response.ok) {
      console.log('Gemini validation: success');
      return true;
    }
    
    // Log the error response for debugging
    const errorText = await response.text();
    console.log(`Gemini validation error: ${errorText}`);
    
    // Sometimes quota exceeded (429) means key is valid
    if (response.status === 429) {
      console.log('Gemini validation: rate limited but key is valid');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Gemini validation error:', error);
    return false;
  }
}

async function validateElevenLabs(apiKey: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.elevenlabs.io/v1/user', {
      headers: { 'xi-api-key': apiKey }
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function validateYouTube(apiKey: string): Promise<boolean> {
  try {
    // Use a simple search endpoint that only requires API key
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&maxResults=1&type=video&key=${apiKey}`
    );
    
    if (response.ok) {
      return true;
    }
    
    // Check if it's a quota error (403) - API key is valid but quota exceeded
    if (response.status === 403) {
      const data = await response.json();
      // If it's a quota error, the key is still valid
      if (data.error?.errors?.[0]?.reason === 'quotaExceeded') {
        return true;
      }
    }
    
    console.log(`YouTube validation response: ${response.status}`);
    return false;
  } catch (error) {
    console.error('YouTube validation error:', error);
    return false;
  }
}

async function validateLaozhang(apiKey: string): Promise<boolean> {
  try {
    console.log('Laozhang validation: starting...');
    
    // Laozhang uses OpenAI-compatible API, validate by listing models
    const response = await fetch('https://api.laozhang.ai/v1/models', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    
    console.log(`Laozhang validation response status: ${response.status}`);
    
    if (response.ok) {
      console.log('Laozhang validation: success');
      return true;
    }
    
    // Some valid keys might get 429 (rate limit) - still valid
    if (response.status === 429) {
      console.log('Laozhang validation: rate limited but key is valid');
      return true;
    }
    
    // Check for auth error specifically
    if (response.status === 401 || response.status === 403) {
      const text = await response.text();
      console.log(`Laozhang validation failed: ${text}`);
      return false;
    }
    
    // For other errors, assume key format is correct if it starts with sk-
    if (apiKey.startsWith('sk-') && apiKey.length >= 40) {
      console.log('Laozhang validation: key format looks valid, accepting');
      return true;
    }
    
    console.log(`Laozhang validation: unexpected status ${response.status}`);
    return false;
  } catch (error) {
    console.error('Laozhang validation error:', error);
    // If network error but key format looks valid, accept it
    if (apiKey.startsWith('sk-') && apiKey.length >= 40) {
      console.log('Laozhang validation: network error but key format valid, accepting');
      return true;
    }
    return false;
  }
}

async function validateDownsub(apiKey: string): Promise<boolean> {
  try {
    console.log('Downsub validation: checking key format...');
    // DownSub API validation - simple format check
    // Return true if key looks valid (has right length)
    if (apiKey && apiKey.length >= 20) {
      console.log('Downsub validation: key format valid');
      return true;
    }
    console.log('Downsub validation: key too short');
    return false;
  } catch (error) {
    console.error('Downsub validation error:', error);
    return false;
  }
}

async function validateImageFX(cookies: string): Promise<boolean> {
  try {
    console.log('ImageFX validation: checking cookies format...');
    
    // ImageFX cookies validation - check for required cookie patterns
    // Usually contains __Secure-1PSID or similar Google cookies
    if (!cookies || cookies.length < 50) {
      console.log('ImageFX validation: cookies too short');
      return false;
    }
    
    // Check for common Google cookie patterns
    const hasRequiredCookies = 
      cookies.includes('__Secure-1PSID') || 
      cookies.includes('__Secure-3PSID') ||
      cookies.includes('SAPISID') ||
      cookies.includes('SID=');
    
    if (hasRequiredCookies) {
      console.log('ImageFX validation: cookies format valid');
      return true;
    }
    
    // If it has reasonable length but no specific patterns, still accept
    if (cookies.length >= 100) {
      console.log('ImageFX validation: cookies length acceptable');
      return true;
    }
    
    console.log('ImageFX validation: invalid cookies format');
    return false;
  } catch (error) {
    console.error('ImageFX validation error:', error);
    return false;
  }
}
