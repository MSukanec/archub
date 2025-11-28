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
      id,
      organization_id,
      amount,
      currency_id,
      exchange_rate,
      payment_date,
      notes,
      reference,
      created_at,
      updated_at,
      wallet_id,
      general_cost_id,
      status,
      created_by,
      currency:currencies(
        id,
        code,
        symbol,
        name
      ),
      wallet:organization_wallets(
        id,
        organization_id,
        wallet_id,
        is_active,
        is_default,
        wallets:wallet_id(
          id,
          name,
          is_active
        )
      ),
      general_cost:general_costs(
        id,
        name,
        description
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

  if (!data) return null;

  const walletData = Array.isArray(data.wallet) ? data.wallet[0] : data.wallet;
  
  return {
    ...data,
    currency: Array.isArray(data.currency) ? data.currency[0] : data.currency,
    general_cost: Array.isArray(data.general_cost) ? data.general_cost[0] : data.general_cost,
    wallet: walletData ? {
      ...walletData,
      wallets: Array.isArray(walletData.wallets) ? walletData.wallets[0] : walletData.wallets
    } : null,
    creator: null,
  } as unknown as GeneralCostPayment;
}
