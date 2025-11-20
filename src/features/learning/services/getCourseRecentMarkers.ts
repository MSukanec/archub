import { supabase } from '@/lib/supabase';

/**
 * Obtiene los marcadores recientes de un curso.
 * 
 * Retorna un array de marcadores recientes del curso ordenados por fecha de creación.
 * Solo incluye marcadores del usuario actual.
 * 
 * @param courseId - ID del curso
 * @returns Array de marcadores recientes del curso
 * @throws {Error} Si falla la autenticación o la petición HTTP
 */
export async function getCourseRecentMarkers(courseId: string): Promise<any[]> {
  if (!courseId) {
    return [];
  }

  const { data } = await supabase.auth.getSession();
  const session = data?.session;
  
  if (!session) {
    throw new Error('No active session');
  }

  const response = await fetch(`/api/courses/${courseId}/recent-markers`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch course recent markers' }));
    throw new Error(error.error || 'Failed to fetch course recent markers');
  }

  return await response.json();
}
