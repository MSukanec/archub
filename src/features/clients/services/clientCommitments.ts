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
      client:project_clients(
        id,
        project_id,
        contact_id,
        organization_id,
        unit,
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
          avatar_attachment_id,
          avatar_updated_at,
          is_local,
          display_name_override,
          linked_user_id,
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
          created_by,
          created_at,
          updated_at
        )
      ),
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
        avatar_attachment_id,
        avatar_updated_at,
        is_local,
        display_name_override,
        linked_user_id,
        linked_at,
        sync_status,
        created_at,
        updated_at
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
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  if (!commitmentsData || commitmentsData.length === 0) {
    return [];
  }

  const data = commitmentsData.map(commitment => ({
    ...commitment,
    client: commitment.client ? {
      ...commitment.client,
      contact: commitment.client.contact || null,
      role: commitment.client.role || null,
    } : null,
    contact: commitment.contact || null,
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
      client:project_clients(
        id,
        project_id,
        contact_id,
        organization_id,
        unit,
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
          avatar_attachment_id,
          avatar_updated_at,
          is_local,
          display_name_override,
          linked_user_id,
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
          created_by,
          created_at,
          updated_at
        )
      ),
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
        avatar_attachment_id,
        avatar_updated_at,
        is_local,
        display_name_override,
        linked_user_id,
        linked_at,
        sync_status,
        created_at,
        updated_at
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
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    ...data,
    client: data.client ? {
      ...data.client,
      contact: data.client.contact || null,
      role: data.client.role || null,
    } : null,
    contact: data.contact || null,
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
  commitment: Omit<ClientCommitment, 'id' | 'created_at' | 'updated_at' | 'project_id' | 'organization_id' | 'created_by'>,
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
      client:project_clients(
        id,
        project_id,
        contact_id,
        organization_id,
        unit,
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
          avatar_attachment_id,
          avatar_updated_at,
          is_local,
          display_name_override,
          linked_user_id,
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
          created_by,
          created_at,
          updated_at
        )
      ),
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
        avatar_attachment_id,
        avatar_updated_at,
        is_local,
        display_name_override,
        linked_user_id,
        linked_at,
        sync_status,
        created_at,
        updated_at
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
    client: data.client ? {
      ...data.client,
      contact: data.client.contact || null,
      role: data.client.role || null,
    } : null,
    contact: data.contact || null,
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
  updates: Partial<Omit<ClientCommitment, 'id' | 'created_at' | 'updated_at' | 'project_id' | 'organization_id' | 'created_by'>>,
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
      client:project_clients(
        id,
        project_id,
        contact_id,
        organization_id,
        unit,
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
          avatar_attachment_id,
          avatar_updated_at,
          is_local,
          display_name_override,
          linked_user_id,
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
          created_by,
          created_at,
          updated_at
        )
      ),
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
        avatar_attachment_id,
        avatar_updated_at,
        is_local,
        display_name_override,
        linked_user_id,
        linked_at,
        sync_status,
        created_at,
        updated_at
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
    client: data.client ? {
      ...data.client,
      contact: data.client.contact || null,
      role: data.client.role || null,
    } : null,
    contact: data.contact || null,
    currency: data.currency || null,
  };
}

/**
 * Elimina un compromiso de cliente.
 * 
 * Nota: Esta operación eliminará en cascada los cronogramas de pago relacionados
 * según la configuración de la base de datos.
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
    .delete()
    .eq('id', commitmentId)
    .eq('organization_id', organizationId);

  if (error) {
    throw error;
  }

  return true;
}
