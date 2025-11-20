import { supabase } from '@/lib/supabase';
import type { UserOrganizationPreferences } from '../types';

/**
 * Obtiene las preferencias de un usuario para una organización específica.
 * 
 * Las preferencias incluyen:
 * - Último proyecto seleccionado por el usuario en esa organización
 * - Otras configuraciones específicas de la organización
 * 
 * Utiliza el endpoint de API para acceder a las preferencias con autenticación.
 * 
 * @param userId - ID del usuario
 * @param organizationId - ID de la organización
 * @returns Preferencias del usuario para la organización, o null si no existen
 * @throws {Error} Si falla la petición HTTP (excepto 404 que retorna null)
 */
export async function getUserOrganizationPreferences(
  userId: string,
  organizationId: string
): Promise<UserOrganizationPreferences | null> {
  if (!userId || !organizationId) return null;

  let session = null;
  try {
    const { data } = await supabase.auth.getSession();
    session = data?.session;
  } catch (error) {
    return null;
  }
  
  if (!session) {
    return null;
  }

  const response = await fetch(`/api/user/organization-preferences?user_id=${userId}&organization_id=${organizationId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
}
