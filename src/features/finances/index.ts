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

// Mappers
export * from './mappers';

// Types, Constants, Schemas
export * from './types';
export * from './constants';
export * from './schemas';

// Components
export * from './components/FinancialStatsSection';

// Modals
// TODO: Export modals when created
// export * from './modals/FinancialMovementModal';
