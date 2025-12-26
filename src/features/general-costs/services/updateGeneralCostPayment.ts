import { supabase } from '@/lib/supabase';
import type { GeneralCostPayment } from '../types';
/**
 * Updates an existing general cost payment in the database.
 * 
 * Updates a payment record with the provided data. Only the fields included
 * in the updates object will be modified. The organization_id filter ensures
 * security by preventing updates to payments from other organizations.
 * 
 * @param id - The ID of the payment to update
 * @param organizationId - The organization ID for security filtering
 * @param updates - Partial payment object with fields to update
 * @returns The updated payment object
 * @throws {Error} If the update fails or Supabase client is not initialized
 */
export async function updateGeneralCostPayment(
  id: string,
  organizationId: string,
  updates: Partial<GeneralCostPayment>
): Promise<GeneralCostPayment> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }
  const { data, error } = await supabase
    .from('general_costs_payments')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .select()
    .single();
  if (error) {
    throw error;
  }
  return data;
}
