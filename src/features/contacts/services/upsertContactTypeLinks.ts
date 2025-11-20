import { supabase } from '@/lib/supabase';

/**
 * Actualiza las relaciones entre un contacto y sus tipos.
 * Elimina las relaciones antiguas y crea las nuevas.
 * 
 * @param contactId - ID del contacto
 * @param organizationId - ID de la organización
 * @param typeIds - Array de IDs de tipos de contacto
 * @throws {Error} Si falla la actualización
 */
export async function upsertContactTypeLinks(
  contactId: string,
  organizationId: string,
  typeIds: string[]
): Promise<void> {
  if (!supabase || !contactId || !organizationId) {
    throw new Error('Missing required parameters');
  }

  const { error: deleteError } = await supabase
    .from('contact_type_links')
    .delete()
    .eq('contact_id', contactId);

  if (deleteError) {
    throw deleteError;
  }

  if (typeIds.length > 0) {
    const links = typeIds.map(typeId => ({
      contact_id: contactId,
      contact_type_id: typeId,
      organization_id: organizationId,
    }));

    const { error: insertError } = await supabase
      .from('contact_type_links')
      .insert(links);

    if (insertError) {
      throw insertError;
    }
  }
}
