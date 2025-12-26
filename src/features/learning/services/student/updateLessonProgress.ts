import { supabase } from '@/lib/supabase';
import type { CourseLessonProgress } from '@shared/schema';
import type { UpdateLessonProgressPayload } from '../types';
/**
 * Actualiza el progreso de una lección específica.
 * 
 * Permite actualizar:
 * - Porcentaje de progreso
 * - Última posición en segundos (para videos)
 * - Estado de completado
 * - Fecha de completado
 * 
 * Auto-completa la lección cuando el progreso >= 95%.
 * 
 * @param payload - Datos de progreso a actualizar
 * @returns Progreso de la lección actualizado
 * @throws {Error} Si falla la autenticación o la petición HTTP
 */
export async function updateLessonProgress(
  payload: UpdateLessonProgressPayload
): Promise<CourseLessonProgress> {
  const { lessonId, ...body } = payload;
  
  if (!lessonId) {
    throw new Error('Lesson ID is required');
  }
  const { data } = await supabase.auth.getSession();
  const session = data?.session;
  
  if (!session) {
    throw new Error('No active session');
  }
  const response = await fetch(`/api/lessons/${lessonId}/progress`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to update lesson progress'}));
    throw new Error(error.error || 'Failed to update lesson progress');
  }
  return await response.json();
}
