/**
 * Delete Material Category Service
 * 
 * Elimina una categoría de material.
 */
import { supabase } from '@/lib/supabase';
export async function deleteMaterialCategory(id: string): Promise<void> {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }
  if (!id) {
    throw new Error('Category ID is required');
  }
  const { error } = await supabase
    .from('material_categories')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('Error deleting material category:', error);
    throw error;
  }
}
