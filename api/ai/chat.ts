// api/ai/chat.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { extractToken, getUserFromToken } from "../_lib/auth-helpers.js";
import { getChatHandler } from "../_lib/ai/serverless/chatHandler.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // 1. Verificar método POST
    if (req.method !== 'POST') {
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

    // 4. Validar body (message requerido)
    const { message, history = [] } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: "Message is required and must be a string" });
    }

    // 5. Obtener organizationId del usuario desde user_preferences
    const { data: preferences } = await supabase
      .from('user_preferences')
      .select('last_organization_id')
      .eq('user_id', userId)
      .single();

    const organizationId = preferences?.last_organization_id || null;

    // 6. Llamar handler compartido
    const result = await getChatHandler({
      userId,
      message,
      history,
      supabase,
      openaiApiKey,
      organizationId
    });

    // 7. Devolver respuesta según resultado del handler
    if (!result.success) {
      // Devolver error con toda la metadata del handler (incluye limitReached, remainingPrompts, etc.)
      const errorResponse: any = { error: result.error };
      if (result.data) {
        Object.assign(errorResponse, result.data);
      }
      return res.status(result.status).json(errorResponse);
    }

    // 8. Devolver respuesta exitosa
    return res.status(result.status).json(result.data);
  } catch (err: any) {
    console.error('Error in chat handler:', err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
