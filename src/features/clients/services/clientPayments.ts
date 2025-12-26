import { supabase } from '@/lib/supabase';
import type { ClientPayment, ClientPaymentWithRelations } from '../types';
/**
 * Obtiene todos los pagos de cliente de un proyecto con sus relaciones.
 * 
 * Incluye:
 * - Cliente (project_clients con contact y role)
 * - Compromiso (client_commitments)
 * - Cronograma (client_payment_schedule)
 * - Moneda (currencies)
 * - Billetera (organization_wallets)
 * 
 * @param projectId - ID del proyecto
 * @param organizationId - ID de la organización
 * @returns Array de pagos con relaciones, o array vacío si no hay datos
 * @throws {Error} Si falla la query principal de Supabase
 */
export async function getClientPayments(
  projectId: string,
  organizationId: string
): Promise<ClientPaymentWithRelations[]> {
  if (!supabase || !organizationId || !projectId) {
    return [];
  }
  const { data: paymentsData, error } = await supabase
    .from('client_payments')
    .select(`
      *,
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
        updated_at
      ),
      schedule:client_payment_schedule(
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
        updated_at
      ),
      currency:currencies(
        id,
        code,
        symbol,
        name
      ),
      wallet:organization_wallets(
        id,
        organization_id,
        wallet_id,
        is_active,
        is_default,
        wallets:wallet_id(
          id,
          name,
          is_active,
          created_at,
          updated_at
        )
      ),
      creator:organization_members!created_by(
        id,
        user:users(
          id,
          email,
          full_name,
          avatar_url
        )
      ),
      project:projects(
        id,
        name,
        code,
        color
      ),
      media_links!client_payment_id(
        id,
        media_file_id,
        visibility,
        description,
        category,
        position,
        created_at,
        media_file:media_files(
          id,
          file_url,
          file_name,
          file_type,
          file_size
        )
      )
    `)
    .eq('organization_id', organizationId)
    .eq('project_id', projectId)
    .or('is_deleted.is.null,is_deleted.eq.false')
    .order('payment_date', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) {
    throw error;
  }
  if (!paymentsData || paymentsData.length === 0) {
    return [];
  }
  const data = paymentsData.map(payment => ({
    ...payment,
    client: payment.client ? {
      ...payment.client,
      contact: payment.client.contact && !payment.client.contact.is_deleted 
        ? payment.client.contact 
        : null,
      role: payment.client.role && !payment.client.role.is_deleted 
        ? payment.client.role 
        : null,
    } : null,
    commitment: payment.commitment || null,
    schedule: payment.schedule || null,
    currency: payment.currency || null,
    wallet: payment.wallet || null,
    creator: payment.creator?.user ? {
      id: payment.creator.user.id,
      email: payment.creator.user.email,
      full_name: payment.creator.user.full_name,
      avatar_url: payment.creator.user.avatar_url,
    } : null,
    project: payment.project || null,
    attachments: payment.media_links?.map((link: any) => ({
      id: link.id,
      media_file_id: link.media_file_id,
      visibility: link.visibility,
      description: link.description,
      category: link.category,
      position: link.position,
      created_at: link.created_at,
      media_file: link.media_file,
      file_url: link.media_file?.file_url || '',
      file_name: link.media_file?.file_name || '',
    })) || [],
  }));
  return data;
}
/**
 * Obtiene un pago de cliente específico por su ID.
 * 
 * Incluye:
 * - Cliente (project_clients con contact y role)
 * - Compromiso (client_commitments)
 * - Cronograma (client_payment_schedule)
 * - Moneda (currencies)
 * - Billetera (organization_wallets)
 * 
 * @param paymentId - ID del pago
 * @param organizationId - ID de la organización
 * @returns Pago con relaciones, o null si no existe
 * @throws {Error} Si falla la query de Supabase
 */
export async function getClientPaymentById(
  paymentId: string,
  organizationId: string
): Promise<ClientPaymentWithRelations | null> {
  if (!supabase || !organizationId || !paymentId) {
    return null;
  }
  const { data, error } = await supabase
    .from('client_payments')
    .select(`
      *,
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
        updated_at
      ),
      schedule:client_payment_schedule(
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
        updated_at
      ),
      currency:currencies(
        id,
        code,
        symbol,
        name
      ),
      wallet:organization_wallets(
        id,
        organization_id,
        wallet_id,
        is_active,
        is_default,
        wallets:wallet_id(
          id,
          name,
          is_active,
          created_at,
          updated_at
        )
      ),
      media_links!client_payment_id(
        id,
        media_file_id,
        visibility,
        description,
        category,
        position,
        created_at,
        media_file:media_files(
          id,
          file_url,
          file_name,
          file_type,
          file_size
        )
      )
    `)
    .eq('id', paymentId)
    .eq('organization_id', organizationId)
    .or('is_deleted.is.null,is_deleted.eq.false')
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
      contact: data.client.contact && !data.client.contact.is_deleted 
        ? data.client.contact 
        : null,
      role: data.client.role && !data.client.role.is_deleted 
        ? data.client.role 
        : null,
    } : null,
    commitment: data.commitment || null,
    schedule: data.schedule || null,
    currency: data.currency || null,
    wallet: data.wallet || null,
    attachments: data.media_links?.map((link: any) => ({
      id: link.id,
      media_file_id: link.media_file_id,
      visibility: link.visibility,
      description: link.description,
      category: link.category,
      position: link.position,
      created_at: link.created_at,
      media_file: link.media_file,
      file_url: link.media_file?.file_url || '',
      file_name: link.media_file?.file_name || '',
    })) || [],
  };
}
/**
 * Crea un nuevo pago de cliente.
 * 
 * @param payment - Datos del pago a crear
 * @param projectId - ID del proyecto
 * @param organizationId - ID de la organización
 * @param createdBy - ID del miembro de organización que crea el registro
 * @returns Pago creado con sus relaciones
 * @throws {Error} Si falla la creación
 */
export async function createClientPayment(
  payment: Omit<ClientPayment, 'id'| 'created_at'| 'updated_at'| 'project_id'| 'organization_id'| 'created_by'>,
  projectId: string,
  organizationId: string,
  createdBy: string
): Promise<ClientPaymentWithRelations> {
  const { data, error } = await supabase
    .from('client_payments')
    .insert({
      ...payment,
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
        updated_at
      ),
      schedule:client_payment_schedule(
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
        updated_at
      ),
      currency:currencies(
        id,
        code,
        symbol,
        name
      ),
      wallet:organization_wallets(
        id,
        organization_id,
        wallet_id,
        is_active,
        is_default,
        wallets:wallet_id(
          id,
          name,
          is_active,
          created_at,
          updated_at
        )
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
      contact: data.client.contact && !data.client.contact.is_deleted 
        ? data.client.contact 
        : null,
      role: data.client.role && !data.client.role.is_deleted 
        ? data.client.role 
        : null,
    } : null,
    commitment: data.commitment || null,
    schedule: data.schedule || null,
    currency: data.currency || null,
    wallet: data.wallet || null,
  };
}
/**
 * Actualiza un pago de cliente existente.
 * 
 * @param paymentId - ID del pago a actualizar
 * @param updates - Campos a actualizar
 * @param organizationId - ID de la organización
 * @returns Pago actualizado con sus relaciones
 * @throws {Error} Si falla la actualización
 */
export async function updateClientPayment(
  paymentId: string,
  updates: Partial<Omit<ClientPayment, 'id'| 'created_at'| 'updated_at'| 'project_id'| 'organization_id'| 'created_by'>>,
  organizationId: string
): Promise<ClientPaymentWithRelations> {
  const { data, error } = await supabase
    .from('client_payments')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentId)
    .eq('organization_id', organizationId)
    .select(`
      *,
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
        updated_at
      ),
      schedule:client_payment_schedule(
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
        updated_at
      ),
      currency:currencies(
        id,
        code,
        symbol,
        name
      ),
      wallet:organization_wallets(
        id,
        organization_id,
        wallet_id,
        is_active,
        is_default,
        wallets:wallet_id(
          id,
          name,
          is_active,
          created_at,
          updated_at
        )
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
      contact: data.client.contact && !data.client.contact.is_deleted 
        ? data.client.contact 
        : null,
      role: data.client.role && !data.client.role.is_deleted 
        ? data.client.role 
        : null,
    } : null,
    commitment: data.commitment || null,
    schedule: data.schedule || null,
    currency: data.currency || null,
    wallet: data.wallet || null,
  };
}
/**
 * Elimina un pago de cliente.
 * 
 * @param paymentId - ID del pago a eliminar
 * @param organizationId - ID de la organización
 * @returns true si se eliminó correctamente
 * @throws {Error} Si falla la eliminación
 */
export async function deleteClientPayment(
  paymentId: string,
  organizationId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('client_payments')
    .update({ 
      is_deleted: true, 
      deleted_at: new Date().toISOString() 
    })
    .eq('id', paymentId)
    .eq('organization_id', organizationId);
  if (error) {
    throw error;
  }
  return true;
}
