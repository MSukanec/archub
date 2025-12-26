import { supabase } from '@/lib/supabase';
import type { UserOrganizationPreferences, UpdateUserOrganizationPreferencesInput } from '../types';
/**
 * Actualiza o crea las preferencias de un usuario para una organización.
 * 
 * Utiliza upsert para crear o actualizar las preferencias existentes.
 * Principalmente usado para actualizar el último proyecto seleccionado.
 * 
 * @param userId - ID del usuario autenticado
 * @param input - Datos de preferencias a actualizar (organizationId y lastProjectId)
 * @returns Preferencias actualizadas
 * @throws {Error} Si el usuario no está autenticado o falla la petición
 */
export async function updateUserOrganizationPreferences(
  userId: string,
  input: UpdateUserOrganizationPreferencesInput
): Promise<UserOrganizationPreferences> {
  if (!userId) {
    throw new Error('User not authenticated');
  }
  let session = null;
  try {
    const { data } = await supabase.auth.getSession();
    session = data?.session;
  } catch (error) {
    throw new Error('Failed to get session');
  }
  
  if (!session) {
    throw new Error('No active session');
  }
  const response = await fetch('/api/user/update-organization-preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'x-user-id': userId,
    },
    body: JSON.stringify({
      organization_id: input.organizationId,
      last_project_id: input.lastProjectId,
    }),
  });
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  const data = await response.json();
  return data;
}
