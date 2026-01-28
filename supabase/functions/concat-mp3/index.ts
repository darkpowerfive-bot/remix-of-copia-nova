import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function stripId3IfPresent(bytes: Uint8Array): Uint8Array {
  // ID3 header: "ID3" + ver(2) + flags(1) + size(4 synchsafe)
  if (bytes.length < 10) return bytes;
  if (bytes[0] !== 0x49 || bytes[1] !== 0x44 || bytes[2] !== 0x33) return bytes;

  const b6 = bytes[6] & 0x7f;
  const b7 = bytes[7] & 0x7f;
  const b8 = bytes[8] & 0x7f;
  const b9 = bytes[9] & 0x7f;
  const tagSize = (b6 << 21) | (b7 << 14) | (b8 << 7) | b9;
  const total = 10 + tagSize;

  if (total >= bytes.length) return bytes;
  return bytes.subarray(total);
}

async function fetchBytes(url: string): Promise<Uint8Array> {
  const res = await fetch(url);
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Failed to fetch chunk (${res.status}): ${t?.slice(0, 200)}`);
  }
  const buf = await res.arrayBuffer();
  return new Uint8Array(buf);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { urls, voiceId } = await req.json();

    if (!Array.isArray(urls) || urls.length < 2) {
      return new Response(
        JSON.stringify({ error: "urls must be an array with at least 2 items" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Identify user (required so we can store under user folder)
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userErr } = await supabaseAuth.auth.getUser();
    if (userErr || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const userId = user.id;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    console.log("[concat-mp3] Concatenating", urls.length, "chunks for user", userId);

    // Fetch all chunks (sequential to reduce burst load)
    const chunks: Uint8Array[] = [];
    let totalBytes = 0;

    for (let i = 0; i < urls.length; i++) {
      const u = String(urls[i] || "");
      if (!u.startsWith("http")) {
        throw new Error("Invalid URL in urls array");
      }

      let bytes = await fetchBytes(u);
      if (i > 0) bytes = stripId3IfPresent(bytes);

      chunks.push(bytes);
      totalBytes += bytes.byteLength;

      // Safety guard for edge runtime memory
      if (totalBytes > 50 * 1024 * 1024) {
        throw new Error("Combined audio too large to concatenate safely");
      }
    }

    const merged = new Uint8Array(totalBytes);
    let offset = 0;
    for (const c of chunks) {
      merged.set(c, offset);
      offset += c.byteLength;
    }

    const fileName = `${userId}/${Date.now()}_${(voiceId || "voice").toString().toLowerCase()}_full.mp3`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from("generated-audios")
      .upload(fileName, merged, {
        contentType: "audio/mpeg",
        upsert: false,
      });

    if (uploadError) {
      console.error("[concat-mp3] Upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload merged audio", details: uploadError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("generated-audios")
      .getPublicUrl(uploadData.path);

    console.log("[concat-mp3] Uploaded merged audio:", urlData.publicUrl);

    return new Response(
      JSON.stringify({ success: true, audioUrl: urlData.publicUrl, storagePath: uploadData.path }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("[concat-mp3] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
