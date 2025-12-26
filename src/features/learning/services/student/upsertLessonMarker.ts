import { supabase } from '@/lib/supabase';
import type { LessonMarker, UpsertMarkerPayload } from '../types';
/**
 * Crea o actualiza un marcador de lección.
 * 
 * Los marcadores son bookmarks en videos con timestamp obligatorio.
 * Útil para marcar momentos importantes o conceptos clave.
 * 
 * @param payload - Datos del marcador a crear/actualizar
 * @returns Marcador creado o actualizado
 * @throws {Error} Si falta time_sec, falla autenticación o petición HTTP
 */
export async function upsertLessonMarker(
  payload: UpsertMarkerPayload
): Promise<LessonMarker> {
  const { lessonId, ...body } = payload;
  
  if (!lessonId) {
    throw new Error('Lesson ID is required');
  }
  
  if (!body.body || typeof body.body !== 'string') {
    throw new Error('Marker body must be a string');
  }
  
  if (body.time_sec === undefined || body.time_sec === null) {
    throw new Error('time_sec is required for markers');
  }
  const { data } = await supabase.auth.getSession();
  const session = data?.session;
  
  if (!session) {
    throw new Error('No active session');
  }
  const response = await fetch(`/api/lessons/${lessonId}/markers`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to upsert lesson marker'}));
    throw new Error(error.error || 'Failed to upsert lesson marker');
  }
  return await response.json();
}
