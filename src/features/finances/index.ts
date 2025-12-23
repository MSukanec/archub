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
export { WalletTransferFormFields } from './forms/WalletTransferFormFields';
export { CurrencyExchangeFormFields } from './forms/CurrencyExchangeFormFields';

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
export { MovementModal } from './modals/movements/MovementModal';
export { MovementModalView } from './modals/movements/MovementModalView';
export { MovementImportStepModal } from './modals/movements/MovementImportStepModal';

// Admin Modals
export { default as MovementConceptFormModal } from './modals/admin/MovementConceptFormModal';
export { default as BankTransferReceiptModal } from './modals/admin/BankTransferReceiptModal';
export { PaymentFormModal } from './modals/admin/PaymentFormModal';

// Admin Components
export { default as AdminPaymentTransferRow } from './components/admin/AdminPaymentTransferRow';

// Views
export { ProjectFinancesView } from './views/ProjectFinancesView';
export { ProjectFinancesDashboardView, calculateAvailablePeriods, type PeriodFilter } from './views/ProjectFinancesDashboardView';
export { ProjectFinancesMovementsView } from './views/ProjectFinancesMovementsView';
