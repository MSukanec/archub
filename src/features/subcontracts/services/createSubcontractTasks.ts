import { supabase } from '@/lib/supabase';
export interface CreateSubcontractTaskData {
  task_id: string;
  unit?: string;
  quantity?: number;
  notes?: string;
}
export async function createSubcontractTasks(
  subcontractId: string,
  tasks: CreateSubcontractTaskData[]
): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase not available');
  }
  const tasksToInsert = tasks.map(task => ({
    subcontract_id: subcontractId,
    task_id: task.task_id,
    unit: task.unit || '',
    amount: task.quantity || 1,
    notes: task.notes || ''
  }));
  const { error } = await supabase
    .from('subcontract_tasks')
    .insert(tasksToInsert);
  if (error) {
    console.error('Error creating subcontract tasks:', error);
    throw error;
  }
}
