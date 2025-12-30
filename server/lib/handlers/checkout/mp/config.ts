// Lee directo las variables de producción configuradas
export const MP_MODE = process.env.MP_MODE!;
export const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN!;

// Detecta si estamos en test mirando el token (si empieza con TEST- es test)
export const isTestMode = MP_ACCESS_TOKEN?.startsWith("TEST-") || false;

export const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET || "";

// Valida que las variables requeridas existan
if (!MP_MODE || !MP_ACCESS_TOKEN) {
  console.warn(`[MercadoPago] WARNING: MP_MODE or MP_ACCESS_TOKEN not configured`);
}

export function validateMPToken(): { valid: true } | { valid: false; error: string } {
  const isValidToken = MP_ACCESS_TOKEN && 
    (MP_ACCESS_TOKEN.startsWith("APP_USR-") || MP_ACCESS_TOKEN.startsWith("TEST-"));
  
  if (!isValidToken) {
    return { valid: false, error: "MP_ACCESS_TOKEN no configurado correctamente" };
  }
  
  return { valid: true };
}

export function logMPMode(context: string): void {
  const mode = isTestMode ? "TEST" : "PRODUCTION";
  console.log(`[MercadoPago] ${context} - MODE: ${mode}`);
}
