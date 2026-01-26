import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Credit costs for TTS operations - 300x profit margin
// Deepgram Aura-2 cost: $0.000003/char = $3/1M chars = R$0.018/1K chars
// 1 credit (R$0.05) per 2500 chars = ~275x margin
function calculateCreditCost(textLength: number): number {
  return Math.max(1, Math.ceil(textLength / 2500));
}

// Deepgram Aura-2 native voices by language
// The voice ID format is: aura-2-{name}-{lang}
// See: https://developers.deepgram.com/docs/tts-models
const DEEPGRAM_VOICES: Record<string, { default: string; voices: string[] }> = {
  "en-us": {
    default: "aura-2-asteria-en",
    voices: ["aura-2-asteria-en", "aura-2-luna-en", "aura-2-stella-en", "aura-2-athena-en", "aura-2-hera-en", "aura-2-orion-en", "aura-2-arcas-en", "aura-2-perseus-en", "aura-2-angus-en", "aura-2-orpheus-en", "aura-2-helios-en", "aura-2-zeus-en"]
  },
  "en-gb": {
    default: "aura-2-athena-en",
    voices: ["aura-2-athena-en", "aura-2-luna-en", "aura-2-stella-en", "aura-2-orion-en", "aura-2-perseus-en"]
  },
  "pt-br": {
    default: "aura-2-thalia-pt",
    voices: ["aura-2-thalia-pt", "aura-2-stella-en"]
  },
  "es": {
    default: "aura-2-lucia-es",
    voices: ["aura-2-lucia-es", "aura-2-maria-es", "aura-2-carlos-es"]
  },
  "fr": {
    default: "aura-2-chloe-fr",
    voices: ["aura-2-chloe-fr", "aura-2-marie-fr", "aura-2-louis-fr"]
  },
  "de": {
    default: "aura-2-hannah-de",
    voices: ["aura-2-hannah-de", "aura-2-lena-de", "aura-2-felix-de"]
  },
  "it": {
    default: "aura-2-giulia-it",
    voices: ["aura-2-giulia-it", "aura-2-sofia-it", "aura-2-marco-it"]
  },
  "ja": {
    default: "aura-2-sakura-ja",
    voices: ["aura-2-sakura-ja", "aura-2-yuki-ja", "aura-2-kenji-ja"]
  },
  "nl": {
    default: "aura-2-emma-nl",
    voices: ["aura-2-emma-nl", "aura-2-daan-nl"]
  },
  "zh": {
    default: "aura-2-luna-en", // fallback to English
    voices: ["aura-2-luna-en", "aura-2-stella-en"]
  },
  "hi": {
    default: "aura-2-luna-en", // fallback to English
    voices: ["aura-2-luna-en", "aura-2-orion-en"]
  }
};

// Legacy voice ID mapping (for backwards compatibility)
const VOICE_MAPPING: Record<string, string> = {
  // Female voices - legacy to new
  "clara": "aura-2-thalia-pt",
  "nova": "aura-2-stella-en",
  "alice": "aura-2-athena-en",
  "sarah": "aura-2-luna-en",
  "bella": "aura-2-hera-en",
  "jessica": "aura-2-asteria-en",
  "emma": "aura-2-luna-en",
  "lily": "aura-2-stella-en",
  "sara": "aura-2-giulia-it",
  "dora": "aura-2-lucia-es",
  "sakura": "aura-2-sakura-ja",
  "xiaoxiao": "aura-2-luna-en",
  // Male voices - legacy to new
  "tiago": "aura-2-orion-en",
  "papai": "aura-2-zeus-en",
  "michael": "aura-2-perseus-en",
  "daniel": "aura-2-angus-en",
  "george": "aura-2-orpheus-en",
  "adam": "aura-2-helios-en",
  "eric": "aura-2-arcas-en",
  "liam": "aura-2-orion-en",
  "nicola": "aura-2-marco-it",
  "alex": "aura-2-carlos-es"
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId, language, speed = 1.0, isPreview = false } = await req.json();

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const DEEPGRAM_API_KEY = Deno.env.get("DEEPGRAM_API_KEY");
    if (!DEEPGRAM_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Deepgram API key not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from token
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    
    if (authHeader) {
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } },
      });
      
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
    }

    // Skip credit check for previews
    if (!isPreview) {
      const creditsNeeded = calculateCreditCost(text.length);

      if (userId) {
        const { data: credits, error: creditsError } = await supabaseAdmin
          .from("user_credits")
          .select("balance")
          .eq("user_id", userId)
          .maybeSingle();

        if (creditsError) {
          console.error("Error fetching credits:", creditsError);
          return new Response(
            JSON.stringify({ error: "Unable to verify credits" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const currentBalance = credits?.balance || 0;
        if (currentBalance < creditsNeeded) {
          return new Response(
            JSON.stringify({ 
              error: "Insufficient credits", 
              required: creditsNeeded, 
              available: currentBalance 
            }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Debit credits
        await supabaseAdmin
          .from("user_credits")
          .update({ balance: currentBalance - creditsNeeded, updated_at: new Date().toISOString() })
          .eq("user_id", userId);

        // Log credit usage
        await supabaseAdmin.from("credit_usage").insert({
          user_id: userId,
          operation_type: "tts_generation_deepgram",
          credits_used: creditsNeeded,
          model_used: "deepgram-aura-2",
          details: { text_length: text.length, voice: voiceId, language, speed }
        });

        // Log transaction
        await supabaseAdmin.from("credit_transactions").insert({
          user_id: userId,
          amount: -creditsNeeded,
          transaction_type: "debit",
          description: `TTS Deepgram: ${text.substring(0, 50)}...`
        });
      }
    }

    // Resolve voice
    const normalizedLanguage = (language || "en-us").toLowerCase();
    const lowerVoiceId = (voiceId || "").toLowerCase();

    // Check if voiceId is already a valid Aura-2 voice ID (starts with "aura-2-")
    let resolvedVoice: string;
    if (lowerVoiceId.startsWith("aura-2-")) {
      // Direct Aura-2 voice ID - use as-is
      resolvedVoice = lowerVoiceId;
    } else if (lowerVoiceId.startsWith("aura-")) {
      // Legacy Aura-1 format - try to upgrade to Aura-2
      const aura2Version = lowerVoiceId.replace("aura-", "aura-2-");
      resolvedVoice = aura2Version;
    } else if (VOICE_MAPPING[lowerVoiceId]) {
      // Legacy voice name mapping
      resolvedVoice = VOICE_MAPPING[lowerVoiceId];
    } else {
      // Default to language-specific voice
      const langConfig = DEEPGRAM_VOICES[normalizedLanguage] || DEEPGRAM_VOICES["en-us"];
      resolvedVoice = langConfig.default;
    }

    console.log("Generating TTS with Deepgram for text length:", text.length, "voice:", resolvedVoice);

    // Clean up text
    const processedText = text
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .replace(/\n\n/g, ' ')
      .replace(/\n/g, ' ')
      .replace(/\s{2,}/g, ' ')
      .replace(/\s+([.!?,;:])/g, '$1')
      .trim();

    // Call Deepgram TTS API
    const ttsUrl = `https://api.deepgram.com/v1/speak?model=${resolvedVoice}&encoding=mp3`;

    const ttsResponse = await fetch(ttsUrl, {
      method: "POST",
      headers: {
        "Authorization": `Token ${DEEPGRAM_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: processedText
      }),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error("Deepgram TTS error:", ttsResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate audio", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    const audioBytes = new Uint8Array(audioBuffer);
    
    console.log("TTS generated successfully, audio size:", audioBuffer.byteLength);

    // Calculate duration estimate
    const wordCount = text.trim().split(/\s+/).length;
    const wordsPerSecond = 2.5 * (speed || 1.0);
    const estimatedDuration = Math.ceil(wordCount / wordsPerSecond);

    const mimeType = 'audio/mpeg';

    // For previews or small files, return base64 directly
    if (isPreview || audioBuffer.byteLength < 500000) {
      let binaryString = '';
      const chunkSize = 8192;
      for (let i = 0; i < audioBytes.length; i += chunkSize) {
        const chunk = audioBytes.subarray(i, Math.min(i + chunkSize, audioBytes.length));
        binaryString += String.fromCharCode(...chunk);
      }
      const base64Audio = btoa(binaryString);

      return new Response(
        JSON.stringify({
          success: true,
          audioBase64: base64Audio,
          audioUrl: `data:${mimeType};base64,${base64Audio}`,
          duration: estimatedDuration,
          creditsUsed: isPreview ? 0 : calculateCreditCost(text.length),
          voice: resolvedVoice,
          language: normalizedLanguage,
          textLength: text.length,
          provider: "deepgram",
          format: "mp3"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For larger files, upload to Supabase Storage
    if (userId) {
      const fileName = `${userId}/${Date.now()}_deepgram.mp3`;
      
      const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
        .from('generated-audios')
        .upload(fileName, audioBytes, {
          contentType: mimeType,
          upsert: false
        });

      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        // Fallback: try to return base64 for medium files
        if (audioBuffer.byteLength < 2000000) {
          let binaryString = '';
          const chunkSize = 8192;
          for (let i = 0; i < audioBytes.length; i += chunkSize) {
            const chunk = audioBytes.subarray(i, Math.min(i + chunkSize, audioBytes.length));
            binaryString += String.fromCharCode(...chunk);
          }
          const base64Audio = btoa(binaryString);
          
          return new Response(
            JSON.stringify({
              success: true,
              audioBase64: base64Audio,
              audioUrl: `data:${mimeType};base64,${base64Audio}`,
              duration: estimatedDuration,
              creditsUsed: calculateCreditCost(text.length),
              voice: resolvedVoice,
              language: normalizedLanguage,
              textLength: text.length,
              provider: "deepgram",
              format: "mp3"
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        
        return new Response(
          JSON.stringify({ error: "Failed to save audio", details: uploadError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get public URL
      const { data: urlData } = supabaseAdmin.storage
        .from('generated-audios')
        .getPublicUrl(uploadData.path);

      console.log("Audio uploaded to storage:", urlData.publicUrl);

      return new Response(
        JSON.stringify({
          success: true,
          audioUrl: urlData.publicUrl,
          storagePath: uploadData.path,
          duration: estimatedDuration,
          creditsUsed: calculateCreditCost(text.length),
          voice: resolvedVoice,
          language: normalizedLanguage,
          textLength: text.length,
          provider: "deepgram",
          format: "mp3"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // No user - return error for large files
    return new Response(
      JSON.stringify({ error: "Authentication required for large audio files" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("TTS Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
