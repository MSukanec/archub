// /api/mp/webhook.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

// CORS básico
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

// Util: parsea cuerpo JSON o x-www-form-urlencoded sin romper
async function parseBody(req: VercelRequest): Promise<any> {
  try {
    // Cuando Vercel ya parsea JSON, req.body viene como objeto
    if (req.body && typeof req.body === "object") return req.body;
    if (typeof req.body === "string" && req.body.trim().length) {
      try {
        return JSON.parse(req.body);
      } catch {
        /* fallthrough */
      }
    }
  } catch {}
  // Si no se pudo, intentamos leer texto del stream (edge cases)
  try {
    // @ts-ignore – Vercel mantiene req como IncomingMessage
    const raw = await new Promise<string>((resolve) => {
      let data = "";
      // @ts-ignore
      req.on("data", (c: Buffer) => (data += c.toString("utf8")));
      // @ts-ignore
      req.on("end", () => resolve(data));
    });
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {}
    // urlencoded
    const p = new URLSearchParams(raw);
    const obj = Object.fromEntries(p.entries());
    const dataId = p.get("data.id") || p.get("id") || null;
    if (!obj["data"] && dataId) (obj as any).data = { id: dataId };
    return obj;
  } catch {
    return {};
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Preflight
  if (req.method === "OPTIONS") {
    return res
      .status(204)
      .setHeader("Access-Control-Allow-Origin", "*")
      .setHeader(
        "Access-Control-Allow-Headers",
        "authorization, x-client-info, apikey, content-type",
      )
      .setHeader("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
      .end();
  }

  // Ping rápido para test manual: /api/mp/webhook?ping=1
  if (req.method === "GET") {
    if (req.query?.ping) {
      return res
        .status(200)
        .setHeader("Content-Type", "application/json")
        .send({ ok: true, pong: true });
    }
    // GET normal: devolvemos 200 para que Mercado Pago no reintente
    return res.status(200).json({ ok: true, note: "GET acknowledged" });
  }

  if (req.method !== "POST") {
    // 200 en vez de 405 para evitar reintentos de MP
    return res.status(200).json({ ok: true, note: "Method not processed" });
  }

  try {
    const SECRET = process.env.MP_WEBHOOK_SECRET || "";
    const secretQ =
      typeof req.query?.secret === "string"
        ? (req.query.secret as string)
        : undefined;

    // Si configuraste clave secreta en MP y en Vercel, validamos.
    if (SECRET && secretQ && secretQ !== SECRET) {
      console.warn("[mp/webhook] secret mismatch");
      // Devolvemos 200 para que no reintente, pero no procesamos
      return res.status(200).json({ ok: true, ignored: "secret mismatch" });
    }

    const body = await parseBody(req);
    console.log(
      "⚡ MP Webhook received (raw):",
      JSON.stringify(body).slice(0, 1000),
    );

    // Normalizamos algunos campos comunes
    const type =
      body?.type ||
      body?.topic ||
      (typeof body?.action === "string"
        ? String(body.action).split(".")[0]
        : undefined);

    const idFromBody = body?.data?.id || body?.id || null;
    const idFromQuery =
      (req.query?.["data.id"] as string) ||
      (req.query?.["id"] as string) ||
      null;

    const finalId = idFromBody || idFromQuery || null;

    console.log("[mp/webhook] type:", type, "finalId:", finalId);

    // ⚠️ En esta versión SOLO reconocemos y respondemos OK.
    // La lógica completa (leer payment/merchant_order y upsert en Supabase)
    // la podemos agregar en el próximo paso si querés migrarla aquí.
    // Por ahora devolvemos 200 para que MP marque la notificación como recibida.
    return res
      .status(200)
      .setHeader("Content-Type", "application/json")
      .send({
        ok: true,
        received: true,
        type: type ?? null,
        id: finalId ?? null,
      });
  } catch (e: any) {
    console.error("[mp/webhook] error:", e);
    // Igual respondemos 200 para que MP no reintente en loop
    return res.status(200).json({ ok: true, error: "logged" });
  }
}
