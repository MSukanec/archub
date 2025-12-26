/**
 * Delete Material Service
 * 
 * Elimina un material de la tabla materials.
 */
import { supabase } from '@/lib/supabase';
export async function deleteMaterial(id: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }
  if (!id) {
    throw new Error('Material ID is required');
  }
  const { error } = await supabase
    .from('materials')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('Error deleting material:', error);
    throw error;
  }
}
