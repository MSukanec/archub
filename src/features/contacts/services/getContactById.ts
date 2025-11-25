import { supabase } from '@/lib/supabase';
import type { ContactWithRelations } from '../types';

/**
 * Obtiene un contacto específico por ID con todas sus relaciones.
 * 
 * Relaciones incluidas:
 * - contact_types (vía contact_type_links)
 * - linked_user (si existe)
 * - attachments_count (número de archivos adjuntos)
 * 
 * @param contactId - ID del contacto
 * @param organizationId - ID de la organización
 * @returns Contacto con relaciones, o null si no existe
 * @throws {Error} Si falla la query principal
 */
export async function getContactById(
  contactId: string,
  organizationId: string
): Promise<ContactWithRelations | null> {
  if (!supabase || !contactId || !organizationId) {
    return null;
  }

  const { data: contact, error } = await supabase
    .from('contacts')
    .select(`
      *,
      linked_user:users!linked_user_id(id, full_name, email, avatar_url),
      contact_type_links(
        contact_types(id, name, is_deleted)
      )
    `)
    .eq('id', contactId)
    .eq('organization_id', organizationId)
    .eq('is_deleted', false)
    .single();

  if (error) {
    throw error;
  }

  if (!contact) {
    return null;
  }

  return {
    ...contact,
    contact_types: contact.contact_type_links
      ?.map((link: any) => link.contact_types)
      .filter((type: any) => type && !type.is_deleted) || [],
  };
}
