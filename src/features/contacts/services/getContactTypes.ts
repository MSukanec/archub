import { supabase } from '@/lib/supabase';
import type { ContactType } from '../types';
/**
 * Obtiene todos los tipos de contacto activos (no eliminados) ordenados alfabéticamente.
 * Incluye tipos del sistema (organization_id = null) y tipos personalizados de la organización.
 * Los resultados se ordenan SOLO por nombre (A-Z) sin separación entre sistemas y custom.
 * 
 * @param organizationId - ID de la organización
 * @returns Array de tipos de contacto ordenados alfabéticamente, o array vacío si no hay datos
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
    .order('name', { ascending: true });
  if (error) {
    throw error;
  }
  return data || [];
}
