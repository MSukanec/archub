// /api/lib/cors.ts
const CORS_BASE = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400",
} as const;

export function withCORS(headers: Record<string, string> = {}) {
  return { ...CORS_BASE, ...headers };
}

export function handlePreflight(req: Request) {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: withCORS() });
  }
  return null;
}

export function json(data: any, init: number | ResponseInit = 200) {
  const base: ResponseInit = typeof init === "number" ? { status: init } : init;
  return new Response(JSON.stringify(data), {
    ...base,
    headers: withCORS({ "Content-Type": "application/json" }),
  });
}
