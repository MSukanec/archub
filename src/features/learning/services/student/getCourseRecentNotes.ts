import { supabase } from '@/lib/supabase';
/**
 * Obtiene las notas recientes de un curso.
 * 
 * Retorna un array de notas recientes del curso ordenadas por fecha de creación.
 * Solo incluye notas del usuario actual.
 * 
 * @param courseId - ID del curso
 * @returns Array de notas recientes del curso
 * @throws {Error} Si falla la autenticación o la petición HTTP
 */
export async function getCourseRecentNotes(courseId: string): Promise<any[]> {
  if (!courseId) {
    return [];
  }
  const { data } = await supabase.auth.getSession();
  const session = data?.session;
  
  if (!session) {
    throw new Error('No active session');
  }
  const response = await fetch(`/api/courses/${courseId}/recent-notes`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch course recent notes'}));
    throw new Error(error.error || 'Failed to fetch course recent notes');
  }
  return await response.json();
}
