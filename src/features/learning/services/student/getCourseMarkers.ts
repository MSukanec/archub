import { apiRequest } from '@/lib/queryClient';
export interface MarkerWithLesson {
  id: string;
  user_id: string;
  lesson_id: string;
  body: string;
  time_sec: number | null;
  is_pinned: boolean;
  note_type: string;
  created_at: string;
  updated_at: string;
  lesson?: {
    title: string;
    module_id: string;
  };
  module?: {
    title: string;
    sort_index: number;
  };
}
/**
 * Construye la URL del endpoint de marcadores de curso.
 * 
 * Los marcadores son notas con timestamp (time_sec) que permiten
 * marcar puntos específicos en videos.
 * 
 * El endpoint retorna todos los marcadores del curso con información 
 * de lección y módulo. Solo incluye marcadores del usuario actual.
 * 
 * La autenticación se maneja automáticamente vía apiRequest.
 * 
 * @param courseId - ID del curso
 * @returns URL del endpoint
 */
export function getCourseMarkersUrl(courseId: string): string {
  return `/api/courses/${courseId}/markers`;
}
/**
 * Obtiene todos los marcadores de un curso.
 * 
 * Retorna todos los marcadores (notas con timestamp) del curso completo,
 * incluyendo información de lección y módulo asociados.
 * Solo incluye marcadores del usuario actual.
 * 
 * Usa el cliente centralizado apiRequest que maneja automáticamente
 * la autenticación y headers.
 * 
 * @param courseId - ID del curso
 * @returns Array de marcadores del curso con información de lección y módulo
 * @throws {Error} Si falla la autenticación o la petición HTTP
 */
export async function getCourseMarkers(courseId: string): Promise<MarkerWithLesson[]> {
  if (!courseId) {
    return [];
  }
  const response = await apiRequest('GET', getCourseMarkersUrl(courseId));
  return await response.json();
}
