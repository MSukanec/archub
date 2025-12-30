// FEATURE FLAG LOGIC: If _TEST variables exist, we're in TEST mode
// This allows the feature flag to control which variables are active
const USE_MP_TEST = !!(process.env.MP_MODE_TEST || process.env.MP_ACCESS_TOKEN_TEST);

export const isTestMode = USE_MP_TEST;

// Read the appropriate variables based on whether we're in test mode
const MP_MODE = USE_MP_TEST 
  ? process.env.MP_MODE_TEST! 
  : process.env.MP_MODE!;

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
    console.log(`[MercadoPago] ${context} - MODE: TEST (via MP_MODE_TEST variables)`);
  } else {
    console.log(`[MercadoPago] ${context} - MODE: PRODUCTION (via MP_MODE variables)`);
  }
}
