/**
 * Gerador de XML (Final Cut Pro 7 XML) para DaVinci Resolve
 * Formato compatível com DaVinci Resolve 16+ e outros NLEs
 * Versão Cinematográfica Profissional
 */

interface SceneForXml {
  number: number;
  text: string;
  durationSeconds: number;
  imagePath?: string;
  kenBurnsMotion?: KenBurnsMotion;
}

/**
 * Tipos de movimento Ken Burns
 */
export type KenBurnsMotionType = 
  | 'zoom_in' 
  | 'zoom_out' 
  | 'pan_left' 
  | 'pan_right' 
  | 'pan_up' 
  | 'pan_down'
  | 'zoom_in_pan_right'
  | 'zoom_in_pan_left'
  | 'zoom_out_pan_right'
  | 'zoom_out_pan_left'
  | 'static';

export interface KenBurnsMotion {
  type: KenBurnsMotionType;
  intensity: 'subtle' | 'normal' | 'dramatic';
  reason?: string;
}

export interface KenBurnsOption {
  id: KenBurnsMotionType;
  name: string;
  description: string;
  icon: string;
}

export const KEN_BURNS_OPTIONS: KenBurnsOption[] = [
  { id: 'zoom_in', name: 'Zoom In', description: 'Aproximar - foco, tensão, intimidade', icon: '🔍' },
  { id: 'zoom_out', name: 'Zoom Out', description: 'Afastar - revelação, contexto, épico', icon: '🔭' },
  { id: 'pan_left', name: 'Pan Esquerda', description: 'Movimento lateral - transição, passagem de tempo', icon: '⬅️' },
  { id: 'pan_right', name: 'Pan Direita', description: 'Movimento lateral - progressão, avanço', icon: '➡️' },
  { id: 'pan_up', name: 'Pan Cima', description: 'Movimento vertical - grandeza, esperança', icon: '⬆️' },
  { id: 'pan_down', name: 'Pan Baixo', description: 'Movimento vertical - introspecção, peso', icon: '⬇️' },
  { id: 'zoom_in_pan_right', name: 'Zoom + Pan Direita', description: 'Combinado - ação intensa, perseguição', icon: '↗️' },
  { id: 'zoom_in_pan_left', name: 'Zoom + Pan Esquerda', description: 'Combinado - descoberta dramática', icon: '↖️' },
  { id: 'zoom_out_pan_right', name: 'Zoom Out + Pan Direita', description: 'Combinado - épico revelador', icon: '↘️' },
  { id: 'zoom_out_pan_left', name: 'Zoom Out + Pan Esquerda', description: 'Combinado - conclusão grandiosa', icon: '↙️' },
  { id: 'static', name: 'Estático', description: 'Sem movimento - momento de pausa', icon: '⏸️' },
];

/**
 * Palavras-chave para análise de movimento de câmera baseada no conteúdo
 */
const MOTION_KEYWORDS = {
  zoom_in: [
    'foco', 'detalhe', 'olha', 'veja', 'observe', 'atenção', 'importante', 'crucial',
    'segredo', 'mistério', 'tensão', 'medo', 'terror', 'surpresa', 'choque', 'rosto',
    'olhos', 'expressão', 'emoção', 'intimidade', 'perto', 'aproximar', 'revelar',
    'descobrir', 'perceber', 'notar', 'examinar', 'analisar', 'estudar', 'entender',
    'focus', 'detail', 'look', 'watch', 'attention', 'important', 'crucial', 'secret',
    'mystery', 'tension', 'fear', 'terror', 'surprise', 'shock', 'face', 'eyes'
  ],
  zoom_out: [
    'panorama', 'visão geral', 'contexto', 'mundo', 'universo', 'tudo', 'inteiro',
    'completo', 'épico', 'grandioso', 'imenso', 'vasto', 'horizonte', 'paisagem',
    'natureza', 'montanha', 'oceano', 'céu', 'espaço', 'multidão', 'cidade', 'país',
    'revelação', 'conclusão', 'final', 'resultado', 'consequência', 'magnitude',
    'overview', 'context', 'world', 'universe', 'everything', 'complete', 'epic',
    'grand', 'immense', 'vast', 'horizon', 'landscape', 'nature', 'mountain'
  ],
  pan_left: [
    'passado', 'antes', 'anterior', 'memória', 'lembrança', 'recordar', 'voltar',
    'retorno', 'origem', 'início', 'começo', 'tradição', 'história', 'legado',
    'past', 'before', 'memory', 'remember', 'return', 'origin', 'beginning', 'start'
  ],
  pan_right: [
    'futuro', 'depois', 'próximo', 'adiante', 'avançar', 'progresso', 'evolução',
    'crescimento', 'desenvolvimento', 'inovação', 'novo', 'moderno', 'tecnologia',
    'destino', 'objetivo', 'meta', 'sonho', 'ambição', 'esperança', 'possibilidade',
    'future', 'next', 'forward', 'progress', 'evolution', 'growth', 'development'
  ],
  pan_up: [
    'céu', 'alto', 'subir', 'ascender', 'elevar', 'voar', 'sonho', 'esperança',
    'liberdade', 'sucesso', 'vitória', 'conquista', 'poder', 'força', 'divino',
    'espiritual', 'transcender', 'inspiração', 'motivação', 'potencial', 'glória',
    'sky', 'high', 'rise', 'ascend', 'fly', 'dream', 'hope', 'freedom', 'success'
  ],
  pan_down: [
    'terra', 'chão', 'baixo', 'descer', 'cair', 'peso', 'gravidade', 'realidade',
    'fundação', 'base', 'raiz', 'origem', 'profundo', 'introspectivo', 'sombra',
    'tristeza', 'derrota', 'fracasso', 'perda', 'luto', 'reflexão', 'humildade',
    'ground', 'down', 'fall', 'weight', 'gravity', 'reality', 'foundation', 'deep'
  ],
  action_intense: [
    'ação', 'velocidade', 'rápido', 'urgente', 'emergência', 'perseguição', 'fuga',
    'luta', 'batalha', 'guerra', 'conflito', 'explosão', 'impacto', 'colisão',
    'corrida', 'correr', 'saltar', 'pular', 'atacar', 'defender', 'destruir',
    'action', 'speed', 'fast', 'urgent', 'emergency', 'chase', 'escape', 'fight'
  ],
  dramatic_reveal: [
    'mas', 'porém', 'entretanto', 'contudo', 'surpreendente', 'incrível', 'chocante',
    'inesperado', 'plot twist', 'virada', 'reviravolta', 'revelação', 'verdade',
    'but', 'however', 'surprising', 'incredible', 'shocking', 'unexpected', 'twist'
  ]
};

/**
 * Analisa o texto da cena e sugere movimento Ken Burns apropriado
 */
export const analyzeSceneForKenBurns = (
  text: string,
  sceneIndex: number,
  totalScenes: number,
  previousMotion?: KenBurnsMotionType
): KenBurnsMotion => {
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);
  
  // Scoring para cada tipo de movimento
  const scores: Record<string, number> = {
    zoom_in: 0,
    zoom_out: 0,
    pan_left: 0,
    pan_right: 0,
    pan_up: 0,
    pan_down: 0,
    action_intense: 0,
    dramatic_reveal: 0,
  };
  
  // Calcular scores baseado em palavras-chave
  for (const [motionType, keywords] of Object.entries(MOTION_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerText.includes(keyword)) {
        scores[motionType] += keyword.length > 5 ? 2 : 1;
      }
    }
  }
  
  // Determinar o movimento baseado nos scores
  let selectedMotion: KenBurnsMotionType = 'zoom_in';
  let intensity: 'subtle' | 'normal' | 'dramatic' = 'normal';
  let reason = '';
  
  // Ação intensa = combinação de zoom + pan
  if (scores.action_intense >= 3) {
    selectedMotion = previousMotion === 'zoom_in_pan_right' ? 'zoom_in_pan_left' : 'zoom_in_pan_right';
    intensity = 'dramatic';
    reason = 'Cena de ação intensa detectada';
  }
  // Revelação dramática = zoom out
  else if (scores.dramatic_reveal >= 2) {
    selectedMotion = 'zoom_out';
    intensity = 'dramatic';
    reason = 'Momento de revelação dramática';
  }
  // PRIMEIRAS 3 CENAS = Máximo impacto para retenção de audiência
  else if (sceneIndex === 0) {
    selectedMotion = 'zoom_in_pan_right';
    intensity = 'dramatic';
    reason = 'Abertura IMPACTANTE - prender atenção nos primeiros segundos';
  }
  else if (sceneIndex === 1) {
    selectedMotion = 'zoom_out_pan_left';
    intensity = 'dramatic';
    reason = 'Segunda cena - revelação épica para manter retenção';
  }
  else if (sceneIndex === 2) {
    selectedMotion = 'zoom_in';
    intensity = 'dramatic';
    reason = 'Terceira cena - foco intenso para consolidar audiência';
  }
  // Última cena = zoom out para conclusão épica
  else if (sceneIndex === totalScenes - 1) {
    selectedMotion = 'zoom_out';
    intensity = 'dramatic';
    reason = 'Conclusão - revelação final';
  }
  // Baseado no score mais alto
  else {
    const maxScore = Math.max(
      scores.zoom_in,
      scores.zoom_out,
      scores.pan_left,
      scores.pan_right,
      scores.pan_up,
      scores.pan_down
    );
    
    if (maxScore > 0) {
      if (scores.zoom_in === maxScore) {
        selectedMotion = 'zoom_in';
        reason = 'Foco em detalhes/emoção';
      } else if (scores.zoom_out === maxScore) {
        selectedMotion = 'zoom_out';
        reason = 'Contexto/visão geral';
      } else if (scores.pan_up === maxScore) {
        selectedMotion = 'pan_up';
        reason = 'Elevação/esperança';
      } else if (scores.pan_down === maxScore) {
        selectedMotion = 'pan_down';
        reason = 'Introspecção/peso';
      } else if (scores.pan_left === maxScore) {
        selectedMotion = 'pan_left';
        reason = 'Referência ao passado';
      } else if (scores.pan_right === maxScore) {
        selectedMotion = 'pan_right';
        reason = 'Progressão/futuro';
      }
      
      intensity = maxScore >= 4 ? 'dramatic' : maxScore >= 2 ? 'normal' : 'subtle';
    } else {
      // Alternar entre zoom in e zoom out se não houver keywords
      selectedMotion = previousMotion === 'zoom_in' ? 'zoom_out' : 'zoom_in';
      intensity = 'subtle';
      reason = 'Variação para manter dinamismo';
    }
  }
  
  // Evitar repetição excessiva do mesmo movimento
  if (selectedMotion === previousMotion && sceneIndex > 1) {
    const alternatives: KenBurnsMotionType[] = ['zoom_in', 'zoom_out', 'pan_right', 'pan_left'];
    const alternativeIndex = sceneIndex % alternatives.length;
    selectedMotion = alternatives[alternativeIndex];
    reason = 'Variação para evitar repetição';
  }
  
  return {
    type: selectedMotion,
    intensity,
    reason,
  };
};

/**
 * Aplica análise Ken Burns a todas as cenas
 * Respeita movimentos já configurados manualmente
 */
export const applyKenBurnsToScenes = (scenes: SceneForXml[]): SceneForXml[] => {
  let previousMotion: KenBurnsMotionType | undefined;
  
  return scenes.map((scene, index) => {
    // Se já tem Ken Burns configurado manualmente, manter
    if (scene.kenBurnsMotion) {
      previousMotion = scene.kenBurnsMotion.type;
      return scene;
    }
    
    // Caso contrário, analisar automaticamente
    const motion = analyzeSceneForKenBurns(scene.text, index, scenes.length, previousMotion);
    previousMotion = motion.type;
    
    return {
      ...scene,
      kenBurnsMotion: motion,
    };
  });
};

/**
 * Gera os parâmetros de keyframe para o movimento Ken Burns
 */
const getKenBurnsKeyframeParams = (
  motion: KenBurnsMotion,
  durationFrames: number,
  sceneIndex?: number
): { startScale: number; endScale: number; startX: number; endX: number; startY: number; endY: number } => {
  // Intensidade maior para as primeiras 3 cenas (retenção)
  const isIntroScene = sceneIndex !== undefined && sceneIndex < 3;
  const introBoost = isIntroScene ? 1.3 : 1.0;
  
  const intensityMultiplier = (motion.intensity === 'dramatic' ? 1.5 : motion.intensity === 'subtle' ? 0.5 : 1.0) * introBoost;
  
  // IMPORTANTE: Usar escala base de 1.08 (108%) para garantir que a imagem sempre cubra a tela
  // Isso evita bordas pretas durante qualquer movimento de zoom ou pan
  const safeBaseScale = 1.08; // Margem de segurança de 8%
  const baseZoom = 0.06 * intensityMultiplier; // Aumentado para cenas de introdução
  const basePan = 0.04 * intensityMultiplier; // Aumentado para cenas de introdução
  
  let params = {
    startScale: safeBaseScale,
    endScale: safeBaseScale,
    startX: 0,
    endX: 0,
    startY: 0,
    endY: 0,
  };
  
  switch (motion.type) {
    case 'zoom_in':
      params.startScale = safeBaseScale;
      params.endScale = safeBaseScale + baseZoom;
      break;
    case 'zoom_out':
      // Zoom out: começa maior e termina na escala de segurança (nunca abaixo)
      params.startScale = safeBaseScale + baseZoom;
      params.endScale = safeBaseScale;
      break;
    case 'pan_left':
      params.startX = basePan;
      params.endX = -basePan;
      break;
    case 'pan_right':
      params.startX = -basePan;
      params.endX = basePan;
      break;
    case 'pan_up':
      params.startY = basePan;
      params.endY = -basePan;
      break;
    case 'pan_down':
      params.startY = -basePan;
      params.endY = basePan;
      break;
    case 'zoom_in_pan_right':
      params.startScale = safeBaseScale;
      params.endScale = safeBaseScale + baseZoom;
      params.startX = -basePan * 0.5;
      params.endX = basePan * 0.5;
      break;
    case 'zoom_in_pan_left':
      params.startScale = safeBaseScale;
      params.endScale = safeBaseScale + baseZoom;
      params.startX = basePan * 0.5;
      params.endX = -basePan * 0.5;
      break;
    case 'zoom_out_pan_right':
      params.startScale = safeBaseScale + baseZoom;
      params.endScale = safeBaseScale;
      params.startX = -basePan * 0.5;
      params.endX = basePan * 0.5;
      break;
    case 'zoom_out_pan_left':
      params.startScale = safeBaseScale + baseZoom;
      params.endScale = safeBaseScale;
      params.startX = basePan * 0.5;
      params.endX = -basePan * 0.5;
      break;
    case 'static':
    default:
      // Sem movimento, mas mantém escala de segurança
      break;
  }
  
  return params;
};


/**
 * Gera XML de keyframes para efeito Ken Burns
 */
const generateKenBurnsKeyframesXml = (
  motion: KenBurnsMotion | undefined,
  durationFrames: number,
  fps: number,
  sceneIndex?: number
): string => {
  if (!motion || motion.type === 'static') {
    return '';
  }
  
  const params = getKenBurnsKeyframeParams(motion, durationFrames, sceneIndex);
  
  // Gerar XML de keyframes para transformação
  return `                <filter>
                  <effect>
                    <name>Basic Motion</name>
                    <effectid>basic</effectid>
                    <effectcategory>motion</effectcategory>
                    <effecttype>motion</effecttype>
                    <mediatype>video</mediatype>
                    <parameter authoringApp="FCP">
                      <parameterid>scale</parameterid>
                      <name>Scale</name>
                      <valuemin>0</valuemin>
                      <valuemax>10000</valuemax>
                      <value>${(params.startScale * 100).toFixed(1)}</value>
                      <keyframe>
                        <when>0</when>
                        <value>${(params.startScale * 100).toFixed(1)}</value>
                        <interpolation>
                          <name>bezier</name>
                        </interpolation>
                      </keyframe>
                      <keyframe>
                        <when>${durationFrames}</when>
                        <value>${(params.endScale * 100).toFixed(1)}</value>
                        <interpolation>
                          <name>bezier</name>
                        </interpolation>
                      </keyframe>
                    </parameter>
                    <parameter authoringApp="FCP">
                      <parameterid>center</parameterid>
                      <name>Center</name>
                      <value>
                        <horiz>${params.startX.toFixed(4)}</horiz>
                        <vert>${params.startY.toFixed(4)}</vert>
                      </value>
                      <keyframe>
                        <when>0</when>
                        <value>
                          <horiz>${params.startX.toFixed(4)}</horiz>
                          <vert>${params.startY.toFixed(4)}</vert>
                        </value>
                        <interpolation>
                          <name>bezier</name>
                        </interpolation>
                      </keyframe>
                      <keyframe>
                        <when>${durationFrames}</when>
                        <value>
                          <horiz>${params.endX.toFixed(4)}</horiz>
                          <vert>${params.endY.toFixed(4)}</vert>
                        </value>
                        <interpolation>
                          <name>bezier</name>
                        </interpolation>
                      </keyframe>
                    </parameter>
                  </effect>
                </filter>
`;
};

/**
 * Tipos de transição disponíveis - Expandido para DaVinci Resolve
 */
export type TransitionType = 
  // Dissolve
  | 'cross_dissolve' 
  | 'fade_to_black' 
  | 'dip_to_color' 
  | 'additive_dissolve'
  | 'non_additive_dissolve'
  | 'blur_dissolve'
  // Íris
  | 'iris_circle'
  | 'iris_diamond'
  | 'iris_cross'
  | 'iris_oval'
  | 'iris_star'
  | 'iris_hexagon'
  // Movimento
  | 'push'
  | 'slide'
  | 'split'
  | 'door_open'
  // Wipe
  | 'wipe'
  | 'wipe_up'
  | 'wipe_down'
  // Cortina
  | 'center_curtain'
  | 'band_curtain'
  | 'edge_curtain'
  | 'clock_curtain'
  | 'spiral_curtain'
  // Forma
  | 'heart_shape'
  | 'star_shape'
  | 'box_shape'
  // Nenhum
  | 'none';

export interface TransitionOption {
  id: TransitionType;
  name: string;
  namePt: string;
  description: string;
  icon: string;
  category: 'dissolve' | 'iris' | 'movement' | 'wipe' | 'curtain' | 'shape' | 'none';
  emotionFit: string[]; // Emoções que combinam com esta transição
}

export const TRANSITION_OPTIONS: TransitionOption[] = [
  // Dissolve
  { id: 'cross_dissolve', name: 'Cross Dissolve', namePt: 'Dissolução Cruzada', description: 'Dissolução suave e versátil', icon: '🔄', category: 'dissolve', emotionFit: ['calmo', 'reflexivo', 'neutro', 'triste', 'sereno', 'nostálgico'] },
  { id: 'fade_to_black', name: 'Fade to Black', namePt: 'Fade para Preto', description: 'Transição dramática via preto', icon: '⬛', category: 'dissolve', emotionFit: ['triste', 'sombrio', 'misterioso', 'tenso', 'fim', 'morte', 'terror'] },
  { id: 'dip_to_color', name: 'Dip to Color', namePt: 'Clarão Branco', description: 'Flash branco impactante', icon: '⬜', category: 'dissolve', emotionFit: ['choque', 'revelação', 'flashback', 'divino', 'esperança', 'despertar'] },
  { id: 'additive_dissolve', name: 'Additive Dissolve', namePt: 'Dissolução Aditiva', description: 'Brilho aditivo entre cenas', icon: '✨', category: 'dissolve', emotionFit: ['sonho', 'memória', 'fantasia', 'mágico', 'etéreo'] },
  { id: 'non_additive_dissolve', name: 'Non-Additive Dissolve', namePt: 'Dissolução Não Aditiva', description: 'Mistura sem brilho extra', icon: '💫', category: 'dissolve', emotionFit: ['neutro', 'documental', 'realista', 'sutil'] },
  { id: 'blur_dissolve', name: 'Blur Dissolve', namePt: 'Dissolução Desfoque', description: 'Desfoque suave entre cenas', icon: '🌫️', category: 'dissolve', emotionFit: ['sonho', 'confusão', 'vertigem', 'bêbado', 'visão', 'memória'] },
  
  // Íris
  { id: 'iris_circle', name: 'Iris Circle', namePt: 'Íris de Círculo', description: 'Abertura circular clássica', icon: '⭕', category: 'iris', emotionFit: ['foco', 'destaque', 'importante', 'descoberta', 'vintage'] },
  { id: 'iris_diamond', name: 'Iris Diamond', namePt: 'Íris de Diamante', description: 'Forma de losango', icon: '💎', category: 'iris', emotionFit: ['luxo', 'precioso', 'valioso', 'rico', 'elegante'] },
  { id: 'iris_cross', name: 'Iris Cross', namePt: 'Íris de Cruz', description: 'Forma de cruz', icon: '➕', category: 'iris', emotionFit: ['espiritual', 'religioso', 'sagrado', 'fé'] },
  { id: 'iris_oval', name: 'Iris Oval', namePt: 'Íris Oval', description: 'Forma oval suave', icon: '🔘', category: 'iris', emotionFit: ['retrato', 'personagem', 'foco', 'intimidade'] },
  { id: 'iris_star', name: 'Iris Star', namePt: 'Íris Estrela', description: 'Forma de estrela', icon: '⭐', category: 'iris', emotionFit: ['mágico', 'celebração', 'vitória', 'show', 'famoso'] },
  { id: 'iris_hexagon', name: 'Iris Hexagon', namePt: 'Íris Hexagonal', description: 'Forma geométrica hexagonal', icon: '⬡', category: 'iris', emotionFit: ['tecnológico', 'futurista', 'científico', 'moderno'] },
  
  // Movimento
  { id: 'push', name: 'Push', namePt: 'Empurrar', description: 'Empurra a cena anterior', icon: '👉', category: 'movement', emotionFit: ['ação', 'rápido', 'urgente', 'próximo', 'progressão'] },
  { id: 'slide', name: 'Slide', namePt: 'Deslizar', description: 'Desliza lateralmente', icon: '➡️', category: 'movement', emotionFit: ['transição', 'mudança', 'viagem', 'passagem de tempo'] },
  { id: 'split', name: 'Split', namePt: 'Divisão', description: 'Divide a tela ao meio', icon: '↔️', category: 'movement', emotionFit: ['divisão', 'escolha', 'conflito', 'antes_depois', 'comparação'] },
  { id: 'door_open', name: 'Door Open', namePt: 'Abertura de Porta', description: 'Efeito de porta abrindo', icon: '🚪', category: 'movement', emotionFit: ['entrada', 'descoberta', 'novo', 'portal', 'mistério'] },
  
  // Wipe
  { id: 'wipe', name: 'Wipe', namePt: 'Cortina Lateral', description: 'Cortina lateral para revelação', icon: '🎭', category: 'wipe', emotionFit: ['revelação', 'lista', 'sequência', 'clássico'] },
  { id: 'wipe_up', name: 'Wipe Up', namePt: 'Cortina para Cima', description: 'Cortina subindo', icon: '⬆️', category: 'wipe', emotionFit: ['ascensão', 'esperança', 'elevação', 'céu', 'subir'] },
  { id: 'wipe_down', name: 'Wipe Down', namePt: 'Cortina para Baixo', description: 'Cortina descendo', icon: '⬇️', category: 'wipe', emotionFit: ['queda', 'descenso', 'inferno', 'profundo', 'descer'] },
  
  // Cortina
  { id: 'center_curtain', name: 'Center Curtain', namePt: 'Cortina Central', description: 'Abre do centro', icon: '🎪', category: 'curtain', emotionFit: ['show', 'apresentação', 'palco', 'teatro', 'início'] },
  { id: 'band_curtain', name: 'Band Curtain', namePt: 'Cortina de Banda', description: 'Faixas múltiplas', icon: '📊', category: 'curtain', emotionFit: ['dados', 'estatísticas', 'comparação', 'múltiplo'] },
  { id: 'edge_curtain', name: 'Edge Curtain', namePt: 'Cortina de Borda', description: 'Fecha pelas bordas', icon: '🔲', category: 'curtain', emotionFit: ['conclusão', 'fechamento', 'fim', 'encerramento'] },
  { id: 'clock_curtain', name: 'Clock Curtain', namePt: 'Cortina Relógio', description: 'Movimento circular tipo relógio', icon: '⏰', category: 'curtain', emotionFit: ['tempo', 'passagem', 'relógio', 'deadline', 'urgência'] },
  { id: 'spiral_curtain', name: 'Spiral Curtain', namePt: 'Cortina Espiral', description: 'Efeito de espiral', icon: '🌀', category: 'curtain', emotionFit: ['hipnose', 'confusão', 'vertigem', 'portal', 'dimensional'] },
  
  // Forma
  { id: 'heart_shape', name: 'Heart Shape', namePt: 'Coração', description: 'Forma de coração', icon: '❤️', category: 'shape', emotionFit: ['amor', 'romance', 'paixão', 'carinho', 'afeição'] },
  { id: 'star_shape', name: 'Star Shape', namePt: 'Estrela', description: 'Forma de estrela', icon: '⭐', category: 'shape', emotionFit: ['celebração', 'conquista', 'destaque', 'famoso', 'brilho'] },
  { id: 'box_shape', name: 'Box Shape', namePt: 'Caixa', description: 'Forma quadrada', icon: '⬜', category: 'shape', emotionFit: ['corporativo', 'formal', 'estruturado', 'sério'] },
  
  // Nenhum
  { id: 'none', name: 'Cut', namePt: 'Corte Seco', description: 'Corte direto sem transição', icon: '✂️', category: 'none', emotionFit: ['impacto', 'choque', 'surpresa', 'violento', 'rápido', 'terror', 'susto'] },
];

/**
 * Mapeamento de emoções para transições ideais
 */
export const EMOTION_TRANSITION_MAP: Record<string, TransitionType[]> = {
  // Emoções Positivas
  'alegria': ['cross_dissolve', 'additive_dissolve', 'star_shape'],
  'esperança': ['dip_to_color', 'wipe_up', 'iris_star'],
  'amor': ['heart_shape', 'blur_dissolve', 'cross_dissolve'],
  'celebração': ['center_curtain', 'star_shape', 'additive_dissolve'],
  'vitória': ['push', 'iris_star', 'center_curtain'],
  'paz': ['cross_dissolve', 'blur_dissolve', 'fade_to_black'],
  
  // Emoções Negativas
  'tristeza': ['fade_to_black', 'cross_dissolve', 'blur_dissolve'],
  'medo': ['fade_to_black', 'none', 'door_open'],
  'terror': ['none', 'fade_to_black', 'spiral_curtain'],
  'raiva': ['push', 'none', 'wipe'],
  'angústia': ['blur_dissolve', 'fade_to_black', 'spiral_curtain'],
  'desespero': ['fade_to_black', 'wipe_down', 'none'],
  
  // Emoções Neutras/Especiais
  'curiosidade': ['door_open', 'iris_circle', 'wipe'],
  'surpresa': ['none', 'dip_to_color', 'push'],
  'mistério': ['fade_to_black', 'door_open', 'spiral_curtain'],
  'nostalgia': ['blur_dissolve', 'cross_dissolve', 'additive_dissolve'],
  'tensão': ['none', 'fade_to_black', 'clock_curtain'],
  'reflexão': ['cross_dissolve', 'blur_dissolve', 'fade_to_black'],
  
  // Contextos Especiais
  'flashback': ['dip_to_color', 'blur_dissolve', 'additive_dissolve'],
  'sonho': ['blur_dissolve', 'additive_dissolve', 'spiral_curtain'],
  'revelação': ['dip_to_color', 'iris_circle', 'center_curtain'],
  'passagem_tempo': ['clock_curtain', 'slide', 'wipe'],
  'morte': ['fade_to_black', 'wipe_down', 'edge_curtain'],
  'nascimento': ['dip_to_color', 'wipe_up', 'iris_circle'],
  
  // Ritmos
  'ação': ['push', 'none', 'slide'],
  'lento': ['cross_dissolve', 'blur_dissolve', 'fade_to_black'],
  'épico': ['fade_to_black', 'additive_dissolve', 'center_curtain'],
  'documentário': ['cross_dissolve', 'wipe', 'push'],
  'espiritual': ['iris_cross', 'dip_to_color', 'additive_dissolve'],
  'tecnológico': ['iris_hexagon', 'slide', 'push'],
};

/**
 * Interface para cena com transição automática
 */
export interface SceneTransition {
  transitionType: TransitionType;
  transitionDuration: number; // em segundos
  reason: string;
}

/**
 * Analisa a emoção/gatilho da cena e sugere a melhor transição
 */
export const analyzeSceneForTransition = (
  currentText: string,
  currentEmotion: string | undefined,
  currentTrigger: string | undefined,
  nextText: string | undefined,
  nextEmotion: string | undefined,
  sceneIndex: number,
  totalScenes: number,
  previousTransition?: TransitionType
): SceneTransition => {
  // Normalizar emoção para lowercase
  const emotion = currentEmotion?.toLowerCase().trim() || '';
  const trigger = currentTrigger?.toLowerCase().trim() || '';
  const textLower = currentText.toLowerCase();
  const nextTextLower = nextText?.toLowerCase() || '';
  
  // Determinar transição baseada em múltiplos fatores
  let selectedTransition: TransitionType = 'cross_dissolve';
  let transitionDuration = 0.5;
  let reason = 'Padrão versátil';
  
  // 1. Prioridade máxima: Emoção explícita
  if (emotion && EMOTION_TRANSITION_MAP[emotion]) {
    const candidates = EMOTION_TRANSITION_MAP[emotion];
    // Evitar repetir a transição anterior
    selectedTransition = candidates.find(t => t !== previousTransition) || candidates[0];
    reason = `Emoção "${emotion}" detectada`;
  }
  
  // 2. Análise por gatilho de retenção
  else if (trigger) {
    if (trigger.includes('choque') || trigger.includes('impacto') || trigger.includes('revelação')) {
      selectedTransition = 'none';
      reason = `Gatilho "${trigger}" - corte seco para impacto`;
    } else if (trigger.includes('medo') || trigger.includes('terror') || trigger.includes('suspense')) {
      selectedTransition = 'fade_to_black';
      transitionDuration = 0.75;
      reason = `Gatilho "${trigger}" - fade para tensão`;
    } else if (trigger.includes('curiosidade') || trigger.includes('mistério')) {
      selectedTransition = 'door_open';
      reason = `Gatilho "${trigger}" - porta abrindo para mistério`;
    } else if (trigger.includes('emoção') || trigger.includes('amor') || trigger.includes('família')) {
      selectedTransition = 'blur_dissolve';
      transitionDuration = 0.75;
      reason = `Gatilho "${trigger}" - blur para emoção`;
    }
  }
  
  // 3. Análise por palavras-chave no texto
  else {
    // Detectar contexto pelo texto
    const contexts = [
      { keywords: ['morte', 'morreu', 'faleceu', 'perdeu a vida', 'último suspiro'], transition: 'fade_to_black' as TransitionType, duration: 1.0, reason: 'Contexto de morte' },
      { keywords: ['nasceu', 'nascimento', 'bebê', 'veio ao mundo'], transition: 'dip_to_color' as TransitionType, duration: 0.5, reason: 'Contexto de nascimento' },
      { keywords: ['de repente', 'subitamente', 'inesperadamente', 'naquele momento'], transition: 'none' as TransitionType, duration: 0, reason: 'Momento súbito' },
      { keywords: ['sonho', 'sonhava', 'imaginava', 'fantasia'], transition: 'blur_dissolve' as TransitionType, duration: 0.75, reason: 'Contexto de sonho' },
      { keywords: ['lembrou', 'memória', 'recordou', 'antigamente', 'naquela época'], transition: 'additive_dissolve' as TransitionType, duration: 0.75, reason: 'Flashback/memória' },
      { keywords: ['anos depois', 'meses depois', 'tempo passou', 'décadas depois'], transition: 'clock_curtain' as TransitionType, duration: 0.5, reason: 'Passagem de tempo' },
      { keywords: ['amor', 'amou', 'coração', 'paixão', 'abraçou'], transition: 'heart_shape' as TransitionType, duration: 0.5, reason: 'Contexto romântico' },
      { keywords: ['porta', 'entrou', 'abriu', 'descobriu', 'encontrou'], transition: 'door_open' as TransitionType, duration: 0.5, reason: 'Descoberta/entrada' },
      { keywords: ['explosão', 'explodiu', 'boom', 'destruiu'], transition: 'dip_to_color' as TransitionType, duration: 0.25, reason: 'Explosão/impacto' },
      { keywords: ['céu', 'deus', 'divino', 'luz', 'espiritual', 'anjo'], transition: 'iris_cross' as TransitionType, duration: 0.5, reason: 'Contexto espiritual' },
      { keywords: ['tecnologia', 'computador', 'digital', 'futuro', 'robô'], transition: 'iris_hexagon' as TransitionType, duration: 0.5, reason: 'Contexto tecnológico' },
      { keywords: ['vitória', 'venceu', 'conquistou', 'sucesso', 'celebrou'], transition: 'star_shape' as TransitionType, duration: 0.5, reason: 'Vitória/celebração' },
    ];
    
    for (const ctx of contexts) {
      if (ctx.keywords.some(kw => textLower.includes(kw))) {
        selectedTransition = ctx.transition;
        transitionDuration = ctx.duration;
        reason = ctx.reason;
        break;
      }
    }
  }
  
  // 4. Regras especiais por posição
  if (sceneIndex === 0) {
    // Primeira cena: sem transição de entrada
    selectedTransition = 'none';
    transitionDuration = 0;
    reason = 'Primeira cena - sem transição de entrada';
  } else if (sceneIndex === totalScenes - 1) {
    // Última cena: fade to black para conclusão
    selectedTransition = 'fade_to_black';
    transitionDuration = 1.0;
    reason = 'Última cena - fade para conclusão';
  } else if (sceneIndex < 3) {
    // Primeiras 3 cenas: transições rápidas para retenção
    if (selectedTransition === 'cross_dissolve' || selectedTransition === 'blur_dissolve') {
      transitionDuration = Math.min(transitionDuration, 0.3);
    }
    reason += ' (ritmo rápido para retenção)';
  }
  
  // 5. Evitar repetição excessiva
  if (selectedTransition === previousTransition && sceneIndex > 2) {
    const alternatives: TransitionType[] = ['cross_dissolve', 'push', 'slide', 'wipe'];
    selectedTransition = alternatives.find(t => t !== previousTransition) || 'cross_dissolve';
    reason = 'Variação para evitar repetição';
  }
  
  return {
    transitionType: selectedTransition,
    transitionDuration,
    reason,
  };
};

/**
 * Aplica análise de transições a todas as cenas
 */
export const applyTransitionsToScenes = (
  scenes: Array<{ text: string; emotion?: string; retentionTrigger?: string }>
): SceneTransition[] => {
  let previousTransition: TransitionType | undefined;
  
  return scenes.map((scene, index) => {
    const nextScene = scenes[index + 1];
    const transition = analyzeSceneForTransition(
      scene.text,
      scene.emotion,
      scene.retentionTrigger,
      nextScene?.text,
      nextScene?.emotion,
      index,
      scenes.length,
      previousTransition
    );
    previousTransition = transition.transitionType;
    return transition;
  });
};

/**
 * Durações de transição disponíveis
 */
export type TransitionDuration = 0.25 | 0.5 | 1 | 1.5 | 2;

export interface TransitionDurationOption {
  value: TransitionDuration;
  label: string;
  description: string;
}

export const TRANSITION_DURATION_OPTIONS: TransitionDurationOption[] = [
  { value: 0.25, label: '0.25s', description: 'Corte rápido' },
  { value: 0.5, label: '0.5s', description: 'Padrão' },
  { value: 1, label: '1s', description: 'Suave' },
  { value: 1.5, label: '1.5s', description: 'Dramático' },
  { value: 2, label: '2s', description: 'Cinematográfico' },
];

/**
 * Aspect Ratios cinematográficos
 */
export type AspectRatio = '16:9' | '2.35:1' | '2.39:1' | '1.85:1' | '4:3' | '9:16';

export interface AspectRatioOption {
  id: AspectRatio;
  name: string;
  description: string;
  width: number;
  height: number;
}

export const ASPECT_RATIO_OPTIONS: AspectRatioOption[] = [
  { id: '16:9', name: '16:9 HD', description: 'YouTube/TV padrão', width: 1920, height: 1080 },
  { id: '2.35:1', name: '2.35:1 Cinemascope', description: 'Cinema épico (Star Wars)', width: 1920, height: 817 },
  { id: '2.39:1', name: '2.39:1 Anamórfico', description: 'Cinema moderno (Marvel)', width: 1920, height: 803 },
  { id: '1.85:1', name: '1.85:1 Flat', description: 'Cinema clássico americano', width: 1920, height: 1038 },
  { id: '4:3', name: '4:3 Academy', description: 'Estilo retrô/documentário', width: 1440, height: 1080 },
  { id: '9:16', name: '9:16 Vertical', description: 'TikTok/Reels/Shorts', width: 1080, height: 1920 },
];

/**
 * Presets de color grading
 */
export type ColorGrading = 'neutral' | 'cinematic_warm' | 'cinematic_cool' | 'film_look' | 'teal_orange' | 'noir' | 'vintage';

export interface ColorGradingOption {
  id: ColorGrading;
  name: string;
  description: string;
  icon: string;
}

export const COLOR_GRADING_OPTIONS: ColorGradingOption[] = [
  { id: 'neutral', name: 'Neutro', description: 'Cores originais', icon: '⚪' },
  { id: 'cinematic_warm', name: 'Cinematic Warm', description: 'Tons dourados (Dune, Blade Runner)', icon: '🌅' },
  { id: 'cinematic_cool', name: 'Cinematic Cool', description: 'Tons azulados (The Revenant)', icon: '🌊' },
  { id: 'film_look', name: 'Film Look', description: 'Estética de película 35mm', icon: '🎞️' },
  { id: 'teal_orange', name: 'Teal & Orange', description: 'Hollywood blockbuster', icon: '🎬' },
  { id: 'noir', name: 'Noir', description: 'Alto contraste dramático', icon: '🖤' },
  { id: 'vintage', name: 'Vintage', description: 'Estilo anos 70-80', icon: '📼' },
];

/**
 * Configurações detalhadas de Color Grading para DaVinci Resolve
 */
export interface ColorGradingConfig {
  lift: { r: number; g: number; b: number; master: number };
  gamma: { r: number; g: number; b: number; master: number };
  gain: { r: number; g: number; b: number; master: number };
  offset: { r: number; g: number; b: number; master: number };
  saturation: number;
  contrast: number;
  pivot: number;
  highlights: number;
  shadows: number;
  midtones: number;
  colorTemp: number;
  tint: number;
  curves?: {
    luma: string;
    red: string;
    green: string;
    blue: string;
  };
  description: string;
  references: string[];
}

export const COLOR_GRADING_CONFIGS: Record<ColorGrading, ColorGradingConfig> = {
  neutral: {
    lift: { r: 0, g: 0, b: 0, master: 0 },
    gamma: { r: 0, g: 0, b: 0, master: 0 },
    gain: { r: 1.0, g: 1.0, b: 1.0, master: 1.0 },
    offset: { r: 0, g: 0, b: 0, master: 0 },
    saturation: 1.0,
    contrast: 1.0,
    pivot: 0.435,
    highlights: 0,
    shadows: 0,
    midtones: 0,
    colorTemp: 0,
    tint: 0,
    description: 'Cores originais sem alteração. Ideal para material que já foi tratado ou requer fidelidade cromática.',
    references: ['Documentários', 'Entrevistas', 'Conteúdo técnico'],
  },
  cinematic_warm: {
    lift: { r: 0.02, g: 0.01, b: -0.01, master: -0.005 },
    gamma: { r: 0.03, g: 0.02, b: -0.02, master: 0 },
    gain: { r: 1.08, g: 1.02, b: 0.92, master: 1.0 },
    offset: { r: 0.01, g: 0.005, b: -0.01, master: 0 },
    saturation: 0.95,
    contrast: 1.15,
    pivot: 0.40,
    highlights: 5,
    shadows: -5,
    midtones: 3,
    colorTemp: 15,
    tint: 3,
    curves: {
      luma: 'S-curve suave: Shadows (-8, -12), Mids (128, 130), Highlights (230, 225)',
      red: 'Levante levemente os mids: (128, 135)',
      green: 'Neutro ou leve boost: (128, 130)',
      blue: 'Reduza em highlights: (200, 190)',
    },
    description: 'Look dourado e quente inspirado em Dune, Blade Runner 2049, e Mad Max. Transmite calor, nostalgia e épico.',
    references: ['Dune (2021)', 'Blade Runner 2049', 'Mad Max: Fury Road', 'The Martian'],
  },
  cinematic_cool: {
    lift: { r: -0.02, g: 0, b: 0.03, master: -0.01 },
    gamma: { r: -0.01, g: 0, b: 0.02, master: 0 },
    gain: { r: 0.95, g: 1.0, b: 1.08, master: 1.0 },
    offset: { r: -0.01, g: 0, b: 0.01, master: 0 },
    saturation: 0.85,
    contrast: 1.20,
    pivot: 0.42,
    highlights: -3,
    shadows: 8,
    midtones: -2,
    colorTemp: -20,
    tint: -5,
    curves: {
      luma: 'S-curve moderado: Shadows (-10, -5), Highlights (235, 220)',
      red: 'Reduza levemente: (128, 120)',
      green: 'Neutro: (128, 128)',
      blue: 'Boost em shadows e mids: (40, 50), (128, 140)',
    },
    description: 'Look frio e dramático inspirado em The Revenant, Interstellar. Transmite isolamento, tensão e grandeza.',
    references: ['The Revenant', 'Interstellar', 'The Hateful Eight', 'Dunkirk'],
  },
  film_look: {
    lift: { r: 0.01, g: 0.01, b: 0.02, master: 0.015 },
    gamma: { r: 0, g: -0.01, b: 0.01, master: 0 },
    gain: { r: 1.02, g: 1.0, b: 0.98, master: 0.98 },
    offset: { r: 0.005, g: 0.003, b: 0.008, master: 0.005 },
    saturation: 0.90,
    contrast: 1.08,
    pivot: 0.45,
    highlights: -8,
    shadows: 10,
    midtones: 0,
    colorTemp: 5,
    tint: 2,
    curves: {
      luma: 'Levante shadows para look lavado: (0, 15), (255, 245)',
      red: 'Leve S-curve: (50, 55), (200, 195)',
      green: 'Quase neutro: (128, 126)',
      blue: 'Boost em shadows: (30, 45)',
    },
    description: 'Simula película 35mm com pretos elevados, highlights suaves e grão sutil. Estética orgânica de cinema.',
    references: ['La La Land', 'Moonlight', 'Her', 'Call Me By Your Name'],
  },
  teal_orange: {
    lift: { r: -0.02, g: 0.01, b: 0.04, master: 0 },
    gamma: { r: 0.02, g: -0.01, b: -0.02, master: 0 },
    gain: { r: 1.10, g: 0.98, b: 0.88, master: 1.0 },
    offset: { r: 0.01, g: 0, b: -0.01, master: 0 },
    saturation: 1.10,
    contrast: 1.25,
    pivot: 0.38,
    highlights: 8,
    shadows: -8,
    midtones: 5,
    colorTemp: 0,
    tint: 0,
    curves: {
      luma: 'S-curve agressivo: Shadows (-15, -25), Highlights (240, 220)',
      red: 'Boost em highlights: (180, 200), (255, 255)',
      green: 'Reduzir levemente: (128, 120)',
      blue: 'Boost forte em shadows: (30, 60), Reduzir em highlights: (220, 190)',
    },
    description: 'Look clássico de Hollywood blockbuster com skin tones laranjas e backgrounds teal. Alto impacto visual.',
    references: ['Transformers', 'Mad Max', 'Marvel MCU', 'Michael Bay films'],
  },
  noir: {
    lift: { r: 0, g: 0, b: 0, master: -0.02 },
    gamma: { r: 0, g: 0, b: 0, master: -0.05 },
    gain: { r: 1.0, g: 1.0, b: 1.0, master: 1.15 },
    offset: { r: 0, g: 0, b: 0, master: 0 },
    saturation: 0.30,
    contrast: 1.50,
    pivot: 0.35,
    highlights: 15,
    shadows: -20,
    midtones: -5,
    colorTemp: 0,
    tint: 0,
    curves: {
      luma: 'S-curve extremo: Shadows (0, 0), (40, 15), Highlights (200, 230), (255, 255)',
      red: 'Igual ao Luma para B&W',
      green: 'Igual ao Luma para B&W',
      blue: 'Igual ao Luma para B&W',
    },
    description: 'Alto contraste dramático, quase P&B. Sombras profundas e highlights estourados. Tensão máxima.',
    references: ['Sin City', 'The Dark Knight', 'Se7en', 'Mank'],
  },
  vintage: {
    lift: { r: 0.03, g: 0.02, b: 0.01, master: 0.02 },
    gamma: { r: 0.02, g: 0.01, b: -0.02, master: 0.01 },
    gain: { r: 1.05, g: 1.02, b: 0.90, master: 0.95 },
    offset: { r: 0.02, g: 0.01, b: -0.01, master: 0.01 },
    saturation: 0.75,
    contrast: 0.90,
    pivot: 0.48,
    highlights: -12,
    shadows: 15,
    midtones: 5,
    colorTemp: 12,
    tint: 5,
    curves: {
      luma: 'Comprimir range: (0, 20), (255, 235)',
      red: 'Boost geral: (128, 140)',
      green: 'Leve fade: (0, 10), (255, 245)',
      blue: 'Reduzir bastante: (128, 100), (255, 220)',
    },
    description: 'Estilo desbotado anos 70-80 com pretos elevados, saturação reduzida e tint amarelado. Nostalgia.',
    references: ['Stranger Things', 'Joker', 'Once Upon a Time in Hollywood', 'Mindhunter'],
  },
};

/**
 * Gera arquivo de instruções de Color Grading para DaVinci Resolve
 */
export const generateColorGradingInstructions = (
  colorGrading: ColorGrading,
  settings: CinematicSettings
): string => {
  const config = COLOR_GRADING_CONFIGS[colorGrading];
  const option = COLOR_GRADING_OPTIONS.find(o => o.id === colorGrading);
  
  const formatValue = (v: number) => v >= 0 ? `+${v.toFixed(3)}` : v.toFixed(3);
  const formatGain = (v: number) => v.toFixed(2);
  
  let instructions = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    INSTRUÇÕES DE COLOR GRADING - DAVINCI RESOLVE              ║
║                              Preset: ${option?.name.toUpperCase().padEnd(20)}                    ║
╚══════════════════════════════════════════════════════════════════════════════╝

📋 INFORMAÇÕES DO PRESET
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${config.description}

🎬 Filmes de Referência:
${config.references.map(r => `   • ${r}`).join('\n')}

═══════════════════════════════════════════════════════════════════════════════
                              VALORES EXATOS PARA APLICAR
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────────────┐
│ 1. COLOR WHEELS (Aba Color)                                                  │
└─────────────────────────────────────────────────────────────────────────────┘

  🔴 LIFT (Shadows/Sombras)
  ├── Red:    ${formatValue(config.lift.r)}
  ├── Green:  ${formatValue(config.lift.g)}
  ├── Blue:   ${formatValue(config.lift.b)}
  └── Master: ${formatValue(config.lift.master)}

  🟡 GAMMA (Midtones/Meios-Tons)
  ├── Red:    ${formatValue(config.gamma.r)}
  ├── Green:  ${formatValue(config.gamma.g)}
  ├── Blue:   ${formatValue(config.gamma.b)}
  └── Master: ${formatValue(config.gamma.master)}

  🔵 GAIN (Highlights/Altas-Luzes)
  ├── Red:    ${formatGain(config.gain.r)}
  ├── Green:  ${formatGain(config.gain.g)}
  ├── Blue:   ${formatGain(config.gain.b)}
  └── Master: ${formatGain(config.gain.master)}

  ⚫ OFFSET (Geral)
  ├── Red:    ${formatValue(config.offset.r)}
  ├── Green:  ${formatValue(config.offset.g)}
  ├── Blue:   ${formatValue(config.offset.b)}
  └── Master: ${formatValue(config.offset.master)}

┌─────────────────────────────────────────────────────────────────────────────┐
│ 2. PRIMARIES (Ajustes Primários)                                             │
└─────────────────────────────────────────────────────────────────────────────┘

  📊 Saturation:    ${(config.saturation * 100).toFixed(0)}%  (valor: ${config.saturation.toFixed(2)})
  📊 Contrast:      ${(config.contrast * 100 - 100).toFixed(0)}%  (valor: ${config.contrast.toFixed(2)})
  📊 Pivot:         ${(config.pivot * 100).toFixed(1)}%  (valor: ${config.pivot.toFixed(3)})

┌─────────────────────────────────────────────────────────────────────────────┐
│ 3. SHADOW/HIGHLIGHT/MIDTONE ADJUSTMENTS                                      │
└─────────────────────────────────────────────────────────────────────────────┘

  🌙 Shadows:       ${config.shadows >= 0 ? '+' : ''}${config.shadows}
  ☀️  Highlights:    ${config.highlights >= 0 ? '+' : ''}${config.highlights}
  🔆 Midtones:      ${config.midtones >= 0 ? '+' : ''}${config.midtones}

┌─────────────────────────────────────────────────────────────────────────────┐
│ 4. WHITE BALANCE                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

  🌡️  Color Temp:    ${config.colorTemp >= 0 ? '+' : ''}${config.colorTemp} (${config.colorTemp > 0 ? 'mais quente' : config.colorTemp < 0 ? 'mais frio' : 'neutro'})
  💜 Tint:          ${config.tint >= 0 ? '+' : ''}${config.tint} (${config.tint > 0 ? 'mais magenta' : config.tint < 0 ? 'mais verde' : 'neutro'})

`;

  if (config.curves) {
    instructions += `
┌─────────────────────────────────────────────────────────────────────────────┐
│ 5. CURVES (Curvas Personalizadas)                                            │
└─────────────────────────────────────────────────────────────────────────────┘

  📈 Luma (Y):
     ${config.curves.luma}

  🔴 Red:
     ${config.curves.red}

  🟢 Green:
     ${config.curves.green}

  🔵 Blue:
     ${config.curves.blue}

`;
  }

  instructions += `
═══════════════════════════════════════════════════════════════════════════════
                           COMO APLICAR NO DAVINCI RESOLVE
═══════════════════════════════════════════════════════════════════════════════

📍 PASSO A PASSO:

1. Vá para a aba "Color" (ícone de pincel colorido na parte inferior)

2. Na seção "Color Wheels", digite os valores de LIFT, GAMMA e GAIN
   • Clique no número abaixo de cada wheel para editar
   • Use os valores RGB e Master listados acima

3. Para ajustar Saturation e Contrast:
   • No painel à direita, encontre "Primaries - Adjust"
   • Digite os valores exatos

4. Para as Curves:
   • Clique na aba "Curves" no painel Color
   • Adicione pontos de controle conforme especificado

5. Para Color Temp e Tint:
   • Use o painel "Primaries - Bars" ou "Primaries - Wheels"
   • Ajuste os sliders de Temp e Tint

💡 DICA PRO: Crie um Power Grade deste look para reusar em outros projetos!
   • Clique direito no node → "Grab Still"
   • Na Gallery, clique direito → "Create Power Grade"

═══════════════════════════════════════════════════════════════════════════════
                              CONFIGURAÇÕES DO PROJETO
═══════════════════════════════════════════════════════════════════════════════

  🎬 FPS:           ${settings.fps}
  📐 Aspect Ratio:  ${settings.aspectRatio}
  🔄 Transição:     ${TRANSITION_OPTIONS.find(t => t.id === settings.transitionType)?.name} (${settings.transitionDuration}s)
  
  Efeitos Cinematográficos:
  ${settings.fadeInOut ? '  ✅ Fade In/Out' : '  ⬜ Fade In/Out'}
  ${settings.kenBurnsEffect ? '  ✅ Ken Burns Effect' : '  ⬜ Ken Burns Effect'}
  ${settings.addVignette ? '  ✅ Vignette' : '  ⬜ Vignette'}
  ${settings.letterbox ? '  ✅ Letterbox' : '  ⬜ Letterbox'}

═══════════════════════════════════════════════════════════════════════════════
                              EFEITOS ADICIONAIS
═══════════════════════════════════════════════════════════════════════════════
`;

  if (settings.addVignette) {
    instructions += `
🔲 VIGNETTE (Vinheta):
   1. No node de Color, vá para "Window" → "Vignette"
   2. Configurações sugeridas:
      • Inner Radius: 0.75
      • Outer Radius: 0.95
      • Roundness: 0.7
      • Soft Edge: 0.8
   3. Reduza o Gain Master do node de Vignette para 0.85

`;
  }

  if (settings.kenBurnsEffect) {
    instructions += `
📷 KEN BURNS EFFECT (Movimento em imagens):
   1. Na aba "Edit", selecione o clip
   2. Vá para "Inspector" → "Transform"
   3. Para Zoom In suave:
      • Frame 1: Zoom 1.00, Position X/Y: 0
      • Último Frame: Zoom 1.08, Position: ajuste conforme composição
   4. Use "Ease In/Out" nas keyframes para movimento orgânico

`;
  }

  if (settings.letterbox) {
    instructions += `
🎬 LETTERBOX (Barras Cinematográficas):
   1. Em "Effects Library" → "Open FX" → busque "Blanking Fill"
   2. Ou crie manualmente:
      • Adicione um "Solid Color" preto em track acima
      • Faça crop para criar as barras (altura = diferença do aspect ratio)
   3. Para ${settings.aspectRatio}:
      ${settings.aspectRatio === '2.35:1' ? '• Barras de ~132px em cima e embaixo (1080p)' : ''}
      ${settings.aspectRatio === '2.39:1' ? '• Barras de ~138px em cima e embaixo (1080p)' : ''}
      ${settings.aspectRatio === '1.85:1' ? '• Barras de ~21px em cima e embaixo (1080p)' : ''}

`;
  }

  if (settings.fadeInOut) {
    instructions += `
🌅 FADE IN/OUT:
   1. No primeiro clip: clique direito → "Add Transition" → "Cross Dissolve"
      • Ajuste duração para 1-2 segundos
   2. No último clip: adicione "Cross Dissolve" no final
   3. Alternativa: Use "Dip to Color" (preto) para efeito mais dramático

`;
  }

  instructions += `
═══════════════════════════════════════════════════════════════════════════════
                              DICAS PROFISSIONAIS
═══════════════════════════════════════════════════════════════════════════════

🎯 WORKFLOW RECOMENDADO:
   1. Primeiro normalize as imagens (exposure, balance)
   2. Aplique o color grade como segundo node
   3. Adicione vinheta/efeitos em nodes separados
   4. Use "Qualifier" para ajustar skin tones se necessário

📺 PARA YOUTUBE:
   • Exporte em H.264 com bitrate 15-25 Mbps
   • Mantenha níveis de vídeo em "Full" (0-255)
   • Adicione 1-2% de saturação extra (YT comprime cores)

🔧 TROUBLESHOOTING:
   • Se as cores parecerem muito fortes, reduza Saturation para 0.85
   • Se os pretos estiverem lavados, reduza Lift Master
   • Se os brancos estiverem estourados, reduza Gain Master
${BRAND_FOOTER}`;

  return instructions;
};

/**
 * MODO FÁCIL: Instruções ultra-simplificadas para usuários leigos
 * Apenas 5 passos simples com linguagem amigável
 */
export const generateEasyModeInstructions = (
  colorGrading: ColorGrading,
  settings: CinematicSettings
): string => {
  const config = COLOR_GRADING_CONFIGS[colorGrading];
  const option = COLOR_GRADING_OPTIONS.find(o => o.id === colorGrading);
  const presetName = option?.name || 'Personalizado';

  return `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    🎬 MODO FÁCIL - GUIA RÁPIDO                                ║
║                    Para: ${presetName.padEnd(30)}                             ║
╚══════════════════════════════════════════════════════════════════════════════╝

🎯 VOCÊ VAI CONSEGUIR! São apenas 5 passos simples.


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PASSO 1: ABRIR O DAVINCI RESOLVE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   1. Abra o DaVinci Resolve (é gratuito!)
   2. Crie um projeto novo ou abra o seu
   3. Importe seu vídeo/fotos arrastando para a tela


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PASSO 2: IMPORTAR O XML (Seu projeto pronto!)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   1. Vá em: Arquivo → Importar → Timeline...
   2. Selecione o arquivo .xml que você baixou
   3. Clique OK - PRONTO! As cenas já estarão organizadas!


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PASSO 3: APLICAR O VISUAL "${presetName.toUpperCase()}"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   🌟 MÉTODO SUPER FÁCIL (LUT):
   
   1. Clique na aba "Color" (ícone de pincel colorido embaixo)
   2. Clique com botão DIREITO na área de "LUTs"
   3. Escolha "Import LUT..."
   4. Procure por LUTs gratuitas no Google: 
      "${presetName} LUT free download"
   5. Arraste a LUT para cima do seu vídeo - PRONTO!
   
   💡 Dica: LUTs são "filtros prontos" como no Instagram!


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PASSO 4: AJUSTES RÁPIDOS (Opcional)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   Ainda na aba "Color", você pode ajustar:
   
   🔆 BRILHO muito escuro/claro?
      → Mova a bolinha do meio (Gamma) para cima/baixo
   
   🎨 CORES muito fortes/fracas?
      → Procure "Saturation" e aumente/diminua
   
   ⚫ PRETOS muito lavados?
      → Mova a bolinha da esquerda (Lift) para baixo


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   PASSO 5: EXPORTAR SEU VÍDEO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

   1. Clique na aba "Deliver" (ícone de foguete embaixo)
   2. Escolha "YouTube" nos presets prontos
   3. Escolha onde salvar o arquivo
   4. Clique em "Add to Render Queue"
   5. Clique em "Render All"
   6. Espere terminar - PRONTO! Seu vídeo está pronto! 🎉


╔══════════════════════════════════════════════════════════════════════════════╗
║                    🎁 BÔNUS: LUTS GRATUITAS RECOMENDADAS                      ║
╚══════════════════════════════════════════════════════════════════════════════╝

   Pesquise no Google por:
   • "${presetName} LUT free download"
   • "Cinematic LUT pack free"
   • "Film look LUT DaVinci"
   
   Sites confiáveis:
   • fixthephoto.com/free-luts
   • rocketstock.com/free-after-effects-templates/35-free-luts
   • filtergrade.com/free-luts


╔══════════════════════════════════════════════════════════════════════════════╗
║                    ❓ PRECISA DE AJUDA?                                        ║
╚══════════════════════════════════════════════════════════════════════════════╝

   📺 No YouTube, pesquise:
   • "DaVinci Resolve tutorial básico português"
   • "Como usar LUT no DaVinci Resolve"
   • "Color grading fácil DaVinci"

${BRAND_FOOTER}`;
};

/**
 * Gera arquivo Power Grade (.dpx) para importação direta no DaVinci
 * Este é um formato simplificado que pode ser aplicado com 1 clique
 */
export const generatePowerGradeXml = (colorGrading: ColorGrading): string => {
  const config = COLOR_GRADING_CONFIGS[colorGrading];
  const option = COLOR_GRADING_OPTIONS.find(o => o.id === colorGrading);
  const presetName = option?.name || 'Custom';
  
  // Gera um XML simplificado de Power Grade para DaVinci
  return `<?xml version="1.0" encoding="UTF-8"?>
<PowerGrade>
  <Name>${presetName} - La Casa Dark Core</Name>
  <Version>1.0</Version>
  <Grade>
    <Primary>
      <Lift>
        <Red>${config.lift.r.toFixed(4)}</Red>
        <Green>${config.lift.g.toFixed(4)}</Green>
        <Blue>${config.lift.b.toFixed(4)}</Blue>
        <Luma>${config.lift.master.toFixed(4)}</Luma>
      </Lift>
      <Gamma>
        <Red>${config.gamma.r.toFixed(4)}</Red>
        <Green>${config.gamma.g.toFixed(4)}</Green>
        <Blue>${config.gamma.b.toFixed(4)}</Blue>
        <Luma>${config.gamma.master.toFixed(4)}</Luma>
      </Gamma>
      <Gain>
        <Red>${config.gain.r.toFixed(4)}</Red>
        <Green>${config.gain.g.toFixed(4)}</Green>
        <Blue>${config.gain.b.toFixed(4)}</Blue>
        <Luma>${config.gain.master.toFixed(4)}</Luma>
      </Gain>
      <Offset>
        <Red>${config.offset.r.toFixed(4)}</Red>
        <Green>${config.offset.g.toFixed(4)}</Green>
        <Blue>${config.offset.b.toFixed(4)}</Blue>
        <Luma>${config.offset.master.toFixed(4)}</Luma>
      </Offset>
      <Saturation>${config.saturation.toFixed(4)}</Saturation>
      <Contrast>${config.contrast.toFixed(4)}</Contrast>
      <Pivot>${config.pivot.toFixed(4)}</Pivot>
    </Primary>
  </Grade>
  <Notes>
    Preset gerado pelo La Casa Dark Core
    www.canaisdarks.com.br
    "Transformando ideias em vídeos virais"
  </Notes>
</PowerGrade>`;
};

/**
 * Gera instruções de efeitos cinematográficos (independente de Color Grading)
 * Usado quando há efeitos selecionados mas colorGrading é neutro
 */
export const generateCinematicEffectsInstructions = (settings: CinematicSettings): string | null => {
  // Só gerar se houver algum efeito ativo
  const hasEffects = settings.addVignette || settings.letterbox || settings.fadeInOut || settings.kenBurnsEffect;
  if (!hasEffects) return null;
  
  let instructions = `
╔══════════════════════════════════════════════════════════════════════════════╗
║               INSTRUÇÕES DE EFEITOS CINEMATOGRÁFICOS - DAVINCI RESOLVE        ║
╚══════════════════════════════════════════════════════════════════════════════╝

📋 CONFIGURAÇÕES DO PROJETO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  🎬 FPS:           ${settings.fps}
  📐 Aspect Ratio:  ${settings.aspectRatio}
  🔄 Transição:     ${TRANSITION_OPTIONS.find(t => t.id === settings.transitionType)?.name} (${settings.transitionDuration}s)
  
  Efeitos Selecionados:
  ${settings.fadeInOut ? '  ✅ Fade In/Out' : '  ⬜ Fade In/Out'}
  ${settings.kenBurnsEffect ? '  ✅ Ken Burns Effect (keyframes automáticos via XML!)' : '  ⬜ Ken Burns Effect'}
  ${settings.addVignette ? '  ✅ Vignette (Vinheta)' : '  ⬜ Vignette'}
  ${settings.letterbox ? '  ✅ Letterbox (Barras Cinema)' : '  ⬜ Letterbox'}

═══════════════════════════════════════════════════════════════════════════════
                         COMO APLICAR OS EFEITOS
═══════════════════════════════════════════════════════════════════════════════
`;

  if (settings.addVignette) {
    instructions += `
🔲 VIGNETTE (Vinheta):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   1. Vá para a aba "Color" (ícone de pincel colorido)
   2. Crie um novo node (Alt+S) para a vinheta
   3. Vá para "Window" → "Vignette"
   4. Configurações recomendadas:
      • Inner Radius: 0.75
      • Outer Radius: 0.95
      • Roundness: 0.7
      • Soft Edge: 0.8
   5. Reduza o Gain Master desse node para 0.85
   
   💡 DICA: Aplique a vinheta em TODOS os clips selecionando-os juntos

`;
  }

  if (settings.kenBurnsEffect) {
    instructions += `
📷 KEN BURNS EFFECT (Movimento de Câmera):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✅ KEYFRAMES JÁ INCLUÍDOS NO XML!
   
   A IA analisou cada cena e aplicou movimentos automáticos:
   • Zoom In/Out baseado no conteúdo emocional
   • Pan Left/Right para cenas com movimento
   • Intensidades variadas (subtle, normal, dramatic)
   
   Consulte o arquivo KEN_BURNS_MOVIMENTOS.txt para detalhes de cada cena.
   
   Para ajustar manualmente:
   1. Na aba "Edit", selecione o clip
   2. Vá para "Inspector" → "Transform"
   3. Modifique os keyframes existentes conforme necessário

`;
  }

  if (settings.letterbox) {
    instructions += `
🎬 LETTERBOX (Barras Cinematográficas):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Método 1 - Blanking Fill (Recomendado):
   1. Em "Effects Library" → "Open FX" → busque "Blanking Fill"
   2. Arraste para a timeline sobre todos os clips
   3. Ajuste o aspect ratio para ${settings.aspectRatio}
   
   Método 2 - Manual:
   1. Adicione um "Solid Color" preto em uma track acima
   2. Faça crop para criar as barras
   3. Tamanhos para ${settings.aspectRatio} em 1080p:
      ${settings.aspectRatio === '2.35:1' ? '• Barras de 132px em cima e embaixo' : ''}
      ${settings.aspectRatio === '2.39:1' ? '• Barras de 138px em cima e embaixo' : ''}
      ${settings.aspectRatio === '1.85:1' ? '• Barras de 21px em cima e embaixo' : ''}
      ${settings.aspectRatio === '16:9' ? '• Sem barras necessárias (nativo)' : ''}

`;
  }

  if (settings.fadeInOut) {
    instructions += `
🌅 FADE IN/OUT:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Fade In (Início do vídeo):
   1. Selecione o PRIMEIRO clip da timeline
   2. Clique direito → "Add Transition" → "Cross Dissolve"
   3. Posicione a transição no INÍCIO do clip
   4. Ajuste duração para 1-2 segundos
   
   Fade Out (Final do vídeo):
   1. Selecione o ÚLTIMO clip da timeline
   2. Clique direito → "Add Transition" → "Cross Dissolve"
   3. Posicione a transição no FINAL do clip
   4. Ajuste duração para 1-2 segundos
   
   💡 ALTERNATIVA: Use "Dip to Color Dissolve" (preto) para efeito mais dramático

`;
  }

  instructions += `
═══════════════════════════════════════════════════════════════════════════════
                            ORDEM DE APLICAÇÃO
═══════════════════════════════════════════════════════════════════════════════

   1. ✅ Importe o XML e reconecte as mídias
   2. ✅ Aplique os fades de entrada/saída
   3. ✅ Adicione letterbox (se desejado)
   4. ✅ Na aba Color, aplique a vinheta em um node dedicado
   5. ✅ Ajuste keyframes de Ken Burns se necessário
   6. ✅ Exporte em H.264 para YouTube (15-25 Mbps)
${BRAND_FOOTER}`;

  return instructions;
};

/**
 * FPS options
 */
export type FpsOption = 24 | 25 | 30 | 60;

export interface FpsOptionConfig {
  value: FpsOption;
  name: string;
  description: string;
}

export const FPS_OPTIONS: FpsOptionConfig[] = [
  { value: 24, name: '24 fps', description: 'Cinema (padrão Netflix/Hollywood)' },
  { value: 25, name: '25 fps', description: 'PAL (Europa/Brasil broadcast)' },
  { value: 30, name: '30 fps', description: 'NTSC (YouTube otimizado)' },
  { value: 60, name: '60 fps', description: 'Alta fluidez (gaming/esportes)' },
];

/**
 * Configurações cinematográficas completas
 */
export interface CinematicSettings {
  transitionType: TransitionType;
  transitionDuration: TransitionDuration;
  aspectRatio: AspectRatio;
  colorGrading: ColorGrading;
  fps: FpsOption;
  fadeInOut: boolean; // Fade in no início e fade out no final
  addVignette: boolean; // Adicionar vinheta cinematográfica
  kenBurnsEffect: boolean; // Efeito de movimento suave nas imagens
  letterbox: boolean; // Adicionar barras pretas para aspect ratio
}

export const DEFAULT_CINEMATIC_SETTINGS: CinematicSettings = {
  transitionType: 'cross_dissolve',
  transitionDuration: 0.5,
  aspectRatio: '16:9',
  colorGrading: 'neutral',
  fps: 24,
  fadeInOut: true,
  addVignette: false,
  kenBurnsEffect: true,
  letterbox: false,
};

/**
 * Presets cinematográficos para diferentes gêneros de vídeo
 */
export type CinematicPreset = 'custom' | 'documentary' | 'action' | 'drama' | 'horror' | 'comedy';

export interface CinematicPresetOption {
  id: CinematicPreset;
  name: string;
  icon: string;
  description: string;
  settings: CinematicSettings;
}

export const CINEMATIC_PRESETS: CinematicPresetOption[] = [
  {
    id: 'custom',
    name: 'Personalizado',
    icon: '⚙️',
    description: 'Configure cada opção manualmente',
    settings: DEFAULT_CINEMATIC_SETTINGS,
  },
  {
    id: 'documentary',
    name: 'Documentário',
    icon: '🎥',
    description: 'Ken Burns suave, cores naturais, transições lentas',
    settings: {
      transitionType: 'cross_dissolve',
      transitionDuration: 1,
      aspectRatio: '16:9',
      colorGrading: 'neutral',
      fps: 24,
      fadeInOut: true,
      addVignette: false,
      kenBurnsEffect: true,
      letterbox: false,
    },
  },
  {
    id: 'action',
    name: 'Ação',
    icon: '💥',
    description: 'Cortes rápidos, alto contraste, ritmo intenso',
    settings: {
      transitionType: 'push',
      transitionDuration: 0.25,
      aspectRatio: '2.39:1',
      colorGrading: 'teal_orange',
      fps: 30,
      fadeInOut: false,
      addVignette: true,
      kenBurnsEffect: true,
      letterbox: true,
    },
  },
  {
    id: 'drama',
    name: 'Drama',
    icon: '🎭',
    description: 'Tons quentes, vinheta profunda, cinematográfico',
    settings: {
      transitionType: 'fade_to_black',
      transitionDuration: 1,
      aspectRatio: '2.35:1',
      colorGrading: 'cinematic_warm',
      fps: 24,
      fadeInOut: true,
      addVignette: true,
      kenBurnsEffect: true,
      letterbox: true,
    },
  },
  {
    id: 'horror',
    name: 'Terror/Suspense',
    icon: '👻',
    description: 'Tons frios, alto contraste, atmosfera tensa',
    settings: {
      transitionType: 'dip_to_color',
      transitionDuration: 0.5,
      aspectRatio: '2.35:1',
      colorGrading: 'cinematic_cool',
      fps: 24,
      fadeInOut: true,
      addVignette: true,
      kenBurnsEffect: true,
      letterbox: true,
    },
  },
  {
    id: 'comedy',
    name: 'Comédia/Leve',
    icon: '😄',
    description: 'Cores vibrantes, transições suaves, sem barras',
    settings: {
      transitionType: 'cross_dissolve',
      transitionDuration: 0.5,
      aspectRatio: '16:9',
      colorGrading: 'neutral',
      fps: 30,
      fadeInOut: true,
      addVignette: false,
      kenBurnsEffect: true,
      letterbox: false,
    },
  },
];

/**
 * Presets de introdução para diferentes nichos de vídeo
 */
export type IntroNiche = 
  | 'documentary' 
  | 'tech_tutorial' 
  | 'gaming' 
  | 'lifestyle_vlog' 
  | 'business_finance' 
  | 'horror_suspense' 
  | 'comedy' 
  | 'motivational' 
  | 'news' 
  | 'educational' 
  | 'travel' 
  | 'fitness' 
  | 'cooking' 
  | 'music' 
  | 'storytime'
  | 'biblical'
  | 'psychology'
  | 'curiosities'
  | 'ancient_civilizations'
  | 'health'
  | 'emotional_stories';

// Branding global para todos os documentos
export const BRAND_FOOTER = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏠 La Casa Dark Core®
   A infraestrutura por trás de canais dark profissionais
   A revolução chegou. Não há espaço para amadores.

🌐 www.canaisdarks.com.br
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

export interface MusicRecommendation {
  name: string;
  artist: string;
  source: 'Pixabay' | 'YouTube Audio Library' | 'Epidemic Sound' | 'Artlist' | 'Uppbeat' | 'Mixkit' | 'Free Music Archive';
  genre: string;
  mood: string;
  url: string;
  previewUrl?: string; // URL direta para preview de áudio
  duration?: string;
  bpm?: number;
  isPremium: boolean;
}

export interface IntroPreset {
  id: IntroNiche;
  name: string;
  icon: string;
  description: string;
  introDuration: number; // segundos
  hookStructure: string; // estrutura do gancho
  textAnimation: 'fade' | 'slide' | 'zoom' | 'typewriter' | 'glitch' | 'bounce';
  musicStyle: string;
  transitionIn: TransitionType;
  transitionDuration: TransitionDuration;
  visualStyle: string;
  colorTone: ColorGrading;
  effects: {
    vignette: boolean;
    kenBurns: boolean;
    letterbox: boolean;
    fadeIn: boolean;
  };
  hookExamples: string[];
  tipsPt: string[];
  recommendedMusic: MusicRecommendation[];
}

export const INTRO_PRESETS: IntroPreset[] = [
  {
    id: 'documentary',
    name: 'Documentário',
    icon: '🎥',
    description: 'Intro cinematográfica com narração épica',
    introDuration: 8,
    hookStructure: '[Cena impactante] + [Pergunta provocativa] + [Promessa de revelação]',
    textAnimation: 'fade',
    musicStyle: 'Orquestral épica ou ambiente tenso',
    transitionIn: 'fade_to_black',
    transitionDuration: 1,
    visualStyle: 'Imagens em slow-motion, closes dramáticos, paisagens grandiosas',
    colorTone: 'film_look',
    effects: { vignette: true, kenBurns: true, letterbox: true, fadeIn: true },
    hookExamples: [
      '"O que você está prestes a ver vai mudar sua perspectiva para sempre..."',
      '"Em 1987, algo inexplicável aconteceu nesta pequena cidade..."',
      '"Este é o segredo que a indústria não quer que você saiba."'
    ],
    tipsPt: [
      'Use narração grave e pausada',
      'Comece com imagem de impacto visual',
      'Crie mistério nos primeiros 3 segundos',
      'Som ambiente + música crescente'
    ],
    recommendedMusic: [
      { name: 'Epic Cinematic', artist: 'Audiorezout', source: 'Pixabay', genre: 'Orquestral', mood: 'Épico', url: 'https://pixabay.com/music/beats-epic-cinematic-trailer-117669/', duration: '2:30', bpm: 100, isPremium: false },
      { name: 'Documentary', artist: 'AlexiAction', source: 'Pixabay', genre: 'Ambiente', mood: 'Introspectivo', url: 'https://pixabay.com/music/ambient-documentary-11052/', duration: '3:15', bpm: 80, isPremium: false },
      { name: 'Emotional Piano', artist: 'Lesfm', source: 'Pixabay', genre: 'Piano', mood: 'Emotivo', url: 'https://pixabay.com/music/solo-piano-emotional-piano-115672/', duration: '2:45', bpm: 70, isPremium: false },
      { name: 'Inspiring Cinematic', artist: 'Lexin_Music', source: 'Pixabay', genre: 'Orquestral', mood: 'Inspirador', url: 'https://pixabay.com/music/upbeat-inspiring-cinematic-ambient-116199/', duration: '3:00', bpm: 90, isPremium: false }
    ]
  },
  {
    id: 'tech_tutorial',
    name: 'Tech/Tutorial',
    icon: '💻',
    description: 'Direto ao ponto com preview do resultado',
    introDuration: 5,
    hookStructure: '[Preview do resultado] + [Problema comum] + [Solução rápida]',
    textAnimation: 'slide',
    musicStyle: 'Lo-fi eletrônico ou música tech moderna',
    transitionIn: 'push',
    transitionDuration: 0.25,
    visualStyle: 'Screen recording, animações de UI, texto dinâmico',
    colorTone: 'neutral',
    effects: { vignette: false, kenBurns: false, letterbox: false, fadeIn: false },
    hookExamples: [
      '"Em menos de 5 minutos, você vai dominar isso..."',
      '"Esse truque vai te poupar HORAS de trabalho."',
      '"A maioria faz errado. Aqui está o jeito certo."'
    ],
    tipsPt: [
      'Mostre o resultado final nos primeiros 3 segundos',
      'Use marcadores visuais (setas, círculos)',
      'Ritmo acelerado, sem enrolação',
      'Fale o benefício principal imediatamente'
    ],
    recommendedMusic: [
      { name: 'Lo-Fi Chill', artist: 'FASSounds', source: 'Pixabay', genre: 'Lo-Fi', mood: 'Relaxado', url: 'https://pixabay.com/music/beats-lofi-chill-medium-version-159456/', duration: '2:00', bpm: 85, isPremium: false },
      { name: 'Tech Corporate', artist: 'SoulProdMusic', source: 'Pixabay', genre: 'Eletrônico', mood: 'Moderno', url: 'https://pixabay.com/music/upbeat-tech-house-vibes-130553/', duration: '2:30', bpm: 120, isPremium: false },
      { name: 'Upbeat Tutorial', artist: 'Coma-Media', source: 'Pixabay', genre: 'Pop', mood: 'Positivo', url: 'https://pixabay.com/music/upbeat-uplifting-day-124017/', duration: '2:15', bpm: 110, isPremium: false },
      { name: 'Digital Technology', artist: 'LiteSaturation', source: 'Pixabay', genre: 'Eletrônico', mood: 'Futurístico', url: 'https://pixabay.com/music/beats-digital-technology-140090/', duration: '2:45', bpm: 95, isPremium: false }
    ]
  },
  {
    id: 'gaming',
    name: 'Gaming',
    icon: '🎮',
    description: 'Energia alta com highlights explosivos',
    introDuration: 4,
    hookStructure: '[Highlight épico] + [Reação] + [Teaser do conteúdo]',
    textAnimation: 'glitch',
    musicStyle: 'EDM, dubstep ou trilha de jogo épica',
    transitionIn: 'push',
    transitionDuration: 0.25,
    visualStyle: 'Cortes rápidos, efeitos de tela, zoom dramático',
    colorTone: 'teal_orange',
    effects: { vignette: true, kenBurns: false, letterbox: false, fadeIn: false },
    hookExamples: [
      '"VOCÊ NÃO VAI ACREDITAR NO QUE ACONTECEU!"',
      '"Essa jogada... simplesmente INSANA!"',
      '"1v5 e eu VENCI. Assista até o final."'
    ],
    tipsPt: [
      'Comece com a melhor jogada/momento',
      'Use efeitos sonoros de impacto',
      'Texto grande e animado',
      'Energia e emoção na voz'
    ],
    recommendedMusic: [
      { name: 'Gaming Dubstep', artist: 'RoyaltyFreeZone', source: 'Pixabay', genre: 'Dubstep', mood: 'Intenso', url: 'https://pixabay.com/music/beats-dubstep-gaming-141909/', duration: '2:30', bpm: 140, isPremium: false },
      { name: 'Epic Gaming', artist: 'Vivaleum', source: 'Pixabay', genre: 'EDM', mood: 'Épico', url: 'https://pixabay.com/music/beats-epic-gaming-122307/', duration: '3:00', bpm: 150, isPremium: false },
      { name: 'Electro Sport', artist: 'Coma-Media', source: 'Pixabay', genre: 'Eletrônico', mood: 'Energético', url: 'https://pixabay.com/music/beats-electro-sport-111124/', duration: '2:00', bpm: 130, isPremium: false },
      { name: 'Powerful Action', artist: 'Lexin_Music', source: 'Pixabay', genre: 'Trailer', mood: 'Poderoso', url: 'https://pixabay.com/music/beats-powerful-action-141892/', duration: '2:15', bpm: 145, isPremium: false }
    ]
  },
  {
    id: 'lifestyle_vlog',
    name: 'Lifestyle/Vlog',
    icon: '✨',
    description: 'Pessoal e autêntico, conexão imediata',
    introDuration: 6,
    hookStructure: '[Situação relatable] + [Teaser emocional] + [Convite pessoal]',
    textAnimation: 'bounce',
    musicStyle: 'Indie, acústico ou pop suave',
    transitionIn: 'cross_dissolve',
    transitionDuration: 0.5,
    visualStyle: 'Cores quentes, luz natural, closes pessoais',
    colorTone: 'cinematic_warm',
    effects: { vignette: true, kenBurns: true, letterbox: false, fadeIn: true },
    hookExamples: [
      '"Gente, vocês não vão ACREDITAR no que aconteceu hoje..."',
      '"Preciso contar uma coisa pra vocês. Vem comigo."',
      '"Esse foi o melhor/pior dia da minha vida."'
    ],
    tipsPt: [
      'Olhe diretamente para a câmera',
      'Comece com emoção genuína',
      'Use B-roll do dia/momento',
      'Seja você mesmo, autenticidade vende'
    ],
    recommendedMusic: [
      { name: 'Acoustic Indie', artist: 'FASSounds', source: 'Pixabay', genre: 'Indie', mood: 'Leve', url: 'https://pixabay.com/music/acoustic-group-acoustic-indie-126189/', duration: '2:30', bpm: 100, isPremium: false },
      { name: 'Happy Vlog', artist: 'AShamaluevMusic', source: 'Pixabay', genre: 'Pop', mood: 'Alegre', url: 'https://pixabay.com/music/beats-happy-vlog-music-141908/', duration: '2:45', bpm: 110, isPremium: false },
      { name: 'Chill Day', artist: 'Lesfm', source: 'Pixabay', genre: 'Acústico', mood: 'Relaxado', url: 'https://pixabay.com/music/acoustic-group-chill-day-127935/', duration: '3:00', bpm: 90, isPremium: false },
      { name: 'Positive Vibes', artist: 'SoulProdMusic', source: 'Pixabay', genre: 'Pop', mood: 'Positivo', url: 'https://pixabay.com/music/beats-positive-vibes-129489/', duration: '2:15', bpm: 105, isPremium: false }
    ]
  },
  {
    id: 'business_finance',
    name: 'Business/Finanças',
    icon: '💰',
    description: 'Autoridade e credibilidade instantânea',
    introDuration: 7,
    hookStructure: '[Dado impactante] + [Consequência] + [Solução/Oportunidade]',
    textAnimation: 'typewriter',
    musicStyle: 'Corporativo moderno ou piano sutil',
    transitionIn: 'cross_dissolve',
    transitionDuration: 0.5,
    visualStyle: 'Gráficos, números em destaque, ambiente profissional',
    colorTone: 'neutral',
    effects: { vignette: false, kenBurns: true, letterbox: false, fadeIn: true },
    hookExamples: [
      '"R$ 10.000 em 30 dias. E eu vou te mostrar exatamente como."',
      '"97% das pessoas fazem isso ERRADO com seu dinheiro."',
      '"Esse investimento subiu 340% em 2024. Você precisa saber."'
    ],
    tipsPt: [
      'Mostre números e dados logo no início',
      'Vista-se de forma profissional',
      'Use gráficos animados',
      'Fale com confiança e autoridade'
    ],
    recommendedMusic: [
      { name: 'Corporate Inspiring', artist: 'Coma-Media', source: 'Pixabay', genre: 'Corporativo', mood: 'Profissional', url: 'https://pixabay.com/music/upbeat-corporate-inspiring-135929/', duration: '2:30', bpm: 100, isPremium: false },
      { name: 'Business Innovation', artist: 'AlexiAction', source: 'Pixabay', genre: 'Corporativo', mood: 'Moderno', url: 'https://pixabay.com/music/upbeat-business-innovation-138131/', duration: '2:45', bpm: 110, isPremium: false },
      { name: 'Motivational Piano', artist: 'Lesfm', source: 'Pixabay', genre: 'Piano', mood: 'Inspirador', url: 'https://pixabay.com/music/solo-piano-motivational-piano-115672/', duration: '3:00', bpm: 80, isPremium: false },
      { name: 'Success Technology', artist: 'SoulProdMusic', source: 'Pixabay', genre: 'Eletrônico', mood: 'Confiante', url: 'https://pixabay.com/music/upbeat-technology-success-140090/', duration: '2:00', bpm: 95, isPremium: false }
    ]
  },
  {
    id: 'horror_suspense',
    name: 'Terror/Suspense',
    icon: '👻',
    description: 'Atmosfera tensa e misteriosa',
    introDuration: 10,
    hookStructure: '[Ambiente tenso] + [Elemento perturbador] + [Pergunta assustadora]',
    textAnimation: 'fade',
    musicStyle: 'Drone, sons ambiente, silêncio estratégico',
    transitionIn: 'dip_to_color',
    transitionDuration: 1,
    visualStyle: 'Low key lighting, sombras, movimentos lentos',
    colorTone: 'cinematic_cool',
    effects: { vignette: true, kenBurns: true, letterbox: true, fadeIn: true },
    hookExamples: [
      '"Às 3:33 da manhã, algo bateu na minha janela..."',
      '"Nunca deveria ter entrado naquela casa."',
      '"Esta gravação foi encontrada. O dono nunca foi visto novamente."'
    ],
    tipsPt: [
      'Use silêncios e sons sutis',
      'Iluminação baixa e sombras',
      'Narração sussurrada ou grave',
      'Build-up lento da tensão'
    ],
    recommendedMusic: [
      { name: 'Dark Ambient', artist: 'Lexin_Music', source: 'Pixabay', genre: 'Ambiente', mood: 'Tenso', url: 'https://pixabay.com/music/ambient-dark-ambient-horror-118564/', duration: '3:30', bpm: 60, isPremium: false },
      { name: 'Suspense Horror', artist: 'Coma-Media', source: 'Pixabay', genre: 'Suspense', mood: 'Assustador', url: 'https://pixabay.com/music/suspense-suspense-horror-142134/', duration: '2:45', bpm: 70, isPremium: false },
      { name: 'Creepy Drone', artist: 'AudioCoffee', source: 'Pixabay', genre: 'Drone', mood: 'Perturbador', url: 'https://pixabay.com/music/ambient-creepy-drone-atmosphere-138221/', duration: '4:00', bpm: 0, isPremium: false },
      { name: 'Tension Building', artist: 'RoyaltyFreeZone', source: 'Pixabay', genre: 'Suspense', mood: 'Intenso', url: 'https://pixabay.com/music/suspense-tension-building-120989/', duration: '2:30', bpm: 80, isPremium: false }
    ]
  },
  {
    id: 'comedy',
    name: 'Comédia',
    icon: '😂',
    description: 'Riso imediato e energia contagiante',
    introDuration: 3,
    hookStructure: '[Piada/Situação absurda] + [Reação] + [Setup para mais risadas]',
    textAnimation: 'bounce',
    musicStyle: 'Funk, música cômica ou efeitos sonoros',
    transitionIn: 'push',
    transitionDuration: 0.25,
    visualStyle: 'Cores vibrantes, expressões exageradas, zoom cômico',
    colorTone: 'neutral',
    effects: { vignette: false, kenBurns: false, letterbox: false, fadeIn: false },
    hookExamples: [
      '"Eu fiz a maior besteira da minha vida."',
      '"Minha mãe descobriu meu canal. Olha a reação dela."',
      '"Isso é o que acontece quando você é burro."'
    ],
    tipsPt: [
      'A piada precisa vir nos primeiros 2 segundos',
      'Use expressões faciais exageradas',
      'Efeitos sonoros de comédia',
      'Cortes rápidos e timing perfeito'
    ],
    recommendedMusic: [
      { name: 'Funny Comedy', artist: 'FASSounds', source: 'Pixabay', genre: 'Comédia', mood: 'Engraçado', url: 'https://pixabay.com/music/funny-comedy-funny-background-129876/', duration: '1:30', bpm: 120, isPremium: false },
      { name: 'Happy Ukulele', artist: 'Lesfm', source: 'Pixabay', genre: 'Ukulele', mood: 'Alegre', url: 'https://pixabay.com/music/acoustic-group-happy-ukulele-122908/', duration: '2:00', bpm: 110, isPremium: false },
      { name: 'Quirky Fun', artist: 'Coma-Media', source: 'Pixabay', genre: 'Comédia', mood: 'Travesso', url: 'https://pixabay.com/music/funny-comedy-quirky-fun-141234/', duration: '1:45', bpm: 130, isPremium: false },
      { name: 'Cartoon Comedy', artist: 'SoulProdMusic', source: 'Pixabay', genre: 'Comédia', mood: 'Divertido', url: 'https://pixabay.com/music/funny-comedy-cartoon-140567/', duration: '1:30', bpm: 140, isPremium: false }
    ]
  },
  {
    id: 'motivational',
    name: 'Motivacional',
    icon: '🔥',
    description: 'Inspiração e chamada para ação',
    introDuration: 6,
    hookStructure: '[Frase de impacto] + [História resumida] + [Promessa de transformação]',
    textAnimation: 'zoom',
    musicStyle: 'Épica motivacional, piano emocional',
    transitionIn: 'fade_to_black',
    transitionDuration: 0.5,
    visualStyle: 'Imagens de superação, luz dourada, closes emocionais',
    colorTone: 'cinematic_warm',
    effects: { vignette: true, kenBurns: true, letterbox: true, fadeIn: true },
    hookExamples: [
      '"Você vai morrer. A pergunta é: vai ter vivido?"',
      '"Ele tinha TUDO contra ele. E mesmo assim..."',
      '"Se você está cansado de ser medíocre, assista até o final."'
    ],
    tipsPt: [
      'Comece com frase de impacto',
      'Use imagens de conquista/superação',
      'Música crescente emocionalmente',
      'Energia na voz, pausas dramáticas'
    ],
    recommendedMusic: [
      { name: 'Epic Motivation', artist: 'AlexiAction', source: 'Pixabay', genre: 'Épico', mood: 'Inspirador', url: 'https://pixabay.com/music/upbeat-epic-motivation-142567/', duration: '3:00', bpm: 100, isPremium: false },
      { name: 'Inspiring Success', artist: 'Lexin_Music', source: 'Pixabay', genre: 'Orquestral', mood: 'Triunfante', url: 'https://pixabay.com/music/upbeat-inspiring-success-135671/', duration: '2:45', bpm: 90, isPremium: false },
      { name: 'Rise Up', artist: 'Coma-Media', source: 'Pixabay', genre: 'Épico', mood: 'Poderoso', url: 'https://pixabay.com/music/upbeat-rise-up-inspiring-128976/', duration: '2:30', bpm: 95, isPremium: false },
      { name: 'Emotional Cinematic', artist: 'AShamaluevMusic', source: 'Pixabay', genre: 'Orquestral', mood: 'Emotivo', url: 'https://pixabay.com/music/upbeat-emotional-cinematic-141890/', duration: '3:15', bpm: 85, isPremium: false }
    ]
  },
  {
    id: 'news',
    name: 'Notícias/Atualidades',
    icon: '📰',
    description: 'Urgência e relevância imediata',
    introDuration: 4,
    hookStructure: '[Manchete bombástica] + [Contexto rápido] + [Por que importa]',
    textAnimation: 'slide',
    musicStyle: 'News theme, urgência ou silêncio',
    transitionIn: 'push',
    transitionDuration: 0.25,
    visualStyle: 'Lower thirds, textos em movimento, estilo jornalístico',
    colorTone: 'neutral',
    effects: { vignette: false, kenBurns: false, letterbox: false, fadeIn: false },
    hookExamples: [
      '"URGENTE: Isso acabou de acontecer e você precisa saber."',
      '"ÚLTIMA HORA: A decisão que vai afetar TODO brasileiro."',
      '"BOMBA: O que a mídia não está te contando."'
    ],
    tipsPt: [
      'Vá direto ao fato principal',
      'Use texto na tela (lower thirds)',
      'Tom de voz urgente mas claro',
      'Imagens de apoio relevantes'
    ],
    recommendedMusic: [
      { name: 'Breaking News', artist: 'RoyaltyFreeZone', source: 'Pixabay', genre: 'Notícias', mood: 'Urgente', url: 'https://pixabay.com/music/upbeat-breaking-news-141234/', duration: '1:00', bpm: 120, isPremium: false },
      { name: 'News Intro', artist: 'SoulProdMusic', source: 'Pixabay', genre: 'Notícias', mood: 'Profissional', url: 'https://pixabay.com/music/upbeat-news-intro-138765/', duration: '0:30', bpm: 130, isPremium: false },
      { name: 'Corporate News', artist: 'Coma-Media', source: 'Pixabay', genre: 'Corporativo', mood: 'Sério', url: 'https://pixabay.com/music/upbeat-corporate-news-142890/', duration: '1:30', bpm: 110, isPremium: false },
      { name: 'Tension News', artist: 'AudioCoffee', source: 'Pixabay', genre: 'Suspense', mood: 'Tenso', url: 'https://pixabay.com/music/suspense-tension-news-139876/', duration: '2:00', bpm: 100, isPremium: false }
    ]
  },
  {
    id: 'educational',
    name: 'Educacional',
    icon: '📚',
    description: 'Curiosidade e promessa de aprendizado',
    introDuration: 6,
    hookStructure: '[Fato curioso] + [Problema/Questão] + [Promessa de explicação]',
    textAnimation: 'typewriter',
    musicStyle: 'Instrumental calmo, piano ou lo-fi',
    transitionIn: 'cross_dissolve',
    transitionDuration: 0.5,
    visualStyle: 'Infográficos, animações explicativas, diagrama',
    colorTone: 'neutral',
    effects: { vignette: false, kenBurns: true, letterbox: false, fadeIn: true },
    hookExamples: [
      '"Por que o céu é azul? A resposta é mais estranha do que você imagina."',
      '"Seu cérebro está te enganando agora. Deixa eu provar."',
      '"Em 5 minutos, você vai entender o que 99% não entende."'
    ],
    tipsPt: [
      'Comece com uma pergunta intrigante',
      'Use analogias visuais',
      'Tom de voz curioso e acessível',
      'Animações explicativas simples'
    ],
    recommendedMusic: [
      { name: 'Science Documentary', artist: 'AlexiAction', source: 'Pixabay', genre: 'Ambiente', mood: 'Curioso', url: 'https://pixabay.com/music/ambient-science-documentary-124567/', duration: '3:00', bpm: 80, isPremium: false },
      { name: 'Curious Mind', artist: 'Lesfm', source: 'Pixabay', genre: 'Piano', mood: 'Reflexivo', url: 'https://pixabay.com/music/solo-piano-curious-mind-138900/', duration: '2:45', bpm: 75, isPremium: false },
      { name: 'Discovery', artist: 'Lexin_Music', source: 'Pixabay', genre: 'Orquestral', mood: 'Maravilhado', url: 'https://pixabay.com/music/ambient-discovery-141234/', duration: '2:30', bpm: 85, isPremium: false },
      { name: 'Learning Journey', artist: 'FASSounds', source: 'Pixabay', genre: 'Eletrônico', mood: 'Inspirador', url: 'https://pixabay.com/music/upbeat-learning-journey-129876/', duration: '2:15', bpm: 90, isPremium: false }
    ]
  },
  {
    id: 'travel',
    name: 'Viagem/Turismo',
    icon: '✈️',
    description: 'Wanderlust e descobertas visuais',
    introDuration: 7,
    hookStructure: '[Vista deslumbrante] + [Elemento surpresa] + [Convite para explorar]',
    textAnimation: 'fade',
    musicStyle: 'World music, acústico ou épico cinematográfico',
    transitionIn: 'cross_dissolve',
    transitionDuration: 1,
    visualStyle: 'Drone shots, paisagens épicas, golden hour',
    colorTone: 'cinematic_warm',
    effects: { vignette: true, kenBurns: true, letterbox: true, fadeIn: true },
    hookExamples: [
      '"Esse lugar existe e quase NINGUÉM sabe."',
      '"R$ 50 por dia no país mais bonito do mundo."',
      '"Pensei que era Photoshop. Olha o que eu encontrei."'
    ],
    tipsPt: [
      'Comece com a melhor imagem do destino',
      'Use drone shots para impacto',
      'Música que evoque aventura',
      'Cores vibrantes e quentes'
    ],
    recommendedMusic: [
      { name: 'Adventure Travel', artist: 'Coma-Media', source: 'Pixabay', genre: 'Épico', mood: 'Aventureiro', url: 'https://pixabay.com/music/upbeat-adventure-travel-142567/', duration: '2:45', bpm: 100, isPremium: false },
      { name: 'World Explorer', artist: 'AShamaluevMusic', source: 'Pixabay', genre: 'World', mood: 'Exótico', url: 'https://pixabay.com/music/world-world-explorer-138234/', duration: '3:00', bpm: 90, isPremium: false },
      { name: 'Summer Vibes', artist: 'FASSounds', source: 'Pixabay', genre: 'Pop', mood: 'Alegre', url: 'https://pixabay.com/music/upbeat-summer-vibes-141890/', duration: '2:30', bpm: 110, isPremium: false },
      { name: 'Cinematic Journey', artist: 'Lexin_Music', source: 'Pixabay', genre: 'Orquestral', mood: 'Inspirador', url: 'https://pixabay.com/music/upbeat-cinematic-journey-129876/', duration: '3:15', bpm: 85, isPremium: false }
    ]
  },
  {
    id: 'fitness',
    name: 'Fitness/Saúde',
    icon: '💪',
    description: 'Transformação e resultados comprovados',
    introDuration: 5,
    hookStructure: '[Resultado/Transformação] + [Método] + [Promessa realista]',
    textAnimation: 'slide',
    musicStyle: 'Workout beats, EDM ou hip-hop',
    transitionIn: 'push',
    transitionDuration: 0.25,
    visualStyle: 'Antes/depois, treino em ação, closes de esforço',
    colorTone: 'teal_orange',
    effects: { vignette: true, kenBurns: false, letterbox: false, fadeIn: false },
    hookExamples: [
      '"30 dias. Zero equipamento. Esse foi o resultado."',
      '"O exercício que NINGUÉM faz e que muda tudo."',
      '"Perdi 20kg fazendo ISSO por 10 minutos por dia."'
    ],
    tipsPt: [
      'Mostre resultado visual imediato',
      'Energia alta na voz e corpo',
      'Música motivacional de treino',
      'Demonstre o movimento brevemente'
    ],
    recommendedMusic: [
      { name: 'Workout Power', artist: 'SoulProdMusic', source: 'Pixabay', genre: 'EDM', mood: 'Energético', url: 'https://pixabay.com/music/beats-workout-power-142567/', duration: '2:30', bpm: 140, isPremium: false },
      { name: 'Gym Motivation', artist: 'RoyaltyFreeZone', source: 'Pixabay', genre: 'Hip-Hop', mood: 'Poderoso', url: 'https://pixabay.com/music/beats-gym-motivation-138234/', duration: '2:45', bpm: 130, isPremium: false },
      { name: 'Sports Action', artist: 'Coma-Media', source: 'Pixabay', genre: 'Eletrônico', mood: 'Intenso', url: 'https://pixabay.com/music/beats-sports-action-141890/', duration: '2:00', bpm: 145, isPremium: false },
      { name: 'Training Beast', artist: 'Lexin_Music', source: 'Pixabay', genre: 'EDM', mood: 'Agressivo', url: 'https://pixabay.com/music/beats-training-beast-129876/', duration: '2:15', bpm: 150, isPremium: false }
    ]
  },
  {
    id: 'cooking',
    name: 'Culinária',
    icon: '👨‍🍳',
    description: 'Apetite visual e simplicidade',
    introDuration: 5,
    hookStructure: '[Prato finalizado] + [Ingrediente surpresa] + [Facilidade]',
    textAnimation: 'fade',
    musicStyle: 'Jazz suave, acústico ou música alegre',
    transitionIn: 'cross_dissolve',
    transitionDuration: 0.5,
    visualStyle: 'Food porn, close-ups, vapor, cores vibrantes',
    colorTone: 'cinematic_warm',
    effects: { vignette: true, kenBurns: true, letterbox: false, fadeIn: true },
    hookExamples: [
      '"3 ingredientes. 5 minutos. Resultado: INCRÍVEL."',
      '"O segredo que os chefs não contam."',
      '"Nunca mais você vai comer isso de outro jeito."'
    ],
    tipsPt: [
      'Mostre o prato pronto primeiro (food porn)',
      'Close-ups do corte, vapor, texturas',
      'Iluminação quente e apetitosa',
      'Sons de cozinha (ASMR culinário)'
    ],
    recommendedMusic: [
      { name: 'Cooking Jazz', artist: 'FASSounds', source: 'Pixabay', genre: 'Jazz', mood: 'Relaxado', url: 'https://pixabay.com/music/jazz-blues-cooking-jazz-138234/', duration: '3:00', bpm: 90, isPremium: false },
      { name: 'Happy Kitchen', artist: 'Lesfm', source: 'Pixabay', genre: 'Acústico', mood: 'Alegre', url: 'https://pixabay.com/music/acoustic-group-happy-kitchen-141890/', duration: '2:30', bpm: 100, isPremium: false },
      { name: 'Italian Restaurant', artist: 'AlexiAction', source: 'Pixabay', genre: 'World', mood: 'Aconchegante', url: 'https://pixabay.com/music/world-italian-restaurant-129876/', duration: '2:45', bpm: 85, isPremium: false },
      { name: 'Food Documentary', artist: 'Coma-Media', source: 'Pixabay', genre: 'Ambiente', mood: 'Sofisticado', url: 'https://pixabay.com/music/ambient-food-documentary-142567/', duration: '3:15', bpm: 80, isPremium: false }
    ]
  },
  {
    id: 'music',
    name: 'Música',
    icon: '🎵',
    description: 'Impacto sonoro e visual sincronizado',
    introDuration: 4,
    hookStructure: '[Drop/Riff marcante] + [Visual sincronizado] + [Identidade artística]',
    textAnimation: 'glitch',
    musicStyle: 'A própria música do artista/cover',
    transitionIn: 'dip_to_color',
    transitionDuration: 0.25,
    visualStyle: 'Performance, luzes, estética do artista',
    colorTone: 'noir',
    effects: { vignette: true, kenBurns: false, letterbox: true, fadeIn: true },
    hookExamples: [
      '"(Riff/Batida) E aí galera, bora pro som!"',
      '"Essa música mudou minha vida. Ouve até o final."',
      '"Cover com um twist que você NUNCA ouviu."'
    ],
    tipsPt: [
      'Comece com o melhor momento musical',
      'Sincronia visual com a batida',
      'Iluminação dramática',
      'Mostre habilidade logo de cara'
    ],
    recommendedMusic: [
      { name: 'Beat Drop', artist: 'SoulProdMusic', source: 'Pixabay', genre: 'EDM', mood: 'Energético', url: 'https://pixabay.com/music/beats-beat-drop-142567/', duration: '2:00', bpm: 128, isPremium: false },
      { name: 'Guitar Solo', artist: 'AlexiAction', source: 'Pixabay', genre: 'Rock', mood: 'Intenso', url: 'https://pixabay.com/music/rock-guitar-solo-138234/', duration: '2:30', bpm: 120, isPremium: false },
      { name: 'Hip Hop Beat', artist: 'RoyaltyFreeZone', source: 'Pixabay', genre: 'Hip-Hop', mood: 'Groove', url: 'https://pixabay.com/music/beats-hip-hop-beat-141890/', duration: '2:45', bpm: 95, isPremium: false },
      { name: 'Electronic Vibes', artist: 'Coma-Media', source: 'Pixabay', genre: 'Eletrônico', mood: 'Moderno', url: 'https://pixabay.com/music/beats-electronic-vibes-129876/', duration: '2:15', bpm: 125, isPremium: false }
    ]
  },
  {
    id: 'storytime',
    name: 'Storytime',
    icon: '📖',
    description: 'Mistério e curiosidade narrativa',
    introDuration: 8,
    hookStructure: '[Contexto intrigante] + [Ponto de virada] + [Pergunta que prende]',
    textAnimation: 'typewriter',
    musicStyle: 'Suspense sutil ou piano emocional',
    transitionIn: 'fade_to_black',
    transitionDuration: 1,
    visualStyle: 'Rosto do narrador, B-roll ilustrativo, baixa luz',
    colorTone: 'cinematic_cool',
    effects: { vignette: true, kenBurns: true, letterbox: false, fadeIn: true },
    hookExamples: [
      '"Tudo começou com uma mensagem às 3 da manhã..."',
      '"Essa é a história que eu NUNCA contei."',
      '"O que aconteceu naquela noite... mudou tudo."'
    ],
    tipsPt: [
      'Comece no meio da ação (in media res)',
      'Crie suspense com pausas',
      'Use expressões faciais',
      'B-roll para ilustrar a história'
    ],
    recommendedMusic: [
      { name: 'Mystery Story', artist: 'Lexin_Music', source: 'Pixabay', genre: 'Suspense', mood: 'Misterioso', url: 'https://pixabay.com/music/suspense-mystery-story-142567/', duration: '3:00', bpm: 70, isPremium: false },
      { name: 'Emotional Piano', artist: 'Lesfm', source: 'Pixabay', genre: 'Piano', mood: 'Emotivo', url: 'https://pixabay.com/music/solo-piano-emotional-piano-138234/', duration: '3:30', bpm: 65, isPremium: false },
      { name: 'Dark Narrative', artist: 'AudioCoffee', source: 'Pixabay', genre: 'Ambiente', mood: 'Sombrio', url: 'https://pixabay.com/music/ambient-dark-narrative-141890/', duration: '4:00', bpm: 60, isPremium: false },
      { name: 'Tension Build', artist: 'Coma-Media', source: 'Pixabay', genre: 'Suspense', mood: 'Tenso', url: 'https://pixabay.com/music/suspense-tension-build-129876/', duration: '2:45', bpm: 80, isPremium: false }
    ]
  },
  {
    id: 'biblical',
    name: 'Bíblico/Religioso',
    icon: '✝️',
    description: 'Reflexão espiritual com tom reverente',
    introDuration: 8,
    hookStructure: '[Versículo/Citação] + [Reflexão pessoal] + [Promessa de revelação]',
    textAnimation: 'fade',
    musicStyle: 'Coral, piano reverente ou orquestral suave',
    transitionIn: 'fade_to_black',
    transitionDuration: 1,
    visualStyle: 'Paisagens naturais, luz dourada, imagens simbólicas',
    colorTone: 'cinematic_warm',
    effects: { vignette: true, kenBurns: true, letterbox: true, fadeIn: true },
    hookExamples: [
      '"Este versículo mudou minha vida para sempre..."',
      '"Deus tem uma mensagem urgente para você hoje."',
      '"Por que 90% dos cristãos ignoram isso na Bíblia?"'
    ],
    tipsPt: [
      'Comece com versículo impactante',
      'Use tom de voz calmo e reverente',
      'Imagens de natureza e luz dourada',
      'Música suave e crescente'
    ],
    recommendedMusic: [
      { name: 'Sacred Worship', artist: 'Lesfm', source: 'Pixabay', genre: 'Worship', mood: 'Reverente', url: 'https://pixabay.com/music/worship-sacred-142567/', duration: '3:30', bpm: 70, isPremium: false },
      { name: 'Peaceful Piano', artist: 'AlexiAction', source: 'Pixabay', genre: 'Piano', mood: 'Sereno', url: 'https://pixabay.com/music/solo-piano-peaceful-138234/', duration: '3:00', bpm: 60, isPremium: false },
      { name: 'Heavenly Strings', artist: 'SoulProdMusic', source: 'Pixabay', genre: 'Orquestral', mood: 'Celestial', url: 'https://pixabay.com/music/orchestral-heavenly-141890/', duration: '4:00', bpm: 65, isPremium: false },
      { name: 'Grace Ambient', artist: 'Coma-Media', source: 'Pixabay', genre: 'Ambiente', mood: 'Espiritual', url: 'https://pixabay.com/music/ambient-grace-129876/', duration: '3:15', bpm: 55, isPremium: false }
    ]
  },
  {
    id: 'psychology',
    name: 'Psicologia/Mente',
    icon: '🧠',
    description: 'Insights sobre comportamento humano',
    introDuration: 6,
    hookStructure: '[Fenômeno psicológico] + [Exemplo prático] + [Solução/Descoberta]',
    textAnimation: 'typewriter',
    musicStyle: 'Ambiente introspectivo, piano minimalista',
    transitionIn: 'cross_dissolve',
    transitionDuration: 0.5,
    visualStyle: 'Ilustrações abstratas, cérebro, silhuetas, simetria',
    colorTone: 'film_look',
    effects: { vignette: true, kenBurns: true, letterbox: false, fadeIn: true },
    hookExamples: [
      '"Seu cérebro está te sabotando agora mesmo..."',
      '"Por que você sempre atrai o mesmo tipo de pessoa?"',
      '"O viés cognitivo que 99% das pessoas não conhecem."'
    ],
    tipsPt: [
      'Comece com insight contra-intuitivo',
      'Use termos técnicos com explicação simples',
      'Imagens simbólicas do cérebro/mente',
      'Tom professoral mas acessível'
    ],
    recommendedMusic: [
      { name: 'Mind Journey', artist: 'Lexin_Music', source: 'Pixabay', genre: 'Ambiente', mood: 'Introspectivo', url: 'https://pixabay.com/music/ambient-mind-journey-142567/', duration: '3:00', bpm: 75, isPremium: false },
      { name: 'Deep Thoughts', artist: 'FASSounds', source: 'Pixabay', genre: 'Piano', mood: 'Reflexivo', url: 'https://pixabay.com/music/solo-piano-deep-thoughts-138234/', duration: '2:45', bpm: 70, isPremium: false },
      { name: 'Neural Ambient', artist: 'AudioCoffee', source: 'Pixabay', genre: 'Eletrônico', mood: 'Misterioso', url: 'https://pixabay.com/music/ambient-neural-141890/', duration: '3:30', bpm: 80, isPremium: false },
      { name: 'Cognitive Flow', artist: 'Coma-Media', source: 'Pixabay', genre: 'Lo-Fi', mood: 'Focado', url: 'https://pixabay.com/music/beats-cognitive-flow-129876/', duration: '2:30', bpm: 85, isPremium: false }
    ]
  },
  {
    id: 'curiosities',
    name: 'Curiosidades/Fatos',
    icon: '🤯',
    description: 'Fatos surpreendentes que prendem a atenção',
    introDuration: 4,
    hookStructure: '[Fato chocante] + [Contexto rápido] + [Promessa de mais]',
    textAnimation: 'zoom',
    musicStyle: 'Upbeat intrigante, efeitos de suspense',
    transitionIn: 'push',
    transitionDuration: 0.25,
    visualStyle: 'Imagens surpreendentes, comparações visuais, infográficos',
    colorTone: 'teal_orange',
    effects: { vignette: false, kenBurns: true, letterbox: false, fadeIn: false },
    hookExamples: [
      '"Você usa apenas 10% do cérebro? MENTIRA. A verdade é..."',
      '"Isso é IMPOSSÍVEL, mas aconteceu 3 vezes!"',
      '"O país onde é PROIBIDO morrer. Sim, é real."'
    ],
    tipsPt: [
      'Fato impactante nos primeiros 2 segundos',
      'Use dados e números específicos',
      'Comparações visuais impressionantes',
      'Energia alta e ritmo rápido'
    ],
    recommendedMusic: [
      { name: 'Mind Blown', artist: 'SoulProdMusic', source: 'Pixabay', genre: 'Eletrônico', mood: 'Surpreendente', url: 'https://pixabay.com/music/beats-mind-blown-142567/', duration: '2:00', bpm: 120, isPremium: false },
      { name: 'Curiosity', artist: 'RoyaltyFreeZone', source: 'Pixabay', genre: 'Pop', mood: 'Intrigante', url: 'https://pixabay.com/music/upbeat-curiosity-138234/', duration: '2:30', bpm: 110, isPremium: false },
      { name: 'Amazing Facts', artist: 'Coma-Media', source: 'Pixabay', genre: 'Trailer', mood: 'Épico', url: 'https://pixabay.com/music/upbeat-amazing-facts-141890/', duration: '1:45', bpm: 130, isPremium: false },
      { name: 'Discovery Channel', artist: 'AlexiAction', source: 'Pixabay', genre: 'Orquestral', mood: 'Maravilhado', url: 'https://pixabay.com/music/upbeat-discovery-channel-129876/', duration: '2:15', bpm: 100, isPremium: false }
    ]
  },
  {
    id: 'ancient_civilizations',
    name: 'Civilizações Antigas',
    icon: '🏛️',
    description: 'Mistérios e segredos de civilizações perdidas',
    introDuration: 8,
    hookStructure: '[Mistério antigo] + [Descoberta recente] + [Pergunta provocativa]',
    textAnimation: 'fade',
    musicStyle: 'Orquestral épica, percussão tribal, ambiente misterioso',
    transitionIn: 'fade_to_black',
    transitionDuration: 1,
    visualStyle: 'Ruínas, pirâmides, artefatos, mapas antigos, reconstruções 3D',
    colorTone: 'film_look',
    effects: { vignette: true, kenBurns: true, letterbox: true, fadeIn: true },
    hookExamples: [
      '"Esta descoberta de 2024 reescreve a história humana..."',
      '"Os arqueólogos ficaram CHOCADOS ao encontrar isso."',
      '"Como civilizações antigas sabiam sobre isso 5000 anos atrás?"'
    ],
    tipsPt: [
      'Comece com imagem impactante de ruínas',
      'Use mapas e reconstruções visuais',
      'Tom de voz misterioso e contemplativo',
      'Música épica com elementos étnicos'
    ],
    recommendedMusic: [
      { name: 'Ancient Mystery', artist: 'Lexin_Music', source: 'Pixabay', genre: 'Orquestral', mood: 'Misterioso', url: 'https://pixabay.com/music/ambient-ancient-mystery-142567/', duration: '3:30', bpm: 80, isPremium: false },
      { name: 'Egyptian Empire', artist: 'AlexiAction', source: 'Pixabay', genre: 'Épico', mood: 'Grandioso', url: 'https://pixabay.com/music/epic-egyptian-empire-138234/', duration: '3:00', bpm: 90, isPremium: false },
      { name: 'Lost Civilization', artist: 'SoulProdMusic', source: 'Pixabay', genre: 'Ambiente', mood: 'Exploratório', url: 'https://pixabay.com/music/ambient-lost-civilization-141890/', duration: '4:00', bpm: 70, isPremium: false },
      { name: 'Tribal Drums', artist: 'Coma-Media', source: 'Pixabay', genre: 'Percussão', mood: 'Intenso', url: 'https://pixabay.com/music/world-tribal-drums-129876/', duration: '2:45', bpm: 100, isPremium: false }
    ]
  },
  {
    id: 'health',
    name: 'Saúde/Bem-estar',
    icon: '💚',
    description: 'Dicas de saúde e qualidade de vida',
    introDuration: 5,
    hookStructure: '[Problema comum] + [Causa oculta] + [Solução simples]',
    textAnimation: 'slide',
    musicStyle: 'Suave, positivo, piano ou acústico leve',
    transitionIn: 'cross_dissolve',
    transitionDuration: 0.5,
    visualStyle: 'Natureza, alimentos saudáveis, exercícios, pessoas felizes',
    colorTone: 'neutral',
    effects: { vignette: false, kenBurns: true, letterbox: false, fadeIn: true },
    hookExamples: [
      '"Este alimento comum está DESTRUINDO sua saúde..."',
      '"O hábito de 5 minutos que mudou minha vida."',
      '"Por que você acorda cansado mesmo dormindo 8 horas?"'
    ],
    tipsPt: [
      'Comece com problema que todos têm',
      'Use dados científicos de forma simples',
      'Imagens de bem-estar e natureza',
      'Tom acolhedor e motivador'
    ],
    recommendedMusic: [
      { name: 'Healthy Life', artist: 'FASSounds', source: 'Pixabay', genre: 'Acústico', mood: 'Positivo', url: 'https://pixabay.com/music/acoustic-healthy-life-142567/', duration: '2:30', bpm: 95, isPremium: false },
      { name: 'Wellness Journey', artist: 'Lesfm', source: 'Pixabay', genre: 'Piano', mood: 'Sereno', url: 'https://pixabay.com/music/solo-piano-wellness-journey-138234/', duration: '3:00', bpm: 80, isPremium: false },
      { name: 'Morning Energy', artist: 'SoulProdMusic', source: 'Pixabay', genre: 'Pop', mood: 'Energético', url: 'https://pixabay.com/music/upbeat-morning-energy-141890/', duration: '2:15', bpm: 110, isPremium: false },
      { name: 'Natural Balance', artist: 'Coma-Media', source: 'Pixabay', genre: 'Ambiente', mood: 'Relaxante', url: 'https://pixabay.com/music/ambient-natural-balance-129876/', duration: '3:15', bpm: 70, isPremium: false }
    ]
  },
  {
    id: 'emotional_stories',
    name: 'Histórias Emocionantes',
    icon: '💔',
    description: 'Narrativas que tocam o coração e emocionam',
    introDuration: 10,
    hookStructure: '[Situação emocional] + [Ponto de virada] + [Promessa de emoção]',
    textAnimation: 'fade',
    musicStyle: 'Piano emotivo, cordas, baladas instrumentais',
    transitionIn: 'fade_to_black',
    transitionDuration: 1.5,
    visualStyle: 'Rostos expressivos, momentos íntimos, luz suave, cores quentes',
    colorTone: 'cinematic_warm',
    effects: { vignette: true, kenBurns: true, letterbox: true, fadeIn: true },
    hookExamples: [
      '"Ele esperou 40 anos para dizer isso a ela..."',
      '"As últimas palavras dela me destruíram."',
      '"Este vídeo VAI te fazer chorar. Eu garanto."'
    ],
    tipsPt: [
      'Comece com emoção genuína e vulnerabilidade',
      'Use pausas dramáticas na narração',
      'Música emotiva que cresce gradualmente',
      'Imagens de conexão humana'
    ],
    recommendedMusic: [
      { name: 'Tears of Joy', artist: 'Lesfm', source: 'Pixabay', genre: 'Piano', mood: 'Emotivo', url: 'https://pixabay.com/music/solo-piano-tears-of-joy-142567/', duration: '4:00', bpm: 60, isPremium: false },
      { name: 'Heartfelt Strings', artist: 'Lexin_Music', source: 'Pixabay', genre: 'Orquestral', mood: 'Comovente', url: 'https://pixabay.com/music/orchestral-heartfelt-strings-138234/', duration: '3:30', bpm: 65, isPremium: false },
      { name: 'Emotional Journey', artist: 'AudioCoffee', source: 'Pixabay', genre: 'Ambiente', mood: 'Melancólico', url: 'https://pixabay.com/music/ambient-emotional-journey-141890/', duration: '4:30', bpm: 70, isPremium: false },
      { name: 'True Love', artist: 'SoulProdMusic', source: 'Pixabay', genre: 'Balada', mood: 'Romântico', url: 'https://pixabay.com/music/romantic-true-love-129876/', duration: '3:45', bpm: 75, isPremium: false }
    ]
  }
];

/**
 * Gera instruções de introdução para o nicho selecionado
 */
export const generateIntroInstructions = (preset: IntroPreset): string => {
  return `
╔══════════════════════════════════════════════════════════════════════════════╗
║          GUIA DE INTRODUÇÃO - ${preset.name.toUpperCase().padEnd(20)}                     ║
╚══════════════════════════════════════════════════════════════════════════════╝

📋 VISÃO GERAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${preset.icon} ${preset.description}

⏱️  Duração ideal: ${preset.introDuration} segundos
🎬 Transição: ${preset.transitionIn.replace('_', ' ')} (${preset.transitionDuration}s)
🎨 Colorização: ${preset.colorTone}

═══════════════════════════════════════════════════════════════════════════════
                           ESTRUTURA DO GANCHO
═══════════════════════════════════════════════════════════════════════════════

📌 FÓRMULA:
${preset.hookStructure}

💬 EXEMPLOS DE GANCHOS:
${preset.hookExamples.map((h, i) => `   ${i + 1}. ${h}`).join('\n')}

═══════════════════════════════════════════════════════════════════════════════
                              ESTILO VISUAL
═══════════════════════════════════════════════════════════════════════════════

🎥 DIREÇÃO VISUAL:
${preset.visualStyle}

🎵 ESTILO MUSICAL:
${preset.musicStyle}

✨ ANIMAÇÃO DE TEXTO: ${preset.textAnimation.toUpperCase()}

🔧 EFEITOS APLICADOS:
${preset.effects.fadeIn ? '   ✅ Fade In na abertura' : '   ⬜ Fade In'}
${preset.effects.kenBurns ? '   ✅ Ken Burns (movimento suave)' : '   ⬜ Ken Burns'}
${preset.effects.vignette ? '   ✅ Vinheta cinematográfica' : '   ⬜ Vinheta'}
${preset.effects.letterbox ? '   ✅ Letterbox (barras cinema)' : '   ⬜ Letterbox'}

═══════════════════════════════════════════════════════════════════════════════
                              DICAS PRO
═══════════════════════════════════════════════════════════════════════════════

${preset.tipsPt.map((t, i) => `💡 ${i + 1}. ${t}`).join('\n')}

═══════════════════════════════════════════════════════════════════════════════
                         CHECKLIST DE GRAVAÇÃO
═══════════════════════════════════════════════════════════════════════════════

□ Gancho nos primeiros 3 segundos
□ Música/som ambiente configurado
□ Iluminação adequada ao estilo
□ Texto/títulos preparados
□ B-roll de suporte selecionado
□ Transição de saída da intro definida
${BRAND_FOOTER}`;
};


const secondsToFrames = (seconds: number, fps: number): number => {
  return Math.round(seconds * fps);
};

/**
 * Escapa caracteres XML
 */
const escapeXml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
};

/**
 * Gera o XML da transição baseado no tipo
 */
const getTransitionXml = (transitionType: TransitionType, transitionFrames: number): string => {
  if (transitionType === 'none') return '';
  
  // Mapeamento completo de todas as transições para XML FCP7/DaVinci
  const transitionConfigs: Record<string, { name: string; effectId: string; category: string }> = {
    // Dissolve
    cross_dissolve: { name: 'Cross Dissolve', effectId: 'Cross Dissolve', category: 'Dissolve' },
    fade_to_black: { name: 'Fade In/Fade Out Dissolve', effectId: 'Fade In/Fade Out Dissolve', category: 'Dissolve' },
    dip_to_color: { name: 'Dip to Color Dissolve', effectId: 'Dip to Color Dissolve', category: 'Dissolve' },
    additive_dissolve: { name: 'Additive Dissolve', effectId: 'Additive Dissolve', category: 'Dissolve' },
    non_additive_dissolve: { name: 'Non-Additive Dissolve', effectId: 'Non-Additive Dissolve', category: 'Dissolve' },
    blur_dissolve: { name: 'Cross Dissolve', effectId: 'Cross Dissolve', category: 'Dissolve' }, // Usa Cross Dissolve como base, aplicar blur manualmente
    
    // Íris
    iris_circle: { name: 'Iris', effectId: 'Iris', category: 'Iris' },
    iris_diamond: { name: 'Iris Diamond', effectId: 'Iris Diamond', category: 'Iris' },
    iris_cross: { name: 'Iris Cross', effectId: 'Iris Cross', category: 'Iris' },
    iris_oval: { name: 'Iris Oval', effectId: 'Iris Oval', category: 'Iris' },
    iris_star: { name: 'Iris Star', effectId: 'Iris Star', category: 'Iris' },
    iris_hexagon: { name: 'Iris', effectId: 'Iris', category: 'Iris' },
    
    // Movimento
    push: { name: 'Push', effectId: 'Push', category: 'Wipe' },
    slide: { name: 'Slide', effectId: 'Slide', category: 'Wipe' },
    split: { name: 'Split', effectId: 'Split', category: 'Wipe' },
    door_open: { name: 'Center Split', effectId: 'Center Split', category: 'Wipe' },
    
    // Wipe
    wipe: { name: 'Wipe', effectId: 'Wipe', category: 'Wipe' },
    wipe_up: { name: 'Wipe Up', effectId: 'Wipe', category: 'Wipe' },
    wipe_down: { name: 'Wipe Down', effectId: 'Wipe', category: 'Wipe' },
    
    // Cortina
    center_curtain: { name: 'Center Wipe', effectId: 'Center Wipe', category: 'Wipe' },
    band_curtain: { name: 'Band Wipe', effectId: 'Band Wipe', category: 'Wipe' },
    edge_curtain: { name: 'Edge Wipe', effectId: 'Edge Wipe', category: 'Wipe' },
    clock_curtain: { name: 'Clock Wipe', effectId: 'Clock Wipe', category: 'Wipe' },
    spiral_curtain: { name: 'Spiral', effectId: 'Spiral', category: 'Wipe' },
    
    // Forma
    heart_shape: { name: 'Heart', effectId: 'Heart', category: 'Wipe' },
    star_shape: { name: 'Star', effectId: 'Star', category: 'Wipe' },
    box_shape: { name: 'Box', effectId: 'Box', category: 'Wipe' },
  };
  
  const config = transitionConfigs[transitionType] || transitionConfigs.cross_dissolve;
  
  return `                <transitionitem>
                  <start>0</start>
                  <end>${transitionFrames}</end>
                  <alignment>start-black</alignment>
                  <effect>
                    <name>${config.name}</name>
                    <effectid>${config.effectId}</effectid>
                    <effectcategory>${config.category}</effectcategory>
                    <effecttype>transition</effecttype>
                    <mediatype>video</mediatype>
                  </effect>
                </transitionitem>
`;
}

/**
 * Gera XML no formato FCP7 para DaVinci Resolve
 * Este formato tem melhor suporte para reconexão de mídias
 */
export const generateFcp7Xml = (
  scenes: SceneForXml[],
  options: {
    title?: string;
    fps?: number;
    width?: number;
    height?: number;
  } = {}
): string => {
  const title = options.title || 'Projeto_Video';
  const fps = options.fps || 24;
  const width = options.width || 1920;
  const height = options.height || 1080;
  const safeTitle = escapeXml(title.replace(/[^a-zA-Z0-9_-]/g, '_'));
  
  // Calcular duração total em frames
  const totalDurationFrames = scenes.reduce(
    (acc, scene) => acc + secondsToFrames(scene.durationSeconds, fps),
    0
  );
  
  // Gerar ID único para o projeto
  const projectId = `project-${Date.now()}`;
  const sequenceId = `sequence-${Date.now()}`;
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="5">
  <project>
    <name>${safeTitle}</name>
    <children>
      <sequence id="${sequenceId}">
        <uuid>${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`}</uuid>
        <name>${safeTitle}</name>
        <duration>${totalDurationFrames}</duration>
        <rate>
          <timebase>${fps}</timebase>
          <ntsc>FALSE</ntsc>
        </rate>
        <timecode>
          <rate>
            <timebase>${fps}</timebase>
            <ntsc>FALSE</ntsc>
          </rate>
          <string>00:00:00:00</string>
          <frame>0</frame>
          <displayformat>NDF</displayformat>
        </timecode>
        <in>-1</in>
        <out>-1</out>
        <media>
          <video>
            <format>
              <samplecharacteristics>
                <width>${width}</width>
                <height>${height}</height>
                <anamorphic>FALSE</anamorphic>
                <pixelaspectratio>square</pixelaspectratio>
                <fielddominance>none</fielddominance>
                <rate>
                  <timebase>${fps}</timebase>
                  <ntsc>FALSE</ntsc>
                </rate>
                <colordepth>24</colordepth>
                <codec>
                  <name>Apple ProRes 422</name>
                  <appspecificdata>
                    <appname>Final Cut Pro</appname>
                    <appmanufacturer>Apple Inc.</appmanufacturer>
                    <data>
                      <qtcodec/>
                    </data>
                  </appspecificdata>
                </codec>
              </samplecharacteristics>
            </format>
            <track>
`;

  let currentFrame = 0;
  
  scenes.forEach((scene, index) => {
    const durationFrames = secondsToFrames(scene.durationSeconds, fps);
    const fileName = `cena_${String(scene.number).padStart(3, '0')}.jpg`;
    const clipId = `clip-${scene.number}`;
    const fileId = `file-${scene.number}`;
    const masterId = `master-${scene.number}`;
    const shortText = scene.text ? escapeXml(scene.text.substring(0, 100)) : '';
    
    xml += `              <clipitem id="${clipId}">
                <name>${fileName}</name>
                <duration>${durationFrames}</duration>
                <rate>
                  <timebase>${fps}</timebase>
                  <ntsc>FALSE</ntsc>
                </rate>
                <start>${currentFrame}</start>
                <end>${currentFrame + durationFrames}</end>
                <in>0</in>
                <out>${durationFrames}</out>
                <masterclipid>${masterId}</masterclipid>
                <file id="${fileId}">
                  <name>${fileName}</name>
                  <pathurl>file://./${fileName}</pathurl>
                  <rate>
                    <timebase>${fps}</timebase>
                    <ntsc>FALSE</ntsc>
                  </rate>
                  <duration>${durationFrames}</duration>
                  <timecode>
                    <rate>
                      <timebase>${fps}</timebase>
                      <ntsc>FALSE</ntsc>
                    </rate>
                    <string>00:00:00:00</string>
                    <frame>0</frame>
                    <displayformat>NDF</displayformat>
                  </timecode>
                  <media>
                    <video>
                      <samplecharacteristics>
                        <width>${width}</width>
                        <height>${height}</height>
                      </samplecharacteristics>
                    </video>
                  </media>
                </file>
                <sourcetrack>
                  <mediatype>video</mediatype>
                  <trackindex>1</trackindex>
                </sourcetrack>
`;
    
    // Adicionar comentário com texto da cena
    if (shortText) {
      xml += `                <comments>
                  <mastercomment1>${shortText}</mastercomment1>
                </comments>
`;
    }
    
    xml += `              </clipitem>
`;
    
    currentFrame += durationFrames;
  });

  xml += `            </track>
          </video>
        </media>
      </sequence>
    </children>
  </project>
</xmeml>`;

  return xml;
};

/**
 * Interface de cena extendida com transição e emoção
 */
interface SceneForXmlWithTransition extends SceneForXml {
  emotion?: string;
  retentionTrigger?: string;
  sceneTransition?: SceneTransition;
}

/**
 * Gera XML com transições INTELIGENTES por cena (analisadas pela IA)
 * Suporta duração alvo (targetTotalSeconds) para sincronia exata com áudio
 */
export const generateFcp7XmlWithTransitions = (
  scenes: SceneForXml[],
  options: {
    title?: string;
    fps?: number;
    width?: number;
    height?: number;
    transitionFrames?: number;
    transitionType?: TransitionType;
    enableKenBurns?: boolean;
    targetTotalSeconds?: number;
    sceneTransitions?: SceneTransition[]; // NOVO: transições personalizadas por cena
    sceneEmotions?: Array<{ emotion?: string; retentionTrigger?: string }>; // NOVO: dados de emoção por cena
  } = {}
): string => {
  const title = options.title || 'Projeto_Video';
  const fps = options.fps || 24;
  const width = options.width || 1920;
  const height = options.height || 1080;
  const defaultTransitionFrames = options.transitionFrames || Math.round(fps * 0.5);
  const defaultTransitionType = options.transitionType || 'cross_dissolve';
  const enableKenBurns = options.enableKenBurns !== false;
  const targetTotalSeconds = options.targetTotalSeconds;
  const safeTitle = escapeXml(title.replace(/[^a-zA-Z0-9_-]/g, '_'));
  
  // Se temos emoções mas não transições, calcular automaticamente
  let sceneTransitions = options.sceneTransitions;
  if (!sceneTransitions && options.sceneEmotions) {
    const scenesWithEmotion = scenes.map((scene, i) => ({
      text: scene.text,
      emotion: options.sceneEmotions?.[i]?.emotion,
      retentionTrigger: options.sceneEmotions?.[i]?.retentionTrigger,
    }));
    sceneTransitions = applyTransitionsToScenes(scenesWithEmotion);
    console.log('[XML] Transições calculadas automaticamente:', sceneTransitions.map(t => t.transitionType));
  }
  
  // Aplicar análise Ken Burns se habilitado
  const processedScenes = enableKenBurns ? applyKenBurnsToScenes(scenes) : scenes;
  
  // Calcular frames para cada cena (arredondando individualmente)
  const sceneFrames = processedScenes.map(scene => secondsToFrames(scene.durationSeconds, fps));
  let totalDurationFrames = sceneFrames.reduce((acc, frames) => acc + frames, 0);
  
  // Se temos duração alvo, ajustar última cena para compensar diferença de arredondamento
  if (targetTotalSeconds && processedScenes.length > 0) {
    const targetTotalFrames = Math.round(targetTotalSeconds * fps);
    const frameDifference = targetTotalFrames - totalDurationFrames;
    
    if (frameDifference !== 0) {
      // Ajustar a última cena para fechar exatamente no tempo alvo
      sceneFrames[sceneFrames.length - 1] += frameDifference;
      totalDurationFrames = targetTotalFrames;
      console.log(`[XML] Ajuste frame-accurate: ${frameDifference > 0 ? '+' : ''}${frameDifference} frames na última cena para totalizar ${targetTotalFrames} frames (${targetTotalSeconds}s)`);
    }
  }
  
  const sequenceId = `sequence-${Date.now()}`;
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="5">
  <project>
    <name>${safeTitle}</name>
    <children>
      <sequence id="${sequenceId}">
        <uuid>${crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`}</uuid>
        <name>${safeTitle}</name>
        <duration>${totalDurationFrames}</duration>
        <rate>
          <timebase>${fps}</timebase>
          <ntsc>FALSE</ntsc>
        </rate>
        <timecode>
          <rate>
            <timebase>${fps}</timebase>
            <ntsc>FALSE</ntsc>
          </rate>
          <string>00:00:00:00</string>
          <frame>0</frame>
          <displayformat>NDF</displayformat>
        </timecode>
        <in>-1</in>
        <out>-1</out>
        <media>
          <video>
            <format>
              <samplecharacteristics>
                <width>${width}</width>
                <height>${height}</height>
                <anamorphic>FALSE</anamorphic>
                <pixelaspectratio>square</pixelaspectratio>
                <fielddominance>none</fielddominance>
                <rate>
                  <timebase>${fps}</timebase>
                  <ntsc>FALSE</ntsc>
                </rate>
                <colordepth>24</colordepth>
              </samplecharacteristics>
            </format>
            <track>
`;

  let currentFrame = 0;
  
  processedScenes.forEach((scene, index) => {
    // Usar frames pré-calculados (com ajuste de última cena para sincronia exata)
    const durationFrames = sceneFrames[index];
    const fileName = `cena_${String(scene.number).padStart(3, '0')}.jpg`;
    const clipId = `clip-${scene.number}`;
    const fileId = `file-${scene.number}`;
    const masterId = `master-${scene.number}`;
    const shortText = scene.text ? escapeXml(scene.text.substring(0, 100)) : '';
    const motionInfo = scene.kenBurnsMotion ? ` [${KEN_BURNS_OPTIONS.find(o => o.id === scene.kenBurnsMotion?.type)?.name || scene.kenBurnsMotion.type}]` : '';
    
    xml += `              <clipitem id="${clipId}">
                <name>${fileName}</name>
                <duration>${durationFrames}</duration>
                <rate>
                  <timebase>${fps}</timebase>
                  <ntsc>FALSE</ntsc>
                </rate>
                <start>${currentFrame}</start>
                <end>${currentFrame + durationFrames}</end>
                <in>0</in>
                <out>${durationFrames}</out>
                <masterclipid>${masterId}</masterclipid>
                <file id="${fileId}">
                  <name>${fileName}</name>
                  <pathurl>file://./${fileName}</pathurl>
                  <rate>
                    <timebase>${fps}</timebase>
                    <ntsc>FALSE</ntsc>
                  </rate>
                  <duration>${durationFrames}</duration>
                  <media>
                    <video>
                      <samplecharacteristics>
                        <width>${width}</width>
                        <height>${height}</height>
                      </samplecharacteristics>
                    </video>
                  </media>
                </file>
`;
    
    // Adicionar transição de entrada (exceto para o primeiro clip)
    // Usar transição específica da cena se disponível, ou fallback para padrão
    const sceneTransition = sceneTransitions?.[index];
    const currentTransitionType = sceneTransition?.transitionType || defaultTransitionType;
    const currentTransitionDuration = sceneTransition?.transitionDuration || (defaultTransitionFrames / fps);
    const currentTransitionFrames = Math.round(currentTransitionDuration * fps);
    
    if (index > 0 && currentTransitionType !== 'none') {
      xml += getTransitionXml(currentTransitionType, currentTransitionFrames);
    }
    
    // Adicionar keyframes Ken Burns se disponível - com boost de intensidade para primeiras cenas
    if (enableKenBurns && scene.kenBurnsMotion) {
      xml += generateKenBurnsKeyframesXml(scene.kenBurnsMotion, durationFrames, fps, index);
    }
    
    // Incluir informação da transição no comentário
    const transitionInfo = sceneTransition && index > 0 
      ? ` [${TRANSITION_OPTIONS.find(o => o.id === sceneTransition.transitionType)?.namePt || sceneTransition.transitionType}]`
      : '';
    
    if (shortText) {
      xml += `                <comments>
                  <mastercomment1>${escapeXml(shortText + motionInfo + transitionInfo)}</mastercomment1>
                </comments>
`;
    }
    
    xml += `              </clipitem>
`;
    
    currentFrame += durationFrames;
  });

  xml += `            </track>
          </video>
        </media>
      </sequence>
    </children>
  </project>
</xmeml>`;

  return xml;
};

/**
 * Gera relatório de transições aplicadas por cena
 */
export const generateTransitionReport = (
  scenes: Array<{ text: string; durationSeconds: number; emotion?: string; retentionTrigger?: string }>,
  transitions: SceneTransition[]
): string => {
  let report = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    RELATÓRIO DE TRANSIÇÕES INTELIGENTES                        ║
║                          Análise Automática por IA                             ║
╚══════════════════════════════════════════════════════════════════════════════╝

📊 RESUMO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total de Cenas: ${scenes.length}
Total de Transições: ${transitions.filter((t, i) => i > 0 && t.transitionType !== 'none').length}
`;

  // Contagem por tipo de transição
  const transitionCounts: Record<string, number> = {};
  transitions.forEach((t, i) => {
    if (i > 0) { // Ignora primeira cena (sem transição de entrada)
      transitionCounts[t.transitionType] = (transitionCounts[t.transitionType] || 0) + 1;
    }
  });

  report += `\n📈 DISTRIBUIÇÃO DE TRANSIÇÕES:\n`;
  Object.entries(transitionCounts).forEach(([type, count]) => {
    const option = TRANSITION_OPTIONS.find(o => o.id === type);
    const percentage = ((count / (scenes.length - 1)) * 100).toFixed(1);
    report += `   ${option?.icon || '❓'} ${option?.namePt || type}: ${count} vezes (${percentage}%)\n`;
  });

  report += `
═══════════════════════════════════════════════════════════════════════════════
                              DETALHES POR CENA
═══════════════════════════════════════════════════════════════════════════════
`;

  scenes.forEach((scene, index) => {
    const transition = transitions[index];
    const option = TRANSITION_OPTIONS.find(o => o.id === transition?.transitionType);
    const textPreview = scene.text.substring(0, 50) + (scene.text.length > 50 ? '...' : '');
    
    report += `
┌─────────────────────────────────────────────────────────────────────────────┐
│ CENA ${String(index + 1).padStart(3, '0')} │ ${scene.durationSeconds.toFixed(1)}s │ ${option?.icon || '✂️'} ${option?.namePt || 'Corte'}
├─────────────────────────────────────────────────────────────────────────────┤
│ Texto: "${textPreview}"
│ Emoção: ${scene.emotion || 'Não definida'}
│ Gatilho: ${scene.retentionTrigger || 'Não definido'}
│ Transição: ${option?.namePt || transition?.transitionType || 'Corte'} (${transition?.transitionDuration || 0}s)
│ Razão IA: ${transition?.reason || 'Sem análise'}
└─────────────────────────────────────────────────────────────────────────────┘`;
  });

  report += `

═══════════════════════════════════════════════════════════════════════════════
                          COMO FUNCIONA A ANÁLISE
═══════════════════════════════════════════════════════════════════════════════

🧠 A IA analisa cada cena considerando:

   1. EMOÇÃO da cena (tristeza, alegria, medo, etc.)
   2. GATILHO DE RETENÇÃO (curiosidade, mistério, choque, etc.)
   3. CONTEXTO do texto (morte, nascimento, flashback, etc.)
   4. POSIÇÃO na timeline (primeiras cenas = ritmo rápido)
   5. CENA ANTERIOR (evitar repetição)

💡 TRANSIÇÕES RECOMENDADAS POR EMOÇÃO:
   • 😢 Tristeza/Morte → Fade to Black
   • 😱 Terror/Susto → Corte Seco
   • 💫 Sonho/Memória → Blur Dissolve
   • ⚡ Impacto/Choque → Dip to White
   • ❤️ Amor/Romance → Heart Shape
   • ⏰ Passagem de tempo → Clock Curtain
   • 🚪 Descoberta → Door Open
   • ✨ Revelação → Iris Circle
${BRAND_FOOTER}`;

  return report;
};

/**
 * Gera relatório de movimentos Ken Burns aplicados
 */
export const generateKenBurnsReport = (scenes: SceneForXml[]): string => {
  const processedScenes = applyKenBurnsToScenes(scenes);
  
  let report = `
╔══════════════════════════════════════════════════════════════════════════════╗
║                    RELATÓRIO DE MOVIMENTOS KEN BURNS                          ║
║                          Análise Automática por IA                            ║
╚══════════════════════════════════════════════════════════════════════════════╝

📊 RESUMO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total de Cenas: ${scenes.length}
`;

  // Contagem por tipo de movimento
  const motionCounts: Record<string, number> = {};
  processedScenes.forEach(scene => {
    const type = scene.kenBurnsMotion?.type || 'static';
    motionCounts[type] = (motionCounts[type] || 0) + 1;
  });

  report += `\n📈 DISTRIBUIÇÃO DE MOVIMENTOS:\n`;
  Object.entries(motionCounts).forEach(([type, count]) => {
    const option = KEN_BURNS_OPTIONS.find(o => o.id === type);
    const percentage = ((count / scenes.length) * 100).toFixed(1);
    report += `   ${option?.icon || '❓'} ${option?.name || type}: ${count} cenas (${percentage}%)\n`;
  });

  report += `
═══════════════════════════════════════════════════════════════════════════════
                              DETALHES POR CENA
═══════════════════════════════════════════════════════════════════════════════
`;

  processedScenes.forEach((scene, index) => {
    const motion = scene.kenBurnsMotion;
    const option = motion ? KEN_BURNS_OPTIONS.find(o => o.id === motion.type) : null;
    const textPreview = scene.text.substring(0, 60) + (scene.text.length > 60 ? '...' : '');
    
    report += `
┌─────────────────────────────────────────────────────────────────────────────┐
│ CENA ${String(scene.number).padStart(3, '0')} │ ${scene.durationSeconds.toFixed(1)}s │ ${option?.icon || '⏸️'} ${option?.name || 'Estático'}
├─────────────────────────────────────────────────────────────────────────────┤
│ Texto: "${textPreview}"
│ Intensidade: ${motion?.intensity || 'N/A'}
│ Razão: ${motion?.reason || 'Sem análise'}
└─────────────────────────────────────────────────────────────────────────────┘`;
  });

  report += `

═══════════════════════════════════════════════════════════════════════════════
                              DICAS DE APLICAÇÃO
═══════════════════════════════════════════════════════════════════════════════

💡 COMO AJUSTAR NO DAVINCI RESOLVE:
   1. Importe o XML que já contém os keyframes
   2. Na aba "Edit", selecione o clip
   3. Vá para "Inspector" → "Transform"
   4. Os keyframes já estarão aplicados automaticamente
   5. Use "Ease In/Out" para suavizar os movimentos

🎬 PARA MOVIMENTOS MAIS DRAMÁTICOS:
   1. Selecione o clip na timeline
   2. Abra "Keyframe Editor" (clique no ícone de diamante)
   3. Ajuste a curva de interpolação para "Bezier"
   4. Modifique os valores de Scale e Position

⚠️ NOTA: Os keyframes foram calculados para:
   - Zoom: 8% de variação (ajustável para mais intensidade)
   - Pan: 10% de deslocamento (ajustável conforme necessidade)
   - Intensidade varia por cena baseado na análise do texto
${BRAND_FOOTER}`;

  return report;
};

/**
 * Calcula a duração total do projeto
 */
export const calculateXmlDuration = (scenes: SceneForXml[]): number => {
  return scenes.reduce((total, scene) => total + scene.durationSeconds, 0);
};

/**
 * Gera tutorial de como usar o XML no DaVinci Resolve
 */
export const generateXmlTutorial = (
  scenes: SceneForXml[],
  projectTitle: string = 'MEU_PROJETO'
): string => {
  const totalScenes = scenes.length;
  const totalDuration = calculateXmlDuration(scenes);
  const minutes = Math.floor(totalDuration / 60);
  const seconds = Math.round(totalDuration % 60);

  // Lista de arquivos de mídia esperados - nomes EXATOS que devem ser usados
  const mediaFiles = scenes.map((scene, index) => {
    const fileName = `cena_${String(scene.number).padStart(3, '0')}.jpg`;
    return `   ${index + 1}. ${fileName}`;
  }).join('\n');

  return `
================================================================================
                    TUTORIAL: IMPORTAR XML NO DAVINCI RESOLVE
================================================================================

Projeto: ${projectTitle.toUpperCase()}
Total de Cenas: ${totalScenes}
Duração Estimada: ${minutes}m ${seconds}s

================================================================================
                              PASSO A PASSO
================================================================================

📁 PASSO 1: PREPARAR AS MÍDIAS
-------------------------------
Crie uma pasta no seu computador e coloque TODAS as imagens das cenas.

Arquivos necessários (na ordem):
${mediaFiles}

⚠️ IMPORTANTE: 
   - Os nomes dos arquivos DEVEM ser EXATAMENTE como listados acima!
   - Use underline (_) e não hífen (-)
   - Use 3 dígitos: cena_001.jpg, cena_002.jpg, etc.
   - Extensão .jpg (minúsculo)
   - Coloque o arquivo XML na MESMA PASTA das imagens!


📂 PASSO 2: IMPORTAR MÍDIAS NO DAVINCI RESOLVE
-----------------------------------------------
1. Abra o DaVinci Resolve
2. Crie um novo projeto ou abra um existente
3. Vá para a aba "Media" (canto inferior esquerdo)
4. Navegue até a pasta onde salvou as imagens
5. Selecione todas as mídias e arraste para o Media Pool


⚙️ PASSO 3: CONFIGURAR O PROJETO
----------------------------------
1. Clique em File → Project Settings (Shift+9)
2. Em "Master Settings", configure:
   - Timeline Resolution: 1920x1080 (ou sua preferência)
   - Timeline Frame Rate: 24 fps (mesmo FPS do XML)
   - Playback Frame Rate: 24 fps
3. Clique em "Save"


📥 PASSO 4: IMPORTAR O ARQUIVO XML
-----------------------------------
1. Vá para File → Import → Timeline...
2. Selecione o arquivo .xml que você baixou
3. Na janela "Load Settings":
   - Marque "Automatically import source clips into media pool"
   - Selecione "Link and import existing files"
4. Clique em "OK"

💡 DICA: Se o XML estiver na mesma pasta das imagens, o DaVinci
   reconecta automaticamente todas as mídias!


🔗 PASSO 5: RECONECTAR MÍDIAS (SE NECESSÁRIO)
----------------------------------------------
Se as mídias aparecerem offline (ícone vermelho):

1. Na timeline, selecione todos os clipes (Ctrl+A)
2. Clique com botão direito
3. Selecione "Relink Selected Clips..."
4. Navegue até a pasta onde estão suas mídias
5. Clique em "OK" - O DaVinci irá reconectar pelos nomes


✅ PASSO 6: VERIFICAR E AJUSTAR
--------------------------------
1. Verifique se todas as cenas estão na ordem correta
2. Cada imagem deve ter a duração correta conforme o roteiro
3. As transições Cross Dissolve já estão aplicadas


================================================================================
                              VANTAGENS DO XML
================================================================================

✓ Melhor reconexão de mídias que o EDL
✓ Preserva transições (Cross Dissolve)
✓ Inclui comentários/textos das cenas
✓ Compatível com DaVinci, Premiere, Final Cut
✓ Mantém metadados do projeto


================================================================================
                              DICAS EXTRAS
================================================================================

🎬 ADICIONAR NARRAÇÃO:
   - Importe seu arquivo de áudio para o Media Pool
   - Arraste para a track de áudio abaixo do vídeo
   - Use a sincronização de WPM definida no projeto

🎨 APLICAR EFEITO KEN BURNS:
   - Selecione um clipe na timeline
   - Vá para Inspector → Transform
   - Use keyframes em Position e Zoom para criar movimento

📝 ADICIONAR LEGENDAS:
   - Importe o arquivo .srt gerado
   - File → Import → Subtitle...
   - As legendas serão sincronizadas automaticamente

🎵 ADICIONAR TRILHA SONORA:
   - Importe a música para o Media Pool
   - Arraste para uma track de áudio separada
   - Ajuste o volume para não competir com a narração


================================================================================
                           RESOLUÇÃO DE PROBLEMAS
================================================================================

❌ "Media Offline":
   → Coloque o XML na mesma pasta das imagens
   → Use "Relink Clips" para reconectar manualmente

❌ "Wrong frame rate":
   → Ajuste o frame rate do projeto para 24fps
   → Reimporte o XML

❌ "Clips too short/long":
   → O XML define duração exata
   → Imagens são automaticamente estendidas para a duração definida

❌ "Import Failed":
   → Verifique se o XML não está corrompido
   → Tente importar via Media Pool arrastando o arquivo


================================================================================
                              EXPORTAÇÃO FINAL
================================================================================

Quando a edição estiver pronta:

1. Vá para a aba "Deliver"
2. Escolha um preset (YouTube, Vimeo, etc.) ou configure:
   - Format: MP4
   - Codec: H.264 ou H.265
   - Resolution: 1920x1080
   - Frame Rate: 24fps
3. Defina o local de saída
4. Clique em "Add to Render Queue"
5. Clique em "Render All"

${BRAND_FOOTER}`;
};
