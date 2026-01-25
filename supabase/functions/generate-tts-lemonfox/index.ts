import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Credit costs for TTS operations
const TTS_CREDIT_COSTS = {
  basic: 1,
  medium: 2,
  large: 4,
  extra: 6,
};

function calculateCreditCost(textLength: number): number {
  if (textLength <= 500) return TTS_CREDIT_COSTS.basic;
  if (textLength <= 2000) return TTS_CREDIT_COSTS.medium;
  if (textLength <= 4000) return TTS_CREDIT_COSTS.large;
  return TTS_CREDIT_COSTS.extra;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text, voiceId, language, speed, quality = 'high', isPreview = false } = await req.json();

    if (!text || text.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LEMONFOX_API_KEY = Deno.env.get("LEMONFOX_API_KEY");
    if (!LEMONFOX_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Lemonfox API key not configured" }),
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
          operation_type: "tts_generation_lemonfox",
          credits_used: creditsNeeded,
          model_used: "lemonfox",
          details: { text_length: text.length, voice: voiceId, language, speed }
        });

        // Log transaction
        await supabaseAdmin.from("credit_transactions").insert({
          user_id: userId,
          amount: -creditsNeeded,
          transaction_type: "debit",
          description: `TTS Lemonfox: ${text.substring(0, 50)}...`
        });
      }
    }

    // Generate audio using Lemonfox TTS API
    console.log("Generating TTS with Lemonfox for text length:", text.length, "language:", language, "voice:", voiceId);
    
    const normalizedLanguage = (language || "pt-br").toLowerCase();
    const lowerVoiceId = (voiceId || "").toLowerCase();

    const voicesByLanguage: Record<string, Set<string>> = {
      "pt-br": new Set(["clara", "tiago", "papai"]),
      "en-us": new Set(["heart", "bella", "michael", "alloy", "aoede", "kore", "jessica", "nicole", "nova", "river", "sarah", "sky", "echo", "eric", "fenrir", "liam", "onyx", "puck", "adam", "santa"]),
      "en-gb": new Set(["alice", "emma", "isabella", "lily", "daniel", "fable", "george", "lewis"]),
      "ja": new Set(["sakura", "gongitsune", "nezumi", "tebukuro", "kumo"]),
      "zh": new Set(["xiaobei", "xiaoni", "xiaoxiao", "xiaoyi", "yunjian", "yunxi", "yunxia", "yunyang"]),
      "es": new Set(["dora", "alex", "noel"]),
      "fr": new Set(["siwis"]),
      "hi": new Set(["alpha", "beta", "omega", "psi"]),
      "it": new Set(["sara", "nicola"]),
    };

    const validVoices = voicesByLanguage[normalizedLanguage] || voicesByLanguage["en-us"];

    const defaultVoices: Record<string, string> = {
      "pt-br": "clara",
      "en-us": "nova",
      "en-gb": "alice",
      "ja": "sakura",
      "zh": "xiaoxiao",
      "es": "dora",
      "fr": "siwis",
      "hi": "alpha",
      "it": "sara",
    };

    const resolvedVoice = validVoices.has(lowerVoiceId)
      ? lowerVoiceId
      : (defaultVoices[normalizedLanguage] || "heart");

    console.log("Resolved voice:", resolvedVoice, "for language:", normalizedLanguage);

    // Add natural pauses with longer breaks between sentences
    // Use double ellipsis for sentence endings to create a breath pause
    const processedText = text
      .replace(/\n\n+/g, '...... ') // Paragraph breaks: longer pause
      .replace(/\n/g, '.... ') // Single line breaks: medium pause  
      .replace(/([.!?。！？])\s+/g, '$1.... ') // Sentence endings: natural breath pause
      .replace(/([,;:])\s+/g, '$1.. ') // Commas/semicolons: short pause
      .replace(/\s{2,}/g, ' ') // Normalize multiple spaces
      .trim();

    // ALWAYS use MP3 for Edge Functions to avoid memory issues
    // FLAC/WAV files are too large (80MB+) and cause memory limit exceeded
    const audioFormat = 'mp3';
    const mimeType = 'audio/mpeg';

    const requestBody: Record<string, unknown> = {
      input: processedText,
      voice: resolvedVoice,
      language: normalizedLanguage,
      speed: speed || 1.0,
      response_format: audioFormat,
    };

    console.log("Lemonfox request body:", JSON.stringify(requestBody));

    const ttsResponse = await fetch("https://api.lemonfox.ai/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LEMONFOX_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error("Lemonfox TTS error:", ttsResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate audio", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    const audioBytes = new Uint8Array(audioBuffer);
    
    console.log("TTS generated successfully, audio size:", audioBuffer.byteLength);

    // For previews, return small base64 directly
    if (isPreview || audioBuffer.byteLength < 500000) {
      // Small file: convert to base64 in chunks
      let binaryString = '';
      const chunkSize = 8192;
      for (let i = 0; i < audioBytes.length; i += chunkSize) {
        const chunk = audioBytes.subarray(i, Math.min(i + chunkSize, audioBytes.length));
        binaryString += String.fromCharCode(...chunk);
      }
      const base64Audio = btoa(binaryString);
      
      const estimatedDuration = Math.ceil(text.split(/\s+/).length / 2.5);

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
          provider: "lemonfox",
          format: audioFormat
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // For larger files, upload to Supabase Storage
    if (userId) {
      const fileName = `${userId}/${Date.now()}_${resolvedVoice}.${audioFormat}`;
      
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
              duration: Math.ceil(text.split(/\s+/).length / 2.5),
              creditsUsed: calculateCreditCost(text.length),
              voice: resolvedVoice,
              language: normalizedLanguage,
              textLength: text.length,
              provider: "lemonfox",
              format: audioFormat
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

      const estimatedDuration = Math.ceil(text.split(/\s+/).length / 2.5);

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
          provider: "lemonfox",
          format: audioFormat
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
