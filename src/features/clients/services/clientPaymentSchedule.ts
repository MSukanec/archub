import { supabase } from '@/lib/supabase';
import type { ClientPaymentSchedule, ClientPaymentScheduleWithRelations } from '../types';

/**
 * Obtiene todos los items del cronograma de pago de un proyecto con sus relaciones.
 * 
 * Incluye:
 * - Compromiso (client_commitments con cliente completo)
 * - Moneda (currencies)
 * 
 * @param projectId - ID del proyecto
 * @param organizationId - ID de la organización
 * @returns Array de items del cronograma con relaciones, o array vacío si no hay datos
 * @throws {Error} Si falla la query principal de Supabase
 */
export async function getClientPaymentSchedule(
  projectId: string,
  organizationId: string
): Promise<ClientPaymentScheduleWithRelations[]> {
  if (!supabase || !organizationId || !projectId) {
    return [];
  }

  const { data: scheduleData, error } = await supabase
    .from('client_payment_schedule')
    .select(`
      *,
      commitment:client_commitments(
        id,
        project_id,
        client_id,
        contact_id,
        organization_id,
        amount,
        currency_id,
        exchange_rate,
        created_by,
        created_at,
        updated_at,
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
    .order('due_date', { ascending: true });

  if (error) {
    throw error;
  }

  if (!scheduleData || scheduleData.length === 0) {
    return [];
  }

  const data = scheduleData.map(schedule => ({
    ...schedule,
    commitment: schedule.commitment ? {
      ...schedule.commitment,
      client: schedule.commitment.client ? {
        ...schedule.commitment.client,
        contact: schedule.commitment.client.contact || null,
        role: schedule.commitment.client.role || null,
      } : null,
      contact: schedule.commitment.contact || null,
    } : null,
    currency: schedule.currency || null,
  }));

  return data;
}

/**
 * Obtiene un item del cronograma de pago específico por su ID.
 * 
 * Incluye:
 * - Compromiso (client_commitments con cliente completo)
 * - Moneda (currencies)
 * 
 * @param scheduleId - ID del item del cronograma
 * @param organizationId - ID de la organización
 * @returns Item del cronograma con relaciones, o null si no existe
 * @throws {Error} Si falla la query de Supabase
 */
export async function getClientPaymentScheduleById(
  scheduleId: string,
  organizationId: string
): Promise<ClientPaymentScheduleWithRelations | null> {
  if (!supabase || !organizationId || !scheduleId) {
    return null;
  }

  const { data, error } = await supabase
    .from('client_payment_schedule')
    .select(`
      *,
      commitment:client_commitments(
        id,
        project_id,
        client_id,
        contact_id,
        organization_id,
        amount,
        currency_id,
        exchange_rate,
        created_by,
        created_at,
        updated_at,
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
        )
      ),
      currency:currencies(
        id,
        code,
        symbol,
        name
      )
    `)
    .eq('id', scheduleId)
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
    commitment: data.commitment ? {
      ...data.commitment,
      client: data.commitment.client ? {
        ...data.commitment.client,
        contact: data.commitment.client.contact || null,
        role: data.commitment.client.role || null,
      } : null,
      contact: data.commitment.contact || null,
    } : null,
    currency: data.currency || null,
  };
}

/**
 * Crea un nuevo item en el cronograma de pago.
 * 
 * @param schedule - Datos del item del cronograma a crear
 * @param projectId - ID del proyecto
 * @param organizationId - ID de la organización
 * @param createdBy - ID del miembro de organización que crea el registro
 * @returns Item del cronograma creado con sus relaciones
 * @throws {Error} Si falla la creación
 */
export async function createClientPaymentSchedule(
  schedule: Omit<ClientPaymentSchedule, 'id' | 'created_at' | 'updated_at' | 'project_id' | 'organization_id' | 'created_by'>,
  projectId: string,
  organizationId: string,
  createdBy: string
): Promise<ClientPaymentScheduleWithRelations> {
  const { data, error } = await supabase
    .from('client_payment_schedule')
    .insert({
      ...schedule,
      project_id: projectId,
      organization_id: organizationId,
      created_by: createdBy,
    })
    .select(`
      *,
      commitment:client_commitments(
        id,
        project_id,
        client_id,
        contact_id,
        organization_id,
        amount,
        currency_id,
        exchange_rate,
        created_by,
        created_at,
        updated_at,
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
    commitment: data.commitment ? {
      ...data.commitment,
      client: data.commitment.client ? {
        ...data.commitment.client,
        contact: data.commitment.client.contact || null,
        role: data.commitment.client.role || null,
      } : null,
      contact: data.commitment.contact || null,
    } : null,
    currency: data.currency || null,
  };
}

/**
 * Actualiza un item del cronograma de pago existente.
 * 
 * @param scheduleId - ID del item del cronograma a actualizar
 * @param updates - Campos a actualizar
 * @param organizationId - ID de la organización
 * @returns Item del cronograma actualizado con sus relaciones
 * @throws {Error} Si falla la actualización
 */
export async function updateClientPaymentSchedule(
  scheduleId: string,
  updates: Partial<Omit<ClientPaymentSchedule, 'id' | 'created_at' | 'updated_at' | 'project_id' | 'organization_id' | 'created_by'>>,
  organizationId: string
): Promise<ClientPaymentScheduleWithRelations> {
  const { data, error } = await supabase
    .from('client_payment_schedule')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', scheduleId)
    .eq('organization_id', organizationId)
    .select(`
      *,
      commitment:client_commitments(
        id,
        project_id,
        client_id,
        contact_id,
        organization_id,
        amount,
        currency_id,
        exchange_rate,
        created_by,
        created_at,
        updated_at,
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
    commitment: data.commitment ? {
      ...data.commitment,
      client: data.commitment.client ? {
        ...data.commitment.client,
        contact: data.commitment.client.contact || null,
        role: data.commitment.client.role || null,
      } : null,
      contact: data.commitment.contact || null,
    } : null,
    currency: data.currency || null,
  };
}

/**
 * Elimina un item del cronograma de pago.
 * 
 * @param scheduleId - ID del item del cronograma a eliminar
 * @param organizationId - ID de la organización
 * @returns true si se eliminó correctamente
 * @throws {Error} Si falla la eliminación
 */
export async function deleteClientPaymentSchedule(
  scheduleId: string,
  organizationId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('client_payment_schedule')
    .delete()
    .eq('id', scheduleId)
    .eq('organization_id', organizationId);

  if (error) {
    throw error;
  }

  return true;
}
