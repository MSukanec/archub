import { useQuery } from '@tanstack/react-query';
import { getLessonProgress } from '../services';
import { learningKeys } from '@/core/query-keys';

/**
 * Hook para obtener el progreso de una lección específica.
 * 
 * Query directa a la tabla course_lesson_progress.
 * Retorna null si el usuario no tiene progreso registrado.
 */
export function useLessonProgress(lessonId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: learningKeys.lessonProgress(lessonId),
    queryFn: () => getLessonProgress(lessonId!, userId!),
    enabled: !!lessonId && !!userId,
  });
}
