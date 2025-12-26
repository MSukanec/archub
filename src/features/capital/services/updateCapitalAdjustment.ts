import { supabase } from '@/lib/supabase';
import type { CapitalAdjustment, CapitalAdjustmentUpdateInput } from '../types';

export async function updateCapitalAdjustment(
  id: string,
  updates: CapitalAdjustmentUpdateInput,
  organizationId: string
): Promise<CapitalAdjustment> {
  const { data, error } = await supabase
    .from('capital_adjustments')
    .update(updates)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) throw error;
  return data as CapitalAdjustment;
}
