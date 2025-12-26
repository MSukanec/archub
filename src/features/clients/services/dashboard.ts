import { supabase } from '@/lib/supabase';
import type { ClientDashboardData, ClientFinancialSummary } from '../types';
import { getProjectClients } from './projectClients';
import { getClientCommitments } from './clientCommitments';
import { getClientPayments } from './clientPayments';
import { getClientPaymentSchedule } from './clientPaymentSchedule';
/**
 * Obtiene datos agregados del dashboard de clientes con resúmenes financieros.
 * 
 * Incluye:
 * - Todos los clientes del proyecto con sus relaciones
 * - Todos los compromisos con relaciones
 * - Todos los pagos con relaciones
 * - Cronograma de pagos con relaciones
 * - Resúmenes financieros por cliente y moneda
 * 
 * Los resúmenes financieros incluyen:
 * - Total comprometido (suma de compromisos)
 * - Total pagado (suma de pagos)
 * - Total agendado (suma de cronograma)
 * - Balance pendiente (comprometido - pagado)
 * - Estadísticas de cronograma (pagado, pendiente, vencido)
 * - Próximo vencimiento
 * - Último pago
 * 
 * @param projectId - ID del proyecto
 * @param organizationId - ID de la organización
 * @returns Datos del dashboard con resúmenes financieros
 * @throws {Error} Si falla alguna query principal
 */
export async function getClientDashboardData(
  projectId: string,
  organizationId: string
): Promise<ClientDashboardData> {
  if (!supabase || !organizationId || !projectId) {
    return {
      clients: [],
      commitments: [],
      payments: [],
      schedule: [],
      financialSummaries: [],
    };
  }
  // Paralelizar todas las consultas usando las nuevas vistas
  const [
    clientsResult,
    commitmentsResult,
    paymentsResult,
    scheduleResult,
    financialSummaryResult
  ] = await Promise.all([
    supabase.from('project_clients_view').select('*').eq('project_id', projectId).eq('organization_id', organizationId).order('created_at', { ascending: false }),
    getClientCommitments(projectId, organizationId),
    getClientPayments(projectId, organizationId),
    getClientPaymentSchedule(projectId, organizationId),
    supabase.from('client_financial_summary_view').select('*').eq('project_id', projectId).eq('organization_id', organizationId)
  ]);
  if (clientsResult.error) throw clientsResult.error;
  if (financialSummaryResult.error) throw financialSummaryResult.error;
  // Transform view data to match ProjectClientWithRelations
  const clients = (clientsResult.data || []).map(c => ({
    id: c.id,
    project_id: c.project_id,
    organization_id: c.organization_id,
    contact_id: c.contact_id,
    client_role_id: c.client_role_id,
    is_primary: c.is_primary,
    status: c.status,
    notes: c.notes,
    created_at: c.created_at,
    updated_at: c.created_at,
    is_deleted: false,
    deleted_at: null,
    created_by: null,
    contact: {
      id: c.contact_id,
      organization_id: c.organization_id,
      full_name: c.contact_full_name,
      first_name: null,
      last_name: null,
      email: c.contact_email,
      phone: c.contact_phone,
      company_name: c.contact_company_name,
      location: null,
      notes: null,
      national_id: null,
      image_bucket: c.contact_image_bucket,
      image_path: c.contact_image_path,
      avatar_updated_at: null,
      is_local: true,
      display_name_override: null,
      linked_user_id: c.linked_user_id,
      linked_at: null,
      sync_status: null,
      created_at: c.created_at,
      updated_at: c.created_at,
    },
    role: c.role_name ? { 
      id: c.client_role_id, 
      organization_id: c.organization_id,
      name: c.role_name, 
      description: null,
      is_default: false,
      created_at: c.created_at,
      updated_at: null,
      is_deleted: false,
      deleted_at: null 
    } : null
  }));
  // Transform financial summary from view
  const financialSummaries = (financialSummaryResult.data || []).map(f => ({
    clientId: f.client_id,
    summaries: [{
      client_id: f.client_id,
      currency_id: f.currency_id,
      total_committed: f.total_committed_amount || 0,
      total_paid: f.total_paid_amount || 0,
      balance_due: f.balance_due || 0,
      total_scheduled: 0,
      total_schedule_items: 0,
      schedule_paid: 0,
      schedule_pending: 0,
      schedule_overdue: 0,
      next_due_date: null,
      next_due_amount: null,
      last_payment_date: null,
      last_payment_amount: null,
    }]
  }));
  return {
    clients,
    commitments: commitmentsResult,
    payments: paymentsResult,
    schedule: scheduleResult,
    financialSummaries,
  };
}
/**
 * Calcula resúmenes financieros por cliente y moneda.
 * 
 * Esta función procesa los datos de compromisos, pagos y cronogramas
 * para generar un resumen financiero completo por cada cliente en cada moneda.
 * 
 * @param clientIds - IDs de los clientes
 * @param commitments - Compromisos del proyecto
 * @param payments - Pagos del proyecto
 * @param schedule - Cronograma de pagos del proyecto
 * @returns Array de resúmenes financieros por cliente con sus respectivas monedas
 */
function calculateFinancialSummaries(
  clientIds: string[],
  commitments: any[],
  payments: any[],
  schedule: any[]
): Array<{ clientId: string; summaries: ClientFinancialSummary[] }> {
  const summariesByClient: Array<{ clientId: string; summaries: ClientFinancialSummary[] }> = [];
  clientIds.forEach(clientId => {
    const clientCommitments = commitments.filter(c => c.client_id === clientId);
    const clientPayments = payments.filter(p => p.client_id === clientId);
    
    const currencyGroups: Record<string, ClientFinancialSummary> = {};
    clientCommitments.forEach(commitment => {
      const currencyId = commitment.currency_id;
      
      if (!currencyGroups[currencyId]) {
        currencyGroups[currencyId] = {
          client_id: clientId,
          currency_id: currencyId,
          total_committed: 0,
          total_paid: 0,
          total_scheduled: 0,
          balance_due: 0,
          total_schedule_items: 0,
          schedule_paid: 0,
          schedule_pending: 0,
          schedule_overdue: 0,
          next_due_date: null,
          next_due_amount: null,
          last_payment_date: null,
          last_payment_amount: null,
        };
      }
      const summary = currencyGroups[currencyId];
      summary.total_committed += commitment.amount;
      const commitmentSchedule = schedule.filter(s => s.commitment_id === commitment.id);
      commitmentSchedule.forEach(scheduleItem => {
        summary.total_scheduled += scheduleItem.amount;
        summary.total_schedule_items += 1;
        if (scheduleItem.status === 'paid') {
          summary.schedule_paid += 1;
        } else if (scheduleItem.status === 'pending') {
          summary.schedule_pending += 1;
          
          if (!summary.next_due_date || scheduleItem.due_date < summary.next_due_date) {
            summary.next_due_date = scheduleItem.due_date;
            summary.next_due_amount = scheduleItem.amount;
          }
        } else if (scheduleItem.status === 'overdue') {
          summary.schedule_overdue += 1;
          
          if (!summary.next_due_date || scheduleItem.due_date < summary.next_due_date) {
            summary.next_due_date = scheduleItem.due_date;
            summary.next_due_amount = scheduleItem.amount;
          }
        }
      });
    });
    clientPayments.forEach(payment => {
      const currencyId = payment.currency_id;
      
      if (!currencyGroups[currencyId]) {
        currencyGroups[currencyId] = {
          client_id: clientId,
          currency_id: currencyId,
          total_committed: 0,
          total_paid: 0,
          total_scheduled: 0,
          balance_due: 0,
          total_schedule_items: 0,
          schedule_paid: 0,
          schedule_pending: 0,
          schedule_overdue: 0,
          next_due_date: null,
          next_due_amount: null,
          last_payment_date: null,
          last_payment_amount: null,
        };
      }
      const summary = currencyGroups[currencyId];
      summary.total_paid += payment.amount;
      if (!summary.last_payment_date || payment.payment_date > summary.last_payment_date) {
        summary.last_payment_date = payment.payment_date;
        summary.last_payment_amount = payment.amount;
      }
    });
    Object.values(currencyGroups).forEach(summary => {
      summary.balance_due = summary.total_committed - summary.total_paid;
    });
    summariesByClient.push({
      clientId,
      summaries: Object.values(currencyGroups),
    });
  });
  return summariesByClient;
}
