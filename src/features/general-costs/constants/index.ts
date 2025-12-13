export const GENERAL_COSTS_QUERY_KEYS = {
  all: ['general-costs'] as const,
  lists: () => [...GENERAL_COSTS_QUERY_KEYS.all, 'list'] as const,
  list: (organizationId: string | null) => [...GENERAL_COSTS_QUERY_KEYS.lists(), organizationId] as const,
  details: () => [...GENERAL_COSTS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string | null) => [...GENERAL_COSTS_QUERY_KEYS.details(), id] as const,
  payments: () => [...GENERAL_COSTS_QUERY_KEYS.all, 'payment'] as const,
  paymentsList: (organizationId: string | null) => [...GENERAL_COSTS_QUERY_KEYS.payments(), organizationId] as const,
  payment: (id: string | null) => [...GENERAL_COSTS_QUERY_KEYS.payments(), id] as const,
  monthlySummary: () => [...GENERAL_COSTS_QUERY_KEYS.all, 'monthly-summary'] as const,
  monthlySummaryList: (organizationId: string | null) => [...GENERAL_COSTS_QUERY_KEYS.monthlySummary(), organizationId] as const,
  byCategory: () => [...GENERAL_COSTS_QUERY_KEYS.all, 'by-category'] as const,
  byCategoryList: (organizationId: string | null) => [...GENERAL_COSTS_QUERY_KEYS.byCategory(), organizationId] as const,
} as const;

export const STATUS_LABELS = {
  active: 'Activo',
  inactive: 'Inactivo',
} as const;

export const CATEGORY_OPTIONS = [
  { value: 'General', label: 'General' },
  { value: 'Operativo', label: 'Operativo' },
  { value: 'Administrativo', label: 'Administrativo' },
  { value: 'Marketing', label: 'Marketing' },
  { value: 'Tecnología', label: 'Tecnología' },
] as const;
