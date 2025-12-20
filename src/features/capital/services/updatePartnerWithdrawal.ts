import { supabase } from '@/lib/supabase';
import type { PartnerWithdrawal } from '../types';

export async function updatePartnerWithdrawal(
  id: string,
  updates: Partial<Omit<PartnerWithdrawal, 'id' | 'created_at' | 'organization_id' | 'created_by'>>,
  organizationId: string,
  updatedBy?: string
): Promise<PartnerWithdrawal> {
  const updateData = {
    ...updates,
    updated_at: new Date().toISOString(),
    ...(updatedBy && { updated_by: updatedBy }),
  };

  const { data, error } = await supabase
    .from('partner_withdrawals')
    .update(updateData)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) throw error;
  return data as PartnerWithdrawal;
}
