/**
 * User Acquisition Context Service
 * Centralizado para capturar y manejar datos de adquisición de usuarios
 * Integrado con Supabase Auth para first-touch attribution
 * 
 * Acepta CUALQUIER valor para UTM, pero los limpia y normaliza:
 * - Espacios en blanco removidos
 * - Convertido a lowercase
 * - Null si está vacío
 * 
 * EJEMPLOS DE VALORES VÁLIDOS:
 * 
 * utm_source: youtube, instagram, whatsapp, google, facebook, tiktok, linkedin, etc.
 * utm_medium: video, bio, post, story, share, email, paid, organic, etc.
 * utm_campaign: curso_archicad, plan_fundadores, lanzamiento_2025, etc.
 * utm_content: video_40min, link_bio, story_1, mensaje_directo, etc.
 * 
 * EJEMPLOS DE URLs:
 * https://seencel.com/register?utm_source=youtube&utm_medium=video&utm_campaign=lanzamiento_2025&utm_content=video_40min
 * https://seencel.com/register?utm_source=instagram&utm_medium=story&utm_campaign=plan_fundadores&utm_content=story_1
 * https://seencel.com/register?utm_source=facebook&utm_medium=ads&utm_campaign=black_friday
 * https://seencel.com/register?utm_source=whatsapp&utm_medium=share
 */

export interface AcquisitionContext {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  landing_page: string;
  referrer: string | null;
  captured_at: number; // timestamp
}

const STORAGE_KEY = 'seencel_user_acquisition';

/**
 * Limpia y normaliza un valor UTM
 * - Remueve espacios en blanco
 * - Convierte a lowercase
 * - Retorna null si está vacío
 */
function cleanUtmValue(value: string | null): string | null {
  if (!value) return null;
  const cleaned = value.trim().toLowerCase();
  return cleaned.length > 0 ? cleaned : null;
}

/**
 * Captura datos de adquisición desde URL y contexto del navegador
 * Se ejecuta una sola vez al cargar la aplicación (first-touch)
 * Acepta CUALQUIER valor pero lo limpia y normaliza
 */
export function captureAcquisitionContext(): AcquisitionContext {
  // Si ya existe en localStorage, retorna sin sobrescribir (first-touch attribution)
  const existing = getAcquisitionContext();
  if (existing) {
    return existing;
  }

  // Leer parámetros UTM desde URL
  const params = new URLSearchParams(window.location.search);
  const utm_source = cleanUtmValue(params.get('utm_source'));
  const utm_medium = cleanUtmValue(params.get('utm_medium'));
  const utm_campaign = cleanUtmValue(params.get('utm_campaign'));
  const utm_content = cleanUtmValue(params.get('utm_content'));

  // Leer landing_page y referrer
  const landing_page = window.location.pathname;
  const referrer = document.referrer || null;

  const context: AcquisitionContext = {
    utm_source,
    utm_medium,
    utm_campaign,
    utm_content,
    landing_page,
    referrer,
    captured_at: Date.now(),
  };

  // Guardar en localStorage (persistente, no sessionStorage)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(context));
  return context;
}

/**
 * Obtiene el contexto de adquisición desde localStorage
 */
export function getAcquisitionContext(): AcquisitionContext | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Prepara datos para enviar a Supabase Auth signUp
 * Asegura que siempre se envíe algo, incluso si no hay datos de adquisición
 */
export function getAcquisitionDataForSignup(): Record<string, string | null> {
  const context = getAcquisitionContext();

  if (context) {
    return {
      utm_source: context.utm_source,
      utm_medium: context.utm_medium,
      utm_campaign: context.utm_campaign,
      utm_content: context.utm_content,
      landing_page: context.landing_page,
      referrer: context.referrer,
    };
  }

  // Si no existe contexto, enviar defaults
  return {
    utm_source: 'direct',
    utm_medium: null,
    utm_campaign: null,
    utm_content: null,
    landing_page: window.location.pathname,
    referrer: null,
  };
}

/**
 * Hook de React para usar acquisition context en componentes
 */
export function useAcquisitionContext() {
  const context = getAcquisitionContext();
  
  return {
    context,
    data: getAcquisitionDataForSignup(),
    isSourceDirect: context?.utm_source === null || context?.utm_source === 'direct',
  };
}
