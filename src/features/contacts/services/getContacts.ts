import { supabase } from '@/lib/supabase';
import type { ContactWithRelations } from '../types';
import { mapViewToContacts } from '../mappers';

/**
 * Obtiene todos los contactos activos de una organización
 * usando la vista contacts_with_relations_view.
 * 
 * La vista ya incluye:
 * - Datos del usuario vinculado (linked_user_*)
 * - Tipos de contacto como JSON array
 * - Estado de membresía (is_organization_member)
 * 
 * @param organizationId - ID de la organización
 * @returns Array de contactos con relaciones
 */
export async function getContacts(
  organizationId: string
): Promise<ContactWithRelations[]> {
  if (!supabase || !organizationId) {
    return [];
  }

  const { data, error } = await supabase
    .from('contacts_with_relations_view')
    .select('*')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return mapViewToContacts(data || []);
}
