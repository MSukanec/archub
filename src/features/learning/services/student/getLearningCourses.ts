import { supabase } from '@/lib/supabase';
/**
 * Course data from backend
 */
export interface CourseData {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  cover_url: string | null;
  is_active: boolean;
  visibility: string;
  status: string;
}
/**
 * Enrollment data from backend
 */
export interface EnrollmentData {
  id: string;
  course_id: string;
  user_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  course_slug?: string;
}
/**
 * Course progress data from course_progress_view
 */
export interface CourseProgressViewData {
  user_id: string;
  course_id: string;
  done_lessons: number;
  total_lessons: number;
  progress_pct: number;
  last_activity_at?: string;
}
/**
 * Response from /api/learning/courses-full endpoint
 */
export interface LearningCoursesResponse {
  courses: CourseData[];
  enrollments: EnrollmentData[];
  progress: CourseProgressViewData[];
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
    const error = await response.json().catch(() => ({ error: 'Failed to fetch courses'}));
    throw new Error(error.error || 'Failed to fetch courses');
  }
  return await response.json();
}
