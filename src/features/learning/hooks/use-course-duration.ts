import { useQuery } from '@tanstack/react-query';
import { getCourseDuration } from '../services';
import { learningKeys } from '@/core/query-keys';

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
    queryKey: learningKeys.courseDuration(courseId),
    queryFn: () => getCourseDuration(courseId),
    enabled: !!courseId,
  });
}
