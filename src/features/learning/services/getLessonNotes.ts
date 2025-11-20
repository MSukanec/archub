import { supabase } from '@/lib/supabase';
import type { LessonNote } from '../types';

/**
 * Obtiene todas las notas de una lección.
 * 
 * Retorna las notas ordenadas por fecha de creación (más recientes primero).
 * Solo incluye notas del usuario actual.
 * 
 * @param lessonId - ID de la lección
 * @returns Array de notas de la lección
 * @throws {Error} Si falla la autenticación o la petición HTTP
 */
export async function getLessonNotes(lessonId: string): Promise<LessonNote[]> {
  if (!lessonId) {
    return [];
  }

  const { data } = await supabase.auth.getSession();
  const session = data?.session;
  
  if (!session) {
    throw new Error('No active session');
  }

  const response = await fetch(`/api/lessons/${lessonId}/notes`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch lesson notes' }));
    throw new Error(error.error || 'Failed to fetch lesson notes');
  }

  return await response.json();
}
