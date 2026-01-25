import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Credit costs for TTS operations (Lemonfox is cheaper)
const TTS_CREDIT_COSTS = {
  basic: 1,      // Up to 500 characters
  medium: 2,     // Up to 2000 characters
  large: 4,      // Up to 4000 characters
  extra: 6,      // Over 4000 characters
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
    const { text, voiceId, language, speed } = await req.json();

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

    // Get user from token
    let userId: string | null = null;
    const authHeader = req.headers.get("Authorization");
    
    if (authHeader) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey, {
        global: { headers: { Authorization: authHeader } },
      });
      
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
    }

    const creditsNeeded = calculateCreditCost(text.length);

    // Check and debit credits if user is authenticated
    if (userId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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

    // Generate audio using Lemonfox TTS API
    console.log("Generating TTS with Lemonfox for text length:", text.length);
    
    // Force PT-BR voices to avoid fallback accents
    const normalizedLanguage = (language || "pt-br").toLowerCase();
    const ptBrVoices = new Set(["clara", "tiago", "bom"]);
    const resolvedVoice =
      normalizedLanguage === "pt-br" && !ptBrVoices.has((voiceId || "").toLowerCase())
        ? "clara"
        : (voiceId || (normalizedLanguage === "pt-br" ? "clara" : "nova"));

    const ttsResponse = await fetch("https://api.lemonfox.ai/v1/audio/speech", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LEMONFOX_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: text,
        voice: resolvedVoice,
        // Lemonfox docs: en-us/en-gb/.../pt-br (lowercase)
        language: normalizedLanguage,
        speed: speed || 1.0,
        response_format: "mp3",
      }),
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error("Lemonfox TTS error:", ttsResponse.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to generate audio", details: errorText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert audio to base64
    const audioBuffer = await ttsResponse.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
    
    // Estimate duration (words / 2.5 words per second)
    const estimatedDuration = Math.ceil(text.split(/\s+/).length / 2.5);

    console.log("TTS generated successfully, audio size:", audioBuffer.byteLength);

    return new Response(
      JSON.stringify({
        success: true,
        audioBase64: base64Audio,
        audioUrl: `data:audio/mp3;base64,${base64Audio}`,
        duration: estimatedDuration,
        creditsUsed: creditsNeeded,
        voice: resolvedVoice,
        language: normalizedLanguage,
        textLength: text.length,
        provider: "lemonfox"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
