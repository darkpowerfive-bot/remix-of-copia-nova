import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SceneData {
  imageUrl: string;
  durationSeconds: number;
}

/**
 * Gera um vídeo MP4 com as imagens nas durações especificadas
 * Usa a API Creatomate para gerar o vídeo
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { scenes, fps = 30, width = 1920, height = 1080 } = await req.json() as {
      scenes: SceneData[];
      fps?: number;
      width?: number;
      height?: number;
    };

    if (!scenes || scenes.length === 0) {
      throw new Error("scenes is required");
    }

    // Calcular duração total
    const totalDuration = scenes.reduce((acc, s) => acc + s.durationSeconds, 0);
    console.log(`[Video Montage] Generating ${scenes.length} scenes, ${totalDuration}s total`);

    // Construir elementos para a timeline do vídeo
    // Cada cena é um elemento com sua imagem e duração
    const elements = scenes.map((scene, index) => {
      const startTime = scenes.slice(0, index).reduce((acc, s) => acc + s.durationSeconds, 0);
      
      return {
        type: "image",
        source: scene.imageUrl,
        duration: scene.durationSeconds,
        time: startTime,
        fit: "cover",
        animations: [
          {
            type: "scale",
            start_scale: "100%",
            end_scale: "105%",
            easing: "linear"
          }
        ]
      };
    });

    // Por enquanto, retornar a estrutura de dados que seria usada
    // Para implementação completa, precisaria de uma API de video rendering como:
    // - Creatomate
    // - Shotstack
    // - Replicate (com modelos de video)
    // - Remotion (self-hosted)

    // Gerar um arquivo de concat para FFmpeg (para uso local)
    const ffmpegConcat = scenes.map((scene, index) => {
      return `file '${scene.imageUrl}'\nduration ${scene.durationSeconds}`;
    }).join("\n");

    // Comando FFmpeg sugerido para uso local
    const ffmpegCommand = `ffmpeg -f concat -safe 0 -i concat.txt -vf "scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2,zoompan=z='min(zoom+0.0005,1.1)':d=${fps}*${totalDuration}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${width}x${height}:fps=${fps}" -c:v libx264 -pix_fmt yuv420p -r ${fps} output.mp4`;

    return new Response(
      JSON.stringify({
        success: true,
        message: "Estrutura de vídeo gerada. Para montar o vídeo automaticamente, use FFmpeg localmente ou uma API de rendering.",
        totalDuration,
        totalScenes: scenes.length,
        ffmpegConcat,
        ffmpegCommand,
        elements,
        instructions: [
          "1. Baixe as imagens do ZIP para uma pasta",
          "2. Crie o arquivo concat.txt com o conteúdo de ffmpegConcat",
          "3. Execute o comando ffmpegCommand no terminal",
          "4. O vídeo output.mp4 será gerado com as durações corretas",
          "5. Importe o vídeo no CapCut - as cenas já estarão sincronizadas!"
        ]
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[Video Montage] Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
