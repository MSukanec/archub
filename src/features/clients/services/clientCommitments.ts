import { supabase } from '@/lib/supabase';
import type { ClientCommitment, ClientCommitmentWithRelations } from '../types';

/**
 * Obtiene todos los compromisos de cliente de un proyecto con sus relaciones.
 * 
 * Incluye:
 * - Cliente (project_clients con contact y role)
 * - Contacto directo (contacts)
 * - Moneda (currencies)
 * 
 * @param projectId - ID del proyecto
 * @param organizationId - ID de la organización
 * @returns Array de compromisos con relaciones, o array vacío si no hay datos
 * @throws {Error} Si falla la query principal de Supabase
 */
export async function getClientCommitments(
  projectId: string,
  organizationId: string
): Promise<ClientCommitmentWithRelations[]> {
  if (!supabase || !organizationId || !projectId) {
    return [];
  }

  const { data: commitmentsData, error } = await supabase
    .from('client_commitments')
    .select(`
      *,
      project_client:project_clients(
        id,
        project_id,
        contact_id,
        organization_id,
        is_primary,
        notes,
        status,
        client_role_id,
        created_by,
        created_at,
        updated_at,
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
      ),
      currency:currencies(
        id,
        code,
        symbol,
        name
      )
    `)
    .eq('organization_id', organizationId)
    .eq('project_id', projectId)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false });

  if (error) {
    throw error;
  }

  if (!commitmentsData || commitmentsData.length === 0) {
    return [];
  }

  const data = commitmentsData.map(commitment => ({
    ...commitment,
    project_client: commitment.project_client ? {
      ...commitment.project_client,
      contact: commitment.project_client.contact && !commitment.project_client.contact.is_deleted 
        ? commitment.project_client.contact 
        : null,
      role: commitment.project_client.role && !commitment.project_client.role.is_deleted 
        ? commitment.project_client.role 
        : null,
    } : null,
    currency: commitment.currency || null,
  }));

  return data;
}

/**
 * Obtiene un compromiso de cliente específico por su ID.
 * 
 * Incluye:
 * - Cliente (project_clients con contact y role)
 * - Contacto directo (contacts)
 * - Moneda (currencies)
 * 
 * @param commitmentId - ID del compromiso
 * @param organizationId - ID de la organización
 * @returns Compromiso con relaciones, o null si no existe
 * @throws {Error} Si falla la query de Supabase
 */
export async function getClientCommitmentById(
  commitmentId: string,
  organizationId: string
): Promise<ClientCommitmentWithRelations | null> {
  if (!supabase || !organizationId || !commitmentId) {
    return null;
  }

  const { data, error } = await supabase
    .from('client_commitments')
    .select(`
      *,
      project_client:project_clients(
        id,
        project_id,
        contact_id,
        organization_id,
        is_primary,
        notes,
        status,
        client_role_id,
        created_by,
        created_at,
        updated_at,
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
      ),
      currency:currencies(
        id,
        code,
        symbol,
        name
      )
    `)
    .eq('id', commitmentId)
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
    project_client: data.project_client ? {
      ...data.project_client,
      contact: data.project_client.contact && !data.project_client.contact.is_deleted 
        ? data.project_client.contact 
        : null,
      role: data.project_client.role && !data.project_client.role.is_deleted 
        ? data.project_client.role 
        : null,
    } : null,
    currency: data.currency || null,
  };
}

/**
 * Crea un nuevo compromiso de cliente.
 * 
 * @param commitment - Datos del compromiso a crear
 * @param projectId - ID del proyecto
 * @param organizationId - ID de la organización
 * @param createdBy - ID del miembro de organización que crea el registro
 * @returns Compromiso creado con sus relaciones
 * @throws {Error} Si falla la creación
 */
export async function createClientCommitment(
  commitment: Omit<ClientCommitment, 'id' | 'created_at' | 'updated_at' | 'project_id' | 'organization_id' | 'created_by' | 'is_deleted' | 'deleted_at'>,
  projectId: string,
  organizationId: string,
  createdBy: string
): Promise<ClientCommitmentWithRelations> {
  const { data, error } = await supabase
    .from('client_commitments')
    .insert({
      ...commitment,
      project_id: projectId,
      organization_id: organizationId,
      created_by: createdBy,
    })
    .select(`
      *,
      project_client:project_clients(
        id,
        project_id,
        contact_id,
        organization_id,
        is_primary,
        notes,
        status,
        client_role_id,
        created_by,
        created_at,
        updated_at,
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
      ),
      currency:currencies(
        id,
        code,
        symbol,
        name
      )
    `)
    .single();

  if (error) {
    throw error;
  }

  return {
    ...data,
    project_client: data.project_client ? {
      ...data.project_client,
      contact: data.project_client.contact && !data.project_client.contact.is_deleted 
        ? data.project_client.contact 
        : null,
      role: data.project_client.role && !data.project_client.role.is_deleted 
        ? data.project_client.role 
        : null,
    } : null,
    currency: data.currency || null,
  };
}

/**
 * Actualiza un compromiso de cliente existente.
 * 
 * @param commitmentId - ID del compromiso a actualizar
 * @param updates - Campos a actualizar
 * @param organizationId - ID de la organización
 * @returns Compromiso actualizado con sus relaciones
 * @throws {Error} Si falla la actualización
 */
export async function updateClientCommitment(
  commitmentId: string,
  updates: Partial<Omit<ClientCommitment, 'id' | 'created_at' | 'updated_at' | 'project_id' | 'organization_id' | 'created_by' | 'is_deleted' | 'deleted_at'>>,
  organizationId: string
): Promise<ClientCommitmentWithRelations> {
  const { data, error } = await supabase
    .from('client_commitments')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', commitmentId)
    .eq('organization_id', organizationId)
    .select(`
      *,
      project_client:project_clients(
        id,
        project_id,
        contact_id,
        organization_id,
        is_primary,
        notes,
        status,
        client_role_id,
        created_by,
        created_at,
        updated_at,
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
      ),
      currency:currencies(
        id,
        code,
        symbol,
        name
      )
    `)
    .single();

  if (error) {
    throw error;
  }

  return {
    ...data,
    project_client: data.project_client ? {
      ...data.project_client,
      contact: data.project_client.contact && !data.project_client.contact.is_deleted 
        ? data.project_client.contact 
        : null,
      role: data.project_client.role && !data.project_client.role.is_deleted 
        ? data.project_client.role 
        : null,
    } : null,
    currency: data.currency || null,
  };
}

/**
 * Elimina un compromiso de cliente (soft delete).
 * 
 * Marca el compromiso como eliminado en lugar de eliminarlo físicamente.
 * Los cronogramas de pago relacionados también serán afectados según
 * la configuración de la base de datos.
 * 
 * @param commitmentId - ID del compromiso a eliminar
 * @param organizationId - ID de la organización
 * @returns true si se eliminó correctamente
 * @throws {Error} Si falla la eliminación
 */
export async function deleteClientCommitment(
  commitmentId: string,
  organizationId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('client_commitments')
    .update({
      is_deleted: true,
      deleted_at: new Date().toISOString(),
    })
    .eq('id', commitmentId)
    .eq('organization_id', organizationId)
    .eq('is_deleted', false);

  if (error) {
    throw error;
  }

  return true;
}
