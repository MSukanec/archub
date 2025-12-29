import { useQuery } from '@tanstack/react-query';
import { getLearningCourses } from '../services';
import { learningKeys } from '@/core/query-keys';

/**
 * Hook para obtener todos los cursos con enrollments y progreso del usuario.
 * 
 * Incluye:
 * - Información completa del curso
 * - Estado de enrollment (si está inscrito)
 * - Progreso del usuario en cada curso
 * - Módulos y lecciones
 */
export function useLearningCourses() {
  return useQuery({
    queryKey: learningKeys.coursesFull(),
    queryFn: () => getLearningCourses(),
  });
}
