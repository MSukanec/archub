// api/ai/home-greeting.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { extractToken, getUserFromToken } from "../_lib/auth-helpers.js";
import { getHomeGreetingHandler } from "../_lib/ai/serverless/homeGreetingHandler.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // 1. Verificar método GET
    if (req.method !== 'GET') {
      return res.status(405).json({ error: "Method not allowed" });
    }

    // 2. Verificar OPENAI_API_KEY
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    // 3. Autenticar usuario
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: "No authorization token provided" });
    }

    const userResult = await getUserFromToken(token);
    if (!userResult) {
      return res.status(401).json({ error: "User not found or invalid token" });
    }

    const { userId, supabase } = userResult;

    // 4. Llamar handler compartido
    const result = await getHomeGreetingHandler({
      userId,
      supabase,
      openaiApiKey
    });

    // 5. Devolver respuesta según resultado del handler
    if (result.success) {
      return res.status(result.status).json(result.data);
    } else {
      return res.status(result.status).json({ error: result.error });
    }
  } catch (err: any) {
    console.error('Error in home-greeting handler:', err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
