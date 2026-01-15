import { supabase } from "@/integrations/supabase/client";

// Mapeamento de tipos de operação para nomes legíveis das ferramentas
export const CREDIT_TOOLS_MAP: Record<string, { name: string; icon: string; description: string }> = {
  // Análise de Títulos
  'title_analysis': { 
    name: 'Análise de Títulos', 
    icon: '📊', 
    description: 'Análise de título de vídeo com IA' 
  },
  'analyze_titles': { 
    name: 'Análise de Títulos', 
    icon: '📊', 
    description: 'Análise de título de vídeo com IA' 
  },
  'analyze_video_titles': { 
    name: 'Análise de Títulos', 
    icon: '📊', 
    description: 'Análise de título de vídeo com IA' 
  },
  
  // Gerador de Thumbnails
  'thumbnail_generation': { 
    name: 'Gerador de Thumbnails', 
    icon: '🖼️', 
    description: 'Geração de thumbnail com IA' 
  },
  'generate_thumbnail': { 
    name: 'Gerador de Thumbnails', 
    icon: '🖼️', 
    description: 'Geração de thumbnail com IA' 
  },
  
  // Gerador de Scripts
  'script_generation': { 
    name: 'Gerador de Scripts', 
    icon: '📝', 
    description: 'Geração de roteiro para vídeo' 
  },
  'generate_script': { 
    name: 'Gerador de Scripts', 
    icon: '📝', 
    description: 'Geração de roteiro para vídeo' 
  },
  'generate_script_with_formula': { 
    name: 'Gerador de Scripts', 
    icon: '📝', 
    description: 'Geração de roteiro para vídeo' 
  },
  
  // Gerador de Cenas
  'scene_generation': { 
    name: 'Gerador de Cenas', 
    icon: '🎬', 
    description: 'Geração de descrição de cenas' 
  },
  'generate_scenes': { 
    name: 'Gerador de Cenas', 
    icon: '🎬', 
    description: 'Geração de descrição de cenas' 
  },
  
  // Gerador de Voz (TTS)
  'voice_generation': { 
    name: 'Gerador de Voz', 
    icon: '🎙️', 
    description: 'Conversão de texto para áudio (TTS)' 
  },
  'generate_tts': { 
    name: 'Gerador de Voz', 
    icon: '🎙️', 
    description: 'Conversão de texto para áudio (TTS)' 
  },
  'tts': { 
    name: 'Gerador de Voz', 
    icon: '🎙️', 
    description: 'Conversão de texto para áudio (TTS)' 
  },
  
  // Gerador de Imagens / Prompts de Imagem
  'image_generation': { 
    name: 'Prompt de imagem', 
    icon: '🎨', 
    description: 'Geração de imagem com IA' 
  },
  'generate_image': { 
    name: 'Prompt de imagem', 
    icon: '🎨', 
    description: 'Geração de imagem com IA' 
  },
  'prompt_image': { 
    name: 'Prompt de imagem', 
    icon: '🎨', 
    description: 'Geração de prompt de imagem' 
  },
  
  // Transcrição de Vídeo
  'transcription': { 
    name: 'Transcrição de Vídeo', 
    icon: '📃', 
    description: 'Transcrição automática de vídeo' 
  },
  'transcribe_video': { 
    name: 'Transcrição de Vídeo', 
    icon: '📃', 
    description: 'Transcrição automática de vídeo' 
  },
  
  // Análise de Canal
  'channel_analysis': { 
    name: 'Análise de Canal', 
    icon: '📺', 
    description: 'Análise completa de canal do YouTube' 
  },
  'analyze_channel': { 
    name: 'Análise de Canal', 
    icon: '📺', 
    description: 'Análise completa de canal do YouTube' 
  },
  
  // Análise de Transcrição
  'transcript_analysis': { 
    name: 'Análise de Transcrição', 
    icon: '📄', 
    description: 'Análise de transcrição com IA' 
  },
  'analyze_transcript': { 
    name: 'Análise de Transcrição', 
    icon: '📄', 
    description: 'Análise de transcrição com IA' 
  },
  
  // Assistente IA
  'ai_assistant': { 
    name: 'Assistente IA', 
    icon: '🤖', 
    description: 'Consulta ao assistente de IA' 
  },
  
  // Imagens em Lote
  'batch_images': { 
    name: 'Imagens em Lote', 
    icon: '🖼️', 
    description: 'Geração de múltiplas imagens' 
  },
  
  // Gerador de Vídeo
  'video_generation': { 
    name: 'Gerador de Vídeo', 
    icon: '🎥', 
    description: 'Geração de vídeo com IA' 
  },
  
  // Análise de Fórmula de Script
  'analyze_script_formula': { 
    name: 'Análise de Fórmula', 
    icon: '🧪', 
    description: 'Análise de fórmula de script' 
  },
  
  // Exploração de Nicho
  'explore_niche': { 
    name: 'Exploração de Nicho', 
    icon: '🔍', 
    description: 'Exploração de nicho de mercado' 
  },
  
  // Busca de Canais
  'search_channels': { 
    name: 'Busca de Canais', 
    icon: '🔎', 
    description: 'Busca de canais similares' 
  },
  
  // Análise Viral
  'viral_analysis': { 
    name: 'Análise Viral', 
    icon: '📈', 
    description: 'Análise de potencial viral' 
  },
  
  // Análise de Múltiplos Canais
  'analyze_multiple_channels': { 
    name: 'Análise de Canais', 
    icon: '📊', 
    description: 'Análise comparativa de múltiplos canais' 
  },
  
  // Transações administrativas
  'add': { 
    name: 'Adição de Créditos', 
    icon: '➕', 
    description: 'Créditos adicionados manualmente ou por compra' 
  },
  'deduct': { 
    name: 'Dedução de Créditos', 
    icon: '➖', 
    description: 'Créditos deduzidos' 
  },
  'refund': { 
    name: 'Reembolso', 
    icon: '↩️', 
    description: 'Créditos reembolsados por falha' 
  },
  'purchase': { 
    name: 'Compra de Créditos', 
    icon: '💳', 
    description: 'Compra de pacote de créditos' 
  },
  'bonus': { 
    name: 'Bônus de Créditos', 
    icon: '🎁', 
    description: 'Créditos de bônus' 
  },
  'subscription': { 
    name: 'Créditos de Assinatura', 
    icon: '⭐', 
    description: 'Créditos mensais do plano' 
  },
};

// Mapeamento de modelos de IA para nomes amigáveis
export const AI_MODELS_MAP: Record<string, string> = {
  'gpt-4o': 'GPT-4o',
  'gpt-4o-mini': 'GPT-4o Mini',
  'gpt-4': 'GPT-4',
  'gpt-3.5-turbo': 'GPT-3.5',
  'claude-3-opus': 'Claude 3 Opus',
  'claude-3-sonnet': 'Claude 3 Sonnet',
  'claude-3-haiku': 'Claude 3 Haiku',
  'claude-3.5-sonnet': 'Sonnet 3.5',
  'claude-sonnet-4': 'Sonnet 4',
  'claude-sonnet-4-5': 'Sonnet 4.5',
  'claude-opus-4': 'Opus 4',
  'gemini-pro': 'Gemini Pro',
  'gemini-1.5-pro': 'Gemini 1.5 Pro',
  'gemini-2.5-pro': 'Gemini 2.5 Pro',
  'gemini-2.5-flash': 'Gemini 2.5 Flash',
  'google/gemini-2.5-pro': 'Gemini 2.5 Pro',
  'google/gemini-2.5-flash': 'Gemini 2.5 Flash',
  'google/gemini-2.5-flash-lite': 'Gemini 2.5 Flash Lite',
  'openai/gpt-4o': 'GPT-4o',
  'openai/gpt-4o-mini': 'GPT-4o Mini',
};

// Custos padrão por ferramenta (em créditos)
export const CREDIT_COSTS: Record<string, number> = {
  // Análise de Títulos - 1 crédito por análise
  'title_analysis': 1,
  'analyze_titles': 1,
  'analyze_video_titles': 1,
  
  // Gerador de Thumbnails - 5 créditos por thumbnail
  'thumbnail_generation': 5,
  'generate_thumbnail': 5,
  
  // Gerador de Scripts - 2 créditos por minuto
  'script_generation': 2,
  'generate_script': 2,
  'generate_script_with_formula': 2,
  
  // Gerador de Cenas - 3 créditos por cena
  'scene_generation': 3,
  'generate_scenes': 3,
  
  // Gerador de Voz (TTS) - 1 crédito por 100 caracteres
  'voice_generation': 1,
  'generate_tts': 1,
  'tts': 1,
  
  // Gerador de Imagens - 5 créditos por imagem
  'image_generation': 5,
  'generate_image': 5,
  'prompt_image': 1,
  
  // Transcrição de Vídeo - 2 créditos por minuto
  'transcription': 2,
  'transcribe_video': 2,
  
  // Análise de Canal - 3 créditos por análise
  'channel_analysis': 3,
  'analyze_channel': 3,
  
  // Análise de Transcrição - 2 créditos por análise
  'transcript_analysis': 2,
  'analyze_transcript': 2,
  
  // Assistente IA - 1 crédito por consulta
  'ai_assistant': 1,
  
  // Imagens em Lote - 4 créditos por imagem
  'batch_images': 4,
  
  // Gerador de Vídeo - 10 créditos por vídeo
  'video_generation': 10,
  
  // Análise de Fórmula - 2 créditos
  'analyze_script_formula': 2,
  
  // Exploração de Nicho - 2 créditos
  'explore_niche': 2,
  
  // Busca de Canais - 1 crédito
  'search_channels': 1,
  
  // Análise Viral - 3 créditos
  'viral_analysis': 3,
  
  // Análise de Múltiplos Canais - 15 créditos
  'analyze_multiple_channels': 15,
};

export function getToolInfo(operationType: string): { name: string; icon: string; description: string } {
  return CREDIT_TOOLS_MAP[operationType] || { 
    name: operationType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), 
    icon: '🔧', 
    description: 'Operação na plataforma' 
  };
}

export function getModelName(modelId: string | null): string {
  if (!modelId) return '';
  return AI_MODELS_MAP[modelId] || modelId.split('/').pop()?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || modelId;
}

export function getToolCost(operationType: string): number {
  return CREDIT_COSTS[operationType] || 1;
}

// Função para reembolsar créditos em caso de falha
export async function refundCredits(
  userId: string, 
  amount: number, 
  operationType: string, 
  modelUsed?: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Buscar saldo atual
    const { data: currentCredits, error: fetchError } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching credits for refund:', fetchError);
      return { success: false, error: 'Erro ao buscar saldo' };
    }

    const newBalance = (currentCredits?.balance || 0) + Math.abs(amount);

    // Atualizar saldo
    const { error: updateError } = await supabase
      .from('user_credits')
      .upsert({
        user_id: userId,
        balance: newBalance,
        updated_at: new Date().toISOString(),
      });

    if (updateError) {
      console.error('Error updating credits for refund:', updateError);
      return { success: false, error: 'Erro ao atualizar saldo' };
    }

    // Registrar transação de reembolso
    const toolInfo = getToolInfo(operationType);
    const modelName = getModelName(modelUsed || null);
    const description = reason || `Reembolso por falha em ${toolInfo.name}${modelName ? ` - ${modelName}` : ''}`;

    await supabase.from('credit_transactions').insert({
      user_id: userId,
      amount: Math.abs(amount),
      transaction_type: 'refund',
      description,
    });

    return { success: true };
  } catch (error) {
    console.error('Error refunding credits:', error);
    return { success: false, error: 'Erro inesperado ao reembolsar' };
  }
}

// Função para deduzir créditos com tratamento de erro
export async function deductCredits(
  userId: string,
  operationType: string,
  creditsUsed: number,
  modelUsed?: string,
  details?: Record<string, unknown>
): Promise<{ success: boolean; error?: string; shouldRefund?: boolean }> {
  try {
    // Buscar saldo atual
    const { data: currentCredits, error: fetchError } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.error('Error fetching credits:', fetchError);
      return { success: false, error: 'Erro ao buscar saldo', shouldRefund: false };
    }

    const currentBalance = currentCredits?.balance || 0;

    // CRÍTICO: Nunca permitir saldo negativo
    if (currentBalance < creditsUsed) {
      return { success: false, error: 'Saldo insuficiente', shouldRefund: false };
    }

    // Garantir que o novo saldo nunca seja negativo
    const newBalance = Math.max(0, currentBalance - creditsUsed);

    // Atualizar saldo
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (updateError) {
      console.error('Error updating credits:', updateError);
      return { success: false, error: 'Erro ao atualizar saldo', shouldRefund: false };
    }

    // Registrar uso
    const usageRecord: {
      user_id: string;
      operation_type: string;
      credits_used: number;
      model_used: string | null;
      details: null;
    } = {
      user_id: userId,
      operation_type: operationType,
      credits_used: creditsUsed,
      model_used: modelUsed || null,
      details: null,
    };

    const { error: usageError } = await supabase.from('credit_usage').insert([usageRecord]);

    if (usageError) {
      console.error('Error inserting credit usage:', usageError);
    }

    return { success: true, shouldRefund: true };
  } catch (error) {
    console.error('Error deducting credits:', error);
    return { success: false, error: 'Erro inesperado', shouldRefund: false };
  }
}
