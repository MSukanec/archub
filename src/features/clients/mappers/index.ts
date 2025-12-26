/**
 * Mappers for transforming client data between different formats and calculating KPIs
 */

import type {
  ProjectClientWithRelations,
  ClientListItem,
  ClientFinancialSummary,
  ClientDashboardData,
  ClientPaymentWithRelations,
} from '../types';

// ========== Types for transformed data ==========

export interface CurrencyFinancial {
  currency: {
    id: string;
    code: string;
    symbol: string;
  } | null;
  total_committed_amount: number;
  total_paid_amount: number;
  balance_due: number;
  next_due_date: string | null;
  next_due_amount: number | null;
  last_payment_date: string | null;
  total_schedule_items: number;
  schedule_paid: number;
  schedule_overdue: number;
}

export interface ProjectClientSummary {
  id: string;
  contact_id: string;
  notes: string | null;
  is_primary: boolean;
  status: string;
  contacts: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    email: string | null;
    phone?: string | null;
    company_name?: string | null;
    image_bucket?: string | null;
    image_path?: string | null;
    linked_user?: {
      id: string;
      avatar_url?: string;
    } | null;
  } | null;
  role: {
    id: string;
    name: string;
    is_default?: boolean;
  } | null;
  financialByCurrency: CurrencyFinancial[];
  total_committed_amount: number;
  total_paid_amount: number;
  balance_due: number;
  next_due: number | null;
}

export interface DashboardKPIs {
  totalClients: number;
  totalPayments: number;
  totalCommittedAmount: number;
  totalBalanceDue: number;
}

export interface ObligationsKPIs {
  totalCommittedAmount: number;
  totalPaidAmount: number;
  totalBalanceDue: number;
  totalScheduleItems: number;
  totalSchedulePaid: number;
  paidPercentage: number;
  balancePercentage: number;
  schedulePercentage: number;
}

// ========== Helper Functions ==========

/**
 * Gets financial summaries for a specific client
 */
export function getFinancialSummariesForClient(
  clientId: string,
  financialSummaries: Array<{ clientId: string; summaries: ClientFinancialSummary[] }>
): ClientFinancialSummary[] {
  const clientSummary = financialSummaries.find(fs => fs.clientId === clientId);
  return clientSummary?.summaries || [];
}

/**
 * Maps project clients with financial data to client list items for display
 */
export function mapToClientListItems(
  clients: ProjectClientWithRelations[],
  financialSummaries: Array<{ clientId: string; summaries: ClientFinancialSummary[] }>
): ClientListItem[] {
  return clients.map((client) => {
    const summaries = getFinancialSummariesForClient(client.id, financialSummaries);

    return {
      id: client.id,
      contact: client.contact,
      role: client.role,
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

// ========== Dashboard Data Transformations ==========

/**
 * Maps a client with financial summaries to a ProjectClientSummary
 * This centralizes the transformation logic that was scattered across pages
 */
export function mapToClientSummary(
  client: ProjectClientWithRelations,
  financialSummaries: Array<{ clientId: string; summaries: ClientFinancialSummary[] }>
): ProjectClientSummary {
  const summaries = getFinancialSummariesForClient(client.id, financialSummaries);
  
  const financialByCurrency: CurrencyFinancial[] = summaries.map((summary) => ({
    currency: summary.currency_id ? {
      id: summary.currency_id,
      code: 'ARS',
      symbol: '$',
    } : null,
    total_committed_amount: summary.total_committed,
    total_paid_amount: summary.total_paid,
    balance_due: summary.balance_due,
    next_due_date: summary.next_due_date,
    next_due_amount: summary.next_due_amount,
    last_payment_date: summary.last_payment_date,
    total_schedule_items: summary.total_schedule_items,
    schedule_paid: summary.schedule_paid,
    schedule_overdue: summary.schedule_overdue,
  }));

  const total_committed_amount = summaries.reduce((sum, s) => sum + s.total_committed, 0);
  const total_paid_amount = summaries.reduce((sum, s) => sum + s.total_paid, 0);
  const balance_due = summaries.reduce((sum, s) => sum + s.balance_due, 0);
  const next_due = summaries.reduce((min, s) => {
    if (!s.next_due_amount) return min;
    return min === null ? s.next_due_amount : Math.min(min, s.next_due_amount);
  }, null as number | null);

  return {
    id: client.id,
    contact_id: client.contact_id,
    notes: client.notes,
    is_primary: client.is_primary,
    status: client.status,
    contacts: client.contact ? {
      id: client.contact.id,
      first_name: client.contact.first_name,
      last_name: client.contact.last_name,
      full_name: client.contact.full_name,
      email: client.contact.email,
      phone: client.contact.phone,
      company_name: client.contact.company_name,
      image_bucket: client.contact.image_bucket,
      image_path: client.contact.image_path,
      linked_user: client.contact.linked_user_id ? {
        id: client.contact.linked_user_id,
        avatar_url: undefined,
      } : null,
    } : null,
    role: client.role,
    financialByCurrency,
    total_committed_amount,
    total_paid_amount,
    balance_due,
    next_due,
  };
}

/**
 * Maps all clients to ProjectClientSummary array
 */
export function mapToClientSummaries(
  clients: ProjectClientWithRelations[],
  financialSummaries: Array<{ clientId: string; summaries: ClientFinancialSummary[] }>
): ProjectClientSummary[] {
  return clients.map(client => mapToClientSummary(client, financialSummaries));
}

// ========== KPI Calculations ==========

/**
 * Calculates KPIs for the Dashboard tab
 */
export function calculateDashboardKPIs(
  clientSummaries: ProjectClientSummary[],
  payments: ClientPaymentWithRelations[]
): DashboardKPIs {
  const totalClients = clientSummaries.length;
  const totalPayments = payments.length;
  const totalCommittedAmount = clientSummaries.reduce((sum, client) => 
    sum + (client.total_committed_amount || 0), 0
  );
  const totalBalanceDue = clientSummaries.reduce((sum, client) => 
    sum + (client.balance_due || 0), 0
  );

  return {
    totalClients,
    totalPayments,
    totalCommittedAmount,
    totalBalanceDue,
  };
}

/**
 * Calculates KPIs for the Obligations tab
 */
export function calculateObligationsKPIs(
  clientSummaries: ProjectClientSummary[]
): ObligationsKPIs {
  const totalCommittedAmount = clientSummaries.reduce(
    (sum, client) => sum + (client.total_committed_amount || 0), 
    0
  );
  
  const totalPaidAmount = clientSummaries.reduce(
    (sum, client) => sum + (client.total_paid_amount || 0), 
    0
  );
  
  const totalBalanceDue = clientSummaries.reduce(
    (sum, client) => sum + (client.balance_due || 0), 
    0
  );
  
  const totalScheduleItems = clientSummaries.reduce((sum, client) => {
    const scheduleSum = client.financialByCurrency.reduce(
      (cSum, f) => cSum + (f.total_schedule_items || 0), 
      0
    );
    return sum + scheduleSum;
  }, 0);
  
  const totalSchedulePaid = clientSummaries.reduce((sum, client) => {
    const paidSum = client.financialByCurrency.reduce(
      (cSum, f) => cSum + (f.schedule_paid || 0), 
      0
    );
    return sum + paidSum;
  }, 0);

  const paidPercentage = totalCommittedAmount > 0 
    ? (totalPaidAmount / totalCommittedAmount) * 100 
    : 0;
  
  const balancePercentage = totalCommittedAmount > 0 
    ? (totalBalanceDue / totalCommittedAmount) * 100 
    : 0;
  
  const schedulePercentage = totalScheduleItems > 0 
    ? (totalSchedulePaid / totalScheduleItems) * 100 
    : 0;

  return {
    totalCommittedAmount,
    totalPaidAmount,
    totalBalanceDue,
    totalScheduleItems,
    totalSchedulePaid,
    paidPercentage,
    balancePercentage,
    schedulePercentage,
  };
}

/**
 * Formats currency amount for display
 */
export function formatCurrencyAmount(
  amount: number,
  currency?: { symbol: string; code: string } | null
): string {
  const symbol = currency?.symbol || '$';
  return `${symbol}${amount.toLocaleString('es-AR', { 
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0 
  })}`;
}
