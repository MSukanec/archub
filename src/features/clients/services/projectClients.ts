import { supabase } from '@/lib/supabase';
import type { ProjectClient, ProjectClientWithRelations } from '../types';

/**
 * Obtiene todos los clientes de un proyecto con sus relaciones.
 * 
 * Incluye:
 * - Contacto (contacts)
 * - Rol del cliente (client_roles)
 * 
 * @param projectId - ID del proyecto
 * @param organizationId - ID de la organización
 * @returns Array de clientes del proyecto con relaciones, o array vacío si no hay datos
 * @throws {Error} Si falla la query principal de Supabase
 */
export async function getProjectClients(
  projectId: string,
  organizationId: string
): Promise<ProjectClientWithRelations[]> {
  if (!supabase || !organizationId || !projectId) {
    return [];
  }

  const { data: clientsData, error } = await supabase
    .from('project_clients')
    .select(`
      *,
      contact:contacts(
        id,
        organization_id,
        first_name,
        last_name,
        full_name,
        email,
        phone,
        company_name,
        location,
        notes,
        national_id,
        linked_user_id,
        avatar_attachment_id,
        avatar_updated_at,
        is_local,
        display_name_override,
        linked_at,
        sync_status,
        created_at,
        updated_at
      ),
      role:client_roles(
        id,
        organization_id,
        name,
        description,
        is_default,
        created_at,
        updated_at
      )
    `)
    .eq('organization_id', organizationId)
    .eq('project_id', projectId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  if (!clientsData || clientsData.length === 0) {
    return [];
  }

  const data = clientsData.map(client => ({
    ...client,
    contact: client.contact || null,
    role: client.role || null,
  }));

  return data;
}

/**
 * Obtiene un cliente de proyecto específico por su ID.
 * 
 * Incluye:
 * - Contacto (contacts)
 * - Rol del cliente (client_roles)
 * 
 * @param clientId - ID del cliente de proyecto
 * @param organizationId - ID de la organización
 * @returns Cliente del proyecto con relaciones, o null si no existe
 * @throws {Error} Si falla la query de Supabase
 */
export async function getProjectClientById(
  clientId: string,
  organizationId: string
): Promise<ProjectClientWithRelations | null> {
  if (!supabase || !organizationId || !clientId) {
    return null;
  }

  const { data, error } = await supabase
    .from('project_clients')
    .select(`
      *,
      contact:contacts(
        id,
        organization_id,
        first_name,
        last_name,
        full_name,
        email,
        phone,
        company_name,
        location,
        notes,
        national_id,
        linked_user_id,
        avatar_attachment_id,
        avatar_updated_at,
        is_local,
        display_name_override,
        linked_at,
        sync_status,
        created_at,
        updated_at
      ),
      role:client_roles(
        id,
        organization_id,
        name,
        description,
        is_default,
        created_at,
        updated_at
      )
    `)
    .eq('id', clientId)
    .eq('organization_id', organizationId)
    .eq('is_deleted', false)
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    ...data,
    contact: data.contact || null,
    role: data.role || null,
  };
}

/**
 * Crea un nuevo cliente de proyecto.
 * 
 * @param projectClient - Datos del cliente a crear
 * @param projectId - ID del proyecto
 * @param organizationId - ID de la organización
 * @param createdBy - ID del miembro de organización que crea el registro
 * @returns Cliente creado con sus relaciones
 * @throws {Error} Si falla la creación
 */
export async function createProjectClient(
  projectClient: Omit<ProjectClient, 'id' | 'created_at' | 'updated_at' | 'project_id' | 'organization_id' | 'created_by'>,
  projectId: string,
  organizationId: string,
  createdBy: string
): Promise<ProjectClientWithRelations> {
  const { data, error } = await supabase
    .from('project_clients')
    .insert({
      ...projectClient,
      project_id: projectId,
      organization_id: organizationId,
      created_by: createdBy,
      is_deleted: false,
    })
    .select(`
      *,
      contact:contacts(
        id,
        organization_id,
        first_name,
        last_name,
        full_name,
        email,
        phone,
        company_name,
        location,
        notes,
        national_id,
        linked_user_id,
        avatar_attachment_id,
        avatar_updated_at,
        is_local,
        display_name_override,
        linked_at,
        sync_status,
        created_at,
        updated_at
      ),
      role:client_roles(
        id,
        organization_id,
        name,
        description,
        is_default,
        created_at,
        updated_at
      )
    `)
    .single();

  if (error) {
    throw error;
  }

  return {
    ...data,
    contact: data.contact || null,
    role: data.role || null,
  };
}

/**
 * Actualiza un cliente de proyecto existente.
 * 
 * @param clientId - ID del cliente a actualizar
 * @param updates - Campos a actualizar
 * @param organizationId - ID de la organización
 * @returns Cliente actualizado con sus relaciones
 * @throws {Error} Si falla la actualización
 */
export async function updateProjectClient(
  clientId: string,
  updates: Partial<Omit<ProjectClient, 'id' | 'created_at' | 'updated_at' | 'project_id' | 'organization_id' | 'created_by' | 'is_deleted' | 'deleted_at'>>,
  organizationId: string
): Promise<ProjectClientWithRelations> {
  const { data, error } = await supabase
    .from('project_clients')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', clientId)
    .eq('organization_id', organizationId)
    .select(`
      *,
      contact:contacts(
        id,
        organization_id,
        first_name,
        last_name,
        full_name,
        email,
        phone,
        company_name,
        location,
        notes,
        national_id,
        linked_user_id,
        avatar_attachment_id,
        avatar_updated_at,
        is_local,
        display_name_override,
        linked_at,
        sync_status,
        created_at,
        updated_at
      ),
      role:client_roles(
        id,
        organization_id,
        name,
        description,
        is_default,
        created_at,
        updated_at
      )
    `)
    .single();

  if (error) {
    throw error;
  }

  return {
    ...data,
    contact: data.contact || null,
    role: data.role || null,
  };
}

/**
 * Elimina un cliente de proyecto (soft delete).
 * 
 * Nota: Esta operación marca el cliente como eliminado sin borrarlo físicamente.
 * Los registros relacionados (compromisos, pagos) se mantienen para datos históricos.
 * 
 * @param clientId - ID del cliente a eliminar
 * @param organizationId - ID de la organización
 * @returns true si se eliminó correctamente
 * @throws {Error} Si falla la eliminación
 */
export async function deleteProjectClient(
  clientId: string,
  organizationId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('project_clients')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString()
    })
    .eq('id', clientId)
    .eq('organization_id', organizationId);

  if (error) {
    throw error;
  }

  return true;
}
