import type { VercelResponse } from "@vercel/node";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Max-Age": "86400",
};

export function handleCorsHeaders(res: VercelResponse): VercelResponse {
  return res
    .setHeader("Access-Control-Allow-Origin", corsHeaders["Access-Control-Allow-Origin"])
    .setHeader("Access-Control-Allow-Headers", corsHeaders["Access-Control-Allow-Headers"])
    .setHeader("Access-Control-Allow-Methods", corsHeaders["Access-Control-Allow-Methods"]);
}

export function handleCorsPreflight(res: VercelResponse) {
  return res
    .status(200)
    .setHeader("Access-Control-Allow-Origin", corsHeaders["Access-Control-Allow-Origin"])
    .setHeader("Access-Control-Allow-Headers", corsHeaders["Access-Control-Allow-Headers"])
    .setHeader("Access-Control-Allow-Methods", corsHeaders["Access-Control-Allow-Methods"])
    .send("ok");
}
