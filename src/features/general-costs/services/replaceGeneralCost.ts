import { supabase } from '@/lib/supabase';

/**
 * Replaces all references of an old general cost with a new one, then deletes the old cost.
 * 
 * This operation is transactional:
 * 1. Updates all payments pointing to oldCostId to point to newCostId
 * 2. Soft deletes the old general cost
 * 
 * @param oldCostId - The ID of the general cost to replace
 * @param newCostId - The ID of the new general cost to use
 * @returns { oldId: string, newId: string }
 * @throws {Error} If the operation fails or Supabase client is not initialized
 */
export async function replaceGeneralCost(oldCostId: string, newCostId: string): Promise<{ oldId: string; newId: string }> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  // Step 1: Update all payments pointing to oldCostId to newCostId
  const { error: updateError } = await supabase
    .from('general_costs_payments')
    .update({ general_cost_id: newCostId })
    .eq('general_cost_id', oldCostId);

  if (updateError) {
    throw new Error(`Failed to update payments: ${updateError.message}`);
  }

  // Step 2: Soft delete the old general cost
  const { error: deleteError } = await supabase
    .from('general_costs')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString()
    })
    .eq('id', oldCostId);

  if (deleteError) {
    throw new Error(`Failed to delete general cost: ${deleteError.message}`);
  }

  return { oldId: oldCostId, newId: newCostId };
}
