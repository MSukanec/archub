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
export {
  clientPaymentsWithoutClientRule,
  paymentsWithoutProjectRule,
  financesInvalidExchangeRateRule,
  allFinancesRules,
} from './rules/finances-rules';
export { dataHealthToInsights, mergeWithBusinessInsights } from './adapters/insights-adapter';
export { 
  useGeneralCostsDataHealth, 
  normalizeGeneralCostPayment,
  useFinancesDataHealth,
  normalizeUnifiedMovement,
  useCapitalDataHealth,
  normalizeCapitalTransaction,
} from './hooks/useDataHealth';
export type { 
  UseDataHealthOptions, 
  UseDataHealthResult, 
  UseFinancesDataHealthResult,
  UseCapitalDataHealthResult,
  NormalizedCapitalTransaction,
} from './hooks/useDataHealth';
export {
  capitalMissingExchangeRateRule,
  capitalMissingWalletRule,
  capitalWithFutureDateRule,
  allCapitalRules,
} from './rules/capital-rules';
export {
  personnelPaymentsWithoutPersonnelRule,
  personnelInvalidExchangeRateRule,
  allPersonnelRules,
} from './rules/personnel-rules';
export { DataHealthAlertMulti } from './components/DataHealthAlertMulti';
export { DataHealthDetailsModal } from './components/DataHealthDetailsModal';
export { DataHealthDetailsContent } from './components/DataHealthDetailsContent';
