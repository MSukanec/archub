import { supabase } from '@/lib/supabase';
import type { CourseLessonProgress } from '@shared/schema';
/**
 * Marca o desmarca una lección como favorita.
 * 
 * Actualiza el campo is_favorite en el progreso de la lección.
 * Si el usuario no tiene progreso, lo crea con valores por defecto.
 * 
 * @param lessonId - ID de la lección
 * @param isFavorite - true para marcar como favorita, false para desmarcar
 * @returns Progreso de la lección actualizado
 * @throws {Error} Si falla la autenticación o la petición HTTP
 */
export async function toggleLessonFavorite(
  lessonId: string,
  isFavorite: boolean
): Promise<CourseLessonProgress> {
  if (!lessonId) {
    throw new Error('Lesson ID is required');
  }
  const { data } = await supabase.auth.getSession();
  const session = data?.session;
  
  if (!session) {
    throw new Error('No active session');
  }
  const response = await fetch(`/api/lessons/${lessonId}/favorite`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    credentials: 'include',
    body: JSON.stringify({ is_favorite: isFavorite }),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to toggle favorite'}));
    throw new Error(error.error || 'Failed to toggle favorite');
  }
  return await response.json();
}
