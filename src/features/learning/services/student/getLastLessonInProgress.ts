import { supabase } from '@/lib/supabase';
import { getUserByAuthId } from '@/lib/supabase-helpers';

/**
 * Obtiene la última lección en progreso del usuario en un curso.
 * 
 * Query a course_lesson_progress con JOINs a lessons y modules.
 * Retorna la lección más recientemente actualizada que no esté
 * completada, o la primera lección del curso si no hay progreso.
 * 
 * Útil para el botón "Continuar curso" y para mostrar el progreso
 * actual del usuario.
 * 
 * @param courseId - ID del curso (UUID)
 * @param userId - ID del usuario (UUID) o auth_id
 * @returns Objeto con lesson_id y last_position_sec, o null si no hay lecciones
 * @throws {Error} Si falla la query principal de módulos
 */
export async function getLastLessonInProgress(
  courseId: string | undefined,
  userId: string | undefined
): Promise<{ lesson_id: string; last_position_sec: number } | null> {
  if (!courseId || !userId || !supabase) {
    return null;
  }

  // Si el userId es un UUID del usuario, usarlo directamente
  // Si es un auth_id, obtener el user_id primero
  let actualUserId = userId;
  
  const userRecord = await getUserByAuthId(userId);
  if (userRecord) {
    actualUserId = userRecord.id;
  }

  // Get all modules for this course
  const { data: courseModules, error: modulesError } = await supabase
    .from('course_modules')
    .select('id')
    .eq('course_id', courseId);

  if (modulesError) {
    throw modulesError;
  }

  if (!courseModules || courseModules.length === 0) {
    return null;
  }

  const moduleIds = courseModules.map(m => m.id);

  // Get all lessons for these modules
  const { data: courseLessons, error: lessonsError } = await supabase
    .from('course_lessons')
    .select('id')
    .in('module_id', moduleIds)
    .order('sort_index', { ascending: true });

  if (lessonsError) {
    console.error('Error fetching course lessons:', lessonsError);
    return null;
  }

  if (!courseLessons || courseLessons.length === 0) {
    return null;
  }

  const lessonIds = courseLessons.map(l => l.id);
  const firstLessonId = courseLessons[0].id;

  // Get the most recent lesson in progress
  const { data: progressData, error: progressError } = await supabase
    .from('course_lesson_progress')
    .select(`
      lesson_id,
      last_position_sec,
      is_completed,
      updated_at
    `)
    .eq('user_id', actualUserId)
    .in('lesson_id', lessonIds)
    .order('updated_at', { ascending: false })
    .limit(10);

  if (progressError) {
    console.error('Error fetching lesson progress:', progressError);
    return {
      lesson_id: firstLessonId,
      last_position_sec: 0
    };
  }

  if (!progressData || progressData.length === 0) {
    // No progress yet, return first lesson
    return {
      lesson_id: firstLessonId,
      last_position_sec: 0
    };
  }

  // Find first lesson that's not completed
  const inProgressLesson = progressData.find(p => !p.is_completed);
  
  // If no lesson in progress, return the most recently updated one
  const selectedLesson = inProgressLesson || progressData[0];

  return {
    lesson_id: selectedLesson.lesson_id,
    last_position_sec: selectedLesson.last_position_sec || 0
  };
}
