// Personnel query keys for React Query cache management
export const PERSONNEL_QUERY_KEYS = {
  all: ['personnel'] as const,
  byProject: (projectId: string) => ['personnel', projectId] as const,
  detail: (id: string) => ['personnel', id] as const,
  attendance: (personnelId: string) => ['personnel-attendance', personnelId] as const,
  rates: (personnelId: string) => ['personnel-rates', personnelId] as const,
  insurance: (personnelId: string) => ['personnel-insurance', personnelId] as const,
  movementPersonnel: (movementId: string) => ['movement-personnel', movementId] as const,
} as const;

// ============ PERSONNEL PAYMENT QUERY KEYS ============

export const PERSONNEL_PAYMENT_QUERY_KEYS = {
  payments: (projectId?: string) => ['personnel', 'payments', projectId] as const,
  payment: (paymentId?: string) => ['personnel', 'payment', paymentId] as const,
} as const;

// ============ PAYMENT STATUS OPTIONS ============

export const PERSONNEL_PAYMENT_STATUS = {
  confirmed: { value: 'confirmed', label: 'Confirmado', color: 'green' },
  pending: { value: 'pending', label: 'Pendiente', color: 'yellow' },
  rejected: { value: 'rejected', label: 'Rechazado', color: 'red' },
  void: { value: 'void', label: 'Anulado', color: 'gray' },
} as const;

export const PERSONNEL_PAYMENT_STATUS_OPTIONS = Object.values(PERSONNEL_PAYMENT_STATUS);
