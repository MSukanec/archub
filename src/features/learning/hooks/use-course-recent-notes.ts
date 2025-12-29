import { useQuery } from '@tanstack/react-query';
import { getCourseRecentNotes } from '../services';
import { learningKeys } from '@/core/query-keys';

/**
 * Hook para obtener las notas recientes de un curso.
 * 
 * Retorna un array de notas recientes del curso ordenadas por fecha de creación.
 * Solo incluye notas del usuario actual.
 */
export function useCourseRecentNotes(courseId: string | undefined) {
  return useQuery({
    queryKey: learningKeys.courseRecentNotes(courseId),
    queryFn: () => getCourseRecentNotes(courseId!),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}
