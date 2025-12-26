/**
 * Services barrel export for Clients feature
 * 
 * All services follow Feature-Sliced Design principles:
 * - Pure async functions
 * - Filter by organization_id
 * - Throw on main queries, console.error on secondary
 * - Complete JSDoc documentation
 */
export {
  getProjectClients,
  getProjectClientById,
  createProjectClient,
  updateProjectClient,
  deleteProjectClient,
} from './projectClients';
export {
  getClientCommitments,
  getClientCommitmentById,
  createClientCommitment,
  updateClientCommitment,
  deleteClientCommitment,
} from './clientCommitments';
export {
  getClientPayments,
  getClientPaymentById,
  createClientPayment,
  updateClientPayment,
  deleteClientPayment,
} from './clientPayments';
export {
  getClientPaymentSchedule,
  getClientPaymentScheduleById,
  createClientPaymentSchedule,
  updateClientPaymentSchedule,
  deleteClientPaymentSchedule,
} from './clientPaymentSchedule';
export {
  getClientRoles,
  getClientRoleById,
  createClientRole,
  updateClientRole,
  deleteClientRole,
} from './clientRoles';
export {
  getContacts,
  getContactById,
} from './contacts';
export {
  getClientDashboardData,
} from './dashboard';
