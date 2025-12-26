import { supabase } from '@/lib/supabase';
import type { PartnerContribution, PartnerContributionCreateInput } from '../types';
export async function createPartnerContribution(
  input: PartnerContributionCreateInput
): Promise<PartnerContribution> {
  const insertData = {
    organization_id: input.organization_id,
    project_id: input.project_id || null,
    partner_id: input.partner_id,
    amount: input.amount,
    currency_id: input.currency_id,
    exchange_rate: input.exchange_rate || 1,
    contribution_date: input.contribution_date,
    wallet_id: input.wallet_id,
    status: input.status,
    reference: input.reference || null,
    notes: input.notes || null,
    created_by: input.created_by,
  };
  const { data, error } = await supabase
    .from('partner_contributions')
    .insert(insertData)
    .select()
    .single();
  if (error) throw error;
  return data as PartnerContribution;
}
