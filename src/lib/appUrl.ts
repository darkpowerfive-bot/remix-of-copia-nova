/**
 * Returns the correct app base URL for internal links.
 * Always uses the app subdomain in production to prevent API calls on the wrong host.
 */
export const getAppBaseUrl = (): string => {
  // In development, use the current origin
  if (import.meta.env.DEV) {
    return window.location.origin;
  }

  // In production, always use the app subdomain
  const hostname = window.location.hostname;
  
  // If already on app subdomain, use current origin
  if (hostname.startsWith('app.')) {
    return window.location.origin;
  }
  
  // If on root/www domain, redirect to app subdomain
  if (hostname.includes('canaisdarks.com.br')) {
    return 'https://app.canaisdarks.com.br';
  }
  
  // Fallback to current origin for other environments (staging, preview, etc)
  return window.location.origin;
};

/**
 * Builds a full URL for app routes, ensuring correct domain usage.
 */
export const buildAppUrl = (path: string): string => {
  const base = getAppBaseUrl();
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${cleanPath}`;
};
