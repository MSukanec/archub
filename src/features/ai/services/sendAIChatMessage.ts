/**
 * Send AI Chat Message Service
 * 
 * Envía un mensaje al asistente de IA y obtiene la respuesta.
 * El mensaje se procesa a través del pipeline de IA que incluye
 * clasificación de intención, resolución de entidades y generación de respuesta.
 * 
 * @param message - Mensaje del usuario para enviar a la IA
 * @returns Respuesta de la IA
 * @throws {Error} Si falla la autenticación o la petición al servidor
 */
import { supabase } from '@/lib/supabase';
import type { AIChatResponse } from '../types';
export async function sendAIChatMessage(message: string): Promise<AIChatResponse> {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }
  if (!message || !message.trim()) {
    throw new Error('Message cannot be empty');
  }
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('No active session');
  }
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message: message.trim() })
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error sending message');
  }
  const data = await response.json();
  
  return {
    response: data.response || ''
  };
}
