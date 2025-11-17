/**
 * Mappers for transforming client data between different formats
 */

import type {
  ProjectClientWithRelations,
  ClientListItem,
  ClientFinancialSummary,
  ClientDashboardData,
} from '../types';

/**
 * Maps project clients with financial data to client list items for display
 */
export function mapToClientListItems(
  clients: ProjectClientWithRelations[],
  financialSummaries: Map<string, ClientFinancialSummary[]>
): ClientListItem[] {
  return clients.map((client) => {
    const summaries = financialSummaries.get(client.id) || [];

    return {
      id: client.id,
      contact: client.contact,
      role: client.role,
      unit: client.unit,
      is_primary: client.is_primary,
      status: client.status,
      notes: client.notes,
      created_at: client.created_at,
      financial: summaries.map((summary) => ({
        currency_id: summary.currency_id,
        currency_code: summary.currency_id, // Will be populated from currency data
        currency_symbol: summary.currency_id, // Will be populated from currency data
        total_committed: summary.total_committed,
        total_paid: summary.total_paid,
        balance_due: summary.balance_due,
        next_due_date: summary.next_due_date,
        next_due_amount: summary.next_due_amount,
        last_payment_date: summary.last_payment_date,
      })),
    };
  });
}

/**
 * Calculates total amounts across all currencies for a client
 */
export function calculateClientTotals(summaries: ClientFinancialSummary[]) {
  return summaries.reduce(
    (acc, summary) => ({
      total_committed: acc.total_committed + summary.total_committed,
      total_paid: acc.total_paid + summary.total_paid,
      balance_due: acc.balance_due + summary.balance_due,
    }),
    { total_committed: 0, total_paid: 0, balance_due: 0 }
  );
}

/**
 * Groups financial summaries by currency for display
 */
export function groupSummariesByCurrency(
  summaries: ClientFinancialSummary[]
): Map<string, ClientFinancialSummary> {
  return new Map(summaries.map((summary) => [summary.currency_id, summary]));
}

/**
 * Formats contact display name with fallbacks
 */
export function formatClientDisplayName(
  contact: { full_name?: string | null; first_name?: string | null; last_name?: string | null; company_name?: string | null } | null
): string {
  if (!contact) return 'Sin contacto';
  
  if (contact.full_name) return contact.full_name;
  
  const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ');
  if (name) return name;
  
  if (contact.company_name) return contact.company_name;
  
  return 'Sin nombre';
}

/**
 * Calculates payment completion percentage for a client
 */
export function calculatePaymentProgress(summary: ClientFinancialSummary): number {
  if (summary.total_committed === 0) return 0;
  return Math.round((summary.total_paid / summary.total_committed) * 100);
}

/**
 * Determines if a client has overdue payments
 */
export function hasOverduePayments(summary: ClientFinancialSummary): boolean {
  return summary.schedule_overdue > 0;
}

/**
 * Gets the status color for a payment schedule item
 */
export function getScheduleStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'yellow',
    paid: 'green',
    overdue: 'red',
    cancelled: 'gray',
  };
  return colors[status] || 'gray';
}

/**
 * Gets the status color for a payment
 */
export function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    confirmed: 'green',
    pending: 'yellow',
    rejected: 'red',
    void: 'gray',
  };
  return colors[status] || 'gray';
}

/**
 * Gets the status color for a client
 */
export function getClientStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: 'green',
    inactive: 'gray',
    deleted: 'red',
    potential: 'blue',
    rejected: 'orange',
    completed: 'purple',
  };
  return colors[status] || 'gray';
}
