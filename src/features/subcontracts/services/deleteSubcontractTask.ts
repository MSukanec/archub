import { supabase } from '@/lib/supabase';

export async function deleteSubcontractTask(taskId: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not available');
  }

  const { error } = await supabase
    .from('subcontract_tasks')
    .delete()
    .eq('id', taskId);

  if (error) {
    console.error('Error deleting subcontract task:', error);
    throw error;
  }
}
