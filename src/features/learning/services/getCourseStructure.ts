import { supabase } from '@/lib/supabase';
import type { CourseModuleWithLessons } from '../types';

/**
 * Obtiene la estructura completa de un curso (módulos y lecciones).
 * 
 * Query directa a Supabase que incluye:
 * - Módulos del curso (course_modules)
 * - Lecciones de cada módulo (course_lessons)
 * 
 * No incluye progreso del usuario. Útil para mostrar la estructura
 * del curso de forma rápida sin datos de autenticación.
 * 
 * @param courseId - ID del curso
 * @returns Array de módulos con sus lecciones anidadas
 * @throws {Error} Si falla la query principal de módulos
 */
export async function getCourseStructure(
  courseId: string
): Promise<CourseModuleWithLessons[]> {
  if (!courseId) {
    return [];
  }

  // Query principal - obtener módulos
  const { data: modules, error: modulesError } = await supabase
    .from('course_modules')
    .select('*')
    .eq('course_id', courseId)
    .order('order_index', { ascending: true });

  if (modulesError) {
    throw modulesError;
  }

  if (!modules || modules.length === 0) {
    return [];
  }

  // Query de relaciones - obtener lecciones
  const moduleIds = modules.map(m => m.id);
  
  const { data: lessons, error: lessonsError } = await supabase
    .from('course_lessons')
    .select('*')
    .in('module_id', moduleIds)
    .order('order_index', { ascending: true });

  if (lessonsError) {
    console.error('Error fetching course lessons:', lessonsError);
  }

  // Combinar datos - anidar lecciones en módulos
  return modules.map(module => ({
    ...module,
    lessons: lessons?.filter(lesson => lesson.module_id === module.id) || []
  }));
}
