import { useQuery } from '@tanstack/react-query';
import { getLastLessonInProgress } from '../services';
import { learningKeys } from '@/core/query-keys';

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
    queryKey: learningKeys.lastLessonInProgress(courseId, userId),
    queryFn: () => getLastLessonInProgress(courseId, userId),
    enabled: !!courseId && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes - lesson progress data
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
  });
}
