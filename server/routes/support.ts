import type { Express } from "express";
import type { RouteDeps } from "./_base";
import { db } from "../db";
import { support_messages, insertSupportMessageSchema } from "../../shared/schema";
import { eq, desc } from "drizzle-orm";

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

      // Obtener mensajes de soporte del usuario
      const messages = await db
        .select()
        .from(support_messages)
        .where(eq(support_messages.user_id, userId))
        .orderBy(desc(support_messages.created_at));

      return res.status(200).json({ messages });

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

      // Insertar el mensaje
      const result = insertSupportMessageSchema.safeParse({
        user_id: userId,
        message,
        sender: 'user'
      });

      if (!result.success) {
        return res.status(400).json({ error: "Invalid message data" });
      }

      const [newMessage] = await db
        .insert(support_messages)
        .values(result.data)
        .returning();

      return res.status(200).json({ message: newMessage });

    } catch (err: any) {
      console.error('Error sending support message:', err);
      return res.status(500).json({
        error: "Error sending support message"
      });
    }
  });

}
