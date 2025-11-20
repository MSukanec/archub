import { useQuery } from '@tanstack/react-query';
import { getCourseLessonsSummary } from '../services';
import { LEARNING_QUERY_KEYS } from '../constants';

/**
 * Hook para obtener resumen de lecciones de múltiples cursos.
 * 
 * Para cada curso en courseIds, retorna:
 * - Total de lecciones activas
 * - Duración total del curso
 * 
 * Optimizado para renderizar listas de cursos sin hacer
 * múltiples queries separadas.
 * 
 * Útil para:
 * - Listados de cursos
 * - Tarjetas de curso con metadata
 * - Comparación de cursos
 * 
 * @param courseIds - Array de IDs de cursos (UUID)
 */
export function useCourseLessonsSummary(courseIds: string[]) {
  return useQuery({
    queryKey: LEARNING_QUERY_KEYS.courseLessonsSummary(courseIds),
    queryFn: () => getCourseLessonsSummary(courseIds),
    enabled: courseIds.length > 0,
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
  });
}
