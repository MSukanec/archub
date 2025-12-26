import { supabase } from '@/lib/supabase';

/**
 * Resumen de lecciones por curso
 */
export interface CourseLessonsSummary {
  totalLessons: number;
  totalDurationSec: number;
}

/**
 * Obtiene un resumen de lecciones para múltiples cursos.
 * 
 * Para cada curso en courseIds, calcula:
 * - Total de lecciones activas
 * - Duración total del curso (suma de duration_sec)
 * 
 * Optimizado para renderizar listas de cursos sin hacer
 * múltiples queries separadas.
 * 
 * @param courseIds - Array de IDs de cursos (UUID)
 * @returns Map de courseId -> { totalLessons, totalDurationSec }
 */
export async function getCourseLessonsSummary(
  courseIds: string[]
): Promise<Map<string, CourseLessonsSummary>> {
  const summaryMap = new Map<string, CourseLessonsSummary>();

  if (!courseIds || courseIds.length === 0 || !supabase) {
    return summaryMap;
  }

  try {
    // Get all lessons for all courses in one query
    const { data: lessonsData, error } = await supabase
      .from('course_lessons')
      .select('id, duration_sec, course_modules!inner(course_id)')
      .eq('is_active', true)
      .in('course_modules.course_id', courseIds);

    if (error) {
      console.error('Error fetching course lessons summary:', error);
      return summaryMap;
    }

    if (!lessonsData || lessonsData.length === 0) {
      // Si no hay lecciones, retornar map vacío (los cursos tendrán valores por defecto)
      courseIds.forEach(courseId => {
        summaryMap.set(courseId, {
          totalLessons: 0,
          totalDurationSec: 0
        });
      });
      return summaryMap;
    }

    // Group lessons by course_id and calculate totals
    courseIds.forEach(courseId => {
      const courseLessons = lessonsData.filter((lesson: any) => 
        lesson.course_modules?.course_id === courseId
      );
      
      const totalLessons = courseLessons.length;
      const totalDurationSec = courseLessons.reduce(
        (sum: number, lesson: any) => sum + (lesson.duration_sec || 0), 
        0
      );

      summaryMap.set(courseId, {
        totalLessons,
        totalDurationSec
      });
    });

    return summaryMap;
  } catch (error) {
    console.error('Error in getCourseLessonsSummary:', error);
    return summaryMap;
  }
}
