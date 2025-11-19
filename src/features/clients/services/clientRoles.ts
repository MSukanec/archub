import { supabase } from '@/lib/supabase';
import type { ClientRole } from '../types';

/**
 * Obtiene todos los roles de cliente de una organización.
 * 
 * @param organizationId - ID de la organización
 * @returns Array de roles de cliente, o array vacío si no hay datos
 * @throws {Error} Si falla la query de Supabase
 */
export async function getClientRoles(
  organizationId: string
): Promise<ClientRole[]> {
  if (!supabase || !organizationId) {
    return [];
  }

  const { data, error} = await supabase
    .from('client_roles')
    .select('*')
    .or(`organization_id.eq.${organizationId},is_default.eq.true`)
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
 * @returns Rol de cliente, o null si no existe
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
  role: Omit<ClientRole, 'id' | 'created_at' | 'updated_at' | 'organization_id'>,
  organizationId: string
): Promise<ClientRole> {
  const { data, error } = await supabase
    .from('client_roles')
    .insert({
      ...role,
      organization_id: organizationId,
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
  updates: Partial<Omit<ClientRole, 'id' | 'created_at' | 'updated_at' | 'organization_id'>>,
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
 * Elimina un rol de cliente.
 * 
 * Nota: Esta operación fallará si existen clientes usando este rol.
 * Primero deben reasignarse los clientes a otro rol o establecer client_role_id en null.
 * 
 * @param roleId - ID del rol a eliminar
 * @param organizationId - ID de la organización
 * @returns true si se eliminó correctamente
 * @throws {Error} Si falla la eliminación o si hay clientes usando este rol
 */
export async function deleteClientRole(
  roleId: string,
  organizationId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('client_roles')
    .delete()
    .eq('id', roleId)
    .eq('organization_id', organizationId);

  if (error) {
    throw error;
  }

  return true;
}
