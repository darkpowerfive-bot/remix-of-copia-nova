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
// Custos base (modelos mais baratos). Gemini/Claude/GPT podem ter multiplicadores
export const CREDIT_COSTS: Record<string, number> = {
  // 🧠 ANÁLISE DE TÍTULOS - 6-9 créditos (base: 6, gemini: 7, claude: 9)
  'title_analysis': 6,
  'analyze_titles': 6,
  'analyze_video_titles': 6,
  
  // 🖼️ GERADOR DE THUMBNAILS - 5 créditos
  'thumbnail_generation': 5,
  'generate_thumbnail': 5,
  
  // 📝 GERADOR DE SCRIPTS - 2 créditos por minuto
  'script_generation': 2,
  'generate_script': 2,
  'generate_script_with_formula': 2,
  
  // 🎬 GERADOR DE CENAS - 2-4 créditos por lote de 10 cenas (base: 2, gemini: 3, claude: 4)
  'scene_generation': 2,
  'generate_scenes': 2,
  
  // 🎙️ GERADOR DE VOZ (TTS) - 2-12 créditos baseado no tamanho
  // Até 500 chars: 2, até 2000: 4, até 4000: 8, mais: 12
  'voice_generation': 2,
  'generate_tts': 2,
  'tts': 2,
  'tts_generation': 2,
  
  // 🎨 GERADOR DE IMAGENS - 1-3 créditos por prompt (base: 1, gemini: 2, claude: 3)
  'image_generation': 1,
  'generate_image': 1,
  'prompt_image': 1,
  'image_prompt': 1,
  
  // 📃 TRANSCRIÇÃO DE VÍDEO - 2-4 créditos base (base: 2, gemini: 3, claude: 4)
  'transcription': 2,
  'transcribe_video': 2,
  
  // 📺 ANÁLISE DE CANAL - 5-7 créditos (base: 5, gemini: 6, claude: 7)
  'channel_analysis': 5,
  'analyze_channel': 5,
  
  // 📄 ANÁLISE DE TRANSCRIÇÃO - 6-9 créditos (similar a título)
  'transcript_analysis': 6,
  'analyze_transcript': 6,
  
  // 🤖 ASSISTENTE IA - Variável por operação (calculado dinamicamente)
  'ai_assistant': 5,
  
  // 🖼️ IMAGENS EM LOTE - 10-30 créditos por lote de 10 (base: 10, gemini: 20, claude: 30)
  'batch_images': 10,
  'image_batch_10': 10,
  
  // 🎥 GERADOR DE VÍDEO - 10-15 créditos (base: 10, gemini: 12, claude: 15)
  'video_generation': 10,
  'ready_video': 10,
  
  // 🧪 ANÁLISE DE FÓRMULA DE AGENTE - 10-14 créditos (base: 10, gemini: 12, claude: 14)
  'analyze_script_formula': 10,
  'formula_analysis_agent': 10,
  
  // 🔍 EXPLORAÇÃO DE NICHO - 6-9 créditos (base: 6, gemini: 7, claude: 9)
  'explore_niche': 6,
  
  // 🔎 BUSCA DE CANAIS - 5 créditos
  'search_channels': 5,
  
  // 📈 ANÁLISE VIRAL - 5-7 créditos (igual a channel_analysis)
  'viral_analysis': 5,
  
  // 📊 ANÁLISE DE MÚLTIPLOS CANAIS - 15-22 créditos (base: 15, gemini: 18, claude: 22)
  'analyze_multiple_channels': 15,
  'multi_channel_analysis': 15,
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

// Custos específicos para TTS baseado no tamanho do texto
export function calculateTTSCost(textLength: number): number {
  if (textLength <= 500) return 2;
  if (textLength <= 2000) return 4;
  if (textLength <= 4000) return 8;
  return 12;
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
