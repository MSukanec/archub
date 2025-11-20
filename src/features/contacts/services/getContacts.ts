import { supabase } from '@/lib/supabase';
import type { ContactWithRelations } from '../types';

/**
 * Obtiene todos los contactos activos (no eliminados) de una organización
 * con sus relaciones: tipos de contacto, usuario vinculado y recuento de adjuntos.
 * 
 * Relaciones incluidas:
 * - contact_types (vía contact_type_links)
 * - linked_user (si existe)
 * - attachments_count (número de archivos adjuntos)
 * 
 * @param organizationId - ID de la organización
 * @returns Array de contactos con relaciones, o array vacío si no hay datos
 * @throws {Error} Si falla la query principal de contactos
 */
export async function getContacts(
  organizationId: string
): Promise<ContactWithRelations[]> {
  if (!supabase || !organizationId) {
    return [];
  }

  const { data: contacts, error } = await supabase
    .from('contacts')
    .select(`
      *,
      linked_user:users!linked_user_id(id, full_name, email, avatar_url),
      contact_type_links(
        contact_types(id, name, is_deleted)
      )
    `)
    .eq('organization_id', organizationId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  if (!contacts || contacts.length === 0) {
    return [];
  }

  const { data: attachmentCounts, error: attachmentsError } = await supabase
    .from('contact_attachments')
    .select('contact_id')
    .in('contact_id', contacts.map(c => c.id));

  if (attachmentsError) {
    console.error('Error fetching attachment counts:', attachmentsError);
  }

  const countsByContact = (attachmentCounts || []).reduce((acc, item) => {
    acc[item.contact_id] = (acc[item.contact_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return contacts.map(contact => ({
    ...contact,
    contact_types: contact.contact_type_links
      ?.map((link: any) => link.contact_types)
      .filter((type: any) => type && !type.is_deleted) || [],
    attachments_count: countsByContact[contact.id] || 0,
  }));
}
