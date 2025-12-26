import { supabase } from '@/lib/supabase';
import type { InsertGeneralCost, GeneralCost } from '../types';
/**
 * Updates an existing general cost in the database.
 * 
 * Updates the general cost with the provided ID using partial data.
 * Automatically sets the updated_at timestamp.
 * 
 * @param generalCostId - The ID of the general cost to update
 * @param generalCost - Partial general cost data to update
 * @returns The updated general cost object
 * @throws {Error} If the update fails or Supabase client is not initialized
 */
export async function updateGeneralCost(
  generalCostId: string, 
  generalCost: Partial<InsertGeneralCost>
): Promise<GeneralCost> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  const { data, error } = await supabase
    .from('general_costs')
    .update({
      ...generalCost,
      updated_at: new Date().toISOString()
    })
    .eq('id', generalCostId)
    .select()
    .single();
  if (error) {
    throw error;
  }
  return data;
}
