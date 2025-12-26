import { supabase } from '@/lib/supabase';
/**
 * Soft deletes a general cost from the database.
 * 
 * Marks the general cost as deleted by setting is_deleted to true and deleted_at to current timestamp.
 * This maintains historical integrity and preserves data for audit purposes.
 * 
 * @param generalCostId - The ID of the general cost to delete
 * @returns The ID of the deleted general cost
 * @throws {Error} If the update fails or Supabase client is not initialized
 */
export async function deleteGeneralCost(generalCostId: string): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  const { error } = await supabase
    .from('general_costs')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString()
    })
    .eq('id', generalCostId);
  if (error) {
    throw error;
  }
  return generalCostId;
}
