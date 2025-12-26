import { useQuery } from '@tanstack/react-query';
import { getCourseProgress } from '../services';
import { LEARNING_QUERY_KEYS } from '../constants';
/**
 * Hook para obtener el progreso de todas las lecciones de un curso.
 * 
 * Retorna el progreso del usuario para cada lección del curso,
 * incluyendo porcentaje completado, última posición, y estado de favorito.
 */
export function useCourseProgress(courseId: string | undefined) {
  return useQuery({
    queryKey: LEARNING_QUERY_KEYS.courseProgress(courseId!),
    queryFn: () => getCourseProgress(courseId!),
    enabled: !!courseId,
  });
}
