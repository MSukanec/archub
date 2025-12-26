import { supabase } from '@/lib/supabase';

/**
 * Elimina una nota por su ID.
 * 
 * Endpoint genérico que funciona tanto para notas como para marcadores.
 * Valida que la nota pertenezca al usuario actual antes de eliminarla.
 * 
 * @param noteId - ID de la nota a eliminar
 * @returns true si se eliminó correctamente
 * @throws {Error} Si falla la autenticación o la petición HTTP
 */
export async function deleteLessonNote(noteId: string): Promise<boolean> {
  if (!noteId) {
    throw new Error('Note ID is required');
  }

  const { data } = await supabase.auth.getSession();
  const session = data?.session;
  
  if (!session) {
    throw new Error('No active session');
  }

  const response = await fetch(`/api/notes/${noteId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to delete note' }));
    throw new Error(error.error || 'Failed to delete note');
  }

  return true;
}
