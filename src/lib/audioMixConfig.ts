/**
 * Configurações de mixagem de áudio para produção de vídeo
 */
import { BRANDING_FOOTER } from "@/lib/utils";

export interface AudioTrack {
  type: 'narration' | 'intro' | 'background' | 'sfx' | 'outro';
  label: string;
  description: string;
  defaultVolume: number; // 0-100
  fadeIn?: number; // segundos
  fadeOut?: number; // segundos
  ducking?: boolean; // reduz volume quando narração toca
  duckingLevel?: number; // 0-100, volume durante ducking
}

export const AUDIO_TRACKS: AudioTrack[] = [
  {
    type: 'narration',
    label: 'Narração',
    description: 'Áudio principal da voz (voice-over)',
    defaultVolume: 100,
    fadeIn: 0,
    fadeOut: 0.5,
  },
  {
    type: 'intro',
    label: 'Música de Intro',
    description: 'Música de abertura (primeiros segundos)',
    defaultVolume: 80,
    fadeIn: 0,
    fadeOut: 2,
    ducking: true,
    duckingLevel: 30,
  },
  {
    type: 'background',
    label: 'Música de Fundo',
    description: 'Background music durante o vídeo',
    defaultVolume: 25,
    fadeIn: 2,
    fadeOut: 3,
    ducking: true,
    duckingLevel: 15,
  },
  {
    type: 'outro',
    label: 'Música de Encerramento',
    description: 'Música final após a narração',
    defaultVolume: 70,
    fadeIn: 1,
    fadeOut: 3,
    ducking: false,
  },
  {
    type: 'sfx',
    label: 'Efeitos Sonoros',
    description: 'SFX, transições, swooshes',
    defaultVolume: 60,
    fadeIn: 0,
    fadeOut: 0,
    ducking: false,
  },
];

export interface AudioMixSettings {
  narrationVolume: number;
  introVolume: number;
  introDuration: number; // segundos antes de fade out
  backgroundVolume: number;
  backgroundDucking: boolean;
  backgroundDuckingLevel: number;
  outroVolume: number;
  sfxVolume: number;
}

export const DEFAULT_AUDIO_MIX: AudioMixSettings = {
  narrationVolume: 100,
  introVolume: 80,
  introDuration: 5,
  backgroundVolume: 25,
  backgroundDucking: true,
  backgroundDuckingLevel: 15,
  outroVolume: 70,
  sfxVolume: 60,
};

/**
 * Gera comando FFmpeg para mixagem de áudio
 */
export const generateFFmpegAudioCommand = (settings: AudioMixSettings, totalDuration: number): string => {
  const narrationVol = settings.narrationVolume / 100;
  const introVol = settings.introVolume / 100;
  const bgVol = settings.backgroundVolume / 100;
  const bgDuckVol = settings.backgroundDuckingLevel / 100;
  const outroVol = settings.outroVolume / 100;
  const sfxVol = settings.sfxVolume / 100;

  // Filtro complexo para mixagem com ducking
  const filterComplex = `
[1:a]volume=${narrationVol}[narration];
[2:a]volume=${introVol},afade=t=out:st=${settings.introDuration}:d=2[intro];
[3:a]volume=${bgVol}${settings.backgroundDucking ? `,sidechaincompress=threshold=0.02:ratio=4:attack=0.001:release=0.5` : ''}[background];
[4:a]volume=${outroVol},afade=t=in:st=0:d=1[outro];
[intro][background]amix=inputs=2:duration=longest[music];
[music][narration]amerge=inputs=2[mixed];
[mixed][outro]amix=inputs=2:duration=first[final]
`;

  return filterComplex.trim();
};

/**
 * Gera estrutura de pastas para áudio no ZIP
 */
export const generateAudioFolderStructure = (): { path: string; readme: string }[] => {
  return [
    {
      path: 'Audio/Narracao/',
      readme: `PASTA: NARRAÇÃO
════════════════════════════════════════
Coloque aqui o áudio da sua narração/voice-over.

📌 FORMATOS ACEITOS: MP3, WAV, M4A, AAC

📌 DICA: Exporte do CapCut ou ElevenLabs em MP3 320kbps

📌 ARQUIVO ESPERADO: narracao.mp3 (ou .wav)`
    },
    {
      path: 'Audio/Intro/',
      readme: `PASTA: MÚSICA DE INTRO
════════════════════════════════════════
Música de abertura do vídeo.

📌 Toca nos primeiros segundos
📌 Faz fade out quando a narração começa
📌 Volume sugerido: 80%

📌 ARQUIVO ESPERADO: intro.mp3`
    },
    {
      path: 'Audio/Background/',
      readme: `PASTA: MÚSICA DE FUNDO
════════════════════════════════════════
Background music que toca durante todo o vídeo.

📌 Volume sugerido: 20-30% (não competir com narração)
📌 Ativa "ducking" para reduzir quando há voz
📌 Escolha músicas sem vocal para não conflitar

📌 ARQUIVO ESPERADO: background.mp3

💡 DICAS:
- Use músicas de bibliotecas livres (Epidemic Sound, Artlist)
- Prefira loops ou músicas longas
- Evite mudanças bruscas de ritmo`
    },
    {
      path: 'Audio/Outro/',
      readme: `PASTA: MÚSICA DE ENCERRAMENTO
════════════════════════════════════════
Música que toca após o fim da narração.

📌 Começa quando a narração termina
📌 Faz fade out no final do vídeo
📌 Volume sugerido: 70%

📌 ARQUIVO ESPERADO: outro.mp3

💡 Use para call-to-action, créditos ou encerramento`
    },
    {
      path: 'Audio/SFX/',
      readme: `PASTA: EFEITOS SONOROS
════════════════════════════════════════
Efeitos especiais, transições e swooshes.

📌 Coloque todos os SFX que quiser usar
📌 Nomeie de forma descritiva: swoosh.mp3, ding.mp3, etc.
📌 Volume sugerido: 50-70%

💡 EXEMPLOS:
- Transições: whoosh, swoosh, slide
- Notificações: ding, pop, click
- Impacto: boom, hit, slam`
    },
  ];
};

/**
 * Gera README completo de mixagem de áudio
 */
export const generateAudioMixReadme = (settings: AudioMixSettings): string => {
  return `
╔═══════════════════════════════════════════════════════════════════════════╗
║                    🎵 GUIA DE MIXAGEM DE ÁUDIO                           ║
╚═══════════════════════════════════════════════════════════════════════════╝

Este pacote inclui pastas para organizar seu áudio profissionalmente.

═══════════════════════════════════════════════════════════════════════════
                         📁 ESTRUTURA DE PASTAS
═══════════════════════════════════════════════════════════════════════════

Audio/
├── Narracao/         → Coloque sua narração/voice-over aqui
├── Intro/            → Música de abertura (opcional)
├── Background/       → Música de fundo (opcional)
├── Outro/            → Música de encerramento (opcional)
└── SFX/              → Efeitos sonoros (opcional)


═══════════════════════════════════════════════════════════════════════════
                         🎚️ VOLUMES RECOMENDADOS
═══════════════════════════════════════════════════════════════════════════

   FAIXA DE ÁUDIO      │  VOLUME   │  OBSERVAÇÃO
  ─────────────────────┼───────────┼─────────────────────────────────────
   Narração            │   100%    │  Sempre prioridade máxima
   Música de Intro     │   ${String(settings.introVolume).padStart(3)}%    │  Fade out em ${settings.introDuration}s
   Música de Fundo     │   ${String(settings.backgroundVolume).padStart(3)}%    │  ${settings.backgroundDucking ? `Ducking: reduz para ${settings.backgroundDuckingLevel}% durante voz` : 'Sem ducking'}
   Música de Outro     │   ${String(settings.outroVolume).padStart(3)}%    │  Toca após narração terminar
   Efeitos Sonoros     │   ${String(settings.sfxVolume).padStart(3)}%    │  Ajuste conforme necessidade


═══════════════════════════════════════════════════════════════════════════
                         💡 O QUE É DUCKING?
═══════════════════════════════════════════════════════════════════════════

Ducking é quando a música de fundo AUTOMATICAMENTE abaixa o volume
quando detecta voz (narração), e volta ao normal quando não há voz.

Isso evita que a música "briga" com a narração e garante clareza.

No CapCut: Ative "Auto Ducking" nas configurações de áudio
No DaVinci: Use o Fairlight para criar um sidechain compressor


═══════════════════════════════════════════════════════════════════════════
                         🎬 COMO MONTAR NO CAPCUT
═══════════════════════════════════════════════════════════════════════════

1. IMPORTAR ÁUDIOS
   - Clique em "Importar" e selecione todos os arquivos de Audio/
   
2. ADICIONAR NA TIMELINE
   - Arraste a NARRAÇÃO para a faixa de áudio principal
   - Adicione a INTRO no início (antes da narração ou sobrepondo levemente)
   - Adicione o BACKGROUND em uma faixa separada, ao longo de todo o vídeo
   - Adicione o OUTRO após o fim da narração
   
3. AJUSTAR VOLUMES
   - Clique em cada faixa de áudio
   - Ajuste o volume conforme a tabela acima
   
4. ATIVAR DUCKING (Música de Fundo)
   - Selecione a faixa de background
   - Vá em "Ajuste de Volume" > "Auto Ducking" > Ativar
   
5. ADICIONAR FADE IN/OUT
   - Arraste as bordas do áudio para criar fades suaves


═══════════════════════════════════════════════════════════════════════════
                         🎬 COMO MONTAR NO DAVINCI RESOLVE
═══════════════════════════════════════════════════════════════════════════

1. Importe os áudios na Media Pool
2. Arraste para a timeline na página Edit
3. Vá para a página Fairlight para mixagem profissional
4. Ajuste os faders de cada track
5. Para ducking: adicione um Compressor com Sidechain na música de fundo


═══════════════════════════════════════════════════════════════════════════
                         🖥️ COMANDO FFMPEG AVANÇADO
═══════════════════════════════════════════════════════════════════════════

Para gerar o vídeo com áudio mixado via FFmpeg, use:

ffmpeg -i video_base.mp4 \\
  -i "Audio/Narracao/narracao.mp3" \\
  -i "Audio/Intro/intro.mp3" \\
  -i "Audio/Background/background.mp3" \\
  -i "Audio/Outro/outro.mp3" \\
  -filter_complex "
    [1:a]volume=1.0[narration];
    [2:a]volume=0.8,afade=t=out:st=5:d=2[intro];
    [3:a]volume=0.25[background];
    [4:a]volume=0.7,afade=t=in:st=0:d=1[outro];
    [intro][background]amix=inputs=2:duration=longest[music];
    [music][narration]amerge=inputs=2[mixed];
    [mixed][outro]amix=inputs=2:duration=first[final]
  " \\
  -map 0:v -map "[final]" \\
  -c:v copy -c:a aac -b:a 192k \\
  video_final.mp4


═══════════════════════════════════════════════════════════════════════════
                         ❓ DICAS FINAIS
═══════════════════════════════════════════════════════════════════════════

✅ A narração SEMPRE deve ser o som mais alto e claro
✅ Música de fundo muito alta compete com a voz - mantenha baixa
✅ Use fade in/out para transições suaves
✅ Teste em fones de ouvido E em caixas de som
✅ Exporte em MP3 320kbps ou WAV para melhor qualidade
${BRANDING_FOOTER}
`.trim();
};
