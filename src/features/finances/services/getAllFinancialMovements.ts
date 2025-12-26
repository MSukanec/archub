import { getClientPayments } from '@/features/clients/services/clientPayments';
import { getPartnerContributions } from './getPartnerContributions';
import { getPartnerWithdrawals } from './getPartnerWithdrawals';
import { supabase } from '@/lib/supabase';
import { parseLocalDate } from '@/lib/date-utils';
import type { FinancialMovementWithRelations } from '../types';
import type { MaterialPaymentWithRelations } from '@/features/materials/types';
import type { PersonnelPaymentWithRelations } from '@/features/personnel/types';
import type { GeneralCostPayment } from '@/features/general-costs/types';
  mapClientPaymentsToFinancialMovements,
  mapPartnerContributionsToFinancialMovements,
  mapPartnerWithdrawalsToFinancialMovements,
  mapMaterialPaymentsToFinancialMovements,
  mapPersonnelPaymentsToFinancialMovements,
  mapGeneralCostPaymentsToFinancialMovements,
} from '../mappers';
async function getMaterialPaymentsForOrganization(
  organizationId: string,
  projectId?: string | null
): Promise<MaterialPaymentWithRelations[]> {
  let query = supabase
    .from('material_payments')
    .select(`
      *,
      currency:currencies(id, code, symbol, name),
      wallet:organization_wallets(
        id, organization_id, wallet_id, is_active, is_default,
        wallets:wallet_id(id, name, is_active, created_at, updated_at)
      ),
      project:projects(id, name, code, color)
    `)
    .eq('organization_id', organizationId)
    .order('payment_date', { ascending: false });
  if (projectId) {
    query = query.eq('project_id', projectId);
  }
  const { data, error } = await query;
  if (error) {
    console.error('Error fetching material payments:', error);
    return [];
  }
  const paymentsWithCreator = await Promise.all(
    (data || []).map(async (payment) => {
      let creator = null;
      if (payment.created_by) {
        const { data: userData } = await supabase
          .from('users')
          .select('id, email, full_name, avatar_url')
          .eq('id', payment.created_by)
          .single();
        creator = userData;
      }
      return {
        ...payment,
        creator,
        currency: Array.isArray(payment.currency) ? payment.currency[0] : payment.currency,
        wallet: Array.isArray(payment.wallet) ? payment.wallet[0] : payment.wallet,
        project: Array.isArray(payment.project) ? payment.project[0] : payment.project,
      } as MaterialPaymentWithRelations;
    })
  );
  return paymentsWithCreator;
}
async function getPersonnelPaymentsForOrganization(
  organizationId: string,
  projectId?: string | null
): Promise<PersonnelPaymentWithRelations[]> {
  let query = supabase
    .from('personnel_payments')
    .select(`
      *,
      currency:currencies(id, code, symbol),
      wallet:organization_wallets(
        id,
        wallets:wallet_id(id, name)
      ),
      project:projects(id, name, color),
      personnel:project_personnel(
        id,
        contact:contacts(id, first_name, last_name, full_name)
      )
    `)
    .eq('organization_id', organizationId)
    .order('payment_date', { ascending: false });
  if (projectId) {
    query = query.eq('project_id', projectId);
  }
  const { data, error } = await query;
  if (error) {
    console.error('Error fetching personnel payments:', error);
    return [];
  }
  return (data || []).map((payment) => ({
    ...payment,
    currency: Array.isArray(payment.currency) ? payment.currency[0] : payment.currency,
    wallet: Array.isArray(payment.wallet) ? payment.wallet[0] : payment.wallet,
    project: Array.isArray(payment.project) ? payment.project[0] : payment.project,
    personnel: Array.isArray(payment.personnel) ? payment.personnel[0] : payment.personnel,
  })) as PersonnelPaymentWithRelations[];
}
async function getGeneralCostPaymentsForOrganization(
  organizationId: string
): Promise<GeneralCostPayment[]> {
  const { data, error } = await supabase
    .from('general_costs_payments')
    .select(`
      *,
      currency:currencies(id, code, symbol, name),
      wallet:organization_wallets(
        id,
        wallets:wallet_id(id, name)
      ),
      general_cost:general_costs(id, name, description),
      creator:organization_members!created_by(
        id,
        users:user_id(id, full_name, avatar_url)
      )
    `)
    .eq('organization_id', organizationId)
    .order('payment_date', { ascending: false });
  if (error) {
    console.error('Error fetching general cost payments:', error);
    return [];
  }
  return (data || []).map((payment) => ({
    ...payment,
    currency: Array.isArray(payment.currency) ? payment.currency[0] : payment.currency,
    wallet: Array.isArray(payment.wallet) ? payment.wallet[0] : payment.wallet,
    general_cost: Array.isArray(payment.general_cost) ? payment.general_cost[0] : payment.general_cost,
    creator: Array.isArray(payment.creator) ? payment.creator[0] : payment.creator,
  })) as GeneralCostPayment[];
}
/**
 * Obtiene TODOS los movimientos financieros de una organización o proyecto.
 * 
 * Incluye:
 * - client_payments (Pagos de clientes)
 * - partner_contributions (Aportes de socios)
 * - partner_withdrawals (Retiros de socios)
 * - material_payments (Pagos de materiales)
 * - personnel_payments (Pagos de personal)
 * - general_costs_payments (Pagos de gastos generales)
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
  try {
    let clientPayments;
    
    if (projectId) {
      clientPayments = await getClientPayments(projectId, organizationId);
    } else {
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
    const paymentsWithRelations = await Promise.all(
      clientPayments.map(async (payment) => {
        const { data: projectData } = await supabase
          .from('projects')
          .select('id, name, code, color')
          .eq('id', payment.project_id)
          .eq('is_deleted', false)
          .single();
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
    const [
      partnerContributions,
      partnerWithdrawals,
      materialPayments,
      personnelPayments,
      generalCostPayments,
    ] = await Promise.all([
      getPartnerContributions(organizationId, projectId || undefined),
      getPartnerWithdrawals(organizationId, projectId || undefined),
      getMaterialPaymentsForOrganization(organizationId, projectId),
      getPersonnelPaymentsForOrganization(organizationId, projectId),
      getGeneralCostPaymentsForOrganization(organizationId),
    ]);
    
    const contributionMovements = mapPartnerContributionsToFinancialMovements(partnerContributions);
    const withdrawalMovements = mapPartnerWithdrawalsToFinancialMovements(partnerWithdrawals);
    const materialMovements = mapMaterialPaymentsToFinancialMovements(materialPayments);
    const personnelMovements = mapPersonnelPaymentsToFinancialMovements(personnelPayments);
    const generalCostMovements = mapGeneralCostPaymentsToFinancialMovements(generalCostPayments);
    const allMovements = [
      ...clientMovements,
      ...contributionMovements,
      ...withdrawalMovements,
      ...materialMovements,
      ...personnelMovements,
      ...generalCostMovements,
    ];
    allMovements.sort((a, b) => {
      return parseLocalDate(b.payment_date)!.getTime() - parseLocalDate(a.payment_date)!.getTime();
    });
    return allMovements;
  } catch (error) {
    console.error('Error fetching financial movements:', error);
    throw error;
  }
}
