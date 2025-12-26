import { useQuery } from '@tanstack/react-query';
import { getLastLessonInProgress } from '../services';
import { LEARNING_QUERY_KEYS } from '../constants';
/**
 * Hook para obtener la última lección en progreso del usuario.
 * 
 * Retorna la lección más recientemente actualizada que no esté
 * completada, o la primera lección del curso si no hay progreso.
 * 
 * Útil para:
 * - Botón "Continuar curso"
 * - Mostrar progreso actual
 * - Auto-navegar a la lección en progreso
 * 
 * @param courseId - ID del curso (UUID)
 * @param userId - ID del usuario (UUID) o auth_id
 */
export function useLastLessonInProgress(
  courseId: string | undefined,
  userId: string | undefined
) {
  return useQuery({
    queryKey: LEARNING_QUERY_KEYS.lastLessonInProgress(courseId!, userId!),
    queryFn: () => getLastLessonInProgress(courseId, userId),
    enabled: !!courseId && !!userId,
    staleTime: 10000, // 10 seconds
    refetchInterval: 15000, // Auto refresh every 15s
  });
}
