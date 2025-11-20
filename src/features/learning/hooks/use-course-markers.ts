import { useQuery } from '@tanstack/react-query';
import { getCourseMarkersUrl, getCourseMarkers, type MarkerWithLesson } from '../services';

/**
 * Hook para obtener todos los marcadores de un curso.
 * 
 * Obtiene todos los marcadores (notas con timestamp) del curso completo,
 * incluyendo información de lección y módulo asociados.
 * 
 * Usa el patrón estándar del proyecto:
 * - queryKey con URL del endpoint
 * - queryFn que llama al servicio getCourseMarkers
 * 
 * @param courseId - ID del curso (opcional)
 * @returns Query con los marcadores del curso
 */
export function useCourseMarkers(courseId?: string) {
  return useQuery<MarkerWithLesson[]>({
    queryKey: courseId ? [getCourseMarkersUrl(courseId)] : [],
    queryFn: () => getCourseMarkers(courseId!),
    enabled: !!courseId,
    staleTime: 1000 * 60 * 5,
  });
}

export type { MarkerWithLesson };
