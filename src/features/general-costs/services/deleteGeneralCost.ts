import { supabase } from '@/lib/supabase';

/**
 * Deletes a general cost from the database.
 * 
 * Permanently removes the general cost record. This action cannot be undone.
 * Related records (like values) may be cascade deleted depending on database constraints.
 * 
 * @param generalCostId - The ID of the general cost to delete
 * @returns The ID of the deleted general cost
 * @throws {Error} If the delete fails or Supabase client is not initialized
 */
export async function deleteGeneralCost(generalCostId: string): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { error } = await supabase
    .from('general_costs')
    .delete()
    .eq('id', generalCostId);

  if (error) {
    throw error;
  }

  return generalCostId;
}
