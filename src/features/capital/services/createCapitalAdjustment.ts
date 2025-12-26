import { supabase } from '@/lib/supabase';
import type { CapitalAdjustment, CapitalAdjustmentCreateInput } from '../types';

export async function createCapitalAdjustment(input: CapitalAdjustmentCreateInput): Promise<CapitalAdjustment> {
  const { data, error } = await supabase
    .from('capital_adjustments')
    .insert({
      organization_id: input.organization_id,
      partner_id: input.partner_id || null,
      project_id: input.project_id || null,
      currency_id: input.currency_id,
      exchange_rate: input.exchange_rate || 1,
      amount: input.amount,
      adjustment_date: input.adjustment_date,
      reason: input.reason,
      notes: input.notes || null,
      reference: input.reference || null,
      status: input.status,
      created_by: input.created_by,
    })
    .select()
    .single();

  if (error) throw error;
  return data as CapitalAdjustment;
}
