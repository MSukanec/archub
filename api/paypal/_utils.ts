export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

export function paypalBase() {
  const override = process.env.PAYPAL_BASE_URL;
  if (override) return override;
  const env = (process.env.PAYPAL_ENV || "sandbox").toLowerCase();
  return env === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";
}

export async function getAccessToken() {
  const cid = process.env.PAYPAL_CLIENT_ID!;
  const sec = process.env.PAYPAL_CLIENT_SECRET!;
  const base = paypalBase();
  const auth = Buffer.from(`${cid}:${sec}`).toString("base64");
  const r = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials"
  });
  if (!r.ok) throw new Error(`OAuth ${r.status}`);
  const j = await r.json();
  return j.access_token as string;
}
