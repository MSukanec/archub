import { useQuery } from '@tanstack/react-query';
import { getLessonNotes } from '../services';
import { LEARNING_QUERY_KEYS } from '../constants';
/**
 * Hook para obtener todas las notas de una lección.
 * 
 * Retorna las notas ordenadas por fecha de creación (más recientes primero).
 * Solo incluye notas del usuario actual.
 */
export function useLessonNotes(lessonId: string | undefined) {
  return useQuery({
    queryKey: LEARNING_QUERY_KEYS.lessonNotes(lessonId!),
    queryFn: () => getLessonNotes(lessonId!),
    enabled: !!lessonId,
  });
}
