import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Course } from '@shared/schema';

/**
 * Hook para obtener todos los cursos desde el panel administrativo.
 * 
 * Este hook está diseñado para uso administrativo y requiere permisos de admin.
 * Llama al endpoint `/api/admin/courses` para obtener la lista completa de cursos
 * del sistema, independientemente de la inscripción del usuario.
 * 
 * **Casos de uso:**
 * - Panel de administración de cursos
 * - Gestión de cursos (crear, editar, eliminar)
 * - Listados administrativos
 * 
 * **Permisos requeridos:**
 * - Usuario debe estar autenticado
 * - Usuario debe tener rol de administrador
 * 
 * @returns Query con array de cursos o array vacío
 * 
 * @example
 * ```tsx
 * function AdminCoursesPanel() {
 *   const { data: courses, isLoading, error } = useAdminCourses();
 * 
 *   if (isLoading) return <Spinner />;
 *   if (error) return <ErrorMessage error={error} />;
 * 
 *   return (
 *     <div>
 *       {courses?.map(course => (
 *         <CourseAdminCard key={course.id} course={course} />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAdminCourses() {
  return useQuery<Course[]>({
    queryKey: ['/api/admin/courses'],
    queryFn: async () => {
      if (!supabase) return [];
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const res = await fetch('/api/admin/courses', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        credentials: 'include'
      });

      if (!res.ok) throw new Error('Failed to fetch courses');
      return res.json();
    },
    enabled: !!supabase
  });
}
