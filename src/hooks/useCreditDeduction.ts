import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";
import { 
  CREDIT_COSTS, 
  getToolInfo, 
  getModelName,
  deductCredits,
  refundCredits 
} from "@/lib/creditToolsMap";

export type OperationType = 
  | 'title_analysis'
  | 'analyze_titles'
  | 'analyze_video_titles'
  | 'thumbnail_generation'
  | 'generate_thumbnail'
  | 'script_generation'
  | 'generate_script'
  | 'generate_script_with_formula'
  | 'scene_generation'
  | 'generate_scenes'
  | 'voice_generation'
  | 'generate_tts'
  | 'tts'
  | 'image_generation'
  | 'generate_image'
  | 'prompt_image'
  | 'transcription'
  | 'transcribe_video'
  | 'channel_analysis'
  | 'analyze_channel'
  | 'transcript_analysis'
  | 'analyze_transcript'
  | 'ai_assistant'
  | 'batch_images'
  | 'video_generation'
  | 'analyze_script_formula'
  | 'explore_niche'
  | 'search_channels'
  | 'viral_analysis'
  | 'analyze_multiple_channels'
  | 'agent_chat'
  | 'analyze_thumbnails';

interface DeductionOptions {
  /** Tipo da operação */
  operationType: OperationType;
  /** Quantidade customizada (sobrescreve o custo padrão) */
  customAmount?: number;
  /** Multiplicador (ex: minutos para script, quantidade de cenas) */
  multiplier?: number;
  /** Modelo de IA usado */
  modelUsed?: string;
  /** Detalhes adicionais para logging */
  details?: Record<string, unknown>;
  /** Mostrar toast de sucesso/erro */
  showToast?: boolean;
}

interface DeductionResult {
  success: boolean;
  error?: string;
  creditsDeducted: number;
  newBalance: number;
  shouldRefund: boolean;
  refund: () => Promise<void>;
}

export const useCreditDeduction = () => {
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [usePlatformCredits, setUsePlatformCredits] = useState<boolean | null>(null);

  // Buscar configuração de uso de créditos da plataforma
  useEffect(() => {
    const fetchUserSettings = async () => {
      if (!user) {
        setUsePlatformCredits(true); // Default para usar créditos
        return;
      }

      try {
        const { data, error } = await supabase
          .from('user_api_settings')
          .select('use_platform_credits')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching user API settings:', error);
          setUsePlatformCredits(true); // Default em caso de erro
          return;
        }

        // Se não existe registro ou use_platform_credits é null, default é true
        setUsePlatformCredits(data?.use_platform_credits ?? true);
      } catch (err) {
        console.error('Error in fetchUserSettings:', err);
        setUsePlatformCredits(true);
      }
    };

    fetchUserSettings();
  }, [user]);

  /**
   * Calcula o custo total da operação
   */
  const calculateCost = useCallback((options: DeductionOptions): number => {
    const { operationType, customAmount, multiplier = 1 } = options;
    
    if (customAmount !== undefined) {
      return Math.ceil(customAmount * multiplier);
    }
    
    const baseCost = CREDIT_COSTS[operationType] || 1;
    return Math.ceil(baseCost * multiplier);
  }, []);

  /**
   * Verifica se o usuário tem saldo suficiente
   * Se o usuário usa API própria, sempre retorna hasBalance = true
   */
  const checkBalance = useCallback(async (requiredCredits: number): Promise<{
    hasBalance: boolean;
    currentBalance: number;
  }> => {
    if (!user) {
      return { hasBalance: false, currentBalance: 0 };
    }

    // Se o usuário NÃO usa créditos da plataforma (usa API própria), sempre tem "saldo"
    // IMPORTANTE: null significa ainda carregando, false significa API própria
    if (usePlatformCredits === false) {
      return { hasBalance: true, currentBalance: 0 };
    }
    
    // Se ainda está carregando (null), buscar direto do banco
    if (usePlatformCredits === null) {
      const { data: settings } = await supabase
        .from('user_api_settings')
        .select('use_platform_credits')
        .eq('user_id', user.id)
        .maybeSingle();
      
      // Se user usa API própria, sempre tem saldo
      if (settings?.use_platform_credits === false) {
        return { hasBalance: true, currentBalance: 0 };
      }
    }

    const { data, error } = await supabase
      .from('user_credits')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) {
      console.error('Error checking balance:', error);
      return { hasBalance: false, currentBalance: 0 };
    }

    const currentBalance = data?.balance || 0;
    return {
      hasBalance: currentBalance >= requiredCredits,
      currentBalance
    };
  }, [user, usePlatformCredits]);

  /**
   * Deduz créditos do usuário
   * Se o usuário está usando API própria (use_platform_credits = false), não deduz créditos
   */
  const deduct = useCallback(async (options: DeductionOptions): Promise<DeductionResult> => {
    const { 
      operationType, 
      modelUsed, 
      details,
      showToast = true 
    } = options;

    if (!user) {
      return {
        success: false,
        error: 'Usuário não autenticado',
        creditsDeducted: 0,
        newBalance: 0,
        shouldRefund: false,
        refund: async () => {}
      };
    }

    // Verificar se usa API própria - se ainda está carregando, consultar diretamente
    let shouldSkipDeduction = usePlatformCredits === false;
    
    if (usePlatformCredits === null) {
      const { data: settings } = await supabase
        .from('user_api_settings')
        .select('use_platform_credits')
        .eq('user_id', user.id)
        .maybeSingle();
      
      shouldSkipDeduction = settings?.use_platform_credits === false;
    }

    // Se o usuário NÃO está usando créditos da plataforma (usa API própria), 
    // retorna sucesso sem deduzir créditos
    if (shouldSkipDeduction) {
      console.log('[CreditDeduction] Usuário usando API própria, sem dedução de créditos');
      return {
        success: true,
        creditsDeducted: 0,
        newBalance: 0, // Não precisamos do saldo real
        shouldRefund: false, // Não há o que reembolsar
        refund: async () => {} // Noop
      };
    }

    setIsProcessing(true);

    try {
      const creditsToDeduct = calculateCost(options);
      const toolInfo = getToolInfo(operationType);

      // Verificar saldo
      const { hasBalance, currentBalance } = await checkBalance(creditsToDeduct);

      // CRÍTICO: Bloquear operação se saldo for insuficiente ou negativo
      if (!hasBalance || currentBalance < creditsToDeduct || currentBalance <= 0) {
        if (showToast) {
          toast.error(`Saldo insuficiente`, {
            description: `Você precisa de ${creditsToDeduct} créditos para usar ${toolInfo.name}. Saldo atual: ${Math.max(0, Math.ceil(currentBalance))}`
          });
        }
        return {
          success: false,
          error: 'Saldo insuficiente',
          creditsDeducted: 0,
          newBalance: Math.max(0, currentBalance),
          shouldRefund: false,
          refund: async () => {}
        };
      }

      // Deduzir créditos
      const result = await deductCredits(
        user.id,
        operationType,
        creditsToDeduct,
        modelUsed,
        details
      );

      if (!result.success) {
        if (showToast) {
          toast.error('Erro ao deduzir créditos', {
            description: result.error
          });
        }
        return {
          success: false,
          error: result.error,
          creditsDeducted: 0,
          newBalance: currentBalance,
          shouldRefund: false,
          refund: async () => {}
        };
      }

      const newBalance = currentBalance - creditsToDeduct;

      // Função de refund para uso posterior
      const refund = async () => {
        const modelName = getModelName(modelUsed || null);
        await refundCredits(
          user.id,
          creditsToDeduct,
          operationType,
          modelUsed,
          `Reembolso por falha em ${toolInfo.name}${modelName ? ` - ${modelName}` : ''}`
        );
        if (showToast) {
          toast.info('Créditos reembolsados', {
            description: `${creditsToDeduct} créditos foram devolvidos por falha na operação.`
          });
        }
      };

      return {
        success: true,
        creditsDeducted: creditsToDeduct,
        newBalance,
        shouldRefund: true,
        refund
      };
    } catch (error) {
      console.error('Error in deduct:', error);
      return {
        success: false,
        error: 'Erro inesperado',
        creditsDeducted: 0,
        newBalance: 0,
        shouldRefund: false,
        refund: async () => {}
      };
    } finally {
      setIsProcessing(false);
    }
  }, [user, calculateCost, checkBalance, usePlatformCredits]);

  /**
   * Wrapper para executar operação com dedução automática
   * Deduz antes, reembolsa se falhar
   */
  const executeWithDeduction = useCallback(async <T>(
    options: DeductionOptions,
    operation: () => Promise<T>
  ): Promise<{ result: T | null; success: boolean; error?: string }> => {
    const deductionResult = await deduct(options);

    if (!deductionResult.success) {
      return {
        result: null,
        success: false,
        error: deductionResult.error
      };
    }

    try {
      const result = await operation();
      return {
        result,
        success: true
      };
    } catch (error) {
      // Reembolsar em caso de falha
      if (deductionResult.shouldRefund) {
        await deductionResult.refund();
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Erro na operação';
      return {
        result: null,
        success: false,
        error: errorMessage
      };
    }
  }, [deduct]);

  /**
   * Obtém o custo estimado de uma operação
   */
  const getEstimatedCost = useCallback((
    operationType: OperationType,
    multiplier: number = 1
  ): number => {
    const baseCost = CREDIT_COSTS[operationType] || 1;
    return Math.ceil(baseCost * multiplier);
  }, []);

  return {
    isProcessing,
    deduct,
    checkBalance,
    calculateCost,
    executeWithDeduction,
    getEstimatedCost,
    usePlatformCredits,
    CREDIT_COSTS
  };
};

// Constantes de custo exportadas para uso direto
export { CREDIT_COSTS } from "@/lib/creditToolsMap";
