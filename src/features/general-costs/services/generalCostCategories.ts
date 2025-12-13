import { supabase } from '@/lib/supabase';
import type { GeneralCostCategory } from '../types';

/**
 * Obtiene todas las categorías de gastos generales de una organización.
 * 
 * Retorna categorías que cumplen CUALQUIERA de estas condiciones:
 * 1. Pertenecen a la organización Y no están eliminadas
 * 2. Son categorías del sistema (is_system=true) Y no están eliminadas
 * 
 * @param organizationId - ID de la organización
 * @returns Array de categorías no eliminadas, o array vacío si no hay datos
 * @throws {Error} Si falla la query de Supabase
 */
export async function getGeneralCostCategories(
  organizationId: string
): Promise<GeneralCostCategory[]> {
  if (!supabase || !organizationId) {
    return [];
  }

  const { data, error } = await supabase
    .from('general_cost_categories')
    .select('*')
    .or(`and(organization_id.eq.${organizationId},or(is_deleted.is.null,is_deleted.eq.false)),and(is_system.eq.true,or(is_deleted.is.null,is_deleted.eq.false))`)
    .order('name', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

/**
 * Obtiene una categoría de gasto general específica por su ID.
 * 
 * @param categoryId - ID de la categoría
 * @param organizationId - ID de la organización
 * @returns Categoría, o null si no existe o está eliminada
 * @throws {Error} Si falla la query de Supabase
 */
export async function getGeneralCostCategoryById(
  categoryId: string,
  organizationId: string
): Promise<GeneralCostCategory | null> {
  if (!supabase || !organizationId || !categoryId) {
    return null;
  }

  const { data, error } = await supabase
    .from('general_cost_categories')
    .select('*')
    .eq('id', categoryId)
    .eq('organization_id', organizationId)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Crea una nueva categoría de gasto general.
 * 
 * @param category - Datos de la categoría a crear
 * @param organizationId - ID de la organización
 * @returns Categoría creada
 * @throws {Error} Si falla la creación
 */
export async function createGeneralCostCategory(
  category: Pick<GeneralCostCategory, 'name' | 'description'>,
  organizationId: string
): Promise<GeneralCostCategory> {
  const { data, error } = await supabase
    .from('general_cost_categories')
    .insert({
      ...category,
      organization_id: organizationId,
      is_system: false,
      is_deleted: false,
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Actualiza una categoría de gasto general existente.
 * 
 * @param categoryId - ID de la categoría a actualizar
 * @param updates - Campos a actualizar
 * @param organizationId - ID de la organización
 * @returns Categoría actualizada
 * @throws {Error} Si falla la actualización
 */
export async function updateGeneralCostCategory(
  categoryId: string,
  updates: Pick<GeneralCostCategory, 'name' | 'description'>,
  organizationId: string
): Promise<GeneralCostCategory> {
  const { data, error } = await supabase
    .from('general_cost_categories')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', categoryId)
    .eq('organization_id', organizationId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Elimina una categoría de gasto general (soft delete).
 * 
 * Marca la categoría como eliminada estableciendo is_deleted en true y deleted_at con la fecha actual.
 * 
 * @param categoryId - ID de la categoría a eliminar
 * @param organizationId - ID de la organización
 * @returns true si se eliminó correctamente
 * @throws {Error} Si falla la actualización
 */
export async function deleteGeneralCostCategory(
  categoryId: string,
  organizationId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('general_cost_categories')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString()
    })
    .eq('id', categoryId)
    .eq('organization_id', organizationId);

  if (error) {
    throw error;
  }

  return true;
}

/**
 * Cuenta cuántos gastos generales tienen asignada una categoría específica.
 * 
 * @param categoryId - ID de la categoría a verificar
 * @returns Número de gastos generales que usan esta categoría
 * @throws {Error} Si falla la query
 */
export async function getGeneralCostCategoryUsageCount(categoryId: string): Promise<number> {
  if (!supabase || !categoryId) {
    return 0;
  }

  const { count, error } = await supabase
    .from('general_costs')
    .select('*', { count: 'exact', head: true })
    .eq('category_id', categoryId);

  if (error) {
    throw error;
  }

  return count || 0;
}

/**
 * Reemplaza una categoría con otra en todos los gastos generales.
 * Luego elimina la categoría antigua (soft delete).
 * 
 * @param oldCategoryId - ID de la categoría a reemplazar
 * @param newCategoryId - ID de la nueva categoría
 * @param organizationId - ID de la organización
 * @returns Confirmación del reemplazo
 * @throws {Error} Si falla la actualización
 */
export async function replaceGeneralCostCategory(
  oldCategoryId: string,
  newCategoryId: string,
  organizationId: string
): Promise<{ oldCategoryId: string; newCategoryId: string }> {
  const { error: updateError } = await supabase
    .from('general_costs')
    .update({ category_id: newCategoryId })
    .eq('category_id', oldCategoryId);

  if (updateError) {
    throw updateError;
  }

  const { error: deleteError } = await supabase
    .from('general_cost_categories')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString()
    })
    .eq('id', oldCategoryId)
    .eq('organization_id', organizationId);

  if (deleteError) {
    throw deleteError;
  }

  return { oldCategoryId, newCategoryId };
}
