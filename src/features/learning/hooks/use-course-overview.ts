import { useQuery } from '@tanstack/react-query';
import { getCourseOverview } from '../services';
import { learningKeys } from '@/core/query-keys';

/**
 * Hook para obtener la información básica de un curso.
 * 
 * Acepta courseId (UUID) o courseSlug como parámetro.
 * Query directa a la tabla courses sin módulos, lecciones ni progreso.
 * 
 * Útil para páginas de landing, listados, y cargas rápidas.
 */
export function useCourseOverview(courseIdOrSlug: string | undefined) {
  return useQuery({
    queryKey: learningKeys.courseOverview(courseIdOrSlug),
    queryFn: () => getCourseOverview(courseIdOrSlug!),
    enabled: !!courseIdOrSlug,
    staleTime: 5 * 60 * 1000, // 5 minutes - course data doesn't change often
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });
}
