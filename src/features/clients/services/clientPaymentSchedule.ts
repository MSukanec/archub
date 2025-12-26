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
  const { data: commitmentsData, error: commitmentsError } = await supabase
    .from('client_commitments')
    .select('id')
    .eq('project_id', projectId)
    .eq('organization_id', organizationId);
  if (commitmentsError) {
    throw commitmentsError;
  }
  if (!commitmentsData || commitmentsData.length === 0) {
    return [];
  }
  const commitmentIds = commitmentsData.map(c => c.id);
  const { data: scheduleData, error } = await supabase
    .from('client_payment_schedule')
    .select(`
      id,
      commitment_id,
      organization_id,
      due_date,
      amount,
      currency_id,
      status,
      paid_at,
      payment_method,
      notes,
      created_at,
      updated_at,
      commitment:client_commitments(
        id,
        project_id,
        client_id,
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
        )
      ),
      currency:currencies(
        id,
        code,
        symbol,
        name
      )
    `)
    .in('commitment_id', commitmentIds)
    .eq('organization_id', organizationId)
    .order('due_date', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) {
    throw error;
  }
  if (!scheduleData || scheduleData.length === 0) {
    return [];
  }
  const data = scheduleData.map((schedule: any) => ({
    ...schedule,
    commitment: schedule.commitment?.[0] ? {
      ...schedule.commitment[0],
      project_client: schedule.commitment[0].client?.[0] ? {
        ...schedule.commitment[0].client[0],
        contact: schedule.commitment[0].client[0].contact?.[0] || null,
        role: schedule.commitment[0].client[0].role?.[0] || null,
      } : null,
    } : null,
    currency: schedule.currency?.[0] || null,
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
      id,
      commitment_id,
      organization_id,
      due_date,
      amount,
      currency_id,
      status,
      paid_at,
      payment_method,
      notes,
      created_at,
      updated_at,
      commitment:client_commitments(
        id,
        project_id,
        client_id,
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
    .maybeSingle();
  if (error) {
    throw error;
  }
  if (!data) {
    return null;
  }
  const typedData = data as any;
  return {
    ...typedData,
    commitment: typedData.commitment?.[0] ? {
      ...typedData.commitment[0],
      project_client: typedData.commitment[0].client?.[0] ? {
        ...typedData.commitment[0].client[0],
        contact: typedData.commitment[0].client[0].contact?.[0] || null,
        role: typedData.commitment[0].client[0].role?.[0] || null,
      } : null,
    } : null,
    currency: typedData.currency?.[0] || null,
  };
}
/**
 * Crea un nuevo item en el cronograma de pago.
 * 
 * @param schedule - Datos del item del cronograma a crear
 * @param organizationId - ID de la organización
 * @returns Item del cronograma creado con sus relaciones
 * @throws {Error} Si falla la creación
 */
export async function createClientPaymentSchedule(
  schedule: Omit<ClientPaymentSchedule, 'id'| 'created_at'| 'updated_at'| 'organization_id'>,
  organizationId: string
): Promise<ClientPaymentScheduleWithRelations> {
  const { data, error } = await supabase
    .from('client_payment_schedule')
    .insert({
      ...schedule,
      organization_id: organizationId,
    })
    .select(`
      id,
      commitment_id,
      organization_id,
      due_date,
      amount,
      currency_id,
      status,
      paid_at,
      payment_method,
      notes,
      created_at,
      updated_at,
      commitment:client_commitments(
        id,
        project_id,
        client_id,
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
  const typedData = data as any;
  return {
    ...typedData,
    commitment: typedData.commitment?.[0] ? {
      ...typedData.commitment[0],
      project_client: typedData.commitment[0].client?.[0] ? {
        ...typedData.commitment[0].client[0],
        contact: typedData.commitment[0].client[0].contact?.[0] || null,
        role: typedData.commitment[0].client[0].role?.[0] || null,
      } : null,
    } : null,
    currency: typedData.currency?.[0] || null,
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
  updates: Partial<Omit<ClientPaymentSchedule, 'id'| 'created_at'| 'updated_at'| 'organization_id'>>,
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
      id,
      commitment_id,
      organization_id,
      due_date,
      amount,
      currency_id,
      status,
      paid_at,
      payment_method,
      notes,
      created_at,
      updated_at,
      commitment:client_commitments(
        id,
        project_id,
        client_id,
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
  const typedData = data as any;
  return {
    ...typedData,
    commitment: typedData.commitment?.[0] ? {
      ...typedData.commitment[0],
      project_client: typedData.commitment[0].client?.[0] ? {
        ...typedData.commitment[0].client[0],
        contact: typedData.commitment[0].client[0].contact?.[0] || null,
        role: typedData.commitment[0].client[0].role?.[0] || null,
      } : null,
    } : null,
    currency: typedData.currency?.[0] || null,
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
