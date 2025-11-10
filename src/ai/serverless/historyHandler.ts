import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Handler compartido para obtener el historial de chat del usuario
 * 
 * Puede ser usado tanto por Express routes como por Vercel Functions
 * 
 * @param params - Parámetros del handler
 * @param params.userId - ID del usuario en la tabla users
 * @param params.supabase - Cliente de Supabase autenticado
 * @returns Objeto con success, data (messages), error y status
 */
export async function getHistoryHandler(params: {
  userId: string;
  supabase: SupabaseClient;
}): Promise<{
  success: boolean;
  data?: { messages: any[] };
  error?: string;
  status: number;
}> {
  const { userId, supabase } = params;

  try {
    // Obtener los últimos 50 mensajes del chat del usuario
    // Ordenamos descendente para obtener los MÁS RECIENTES, luego invertimos para orden cronológico
    const { data: messages, error: messagesError } = await supabase
      .from('ia_messages')
      .select('role, content, created_at')
      .eq('user_id', userId)
      .eq('context_type', 'home_chat')
      .order('created_at', { ascending: false })
      .limit(50);

    if (messagesError) {
      return {
        success: false,
        error: "Error fetching chat history",
        status: 500
      };
    }

    // Invertir el orden para que aparezcan cronológicamente (más viejos primero)
    const orderedMessages = (messages || []).reverse();

    // Devolver los mensajes en orden cronológico
    return {
      success: true,
      data: {
        messages: orderedMessages
      },
      status: 200
    };

  } catch (err: any) {
    return {
      success: false,
      error: "Error fetching chat history",
      status: 500
    };
  }
}
