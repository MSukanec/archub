import { useQuery } from '@tanstack/react-query';
import { getCourseMarkers, type MarkerWithLesson } from '../services';
import { learningKeys } from '@/core/query-keys';

/**
 * Hook para obtener todos los marcadores de un curso.
 * 
 * Obtiene todos los marcadores (notas con timestamp) del curso completo,
 * incluyendo información de lección y módulo asociados.
 * 
 * Usa el patrón estándar del proyecto:
 * - queryKey centralizado en learningKeys
 * - queryFn que llama al servicio getCourseMarkers
 * 
 * @param courseId - ID del curso (opcional)
 * @returns Query con los marcadores del curso
 */
export function useCourseMarkers(courseId?: string) {
  return useQuery<MarkerWithLesson[]>({
    queryKey: learningKeys.courseMarkers(courseId),
    queryFn: () => getCourseMarkers(courseId!),
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

export type { MarkerWithLesson };
