import { supabase } from '@/lib/supabase';
import type { ContactByType } from '../types';

/**
 * Obtiene el recuento de contactos agrupados por tipo de contacto
 * usando la vista contacts_by_type_view.
 * 
 * @param organizationId - ID de la organización
 * @returns Array de recuentos por tipo de contacto
 */
export async function getContactsByType(
  organizationId: string
): Promise<ContactByType[]> {
  if (!supabase || !organizationId) {
    return [];
  }

  const { data, error } = await supabase
    .from('contacts_by_type_view')
    .select('*')
    .eq('organization_id', organizationId)
    .order('total_contacts', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}
