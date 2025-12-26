import { supabase } from '@/lib/supabase';
export interface UpdateSubcontractTaskData {
  unit?: string;
  amount?: number;
  notes?: string;
}
export async function updateSubcontractTask(
  taskId: string,
  updates: UpdateSubcontractTaskData
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not available');
  }
  const { error } = await supabase
    .from('subcontract_bid_tasks')
    .update(updates)
    .eq('id', taskId);
  if (error) {
    console.error('Error updating subcontract task:', error);
    throw error;
  }
}
