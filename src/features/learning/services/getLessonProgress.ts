import { supabase } from '@/lib/supabase';
import type { CourseLessonProgress } from '@shared/schema';

/**
 * Obtiene el progreso de una lección específica para el usuario actual.
 * 
 * Query directa a la tabla course_lesson_progress.
 * Retorna null si el usuario no tiene progreso registrado.
 * 
 * @param lessonId - ID de la lección
 * @param userId - ID del usuario (desde la tabla users, no auth)
 * @returns Progreso de la lección o null si no existe
 * @throws {Error} Si falla la query principal
 */
export async function getLessonProgress(
  lessonId: string,
  userId: string
): Promise<CourseLessonProgress | null> {
  if (!lessonId || !userId) {
    return null;
  }

  const { data, error } = await supabase
    .from('course_lesson_progress')
    .select('*')
    .eq('lesson_id', lessonId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
