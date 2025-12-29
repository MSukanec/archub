import { useQuery } from '@tanstack/react-query';
import { getStudyTime } from '../services';
import { learningKeys } from '@/core/query-keys';

/**
 * Hook para obtener el tiempo total de estudio del usuario.
 * 
 * Calcula el tiempo sumando last_position_sec de todas las lecciones.
 * Si se proporciona courseId, filtra solo por ese curso.
 * 
 * Útil para:
 * - Mostrar estadísticas de tiempo de estudio
 * - Dashboards de progreso
 * - Gamificación y logros
 * 
 * @param userId - ID del usuario (UUID) o auth_id
 * @param courseId - (Opcional) ID del curso para filtrar por curso específico
 */
export function useStudyTime(
  userId: string | undefined,
  courseId?: string
) {
  return useQuery({
    queryKey: learningKeys.studyTime(userId, courseId),
    queryFn: () => getStudyTime(userId, courseId),
    enabled: !!userId,
  });
}
