import { supabase } from '@/lib/supabase';
import { getUserByAuthId } from '@/lib/supabase-helpers';
/**
 * Obtiene el enrollment del usuario para un curso específico.
 * 
 * Query directa a la tabla course_enrollments. Retorna información
 * del enrollment incluyendo estado, fechas de inicio y expiración.
 * 
 * Útil para verificar si el usuario tiene acceso al curso y obtener
 * metadatos del enrollment.
 * 
 * @param courseId - ID del curso (UUID)
 * @param userId - ID del usuario (UUID) o auth_id
 * @returns Enrollment del usuario o null si no existe
 * @throws {Error} Si falla la query principal
 */
export async function getCourseEnrollment(
  courseId: string | undefined,
  userId: string | undefined
) {
  if (!courseId || !userId || !supabase) {
    return null;
  }
  // Si el userId es un UUID del usuario, usarlo directamente
  // Si es un auth_id, obtener el user_id primero
  let actualUserId = userId;
  
  // Verificar si es un auth_id (formato diferente al user_id)
  // Para esto, intentar buscar el usuario por auth_id
  const userRecord = await getUserByAuthId(userId);
  if (userRecord) {
    actualUserId = userRecord.id;
  }
  const { data, error } = await supabase
    .from('course_enrollments')
    .select('*')
    .eq('course_id', courseId)
    .eq('user_id', actualUserId)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data;
}
