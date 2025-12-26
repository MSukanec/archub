import { useQuery } from '@tanstack/react-query';
import { getCourseRecentNotes } from '../services';

/**
 * Hook para obtener las notas recientes de un curso.
 * 
 * Retorna un array de notas recientes del curso ordenadas por fecha de creación.
 * Solo incluye notas del usuario actual.
 */
export function useCourseRecentNotes(courseId: string | undefined) {
  return useQuery({
    queryKey: [`/api/courses/${courseId}/recent-notes`],
    queryFn: () => getCourseRecentNotes(courseId!),
    enabled: !!courseId,
  });
}
