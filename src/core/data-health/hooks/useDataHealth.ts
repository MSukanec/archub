import { useMemo, useCallback } from 'react';
import { DataHealthEngine } from '../engine/DataHealthEngine';
import { allPaymentRules } from '../rules/payment-rules';
import { allCapitalRules } from '../rules/capital-rules';
import { allFinancesRules } from '../rules/finances-rules';
import { dataHealthToInsights } from '../adapters/insights-adapter';
import type { DataHealthContext, DataHealthResult, NormalizedPayment, DataIssue } from '../types';
import type { InsightItem } from '@/components/dashboard/InsightCard';
const paymentEngine = new DataHealthEngine(allPaymentRules);
const capitalEngine = new DataHealthEngine(allCapitalRules);
const financesEngine = new DataHealthEngine(allFinancesRules);
export interface UseDataHealthOptions {
  organizationId: string;
  defaultCurrencyId?: string;
  /** Whether the organization has multi-currency enabled (more than 1 active currency) */
  isMultiCurrency?: boolean;
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
  wallet?: { wallet_id?: string | null; wallets?: { name?: string | null } | null } | null;
  description?: string | null;
}): NormalizedPayment {
  return {
    id: payment.id,
    label: payment.general_cost?.name 
      ? `${payment.general_cost.name} - ${payment.payment_date || 'Sin fecha'}`
      : `Pago #${payment.id}`,
    amount: typeof payment.amount === 'string'? parseFloat(payment.amount) : payment.amount,
    amountInBase: payment.amount_in_base != null 
      ? (typeof payment.amount_in_base === 'string'? parseFloat(payment.amount_in_base) : payment.amount_in_base)
      : null,
    currencyId: payment.currency_id,
    currencyCode: payment.currency?.code,
    exchangeRate: payment.exchange_rate != null 
      ? (typeof payment.exchange_rate === 'string'? parseFloat(payment.exchange_rate) : payment.exchange_rate)
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
    wallet?: { wallet_id?: string | null; wallets?: { name?: string | null } | null } | null;
    description?: string | null;
  }>,
  options: UseDataHealthOptions
): UseDataHealthResult {
  const { organizationId, defaultCurrencyId, isMultiCurrency, enabled = true, filterTags } = options;
  const result = useMemo(() => {
    if (!enabled || payments.length === 0) {
      return null;
    }
    const normalizedPayments = payments.map(normalizeGeneralCostPayment);
    
    const ctx: DataHealthContext = {
      organizationId,
      defaultCurrencyId,
      isMultiCurrency,
      locale: 'es-AR',
      dateToleranceDays: 0,
    };
    return paymentEngine.check(normalizedPayments, ctx, filterTags);
  }, [payments, organizationId, defaultCurrencyId, isMultiCurrency, enabled, filterTags]);
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
export function normalizeUnifiedMovement(movement: {
  id: string | number;
  amount: number | string;
  currency_id?: string | null;
  currency?: { code?: string; symbol?: string } | null;
  exchange_rate?: number | string | null;
  payment_date?: string | null;
  status?: string | null;
  wallet?: { id?: string | null; name?: string | null } | null;
  wallet_id?: string | null;
  description?: string | null;
  movement_type?: string | null;
  entity_name?: string | null;
  amount_sign?: number | null;
  client_id?: string | null;
  project_id?: string | null;
}): NormalizedPayment {
  const typeLabels: Record<string, string> = {
    client_payment: 'Cobro Cliente',
    material_payment: 'Pago Material',
    personnel_payment: 'Pago Personal',
    partner_contribution: 'Aporte Socio',
    partner_withdrawal: 'Retiro Socio',
    general_cost_payment: 'Gasto General',
  };
  
  const typeLabel = movement.movement_type ? typeLabels[movement.movement_type] || movement.movement_type : 'Movimiento';
  const entityLabel = movement.entity_name || '';
  
  return {
    id: movement.id,
    label: entityLabel 
      ? `${typeLabel}: ${entityLabel} - ${movement.payment_date || 'Sin fecha'}`
      : `${typeLabel} #${movement.id} - ${movement.payment_date || 'Sin fecha'}`,
    amount: typeof movement.amount === 'string'? parseFloat(movement.amount) : movement.amount,
    amountInBase: null,
    currencyId: movement.currency_id,
    currencyCode: movement.currency?.code,
    exchangeRate: movement.exchange_rate != null 
      ? (typeof movement.exchange_rate === 'string'? parseFloat(movement.exchange_rate) : movement.exchange_rate)
      : null,
    categoryId: null,
    categoryName: null,
    conceptId: null,
    conceptName: null,
    paymentDate: movement.payment_date,
    status: movement.status,
    walletId: movement.wallet_id ?? movement.wallet?.id ?? null,
    walletName: movement.wallet?.name ?? null,
    description: movement.description,
    movementType: movement.movement_type,
    clientId: movement.client_id,
    projectId: movement.project_id,
  };
}
export interface UseFinancesDataHealthResult extends UseDataHealthResult {
  affectedIds: Set<string | number>;
  affectedIdsByIssue: Map<string, Set<string | number>>;
  issues: DataIssue[];
  getAffectedIdsForIssue: (issueId: string) => Set<string | number>;
}
export function useFinancesDataHealth(
  movements: Array<{
    id: string | number;
    amount: number | string;
    currency_id?: string | null;
    currency?: { code?: string; symbol?: string } | null;
    exchange_rate?: number | string | null;
    payment_date?: string | null;
    status?: string | null;
    wallet?: { id?: string | null; name?: string | null } | null;
    wallet_id?: string | null;
    description?: string | null;
    movement_type?: string | null;
    entity_name?: string | null;
    amount_sign?: number | null;
    client_id?: string | null;
    project_id?: string | null;
  }>,
  options: UseDataHealthOptions
): UseFinancesDataHealthResult {
  const { organizationId, defaultCurrencyId, isMultiCurrency, enabled = true } = options;
  const result = useMemo(() => {
    if (!enabled || movements.length === 0) {
      return null;
    }
    const normalizedMovements = movements.map(normalizeUnifiedMovement);
    
    const ctx: DataHealthContext = {
      organizationId,
      defaultCurrencyId,
      isMultiCurrency,
      locale: 'es-AR',
      dateToleranceDays: 0,
    };
    return financesEngine.check(normalizedMovements, ctx, ['finances']);
  }, [movements, organizationId, defaultCurrencyId, isMultiCurrency, enabled]);
  const insights = useMemo(() => {
    if (!result) return [];
    return dataHealthToInsights(result);
  }, [result]);
  const affectedIds = useMemo(() => {
    if (!result) return new Set<string | number>();
    const ids = new Set<string | number>();
    for (const issue of result.issues) {
      if (issue.recommendedAction.targetIds) {
        for (const id of issue.recommendedAction.targetIds) {
          ids.add(id);
        }
      }
    }
    return ids;
  }, [result]);
  const affectedIdsByIssue = useMemo(() => {
    const map = new Map<string, Set<string | number>>();
    if (!result) return map;
    for (const issue of result.issues) {
      const ids = new Set<string | number>();
      if (issue.recommendedAction.targetIds) {
        for (const id of issue.recommendedAction.targetIds) {
          ids.add(id);
        }
      }
      map.set(issue.id, ids);
    }
    return map;
  }, [result]);
  const getAffectedIdsForIssue = useCallback((issueId: string): Set<string | number> => {
    return affectedIdsByIssue.get(issueId) || new Set();
  }, [affectedIdsByIssue]);
  return {
    result,
    insights,
    hasIssues: result ? result.issues.length > 0 : false,
    criticalCount: result?.stats.bySeverity.critical ?? 0,
    warningCount: result?.stats.bySeverity.warning ?? 0,
    infoCount: result?.stats.bySeverity.info ?? 0,
    affectedIds,
    affectedIdsByIssue,
    issues: result?.issues ?? [],
    getAffectedIdsForIssue,
  };
}
export interface NormalizedCapitalTransaction {
  id: string;
  type: 'contribution'| 'withdrawal';
  partnerName: string;
  walletId: string | null;
  walletName: string | null;
  date: string;
  amount: number;
  currencyId: string;
  exchangeRate: number | null;
}
export function normalizeCapitalTransaction(tx: NormalizedCapitalTransaction): NormalizedPayment {
  const typeLabel = tx.type === 'contribution'? 'Aporte': 'Retiro';
  
  return {
    id: tx.id,
    label: `${typeLabel}: ${tx.partnerName} - ${tx.date || 'Sin fecha'}`,
    amount: tx.amount,
    amountInBase: null,
    currencyId: tx.currencyId,
    currencyCode: undefined,
    exchangeRate: tx.exchangeRate,
    categoryId: null,
    categoryName: null,
    conceptId: null,
    conceptName: null,
    paymentDate: tx.date,
    status: null,
    walletId: tx.walletId,
    walletName: tx.walletName,
    description: null,
  };
}
export interface UseCapitalDataHealthResult extends UseDataHealthResult {
  affectedIds: Set<string>;
  affectedIdsByIssue: Map<string, Set<string>>;
  issues: DataIssue[];
  getAffectedIdsForIssue: (issueId: string) => Set<string>;
}
export function useCapitalDataHealth(
  transactions: NormalizedCapitalTransaction[],
  options: UseDataHealthOptions
): UseCapitalDataHealthResult {
  const { organizationId, defaultCurrencyId, isMultiCurrency, enabled = true } = options;
  const result = useMemo(() => {
    if (!enabled || transactions.length === 0) {
      return null;
    }
    const normalizedTransactions = transactions.map(normalizeCapitalTransaction);
    
    const ctx: DataHealthContext = {
      organizationId,
      defaultCurrencyId,
      isMultiCurrency,
      locale: 'es-AR',
      dateToleranceDays: 0,
    };
    return capitalEngine.check(normalizedTransactions, ctx, ['capital']);
  }, [transactions, organizationId, defaultCurrencyId, isMultiCurrency, enabled]);
  const insights = useMemo(() => {
    if (!result) return [];
    return dataHealthToInsights(result);
  }, [result]);
  const affectedIds = useMemo(() => {
    if (!result) return new Set<string>();
    const ids = new Set<string>();
    for (const issue of result.issues) {
      if (issue.recommendedAction.targetIds) {
        for (const id of issue.recommendedAction.targetIds) {
          ids.add(String(id));
        }
      }
    }
    return ids;
  }, [result]);
  const affectedIdsByIssue = useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (!result) return map;
    for (const issue of result.issues) {
      const ids = new Set<string>();
      if (issue.recommendedAction.targetIds) {
        for (const id of issue.recommendedAction.targetIds) {
          ids.add(String(id));
        }
      }
      map.set(issue.id, ids);
    }
    return map;
  }, [result]);
  const getAffectedIdsForIssue = useCallback((issueId: string): Set<string> => {
    return affectedIdsByIssue.get(issueId) || new Set();
  }, [affectedIdsByIssue]);
  return {
    result,
    insights,
    hasIssues: result ? result.issues.length > 0 : false,
    criticalCount: result?.stats.bySeverity.critical ?? 0,
    warningCount: result?.stats.bySeverity.warning ?? 0,
    infoCount: result?.stats.bySeverity.info ?? 0,
    affectedIds,
    affectedIdsByIssue,
    issues: result?.issues ?? [],
    getAffectedIdsForIssue,
  };
}
