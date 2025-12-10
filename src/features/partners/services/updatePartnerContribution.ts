import { supabase } from '@/lib/supabase';
import type { PartnerContribution } from '../types';

export async function updatePartnerContribution(
  id: string,
  updates: Partial<Omit<PartnerContribution, 'id' | 'created_at' | 'organization_id' | 'created_by'>>,
  organizationId: string
): Promise<PartnerContribution> {
  const { data, error } = await supabase
    .from('partner_contributions')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) throw error;
  return data as PartnerContribution;
}
