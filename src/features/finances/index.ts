/**
 * Finances Feature - Barrel Export
 * 
 * Centralizes all exports from the finances feature for easy imports
 * from other parts of the application.
 */

// Services
export * from './services/getAllFinancialMovements';
export * from './services/getUnifiedMovements';

// Hooks
export * from './hooks/use-financial-movements';
export * from './hooks/use-unified-movements';
export * from './hooks/use-financial-metrics';
export * from './hooks/use-partner-movements';
export * from './hooks/use-partner-metrics';
export * from './hooks/use-financial-operations';

// Forms
export { WalletTransferForm } from './forms/WalletTransferForm';
export { CurrencyExchangeForm } from './forms/CurrencyExchangeForm';

// Mappers
export * from './mappers';

// Types, Constants, Schemas
export * from './types';
export * from './constants';
export * from './schemas';

// Components
export * from './components/FinancialStatsSection';
export * from './components/PartnerStatsSection';

// Modals
export { MovementModalView } from './modals/MovementModalView';
export { MovementImportStepModal } from './modals/MovementImportStepModal';

// Legacy Admin Modals
export { default as MovementConceptFormModal } from '../legacy/modals/MovementConceptFormModal';
export { default as BankTransferReceiptModal } from '../legacy/modals/BankTransferReceiptModal';
export { PaymentFormModal as AdminPaymentsModal } from '../legacy/modals/AdminPaymentsModal';

// Admin Components
export { default as AdminPaymentTransferRow } from './components/admin/AdminPaymentTransferRow';

// Views
export { OrganizationFinancesDashboardView, calculateAvailablePeriods } from './views/OrganizationFinancesDashboardView';
export type { PeriodFilter } from './views/OrganizationFinancesDashboardView';
export { OrganizationFinancesMovementsView } from './views/OrganizationFinancesMovementsView';
export { ProjectFinancesView } from './views/ProjectFinancesView';
export { ProjectFinancesDashboardView, type PeriodFilter as ProjectPeriodFilter } from './views/ProjectFinancesDashboardView';
export { ProjectFinancesMovementsView } from './views/ProjectFinancesMovementsView';
