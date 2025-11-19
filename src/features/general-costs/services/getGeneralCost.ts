import { supabase } from '@/lib/supabase';
import type { GeneralCost } from '../types';

/**
 * Fetches a single general cost by ID.
 * 
 * Retrieves detailed information about a specific general cost including
 * all related data.
 * 
 * @param generalCostId - The ID of the general cost to fetch
 * @returns The general cost object or null if not found
 * @throws {Error} If the query fails or Supabase client is not initialized
 */
export async function getGeneralCost(generalCostId: string): Promise<GeneralCost | null> {
  if (!generalCostId) {
    return null;
  }

  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('general_costs')
    .select(`
      id,
      organization_id,
      name,
      description,
      created_at,
      updated_at,
      is_deleted,
      deleted_at
    `)
    .eq('id', generalCostId)
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return data;
}
