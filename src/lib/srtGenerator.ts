/**
 * Gerador de SRT inteligente para narração
 * - Blocos de no máximo 499 caracteres
 * - Não corta palavras ou frases no meio
 * - Gap configurável: 10s para CapCut manual, 0s para sincronização com imagens
 */

interface SrtBlock {
  index: number;
  startSeconds: number;
  endSeconds: number;
  text: string;
}

/**
 * Formata segundos para formato SRT (HH:MM:SS,mmm)
 */
const formatSrtTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
};

/**
 * Divide texto em blocos de no máximo maxChars caracteres
 * PRIORIDADE: Manter frases e parágrafos inteiros
 * NUNCA corta palavras no meio
 */
const splitTextIntoBlocks = (text: string, maxChars: number = 499): string[] => {
  const cleanText = text.trim();
  
  if (cleanText.length <= maxChars) {
    return [cleanText];
  }

  const blocks: string[] = [];
  
  // 1. Primeiro, dividir por parágrafos (quebras de linha)
  const paragraphs = cleanText.split(/\n\n+/).filter(p => p.trim().length > 0);
  
  for (const paragraph of paragraphs) {
    if (paragraph.length <= maxChars) {
      // Parágrafo cabe inteiro - tentar adicionar ao último bloco ou criar novo
      if (blocks.length > 0) {
        const lastBlock = blocks[blocks.length - 1];
        const combined = `${lastBlock}\n\n${paragraph}`;
        if (combined.length <= maxChars) {
          blocks[blocks.length - 1] = combined;
          continue;
        }
      }
      blocks.push(paragraph.trim());
    } else {
      // Parágrafo muito longo - dividir por sentenças
      // Sentenças terminam com . ! ? seguido de espaço ou fim
      const sentences = paragraph.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
      
      let currentBlock = '';
      
      for (const sentence of sentences) {
        if (sentence.length > maxChars) {
          // Sentença muito longa - dividir por palavras (mantendo palavras inteiras)
          if (currentBlock.trim().length > 0) {
            blocks.push(currentBlock.trim());
            currentBlock = '';
          }
          
          const words = sentence.split(/\s+/).filter(w => w.length > 0);
          
          for (const word of words) {
            if (currentBlock.length === 0) {
              currentBlock = word;
            } else {
              const testBlock = `${currentBlock} ${word}`;
              if (testBlock.length <= maxChars) {
                currentBlock = testBlock;
              } else {
                // Salvar bloco atual e começar novo
                blocks.push(currentBlock.trim());
                currentBlock = word;
              }
            }
          }
        } else {
          // Sentença cabe no limite
          if (currentBlock.length === 0) {
            currentBlock = sentence;
          } else {
            const testBlock = `${currentBlock} ${sentence}`;
            if (testBlock.length <= maxChars) {
              currentBlock = testBlock;
            } else {
              // Salvar bloco atual e começar novo com a sentença
              blocks.push(currentBlock.trim());
              currentBlock = sentence;
            }
          }
        }
      }
      
      // Salvar último bloco do parágrafo
      if (currentBlock.trim().length > 0) {
        blocks.push(currentBlock.trim());
      }
    }
  }

  // Validação final: garantir que nenhum bloco excede o limite
  const validatedBlocks: string[] = [];
  
  for (const block of blocks) {
    if (block.length <= maxChars) {
      validatedBlocks.push(block);
    } else {
      // Fallback: dividir por palavras se ainda exceder
      const words = block.split(/\s+/).filter(w => w.length > 0);
      let current = '';
      
      for (const word of words) {
        if (current.length === 0) {
          current = word;
        } else {
          const test = `${current} ${word}`;
          if (test.length <= maxChars) {
            current = test;
          } else {
            validatedBlocks.push(current);
            current = word;
          }
        }
      }
      
      if (current.length > 0) {
        validatedBlocks.push(current);
      }
    }
  }

  return validatedBlocks;
};

/**
 * Calcula duração estimada de leitura (150 palavras por minuto)
 */
const calculateReadingDuration = (text: string): number => {
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
  const wordsPerSecond = 150 / 60; // 2.5 palavras por segundo
  return Math.max(2, wordCount / wordsPerSecond); // Mínimo 2 segundos
};

interface SceneForSrt {
  number: number;
  text: string;
  startSeconds: number;
  endSeconds: number;
}

/**
 * Gera conteúdo SRT a partir de texto
 * Cada bloco tem no máximo 499 caracteres
 * Opção de gap entre blocos (padrão: 0 para narração contínua)
 */
export const generateNarrationSrt = (
  scenes: SceneForSrt[],
  options: {
    maxCharsPerBlock?: number;
    gapBetweenScenes?: number;
    wordsPerMinute?: number;
  } = {}
): string => {
  const maxChars = options.maxCharsPerBlock ?? 499;
  // Gap de 10 segundos entre blocos para facilitar edição no CapCut
  // Permite ajustar voiceover sem encavalamento
  const gapBetweenBlocks = options.gapBetweenScenes ?? 10;
  const wpm = options.wordsPerMinute ?? 150; // WPM padrão

  const srtBlocks: SrtBlock[] = [];
  let blockIndex = 1;
  let currentTime = 0;

  // Combinar todo o texto de todas as cenas
  const allText = scenes.map(s => s.text).join('\n\n');
  
  // Dividir em blocos respeitando limite de caracteres
  const textBlocks = splitTextIntoBlocks(allText, maxChars);
  
  // Calcular duração de cada bloco baseado em WPM
  const wordsPerSecond = wpm / 60;

  // Distribuir tempo baseado em palavras de cada bloco
  textBlocks.forEach((blockText, idx) => {
    const blockWords = blockText.split(/\s+/).filter(w => w.length > 0).length;
    // Duração baseada em palavras (mínimo 2 segundos)
    const blockDuration = Math.max(2, blockWords / wordsPerSecond);
    
    const startSeconds = currentTime;
    const endSeconds = currentTime + blockDuration;

    srtBlocks.push({
      index: blockIndex++,
      startSeconds,
      endSeconds,
      text: blockText
    });

    // Avançar tempo: fim do bloco + gap (apenas se não for o último)
    if (idx < textBlocks.length - 1) {
      currentTime = endSeconds + gapBetweenBlocks;
    } else {
      currentTime = endSeconds;
    }
  });

  // Gera o conteúdo SRT
  return srtBlocks.map(block => 
    `${block.index}\n${formatSrtTime(block.startSeconds)} --> ${formatSrtTime(block.endSeconds)}\n${block.text}\n`
  ).join('\n');
};

/**
 * Gera SRT simples (sem divisão por caracteres, uma entrada por cena)
 * Para compatibilidade com o formato antigo
 */
export const generateSimpleSrt = (scenes: SceneForSrt[]): string => {
  return scenes.map((scene, idx) => {
    const startSrt = formatSrtTime(scene.startSeconds);
    const endSrt = formatSrtTime(scene.endSeconds);
    return `${idx + 1}\n${startSrt} --> ${endSrt}\n${scene.text}\n`;
  }).join('\n');
};

/**
 * Valida se todos os blocos respeitam o limite de caracteres
 */
export const validateSrtBlocks = (srt: string, maxChars: number = 499): boolean => {
  const blocks = srt.split('\n\n').filter(b => b.trim().length > 0);
  
  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length >= 3) {
      const textLines = lines.slice(2).join(' ');
      if (textLines.length > maxChars) {
        return false;
      }
    }
  }
  
  return true;
};

/**
 * Conta o número de blocos no SRT
 */
export const countSrtBlocks = (srt: string): number => {
  const blocks = srt.split('\n\n').filter(b => b.trim().length > 0);
  return blocks.length;
};
