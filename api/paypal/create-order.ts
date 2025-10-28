// /api/paypal/create-order.ts (Node runtime, NO EDGE)
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (req.method === "OPTIONS") {
    Object.entries(cors).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(200).send("ok");
  }
  if (req.method !== "POST") {
    Object.entries(cors).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  try {
    // Body mínimo: { order_id, amountUsd, description }
    // Si no me mandan amount/description desde el front, poné defaults temporales.
    const { order_id, amountUsd, description } = req.body ?? {};
    if (!order_id) throw new Error("Falta 'order_id'");

    const cid = process.env.PAYPAL_CLIENT_ID;
    const csec = process.env.PAYPAL_CLIENT_SECRET;
    const env = (process.env.PAYPAL_ENV || "sandbox").toLowerCase();
    const base =
      process.env.PAYPAL_BASE_URL ||
      (env === "live" ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com");

    if (!cid || !csec) throw new Error("Faltan PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET");

    // 1) OAuth
    const auth = Buffer.from(`${cid}:${csec}`).toString("base64");
    const tokenResp = await fetch(`${base}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });

    const tokenText = await tokenResp.text();
    if (!tokenResp.ok) {
      // PayPal devuelve JSON, pero si por algún motivo no lo es, igual lo registramos
      console.error("PayPal OAuth error:", tokenResp.status, tokenText);
      Object.entries(cors).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(500).json({
        ok: false,
        error: `OAuth PayPal falló: ${tokenResp.status}`,
        details: tokenText,
      });
    }
    const tokenJson = JSON.parse(tokenText);
    const access_token = tokenJson.access_token;
    if (!access_token) throw new Error("No se obtuvo 'access_token' de PayPal");

    // 2) Create Order
    const value = typeof amountUsd === "number" ? amountUsd.toFixed(2) : "169.00"; // default temporal
    const desc = description || `Order ${order_id}`;

    // Determine base URL dynamically from request headers
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    const createResp = await fetch(`${base}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: { currency_code: "USD", value },
            description: desc,
          },
        ],
        application_context: {
          brand_name: "Archub",
          user_action: "PAY_NOW",
          return_url: `${baseUrl}/checkout/paypal/return`,
          cancel_url: `${baseUrl}/checkout/paypal/cancel`,
        },
      }),
    });

    const createText = await createResp.text();
    // PayPal responde JSON; si no, igual parseamos defensivo
    let createJson: any;
    try {
      createJson = JSON.parse(createText);
    } catch {
      createJson = { raw: createText };
    }

    if (!createResp.ok) {
      console.error("PayPal Create Order error:", createResp.status, createJson);
      Object.entries(cors).forEach(([key, value]) => res.setHeader(key, value));
      return res
        .status(500)
        .json({ ok: false, error: `CreateOrder falló: ${createResp.status}`, details: createJson });
    }

    Object.entries(cors).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(200).json({ ok: true, paypal_order: createJson });
  } catch (e: any) {
    console.error("create-order ERROR:", e);
    res.setHeader("Content-Type", "application/json");
    Object.entries(cors).forEach(([key, value]) => res.setHeader(key, value));
    return res
      .status(500)
      .send(JSON.stringify({ ok: false, error: e?.message ?? "Unknown error" }));
  }
}
