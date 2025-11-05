import type { Express } from "express";
import type { RouteDeps } from "./_base";
import { insertSupportMessageSchema } from "../../shared/schema";

export function registerSupportRoutes(app: Express, deps: RouteDeps) {
  const { createAuthenticatedClient, extractToken } = deps;

  // GET /api/support/messages - Get support messages for the user
  app.get("/api/support/messages", async (req, res) => {
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

      // Obtener mensajes de soporte del usuario usando Supabase (respeta RLS)
      const { data: messages, error: messagesError } = await authenticatedSupabase
        .from('support_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (messagesError) {
        console.error('Supabase error fetching messages:', messagesError);
        return res.status(500).json({ error: "Error fetching messages from database" });
      }

      return res.status(200).json({ messages: messages || [] });

    } catch (err: any) {
      console.error('Error fetching support messages:', err);
      return res.status(500).json({
        error: "Error fetching support messages"
      });
    }
  });

  // POST /api/support/messages - Send a new support message
  app.post("/api/support/messages", async (req, res) => {
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

      // Validar el mensaje
      const { message } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: "Message is required" });
      }

      // Validar datos con Zod
      const result = insertSupportMessageSchema.safeParse({
        user_id: userId,
        message,
        sender: 'user'
      });

      if (!result.success) {
        console.error('Validation error:', result.error);
        return res.status(400).json({ error: "Invalid message data" });
      }

      // Insertar mensaje usando Supabase (respeta RLS)
      const { data: newMessage, error: insertError } = await authenticatedSupabase
        .from('support_messages')
        .insert({
          user_id: userId,
          message: message,
          sender: 'user'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        return res.status(500).json({ 
          error: "Error inserting message into database",
          details: insertError.message 
        });
      }

      return res.status(200).json({ message: newMessage });

    } catch (err: any) {
      console.error('Error sending support message:', err);
      return res.status(500).json({
        error: "Error sending support message",
        details: err.message
      });
    }
  });

}
