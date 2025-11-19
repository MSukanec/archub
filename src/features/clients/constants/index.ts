/**
 * Constants for Clients feature
 */

// ========== Client Status Options ==========

export const CLIENT_STATUS = {
  active: { value: 'active', label: 'Activo', color: 'green' },
  inactive: { value: 'inactive', label: 'Inactivo', color: 'gray' },
  deleted: { value: 'deleted', label: 'Eliminado', color: 'red' },
  potential: { value: 'potential', label: 'Potencial', color: 'blue' },
  rejected: { value: 'rejected', label: 'Rechazado', color: 'orange' },
  completed: { value: 'completed', label: 'Completado', color: 'purple' },
} as const;

export const CLIENT_STATUS_OPTIONS = Object.values(CLIENT_STATUS);

// ========== Payment Status Options ==========

export const PAYMENT_STATUS = {
  confirmed: { value: 'confirmed', label: 'Confirmado', color: 'green' },
  pending: { value: 'pending', label: 'Pendiente', color: 'yellow' },
  rejected: { value: 'rejected', label: 'Rechazado', color: 'red' },
  void: { value: 'void', label: 'Anulado', color: 'gray' },
} as const;

export const PAYMENT_STATUS_OPTIONS = Object.values(PAYMENT_STATUS);

// ========== Schedule Status Options ==========

export const SCHEDULE_STATUS = {
  pending: { value: 'pending', label: 'Pendiente', color: 'yellow' },
  paid: { value: 'paid', label: 'Pagado', color: 'green' },
  overdue: { value: 'overdue', label: 'Vencido', color: 'red' },
  cancelled: { value: 'cancelled', label: 'Cancelado', color: 'gray' },
} as const;

export const SCHEDULE_STATUS_OPTIONS = Object.values(SCHEDULE_STATUS);

// ========== Payment Frequency Options ==========

export const PAYMENT_FREQUENCY = {
  quincenal: { value: 'quincenal', label: 'Quincenal', days: 15 },
  mensual: { value: 'mensual', label: 'Mensual', days: 30 },
  trimestral: { value: 'trimestral', label: 'Trimestral', days: 90 },
} as const;

export const PAYMENT_FREQUENCY_OPTIONS = Object.values(PAYMENT_FREQUENCY);

// ========== Query Keys ==========

export const CLIENT_QUERY_KEYS = {
  all: ['clients'] as const,
  projectClients: (projectId?: string) => ['clients', 'project', projectId] as const,
  projectClient: (projectId?: string, clientId?: string, organizationId?: string) => 
    ['clients', 'project', projectId, 'client', clientId, organizationId] as const,
  commitments: (projectId?: string) => ['clients', 'commitments', projectId] as const,
  commitment: (commitmentId?: string) => ['clients', 'commitment', commitmentId] as const,
  payments: (projectId?: string) => ['clients', 'payments', projectId] as const,
  payment: (paymentId?: string) => ['clients', 'payment', paymentId] as const,
  schedule: (projectId?: string) => ['clients', 'schedule', projectId] as const,
  scheduleItem: (scheduleId?: string) => ['clients', 'schedule-item', scheduleId] as const,
  roles: (organizationId?: string) => ['clients', 'roles', organizationId] as const,
  role: (roleId?: string) => ['clients', 'role', roleId] as const,
  dashboard: (projectId?: string) => ['clients', 'dashboard', projectId] as const,
} as const;
