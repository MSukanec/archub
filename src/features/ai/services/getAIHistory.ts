/**
 * Get AI History Service
 * 
 * Obtiene el historial de conversación del usuario con la IA.
 * Este historial incluye todos los mensajes previos del chat.
 * 
 * @returns Historial de mensajes de chat
 * @throws {Error} Si falla la autenticación o la petición al servidor
 */

import { supabase } from '@/lib/supabase';
import type { AIHistoryResponse } from '../types';

export async function getAIHistory(): Promise<AIHistoryResponse> {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session?.access_token) {
    throw new Error('No active session');
  }

  const response = await fetch('/api/ai/history', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Error loading AI history');
  }

  const data = await response.json();
  
  return {
    messages: data?.messages || []
  };
}
