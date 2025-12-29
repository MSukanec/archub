import { useQuery } from '@tanstack/react-query';
import { getCourseRecentMarkers } from '../services';
import { LEARNING_QUERY_KEYS } from '../constants';

/**
 * Hook para obtener los marcadores recientes de un curso.
 * 
 * Retorna un array de marcadores recientes del curso ordenados por fecha de creación.
 * Solo incluye marcadores del usuario actual.
 */
export function useCourseRecentMarkers(courseId: string | undefined) {
  return useQuery({
    queryKey: LEARNING_QUERY_KEYS.courseRecentMarkers(courseId!),
    queryFn: () => getCourseRecentMarkers(courseId!),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}
