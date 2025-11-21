import { supabase } from '@/lib/supabase';

export interface SubcontractItem {
  subcontract_id: string;
  contact_name: string;
}

export async function createMovementSubcontracts(
  movementId: string,
  subcontracts: SubcontractItem[]
): Promise<any[]> {
  if (!supabase) {
    throw new Error('Supabase not available');
  }

  const subcontractsToInsert = subcontracts.map(subcontract => ({
    movement_id: movementId,
    subcontract_id: subcontract.subcontract_id
  }));

  const { data, error } = await supabase
    .from('movement_subcontracts')
    .insert(subcontractsToInsert)
    .select();

  if (error) {
    console.error('Error creating movement subcontracts:', error);
    throw error;
  }

  return data || [];
}
