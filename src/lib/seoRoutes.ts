/**
 * Centralized SEO route configuration for sitemap generation
 * This file is the single source of truth for all public routes
 */

export interface SEORoute {
  path: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  lastmod?: string;
}

// Base URL for the site
export const BASE_URL = 'https://canaisdarks.com.br';

// Current date for lastmod - Fixed to ensure consistency
const today = '2026-01-11';

/**
 * Public routes that should be indexed by search engines
 * These are accessible without authentication
 */
export const publicRoutes: SEORoute[] = [
  {
    path: '/',
    changefreq: 'weekly',
    priority: 1.0,
    lastmod: today,
  },
  // /landing é a mesma página que / - não incluir para evitar duplicação
  // /auth tem noindex, não incluir no sitemap
  {
    path: '/blog',
    changefreq: 'daily',
    priority: 0.9,
    lastmod: today,
  },
  { path: '/blog/como-usar-ia-para-criar-videos-virais-no-youtube', changefreq: 'monthly', priority: 0.8, lastmod: today },
  { path: '/blog/como-ganhar-dinheiro-youtube', changefreq: 'monthly', priority: 0.8, lastmod: today },
  { path: '/blog/nichos-lucrativos-youtube', changefreq: 'monthly', priority: 0.8, lastmod: today },
  { path: '/blog/como-criar-canal-dark', changefreq: 'monthly', priority: 0.8, lastmod: today },
  { path: '/blog/shorts-virais', changefreq: 'monthly', priority: 0.8, lastmod: today },
  { path: '/blog/roteiros-virais-ia', changefreq: 'monthly', priority: 0.8, lastmod: today },
  { path: '/blog/thumbnails-profissionais', changefreq: 'monthly', priority: 0.8, lastmod: today },
  { path: '/blog/seo-youtube', changefreq: 'monthly', priority: 0.8, lastmod: today },
  { path: '/blog/algoritmo-youtube', changefreq: 'monthly', priority: 0.8, lastmod: today },
  { path: '/blog/ferramentas-criacao-videos', changefreq: 'monthly', priority: 0.8, lastmod: today },
  { path: '/blog/monetizacao-afiliados', changefreq: 'monthly', priority: 0.8, lastmod: today },
  { path: '/blog/crescimento-rapido', changefreq: 'monthly', priority: 0.8, lastmod: today },
  // /reset-password tem noindex, não incluir no sitemap
  {
    path: '/termos-de-uso',
    changefreq: 'yearly',
    priority: 0.4,
    lastmod: today,
  },
  {
    path: '/politica-de-privacidade',
    changefreq: 'yearly',
    priority: 0.4,
    lastmod: today,
  },
];

/**
 * Protected routes that should NOT be indexed
 * Listed here for reference and robots.txt generation
 */
export const protectedRoutes: string[] = [
  '/dashboard',
  '/analyzer',
  '/history',
  '/explore',
  '/folders',
  '/channels',
  '/analytics',
  '/library',
  '/agents',
  '/prompts',
  '/voice',
  '/video-gen',
  '/youtube',
  '/search-channels',
  '/channel-analyzer',
  '/srt',
  '/settings',
  '/admin',
  '/scenes',
  '/plans',
  '/payment-success',
  '/pending-approval',
];

/**
 * Generate XML sitemap string from routes
 */
export const generateSitemapXML = (routes: SEORoute[], baseUrl: string): string => {
  const urlEntries = routes
    .map(
      (route) => `  <url>
    <loc>${baseUrl}${route.path}</loc>
    <lastmod>${route.lastmod || today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority.toFixed(1)}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
};
