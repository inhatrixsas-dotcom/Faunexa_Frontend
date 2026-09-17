// Integración con Google Analytics 4 (gtag.js).
// No hace nada si VITE_GA_MEASUREMENT_ID no está configurado (p. ej. en desarrollo local).

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

let initialized = false;

export const isAnalyticsEnabled = () => Boolean(MEASUREMENT_ID);

export const initGA = () => {
  if (!MEASUREMENT_ID || initialized) return;
  initialized = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };
  window.gtag('js', new Date());
  // send_page_view en false: las vistas de página se envían manualmente en cada
  // cambio de ruta (ver trackPageView), ya que es una SPA con react-router.
  window.gtag('config', MEASUREMENT_ID, { send_page_view: false });
};

export const trackPageView = (path: string, title?: string) => {
  if (!MEASUREMENT_ID || typeof window.gtag !== 'function') return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title,
    page_location: window.location.href,
  });
};

export const trackEvent = (action: string, params: Record<string, unknown> = {}) => {
  if (!MEASUREMENT_ID || typeof window.gtag !== 'function') return;
  window.gtag('event', action, params);
};
