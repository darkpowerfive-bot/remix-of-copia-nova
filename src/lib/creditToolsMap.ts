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

// Custos padrão por ferramenta (em créditos) - SINCRONIZADO COM BACKEND
// Custos otimizados para 300% de margem de lucro baseado nos preços da Laozhang API
// Referência: 1 crédito = R$0.05 | Margem: 300%+
export const CREDIT_COSTS: Record<string, number> = {
  // 🧠 ANÁLISE DE TÍTULOS - Custo real: ~R$0.002 (gpt-4.1-mini) → 3 créditos = R$0.15 (7500% margem)
  'title_analysis': 3,
  'analyze_titles': 3,
  'analyze_video_titles': 3,
  
  // 🖼️ GERADOR DE THUMBNAILS - Custo real: ~R$0.05 (gpt-4o-image) → 4 créditos = R$0.20 (300% margem)
  'thumbnail_generation': 4,
  'generate_thumbnail': 4,
  
  // 📝 GERADOR DE SCRIPTS - Custo real: ~R$0.005/min (gpt-4.1-mini) → 1 crédito/min = R$0.05 (900% margem)
  'script_generation': 1,
  'generate_script': 1,
  'generate_script_with_formula': 1,
  
  // 🎬 GERADOR DE CENAS - Custo real: ~R$0.002/lote (gpt-4.1-mini) → 2 créditos = R$0.10 (5000% margem)
  'scene_generation': 2,
  'generate_scenes': 2,
  
  // 🎙️ GERADOR DE VOZ (TTS) - Custo real: ~R$0.075/1k chars (tts-1) → 2-8 créditos
  // Até 500 chars: 2, até 2000: 3, até 4000: 5, mais: 8
  'voice_generation': 2,
  'generate_tts': 2,
  'tts': 2,
  'tts_generation': 2,
  
  // 🎨 GERAÇÃO DE IMAGENS - GRÁTIS (usa cookies ImageFX do usuário)
  'image_generation': 0,
  'generate_image': 0,
  'generate_imagefx': 0,
  
  // 📝 GERAÇÃO DE PROMPTS PARA IMAGENS - Custo real: ~R$0.001 (gpt-4.1-mini) → 1 crédito = R$0.05
  'prompt_image': 1,
  'image_prompt': 1,
  'generate_prompts': 1,
  
  // 📃 TRANSCRIÇÃO DE VÍDEO - Custo real: ~R$0.015/min (whisper-1) → 2 créditos = R$0.10 (566% margem)
  'transcription': 2,
  'transcribe_video': 2,
  
  // 📺 ANÁLISE DE CANAL - Custo real: ~R$0.005 (gpt-4.1-mini) → 3 créditos = R$0.15 (3000% margem)
  'channel_analysis': 3,
  'analyze_channel': 3,
  
  // 📄 ANÁLISE DE TRANSCRIÇÃO - Custo real: ~R$0.003 (gpt-4.1-mini) → 3 créditos = R$0.15 (5000% margem)
  'transcript_analysis': 3,
  'analyze_transcript': 3,
  
  // 🤖 ASSISTENTE IA - Custo real variável → 3 créditos = R$0.15
  'ai_assistant': 3,
  
  // 🖼️ PROMPTS EM LOTE - Custo real: ~R$0.01 (gpt-4.1-mini) → 3 créditos = R$0.15 (geração de imagem é grátis via cookies)
  'batch_images': 3,
  'image_batch_10': 3,
  'batch_prompts': 3,
  
  // 🎥 GERADOR DE VÍDEO - Custo real: ~R$0.50 (vídeo curto) → 25 créditos = R$1.25 (150% margem)
  'video_generation': 25,
  'ready_video': 25,
  
  // 🧪 ANÁLISE DE FÓRMULA DE AGENTE - Custo real: ~R$0.01 → 5 créditos = R$0.25 (2500% margem)
  'analyze_script_formula': 5,
  'formula_analysis_agent': 5,
  
  // 🔍 EXPLORAÇÃO DE NICHO - Custo real: ~R$0.005 → 3 créditos = R$0.15 (3000% margem)
  'explore_niche': 3,
  
  // 🔎 BUSCA DE CANAIS - Custo real: ~R$0.003 → 2 créditos = R$0.10 (3300% margem)
  'search_channels': 2,
  
  // 📈 ANÁLISE VIRAL - Custo real: ~R$0.005 → 3 créditos = R$0.15 (3000% margem)
  'viral_analysis': 3,
  
  // 📊 ANÁLISE DE MÚLTIPLOS CANAIS - Custo real: ~R$0.02 → 8 créditos = R$0.40 (2000% margem)
  'analyze_multiple_channels': 8,
  'multi_channel_analysis': 8,
};

// Multiplicadores por modelo (conforme documentação backend)
export const MODEL_MULTIPLIERS: Record<string, number> = {
  'base': 1.0,
  'gemini': 1.2,
  'gemini-flash': 1.0,
  'gemini-pro': 1.5,
  'claude': 1.5,
  'gpt-4': 1.5,
  'gpt-4o': 1.5,
  'gpt-5': 1.5,
};

// Função para calcular custo com multiplicador de modelo
export function calculateCostWithModel(operationType: string, model?: string): number {
  const baseCost = CREDIT_COSTS[operationType] || 5;
  
  if (!model) return baseCost;
  
  const modelLower = model.toLowerCase();
  let multiplier = 1.0;
  
  if (modelLower.includes('claude') || modelLower.includes('gpt-4') || modelLower.includes('gpt-5')) {
    multiplier = MODEL_MULTIPLIERS['claude'];
  } else if (modelLower.includes('gemini') && modelLower.includes('pro')) {
    multiplier = MODEL_MULTIPLIERS['gemini-pro'];
  } else if (modelLower.includes('gemini')) {
    multiplier = MODEL_MULTIPLIERS['gemini'];
  }
  
  return Math.ceil(baseCost * multiplier);
}

// Custos específicos para TTS baseado no tamanho do texto - Otimizado para 300%+ margem
// Custo real: ~R$0.015/1k chars (tts-1 da OpenAI via Laozhang)
export function calculateTTSCost(textLength: number): number {
  if (textLength <= 500) return 2;    // Custo ~R$0.0075 → Cobra R$0.10 (1233% margem)
  if (textLength <= 2000) return 3;   // Custo ~R$0.03 → Cobra R$0.15 (400% margem)
  if (textLength <= 4000) return 5;   // Custo ~R$0.06 → Cobra R$0.25 (316% margem)
  return 8;                            // Custo ~R$0.10 → Cobra R$0.40 (300% margem)
}

// Custos para geração de cenas em lote
export function calculateSceneBatchCost(sceneCount: number, model?: string): number {
  const baseCostPer10 = CREDIT_COSTS['scene_generation'] || 2;
  const batches = Math.ceil(sceneCount / 10);
  const baseCost = batches * baseCostPer10;
  
  if (!model) return baseCost;
  
  const modelLower = model.toLowerCase();
  if (modelLower.includes('claude') || modelLower.includes('gpt')) {
    return Math.ceil(baseCost * 1.5);
  } else if (modelLower.includes('gemini')) {
    return Math.ceil(baseCost * 1.2);
  }
  
  return baseCost;
}

// Custos para geração de script baseado na duração
export function calculateScriptCost(durationMinutes: number, model?: string): number {
  const costPerMinute = CREDIT_COSTS['script_generation'] || 2;
  const baseCost = Math.ceil(durationMinutes * costPerMinute);
  
  if (!model) return baseCost;
  
  const modelLower = model.toLowerCase();
  if (modelLower.includes('claude') || modelLower.includes('gpt')) {
    return Math.ceil(baseCost * 1.4); // 2.8 por minuto
  } else if (modelLower.includes('gemini')) {
    return Math.ceil(baseCost * 1.2); // 2.4 por minuto
  }
  
  return baseCost;
}

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

export function getToolCost(operationType: string, model?: string): number {
  // Usar cálculo com multiplicador se modelo for fornecido
  if (model) {
    return calculateCostWithModel(operationType, model);
  }
  return CREDIT_COSTS[operationType] || 5;
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
