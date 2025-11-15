import type { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';
import { getChatHandler } from '../../lib/ai/serverless/chatHandler.js';
import { getHistoryHandler } from '../../lib/ai/serverless/historyHandler.js';
import { getHomeGreetingHandler } from '../../lib/ai/serverless/homeGreetingHandler.js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY!;

function createAuthenticatedClient(token: string) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });
}

function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export async function handleChat(req: Request, res: Response) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: "No authorization token provided" });
    }

    const authenticatedSupabase = createAuthenticatedClient(token);

    const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: dbUser } = await authenticatedSupabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!dbUser) {
      return res.status(404).json({ error: "User not found in database" });
    }

    const userId = dbUser.id;

    const { message, history = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: "Message is required" });
    }

    const { data: userPrefs } = await authenticatedSupabase
      .from('user_preferences')
      .select('last_organization_id')
      .eq('user_id', userId)
      .single();

    const organizationId = userPrefs?.last_organization_id || null;

    const result = await getChatHandler({
      userId,
      message,
      history,
      supabase: authenticatedSupabase,
      openaiApiKey,
      organizationId
    });

    if (!result.success) {
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
}

export async function handleHistory(req: Request, res: Response) {
  try {
    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: "No authorization token provided" });
    }

    const authenticatedSupabase = createAuthenticatedClient(token);

    const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: dbUser } = await authenticatedSupabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!dbUser) {
      return res.status(404).json({ error: "User not found in database" });
    }

    const userId = dbUser.id;

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
}

export async function handleHomeGreeting(req: Request, res: Response) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const token = extractToken(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: "No authorization token provided" });
    }

    const authenticatedSupabase = createAuthenticatedClient(token);

    const { data: { user }, error: authError } = await authenticatedSupabase.auth.getUser();
    if (authError || !user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { data: dbUser } = await authenticatedSupabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!dbUser) {
      return res.status(404).json({ error: "User not found in database" });
    }

    const userId = dbUser.id;

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
    
    return res.status(200).json({
      greeting: "¡Hola! ¿Cómo estás hoy?",
      suggestions: [
        { label: "Explorar cursos", action: "/learning/courses" },
        { label: "Ver proyectos", action: "/organization/projects" }
      ]
    });
  }
}
