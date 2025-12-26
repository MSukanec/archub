import { supabase } from '@/lib/supabase';
import type { PartnerWithdrawal } from '../types';
export async function updatePartnerWithdrawal(
  id: string,
  updates: Partial<Omit<PartnerWithdrawal, 'id'| 'created_at'| 'organization_id'| 'created_by'>>,
  organizationId: string
): Promise<PartnerWithdrawal> {
  const { data, error } = await supabase
    .from('partner_withdrawals')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .select()
    .single();
  if (error) throw error;
  return data as PartnerWithdrawal;
}
