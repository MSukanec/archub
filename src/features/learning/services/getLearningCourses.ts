import { supabase } from '@/lib/supabase';
import type { CourseWithDetails } from '../types';

export interface LearningCoursesResponse {
  courses: any[];
  enrollments: any[];
  progress: any[];
}

/**
 * Obtiene todos los cursos con enrollments y progreso del usuario.
 * 
 * Incluye:
 * - Información completa del curso
 * - Estado de enrollment (si está inscrito)
 * - Progreso del usuario en cada curso
 * - Módulos y lecciones
 * 
 * @returns Objeto con courses, enrollments y progress
 * @throws {Error} Si falla la autenticación o la petición HTTP
 */
export async function getLearningCourses(): Promise<LearningCoursesResponse> {
  const { data } = await supabase.auth.getSession();
  const session = data?.session;
  
  if (!session) {
    throw new Error('No active session');
  }

  const response = await fetch('/api/learning/courses-full', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch courses' }));
    throw new Error(error.error || 'Failed to fetch courses');
  }

  return await response.json();
}
