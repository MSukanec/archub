import { useQuery } from '@tanstack/react-query';
import { getCourseDuration } from '../services';
import { LEARNING_QUERY_KEYS } from '../constants';

/**
 * Hook para obtener la duración total de un curso.
 * 
 * Suma las duraciones de todas las lecciones activas del curso.
 * 
 * Útil para:
 * - Mostrar duración estimada del curso
 * - Calcular porcentajes de progreso
 * - Planificación de estudio
 * 
 * @param courseId - ID del curso (UUID)
 */
export function useCourseDuration(courseId: string | undefined) {
  return useQuery({
    queryKey: LEARNING_QUERY_KEYS.courseDuration(courseId!),
    queryFn: () => getCourseDuration(courseId),
    enabled: !!courseId,
  });
}
