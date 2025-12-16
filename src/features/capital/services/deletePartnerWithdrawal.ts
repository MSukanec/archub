import { supabase } from '@/lib/supabase';

export async function deletePartnerWithdrawal(
  id: string,
  organizationId: string
): Promise<void> {
  const { error } = await supabase
    .from('partner_withdrawals')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('organization_id', organizationId);

  if (error) throw error;
}
