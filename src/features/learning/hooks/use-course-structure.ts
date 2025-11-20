import { useQuery } from '@tanstack/react-query';
import { getCourseStructure } from '../services';
import { LEARNING_QUERY_KEYS } from '../constants';

/**
 * Hook para obtener la estructura completa de un curso (módulos y lecciones).
 * 
 * Query directa a Supabase que incluye:
 * - Módulos del curso (course_modules)
 * - Lecciones de cada módulo (course_lessons)
 * 
 * No incluye progreso del usuario. Útil para mostrar la estructura
 * del curso de forma rápida sin datos de autenticación.
 */
export function useCourseStructure(courseId: string | undefined) {
  return useQuery({
    queryKey: LEARNING_QUERY_KEYS.courseStructure(courseId!),
    queryFn: () => getCourseStructure(courseId!),
    enabled: !!courseId,
  });
}
