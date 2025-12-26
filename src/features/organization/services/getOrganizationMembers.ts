import { supabase } from '@/lib/supabase';
import type { OrganizationMember } from '../types';

/**
 * Obtiene todos los miembros activos de una organización.
 * 
 * Este service utiliza el endpoint de API en lugar de una query directa de Supabase
 * para evitar límites de profundidad de stack causados por JOINs recursivos en PostgREST.
 * 
 * @param organizationId - ID de la organización
 * @returns Array de miembros de la organización
 * @throws {Error} Si falla la petición HTTP o no hay organización
 */
export async function getOrganizationMembers(
  organizationId: string
): Promise<OrganizationMember[]> {
  if (!organizationId) {
    throw new Error('Organization ID is required');
  }

  const { data } = await supabase.auth.getSession();
  const session = data?.session;
  
  const headers: Record<string, string> = {};
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }

  const response = await fetch(`/api/organization-members/${organizationId}`, {
    credentials: "include",
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Failed to fetch organization members' }));
    console.error('Error fetching organization members:', error);
    throw new Error(error.error || 'Failed to fetch organization members');
  }

  const members = await response.json();
  return members as OrganizationMember[];
}
