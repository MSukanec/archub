import { supabase } from '@/lib/supabase';
import type { MaterialPayment, MaterialPaymentWithRelations } from '../types';

/**
 * Obtiene todos los pagos de materiales de un proyecto con sus relaciones.
 * 
 * Incluye:
 * - Moneda (currencies)
 * - Billetera (organization_wallets)
 * - Creador (organization_members -> users)
 * - Proyecto (projects)
 * - Adjuntos (media_links -> media_files)
 * 
 * @param projectId - ID del proyecto
 * @param organizationId - ID de la organización
 * @returns Array de pagos con relaciones, o array vacío si no hay datos
 * @throws {Error} Si falla la query principal de Supabase
 */
export async function getMaterialPayments(
  projectId: string,
  organizationId: string
): Promise<MaterialPaymentWithRelations[]> {
  if (!supabase || !organizationId || !projectId) {
    return [];
  }

  const { data: paymentsData, error } = await supabase
    .from('material_payments')
    .select(`
      *,
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
      media_links!material_payment_id(
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
    .order('payment_date', { ascending: false });

  if (error) {
    throw error;
  }

  if (!paymentsData || paymentsData.length === 0) {
    return [];
  }

  const data = paymentsData.map(payment => ({
    ...payment,
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
      file_type: link.media_file?.file_type || '',
    })) || [],
  }));

  return data;
}

/**
 * Obtiene un pago de materiales específico por su ID.
 * 
 * Incluye:
 * - Moneda (currencies)
 * - Billetera (organization_wallets)
 * - Creador (organization_members -> users)
 * - Proyecto (projects)
 * - Adjuntos (media_links -> media_files)
 * 
 * @param paymentId - ID del pago
 * @param organizationId - ID de la organización
 * @returns Pago con relaciones, o null si no existe
 * @throws {Error} Si falla la query de Supabase
 */
export async function getMaterialPaymentById(
  paymentId: string,
  organizationId: string
): Promise<MaterialPaymentWithRelations | null> {
  if (!supabase || !organizationId || !paymentId) {
    return null;
  }

  const { data, error } = await supabase
    .from('material_payments')
    .select(`
      *,
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
      media_links!material_payment_id(
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
    .single();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return {
    ...data,
    currency: data.currency || null,
    wallet: data.wallet || null,
    creator: data.creator?.user ? {
      id: data.creator.user.id,
      email: data.creator.user.email,
      full_name: data.creator.user.full_name,
      avatar_url: data.creator.user.avatar_url,
    } : null,
    project: data.project || null,
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
      file_type: link.media_file?.file_type || '',
    })) || [],
  };
}

/**
 * Crea un nuevo pago de materiales.
 * 
 * @param payment - Datos del pago a crear
 * @param projectId - ID del proyecto
 * @param organizationId - ID de la organización
 * @param createdBy - ID del miembro de organización que crea el registro
 * @returns Pago creado con sus relaciones
 * @throws {Error} Si falla la creación
 */
export async function createMaterialPayment(
  payment: Omit<MaterialPayment, 'id' | 'created_at' | 'updated_at' | 'project_id' | 'organization_id' | 'created_by'>,
  projectId: string,
  organizationId: string,
  createdBy: string
): Promise<MaterialPaymentWithRelations> {
  const { data, error } = await supabase
    .from('material_payments')
    .insert({
      ...payment,
      project_id: projectId,
      organization_id: organizationId,
      created_by: createdBy,
    })
    .select(`
      *,
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
      )
    `)
    .single();

  if (error) {
    throw error;
  }

  return {
    ...data,
    currency: data.currency || null,
    wallet: data.wallet || null,
    creator: data.creator?.user ? {
      id: data.creator.user.id,
      email: data.creator.user.email,
      full_name: data.creator.user.full_name,
      avatar_url: data.creator.user.avatar_url,
    } : null,
    project: data.project || null,
    attachments: [],
  };
}

/**
 * Actualiza un pago de materiales existente.
 * 
 * @param paymentId - ID del pago a actualizar
 * @param updates - Campos a actualizar
 * @param organizationId - ID de la organización
 * @returns Pago actualizado con sus relaciones
 * @throws {Error} Si falla la actualización
 */
export async function updateMaterialPayment(
  paymentId: string,
  updates: Partial<Omit<MaterialPayment, 'id' | 'created_at' | 'updated_at' | 'project_id' | 'organization_id' | 'created_by'>>,
  organizationId: string
): Promise<MaterialPaymentWithRelations> {
  const { data, error } = await supabase
    .from('material_payments')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', paymentId)
    .eq('organization_id', organizationId)
    .select(`
      *,
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
      )
    `)
    .single();

  if (error) {
    throw error;
  }

  return {
    ...data,
    currency: data.currency || null,
    wallet: data.wallet || null,
    creator: data.creator?.user ? {
      id: data.creator.user.id,
      email: data.creator.user.email,
      full_name: data.creator.user.full_name,
      avatar_url: data.creator.user.avatar_url,
    } : null,
    project: data.project || null,
    attachments: [],
  };
}

/**
 * Elimina un pago de materiales.
 * 
 * @param paymentId - ID del pago a eliminar
 * @param organizationId - ID de la organización
 * @returns true si se eliminó correctamente
 * @throws {Error} Si falla la eliminación
 */
export async function deleteMaterialPayment(
  paymentId: string,
  organizationId: string
): Promise<boolean> {
  const { error } = await supabase
    .from('material_payments')
    .delete()
    .eq('id', paymentId)
    .eq('organization_id', organizationId);

  if (error) {
    throw error;
  }

  return true;
}
