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
      financialSummaries: new Map(),
    };
  }

  const [clients, commitments, payments, schedule] = await Promise.all([
    getProjectClients(projectId, organizationId),
    getClientCommitments(projectId, organizationId),
    getClientPayments(projectId, organizationId),
    getClientPaymentSchedule(projectId, organizationId),
  ]);

  const financialSummaries = calculateFinancialSummaries(
    clients.map(c => c.id),
    commitments,
    payments,
    schedule
  );

  return {
    clients,
    commitments,
    payments,
    schedule,
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
 * @returns Map de client_id a array de resúmenes financieros por moneda
 */
function calculateFinancialSummaries(
  clientIds: string[],
  commitments: any[],
  payments: any[],
  schedule: any[]
): Map<string, ClientFinancialSummary[]> {
  const summariesMap = new Map<string, ClientFinancialSummary[]>();

  clientIds.forEach(clientId => {
    const clientCommitments = commitments.filter(c => c.client_id === clientId);
    const clientPayments = payments.filter(p => p.client_id === clientId);
    
    const currencyGroups = new Map<string, ClientFinancialSummary>();

    clientCommitments.forEach(commitment => {
      const currencyId = commitment.currency_id;
      
      if (!currencyGroups.has(currencyId)) {
        currencyGroups.set(currencyId, {
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
        });
      }

      const summary = currencyGroups.get(currencyId)!;
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
      
      if (!currencyGroups.has(currencyId)) {
        currencyGroups.set(currencyId, {
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
        });
      }

      const summary = currencyGroups.get(currencyId)!;
      summary.total_paid += payment.amount;

      if (!summary.last_payment_date || payment.payment_date > summary.last_payment_date) {
        summary.last_payment_date = payment.payment_date;
        summary.last_payment_amount = payment.amount;
      }
    });

    currencyGroups.forEach((summary, currencyId) => {
      summary.balance_due = summary.total_committed - summary.total_paid;
    });

    summariesMap.set(clientId, Array.from(currencyGroups.values()));
  });

  return summariesMap;
}
