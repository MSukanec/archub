import { useQuery } from '@tanstack/react-query';
import { getCourseRecentMarkers } from '../services';
import { learningKeys } from '@/core/query-keys';

/**
 * Hook para obtener los marcadores recientes de un curso.
 * 
 * Retorna un array de marcadores recientes del curso ordenados por fecha de creación.
 * Solo incluye marcadores del usuario actual.
 */
export function useCourseRecentMarkers(courseId: string | undefined) {
  return useQuery({
    queryKey: learningKeys.courseRecentMarkers(courseId),
    queryFn: () => getCourseRecentMarkers(courseId!),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}
