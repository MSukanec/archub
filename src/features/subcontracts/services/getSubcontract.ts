import { supabase } from '@/lib/supabase';
import type { SubcontractWithContact } from '../types';

export async function getSubcontract(subcontractId: string): Promise<SubcontractWithContact | null> {
  if (!subcontractId || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from('subcontracts')
    .select(`
      *,
      contact:contacts(id, first_name, last_name, full_name, company_name, email)
    `)
    .eq('id', subcontractId)
    .single();

  if (error) {
    console.error('Error fetching subcontract:', error);
    throw error;
  }

  return data;
}
