import { supabase } from '@/lib/supabase';
import type { InsertGeneralCost, GeneralCost } from '../types';
/**
 * Creates a new general cost in the database.
 * 
 * Inserts a new general cost record with the provided data. The organization_id
 * must be included in the generalCost object for security.
 * 
 * @param generalCost - The general cost data to insert
 * @returns The created general cost object
 * @throws {Error} If the insert fails or Supabase client is not initialized
 */
export async function createGeneralCost(generalCost: InsertGeneralCost): Promise<GeneralCost> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  const { data, error } = await supabase
    .from('general_costs')
    .insert(generalCost)
    .select()
    .single();
  if (error) {
    throw error;
  }
  return data;
}
