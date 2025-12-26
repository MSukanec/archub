import { supabase } from '@/lib/supabase';
/**
 * Reemplaza todas las referencias de un tipo de contacto por otro
 * Luego soft deletes el tipo antiguo
 */
export async function replaceContactType(
  oldTypeId: string,
  newTypeId: string,
  organizationId: string
): Promise<void> {
  if (!supabase || !oldTypeId || !newTypeId || !organizationId) {
    throw new Error('Missing required parameters');
  }
  // Update all contact_type_links that reference the old type to use the new type
  const { error: updateError } = await supabase
    .from('contact_type_links')
    .update({ contact_type_id: newTypeId })
    .eq('contact_type_id', oldTypeId);
  if (updateError) {
    console.error('Error updating contact type links:', updateError);
    throw updateError;
  }
  // Soft delete the old type
  const { error: deleteError } = await supabase
    .from('contact_types')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', oldTypeId)
    .eq('organization_id', organizationId)
    .eq('is_deleted', false);
  if (deleteError) {
    console.error('Error deleting contact type:', deleteError);
    throw deleteError;
  }
}
