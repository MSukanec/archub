import { supabase } from '@/lib/supabase';
import type { ClientPayment, ClientPaymentWithRelations } from '../types';

/**
 * Obtiene todos los pagos de cliente de un proyecto con sus relaciones.
 * 
 * Incluye:
 * - Cliente (project_clients con contact y role)
 * - Compromiso (client_commitments)
 * - Cronograma (client_payment_schedule)
 * - Contacto directo (contacts)
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
          currency_id
        )
      )
    `)
    .eq('organization_id', organizationId)
    .eq('project_id', projectId)
    .order('payment_date', { ascending: false });

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
      contact: payment.client.contact || null,
      role: payment.client.role || null,
    } : null,
    commitment: payment.commitment || null,
    schedule: payment.schedule || null,
    contact: payment.contact || null,
    currency: payment.currency || null,
    wallet: payment.wallet || null,
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
 * - Contacto directo (contacts)
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
          currency_id
        )
      )
    `)
    .eq('id', paymentId)
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
    commitment: data.commitment || null,
    schedule: data.schedule || null,
    contact: data.contact || null,
    currency: data.currency || null,
    wallet: data.wallet || null,
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
  payment: Omit<ClientPayment, 'id' | 'created_at' | 'updated_at' | 'project_id' | 'organization_id' | 'created_by'>,
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
          currency_id
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
      contact: data.client.contact || null,
      role: data.client.role || null,
    } : null,
    commitment: data.commitment || null,
    schedule: data.schedule || null,
    contact: data.contact || null,
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
  updates: Partial<Omit<ClientPayment, 'id' | 'created_at' | 'updated_at' | 'project_id' | 'organization_id' | 'created_by'>>,
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
          currency_id
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
      contact: data.client.contact || null,
      role: data.client.role || null,
    } : null,
    commitment: data.commitment || null,
    schedule: data.schedule || null,
    contact: data.contact || null,
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
    .delete()
    .eq('id', paymentId)
    .eq('organization_id', organizationId);

  if (error) {
    throw error;
  }

  return true;
}
