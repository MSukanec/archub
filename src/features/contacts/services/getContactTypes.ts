import { supabase } from '@/lib/supabase';
import type { ContactType } from '../types';

/**
 * Obtiene todos los tipos de contacto activos (no eliminados).
 * Incluye tipos del sistema (organization_id = null) y tipos personalizados de la organización.
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
    .or(`organization_id.eq.${organizationId},organization_id.is.null`)
    .eq('is_deleted', false)
    .order('organization_id', { ascending: true, nullsFirst: true })
    .order('name');

  if (error) {
    throw error;
  }

  return data || [];
}
