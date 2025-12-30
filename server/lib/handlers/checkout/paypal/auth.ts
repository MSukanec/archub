import { getPayPalCredentials, getPayPalMode } from "./config.js";

let cachedToken: { accessToken: string; expiresAt: number; isSandbox: boolean } | null = null;

export async function getPayPalAccessToken(): Promise<string> {
  const now = Date.now();
  const credentials = await getPayPalCredentials();
  
  // Invalidate cache if mode changed
  if (cachedToken && cachedToken.isSandbox !== credentials.isSandbox) {
    console.log(`[PayPal Auth] Mode changed from ${cachedToken.isSandbox ? 'SANDBOX' : 'PRODUCTION'} to ${credentials.isSandbox ? 'SANDBOX' : 'PRODUCTION'}, refreshing token`);
    cachedToken = null;
  }
  
  if (cachedToken && cachedToken.expiresAt > now + 60000) {
    return cachedToken.accessToken;
  }

  const clientIdPreview = credentials.clientId?.substring(0, 10) || "UNDEFINED";
  const mode = credentials.isSandbox ? "SANDBOX 🧪" : "PRODUCTION 🚨";
  
  console.log(`[PayPal Auth] Authenticating in ${mode}`);
  console.log(`[PayPal Auth] Endpoint: ${credentials.baseUrl}`);
  console.log(`[PayPal Auth] Client ID preview: ${clientIdPreview}...`);

  if (!credentials.clientId || !credentials.clientSecret) {
    throw new Error(
      `PayPal credentials missing! CLIENT_ID: ${!!credentials.clientId}, SECRET: ${!!credentials.clientSecret}. Mode: ${mode}`
    );
  }

  const auth = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString("base64");
  
  const r = await fetch(`${credentials.baseUrl}/v1/oauth2/token`, {
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
    console.error(`[PayPal Auth] Endpoint: ${credentials.baseUrl}/v1/oauth2/token`);
    console.error(`[PayPal Auth] Client ID preview: ${clientIdPreview}...`);
    
    throw new Error(
      `PayPal authentication failed (${r.status}): ${errorText}. ` +
      `Check that your ${credentials.isSandbox ? 'SANDBOX' : 'PRODUCTION'} credentials are correct. ` +
      `Endpoint: ${credentials.baseUrl}`
    );
  }

  const data = await r.json();
  const accessToken = data.access_token;
  const expiresIn = Number(data.expires_in || 3600);
  
  cachedToken = {
    accessToken,
    expiresAt: now + expiresIn * 1000,
    isSandbox: credentials.isSandbox,
  };

  return accessToken;
}

export async function getPayPalBaseUrl(): Promise<string> {
  const credentials = await getPayPalCredentials();
  return credentials.baseUrl;
}
