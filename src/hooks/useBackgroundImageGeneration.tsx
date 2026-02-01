import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { THUMBNAIL_STYLES } from "@/lib/thumbnailStyles";
import { useToast } from "@/hooks/use-toast";
import { saveImageToCache } from "@/lib/imageCache";

interface CharacterDescription {
  name: string;
  description: string;
  seed: number;
}

interface ScenePrompt {
  number: number;
  text: string;
  imagePrompt: string;
  wordCount: number;
  estimatedTime?: string;
  timecode?: string;
  endTimecode?: string;
  generatedImage?: string;
  generatingImage?: boolean;
  characterName?: string;
  emotion?: string;
  retentionTrigger?: string;
}

interface RewriteProgress {
  isRewriting: boolean;
  sceneNumber: number | null;
  originalPrompt: string | null;
  newPrompt: string | null;
  attemptNumber: number;
}

interface BackgroundGenerationState {
  isGenerating: boolean;
  totalImages: number;
  completedImages: number;
  failedImages: number;
  currentSceneIndex: number | null;
  currentPrompt: string | null;
  startTime: number | null;
  scenes: ScenePrompt[];
  style: string;
  failedIndexes: number[];
  rateLimitHit: boolean;
  characters: CharacterDescription[];
  rewriteProgress: RewriteProgress;
}

interface CookieModalState {
  isOpen: boolean;
  cookieIndex?: number;
  totalCookies?: number;
  isGlobalCookie?: boolean;
  open: (cookieIndex?: number, totalCookies?: number, isGlobalCookie?: boolean) => void;
  close: () => void;
}

interface BackgroundImageGenerationContextType {
  state: BackgroundGenerationState;
  startGeneration: (scenes: ScenePrompt[], style: string, pendingIndexes: number[], characters?: CharacterDescription[], cookieCount?: number) => void;
  cancelGeneration: () => void;
  getUpdatedScenes: () => ScenePrompt[];
  clearState: () => void;
  syncScenes: (scenes: ScenePrompt[]) => void;
  setCharacters: (characters: CharacterDescription[]) => void;
  cookieModal: CookieModalState;
}

const initialRewriteProgress: RewriteProgress = {
  isRewriting: false,
  sceneNumber: null,
  originalPrompt: null,
  newPrompt: null,
  attemptNumber: 0,
};

const initialState: BackgroundGenerationState = {
  isGenerating: false,
  totalImages: 0,
  completedImages: 0,
  failedImages: 0,
  currentSceneIndex: null,
  currentPrompt: null,
  startTime: null,
  scenes: [],
  style: 'cinematic',
  failedIndexes: [],
  rateLimitHit: false,
  characters: [],
  rewriteProgress: initialRewriteProgress,
};

const BackgroundImageGenerationContext = createContext<BackgroundImageGenerationContextType | null>(null);

export const BackgroundImageGenerationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<BackgroundGenerationState>(initialState);
  const cancelRef = useRef(false);
  const scenesRef = useRef<ScenePrompt[]>([]);
  const { toast } = useToast();

  // Manter ref sincronizada
  useEffect(() => {
    scenesRef.current = state.scenes;
  }, [state.scenes]);

  // Função para reescrever prompt bloqueado usando IA - com estratégias progressivas
  const rewriteBlockedPrompt = useCallback(async (
    originalPrompt: string,
    sceneText: string,
    attemptNumber: number
  ): Promise<string | null> => {
    try {
      // Estratégias progressivamente mais agressivas
      const strategies = [
        // Tentativa 1: Manter contexto, remover elementos problemáticos
        `Você é um especialista em reescrever prompts de imagem bloqueados.
Sua tarefa é reescrever mantendo a ESSÊNCIA VISUAL da cena, mas removendo elementos sensíveis.

REGRAS OBRIGATÓRIAS:
- Mantenha cores, iluminação, composição e atmosfera
- Remova: violência, armas, sangue, conteúdo adulto, pessoas reais
- Substitua por alternativas seguras e artísticas
- Adicione: "cinematic lighting, professional photography, 8K quality, 1280x720, 16:9 aspect ratio, full frame"
- Retorne APENAS o novo prompt`,

        // Tentativa 2: Abstrair para elementos visuais puros
        `Você é um especialista em criar prompts SEGUROS que NUNCA são bloqueados.
Sua tarefa é TRANSFORMAR COMPLETAMENTE o prompt em algo abstrato mas visualmente relevante.

TRANSFORMAÇÕES OBRIGATÓRIAS:
1. Substitua TODAS as pessoas por: paisagens, objetos, formas abstratas ou simbolismo
2. Substitua ações por: composições estáticas ou cenas atmosféricas  
3. Substitua locais específicos por: ambientes genéricos e belos
4. Foque em: cores, iluminação, mood, texturas - NÃO em personagens ou ações
5. Adicione: "digital art, artistic composition, 1280x720, 16:9, full frame, no black bars"

Retorne APENAS o prompt transformado e seguro.`
      ];

      const systemContent = strategies[Math.min(attemptNumber - 1, strategies.length - 1)];

      const { data, error } = await supabase.functions.invoke("ai-assistant", {
        body: {
          messages: [
            { role: "system", content: systemContent },
            { 
              role: "user", 
              content: `PROMPT BLOQUEADO: "${originalPrompt}"

CONTEXTO DA CENA (para referência visual): "${sceneText}"

Reescreva o prompt de forma segura.`
            }
          ],
          model: "gemini-flash"
        }
      });

      if (error) throw error;
      
      let newPrompt = data?.content || data?.message;
      if (typeof newPrompt !== 'string') return null;
      
      newPrompt = newPrompt.trim();
      
      // Garantir requisitos de formato
      if (!newPrompt.includes("1280x720")) {
        newPrompt = `${newPrompt}, 1280x720 resolution, 16:9 aspect ratio, full frame composition, no black bars`;
      }
      
      return newPrompt;
    } catch (err) {
      console.error('[Background] Failed to rewrite prompt:', err);
      return null;
    }
  }, []);

  // Estado para modal de cookies inválidos
  const [showCookieModal, setShowCookieModal] = useState(false);
  const [cookieErrorInfo, setCookieErrorInfo] = useState<{
    cookieIndex?: number;
    totalCookies?: number;
    isGlobalCookie?: boolean;
  }>({});
  const cookieErrorShownRef = useRef(false);

  // Gerar imagem apenas com ImageFX - sem fallback
  const generateWithImageFX = useCallback(async (
    prompt: string,
    sceneIndex: number,
    characterSeed?: number
  ): Promise<{ success: boolean; imageUrl?: string; cookieError?: boolean; cookieIndex?: number; totalCookies?: number; isGlobalCookie?: boolean }> => {
    try {
      const { data, error } = await supabase.functions.invoke("generate-imagefx", {
        body: {
          prompt,
          aspectRatio: "LANDSCAPE",
          numberOfImages: 1,
          seed: characterSeed,
          sceneIndex,
        },
      });

      if (error) {
        const bodyText = (error as any)?.context?.body;
        let errMsg = error.message;
        let cookieIndex: number | undefined;
        let totalCookies: number | undefined;
        let isGlobalCookie: boolean | undefined;
        
        if (bodyText) {
          try {
            const parsed = JSON.parse(bodyText);
            errMsg = parsed?.error || error.message;
            cookieIndex = parsed?.cookieIndex;
            totalCookies = parsed?.totalCookies;
            isGlobalCookie = parsed?.usingGlobal;
          } catch {}
        }
        
        // Se for erro de cookies/sessão, sinalizar para mostrar modal
        if (errMsg.includes("sessão") || errMsg.includes("cookies") || errMsg.includes("autenticação") || errMsg.includes("ImageFX") || errMsg.includes("inválido") || errMsg.includes("Cookie")) {
          console.log(`[Background] ImageFX cookie error detected - Cookie ${cookieIndex}`);
          return { success: false, cookieError: true, cookieIndex, totalCookies, isGlobalCookie };
        }
        
        throw new Error(errMsg);
      }

      if ((data as any)?.error) {
        const errMsg = (data as any).error;
        const cookieIndex = (data as any)?.cookieIndex;
        const totalCookies = (data as any)?.totalCookies;
        const isGlobalCookie = (data as any)?.usingGlobal;
        
        if (errMsg.includes("sessão") || errMsg.includes("cookies") || errMsg.includes("autenticação") || errMsg.includes("ImageFX") || errMsg.includes("inválido") || errMsg.includes("Cookie")) {
          console.log(`[Background] ImageFX cookie error in data - Cookie ${cookieIndex}`);
          return { success: false, cookieError: true, cookieIndex, totalCookies, isGlobalCookie };
        }
        throw new Error(errMsg);
      }

      const url = (data as any)?.images?.[0]?.url;
      if (url) {
        return { success: true, imageUrl: url };
      }
      
      throw new Error("No image URL in response");
    } catch (error: any) {
      console.error(`[Background] ImageFX error for scene ${sceneIndex}:`, error);
      throw error;
    }
  }, []);

  // Função para abrir modal de cookies
  const openCookieModal = useCallback((cookieIndex?: number, totalCookies?: number, isGlobalCookie?: boolean) => {
    if (!cookieErrorShownRef.current) {
      cookieErrorShownRef.current = true;
      setCookieErrorInfo({ cookieIndex, totalCookies, isGlobalCookie });
      setShowCookieModal(true);
    }
  }, []);

  // Função para fechar modal de cookies
  const closeCookieModal = useCallback(() => {
    setShowCookieModal(false);
    setCookieErrorInfo({});
    cookieErrorShownRef.current = false;
  }, []);

  // Expor estado do modal para componentes externos
  const getCookieModalState = useCallback(() => ({
    isOpen: showCookieModal,
    cookieIndex: cookieErrorInfo.cookieIndex,
    totalCookies: cookieErrorInfo.totalCookies,
    isGlobalCookie: cookieErrorInfo.isGlobalCookie,
    open: openCookieModal,
    close: closeCookieModal,
  }), [showCookieModal, cookieErrorInfo, openCookieModal, closeCookieModal]);

  

  const generateSingleImage = useCallback(async (
    sceneIndex: number, 
    scenes: ScenePrompt[], 
    style: string,
    characters: CharacterDescription[],
    updateRewriteProgress?: (progress: Partial<RewriteProgress>) => void
  ): Promise<{ index: number; success: boolean; imageUrl?: string; rateLimited?: boolean; newPrompt?: string; cookieError?: boolean }> => {
    const maxRetries = 3;
    const maxRewriteAttempts = 3;
    let retries = 0;
    let rewriteAttempts = 0;
    let lastError = "";
    let wasRateLimited = false;
    let currentPrompt = scenes[sceneIndex].imagePrompt;

    const scene = scenes[sceneIndex];
    const characterSeed = scene.characterName 
      ? characters.find(c => c.name.toLowerCase() === scene.characterName?.toLowerCase())?.seed
      : undefined;

    while (retries <= maxRetries) {
      if (cancelRef.current) {
        return { index: sceneIndex, success: false };
      }

      try {
        const stylePrefix = THUMBNAIL_STYLES.find(s => s.id === style)?.promptPrefix || "";
        
        const resolutionPrefix = "1280x720 resolution, 16:9 aspect ratio, full frame composition, no black bars, no letterbox, no pillarbox, image must fill entire frame edge to edge";
        
        const fullPrompt = stylePrefix
          ? `${resolutionPrefix}, ${stylePrefix} ${currentPrompt}`
          : `${resolutionPrefix}, ${currentPrompt}`;

        // Usar ImageFX apenas - sem fallback
        const result = await generateWithImageFX(fullPrompt, sceneIndex, characterSeed);
        
        // Se erro de cookie, mostrar modal com info do cookie e parar
        if (result.cookieError) {
          openCookieModal(result.cookieIndex, result.totalCookies, result.isGlobalCookie);
          cancelRef.current = true;
          return { index: sceneIndex, success: false, cookieError: true };
        }

        if (result.success && result.imageUrl) {
          // Limpar estado de reescrita
          if (updateRewriteProgress) {
            updateRewriteProgress({
              isRewriting: false,
              sceneNumber: null,
              originalPrompt: null,
              newPrompt: null,
              attemptNumber: 0,
            });
          }
          
          return { 
            index: sceneIndex, 
            success: true, 
            imageUrl: result.imageUrl,
            newPrompt: currentPrompt !== scene.imagePrompt ? currentPrompt : undefined
          };
        }
        
        retries++;
        await new Promise(resolve => setTimeout(resolve, 1500));
        
      } catch (error: any) {
        lastError = error.message;
        
        // Rate limit handling
        if (lastError.includes("Limite de requisições") || lastError.includes("429")) {
          wasRateLimited = true;
          const waitTime = 5000 + retries * 3000;
          console.log(`[Background] Rate limited on scene ${sceneIndex}, waiting ${waitTime}ms`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
          retries++;
          continue;
        }
        
        // Detectar bloqueio de conteúdo e tentar reescrever
        if ((lastError.includes("blocked") || lastError.includes("safety") || lastError.includes("violates") || lastError.includes("bloqueado") || lastError.includes("política")) && rewriteAttempts < maxRewriteAttempts) {
          rewriteAttempts++;
          console.log(`[Background] Scene ${sceneIndex} blocked, attempting rewrite ${rewriteAttempts}/${maxRewriteAttempts}`);
          
          if (updateRewriteProgress) {
            updateRewriteProgress({
              isRewriting: true,
              sceneNumber: scene.number,
              originalPrompt: currentPrompt,
              attemptNumber: rewriteAttempts,
            });
          }
          
          const rewrittenPrompt = await rewriteBlockedPrompt(currentPrompt, scene.text, rewriteAttempts);
          
          if (rewrittenPrompt) {
            currentPrompt = rewrittenPrompt;
            
            if (updateRewriteProgress) {
              updateRewriteProgress({ newPrompt: rewrittenPrompt });
            }
            
            await new Promise(resolve => setTimeout(resolve, 1500));
            continue;
          }
        }
        
        retries++;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Limpar estado de reescrita em caso de falha
    if (updateRewriteProgress) {
      updateRewriteProgress({
        isRewriting: false,
        sceneNumber: null,
        originalPrompt: null,
        newPrompt: null,
        attemptNumber: 0,
      });
    }
    
    console.warn(`[Background] Scene ${sceneIndex} failed after ${maxRetries} retries: ${lastError}`);
    return { index: sceneIndex, success: false, rateLimited: wasRateLimited };
  }, [rewriteBlockedPrompt, generateWithImageFX, openCookieModal]);

  const startGeneration = useCallback(async (
    scenes: ScenePrompt[], 
    style: string, 
    pendingIndexes: number[],
    characters: CharacterDescription[] = [],
    cookieCount: number = 1 // Number of ImageFX cookies configured
  ) => {
    if (state.isGenerating) {
      toast({ 
        title: "Geração já em andamento", 
        description: "Aguarde a conclusão ou cancele a geração atual" 
      });
      return;
    }

    cancelRef.current = false;
    scenesRef.current = [...scenes];
    
    setState({
      isGenerating: true,
      totalImages: pendingIndexes.length,
      completedImages: 0,
      failedImages: 0,
      currentSceneIndex: pendingIndexes[0] ?? null,
      currentPrompt: scenes[pendingIndexes[0]]?.imagePrompt ?? null,
      startTime: Date.now(),
      scenes: [...scenes],
      style,
      failedIndexes: [],
      rateLimitHit: false,
      characters,
      rewriteProgress: initialRewriteProgress,
    });

    // Pipeline contínuo: mantém N requisições ativas (8 por cookie para máxima velocidade)
    // O sistema tem retry automático para rate limits, então 8 é seguro
    const REQUESTS_PER_COOKIE = 8;
    // Garantir mínimo de 1 para evitar CONCURRENCY = 0 (loop infinito/travamento)
    const safeCookieCount = Math.max(1, cookieCount);
    const CONCURRENCY = safeCookieCount * REQUESTS_PER_COOKIE; // 8 requisições por cookie ativa simultaneamente
    console.log(`[Background] Pipeline contínuo com ${CONCURRENCY} requisições simultâneas (${safeCookieCount} cookie(s) x ${REQUESTS_PER_COOKIE} req/cookie)`);
    
    let processed = 0;
    let failed = 0;
    let rateLimitEncountered = false;
    const failedIdxs: number[] = [];
    let errorOccurred = false;
    
    // Fila de índices pendentes
    const queue = [...pendingIndexes];
    let nextQueueIndex = 0;
    
    // Função para processar o próximo item da fila
    const processNext = async (): Promise<void> => {
      while (nextQueueIndex < queue.length && !cancelRef.current && !errorOccurred) {
        const currentIdx = nextQueueIndex;
        nextQueueIndex++;
        const sceneIdx = queue[currentIdx];
        
        try {
          // Função para atualizar estado de reescrita
          const updateRewriteProgress = (progress: Partial<RewriteProgress>) => {
            setState(prev => ({
              ...prev,
              rewriteProgress: { ...prev.rewriteProgress, ...progress }
            }));
          };

          const result = await generateSingleImage(sceneIdx, scenesRef.current, style, characters, updateRewriteProgress);

          if (cancelRef.current || errorOccurred) return;

          if (result.success && result.imageUrl) {
            const { index, imageUrl, newPrompt } = result;
            processed++;

            // Salvar no IndexedDB para persistência
            const scene = scenesRef.current[index];
            if (scene) {
              saveImageToCache(scene.number, imageUrl, newPrompt || scene.imagePrompt || '').catch(err => {
                console.warn('Falha ao salvar imagem no cache:', err);
              });
            }

            // Atualizar estado imediatamente quando cada imagem fica pronta
            setState(prev => {
              const updatedScenes = [...prev.scenes];
              updatedScenes[index] = { 
                ...updatedScenes[index], 
                generatedImage: imageUrl,
                ...(newPrompt ? { imagePrompt: newPrompt } : {})
              };
              scenesRef.current = updatedScenes;

              return {
                ...prev,
                scenes: updatedScenes,
                completedImages: processed,
                currentSceneIndex: index,
                currentPrompt: updatedScenes[index]?.imagePrompt ?? null,
                rewriteProgress: initialRewriteProgress,
              };
            });
          } else {
            // Falha na geração
            failed++;
            failedIdxs.push(result.index);
            if (result.rateLimited) {
              rateLimitEncountered = true;
            }

            setState(prev => ({
              ...prev,
              failedImages: failed,
              failedIndexes: [...failedIdxs],
              rateLimitHit: rateLimitEncountered,
              rewriteProgress: initialRewriteProgress,
            }));
          }
        } catch (error: any) {
          if (error?.message === "AUTH_ERROR") {
            toast({
              title: "Erro de autenticação",
              description: "Atualize os cookies do ImageFX nas configurações.",
              variant: "destructive",
            });
            errorOccurred = true;
            cancelRef.current = true;
            return;
          }
        }
      }
    };
    
    // Iniciar N workers em paralelo que processam a fila continuamente
    const workers = Array.from({ length: CONCURRENCY }, () => processNext());
    await Promise.all(workers);

    // IMPORTANTE: Capturar startTime ANTES de resetar o estado
    const capturedStartTime = Date.now() - (processed > 0 || failed > 0 ? 0 : 0);
    const generationStartTime = state.startTime || Date.now();
    
    // Calcular tempo total gasto e média por minuto ANTES de resetar
    const endTime = Date.now();
    const totalTimeMs = endTime - generationStartTime;
    const totalSeconds = Math.floor(totalTimeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const timeString = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
    
    // Calcular imagens por minuto
    const totalMinutes = totalTimeMs / 60000;
    const imagesPerMinute = totalMinutes > 0 ? (processed / totalMinutes).toFixed(1) : '0';

    // IMPORTANTE: Limpar generatingImage de todas as cenas ao finalizar
    // Isso evita que cenas fiquem presas em estado de loading
    const cleanedScenes = scenesRef.current.map((scene, idx) => ({
      ...scene,
      generatingImage: false, // Sempre limpar - se gerou, tem imagem; se falhou, não gerando
    }));
    scenesRef.current = cleanedScenes;

    setState(prev => ({
      ...prev,
      isGenerating: false,
      currentSceneIndex: null,
      currentPrompt: null,
      startTime: null,
      scenes: cleanedScenes, // Atualizar com cenas limpas
      failedIndexes: failedIdxs,
      rateLimitHit: rateLimitEncountered,
      rewriteProgress: initialRewriteProgress,
    }));

    if (cancelRef.current) {
      toast({
        title: "Geração cancelada",
        description: `${processed} imagens em ${timeString} (${imagesPerMinute} img/min)`,
      });
    } else if (!errorOccurred) {
      if (rateLimitEncountered && failed > 0) {
        toast({
          title: "⏳ Limite de requisições atingido",
          description: `${processed} criadas, ${failed} falharam em ${timeString} (${imagesPerMinute} img/min)`,
          variant: "destructive",
        });
      } else if (failed > 0) {
        toast({
          title: "Geração parcial",
          description: `${processed}/${pendingIndexes.length} em ${timeString} (${imagesPerMinute} img/min). ${failed} falharam.`,
        });
      } else {
        toast({
          title: "✅ Todas as imagens geradas!",
          description: `${processed} imagens em ${timeString} (${imagesPerMinute} img/min)`,
        });
      }
    }
  }, [state.isGenerating, generateSingleImage, toast]);

  const cancelGeneration = useCallback(() => {
    cancelRef.current = true;
    toast({ title: "Cancelando...", description: "Aguarde o lote atual finalizar" });
  }, [toast]);

  const getUpdatedScenes = useCallback(() => {
    return scenesRef.current;
  }, []);

  const clearState = useCallback(() => {
    cancelRef.current = true;
    setState(initialState);
    scenesRef.current = [];
  }, []);

  const syncScenes = useCallback((scenes: ScenePrompt[]) => {
    if (!state.isGenerating) {
      scenesRef.current = scenes;
      setState(prev => ({ ...prev, scenes }));
    }
  }, [state.isGenerating]);

  const setCharacters = useCallback((characters: CharacterDescription[]) => {
    setState(prev => ({ ...prev, characters }));
  }, []);

  const cookieModalValue = getCookieModalState();

  return (
    <BackgroundImageGenerationContext.Provider value={{
      state,
      startGeneration,
      cancelGeneration,
      getUpdatedScenes,
      clearState,
      syncScenes,
      setCharacters,
      cookieModal: cookieModalValue,
    }}>
      {children}
    </BackgroundImageGenerationContext.Provider>
  );
};

export const useBackgroundImageGeneration = () => {
  const context = useContext(BackgroundImageGenerationContext);
  if (!context) {
    throw new Error('useBackgroundImageGeneration must be used within BackgroundImageGenerationProvider');
  }
  return context;
};
