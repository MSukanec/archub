import type { VercelRequest, VercelResponse } from "@vercel/node";
import { extractToken, getUserFromToken } from "../_lib/auth-helpers";
import { getHistoryHandler } from "../../src/ai/serverless/historyHandler";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Verificar método GET
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 2. Extraer token
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: "No authorization token provided" });
    }

    // 3. Autenticar usuario
    const userInfo = await getUserFromToken(token);
    if (!userInfo) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const { userId, supabase } = userInfo;

    // 4. Llamar handler compartido
    const result = await getHistoryHandler({ userId, supabase });

    // 5. Devolver respuesta
    if (result.success) {
      return res.status(result.status).json(result.data);
    } else {
      return res.status(result.status).json({ error: result.error });
    }

  } catch (err: any) {
    console.error('Error in /api/ai/history:', err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
