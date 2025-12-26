/**
 * Barrel export for clients feature
 * 
 * Import everything from this single entry point:
 * import { useProjectClients, ProjectClient, CLIENT_STATUS } from '@/features/clients'
 */

// Services
export * from './services/projectClients';
export * from './services/clientCommitments';
export * from './services/clientPayments';
export * from './services/clientPaymentSchedule';
export * from './services/clientRoles';
export * from './services/contacts';
export * from './services/dashboard';

// Hooks
export * from './hooks/use-project-clients';
export * from './hooks/use-client-commitments';
export * from './hooks/use-client-payments';
export * from './hooks/use-client-payment-schedule';
export * from './hooks/use-client-roles';
export * from './hooks/use-contacts';
export * from './hooks/use-client-dashboard';

// Types
export * from './types';

// Schemas
export * from './schemas';

// Constants
export * from './constants';

// Mappers
export * from './mappers';

// Views
export * from './views';

// Modals
export * from './modals';
