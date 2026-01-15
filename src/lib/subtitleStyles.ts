/**
 * Estilos de legendas para vídeos
 * Cada estilo define cores, fontes e posicionamento
 */
import { BRANDING_FOOTER } from "@/lib/utils";

export interface SubtitleStyle {
  id: string;
  name: string;
  description: string;
  preview: {
    bgColor: string;
    textColor: string;
    fontSize: string;
    fontWeight: string;
    borderRadius: string;
    padding: string;
    shadow?: string;
    border?: string;
    textShadow?: string;
    gradient?: string;
  };
  // Parâmetros para CapCut/DaVinci
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  bgColor?: string;
  bgOpacity?: number;
  position: 'bottom' | 'center' | 'top';
  animation?: 'none' | 'fade' | 'typewriter' | 'pop';
  // Comando ASS/SRT styling
  assStyle?: string;
}

export const SUBTITLE_STYLES: SubtitleStyle[] = [
  {
    id: 'clean-white',
    name: 'Clean White',
    description: 'Texto branco simples com sombra suave',
    preview: {
      bgColor: 'transparent',
      textColor: '#FFFFFF',
      fontSize: 'text-lg',
      fontWeight: 'font-semibold',
      borderRadius: 'rounded-none',
      padding: 'p-2',
      textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
    },
    fontFamily: 'Arial',
    fontSize: 48,
    fontColor: '#FFFFFF',
    position: 'bottom',
    animation: 'none',
    assStyle: 'Style: Default,Arial,48,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,-1,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1'
  },
  {
    id: 'yellow-bold',
    name: 'Amarelo Bold',
    description: 'Texto amarelo impactante estilo YouTube',
    preview: {
      bgColor: 'transparent',
      textColor: '#FFD700',
      fontSize: 'text-xl',
      fontWeight: 'font-bold',
      borderRadius: 'rounded-none',
      padding: 'p-2',
      textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000',
    },
    fontFamily: 'Arial Black',
    fontSize: 52,
    fontColor: '#FFD700',
    position: 'bottom',
    animation: 'pop',
    assStyle: 'Style: Default,Arial Black,52,&H0000D7FF,&H000000FF,&H00000000,&HFF000000,-1,0,0,0,100,100,0,0,1,4,0,2,10,10,10,1'
  },
  {
    id: 'netflix-style',
    name: 'Netflix Style',
    description: 'Fundo escuro translúcido estilo streaming',
    preview: {
      bgColor: 'rgba(0,0,0,0.75)',
      textColor: '#FFFFFF',
      fontSize: 'text-base',
      fontWeight: 'font-medium',
      borderRadius: 'rounded',
      padding: 'px-4 py-2',
    },
    fontFamily: 'Netflix Sans',
    fontSize: 44,
    fontColor: '#FFFFFF',
    bgColor: '#000000',
    bgOpacity: 0.75,
    position: 'bottom',
    animation: 'fade',
  },
  {
    id: 'tiktok-viral',
    name: 'TikTok Viral',
    description: 'Texto centralizado grande com contorno',
    preview: {
      bgColor: 'transparent',
      textColor: '#FFFFFF',
      fontSize: 'text-2xl',
      fontWeight: 'font-black',
      borderRadius: 'rounded-none',
      padding: 'p-2',
      textShadow: '3px 3px 0 #FF0050, -3px -3px 0 #00F2EA, 3px -3px 0 #FF0050, -3px 3px 0 #00F2EA',
    },
    fontFamily: 'Montserrat',
    fontSize: 64,
    fontColor: '#FFFFFF',
    position: 'center',
    animation: 'pop',
  },
  {
    id: 'minimal-box',
    name: 'Minimal Box',
    description: 'Caixa branca minimalista',
    preview: {
      bgColor: '#FFFFFF',
      textColor: '#000000',
      fontSize: 'text-base',
      fontWeight: 'font-medium',
      borderRadius: 'rounded-sm',
      padding: 'px-3 py-1',
    },
    fontFamily: 'Helvetica',
    fontSize: 42,
    fontColor: '#000000',
    bgColor: '#FFFFFF',
    bgOpacity: 0.95,
    position: 'bottom',
    animation: 'fade',
  },
  {
    id: 'news-ticker',
    name: 'News Ticker',
    description: 'Estilo noticiário com barra colorida',
    preview: {
      bgColor: '#DC2626',
      textColor: '#FFFFFF',
      fontSize: 'text-base',
      fontWeight: 'font-bold',
      borderRadius: 'rounded-none',
      padding: 'px-4 py-2',
    },
    fontFamily: 'Roboto Condensed',
    fontSize: 46,
    fontColor: '#FFFFFF',
    bgColor: '#DC2626',
    bgOpacity: 0.95,
    position: 'bottom',
    animation: 'typewriter',
  },
  {
    id: 'gradient-glow',
    name: 'Gradient Glow',
    description: 'Texto com brilho gradiente colorido',
    preview: {
      bgColor: 'transparent',
      textColor: '#FF6B6B',
      fontSize: 'text-xl',
      fontWeight: 'font-bold',
      borderRadius: 'rounded-none',
      padding: 'p-2',
      textShadow: '0 0 10px #FF6B6B, 0 0 20px #4ECDC4, 0 0 30px #FF6B6B',
      gradient: 'linear-gradient(90deg, #FF6B6B, #4ECDC4)',
    },
    fontFamily: 'Poppins',
    fontSize: 54,
    fontColor: '#FF6B6B',
    position: 'center',
    animation: 'fade',
  },
  {
    id: 'outline-only',
    name: 'Outline Only',
    description: 'Apenas contorno sem preenchimento',
    preview: {
      bgColor: 'transparent',
      textColor: 'transparent',
      fontSize: 'text-xl',
      fontWeight: 'font-bold',
      borderRadius: 'rounded-none',
      padding: 'p-2',
      textShadow: 'none',
      border: '2px solid white',
    },
    fontFamily: 'Impact',
    fontSize: 58,
    fontColor: '#FFFFFF',
    position: 'center',
    animation: 'none',
  }
];

export const SUBTITLE_POSITIONS = [
  { value: 'bottom', label: 'Inferior', description: 'Posição clássica de legendas' },
  { value: 'center', label: 'Central', description: 'Destaque no meio da tela' },
  { value: 'top', label: 'Superior', description: 'Acima do conteúdo' },
];

export const SUBTITLE_ANIMATIONS = [
  { value: 'none', label: 'Sem Animação', description: 'Aparece instantaneamente' },
  { value: 'fade', label: 'Fade In/Out', description: 'Transição suave' },
  { value: 'typewriter', label: 'Máquina de Escrever', description: 'Uma letra por vez' },
  { value: 'pop', label: 'Pop', description: 'Efeito de zoom rápido' },
];

/**
 * Gera instruções de estilo de legenda para o README
 */
export const generateSubtitleInstructions = (style: SubtitleStyle): string => {
  const instructions = [
    `ESTILO DE LEGENDA: ${style.name}`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `Fonte: ${style.fontFamily}`,
    `Tamanho: ${style.fontSize}px`,
    `Cor do texto: ${style.fontColor}`,
    style.bgColor ? `Cor de fundo: ${style.bgColor} (${Math.round((style.bgOpacity || 1) * 100)}% opacidade)` : `Sem fundo`,
    `Posição: ${style.position === 'bottom' ? 'Inferior' : style.position === 'center' ? 'Central' : 'Superior'}`,
    `Animação: ${style.animation || 'Nenhuma'}`,
    ``,
    `COMO APLICAR NO CAPCUT:`,
    `1. Importe o arquivo NARRACOES.srt`,
    `2. Selecione todas as legendas (Ctrl+A)`,
    `3. Altere a fonte para: ${style.fontFamily}`,
    `4. Ajuste o tamanho para: ${style.fontSize}px`,
    `5. Defina a cor: ${style.fontColor}`,
    style.bgColor ? `6. Adicione fundo com cor ${style.bgColor}` : ``,
    ``,
    BRANDING_FOOTER.trim(),
  ].filter(Boolean);

  return instructions.join('\n');
};
