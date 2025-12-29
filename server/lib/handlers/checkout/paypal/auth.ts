import { getPayPalConfig } from "./config.js";

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

export async function getPayPalAccessToken(): Promise<string> {
  const now = Date.now();
  
  if (cachedToken && cachedToken.expiresAt > now + 60000) {
    return cachedToken.accessToken;
  }

  // Get dynamic configuration based on paypal_test_mode flag
  const config = await getPayPalConfig();
  
  const clientIdPreview = config.clientId?.substring(0, 10) || "UNDEFINED";
  const mode = config.isTestMode ? "SANDBOX 🧪 (Test Mode Flag ON)" : "PRODUCTION 🚨 (Test Mode Flag OFF)";
  
  console.log(`[PayPal Auth] Authenticating in ${mode}`);
  console.log(`[PayPal Auth] Endpoint: ${config.baseUrl}`);
  console.log(`[PayPal Auth] Client ID preview: ${clientIdPreview}...`);

  if (!config.clientId || !config.clientSecret) {
    throw new Error(
      `PayPal credentials missing! CLIENT_ID: ${!!config.clientId}, SECRET: ${!!config.clientSecret}. Mode: ${mode}`
    );
  }

  const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
  
  const r = await fetch(`${config.baseUrl}/v1/oauth2/token`, {
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
    console.error(`[PayPal Auth] Endpoint: ${config.baseUrl}/v1/oauth2/token`);
    console.error(`[PayPal Auth] Client ID preview: ${clientIdPreview}...`);
    
    throw new Error(
      `PayPal authentication failed (${r.status}): ${errorText}. ` +
      `Check that your ${config.isTestMode ? 'SANDBOX' : 'PRODUCTION'} credentials are correct. ` +
      `Endpoint: ${config.baseUrl}`
    );
  }

  const data = await r.json();
  const accessToken = data.access_token;
  const expiresIn = Number(data.expires_in || 3600);
  
  cachedToken = {
    accessToken,
    expiresAt: now + expiresIn * 1000,
  };

  return accessToken;
}
