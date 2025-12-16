export type {
  DataSeverity,
  CorrectiveAction,
  DataIssue,
  DataHealthContext,
  DataHealthRule,
  DataHealthResult,
  NormalizedPayment,
} from './types';

export { DataHealthEngine, createDataHealthEngine } from './engine/DataHealthEngine';

export {
  paymentsWithoutCategoryRule,
  paymentsMissingExchangeRateRule,
  paymentsWithFutureDateRule,
  paymentsWithoutConceptRule,
  allPaymentRules,
} from './rules/payment-rules';

export { dataHealthToInsights, mergeWithBusinessInsights } from './adapters/insights-adapter';

export { 
  useGeneralCostsDataHealth, 
  normalizeGeneralCostPayment,
  useFinancesDataHealth,
  normalizeUnifiedMovement,
} from './hooks/useDataHealth';
export type { UseDataHealthOptions, UseDataHealthResult, UseFinancesDataHealthResult } from './hooks/useDataHealth';
