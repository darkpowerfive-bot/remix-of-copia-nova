/**
 * Gerador de EDL (Edit Decision List) para DaVinci Resolve
 * Formato CMX 3600 compatível com DaVinci Resolve 16+
 */

// Branding global para todos os documentos
const BRAND_FOOTER = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏠 La Casa Dark Core®
   A infraestrutura por trás de canais dark profissionais
   A revolução chegou. Não há espaço para amadores.

🌐 www.canaisdarks.com.br
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

interface SceneForEdl {
  number: number;
  text: string;
  durationSeconds: number;
  imagePath?: string;
}

/**
 * Formata segundos para formato timecode (HH:MM:SS:FF)
 * Assume 24fps para compatibilidade máxima
 */
const formatEdlTimecode = (seconds: number, fps: number = 24): string => {
  const totalFrames = Math.floor(seconds * fps);
  const h = Math.floor(totalFrames / (fps * 3600));
  const m = Math.floor((totalFrames % (fps * 3600)) / (fps * 60));
  const s = Math.floor((totalFrames % (fps * 60)) / fps);
  const f = totalFrames % fps;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`;
};

/**
 * Gera conteúdo EDL no formato CMX 3600
 * Compatível com DaVinci Resolve, Premiere Pro, Final Cut Pro
 */
export const generateEdl = (
  scenes: SceneForEdl[],
  options: {
    title?: string;
    fps?: number;
    dropFrame?: boolean;
  } = {}
): string => {
  const title = options.title || 'PROJETO_VIDEO';
  const fps = options.fps || 24;
  const dropFrame = options.dropFrame ?? false;
  
  // Header do EDL
  let edl = `TITLE: ${title.toUpperCase().replace(/\s+/g, '_')}\n`;
  edl += `FCM: ${dropFrame ? 'DROP FRAME' : 'NON-DROP FRAME'}\n\n`;
  
  let currentTimeSeconds = 0;
  
  scenes.forEach((scene, index) => {
    const editNumber = String(index + 1).padStart(3, '0');
    
    // Source IN/OUT
    // Para imagens (stills) no DaVinci, o "extents" do clip no Media Pool costuma ser 1 frame.
    // Se colocarmos SOURCE_OUT com a duração inteira da cena, o Resolve falha o link com:
    // "timecode extents do not match".
    // Por isso, mantemos o source com 1 frame e deixamos a duração real no RECORD IN/OUT.
    const sourceIn = formatEdlTimecode(0, fps);
    const sourceOut = formatEdlTimecode(1 / fps, fps);
    
    // Record IN/OUT (posição na timeline)
    const recordIn = formatEdlTimecode(currentTimeSeconds, fps);
    const recordOut = formatEdlTimecode(currentTimeSeconds + scene.durationSeconds, fps);
    
    // Nome do arquivo - DEVE corresponder EXATAMENTE ao nome do arquivo real
    // DaVinci usa este nome para reconectar as mídias
    const fileName = `cena_${String(scene.number).padStart(3, '0')}.jpg`;
    
    // Para o reel, usamos um identificador curto (máx 8 chars) mas padronizado
    const reelName = `CENA${String(scene.number).padStart(3, '0')}`;
    
    // Linha principal do EDL
    // Formato: EDIT# REEL TRACK TRANS SOURCE_IN SOURCE_OUT REC_IN REC_OUT
    edl += `${editNumber}  ${reelName.padEnd(8, ' ')} V     C        ${sourceIn} ${sourceOut} ${recordIn} ${recordOut}\n`;
    
    // FROM CLIP NAME - Este é o campo que o DaVinci usa para reconectar mídias!
    edl += `* FROM CLIP NAME: ${fileName}\n`;
    
    // Comentário com texto da cena (opcional, para referência)
    if (scene.text) {
      const shortText = scene.text.length > 60 ? scene.text.substring(0, 57) + '...' : scene.text;
      edl += `* COMMENT: ${shortText.replace(/\n/g, ' ')}\n`;
    }
    
    edl += '\n';
    
    currentTimeSeconds += scene.durationSeconds;
  });
  
  return edl;
};

/**
 * Gera EDL com transições de dissolve entre cenas
 */
export const generateEdlWithTransitions = (
  scenes: SceneForEdl[],
  options: {
    title?: string;
    fps?: number;
    transitionFrames?: number; // Duração da transição em frames
  } = {}
): string => {
  const title = options.title || 'PROJETO_VIDEO';
  const fps = options.fps || 24;
  const transitionFrames = options.transitionFrames || 12; // 0.5s em 24fps
  const transitionSeconds = transitionFrames / fps;
  
  // Header do EDL
  let edl = `TITLE: ${title.toUpperCase().replace(/\s+/g, '_')}\n`;
  edl += `FCM: NON-DROP FRAME\n\n`;
  
  let currentTimeSeconds = 0;
  
  scenes.forEach((scene, index) => {
    const editNumber = String(index + 1).padStart(3, '0');
    
    // Source timecodes
    // Mesmo motivo do generateEdl(): para stills, mantenha 1 frame no source e use RECORD para a duração.
    const sourceIn = formatEdlTimecode(0, fps);
    const sourceOut = formatEdlTimecode(1 / fps, fps);
    
    // Record timecodes
    const recordIn = formatEdlTimecode(currentTimeSeconds, fps);
    const recordOut = formatEdlTimecode(currentTimeSeconds + scene.durationSeconds, fps);
    
    // Nome do arquivo padronizado
    const fileName = `cena_${String(scene.number).padStart(3, '0')}.jpg`;
    const reelName = `CENA${String(scene.number).padStart(3, '0')}`;
    
    // Tipo de transição: C = Cut, D = Dissolve
    const transType = index === 0 ? 'C' : `D    ${String(transitionFrames).padStart(3, '0')}`;
    
    edl += `${editNumber}  ${reelName.padEnd(8, ' ')} V     ${transType.padEnd(9, ' ')} ${sourceIn} ${sourceOut} ${recordIn} ${recordOut}\n`;
    
    // FROM CLIP NAME - Campo usado para reconectar mídias
    edl += `* FROM CLIP NAME: ${fileName}\n`;
    
    edl += '\n';
    
    currentTimeSeconds += scene.durationSeconds;
  });
  
  return edl;
};

/**
 * Calcula a duração total do EDL
 */
export const calculateEdlDuration = (scenes: SceneForEdl[]): number => {
  return scenes.reduce((total, scene) => total + scene.durationSeconds, 0);
};

/**
 * Gera tutorial de como usar o EDL no DaVinci Resolve
 */
export const generateEdlTutorial = (
  scenes: SceneForEdl[],
  projectTitle: string = 'MEU_PROJETO'
): string => {
  const totalScenes = scenes.length;
  const totalDuration = calculateEdlDuration(scenes);
  const minutes = Math.floor(totalDuration / 60);
  const seconds = Math.round(totalDuration % 60);

  // Lista de arquivos de mídia esperados - nomes EXATOS que devem ser usados
  const mediaFiles = scenes.map((scene, index) => {
    const fileName = `cena_${String(scene.number).padStart(3, '0')}.jpg`;
    return `   ${index + 1}. ${fileName}`;
  }).join('\n');

  return `
================================================================================
                    TUTORIAL: IMPORTAR EDL NO DAVINCI RESOLVE
================================================================================

Projeto: ${projectTitle.toUpperCase()}
Total de Cenas: ${totalScenes}
Duração Estimada: ${minutes}m ${seconds}s

================================================================================
                              PASSO A PASSO
================================================================================

📁 PASSO 1: PREPARAR AS MÍDIAS
-------------------------------
Crie uma pasta no seu computador e coloque TODAS as imagens/vídeos das cenas.

Arquivos necessários (na ordem):
${mediaFiles}

⚠️ IMPORTANTE: 
   - Os nomes dos arquivos DEVEM ser EXATAMENTE como listados acima!
   - Use underline (_) e não hífen (-)
   - Use 3 dígitos: cena_001.jpg, cena_002.jpg, etc.
   - Extensão .jpg (minúsculo)


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
   - Timeline Frame Rate: 24 fps (mesmo FPS do EDL)
   - Playback Frame Rate: 24 fps
3. Clique em "Save"


📥 PASSO 4: IMPORTAR O ARQUIVO EDL
-----------------------------------
1. Vá para File → Import → Timeline...
2. Selecione o arquivo .edl que você baixou
3. Na janela que aparecer:
   - Marque "Automatically import source clips into media pool"
   - Escolha "Use sizing information" se disponível
4. Clique em "OK"


🔗 PASSO 5: RECONECTAR MÍDIAS (SE NECESSÁRIO)
----------------------------------------------
Se as mídias aparecerem offline (ícone vermelho):

1. Na timeline, clique com botão direito em um clipe offline
2. Selecione "Relink Selected Clips..."
3. Navegue até a pasta onde estão suas mídias
4. O DaVinci irá reconectar automaticamente pelos nomes dos arquivos


✅ PASSO 6: VERIFICAR E AJUSTAR
--------------------------------
1. Verifique se todas as cenas estão na ordem correta
2. Cada imagem deve ter a duração correta conforme o roteiro
3. Ajuste transições se necessário (as dissolves já estão configuradas)


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

❌ "Clips not found":
   → Verifique se os nomes dos arquivos estão corretos
   → Use "Relink Clips" para reconectar manualmente

❌ "Wrong frame rate":
   → Ajuste o frame rate do projeto para 24fps
   → Reimporte o EDL

❌ "Clips too short/long":
   → O EDL define duração exata - ajuste as mídias se necessário
   → Imagens são automaticamente estendidas para a duração definida

❌ "Black frames":
   → Algumas mídias podem estar faltando
   → Verifique se todas as imagens foram importadas


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
