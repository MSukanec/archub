import { supabase } from '@/lib/supabase';
import type { ClientRole } from '../types';
/**
 * Obtiene todos los roles de cliente de una organización.
 * 
 * Retorna roles que cumplen CUALQUIERA de estas condiciones:
 * 1. Pertenecen a la organización Y no están eliminados
 * 2. Son roles del sistema (is_default=true) Y no están eliminados
 * 
 * @param organizationId - ID de la organización
 * @returns Array de roles de cliente no eliminados, o array vacío si no hay datos
 * @throws {Error} Si falla la query de Supabase
 */
export async function getClientRoles(
  organizationId: string
): Promise<ClientRole[]> {
  if (!supabase || !organizationId) {
    return [];
  }
  // Combinar todas las condiciones en un solo OR para prevenir sobrescritura
  // WHERE (org_id = X AND (deleted IS NULL OR deleted = false)) 
  //    OR (is_default = true AND (deleted IS NULL OR deleted = false))
  const { data, error} = await supabase
    .from('client_roles')
    .select('*')
    .or(`and(organization_id.eq.${organizationId},or(is_deleted.is.null,is_deleted.eq.false)),and(is_default.eq.true,or(is_deleted.is.null,is_deleted.eq.false))`)
    .order('name', { ascending: true });
  if (error) {
    throw error;
  }
  return data || [];
}
/**
 * Obtiene un rol de cliente específico por su ID.
 * 
 * @param roleId - ID del rol de cliente
 * @param organizationId - ID de la organización
 * @returns Rol de cliente, o null si no existe o está eliminado
 * @throws {Error} Si falla la query de Supabase
 */
export async function getClientRoleById(
  roleId: string,
  organizationId: string
): Promise<ClientRole | null> {
  if (!supabase || !organizationId || !roleId) {
    return null;
  }
  const { data, error } = await supabase
    .from('client_roles')
    .select('*')
    .eq('id', roleId)
    .eq('organization_id', organizationId)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .single();
  if (error) {
    throw error;
  }
  return data;
}
/**
 * Crea un nuevo rol de cliente.
 * 
 * @param role - Datos del rol a crear
 * @param organizationId - ID de la organización
 * @returns Rol creado
 * @throws {Error} Si falla la creación
 */
export async function createClientRole(
  role: Omit<ClientRole, 'id'| 'created_at'| 'updated_at'| 'organization_id'| 'is_deleted'| 'deleted_at'>,
  organizationId: string
): Promise<ClientRole> {
  const { data, error } = await supabase
    .from('client_roles')
    .insert({
      ...role,
      organization_id: organizationId,
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
 * Actualiza un rol de cliente existente.
 * 
 * @param roleId - ID del rol a actualizar
 * @param updates - Campos a actualizar
 * @param organizationId - ID de la organización
 * @returns Rol actualizado
 * @throws {Error} Si falla la actualización
 */
export async function updateClientRole(
  roleId: string,
  updates: Partial<Omit<ClientRole, 'id'| 'created_at'| 'updated_at'| 'organization_id'| 'is_deleted'| 'deleted_at'>>,
  organizationId: string
): Promise<ClientRole> {
  const { data, error } = await supabase
    .from('client_roles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', roleId)
    .eq('organization_id', organizationId)
    .select()
    .single();
  if (error) {
    throw error;
  }
  return data;
}
/**
 * Elimina un rol de cliente (soft delete).
 * 
 * Marca el rol como eliminado estableciendo is_deleted en true y deleted_at con la fecha actual.
 * Esto mantiene la integridad histórica y preserva los datos para propósitos de auditoría.
 * 
 * @param roleId - ID del rol a eliminar
 * @param organizationId - ID de la organización
 * @returns true si se eliminó correctamente
 * @throws {Error} Si falla la actualización
 */
export async function deleteClientRole(
  roleId: string,
  organizationId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('client_roles')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString()
    })
    .eq('id', roleId)
    .eq('organization_id', organizationId);
  if (error) {
    throw error;
  }
  return true;
}
/**
 * Cuenta cuántos project_clients tienen asignado un rol específico.
 * 
 * @param roleId - ID del rol a verificar
 * @returns Número de clients que usan este rol
 * @throws {Error} Si falla la query
 */
export async function getClientRoleUsageCount(roleId: string): Promise<number> {
  if (!supabase || !roleId) {
    return 0;
  }
  const { count, error } = await supabase
    .from('project_clients')
    .select('*', { count: 'exact', head: true })
    .eq('client_role_id', roleId);
  if (error) {
    throw error;
  }
  return count || 0;
}
/**
 * Reemplaza un rol con otro en todos los project_clients.
 * Luego elimina el rol antiguo (soft delete).
 * 
 * @param oldRoleId - ID del rol a reemplazar
 * @param newRoleId - ID del nuevo rol
 * @returns Confirmación del reemplazo
 * @throws {Error} Si falla la actualización
 */
export async function replaceClientRole(
  oldRoleId: string,
  newRoleId: string
): Promise<{ oldRoleId: string; newRoleId: string }> {
  // Actualizar todos los project_clients que usaban el rol antiguo
  const { error: updateError } = await supabase
    .from('project_clients')
    .update({ client_role_id: newRoleId })
    .eq('client_role_id', oldRoleId);
  if (updateError) {
    throw updateError;
  }
  // Soft delete del rol antiguo
  const { error: deleteError } = await supabase
    .from('client_roles')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString()
    })
    .eq('id', oldRoleId);
  if (deleteError) {
    throw deleteError;
  }
  return { oldRoleId, newRoleId };
}
