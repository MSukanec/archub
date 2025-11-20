import { useQuery } from '@tanstack/react-query';
import { getCourseOverview } from '../services';
import { LEARNING_QUERY_KEYS } from '../constants';

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
    queryKey: LEARNING_QUERY_KEYS.courseOverview(courseIdOrSlug!),
    queryFn: () => getCourseOverview(courseIdOrSlug!),
    enabled: !!courseIdOrSlug,
  });
}
