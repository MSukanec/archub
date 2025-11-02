// api/ai/home_greeting.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: "Missing Supabase credentials" });
    }

    if (!openaiApiKey) {
      return res.status(500).json({ error: "Missing OpenAI API key" });
    }

    // Obtener el token del usuario
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

    if (!token) {
      return res.status(401).json({ error: "No authorization token provided" });
    }

    // Cliente de Supabase con el token del usuario
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // Obtener el user_id desde el token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    const userId = user.id;

    // Obtener datos del usuario desde la tabla users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('full_name')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      return res.status(404).json({ error: "User not found" });
    }

    // Obtener preferencias de IA del usuario
    const { data: preferences } = await supabase
      .from('ia_user_preferences')
      .select('display_name, tone, language')
      .eq('user_id', userId)
      .single();

    // Valores por defecto si no hay preferencias
    const displayName = preferences?.display_name || userData.full_name || "Usuario";
    const tone = preferences?.tone || "amistoso";
    const language = preferences?.language || "es";

    // Obtener la fecha actual
    const today = new Date().toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Crear cliente de OpenAI
    const openai = new OpenAI({
      apiKey: openaiApiKey,
    });

    // Llamar a la API de OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `Sos Archubita, el asistente virtual personalizado de Archub, una app de arquitectura y obra. Tu trabajo es saludar cálidamente al usuario con tono ${tone}, usando el idioma ${language}. Agregá un mensaje distinto cada día.`
        },
        {
          role: "user",
          content: `Hoy es ${today}. Saluda al usuario ${displayName} con un mensaje breve y útil.`
        }
      ],
    });

    const greetingContent = completion.choices[0]?.message?.content || "¡Hola! ¿En qué puedo ayudarte hoy?";
    const usage = completion.usage;

    // Calcular el costo (precios de GPT-4o según OpenAI)
    // Input: $5 por 1M tokens, Output: $15 por 1M tokens
    const promptTokens = usage?.prompt_tokens || 0;
    const completionTokens = usage?.completion_tokens || 0;
    const totalTokens = usage?.total_tokens || 0;
    const costUsd = ((promptTokens * 5) / 1000000) + ((completionTokens * 15) / 1000000);

    // Guardar el mensaje en ia_messages
    const { error: messageError } = await supabase
      .from('ia_messages')
      .insert({
        user_id: userId,
        role: 'assistant',
        content: greetingContent,
        context_type: 'home_greeting'
      });

    if (messageError) {
      console.error('Error saving message:', messageError);
    }

    // Registrar el uso en ia_usage_logs
    const { error: usageError } = await supabase
      .from('ia_usage_logs')
      .insert({
        user_id: userId,
        model: 'gpt-4o',
        provider: 'openai',
        prompt_tokens: promptTokens,
        completion_tokens: completionTokens,
        total_tokens: totalTokens,
        cost_usd: costUsd,
        context_type: 'home_greeting'
      });

    if (usageError) {
      console.error('Error logging usage:', usageError);
    }

    // Devolver el saludo
    return res.status(200).json({
      greeting: greetingContent
    });

  } catch (err: any) {
    console.error('Error in home_greeting:', err);
    return res.status(500).json({ error: err.message || "Internal server error" });
  }
}
