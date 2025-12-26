import { apiRequest } from '@/lib/queryClient';

/**
 * Obtiene los marcadores recientes de un curso.
 * 
 * Retorna un array de marcadores recientes del curso ordenados por fecha de creación.
 * Solo incluye marcadores del usuario actual.
 * 
 * Usa el cliente centralizado apiRequest que maneja automáticamente
 * la autenticación y headers.
 * 
 * @param courseId - ID del curso
 * @returns Array de marcadores recientes del curso
 * @throws {Error} Si falla la autenticación o la petición HTTP
 */
export async function getCourseRecentMarkers(courseId: string): Promise<any[]> {
  if (!courseId) {
    return [];
  }

  const response = await apiRequest('GET', `/api/courses/${courseId}/recent-markers`);
  return await response.json();
}
