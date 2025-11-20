import { supabase } from '@/lib/supabase';

/**
 * Realiza un soft delete de un tipo de contacto.
 * 
 * @param typeId - ID del tipo de contacto
 * @param organizationId - ID de la organización
 * @throws {Error} Si falla el soft delete
 */
export async function softDeleteContactType(
  typeId: string,
  organizationId: string
): Promise<void> {
  if (!supabase || !typeId || !organizationId) {
    throw new Error('Missing required parameters');
  }

  const { error } = await supabase
    .from('contact_types')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', typeId)
    .eq('organization_id', organizationId);

  if (error) {
    throw error;
  }
}
