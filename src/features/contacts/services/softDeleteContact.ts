import { supabase } from '@/lib/supabase';

/**
 * Realiza un soft delete de un contacto (marca como eliminado sin borrarlo).
 * 
 * @param contactId - ID del contacto a eliminar
 * @param organizationId - ID de la organización
 * @throws {Error} Si falla el soft delete
 */
export async function softDeleteContact(
  contactId: string,
  organizationId: string
): Promise<void> {
  if (!supabase || !contactId || !organizationId) {
    throw new Error('Missing required parameters');
  }

  const { error } = await supabase
    .from('contacts')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', contactId)
    .eq('organization_id', organizationId);

  if (error) {
    throw error;
  }
}
