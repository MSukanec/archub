import { supabase } from '@/lib/supabase';

/**
 * Elimina un marcador por su ID.
 * 
 * Usa el mismo endpoint genérico de DELETE /api/notes/:noteId
 * ya que los marcadores se almacenan en course_lesson_notes.
 * 
 * Valida que el marcador pertenezca al usuario actual.
 * 
 * @param markerId - ID del marcador a eliminar
 * @returns true si se eliminó correctamente
 * @throws {Error} Si falla la autenticación o la petición HTTP
 */
export async function deleteLessonMarker(markerId: string): Promise<boolean> {
  if (!markerId) {
    throw new Error('Marker ID is required');
  }

  const { data } = await supabase.auth.getSession();
  const session = data?.session;
  
  if (!session) {
    throw new Error('No active session');
  }

  const response = await fetch(`/api/notes/${markerId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete marker' }));
    throw new Error(error.error || 'Failed to delete marker');
  }

  return true;
}
