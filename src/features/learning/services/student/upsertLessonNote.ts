import { supabase } from '@/lib/supabase';
import type { LessonNote, UpsertLessonNotePayload } from '../types';

/**
 * Crea o actualiza una nota de lección.
 * 
 * Permite crear notas generales, resúmenes o marcadores de tiempo.
 * Si la nota ya existe (mismo lessonId + note_type), la actualiza.
 * 
 * @param payload - Datos de la nota a crear/actualizar
 * @returns Nota creada o actualizada
 * @throws {Error} Si falla la autenticación o la petición HTTP
 */
export async function upsertLessonNote(
  payload: UpsertLessonNotePayload
): Promise<LessonNote> {
  const { lessonId, ...body } = payload;
  
  if (!lessonId) {
    throw new Error('Lesson ID is required');
  }
  
  if (!body.body || typeof body.body !== 'string') {
    throw new Error('Note body must be a string');
  }

  const { data } = await supabase.auth.getSession();
  const session = data?.session;
  
  if (!session) {
    throw new Error('No active session');
  }

  const response = await fetch(`/api/lessons/${lessonId}/notes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    credentials: 'include',
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to upsert lesson note' }));
    throw new Error(error.error || 'Failed to upsert lesson note');
  }

  return await response.json();
}
