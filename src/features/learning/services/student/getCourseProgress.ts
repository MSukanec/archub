import { supabase } from '@/lib/supabase';
import type { CourseLessonProgress } from '@shared/schema';
/**
 * Obtiene el progreso de todas las lecciones de un curso.
 * 
 * Retorna el progreso del usuario para cada lección del curso,
 * incluyendo porcentaje completado, última posición, y estado de favorito.
 * 
 * @param courseId - ID del curso
 * @returns Array de progreso de lecciones del curso
 * @throws {Error} Si falla la autenticación o la petición HTTP
 */
export async function getCourseProgress(courseId: string): Promise<CourseLessonProgress[]> {
  if (!courseId) {
    return [];
  }
  const { data } = await supabase.auth.getSession();
  const session = data?.session;
  
  if (!session) {
    throw new Error('No active session');
  }
  const response = await fetch(`/api/courses/${courseId}/progress`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    credentials: 'include',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch course progress'}));
    throw new Error(error.error || 'Failed to fetch course progress');
  }
  return await response.json();
}
