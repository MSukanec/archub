import { supabase } from '@/lib/supabase';
import type { InsertGeneralCostPayment, GeneralCostPayment } from '../types';

/**
 * Creates a new general cost payment in the database.
 * 
 * Inserts a new payment record associated with a general cost. The organization_id
 * must be included in the payment object for security. All financial fields are
 * validated at the database level (amount > 0, exchange_rate > 0).
 * 
 * @param payment - The payment data to insert
 * @returns The created payment object with all fields
 * @throws {Error} If the insert fails or Supabase client is not initialized
 */
export async function createGeneralCostPayment(payment: InsertGeneralCostPayment): Promise<GeneralCostPayment> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  const { data, error } = await supabase
    .from('general_costs_payments')
    .insert(payment)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}
