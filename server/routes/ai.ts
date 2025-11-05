import type { Express } from "express";
import type { RouteDeps } from "./_base";
import { getHomeGreetingHandler } from "../../src/ai/serverless/homeGreetingHandler";
import { getChatHandler } from "../../src/ai/serverless/chatHandler";
import { getHistoryHandler } from "../../src/ai/serverless/historyHandler";

export function registerAIRoutes(app: Express, deps: RouteDeps) {
  const { createAuthenticatedClient, extractToken } = deps;

  // GET /api/ai/home_greeting - AI-powered home greeting with suggestions (cached by period)
  app.get("/api/ai/home_greeting", async (req, res) => {
    try {
      const openaiApiKey = process.env.OPENAI_API_KEY;

      if (!openaiApiKey) {
        return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
      }

      // Extraer token y autenticar
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthenticatedClient(token);

      // Obtener el usuario autenticado
      const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
      if (authError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Obtener el usuario de la tabla users por auth_id
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!dbUser) {
        return res.status(404).json({ error: "User not found in database" });
      }

      const userId = dbUser.id;

      // Delegar toda la lógica al handler compartido
      const result = await getHomeGreetingHandler({
        userId,
        supabase: authenticatedSupabase,
        openaiApiKey
      });

      if (!result.success) {
        return res.status(result.status).json({ error: result.error });
      }

      return res.status(result.status).json(result.data);

    } catch (err: any) {
      console.error('Error in home_greeting:', err);
      
      // Fallback en caso de error
      return res.status(200).json({
        greeting: "¡Hola! ¿Cómo estás hoy?",
        suggestions: [
          { label: "Explorar cursos", action: "/learning/courses" },
          { label: "Ver proyectos", action: "/organization/projects" }
        ]
      });
    }
  });

  // POST /api/ai/chat - Conversational AI chat
  app.post("/api/ai/chat", async (req, res) => {
    try {
      const openaiApiKey = process.env.OPENAI_API_KEY;

      if (!openaiApiKey) {
        return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
      }

      // Extraer token y autenticar
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthenticatedClient(token);

      // Obtener el usuario autenticado
      const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
      if (authError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Obtener el usuario de la tabla users por auth_id
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!dbUser) {
        return res.status(404).json({ error: "User not found in database" });
      }

      const userId = dbUser.id;

      // Obtener el mensaje y el historial del body
      const { message, history = [] } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Message is required" });
      }

      // Obtener organization_id para el handler
      const { data: userPrefs } = await authenticatedSupabase
        .from('user_preferences')
        .select('last_organization_id')
        .eq('user_id', userId)
        .single();

      const organizationId = userPrefs?.last_organization_id || null;

      // Delegar toda la lógica al handler compartido
      const result = await getChatHandler({
        userId,
        message,
        history,
        supabase: authenticatedSupabase,
        openaiApiKey,
        organizationId
      });

      if (!result.success) {
        // Devolver error con toda la metadata del handler (incluye limitReached, remainingPrompts, etc.)
        const errorResponse: any = { error: result.error };
        if (result.data) {
          Object.assign(errorResponse, result.data);
        }
        return res.status(result.status).json(errorResponse);
      }

      return res.status(result.status).json(result.data);

    } catch (err: any) {
      console.error('Error in chat:', err);
      return res.status(500).json({
        error: "Internal server error"
      });
    }
  });

  // GET /api/ai/history - Get chat history for the user
  app.get("/api/ai/history", async (req, res) => {
    try {
      // Extraer token y autenticar
      const token = extractToken(req.headers.authorization);
      if (!token) {
        return res.status(401).json({ error: "No authorization token provided" });
      }

      const authenticatedSupabase = createAuthenticatedClient(token);

      // Obtener el usuario autenticado
      const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
      if (authError || !user) {
        return res.status(401).json({ error: "Unauthorized" });
      }

      // Obtener el usuario de la tabla users por auth_id
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single();

      if (!dbUser) {
        return res.status(404).json({ error: "User not found in database" });
      }

      const userId = dbUser.id;

      // Delegar toda la lógica al handler compartido
      const result = await getHistoryHandler({
        userId,
        supabase: authenticatedSupabase
      });

      if (!result.success) {
        return res.status(result.status).json({ error: result.error });
      }

      return res.status(result.status).json(result.data);

    } catch (err: any) {
      console.error('Error in history:', err);
      return res.status(500).json({
        error: "Error fetching chat history"
      });
    }
  });

}
