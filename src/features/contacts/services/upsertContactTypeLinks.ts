import { supabase } from '@/lib/supabase';
/**
 * Actualiza las relaciones entre un contacto y sus tipos.
 * Usa lógica inteligente: solo agrega nuevos tipos y elimina los que ya no están.
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
  // 1. Obtener los tipos actuales del contacto
  const { data: currentLinks, error: fetchError } = await supabase
    .from('contact_type_links')
    .select('id, contact_type_id')
    .eq('contact_id', contactId);
  if (fetchError) {
    throw fetchError;
  }
  const currentTypeIds = (currentLinks || []).map(link => link.contact_type_id);
  
  // 2. Calcular qué tipos agregar y cuáles eliminar
  const typesToAdd = typeIds.filter(id => !currentTypeIds.includes(id));
  const linksToRemove = (currentLinks || []).filter(link => !typeIds.includes(link.contact_type_id));
  // 3. Eliminar los tipos que ya no están seleccionados
  for (const link of linksToRemove) {
    const { error: deleteError } = await supabase
      .from('contact_type_links')
      .delete()
      .eq('id', link.id);
    if (deleteError) {
      console.error('Error deleting contact type link:', deleteError);
      // Continuar con los demás aunque falle uno
    }
  }
  // 4. Agregar solo los tipos nuevos
  if (typesToAdd.length > 0) {
    const newLinks = typesToAdd.map(typeId => ({
      contact_id: contactId,
      contact_type_id: typeId,
      organization_id: organizationId,
    }));
    const { error: insertError } = await supabase
      .from('contact_type_links')
      .insert(newLinks);
    if (insertError) {
      throw insertError;
    }
  }
}
