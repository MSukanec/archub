import { useQuery } from '@tanstack/react-query';
import { getCourseRecentMarkers } from '../services';
/**
 * Hook para obtener los marcadores recientes de un curso.
 * 
 * Retorna un array de marcadores recientes del curso ordenados por fecha de creación.
 * Solo incluye marcadores del usuario actual.
 */
export function useCourseRecentMarkers(courseId: string | undefined) {
  return useQuery({
    queryKey: [`/api/courses/${courseId}/recent-markers`],
    queryFn: () => getCourseRecentMarkers(courseId!),
    enabled: !!courseId,
  });
}
