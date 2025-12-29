import { useQuery } from '@tanstack/react-query';
import { getCourseStructure } from '../services';
import { learningKeys } from '@/core/query-keys';

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
    queryKey: learningKeys.courseStructure(courseId),
    queryFn: () => getCourseStructure(courseId!),
    enabled: !!courseId,
  });
}
