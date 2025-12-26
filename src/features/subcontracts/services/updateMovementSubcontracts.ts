import { supabase } from '@/lib/supabase';
import type { SubcontractItem } from './createMovementSubcontracts';

export async function updateMovementSubcontracts(
  movementId: string,
  subcontracts: SubcontractItem[]
): Promise<any[]> {
  if (!supabase) {
    throw new Error('Supabase not available');
  }

  const { error: deleteError } = await supabase
    .from('movement_subcontracts')
    .delete()
    .eq('movement_id', movementId);

  if (deleteError) {
    console.error('Error deleting movement subcontracts:', deleteError);
    throw deleteError;
  }

  if (subcontracts.length > 0) {
    const subcontractsToInsert = subcontracts.map(subcontract => ({
      movement_id: movementId,
      subcontract_id: subcontract.subcontract_id
    }));

    const { data, error: insertError } = await supabase
      .from('movement_subcontracts')
      .insert(subcontractsToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting movement subcontracts:', insertError);
      throw insertError;
    }

    return data || [];
  }

  return [];
}
