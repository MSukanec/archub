import { useQuery } from '@tanstack/react-query';
import { getCourseEnrollment } from '../services';
import { LEARNING_QUERY_KEYS } from '../constants';

/**
 * Hook para obtener el enrollment del usuario en un curso.
 * 
 * Consulta la tabla course_enrollments para verificar si el usuario
 * tiene acceso al curso y obtener metadatos del enrollment.
 * 
 * Útil para:
 * - Verificar acceso al curso
 * - Mostrar fechas de inicio/expiración
 * - Validar permisos antes de reproducir contenido
 * 
 * @param courseId - ID del curso (UUID)
 * @param userId - ID del usuario (UUID) o auth_id
 */
export function useCourseEnrollment(
  courseId: string | undefined,
  userId: string | undefined
) {
  return useQuery({
    queryKey: LEARNING_QUERY_KEYS.courseEnrollment(courseId!, userId!),
    queryFn: () => getCourseEnrollment(courseId, userId),
    enabled: !!courseId && !!userId,
  });
}
