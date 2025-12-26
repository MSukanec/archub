import { useQuery } from '@tanstack/react-query';
import { getLessonDetails } from '../services';
import { LEARNING_QUERY_KEYS } from '../constants';
/**
 * Hook para obtener los detalles básicos de una lección.
 * 
 * Consulta la información esencial de una lección específica:
 * id, título y duración en segundos.
 * 
 * El query se ejecuta solo cuando hay un lessonId válido.
 * 
 * Útil para:
 * - Mostrar información de lecciones en dashboards
 * - Renderizar detalles de lecciones en progreso
 * - Componentes que requieren datos básicos de lecciones
 * 
 * @param lessonId - ID de la lección (UUID)
 * @returns Query con datos de la lección o null
 */
export function useLessonDetails(lessonId: string | undefined) {
  return useQuery({
    queryKey: LEARNING_QUERY_KEYS.lesson(lessonId!),
    queryFn: () => getLessonDetails(lessonId),
    enabled: !!lessonId,
  });
}
