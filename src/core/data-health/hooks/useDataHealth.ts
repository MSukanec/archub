import { useMemo } from 'react';
import { DataHealthEngine } from '../engine/DataHealthEngine';
import { allPaymentRules } from '../rules/payment-rules';
import { dataHealthToInsights } from '../adapters/insights-adapter';
import type { DataHealthContext, DataHealthResult, NormalizedPayment } from '../types';
import type { InsightItem } from '@/components/dashboard/InsightCard';

const paymentEngine = new DataHealthEngine(allPaymentRules);

export interface UseDataHealthOptions {
  organizationId: string;
  defaultCurrencyId?: string;
  enabled?: boolean;
  filterTags?: string[];
}

export interface UseDataHealthResult {
  result: DataHealthResult | null;
  insights: InsightItem[];
  hasIssues: boolean;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
}

export function normalizeGeneralCostPayment(payment: {
  id: string | number;
  amount: number | string;
  amount_in_base?: number | string | null;
  currency_id?: string | null;
  currency?: { code?: string } | null;
  exchange_rate?: number | string | null;
  general_cost?: {
    id?: string | number | null;
    name?: string | null;
    category?: { id?: string | number | null; name?: string | null } | null;
  } | null;
  payment_date?: string | null;
  status?: string | null;
  wallet?: { wallet_id?: string | null; wallets?: { name?: string | null } } | null;
  description?: string | null;
}): NormalizedPayment {
  return {
    id: payment.id,
    label: payment.general_cost?.name 
      ? `${payment.general_cost.name} - ${payment.payment_date || 'Sin fecha'}`
      : `Pago #${payment.id}`,
    amount: typeof payment.amount === 'string' ? parseFloat(payment.amount) : payment.amount,
    amountInBase: payment.amount_in_base != null 
      ? (typeof payment.amount_in_base === 'string' ? parseFloat(payment.amount_in_base) : payment.amount_in_base)
      : null,
    currencyId: payment.currency_id,
    currencyCode: payment.currency?.code,
    exchangeRate: payment.exchange_rate != null 
      ? (typeof payment.exchange_rate === 'string' ? parseFloat(payment.exchange_rate) : payment.exchange_rate)
      : null,
    categoryId: payment.general_cost?.category?.id?.toString() ?? null,
    categoryName: payment.general_cost?.category?.name ?? null,
    conceptId: payment.general_cost?.id?.toString() ?? null,
    conceptName: payment.general_cost?.name ?? null,
    paymentDate: payment.payment_date,
    status: payment.status,
    walletId: payment.wallet?.wallet_id ?? null,
    walletName: payment.wallet?.wallets?.name ?? null,
    description: payment.description,
  };
}

export function useGeneralCostsDataHealth(
  payments: Array<{
    id: string | number;
    amount: number | string;
    amount_in_base?: number | string | null;
    currency_id?: string | null;
    currency?: { code?: string } | null;
    exchange_rate?: number | string | null;
    general_cost?: {
      id?: string | number | null;
      name?: string | null;
      category?: { id?: string | number | null; name?: string | null } | null;
    } | null;
    payment_date?: string | null;
    status?: string | null;
    wallet?: { wallet_id?: string | null; wallets?: { name?: string | null } } | null;
    description?: string | null;
  }>,
  options: UseDataHealthOptions
): UseDataHealthResult {
  const { organizationId, defaultCurrencyId, enabled = true, filterTags } = options;

  const result = useMemo(() => {
    if (!enabled || payments.length === 0) {
      return null;
    }

    const normalizedPayments = payments.map(normalizeGeneralCostPayment);
    
    const ctx: DataHealthContext = {
      organizationId,
      defaultCurrencyId,
      locale: 'es-AR',
      dateToleranceDays: 0,
    };

    return paymentEngine.check(normalizedPayments, ctx, filterTags);
  }, [payments, organizationId, defaultCurrencyId, enabled, filterTags]);

  const insights = useMemo(() => {
    if (!result) return [];
    return dataHealthToInsights(result);
  }, [result]);

  return {
    result,
    insights,
    hasIssues: result ? result.issues.length > 0 : false,
    criticalCount: result?.stats.bySeverity.critical ?? 0,
    warningCount: result?.stats.bySeverity.warning ?? 0,
    infoCount: result?.stats.bySeverity.info ?? 0,
  };
}
