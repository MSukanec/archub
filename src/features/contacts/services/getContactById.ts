import { supabase } from '@/lib/supabase';
import type { ContactWithRelations } from '../types';
import { mapViewToContact } from '../mappers';

/**
 * Obtiene un contacto específico por ID usando la vista contacts_with_relations_view.
 * 
 * La vista ya incluye:
 * - Datos del usuario vinculado (linked_user_*)
 * - Tipos de contacto como JSON array
 * - Estado de membresía (is_organization_member)
 * 
 * @param contactId - ID del contacto
 * @param organizationId - ID de la organización
 * @returns Contacto con relaciones, o null si no existe
 */
export async function getContactById(
  contactId: string,
  organizationId: string
): Promise<ContactWithRelations | null> {
  if (!supabase || !contactId || !organizationId) {
    return null;
  }

  const { data, error } = await supabase
    .from('contacts_with_relations_view')
    .select('*')
    .eq('id', contactId)
    .eq('organization_id', organizationId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data ? mapViewToContact(data) : null;
}
