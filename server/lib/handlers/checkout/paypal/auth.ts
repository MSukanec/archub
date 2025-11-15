import { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_BASE_URL, isPayPalSandbox } from "./config.js";

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

export async function getPayPalAccessToken(): Promise<string> {
  const now = Date.now();
  
  if (cachedToken && cachedToken.expiresAt > now + 60000) {
    return cachedToken.accessToken;
  }

  const clientIdPreview = PAYPAL_CLIENT_ID?.substring(0, 10) || "UNDEFINED";
  const hasSecret = !!PAYPAL_CLIENT_SECRET;
  
  console.log(`[PayPal Auth] Requesting token from: ${PAYPAL_BASE_URL}`);
  console.log(`[PayPal Auth] Mode: ${isPayPalSandbox ? 'SANDBOX' : 'PRODUCTION'}`);
  console.log(`[PayPal Auth] Client ID starts with: ${clientIdPreview}...`);
  console.log(`[PayPal Auth] Secret configured: ${hasSecret ? 'YES' : 'NO'}`);

  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
    throw new Error(
      `PayPal credentials missing! CLIENT_ID: ${!!PAYPAL_CLIENT_ID}, SECRET: ${!!PAYPAL_CLIENT_SECRET}`
    );
  }

  const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");
  
  const r = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!r.ok) {
    const errorText = await r.text();
    console.error(`[PayPal Auth] Token request FAILED`);
    console.error(`[PayPal Auth] Status: ${r.status}`);
    console.error(`[PayPal Auth] Response: ${errorText}`);
    console.error(`[PayPal Auth] Endpoint: ${PAYPAL_BASE_URL}/v1/oauth2/token`);
    console.error(`[PayPal Auth] Client ID preview: ${clientIdPreview}...`);
    
    throw new Error(
      `PayPal authentication failed (${r.status}): ${errorText}. ` +
      `Check that your ${isPayPalSandbox ? 'SANDBOX' : 'PRODUCTION'} credentials are correct. ` +
      `Endpoint: ${PAYPAL_BASE_URL}`
    );
  }

  const data = await r.json();
  const accessToken = data.access_token;
  const expiresIn = Number(data.expires_in || 3600);
  
  console.log(`[PayPal Auth] ✅ Token obtained successfully (expires in ${expiresIn}s)`);
  
  cachedToken = {
    accessToken,
    expiresAt: now + expiresIn * 1000,
  };

  return accessToken;
}
