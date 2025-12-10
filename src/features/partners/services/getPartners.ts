import { supabase } from '@/lib/supabase';
import type { Partner } from '../types';

export async function getPartners(organizationId: string): Promise<Partner[]> {
  if (!organizationId) return [];
  
  const { data, error } = await supabase
    .from('partners')
    .select(`id, created_at, contacts!inner(id, first_name, last_name, email, phone, company_name)`)
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as Partner[]) || [];
}
