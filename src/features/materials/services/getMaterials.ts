/**
 * Get Materials Service
 * 
 * Obtiene todos los materiales de la vista materials_view.
 * Esta vista incluye información pre-computada de categorías, unidades y precios.
 */

import { supabase } from '@/lib/supabase';
import type { Material } from '../types';

export async function getMaterials(): Promise<Material[]> {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const { data, error } = await supabase
    .from('materials_view')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching materials:', error);
    throw error;
  }

  return data || [];
}
