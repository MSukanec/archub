// server/lib/services/paymentsMetrics.ts
import type { SupabaseClient } from '@supabase/supabase-js';

export interface PaymentMetricsByCurrency {
  currency_id: string;
  currency_code: string;
  currency_symbol: string;
  total_confirmed: number;
  total_pending: number;
  total_rejected: number;
  count_confirmed: number;
  count_pending: number;
  count_rejected: number;
}

export interface PaymentMetrics {
  total_count: number;
  by_currency: PaymentMetricsByCurrency[];
  latest_payment_date: string | null;
}

/**
 * Calculate payment metrics for a specific project
 * Uses direct table queries with LEFT JOINs to prevent data loss
 */
export async function getProjectPaymentMetrics(
  supabase: SupabaseClient,
  projectId: string,
  organizationId: string
): Promise<PaymentMetrics> {
  // Get all payments for this project using direct table query
  const { data: payments, error } = await supabase
    .from('client_payments')
    .select(`
      id,
      amount,
      status,
      payment_date,
      currency_id,
      currencies!currency_id (
        id,
        code,
        symbol
      )
    `)
    .eq('project_id', projectId)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error fetching project payment metrics:', error);
    throw new Error('Failed to fetch payment metrics');
  }

  return calculateMetricsFromPayments(payments || []);
}

/**
 * Calculate payment metrics for entire organization
 * Uses direct table queries with LEFT JOINs to prevent data loss
 */
export async function getOrganizationPaymentMetrics(
  supabase: SupabaseClient,
  organizationId: string
): Promise<PaymentMetrics> {
  // Get all payments for this organization using direct table query
  const { data: payments, error } = await supabase
    .from('client_payments')
    .select(`
      id,
      amount,
      status,
      payment_date,
      currency_id,
      currencies!currency_id (
        id,
        code,
        symbol
      )
    `)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error fetching organization payment metrics:', error);
    throw new Error('Failed to fetch payment metrics');
  }

  return calculateMetricsFromPayments(payments || []);
}

/**
 * Helper function to calculate metrics from payment data
 * Aggregates by currency and status to provide comprehensive KPIs
 */
function calculateMetricsFromPayments(payments: any[]): PaymentMetrics {
  // Calculate total count
  const total_count = payments.length;

  // Find latest payment date
  const latest_payment_date = payments.length > 0
    ? payments.reduce((latest, payment) => {
        return !latest || new Date(payment.payment_date) > new Date(latest)
          ? payment.payment_date
          : latest;
      }, null as string | null)
    : null;

  // Group by currency
  const currencyMap = new Map<string, PaymentMetricsByCurrency>();

  payments.forEach((payment) => {
    const currencyId = payment.currency_id;
    if (!currencyId) return;

    // Default currency metadata if join failed (RLS/null scenario)
    const currencyData = payment.currencies || {
      id: currencyId,
      code: 'UNKNOWN',
      symbol: '?'
    };

    if (!currencyMap.has(currencyId)) {
      currencyMap.set(currencyId, {
        currency_id: currencyId,
        currency_code: currencyData.code,
        currency_symbol: currencyData.symbol,
        total_confirmed: 0,
        total_pending: 0,
        total_rejected: 0,
        count_confirmed: 0,
        count_pending: 0,
        count_rejected: 0,
      });
    }

    const entry = currencyMap.get(currencyId)!;
    const amount = parseFloat(payment.amount || 0);

    // Aggregate by status
    switch (payment.status) {
      case 'confirmed':
        entry.total_confirmed += amount;
        entry.count_confirmed += 1;
        break;
      case 'pending':
        entry.total_pending += amount;
        entry.count_pending += 1;
        break;
      case 'rejected':
      case 'void':
        entry.total_rejected += amount;
        entry.count_rejected += 1;
        break;
    }
  });

  return {
    total_count,
    by_currency: Array.from(currencyMap.values()),
    latest_payment_date,
  };
}
