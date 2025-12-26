import { supabase } from '@/lib/supabase';
/**
 * Obtiene los detalles básicos de una lección.
 * 
 * Consulta la tabla course_lessons para obtener información
 * esencial de la lección: id, título y duración en segundos.
 * 
 * Útil para:
 * - Mostrar información de la lección en dashboards
 * - Renderizar detalles de lecciones en progreso
 * - Componentes que necesitan datos básicos de lecciones
 * 
 * @param lessonId - ID de la lección (UUID)
 * @returns Objeto con { id, title, duration_sec } o null si no existe
 */
export async function getLessonDetails(
  lessonId: string | undefined
): Promise<{ id: string; title: string; duration_sec: number } | null> {
  if (!lessonId || !supabase) {
    return null;
  }
  try {
    const { data, error } = await supabase
      .from('course_lessons')
      .select('id, title, duration_sec')
      .eq('id', lessonId)
      .maybeSingle();
    if (error) {
      console.error('Error fetching lesson details:', error);
      return null;
    }
    return data;
  } catch (error) {
    console.error('Error in getLessonDetails:', error);
    return null;
  }
}
