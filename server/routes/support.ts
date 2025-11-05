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

  // GET /api/admin/support/conversations - Get all support conversations (admin only)
  app.get("/api/admin/support/conversations", async (req, res) => {
    try {
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

      // Verificar que sea admin
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id, role')
        .eq('auth_id', user.id)
        .single();

      if (!dbUser || dbUser.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden - Admin access required" });
      }

      // Obtener todos los mensajes de soporte con información del usuario
      const { data: messages, error: messagesError } = await authenticatedSupabase
        .from('support_messages')
        .select(`
          id,
          user_id,
          message,
          sender,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (messagesError) {
        console.error('Error fetching support messages:', messagesError);
        return res.status(500).json({ error: "Error fetching messages" });
      }

      // Obtener información de usuarios únicos
      const userIds = Array.from(new Set(messages?.map(m => m.user_id) || []));
      
      const { data: users, error: usersError } = await authenticatedSupabase
        .from('users')
        .select('id, full_name, email, avatar_url')
        .in('id', userIds);

      if (usersError) {
        console.error('Error fetching users:', usersError);
        return res.status(500).json({ error: "Error fetching users" });
      }

      // Agrupar mensajes por usuario
      const conversations = userIds.map(userId => {
        const userMessages = messages?.filter(m => m.user_id === userId) || [];
        const userData = users?.find(u => u.id === userId);
        const lastMessage = userMessages[0]; // Ya están ordenados por created_at desc

        return {
          user_id: userId,
          user: userData,
          messages: userMessages,
          last_message_at: lastMessage?.created_at,
          unread_count: userMessages.filter(m => m.sender === 'user').length // Simplificación: contar mensajes de usuario
        };
      });

      // Ordenar conversaciones por último mensaje
      conversations.sort((a, b) => {
        if (!a.last_message_at) return 1;
        if (!b.last_message_at) return -1;
        return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime();
      });

      return res.status(200).json({ conversations });

    } catch (err: any) {
      console.error('Error fetching support conversations:', err);
      return res.status(500).json({
        error: "Error fetching support conversations",
        details: err.message
      });
    }
  });

  // POST /api/admin/support/messages - Send admin reply to user
  app.post("/api/admin/support/messages", async (req, res) => {
    try {
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

      // Verificar que sea admin
      const { data: dbUser } = await authenticatedSupabase
        .from('users')
        .select('id, role')
        .eq('auth_id', user.id)
        .single();

      if (!dbUser || dbUser.role !== 'admin') {
        return res.status(403).json({ error: "Forbidden - Admin access required" });
      }

      // Validar datos de entrada
      const { user_id, message } = req.body;

      if (!user_id || !message || typeof message !== 'string') {
        return res.status(400).json({ error: "user_id and message are required" });
      }

      // Insertar respuesta del admin
      const { data: newMessage, error: insertError } = await authenticatedSupabase
        .from('support_messages')
        .insert({
          user_id: user_id,
          message: message,
          sender: 'admin'
        })
        .select()
        .single();

      if (insertError) {
        console.error('Supabase insert error:', insertError);
        return res.status(500).json({ 
          error: "Error inserting message",
          details: insertError.message 
        });
      }

      return res.status(200).json({ message: newMessage });

    } catch (err: any) {
      console.error('Error sending admin support message:', err);
      return res.status(500).json({
        error: "Error sending admin support message",
        details: err.message
      });
    }
  });

}
