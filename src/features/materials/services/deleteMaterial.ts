/**
 * Delete Material Service
 * 
 * Elimina un material de la tabla materials.
 */

import { supabase } from '@/lib/supabase';
import { logActivity, ACTIVITY_ACTIONS, TARGET_TABLES } from '@/utils/logActivity';

interface DeleteMaterialOptions {
  organization_id?: string;
  user_id?: string;
  name?: string;
}

export async function deleteMaterial(id: string, options?: DeleteMaterialOptions): Promise<void> {
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

  if (options?.organization_id && options?.user_id) {
    logActivity({
      organization_id: options.organization_id,
      user_id: options.user_id,
      action: ACTIVITY_ACTIONS.DELETE_MATERIAL,
      target_table: TARGET_TABLES.MATERIALS,
      target_id: id,
      metadata: options.name ? { name: options.name } : {}
    });
  }
}
