/**
 * Finances Feature - Barrel Export
 * 
 * Centralizes all exports from the finances feature for easy imports
 * from other parts of the application.
 */

// Services
export * from './services/getAllFinancialMovements';

// Hooks
export * from './hooks/use-financial-movements';
export * from './hooks/use-financial-metrics';
export * from './hooks/use-partner-movements';
export * from './hooks/use-partner-metrics';

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
