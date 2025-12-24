import { supabase } from '@/lib/supabase';
import type { ContactsSummary } from '../types';

/**
 * Obtiene el resumen de contactos de una organización
 * usando la vista contacts_summary_view.
 * 
 * @param organizationId - ID de la organización
 * @returns Resumen con totales de contactos
 */
export async function getContactsSummary(
  organizationId: string
): Promise<ContactsSummary | null> {
  if (!supabase || !organizationId) {
    return null;
  }

  const { data, error } = await supabase
    .from('contacts_summary_view')
    .select('*')
    .eq('organization_id', organizationId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data;
}
