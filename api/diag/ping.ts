// api/diag/ping.ts
export const config = { runtime: "nodejs", regions: ["gru1"] };

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const now = new Date().toISOString();
  return new Response(
    JSON.stringify({
      ok: true,
      path: url.pathname + url.search,
      method: req.method,
      now,
    }),
    {
      status: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Content-Type": "application/json",
      },
    },
  );
}
