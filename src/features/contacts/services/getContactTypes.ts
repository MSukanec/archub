import { supabase } from '@/lib/supabase';
import type { ContactType } from '../types';

/**
 * Obtiene todos los tipos de contacto activos (no eliminados) de una organización.
 * 
 * @param organizationId - ID de la organización
 * @returns Array de tipos de contacto, o array vacío si no hay datos
 * @throws {Error} Si falla la query
 */
export async function getContactTypes(
  organizationId: string
): Promise<ContactType[]> {
  if (!supabase || !organizationId) {
    return [];
  }

  const { data, error } = await supabase
    .from('contact_types')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('is_deleted', false)
    .order('name');

  if (error) {
    throw error;
  }

  return data || [];
}
