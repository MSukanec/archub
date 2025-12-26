import { supabase } from '@/lib/supabase';
import type { CapitalAdjustment } from '../types';

export async function getCapitalAdjustments(
  organizationId: string,
  projectId?: string
): Promise<CapitalAdjustment[]> {
  if (!organizationId) return [];

  let query = supabase
    .from('capital_adjustments')
    .select(`
      *,
      partner:capital_participants(
        id,
        created_at,
        contacts(id, full_name, first_name, last_name, email, phone, company_name)
      ),
      currency:currencies(id, name, symbol, code)
    `)
    .eq('organization_id', organizationId)
    .eq('is_deleted', false)
    .order('adjustment_date', { ascending: false });

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data as CapitalAdjustment[]) || [];
}

export async function getCapitalAdjustmentById(
  id: string,
  organizationId: string
): Promise<CapitalAdjustment | null> {
  if (!id || !organizationId) return null;

  const { data, error } = await supabase
    .from('capital_adjustments')
    .select(`
      *,
      partner:capital_participants(
        id,
        created_at,
        contacts(id, full_name, first_name, last_name, email, phone, company_name)
      ),
      currency:currencies(id, name, symbol, code)
    `)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .eq('is_deleted', false)
    .single();

  if (error) throw error;
  return data as CapitalAdjustment;
}
