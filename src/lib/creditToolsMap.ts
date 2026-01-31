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
  
  // Análise de Estilo de Thumbnails
  'thumbnail_style_analysis': { 
    name: 'Análise de Estilo', 
    icon: '🎨', 
    description: 'Análise de estilo de thumbnails' 
  },
  'analyze_thumbnail_style': { 
    name: 'Análise de Estilo', 
    icon: '🎨', 
    description: 'Análise de estilo de thumbnails' 
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
    description: 'Geração de prompts de cenas (0.5 crédito/cena)' 
  },
  'generate_scenes': { 
    name: 'Gerador de Cenas', 
    icon: '🎬', 
    description: 'Geração de prompts de cenas (0.5 crédito/cena)' 
  },
  'scene_prompt': { 
    name: 'Prompt de Cena', 
    icon: '🎬', 
    description: 'Geração de prompt individual para cena' 
  },
  
  // Personagens Consistentes
  'add_character': { 
    name: 'Adicionar Personagem', 
    icon: '👤', 
    description: 'Análise de referência de personagem consistente' 
  },
  'character_reference': { 
    name: 'Referência de Personagem', 
    icon: '👤', 
    description: 'Adicionar imagem de referência para consistência' 
  },
  'consistent_character': { 
    name: 'Personagem Consistente', 
    icon: '👤', 
    description: 'Manter consistência visual do personagem' 
  },
  
  // Gerador de Voz (TTS) - 2 créditos por minuto
  'voice_generation': { 
    name: 'Gerador de Voz', 
    icon: '🎙️', 
    description: 'Conversão de texto para áudio (2 créditos/min)' 
  },
  'generate_tts': { 
    name: 'Gerador de Voz', 
    icon: '🎙️', 
    description: 'Conversão de texto para áudio (2 créditos/min)' 
  },
  'tts': { 
    name: 'Gerador de Voz', 
    icon: '🎙️', 
    description: 'Conversão de texto para áudio (2 créditos/min)' 
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
  
  // Transcrição de Vídeo / Buscar Transcrição
  'transcription': { 
    name: 'Buscar Transcrição', 
    icon: '📃', 
    description: 'Buscar transcrição automática de vídeo' 
  },
  'transcribe_video': { 
    name: 'Buscar Transcrição', 
    icon: '📃', 
    description: 'Buscar transcrição automática de vídeo' 
  },
  'fetch_transcription': { 
    name: 'Buscar Transcrição', 
    icon: '📃', 
    description: 'Buscar transcrição automática de vídeo' 
  },
  
  // Análise de Canais - 25 créditos total
  'channel_analysis': { 
    name: 'Análise de Canais', 
    icon: '📺', 
    description: 'Análise completa de até 5 canais (25 créditos total)' 
  },
  'analyze_channel': { 
    name: 'Análise de Canais', 
    icon: '📺', 
    description: 'Análise completa de até 5 canais (25 créditos total)' 
  },
  'analyze_multiple_channels': { 
    name: 'Análise de Canais', 
    icon: '📺', 
    description: 'Análise comparativa de até 5 canais (25 créditos total)' 
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
  'agent_chat': { 
    name: 'Chat com Agente', 
    icon: '💬', 
    description: 'Conversa com agente de IA personalizado' 
  },
  
  // Prompts de Cenas (usado no backend)
  'scene_prompts': { 
    name: 'Prompts de Cenas', 
    icon: '🎬', 
    description: 'Geração de prompts para cenas de vídeo' 
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
  
  // Análise de Fórmula Viral - 3 créditos
  'analyze_script_formula': { 
    name: 'Analisar Fórmula Viral', 
    icon: '🧪', 
    description: 'Análise de fórmula viral do roteiro (3 créditos)' 
  },
  'formula_analysis': { 
    name: 'Analisar Fórmula Viral', 
    icon: '🧪', 
    description: 'Análise de fórmula viral (3 créditos)' 
  },
  'analyze_formula': { 
    name: 'Analisar Fórmula Viral', 
    icon: '🧪', 
    description: 'Análise de fórmula viral (3 créditos)' 
  },
  
  // Exploração de Nicho
  'explore_niche': { 
    name: 'Explorador de Nicho', 
    icon: '🔍', 
    description: 'Exploração de nicho de mercado' 
  },
  'niche_exploration': { 
    name: 'Explorador de Nicho', 
    icon: '🔍', 
    description: 'Exploração de nicho de mercado' 
  },
  'find_subniches': { 
    name: 'Encontrar Subnichos', 
    icon: '🔍', 
    description: 'Busca por subnichos promissores' 
  },
  
  // Analisador de Concorrência
  'competitor_analysis': { 
    name: 'Analisador de Concorrência', 
    icon: '📊', 
    description: 'Análise de canal concorrente' 
  },
  'analyze_competitor': { 
    name: 'Analisador de Concorrência', 
    icon: '📊', 
    description: 'Análise de canal concorrente' 
  },
  'search_channels': { 
    name: 'Analisador de Concorrência', 
    icon: '🔎', 
    description: 'Busca e análise de canais' 
  },
  
  // Criação de Agentes Virais
  'create_agent': { 
    name: 'Criar Agente Viral', 
    icon: '🤖', 
    description: 'Criação de agente de IA personalizado' 
  },
  'agent_creation': { 
    name: 'Criar Agente Viral', 
    icon: '🤖', 
    description: 'Criação de agente de IA personalizado' 
  },
  'create_viral_agent': { 
    name: 'Criar Agente Viral', 
    icon: '🤖', 
    description: 'Criação de agente viral personalizado' 
  },
  
  // Analytics do YouTube
  'youtube_analytics': { 
    name: 'Analytics do YouTube', 
    icon: '📈', 
    description: 'Análise de métricas do canal' 
  },
  'channel_analytics': { 
    name: 'Analytics do YouTube', 
    icon: '📈', 
    description: 'Análise de métricas do canal' 
  },
  'analytics_reload': { 
    name: 'Recarregar Analytics', 
    icon: '🔄', 
    description: 'Atualização de dados do canal' 
  },
  
  // Análise Viral
  'viral_analysis': { 
    name: 'Análise Viral', 
    icon: '📈', 
    description: 'Análise de potencial viral' 
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
  
  // Verificação de Sincronia
  'sync_verification': { 
    name: 'Verificar Sincronia', 
    icon: '🔄', 
    description: 'Verificação de sincronia entre narração e imagens' 
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
  // 🧠 ANÁLISE DE TÍTULOS - 3 créditos por IA, 12 se multimodal
  'title_analysis': 3,
  'analyze_titles': 3,
  'analyze_video_titles': 3,
  'title_analysis_multimodal': 12,
  'analyze_titles_multimodal': 12,
  
  // 🖼️ GERADOR DE THUMBNAILS - 3 créditos
  'thumbnail_generation': 3,
  'generate_thumbnail': 3,
  
  // 🎨 ANÁLISE DE ESTILO DE THUMBNAILS - 2 créditos
  'thumbnail_style_analysis': 2,
  'analyze_thumbnail_style': 2,
  
  // 📝 GERADOR DE SCRIPTS/ROTEIROS VIRAIS - 1 crédito por minuto de roteiro
  'script_generation': 1,
  'generate_script': 1,
  'generate_script_with_formula': 1,
  'viral_script': 1,
  'roteiro_viral': 1,
  
  // 🎬 GERADOR DE CENAS - 0.5 crédito por prompt (cada cena)
  'scene_generation': 0.5,
  'generate_scenes': 0.5,
  'scene_prompt': 0.5,
  
  // 👤 ADICIONAR PERSONAGENS CONSISTENTES - 5 créditos
  'add_character': 5,
  'character_reference': 5,
  'consistent_character': 5,
  
  // 🎙️ GERADOR DE VOZ (TTS) - 2 créditos por minuto
  'voice_generation': 2, // Base - calculado dinamicamente por calculateVoiceCost()
  'generate_tts': 2,
  'tts': 2,
  'tts_generation': 2,
  'tts_generation_deepgram': 2,
  
  // 🎨 GERAÇÃO DE IMAGENS - GRÁTIS (usa cookies ImageFX do usuário)
  'image_generation': 0,
  'generate_image': 0,
  'generate_imagefx': 0,
  
  // 📝 GERAÇÃO DE PROMPTS PARA IMAGENS - Custo real: ~R$0.001 (gpt-4.1-mini) → 1 crédito = R$0.05
  'prompt_image': 1,
  'image_prompt': 1,
  'generate_prompts': 1,
  
  // 📃 TRANSCRIÇÃO DE VÍDEO / BUSCAR TRANSCRIÇÃO - 5 créditos
  'transcription': 5,
  'transcribe_video': 5,
  'fetch_transcription': 5,
  
  // 📺 ANÁLISE DE CANAIS - 25 créditos total para até 5 canais
  'channel_analysis': 25,
  'analyze_channel': 25,
  'analyze_multiple_channels': 25,
  'multi_channel_analysis': 25,
  
  // 📄 ANÁLISE DE TRANSCRIÇÃO - Custo real: ~R$0.003 (gpt-4.1-mini) → 3 créditos = R$0.15 (5000% margem)
  'transcript_analysis': 3,
  'analyze_transcript': 3,
  
  // 🤖 ASSISTENTE IA - Custo real variável → 3 créditos = R$0.15
  'ai_assistant': 3,
  'agent_chat': 3,
  
  // 🎬 PROMPTS DE CENAS - Custo real: ~R$0.002/lote → 2 créditos = R$0.10 (5000% margem)
  'scene_prompts': 2,
  
  // 🖼️ PROMPTS EM LOTE - Custo real: ~R$0.01 (gpt-4.1-mini) → 3 créditos = R$0.15 (geração de imagem é grátis via cookies)
  'batch_images': 3,
  'image_batch_10': 3,
  'batch_prompts': 3,
  
  // 🎥 GERADOR DE VÍDEO - Custo real: ~R$0.50 (vídeo curto) → 25 créditos = R$1.25 (150% margem)
  'video_generation': 25,
  'ready_video': 25,
  
  // 🧪 ANÁLISE DE FÓRMULA VIRAL - 3 créditos
  'analyze_script_formula': 3,
  'formula_analysis': 3,
  'analyze_formula': 3,
  'formula_analysis_agent': 3,
  
  // 🤖 CRIAR AGENTES VIRAIS - 25 créditos (pode ser +25 se criado após análise de fórmula)
  'create_agent': 25,
  'agent_creation': 25,
  'create_viral_agent': 25,
  'create_agent_from_formula': 25,
  
  // 🔍 EXPLORAÇÃO DE NICHO - 5 créditos
  'explore_niche': 5,
  'niche_exploration': 5,
  'find_subniches': 5,
  
  // 🔎 ANALISADOR DE CONCORRÊNCIA - 5 créditos
  'competitor_analysis': 5,
  'analyze_competitor': 5,
  'search_channels': 5,
  
  // 📈 ANÁLISE VIRAL - Custo real: ~R$0.005 → 3 créditos = R$0.15 (3000% margem)
  'viral_analysis': 3,
  
  // 📊 ANALYTICS DO YOUTUBE - 2 créditos por recarga
  'youtube_analytics': 2,
  'channel_analytics': 2,
  'analytics_reload': 2,
  
  // 🔄 VERIFICAÇÃO DE SINCRONIA - 5 créditos
  'sync_verification': 5,
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

  // Scripts/roteiros: 1 crédito por minuto, independente do modelo.
  // (O multiplicador por modelo aqui gerava preços como 2.8 créditos/min para GPT/Claude)
  if (
    operationType === 'script_generation' ||
    operationType === 'generate_script' ||
    operationType === 'generate_script_with_formula' ||
    operationType === 'viral_script' ||
    operationType === 'roteiro_viral'
  ) {
    return baseCost;
  }
  
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

// Custos para TTS - 2 créditos por minuto de áudio
// Estimativa: ~150 palavras/minuto = ~900 caracteres/minuto
export function calculateTTSCost(textLength: number): number {
  // ~900 caracteres por minuto, 2 créditos por minuto
  const estimatedMinutes = textLength / 900;
  return Math.max(1, Math.ceil(estimatedMinutes * 2));
}

// Custo para voz por minuto (para exibição na UI)
export function calculateVoiceCost(durationMinutes: number): number {
  return Math.max(1, Math.ceil(durationMinutes * 2));
}

// Custo para análise de títulos (3 normal, 12 multimodal)
export function calculateTitleAnalysisCost(isMultimodal: boolean = false): number {
  return isMultimodal ? 12 : 3;
}

// Custo para análise de estilo de thumbnails
export function calculateThumbnailStyleCost(): number {
  return CREDIT_COSTS['thumbnail_style_analysis'] || 2;
}

// Custo para buscar transcrição
export function calculateTranscriptionCost(): number {
  return CREDIT_COSTS['transcription'] || 5;
}

// Custo para gerar thumbnail
export function calculateThumbnailGenerationCost(): number {
  return CREDIT_COSTS['thumbnail_generation'] || 3;
}

// Custo para explorador de nicho
export function calculateNicheExplorerCost(): number {
  return CREDIT_COSTS['explore_niche'] || 5;
}

// Custo para analisador de concorrência
export function calculateCompetitorAnalysisCost(): number {
  return CREDIT_COSTS['competitor_analysis'] || 5;
}

// Custo para criar agente viral
export function calculateCreateAgentCost(): number {
  return CREDIT_COSTS['create_agent'] || 25;
}

// Custo para analytics (por recarga)
export function calculateAnalyticsCost(): number {
  return CREDIT_COSTS['youtube_analytics'] || 2;
}

// Custos para geração de cenas - 0.5 crédito por prompt/cena
export function calculateSceneBatchCost(sceneCount: number, model?: string): number {
  // 0.5 crédito por cena/prompt
  const baseCost = sceneCount * 0.5;
  return Math.max(1, Math.ceil(baseCost));
}

// Custo para adicionar personagens consistentes
export function calculateCharacterReferenceCost(): number {
  return CREDIT_COSTS['add_character'] || 5;
}

// Custo para analisar fórmula viral
export function calculateFormulaAnalysisCost(): number {
  return CREDIT_COSTS['analyze_script_formula'] || 3;
}

// Custos para geração de script baseado na duração
export function calculateScriptCost(durationMinutes: number, model?: string): number {
  // 1 crédito por minuto, independente do modelo
  const costPerMinute = CREDIT_COSTS['script_generation'] ?? 1;
  return Math.ceil(durationMinutes * costPerMinute);
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
