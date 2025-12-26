// Subcontract status constants
export const SUBCONTRACT_STATUS = {
  ACTIVE: 'active',
  AWARDED: 'awarded',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;
// Subcontract bid status constants
export const BID_STATUS = {
  PENDING: 'pending',
  AWARDED: 'awarded',
  REJECTED: 'rejected',
} as const;
// Query keys for React Query cache management
export const SUBCONTRACT_QUERY_KEYS = {
  all: ['subcontracts'] as const,
  byProject: (projectId: string) => ['subcontracts', projectId] as const,
  detail: (id: string) => ['subcontract', id] as const,
  analysis: (projectId: string) => ['subcontract-analysis', projectId] as const,
  bids: (subcontractId: string) => ['/api/subcontract-bids', subcontractId] as const,
  tasks: (subcontractId: string) => ['subcontract-tasks', subcontractId] as const,
  movementSubcontracts: (movementId: string) => ['movement-subcontracts', movementId] as const,
} as const;
