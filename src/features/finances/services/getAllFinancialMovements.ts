import { getClientPayments } from '@/features/clients/services/clientPayments';
import { getPartnerContributions } from './getPartnerContributions';
import { getPartnerWithdrawals } from './getPartnerWithdrawals';
import { supabase } from '@/lib/supabase';
import { parseLocalDate } from '@/lib/date-utils';
import type { FinancialMovementWithRelations } from '../types';
import { 
  mapClientPaymentsToFinancialMovements,
  mapPartnerContributionsToFinancialMovements,
  mapPartnerWithdrawalsToFinancialMovements 
} from '../mappers';

/**
 * Obtiene TODOS los movimientos financieros de una organización o proyecto.
 * 
 * Incluye:
 * - client_payments (Pagos de clientes)
 * - partner_contributions (Aportes de socios)
 * - partner_withdrawals (Retiros de socios)
 * 
 * En el futuro agregará:
 * - material_payments
 * - personnel_payments
 * - indirect_payments
 * - subcontract_payments
 * - general_cost_payments
 * 
 * Eventualmente esto se reemplazará por una VISTA de base de datos
 * que agregue todas las tablas *_payments automáticamente.
 * 
 * @param organizationId - ID de la organización
 * @param projectId - ID del proyecto (opcional). Si se provee, filtra por proyecto. Si es null, muestra toda la organización.
 * @returns Array de movimientos financieros unificados
 * @throws {Error} Si falla la query principal
 */
export async function getAllFinancialMovements(
  organizationId: string,
  projectId?: string | null
): Promise<FinancialMovementWithRelations[]> {
  if (!organizationId) {
    return [];
  }

  // TODO: Por ahora solo traemos client_payments
  // En el futuro, agregar material_payments, personnel_payments, etc.
  // O mejor aún, usar una VISTA de base de datos que agregue todo
  
  try {
    // If projectId is provided, get payments for that specific project
    // Otherwise, get all payments from the organization
    let clientPayments;
    
    if (projectId) {
      // Get payments for specific project using the existing CLIENTS module service
      clientPayments = await getClientPayments(projectId, organizationId);
    } else {
      // Get ALL payments from the organization (across all projects)
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

      if (error) throw error;
      
      clientPayments = paymentsData || [];
    }

    // Hydrate project and creator data for each payment
    // TODO: In the future, create a database VIEW that includes these joins automatically
    const paymentsWithRelations = await Promise.all(
      clientPayments.map(async (payment) => {
        // Fetch project data
        const { data: projectData } = await supabase
          .from('projects')
          .select('id, name, code, color')
          .eq('id', payment.project_id)
          .eq('is_deleted', false)
          .single();

        // Fetch creator data
        const { data: creatorData } = await supabase
          .from('users')
          .select('id, email, full_name, avatar_url')
          .eq('id', payment.created_by)
          .single();

        return {
          ...payment,
          project: projectData || null,
          creator: creatorData || null,
        };
      })
    );

    const clientMovements = mapClientPaymentsToFinancialMovements(paymentsWithRelations);

    // Get partner movements (contributions and withdrawals)
    const [partnerContributions, partnerWithdrawals] = await Promise.all([
      getPartnerContributions(organizationId, projectId || undefined),
      getPartnerWithdrawals(organizationId, projectId || undefined),
    ]);
    
    const contributionMovements = mapPartnerContributionsToFinancialMovements(partnerContributions);
    const withdrawalMovements = mapPartnerWithdrawalsToFinancialMovements(partnerWithdrawals);

    // TODO: Agregar pagos de otros tipos aquí
    // const materialMovements = await getMaterialPayments(organizationId);
    // const personnelMovements = await getPersonnelPayments(organizationId);
    // etc.

    // Combine all movements
    const allMovements = [
      ...clientMovements,
      ...contributionMovements,
      ...withdrawalMovements,
      // ...materialMovements,
      // ...personnelMovements,
      // etc.
    ];

    // Sort by payment date (most recent first)
    allMovements.sort((a, b) => {
      return parseLocalDate(b.payment_date)!.getTime() - parseLocalDate(a.payment_date)!.getTime();
    });

    return allMovements;
  } catch (error) {
    console.error('Error fetching financial movements:', error);
    throw error;
  }
}
