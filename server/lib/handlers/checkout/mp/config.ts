// Use MP_ACCESS_TOKEN_TEST variable to determine test vs production
// When MP_ACCESS_TOKEN_TEST is set, use test credentials; otherwise use production
const USE_MP_TEST = !!process.env.MP_ACCESS_TOKEN_TEST;

export const isTestMode = USE_MP_TEST;

export const MP_ACCESS_TOKEN = USE_MP_TEST 
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
  if (isTestMode) {
    console.log(`[MercadoPago] ${context} - MODE: TEST (via MP_ACCESS_TOKEN_TEST)`);
  } else {
    console.log(`[MercadoPago] ${context} - MODE: PRODUCTION`);
  }
}
