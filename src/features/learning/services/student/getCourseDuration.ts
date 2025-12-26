import { supabase } from '@/lib/supabase';
/**
 * Obtiene la duración total de un curso.
 * 
 * Suma las duraciones (duration_sec) de todas las lecciones activas
 * del curso, recorriendo módulos y lecciones.
 * 
 * Útil para mostrar la duración estimada del curso y calcular
 * porcentajes de progreso.
 * 
 * @param courseId - ID del curso (UUID)
 * @returns Objeto con total_seconds, o { total_seconds: 0 } si falla
 */
export async function getCourseDuration(
  courseId: string | undefined
): Promise<{ total_seconds: number }> {
  if (!courseId || !supabase) {
    return { total_seconds: 0 };
  }
  try {
    // Get all modules for this course
    const { data: courseModules, error: modulesError } = await supabase
      .from('course_modules')
      .select('id')
      .eq('course_id', courseId);
    if (modulesError) {
      console.error('Error fetching course modules:', modulesError);
      return { total_seconds: 0 };
    }
    if (!courseModules || courseModules.length === 0) {
      return { total_seconds: 0 };
    }
    const moduleIds = courseModules.map(m => m.id);
    // Get all lessons for these modules with their durations
    const { data: courseLessons, error: lessonsError } = await supabase
      .from('course_lessons')
      .select('duration_sec')
      .in('module_id', moduleIds)
      .eq('is_active', true);
    if (lessonsError) {
      console.error('Error fetching course lessons:', lessonsError);
      return { total_seconds: 0 };
    }
    if (!courseLessons || courseLessons.length === 0) {
      return { total_seconds: 0 };
    }
    const totalSeconds = courseLessons.reduce((sum, lesson) => sum + (lesson.duration_sec || 0), 0);
    
    return { total_seconds: totalSeconds };
  } catch (error) {
    console.error('Error in getCourseDuration:', error);
    return { total_seconds: 0 };
  }
}
