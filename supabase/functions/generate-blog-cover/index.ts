import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const DefaultHeader = {
  "Origin": "https://labs.google",
  "Content-Type": "application/json",
  "Referer": "https://labs.google/fx/tools/image-fx"
};

const AspectRatio = {
  LANDSCAPE: "IMAGE_ASPECT_RATIO_LANDSCAPE"
} as const;

function generateSessionId(): string {
  const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `${Date.now()}-${randomHex}`;
}

async function fetchSession(cookie: string): Promise<{ access_token: string }> {
  const res = await fetch("https://labs.google/fx/api/auth/session", {
    headers: {
      "Origin": "https://labs.google",
      "Referer": "https://labs.google/fx/tools/image-fx",
      "Cookie": cookie
    }
  });

  if (!res.ok) {
    throw new Error(`Falha de autenticação (${res.status}). Verifique os cookies do ImageFX.`);
  }

  const data = await res.json();
  if (!data.access_token) {
    throw new Error("Resposta de sessão inválida. Atualize os cookies do ImageFX.");
  }

  return data;
}

async function getAdminImageFXCookies(): Promise<string | null> {
  try {
    // Buscar cookies de admin (primeiro admin encontrado)
    const { data: adminRole } = await supabaseAdmin
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle();

    if (!adminRole) {
      console.log('[BlogCover] No admin found');
      return null;
    }

    const { data, error } = await supabaseAdmin
      .from('user_api_settings')
      .select('imagefx_cookies, imagefx_validated')
      .eq('user_id', adminRole.user_id)
      .maybeSingle();

    if (error || !data || !data.imagefx_validated) {
      console.log('[BlogCover] Admin cookies not found or not validated');
      return null;
    }

    return (data as any).imagefx_cookies || null;
  } catch (e) {
    console.error('[BlogCover] Error fetching admin cookies:', e);
    return null;
  }
}

async function generateWithImageFX(cookie: string, prompt: string): Promise<string> {
  console.log('[BlogCover] Generating with ImageFX...');
  
  const session = await fetchSession(cookie);
  
  const headers = {
    ...DefaultHeader,
    "Cookie": cookie,
    "Authorization": `Bearer ${session.access_token}`
  };

  // Prompt otimizado para blog covers em 16:9 landscape
  const enhancedPrompt = `${prompt}, 16:9 wide landscape aspect ratio, no black bars, no letterbox, no borders, fill entire frame horizontally, professional blog header image, high resolution 1200x630 pixels`;
  
  const payload = JSON.stringify({
    userInput: {
      candidatesCount: 1,
      prompts: [enhancedPrompt],
      seed: Math.floor(Math.random() * 2147483647)
    },
    clientContext: {
      sessionId: generateSessionId(),
      tool: "IMAGE_FX"
    },
    modelInput: {
      modelNameType: "IMAGEN_3_5"
    },
    aspectRatio: AspectRatio.LANDSCAPE
  });

  const res = await fetch("https://aisandbox-pa.googleapis.com/v1:runImageFx", {
    method: "POST",
    body: payload,
    headers
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('[BlogCover] ImageFX error:', res.status, errText);
    throw new Error(`Erro ImageFX: ${res.status}`);
  }

  const json = await res.json();
  const images = json?.imagePanels?.[0]?.generatedImages;
  
  if (!images?.length) {
    throw new Error("Nenhuma imagem gerada pelo ImageFX");
  }

  return images[0].encodedImage; // Return raw base64 without data URI prefix
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, category, articleId, style } = await req.json();

    if (!title) {
      return new Response(
        JSON.stringify({ error: "Título é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get admin's ImageFX cookies
    const cookies = await getAdminImageFXCookies();
    
    if (!cookies) {
      return new Response(
        JSON.stringify({ error: "Cookies do ImageFX não configurados. Configure nas configurações de Admin." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log('[BlogCover] Generating cover for:', title);

    let styleDesc = "cinematic dramatic lighting, professional";
    if (style === "minimalist") styleDesc = "minimalist with negative space, clean";
    else if (style === "colorful") styleDesc = "vibrant bold colors, energetic";
    else if (style === "tech") styleDesc = "futuristic technology, sci-fi";
    else if (style === "neon") styleDesc = "neon cyberpunk style, glowing";

    const imagePrompt = `Professional blog cover image about "${title}". ${styleDesc}. Category: ${category || "YouTube content creation"}. High quality, ultra detailed, no text or words.`;

    // Generate with ImageFX - returns raw base64
    const base64Image = await generateWithImageFX(cookies, imagePrompt);

    // If articleId provided, upload optimized image to storage
    if (articleId) {
      const imageBuffer = Uint8Array.from(atob(base64Image), (c) => c.charCodeAt(0));
      
      // Use WebP format for better compression and performance
      const fileName = `blog-covers/${articleId}-${Date.now()}.webp`;

      const { error: uploadError } = await supabaseAdmin.storage
        .from("blog-images")
        .upload(fileName, imageBuffer, { 
          contentType: "image/webp", 
          upsert: true,
          cacheControl: "public, max-age=31536000" // Cache for 1 year
        });

      if (uploadError) {
        console.error('[BlogCover] Upload error:', uploadError);
        // Fallback: return base64 data URI
        return new Response(
          JSON.stringify({ success: true, image_url: `data:image/png;base64,${base64Image}`, uploaded: false }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: urlData } = supabaseAdmin.storage.from("blog-images").getPublicUrl(fileName);
      
      await supabaseAdmin.from("blog_articles").update({ image_url: urlData.publicUrl }).eq("id", articleId);

      console.log('[BlogCover] Optimized cover uploaded:', urlData.publicUrl);

      return new Response(
        JSON.stringify({ success: true, image_url: urlData.publicUrl, uploaded: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Return base64 data URI for preview
    return new Response(
      JSON.stringify({ success: true, image_url: `data:image/png;base64,${base64Image}`, uploaded: false }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error('[BlogCover] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
