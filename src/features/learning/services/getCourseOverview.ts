import { supabase } from '@/lib/supabase';
import type { Course } from '@shared/schema';

/**
 * Obtiene la información básica de un curso.
 * 
 * Query directa a la tabla courses. Retorna información general
 * del curso sin módulos, lecciones ni progreso.
 * 
 * Útil para páginas de landing, listados, y cargas rápidas.
 * 
 * @param courseIdOrSlug - ID o slug del curso
 * @returns Curso con información básica o null si no existe
 * @throws {Error} Si falla la query principal
 */
export async function getCourseOverview(
  courseIdOrSlug: string
): Promise<Course | null> {
  if (!courseIdOrSlug) {
    return null;
  }

  // Intentar primero por ID (UUID format)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(courseIdOrSlug);
  
  let query = supabase
    .from('courses')
    .select('*');

  if (isUuid) {
    query = query.eq('id', courseIdOrSlug);
  } else {
    query = query.eq('slug', courseIdOrSlug);
  }

  const { data, error } = await query.maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}
