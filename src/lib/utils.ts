import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Branding footer for all downloadable TXT files
export const BRANDING_FOOTER = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏠 La Casa Dark Core®
   A infraestrutura por trás de canais dark profissionais
   A revolução chegou. Não há espaço para amadores.

🌐 www.canaisdarks.com.br
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

// Helper to add branding footer to any content
export function addBrandingFooter(content: string): string {
  return content + BRANDING_FOOTER;
}
