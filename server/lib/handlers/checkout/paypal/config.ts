// Force sandbox in development mode for testing
const PAYPAL_ENV = process.env.NODE_ENV === 'development' 
  ? 'sandbox' 
  : (process.env.PAYPAL_ENV || "production");

export const isPayPalSandbox = PAYPAL_ENV === "sandbox";

export const PAYPAL_CLIENT_ID = isPayPalSandbox
  ? process.env.PAYPAL_CLIENT_ID_SANDBOX!
  : process.env.PAYPAL_CLIENT_ID!;

export const PAYPAL_CLIENT_SECRET = isPayPalSandbox
  ? process.env.PAYPAL_CLIENT_SECRET_SANDBOX!
  : process.env.PAYPAL_CLIENT_SECRET!;

export const PAYPAL_WEBHOOK_ID = isPayPalSandbox
  ? (process.env.PAYPAL_WEBHOOK_ID_SANDBOX || "")
  : (process.env.PAYPAL_WEBHOOK_ID || "");

export const PAYPAL_BASE_URL = isPayPalSandbox
  ? "https://api-m.sandbox.paypal.com"
  : "https://api-m.paypal.com";

export function logPayPalMode(context: string): void {
  if (isPayPalSandbox) {
    console.log(`[PayPal] ${context} - MODE: SANDBOX (development)`);
  } else {
    console.log(`[PayPal] ${context} - MODE: PRODUCTION`);
  }
}
