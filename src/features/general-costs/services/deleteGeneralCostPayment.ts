import { supabase } from '@/lib/supabase';

/**
 * Deletes a general cost payment from the database.
 * 
 * Permanently removes a payment record. The organization_id filter ensures
 * security by preventing deletion of payments from other organizations.
 * This operation cannot be undone.
 * 
 * @param id - The ID of the payment to delete
 * @param organizationId - The organization ID for security filtering
 * @returns void
 * @throws {Error} If the deletion fails or Supabase client is not initialized
 */
export async function deleteGeneralCostPayment(id: string, organizationId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { error } = await supabase
    .from('general_costs_payments')
    .delete()
    .eq('id', id)
    .eq('organization_id', organizationId);

  if (error) {
    throw error;
  }
}
