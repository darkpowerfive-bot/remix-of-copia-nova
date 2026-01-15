import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VideoRequest {
  prompt: string;
  model: "sora2" | "sora2-15s" | "veo31" | "veo31-fast";
  aspect_ratio: "16:9" | "9:16" | "1:1";
  resolution: "720p" | "1080p";
}

// VEO3 API endpoint (veo3gen.co)
const VEO3_API_URL = "https://api.veo3gen.co/api/veo/text-to-video";
const VEO3_STATUS_URL = "https://api.veo3gen.co/api/veo/status";

// n8n Webhook para processamento de vídeo via browser automation
async function generateWithN8nWebhook(
  prompt: string,
  webhookUrl: string,
  aspectRatio: string,
  model: string
): Promise<{ success: boolean; videoUrl?: string; taskId?: string; status?: string; error?: string }> {
  try {
    console.log(`[n8n] Enviando para webhook: ${webhookUrl}`);
    console.log(`[n8n] Model: ${model}, Aspect: ${aspectRatio}`);

    // Construir URL com query params para GET request (compatível com browser automation)
    const url = new URL(webhookUrl);
    url.searchParams.set('prompt', prompt);
    url.searchParams.set('model', model);
    url.searchParams.set('aspect_ratio', aspectRatio);
    url.searchParams.set('duration', '8');
    url.searchParams.set('timestamp', new Date().toISOString());

    console.log(`[n8n] URL completa: ${url.toString().substring(0, 200)}...`);

    // Usar GET request (como configurado no n8n)
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Accept": "application/json",
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[n8n] Webhook error:`, response.status, errorText.substring(0, 300));
      return { success: false, error: `Erro n8n webhook: ${response.status}` };
    }

    // Verificar content type
    const contentType = response.headers.get("content-type") || "";
    const responseText = await response.text();
    console.log("[n8n] Raw response:", responseText.substring(0, 500));

    let data;
    if (contentType.includes("application/json") || responseText.trim().startsWith("{") || responseText.trim().startsWith("[")) {
      try {
        data = JSON.parse(responseText);
      } catch {
        console.log("[n8n] Não foi possível parsear JSON, tratando como texto");
        // Se for uma URL direta de vídeo
        if (responseText.includes("http") && (responseText.includes(".mp4") || responseText.includes("video"))) {
          const urlMatch = responseText.match(/https?:\/\/[^\s"'<>]+/);
          if (urlMatch) {
            return { success: true, videoUrl: urlMatch[0], status: "completed" };
          }
        }
        return { success: true, status: "processing" };
      }
    } else {
      // Resposta não JSON - pode ser URL direta
      if (responseText.includes("http")) {
        const urlMatch = responseText.match(/https?:\/\/[^\s"'<>]+/);
        if (urlMatch) {
          return { success: true, videoUrl: urlMatch[0], status: "completed" };
        }
      }
      return { success: true, status: "processing" };
    }

    console.log("[n8n] Parsed response:", JSON.stringify(data).substring(0, 500));

    // Aceitar vários formatos de resposta do n8n
    const videoUrl = data.videoUrl || data.video_url || data.url || data.result?.videoUrl || data.result?.url;
    const status = data.status || "completed";

    if (videoUrl) {
      console.log("[n8n] Video URL recebida:", videoUrl);
      return { success: true, videoUrl, status };
    }

    if (data.taskId || data.task_id) {
      return { 
        success: true, 
        taskId: data.taskId || data.task_id,
        status: "processing"
      };
    }

    // Se n8n retornou sucesso mas sem URL, consideramos em processamento
    if (data.success || data.ok) {
      return { success: true, status: "processing" };
    }

    // Se chegamos aqui mas a request foi 200 OK, consideramos como iniciado
    return { success: true, status: "processing" };

  } catch (error) {
    console.error(`[n8n] Erro:`, error);
    return { success: false, error: error instanceof Error ? error.message : "Erro ao chamar n8n webhook" };
  }
}

async function generateWithVeo3Api(
  prompt: string,
  apiKey: string,
  aspectRatio: string,
  model: string
): Promise<{ success: boolean; videoUrl?: string; taskId?: string; status?: string; error?: string }> {
  
  try {
    console.log(`[Veo3] Iniciando geração com API key`);
    console.log(`[Veo3] Model: ${model}, Aspect: ${aspectRatio}`);

    // Mapear aspect ratio para o formato da API
    const aspectRatioMap: Record<string, string> = {
      "16:9": "16:9",
      "9:16": "9:16",
      "1:1": "1:1"
    };

    // Mapear modelo para o formato da API
    const modelMap: Record<string, string> = {
      "veo31": "veo-3.0-generate-preview",
      "veo31-fast": "veo-3.0-fast-generate-preview"
    };

    const requestBody = {
      prompt: prompt,
      model: modelMap[model] || "veo-3.0-fast-generate-preview",
      aspect_ratio: aspectRatioMap[aspectRatio] || "16:9",
      duration: 8 // 8 segundos padrão
    };

    console.log(`[Veo3] Request body:`, JSON.stringify(requestBody));

    const response = await fetch(VEO3_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Veo3] API error:`, response.status, errorText.substring(0, 300));
      
      if (response.status === 401) {
        return { success: false, error: "API Key Veo3 inválida. Configure no Painel Admin." };
      }
      if (response.status === 402) {
        return { success: false, error: "Créditos Veo3 insuficientes." };
      }
      if (response.status === 429) {
        return { success: false, error: "Rate limit Veo3. Aguarde alguns minutos." };
      }
      
      return { success: false, error: `Erro Veo3: ${response.status}` };
    }

    const data = await response.json();
    console.log("[Veo3] Response:", JSON.stringify(data).substring(0, 500));

    // A API pode retornar o vídeo diretamente ou um task_id para polling
    if (data.video_url || data.videoUrl) {
      const videoUrl = data.video_url || data.videoUrl;
      console.log("[Veo3] Video URL recebida:", videoUrl);
      return { success: true, videoUrl };
    }

    if (data.task_id || data.taskId || data.id) {
      const taskId = data.task_id || data.taskId || data.id;
      console.log("[Veo3] Task ID recebido:", taskId);
      
      // Poll para status (até 60 segundos)
      for (let i = 0; i < 12; i++) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // 5s delay
        
        const statusResponse = await fetch(`${VEO3_STATUS_URL}/${taskId}`, {
          headers: { "X-API-Key": apiKey }
        });
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log(`[Veo3] Status check ${i + 1}:`, statusData.status);
          
          if (statusData.status === "completed" || statusData.status === "success") {
            const videoUrl = statusData.video_url || statusData.videoUrl || statusData.result?.video_url;
            if (videoUrl) {
              return { success: true, videoUrl };
            }
          }
          
          if (statusData.status === "failed" || statusData.status === "error") {
            return { success: false, error: statusData.error || "Geração falhou" };
          }
        }
      }
      
      // Ainda processando após polling
      return { 
        success: true, 
        taskId,
        status: "processing"
      };
    }

    // Resposta inesperada
    console.log("[Veo3] Resposta inesperada:", JSON.stringify(data));
    return { success: false, error: "Resposta inesperada da API Veo3" };

  } catch (error) {
    console.error(`[Veo3] Erro:`, error);
    return { success: false, error: error instanceof Error ? error.message : "Erro desconhecido" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar autenticação
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Usuário não autenticado' }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { prompt, model, aspect_ratio } = await req.json() as VideoRequest;

    if (!prompt || !model) {
      return new Response(JSON.stringify({ error: 'Prompt e modelo são obrigatórios' }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[Video Generation] Model: ${model}, Aspect: ${aspect_ratio}`);
    console.log(`[Video Generation] Prompt: ${prompt.substring(0, 100)}...`);

    // Buscar API keys do admin_settings
    const { data: adminSettings } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'api_keys')
      .maybeSingle();

    const apiKeysValue = adminSettings?.value as Record<string, string> | null;

    // Buscar configuração do n8n webhook
    const { data: n8nSettings } = await supabase
      .from('admin_settings')
      .select('value')
      .eq('key', 'n8n_video_webhook')
      .maybeSingle();

    const n8nWebhookUrl = (n8nSettings?.value as Record<string, string>)?.webhook_url;

    // Para modelos Veo3, priorizar n8n webhook se configurado
    if (model === 'veo31' || model === 'veo31-fast') {
      
      // Primeiro tentar n8n webhook
      if (n8nWebhookUrl) {
        console.log(`[Video Generation] Usando n8n webhook`);
        
        const result = await generateWithN8nWebhook(prompt, n8nWebhookUrl, aspect_ratio, model);

        if (result.success) {
          if (result.status === "processing") {
            return new Response(JSON.stringify({
              success: true,
              status: 'processing',
              task_id: result.taskId,
              message: 'Vídeo em processamento no n8n. Pode levar alguns minutos.',
            }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }

          return new Response(JSON.stringify({
            success: true,
            status: 'completed',
            video_url: result.videoUrl,
            model: model,
            aspect_ratio: aspect_ratio,
          }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        // Se n8n falhou, tentar fallback para API direta
        console.log(`[Video Generation] n8n falhou, tentando API direta: ${result.error}`);
      }

      // Fallback: usar API veo3gen.co diretamente
      const veo3ApiKey = apiKeysValue?.veo3 || Deno.env.get('VEO3_API_KEY');

      if (!veo3ApiKey && !n8nWebhookUrl) {
        console.error('[Video Generation] Veo3 API key e n8n webhook não configurados');
        return new Response(JSON.stringify({ 
          error: 'Configure o Webhook n8n ou a API Key Veo3 no Painel Admin → APIs.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!veo3ApiKey) {
        return new Response(JSON.stringify({ 
          error: 'n8n webhook falhou e API Key Veo3 não está configurada como fallback.' 
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[Video Generation] Usando API Veo3 direta`);

      const result = await generateWithVeo3Api(prompt, veo3ApiKey, aspect_ratio, model);

      if (!result.success) {
        return new Response(JSON.stringify({ 
          error: result.error || 'Erro ao gerar vídeo com Veo3' 
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (result.status === "processing") {
        return new Response(JSON.stringify({
          success: true,
          status: 'processing',
          task_id: result.taskId,
          message: 'Vídeo em processamento. Pode levar alguns minutos.',
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: true,
        status: 'completed',
        video_url: result.videoUrl,
        model: model,
        aspect_ratio: aspect_ratio,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Para Sora e outros modelos, usar Laozhang API
    const laozhangApiKey = apiKeysValue?.laozhang || Deno.env.get('LAOZHANG_API_KEY');

    if (!laozhangApiKey) {
      console.error('[Video Generation] Laozhang API key not found');
      return new Response(JSON.stringify({ error: 'API Laozhang não configurada' }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mapear modelo para nome da API Laozhang
    let modelName = '';
    
    if (model === 'sora2') {
      modelName = aspect_ratio === '9:16' ? 'sora_video2' : 'sora_video2-landscape';
    } else if (model === 'sora2-15s') {
      modelName = aspect_ratio === '9:16' ? 'sora_video2-15s' : 'sora_video2-landscape-15s';
    } else {
      modelName = 'sora_video2-landscape';
    }

    console.log(`[Video Generation] Using Laozhang model: ${modelName}`);

    const requestBody = {
      model: modelName,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            }
          ]
        }
      ],
      stream: true,
    };

    const laozhangResponse = await fetch('https://api.laozhang.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${laozhangApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!laozhangResponse.ok) {
      const errorText = await laozhangResponse.text();
      console.error('[Video Generation] Laozhang API error:', laozhangResponse.status, errorText);
      
      if (laozhangResponse.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit atingido. Tente novamente em alguns minutos.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ 
        error: 'Erro ao gerar vídeo.',
        details: errorText.substring(0, 200)
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Processar resposta streaming
    const reader = laozhangResponse.body?.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';
    let videoUrl = '';

    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        fullContent += chunk;
        
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ') && !line.includes('[DONE]')) {
            try {
              const jsonStr = line.slice(6);
              if (jsonStr.trim()) {
                const data = JSON.parse(jsonStr);
                const content = data.choices?.[0]?.delta?.content || data.choices?.[0]?.message?.content;
                
                if (content) {
                  const urlMatch = content.match(/https?:\/\/[^\s"']+\.(mp4|webm|mov)/i);
                  if (urlMatch) {
                    videoUrl = urlMatch[0];
                  }
                  if (content.startsWith('http') && (content.includes('.mp4') || content.includes('video'))) {
                    videoUrl = content.trim().split(/[\s"']/)[0];
                  }
                }
              }
            } catch {
              // Continue
            }
          }
        }
      }
    }

    console.log('[Video Generation] Extracted video URL:', videoUrl);

    if (videoUrl) {
      return new Response(JSON.stringify({
        success: true,
        status: 'completed',
        video_url: videoUrl,
        model: modelName,
        aspect_ratio: aspect_ratio,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Procurar URL no conteúdo
    const urlPattern = /https?:\/\/[^\s"'<>]+/g;
    const urls = fullContent.match(urlPattern);
    const videoUrlFromContent = urls?.find(url => 
      url.includes('video') || 
      url.includes('.mp4') || 
      url.includes('.webm')
    );

    if (videoUrlFromContent) {
      return new Response(JSON.stringify({
        success: true,
        status: 'completed',
        video_url: videoUrlFromContent,
        model: modelName,
        aspect_ratio: aspect_ratio,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      status: 'processing',
      message: 'Vídeo em processamento. Pode levar alguns minutos.',
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error('[Video Generation] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro desconhecido' 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
