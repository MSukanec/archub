/**
 * Get Material Categories Service
 * 
 * Obtiene todas las categorías de materiales con estructura jerárquica.
 */

import { supabase } from '@/lib/supabase';
import type { MaterialCategory } from '../../types';

export async function getMaterialCategories(): Promise<MaterialCategory[]> {
  if (!supabase) {
    throw new Error('Supabase client not available');
  }

  const { data, error } = await supabase
    .from('material_categories')
    .select(`
      id,
      name,
      parent_id,
      created_at
    `)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching material categories:', error);
    throw error;
  }

  // Transform flat data into hierarchical structure
  const categories = (data || []) as MaterialCategory[];

  // Build hierarchy by creating a map of parent-child relationships
  const categoryMap = new Map<string, MaterialCategory>();
  const rootCategories: MaterialCategory[] = [];

  // First pass: create map with all categories
  categories.forEach(category => {
    categoryMap.set(category.id, { ...category, children: [] });
  });

  // Second pass: build parent-child relationships
  categories.forEach(category => {
    const categoryWithChildren = categoryMap.get(category.id)!;

    if (category.parent_id) {
      // This is a child category
      const parent = categoryMap.get(category.parent_id);
      if (parent) {
        parent.children!.push(categoryWithChildren);
      }
    } else {
      // This is a root category
      rootCategories.push(categoryWithChildren);
    }
  });

  return rootCategories;
}
