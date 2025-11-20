import { useQuery } from '@tanstack/react-query';
import { getLessonMarkers } from '../services';
import { LEARNING_QUERY_KEYS } from '../constants';

/**
 * Hook para obtener todos los marcadores de una lección.
 * 
 * Los marcadores son notas con timestamp (time_sec) que permiten
 * marcar puntos específicos en videos.
 * 
 * Retorna ordenados por tiempo en el video (time_sec ascendente).
 * Solo incluye marcadores del usuario actual.
 */
export function useLessonMarkers(lessonId: string | undefined) {
  return useQuery({
    queryKey: LEARNING_QUERY_KEYS.lessonMarkers(lessonId!),
    queryFn: () => getLessonMarkers(lessonId!),
    enabled: !!lessonId,
  });
}
