import { getClientPayments } from '@/features/clients/services/clientPayments';
import type { FinancialMovementWithRelations } from '../types';
import { mapClientPaymentsToFinancialMovements } from '../mappers';

/**
 * Obtiene TODOS los movimientos financieros de una organización.
 * 
 * Por ahora solo trae de client_payments, pero eventualmente
 * agregará datos de material_payments, personnel_payments, etc.
 * 
 * En el futuro esto se reemplazará por una VISTA de base de datos
 * que agregue todas las tablas *_payments automáticamente.
 * 
 * @param organizationId - ID de la organización
 * @returns Array de movimientos financieros unificados
 * @throws {Error} Si falla la query principal
 */
export async function getAllFinancialMovements(
  organizationId: string
): Promise<FinancialMovementWithRelations[]> {
  if (!organizationId) {
    return [];
  }

  // TODO: Por ahora solo traemos client_payments
  // En el futuro, agregar material_payments, personnel_payments, etc.
  // O mejor aún, usar una VISTA de base de datos que agregue todo
  
  try {
    // Get all client payments for the organization (all projects)
    // We'll need to get payments from all projects, so we'll query without project filter
    const { data: clientPaymentsData, error } = await (await import('@/lib/supabase')).supabase
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
      .eq('organization_id', organizationId)
      .order('payment_date', { ascending: false });

    if (error) {
      throw error;
    }

    if (!clientPaymentsData || clientPaymentsData.length === 0) {
      return [];
    }

    // Transform to unified format
    const clientPaymentsFormatted = clientPaymentsData.map(payment => ({
      ...payment,
      client: payment.client ? {
        ...payment.client,
        contact: payment.client.contact || null,
        role: payment.client.role || null,
      } : null,
      commitment: payment.commitment || null,
      schedule: payment.schedule || null,
      currency: payment.currency || null,
      wallet: payment.wallet || null,
    }));

    const clientMovements = mapClientPaymentsToFinancialMovements(clientPaymentsFormatted);

    // TODO: Agregar pagos de otros tipos aquí
    // const materialMovements = await getMaterialPayments(organizationId);
    // const personnelMovements = await getPersonnelPayments(organizationId);
    // etc.

    // Combine all movements
    const allMovements = [
      ...clientMovements,
      // ...materialMovements,
      // ...personnelMovements,
      // etc.
    ];

    // Sort by payment date (most recent first)
    allMovements.sort((a, b) => {
      return new Date(b.payment_date).getTime() - new Date(a.payment_date).getTime();
    });

    return allMovements;
  } catch (error) {
    console.error('Error fetching financial movements:', error);
    throw error;
  }
}
