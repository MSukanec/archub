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
