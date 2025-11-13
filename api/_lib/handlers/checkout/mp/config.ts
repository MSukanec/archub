const MP_MODE = process.env.MP_MODE || "production";
export const isTestMode = MP_MODE === "test";

export const MP_ACCESS_TOKEN = isTestMode 
  ? process.env.MP_ACCESS_TOKEN_TEST! 
  : process.env.MP_ACCESS_TOKEN!;

export const MP_WEBHOOK_SECRET = process.env.MP_WEBHOOK_SECRET || "";

export function validateMPToken(): { valid: true } | { valid: false; error: string } {
  const isValidToken = MP_ACCESS_TOKEN && 
    (MP_ACCESS_TOKEN.startsWith("APP_USR-") || MP_ACCESS_TOKEN.startsWith("TEST-"));
  
  if (!isValidToken) {
    return { valid: false, error: "MP_ACCESS_TOKEN no configurado correctamente" };
  }
  
  return { valid: true };
}

export function logMPMode(context: string): void {
  console.log(`[MP ${context}] Modo: ${isTestMode ? '🧪 TEST' : '💰 PRODUCCIÓN'}`);
}
