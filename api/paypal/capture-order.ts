// /api/paypal/capture-order.ts (Node runtime)
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
    const { orderId } = req.body ?? {};
    if (!orderId) throw new Error("Falta 'orderId'");

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
      console.error("PayPal OAuth error:", tokenResp.status, tokenText);
      Object.entries(cors).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(500).json({
        ok: false,
        error: `OAuth fallo ${tokenResp.status}`,
        details: tokenText,
      });
    }

    const tokenJson = JSON.parse(tokenText);
    const access_token = tokenJson.access_token;
    if (!access_token) throw new Error("No se obtuvo 'access_token' de PayPal");

    // 2) Capture Order
    const capResp = await fetch(`${base}/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
    });

    const capText = await capResp.text();
    let capJson: any;
    try {
      capJson = JSON.parse(capText);
    } catch {
      capJson = { raw: capText };
    }

    if (!capResp.ok) {
      console.error("PayPal Capture error:", capResp.status, capJson);
      Object.entries(cors).forEach(([key, value]) => res.setHeader(key, value));
      return res.status(500).json({
        ok: false,
        error: `Capture fallo ${capResp.status}`,
        details: capJson,
      });
    }

    Object.entries(cors).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(200).json({ ok: true, capture: capJson });
  } catch (e: any) {
    console.error("capture-order ERROR:", e);
    res.setHeader("Content-Type", "application/json");
    Object.entries(cors).forEach(([key, value]) => res.setHeader(key, value));
    return res.status(500).send(JSON.stringify({ ok: false, error: e?.message || "Unknown error" }));
  }
}
