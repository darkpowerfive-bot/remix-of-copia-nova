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

// Deepgram Aura voices - correct format: aura-{name}-{lang}
// See: https://developers.deepgram.com/docs/tts-models
const DEEPGRAM_VOICES: Record<string, { default: string; voices: string[] }> = {
  "en-us": {
    default: "aura-asteria-en",
    voices: ["aura-asteria-en", "aura-luna-en", "aura-stella-en", "aura-athena-en", "aura-hera-en", "aura-orion-en", "aura-arcas-en", "aura-perseus-en", "aura-angus-en", "aura-orpheus-en", "aura-helios-en", "aura-zeus-en"]
  },
  "en-gb": {
    default: "aura-athena-en",
    voices: ["aura-athena-en", "aura-luna-en", "aura-stella-en", "aura-orion-en", "aura-perseus-en"]
  },
  "pt-br": {
    default: "aura-stella-en",
    voices: ["aura-stella-en", "aura-luna-en", "aura-athena-en", "aura-asteria-en", "aura-hera-en", "aura-orion-en", "aura-zeus-en", "aura-perseus-en", "aura-arcas-en", "aura-helios-en"]
  },
  "es": {
    default: "aura-stella-en",
    voices: ["aura-stella-en", "aura-luna-en", "aura-athena-en", "aura-orion-en", "aura-perseus-en", "aura-helios-en"]
  },
  "fr": {
    default: "aura-athena-en",
    voices: ["aura-athena-en", "aura-luna-en", "aura-stella-en", "aura-orion-en", "aura-perseus-en"]
  },
  "de": {
    default: "aura-athena-en",
    voices: ["aura-athena-en", "aura-luna-en", "aura-orion-en", "aura-zeus-en"]
  },
  "it": {
    default: "aura-stella-en",
    voices: ["aura-stella-en", "aura-luna-en", "aura-athena-en", "aura-orion-en", "aura-perseus-en"]
  },
  "ja": {
    default: "aura-luna-en",
    voices: ["aura-luna-en", "aura-stella-en", "aura-athena-en", "aura-orion-en", "aura-perseus-en"]
  },
  "nl": {
    default: "aura-luna-en",
    voices: ["aura-luna-en", "aura-athena-en", "aura-orion-en"]
  },
  "zh": {
    default: "aura-luna-en",
    voices: ["aura-luna-en", "aura-stella-en"]
  },
  "hi": {
    default: "aura-luna-en",
    voices: ["aura-luna-en", "aura-orion-en"]
  }
};

// Legacy voice ID mapping (for backwards compatibility)
const VOICE_MAPPING: Record<string, string> = {
  // Female voices - legacy to new
  "clara": "aura-stella-en",
  "nova": "aura-stella-en",
  "alice": "aura-athena-en",
  "sarah": "aura-luna-en",
  "bella": "aura-hera-en",
  "jessica": "aura-asteria-en",
  "emma": "aura-luna-en",
  "lily": "aura-stella-en",
  "sara": "aura-stella-en",
  "dora": "aura-stella-en",
  "sakura": "aura-luna-en",
  "xiaoxiao": "aura-luna-en",
  // Male voices - legacy to new
  "tiago": "aura-orion-en",
  "papai": "aura-zeus-en",
  "michael": "aura-perseus-en",
  "daniel": "aura-angus-en",
  "george": "aura-orpheus-en",
  "adam": "aura-helios-en",
  "eric": "aura-arcas-en",
  "liam": "aura-orion-en",
  "nicola": "aura-perseus-en",
  "alex": "aura-arcas-en"
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

    // Check if voiceId is already a valid Aura voice ID (starts with "aura-")
    let resolvedVoice: string;
    if (lowerVoiceId.startsWith("aura-") && !lowerVoiceId.startsWith("aura-2-")) {
      // Direct Aura voice ID - use as-is (e.g., aura-stella-en)
      resolvedVoice = lowerVoiceId;
    } else if (VOICE_MAPPING[lowerVoiceId]) {
      // Legacy voice name mapping (e.g., "clara" -> "aura-stella-en")
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
