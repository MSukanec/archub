/**
 * User Acquisition Context Service
 * Centralizado para capturar y manejar datos de adquisición de usuarios
 * Integrado con Supabase Auth para first-touch attribution
 * 
 * CONVENCIONES UTM RECOMENDADAS:
 * 
 * utm_source (¿de dónde?) - Fuente de tráfico:
 *   - youtube
 *   - instagram
 *   - whatsapp
 *   - google
 *   - newsletter
 *   - alumni
 *   - tiktok
 *   - linkedin
 * 
 * utm_medium (¿cómo?) - Medio de distribución:
 *   - video
 *   - bio
 *   - post
 *   - story
 *   - share
 *   - email
 *   - paid
 *   - organic
 * 
 * utm_campaign (¿qué?) - Campaña específica:
 *   - curso_archicad
 *   - plan_fundadores
 *   - lanzamiento_2025
 *   - webinar_febrero
 *   - descuento_navidad
 * 
 * utm_content (¿qué variante?) - Variante específica:
 *   - video_40min
 *   - link_bio
 *   - story_1
 *   - mensaje_directo
 *   - cta_verde
 *   - cta_rojo
 * 
 * EJEMPLOS DE URLs:
 * https://seencel.com/register?utm_source=youtube&utm_medium=video&utm_campaign=lanzamiento_2025&utm_content=video_40min
 * https://seencel.com/register?utm_source=instagram&utm_medium=story&utm_campaign=plan_fundadores&utm_content=story_1
 * https://seencel.com/register?utm_source=alumni&utm_medium=share&utm_campaign=curso_archicad
 */

// Valores permitidos para validación
const ALLOWED_UTM_SOURCES = [
  'youtube',
  'instagram',
  'whatsapp',
  'google',
  'newsletter',
  'alumni',
  'tiktok',
  'linkedin',
] as const;

const ALLOWED_UTM_MEDIUMS = [
  'video',
  'bio',
  'post',
  'story',
  'share',
  'email',
  'paid',
  'organic',
] as const;

const ALLOWED_UTM_CAMPAIGNS = [
  'curso_archicad',
  'plan_fundadores',
  'lanzamiento_2025',
  'webinar_febrero',
  'descuento_navidad',
  'black_friday',
  'cyber_monday',
] as const;

const ALLOWED_UTM_CONTENTS = [
  'video_40min',
  'link_bio',
  'story_1',
  'mensaje_directo',
  'cta_verde',
  'cta_rojo',
  'banner_principal',
  'sidebar',
  'footer',
] as const;

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
 * Valida si un utm_source es permitido
 */
function isValidUtmSource(value: string | null): value is typeof ALLOWED_UTM_SOURCES[number] {
  if (!value) return false;
  return ALLOWED_UTM_SOURCES.includes(value as any);
}

/**
 * Valida si un utm_medium es permitido
 */
function isValidUtmMedium(value: string | null): value is typeof ALLOWED_UTM_MEDIUMS[number] {
  if (!value) return false;
  return ALLOWED_UTM_MEDIUMS.includes(value as any);
}

/**
 * Valida si una utm_campaign es permitida
 */
function isValidUtmCampaign(value: string | null): value is typeof ALLOWED_UTM_CAMPAIGNS[number] {
  if (!value) return false;
  return ALLOWED_UTM_CAMPAIGNS.includes(value as any);
}

/**
 * Valida si un utm_content es permitido
 */
function isValidUtmContent(value: string | null): value is typeof ALLOWED_UTM_CONTENTS[number] {
  if (!value) return false;
  return ALLOWED_UTM_CONTENTS.includes(value as any);
}

/**
 * Captura datos de adquisición desde URL y contexto del navegador
 * Se ejecuta una sola vez al cargar la aplicación (first-touch)
 * Valida todos los parámetros contra convenciones permitidas
 */
export function captureAcquisitionContext(): AcquisitionContext {
  // Si ya existe en localStorage, retorna sin sobrescribir (first-touch attribution)
  const existing = getAcquisitionContext();
  if (existing) {
    return existing;
  }

  // Leer parámetros UTM desde URL
  const params = new URLSearchParams(window.location.search);
  const utm_source_raw = params.get('utm_source');
  const utm_medium_raw = params.get('utm_medium');
  const utm_campaign_raw = params.get('utm_campaign');
  const utm_content_raw = params.get('utm_content');

  // Validar contra convenciones permitidas (solo mantener si es válido)
  const utm_source = isValidUtmSource(utm_source_raw) ? utm_source_raw : null;
  const utm_medium = isValidUtmMedium(utm_medium_raw) ? utm_medium_raw : null;
  const utm_campaign = isValidUtmCampaign(utm_campaign_raw) ? utm_campaign_raw : null;
  const utm_content = isValidUtmContent(utm_content_raw) ? utm_content_raw : null;

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
 * SOLO ENVÍA valores válidos según convenciones permitidas
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

/**
 * Exporta las convenciones permitidas para uso en otras partes de la app
 * (ej: para generar links con UTMs válidos)
 */
export const UTM_CONVENTIONS = {
  sources: ALLOWED_UTM_SOURCES,
  mediums: ALLOWED_UTM_MEDIUMS,
  campaigns: ALLOWED_UTM_CAMPAIGNS,
  contents: ALLOWED_UTM_CONTENTS,
} as const;
