import { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_BASE_URL } from "./config";

let cachedToken: { accessToken: string; expiresAt: number } | null = null;

export async function getPayPalAccessToken(): Promise<string> {
  const now = Date.now();
  
  if (cachedToken && cachedToken.expiresAt > now + 60000) {
    return cachedToken.accessToken;
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
    throw new Error(`PayPal token error: ${r.status} - ${errorText}`);
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
