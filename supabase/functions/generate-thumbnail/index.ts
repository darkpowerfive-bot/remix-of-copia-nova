import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Credit pricing according to documentation
const CREDIT_PRICING = {
  THUMBNAIL_GENERATION: { base: 8, gemini: 10, claude: 12 },
};

const DefaultImageFXHeader = {
  "Origin": "https://labs.google",
  "Content-Type": "application/json",
  "Referer": "https://labs.google/fx/tools/image-fx"
};

interface ThumbnailRequest {
  videoTitle: string;
  niche?: string;
  subNiche?: string;
  style?: string;
  stylePromptPrefix?: string;
  includeHeadline?: boolean;
  useTitle?: boolean;
  referenceThumbnailUrl?: string;
  referencePrompt?: string;
  referenceHeadlineStyle?: string;
  language?: string;
  imageProvider?: 'imagefx' | 'lovable';
}

interface ThumbnailVariation {
  variationNumber: number;
  imageBase64: string;
  headline: string | null;
  seoDescription: string;
  seoTags: string;
  prompt: string;
  style: string;
}

const VARIATION_STYLES = [
  { name: "Close-up emocional", description: "Extreme close-up of a person showing intense emotion (surprise, shock, excitement), dramatic lighting, cinematic feel" },
  { name: "Cena de ação", description: "Dynamic action scene with movement, energy, dramatic composition, vibrant colors" },
  { name: "Mistério/Suspense", description: "Dark and mysterious atmosphere, shadows, silhouettes, intriguing elements, moody lighting" },
  { name: "Impacto visual", description: "Bold visual impact with contrasting colors, eye-catching elements, professional composition" },
];

// Session cache for ImageFX
const sessionCache = new Map<string, { token: string; expires: Date }>();

async function fetchImageFXSession(cookie: string): Promise<{ access_token: string; expires: string }> {
  console.log('[ImageFX] Fetching session...');
  
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
  userId: string
): Promise<string | null> {
  try {
    // Check cached session
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
      aspectRatio: "IMAGE_ASPECT_RATIO_LANDSCAPE" // 16:9 for thumbnails
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

async function generateHeadlines(title: string, niche: string, language: string, apiKey: string): Promise<string[]> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `Você é um especialista em criar headlines impactantes para thumbnails do YouTube. 
Gere headlines curtas (máximo 4 palavras), impactantes e que geram curiosidade.
Responda APENAS com um JSON array de 3 strings, sem explicações.`
        },
        {
          role: "user",
          content: `Título do vídeo: "${title}"
Nicho: ${niche || "Geral"}
Idioma: ${language}

Gere 3 headlines curtas e impactantes para thumbnails.
Formato: ["HEADLINE1", "HEADLINE2", "HEADLINE3"]`
        }
      ],
    }),
  });

  if (!response.ok) {
    console.error("Error generating headlines:", await response.text());
    return ["INCRÍVEL!", "VOCÊ PRECISA VER", "CHOCANTE!"];
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  
  try {
    const jsonMatch = content.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("Error parsing headlines:", e);
  }
  
  return ["INCRÍVEL!", "VOCÊ PRECISA VER", "CHOCANTE!"];
}

async function generateSEOContent(title: string, niche: string, variation: string, language: string, apiKey: string): Promise<{ description: string; tags: string }> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content: `Você é um especialista em SEO para YouTube. Gere descrições e tags otimizadas.
Responda APENAS com JSON no formato: {"description": "texto 400-500 chars", "tags": "tag1, tag2, tag3..."}`
        },
        {
          role: "user",
          content: `Título: "${title}"
Nicho: ${niche || "Geral"}
Estilo visual: ${variation}
Idioma: ${language}

Gere descrição SEO (400-500 caracteres) e tags separadas por vírgula.`
        }
      ],
    }),
  });

  if (!response.ok) {
    console.error("Error generating SEO:", await response.text());
    return {
      description: `Vídeo sobre ${title}. Conteúdo de qualidade no nicho ${niche || "geral"}.`,
      tags: `${niche}, youtube, viral, conteúdo`
    };
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (e) {
    console.error("Error parsing SEO content:", e);
  }
  
  return {
    description: `Vídeo incrível sobre ${title}. Não perca esse conteúdo exclusivo!`,
    tags: `${niche}, youtube, viral`
  };
}

async function generateImageWithLovable(prompt: string, apiKey: string): Promise<string | null> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-image",
      messages: [
        { role: "user", content: prompt }
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
  const images = data.choices?.[0]?.message?.images;
  
  if (images && images.length > 0) {
    return images[0].image_url?.url || null;
  }
  
  return null;
}

// Get user's ImageFX cookies - ALWAYS use ImageFX for images when available
async function getUserImageFXCookies(userId: string, supabaseAdmin: any): Promise<string | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('user_api_settings')
      .select('imagefx_cookies, imagefx_validated')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;
    
    // Always use ImageFX for images when cookies are available and validated
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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    let supabaseAdmin: any = null;

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      if (authHeader) {
        const token = authHeader.replace("Bearer ", "");
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        userId = user?.id || null;
      }
    }

    const body: ThumbnailRequest = await req.json();
    const { 
      videoTitle, 
      niche = "Geral", 
      subNiche, 
      style = "photorealistic",
      stylePromptPrefix = "",
      includeHeadline = true,
      useTitle = false,
      referenceThumbnailUrl,
      referencePrompt,
      referenceHeadlineStyle,
      language = "Português",
      imageProvider
    } = body;

    if (!videoTitle) {
      throw new Error("videoTitle is required");
    }

    console.log("Generating thumbnails for:", videoTitle);

    // Determine image provider
    let useImageFX = false;
    let imageFXCookies: string | null = null;
    let shouldDebitCredits = true;

    if (userId && supabaseAdmin) {
      imageFXCookies = await getUserImageFXCookies(userId, supabaseAdmin);
      
      if (imageFXCookies) {
        useImageFX = true;
        shouldDebitCredits = false; // Using own ImageFX = no credits
        console.log('[Thumbnail] Using ImageFX (user cookies)');
      } else {
        console.log('[Thumbnail] Using Lovable AI (platform credits)');
      }
    }

    // Override if explicit provider requested
    if (imageProvider === 'lovable') {
      useImageFX = false;
      shouldDebitCredits = true;
    } else if (imageProvider === 'imagefx' && !imageFXCookies) {
      throw new Error("ImageFX cookies não configurados. Configure em Configurações.");
    }

    // Generate headlines if needed
    let headlines: string[] = [];
    if (includeHeadline) {
      headlines = await generateHeadlines(videoTitle, niche, language, LOVABLE_API_KEY);
      console.log("Generated headlines:", headlines);
    }

    // Generate 4 thumbnail variations
    const variations: ThumbnailVariation[] = [];
    
    for (let i = 0; i < 4; i++) {
      const variationStyle = VARIATION_STYLES[i];
      
      // Determine the headline to use
      let headline: string | null = null;
      if (includeHeadline) {
        if (useTitle) {
          headline = videoTitle.length > 50 ? videoTitle.substring(0, 47) + "..." : videoTitle;
        } else {
          headline = headlines[i % headlines.length];
        }
      }
      
      // Build the image generation prompt
      let imagePrompt = `${stylePromptPrefix} Create a YouTube thumbnail image (16:9 horizontal landscape, edge-to-edge full bleed composition, fill entire frame without any black bars or letterboxing). 
Style: ${style}, ${variationStyle.description}
Topic: ${videoTitle}
Niche: ${niche}${subNiche ? `, Sub-niche: ${subNiche}` : ""}`;

      if (headline && includeHeadline) {
        imagePrompt += `

IMPORTANT HEADLINE REQUIREMENT:
- Add this text as a bold, eye-catching headline on the thumbnail: "${headline}"`;

        if (referenceHeadlineStyle) {
          imagePrompt += `

HEADLINE STYLE FROM REFERENCE (FOLLOW EXACTLY):
${referenceHeadlineStyle}
- Replicate the exact style, position, font type, colors, and effects from the reference thumbnail
- Match the text placement and size proportionally
- Use the same visual treatment (shadows, outlines, gradients, glow effects)`;
        } else {
          imagePrompt += `
- The headline should be positioned prominently (typically top or bottom third of the image)
- Use a bold, impactful font style with high contrast against the background
- Consider adding text effects like: drop shadow, outline, glow, or gradient
- The text must be large enough to be readable even in small thumbnail sizes
- Match the headline style to the overall visual theme`;
        }
      }

      if (referencePrompt) {
        imagePrompt += `

REFERENCE STYLE TO FOLLOW:
${referencePrompt}
Use this reference as a guide for the overall visual style, composition, and text placement.`;
      }

      imagePrompt += `

Requirements:
- High contrast and vibrant colors
- Professional YouTube thumbnail quality
- Eye-catching composition
- Clear focal point
- ${style} style
${!includeHeadline ? '- DO NOT include any text in the image' : ''}`;

      console.log(`Generating variation ${i + 1} with style: ${variationStyle.name}, provider: ${useImageFX ? 'ImageFX' : 'Lovable'}`);
      
      let imageBase64: string | null = null;
      
      // Try ImageFX first if available
      if (useImageFX && imageFXCookies && userId) {
        imageBase64 = await generateImageWithImageFX(imagePrompt, imageFXCookies, userId);
        
        // Fallback to Lovable if ImageFX fails
        if (!imageBase64) {
          console.log(`[Thumbnail] ImageFX failed for variation ${i + 1}, falling back to Lovable`);
          imageBase64 = await generateImageWithLovable(imagePrompt, LOVABLE_API_KEY);
          shouldDebitCredits = true; // Using Lovable = debit credits
        }
      } else {
        // Use Lovable AI
        imageBase64 = await generateImageWithLovable(imagePrompt, LOVABLE_API_KEY);
      }
      
      if (!imageBase64) {
        console.error(`Failed to generate variation ${i + 1}`);
        continue;
      }

      // Generate SEO content for this variation
      const seoContent = await generateSEOContent(videoTitle, niche, variationStyle.name, language, LOVABLE_API_KEY);

      variations.push({
        variationNumber: i + 1,
        imageBase64,
        headline,
        seoDescription: seoContent.description,
        seoTags: seoContent.tags,
        prompt: imagePrompt,
        style: variationStyle.name
      });

      console.log(`Variation ${i + 1} generated successfully`);
    }

    // Debit credits if using platform (Lovable AI)
    if (userId && supabaseAdmin && shouldDebitCredits && variations.length > 0) {
      const creditsUsed = CREDIT_PRICING.THUMBNAIL_GENERATION.gemini * variations.length;
      
      const { data: currentCredits } = await supabaseAdmin
        .from('user_credits')
        .select('balance')
        .eq('user_id', userId)
        .single();

      if (currentCredits) {
        await supabaseAdmin
          .from('user_credits')
          .update({ balance: currentCredits.balance - creditsUsed })
          .eq('user_id', userId);
      }

      await supabaseAdmin.from('credit_usage').insert({
        user_id: userId,
        operation_type: 'thumbnail_generation',
        credits_used: creditsUsed,
        model_used: 'gemini-2.5-flash-image',
        details: { variations_count: variations.length, video_title: videoTitle }
      });
      
      console.log(`[Thumbnail] Debited ${creditsUsed} credits`);
    } else if (!shouldDebitCredits) {
      console.log('[Thumbnail] No credits debited (using ImageFX)');
    }

    console.log(`Generated ${variations.length} thumbnail variations`);

    return new Response(
      JSON.stringify({
        success: true,
        variations,
        headlines,
        videoTitle,
        niche,
        subNiche,
        provider: useImageFX ? 'imagefx' : 'lovable'
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in generate-thumbnail:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});