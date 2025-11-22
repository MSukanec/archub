import { supabase } from '@/lib/supabase';
import type { LessonMarker } from '../types';

/**
 * Obtiene todos los marcadores de una lección.
 * 
 * Los marcadores son notas con timestamp (time_sec) que permiten
 * marcar puntos específicos en videos.
 * 
 * Retorna ordenados por tiempo en el video (time_sec ascendente).
 * Solo incluye marcadores del usuario actual.
 * 
 * @param lessonId - ID de la lección
 * @returns Array de marcadores de la lección
 * @throws {Error} Si falla la autenticación o la petición HTTP
 */
export async function getLessonMarkers(lessonId: string): Promise<LessonMarker[]> {
  if (!lessonId) {
    return [];
  }

  const { data } = await supabase.auth.getSession();
  const session = data?.session;
  
  if (!session) {
    throw new Error('No active session');
  }

  const response = await fetch(`/api/lessons/${lessonId}/markers`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch lesson markers' }));
    throw new Error(error.error || 'Failed to fetch lesson markers');
  }

  return await response.json();
}
