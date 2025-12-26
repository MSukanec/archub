import { supabase } from '@/lib/supabase';
import type { CourseModuleWithLessons } from '../types';
/**
 * Obtiene la estructura completa de un curso (módulos y lecciones).
 * 
 * Llamada a backend endpoint que incluye:
 * - Módulos del curso (course_modules)
 * - Lecciones de cada módulo (course_lessons)
 * 
 * Usa autenticación del usuario para acceso seguro.
 * 
 * @param courseId - ID del curso
 * @returns Array de módulos con sus lecciones anidadas
 * @throws {Error} Si falla la petición al backend
 */
export async function getCourseStructure(
  courseId: string
): Promise<CourseModuleWithLessons[]> {
  if (!courseId) {
    console.log('[getCourseStructure] No courseId provided');
    return [];
  }
  try {
    const { data } = await supabase.auth.getSession();
    const session = data?.session;
    
    if (!session) {
      console.error('[getCourseStructure] No active session');
      return [];
    }
    console.log('[getCourseStructure] Fetching from /api/courses/'+ courseId + '/structure');
    const response = await fetch(`/api/courses/${courseId}/structure`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      credentials: 'include',
    });
    if (!response.ok) {
      console.error(`[getCourseStructure] Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('[getCourseStructure] Response:', errorText);
      return [];
    }
    const structure = await response.json();
    console.log('[getCourseStructure] Success! Got', structure.length, 'modules');
    return structure;
  } catch (error) {
    console.error('[getCourseStructure] Exception:', error);
    return [];
  }
}
