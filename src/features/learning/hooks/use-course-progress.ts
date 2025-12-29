import { useQuery } from '@tanstack/react-query';
import { getCourseProgress } from '../services';
import { learningKeys } from '@/core/query-keys';

/**
 * Hook para obtener el progreso de todas las lecciones de un curso.
 * 
 * Retorna el progreso del usuario para cada lección del curso,
 * incluyendo porcentaje completado, última posición, y estado de favorito.
 */
export function useCourseProgress(courseId: string | undefined) {
  return useQuery({
    queryKey: learningKeys.courseProgress(courseId),
    queryFn: () => getCourseProgress(courseId!),
    enabled: !!courseId,
  });
}
