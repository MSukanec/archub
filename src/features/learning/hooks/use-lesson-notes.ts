import { useQuery } from '@tanstack/react-query';
import { getLessonNotes } from '../services';
import { learningKeys } from '@/core/query-keys';

/**
 * Hook para obtener todas las notas de una lección.
 * 
 * Retorna las notas ordenadas por fecha de creación (más recientes primero).
 * Solo incluye notas del usuario actual.
 */
export function useLessonNotes(lessonId: string | undefined) {
  return useQuery({
    queryKey: learningKeys.lessonNotes(lessonId),
    queryFn: () => getLessonNotes(lessonId!),
    enabled: !!lessonId,
  });
}
