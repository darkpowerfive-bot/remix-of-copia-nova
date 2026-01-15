import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const DefaultImageFXHeader = {
  "Origin": "https://labs.google",
  "Content-Type": "application/json",
  "Referer": "https://labs.google/fx/tools/image-fx"
};

// Session cache for ImageFX
const sessionCache = new Map<string, { token: string; expires: Date }>();

async function fetchImageFXSession(cookie: string): Promise<{ access_token: string; expires: string }> {
  const res = await fetch("https://labs.google/fx/api/auth/session", {
    headers: {
      "Origin": "https://labs.google",
      "Referer": "https://labs.google/fx/tools/image-fx",
      "Cookie": cookie
    }
  });

  if (!res.ok) {
    throw new Error(`ImageFX session error: ${res.status}`);
  }

  const data = await res.json();
  
  if (!data.access_token || !data.expires) {
    throw new Error("Invalid ImageFX session response");
  }

  return data;
}

function generateSessionId(): string {
  const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `${Date.now()}-${randomHex}`;
}

async function generateImageWithImageFX(
  prompt: string, 
  cookie: string, 
  userId: string,
  aspectRatio: string = "IMAGE_ASPECT_RATIO_LANDSCAPE"
): Promise<string | null> {
  try {
    const cached = sessionCache.get(userId);
    let token: string;
    
    if (cached && cached.expires > new Date(Date.now() + 30000)) {
      token = cached.token;
    } else {
      const session = await fetchImageFXSession(cookie);
      token = session.access_token;
      sessionCache.set(userId, {
        token: session.access_token,
        expires: new Date(session.expires)
      });
    }

    const payload = JSON.stringify({
      userInput: {
        candidatesCount: 1,
        prompts: [prompt],
        seed: Math.floor(Math.random() * 2147483647)
      },
      clientContext: {
        sessionId: generateSessionId(),
        tool: "IMAGE_FX"
      },
      modelInput: {
        modelNameType: "IMAGEN_3_5"
      },
      aspectRatio
    });

    console.log('[ImageFX] Generating image...');
    
    const res = await fetch("https://aisandbox-pa.googleapis.com/v1:runImageFx", {
      method: "POST",
      body: payload,
      headers: {
        ...DefaultImageFXHeader,
        "Cookie": cookie,
        "Authorization": `Bearer ${token}`
      }
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[ImageFX] Generation error:', res.status, errText);
      
      if ([401, 403].includes(res.status)) {
        sessionCache.delete(userId);
      }
      return null;
    }

    const json = await res.json();
    const images = json?.imagePanels?.[0]?.generatedImages;
    
    if (images && images.length > 0 && images[0].encodedImage) {
      console.log('[ImageFX] Image generated successfully');
      return `data:image/png;base64,${images[0].encodedImage}`;
    }
    
    return null;
  } catch (error) {
    console.error('[ImageFX] Error:', error);
    return null;
  }
}

async function generateImageWithLovable(prompt: string, apiKey: string): Promise<{ images: any[]; message: string } | null> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [
        { role: "user", content: prompt },
      ],
      modalities: ["image", "text"],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Lovable image generation error:", response.status, errorText);
    return null;
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  const images = data.choices?.[0]?.message?.images;

  return { images: images || [], message: content || "" };
}

// ALWAYS use ImageFX for images when cookies are available
async function getUserImageFXCookies(userId: string, supabaseAdmin: any): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_api_settings')
      .select('imagefx_cookies, imagefx_validated')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;

    // Always use ImageFX when cookies are available and validated
    if (!data.imagefx_validated || !data.imagefx_cookies) return null;

    return data.imagefx_cookies;
  } catch (e) {
    console.error('Error fetching ImageFX cookies:', e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { prompt, aspectRatio = "LANDSCAPE", userId: bodyUserId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!prompt) {
      throw new Error("Prompt is required");
    }

    console.log("Generating image with prompt:", prompt.substring(0, 100));

    // Get user from auth header
    let userId: string | null = bodyUserId || null;
    let supabaseAdmin: any = null;

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      const authHeader = req.headers.get("Authorization");
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (user) userId = user.id;
      }
    }

    // Map aspect ratio
    let imageFXAspectRatio = "IMAGE_ASPECT_RATIO_LANDSCAPE";
    if (aspectRatio === "SQUARE" || aspectRatio === "1:1") {
      imageFXAspectRatio = "IMAGE_ASPECT_RATIO_SQUARE";
    } else if (aspectRatio === "PORTRAIT" || aspectRatio === "9:16") {
      imageFXAspectRatio = "IMAGE_ASPECT_RATIO_PORTRAIT";
    }

    let result: { images: any[]; message: string; provider: string } | null = null;

    // Always try ImageFX first if user has cookies configured
    if (userId && supabaseAdmin) {
      const cookies = await getUserImageFXCookies(userId, supabaseAdmin);
      
      if (cookies) {
        console.log('[Image] Using ImageFX (user cookies)');
        const imageBase64 = await generateImageWithImageFX(prompt, cookies, userId, imageFXAspectRatio);
        
        if (imageBase64) {
          result = {
            images: [{ image_url: { url: imageBase64 } }],
            message: "Imagem gerada com ImageFX",
            provider: "imagefx"
          };
        } else {
          console.log('[Image] ImageFX failed, falling back to Lovable');
        }
      }
    }

    // Fallback to Lovable AI
    if (!result) {
      console.log('[Image] Using Lovable AI');
      const lovableResult = await generateImageWithLovable(prompt, LOVABLE_API_KEY);
      
      if (lovableResult) {
        result = {
          ...lovableResult,
          provider: "lovable"
        };
      }
    }

    if (!result) {
      throw new Error("Falha ao gerar imagem");
    }

    console.log(`Image generated successfully with provider: ${result.provider}`);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in generate-image:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});