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
    return [];
  }

  try {
    const { data } = await supabase.auth.getSession();
    const session = data?.session;
    
    if (!session) {
      console.error('No active session');
      return [];
    }

    const response = await fetch(`/api/courses/${courseId}/structure`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      credentials: 'include',
    });

    if (!response.ok) {
      console.error(`Error fetching course structure: ${response.status}`);
      return [];
    }

    const structure = await response.json();
    return structure;
  } catch (error) {
    console.error('Error fetching course structure:', error);
    return [];
  }
}
