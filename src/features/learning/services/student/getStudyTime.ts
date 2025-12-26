import { supabase } from '@/lib/supabase';
import { getUserByAuthId } from '@/lib/supabase-helpers';
/**
 * Obtiene el tiempo total de estudio del usuario.
 * 
 * Calcula el tiempo sumando last_position_sec de todas las lecciones
 * del usuario. Si se proporciona courseId, filtra solo por ese curso.
 * 
 * Útil para mostrar estadísticas de tiempo de estudio y progreso
 * del usuario.
 * 
 * @param userId - ID del usuario (UUID) o auth_id
 * @param courseId - (Opcional) ID del curso para filtrar por curso específico
 * @returns Objeto con total_seconds, o { total_seconds: 0 } si falla
 */
export async function getStudyTime(
  userId: string | undefined,
  courseId?: string
): Promise<{ total_seconds: number }> {
  if (!userId || !supabase) {
    return { total_seconds: 0 };
  }
  // Si el userId es un UUID del usuario, usarlo directamente
  // Si es un auth_id, obtener el user_id primero
  let actualUserId = userId;
  
  const userRecord = await getUserByAuthId(userId);
  if (userRecord) {
    actualUserId = userRecord.id;
  }
  try {
    // Si hay courseId, filtrar por curso específico
    if (courseId) {
      // Get all modules for this course
      const { data: courseModules } = await supabase
        .from('course_modules')
        .select('id')
        .eq('course_id', courseId);
      if (!courseModules || courseModules.length === 0) {
        return { total_seconds: 0 };
      }
      const moduleIds = courseModules.map(m => m.id);
      // Get all lessons for these modules
      const { data: courseLessons } = await supabase
        .from('course_lessons')
        .select('id')
        .in('module_id', moduleIds);
      if (!courseLessons || courseLessons.length === 0) {
        return { total_seconds: 0 };
      }
      const lessonIds = courseLessons.map(l => l.id);
      // Get sum of last_position_sec for all lessons in this course
      const { data: progressData, error } = await supabase
        .from('course_lesson_progress')
        .select('last_position_sec')
        .eq('user_id', actualUserId)
        .in('lesson_id', lessonIds);
      if (error) {
        console.error('Error fetching study time:', error);
        return { total_seconds: 0 };
      }
      const totalSeconds = progressData?.reduce((sum, p) => sum + (p.last_position_sec || 0), 0) || 0;
      
      return { total_seconds: totalSeconds };
    } else {
      // Sin courseId, obtener tiempo total de todos los cursos
      const { data: progressData, error } = await supabase
        .from('course_lesson_progress')
        .select('last_position_sec')
        .eq('user_id', actualUserId);
      if (error) {
        console.error('Error fetching study time:', error);
        return { total_seconds: 0 };
      }
      const totalSeconds = progressData?.reduce((sum, p) => sum + (p.last_position_sec || 0), 0) || 0;
      
      return { total_seconds: totalSeconds };
    }
  } catch (error) {
    console.error('Error in getStudyTime:', error);
    return { total_seconds: 0 };
  }
}
