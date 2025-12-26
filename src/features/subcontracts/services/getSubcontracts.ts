import { supabase } from '@/lib/supabase';
import type { SubcontractWithContact } from '../types';

export async function getSubcontracts(projectId: string): Promise<SubcontractWithContact[]> {
  if (!projectId || !supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('subcontracts')
    .select(`
      *,
      contact:contacts(id, first_name, last_name, full_name, company_name, email),
      winner_bid:subcontract_bids!winner_bid_id(
        id,
        contacts(id, first_name, last_name, full_name, company_name, email)
      )
    `)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching subcontracts:', error);
    throw error;
  }

  return data || [];
}
