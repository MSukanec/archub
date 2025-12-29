// Use PAYPAL_ENV_SANDBOX variable to determine test vs production
// When PAYPAL_ENV_SANDBOX is set, use sandbox credentials; otherwise use production
const USE_PAYPAL_SANDBOX = !!process.env.PAYPAL_ENV_SANDBOX;

export const isPayPalSandbox = USE_PAYPAL_SANDBOX;

export const PAYPAL_CLIENT_ID = USE_PAYPAL_SANDBOX
  ? process.env.PAYPAL_CLIENT_ID_SANDBOX!
  : process.env.PAYPAL_CLIENT_ID!;

export const PAYPAL_CLIENT_SECRET = USE_PAYPAL_SANDBOX
  ? process.env.PAYPAL_CLIENT_SECRET_SANDBOX!
  : process.env.PAYPAL_CLIENT_SECRET!;

export const PAYPAL_WEBHOOK_ID = USE_PAYPAL_SANDBOX
  ? (process.env.PAYPAL_WEBHOOK_ID_SANDBOX || "")
  : (process.env.PAYPAL_WEBHOOK_ID || "");

export const PAYPAL_BASE_URL = USE_PAYPAL_SANDBOX
  ? "https://api-m.sandbox.paypal.com"
  : "https://api-m.paypal.com";

export function logPayPalMode(context: string): void {
  if (isPayPalSandbox) {
    console.log(`[PayPal] ${context} - MODE: SANDBOX (via PAYPAL_ENV_SANDBOX)`);
  } else {
    console.log(`[PayPal] ${context} - MODE: PRODUCTION`);
  }
}
