import { supabase } from '@/lib/supabase';
import type { ProjectClient, ProjectClientWithRelations } from '../types';
import { logActivity, ACTIVITY_ACTIONS, TARGET_TABLES } from '@/utils/logActivity';

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
): Promise<any[]> {
  if (!supabase || !organizationId || !projectId) {
    return [];
  }

  const { data, error } = await supabase
    .from('project_clients_view')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('project_id', projectId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function getProjectClientById(
  clientId: string,
  organizationId: string
): Promise<any | null> {
  if (!supabase || !organizationId || !clientId) {
    return null;
  }

  const { data, error } = await supabase
    .from('project_clients_view')
    .select('*')
    .eq('id', clientId)
    .eq('organization_id', organizationId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Crea un nuevo cliente de proyecto.
 * 
 * @param projectClient - Datos del cliente a crear
 * @param projectId - ID del proyecto
 * @param organizationId - ID de la organización
 * @param createdBy - ID del miembro de organización que crea el registro
 * @param userId - ID del usuario para logging de actividad (opcional)
 * @returns Cliente creado con sus relaciones
 * @throws {Error} Si falla la creación
 */
export async function createProjectClient(
  projectClient: Omit<ProjectClient, 'id' | 'created_at' | 'updated_at' | 'project_id' | 'organization_id' | 'created_by'>,
  projectId: string,
  organizationId: string,
  createdBy: string,
  userId?: string
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
        image_bucket,
        image_path,
        avatar_updated_at,
        is_local,
        display_name_override,
        linked_at,
        sync_status,
        created_at,
        updated_at,
        is_deleted,
        deleted_at
      ),
      role:client_roles(
        id,
        organization_id,
        name,
        description,
        is_default,
        created_at,
        updated_at,
        is_deleted,
        deleted_at
      )
    `)
    .single();

  if (error) {
    throw error;
  }

  const result = {
    ...data,
    contact: data.contact && !data.contact.is_deleted ? data.contact : null,
    role: data.role && !data.role.is_deleted ? data.role : null,
  };

  if (userId) {
    const contactName = result.contact?.full_name || result.contact?.company_name || '';
    logActivity({
      organization_id: organizationId,
      user_id: userId,
      action: ACTIVITY_ACTIONS.ADD_CLIENT,
      target_table: TARGET_TABLES.PROJECT_CLIENTS,
      target_id: result.id,
      metadata: { name: contactName, project_id: projectId }
    });
  }

  return result;
}

/**
 * Actualiza un cliente de proyecto existente.
 * 
 * @param clientId - ID del cliente a actualizar
 * @param updates - Campos a actualizar
 * @param organizationId - ID de la organización
 * @param userId - ID del usuario para logging de actividad (opcional)
 * @returns Cliente actualizado con sus relaciones
 * @throws {Error} Si falla la actualización
 */
export async function updateProjectClient(
  clientId: string,
  updates: Partial<Omit<ProjectClient, 'id' | 'created_at' | 'updated_at' | 'project_id' | 'organization_id' | 'created_by' | 'is_deleted' | 'deleted_at'>>,
  organizationId: string,
  userId?: string
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
        image_bucket,
        image_path,
        avatar_updated_at,
        is_local,
        display_name_override,
        linked_at,
        sync_status,
        created_at,
        updated_at,
        is_deleted,
        deleted_at
      ),
      role:client_roles(
        id,
        organization_id,
        name,
        description,
        is_default,
        created_at,
        updated_at,
        is_deleted,
        deleted_at
      )
    `)
    .single();

  if (error) {
    throw error;
  }

  const result = {
    ...data,
    contact: data.contact && !data.contact.is_deleted ? data.contact : null,
    role: data.role && !data.role.is_deleted ? data.role : null,
  };

  if (userId) {
    const contactName = result.contact?.full_name || result.contact?.company_name || '';
    logActivity({
      organization_id: organizationId,
      user_id: userId,
      action: ACTIVITY_ACTIONS.UPDATE_CLIENT,
      target_table: TARGET_TABLES.PROJECT_CLIENTS,
      target_id: clientId,
      metadata: { name: contactName, project_id: result.project_id }
    });
  }

  return result;
}

/**
 * Elimina un cliente de proyecto (soft delete).
 * 
 * Nota: Esta operación marca el cliente como eliminado sin borrarlo físicamente.
 * Los registros relacionados (compromisos, pagos) se mantienen para datos históricos.
 * 
 * @param clientId - ID del cliente a eliminar
 * @param organizationId - ID de la organización
 * @param userId - ID del usuario para logging de actividad (opcional)
 * @returns true si se eliminó correctamente
 * @throws {Error} Si falla la eliminación
 */
export async function deleteProjectClient(
  clientId: string,
  organizationId: string,
  userId?: string
): Promise<boolean> {
  let clientData: any = null;
  if (userId) {
    const { data } = await supabase
      .from('project_clients')
      .select(`
        id,
        project_id,
        contact:contacts(full_name, company_name)
      `)
      .eq('id', clientId)
      .eq('organization_id', organizationId)
      .single();
    clientData = data;
  }

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

  if (userId && clientData) {
    const contactName = clientData.contact?.full_name || clientData.contact?.company_name || '';
    logActivity({
      organization_id: organizationId,
      user_id: userId,
      action: ACTIVITY_ACTIONS.REMOVE_CLIENT,
      target_table: TARGET_TABLES.PROJECT_CLIENTS,
      target_id: clientId,
      metadata: { name: contactName, project_id: clientData.project_id }
    });
  }

  return true;
}
