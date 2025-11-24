import { supabase } from '@/lib/supabase';
import type { GeneralCostPayment } from '../types';

/**
 * Retrieves a single general cost payment by ID.
 * 
 * Fetches a payment record with all its fields. The organization_id filter
 * ensures security by preventing access to payments from other organizations.
 * 
 * @param id - The ID of the payment to retrieve
 * @param organizationId - The organization ID for security filtering
 * @returns The payment object or null if not found
 * @throws {Error} If the query fails or Supabase client is not initialized
 */
export async function getGeneralCostPayment(
  id: string,
  organizationId: string
): Promise<GeneralCostPayment | null> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('general_costs_payments')
    .select(`
      *,
      currency:currencies(*),
      wallet:organization_wallets(*, wallets(*)),
      general_cost:general_costs(*),
      creator:organization_members!general_costs_payments_created_by_fkey(
        id,
        users(id, full_name, avatar_url)
      )
    `)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  return data;
}
