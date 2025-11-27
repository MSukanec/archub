/**
 * Materials Feature - Constants
 * 
 * Constantes para query keys, configuraciones y enums.
 */

// ============ QUERY KEYS ============

export const MATERIALS_QUERY_KEYS = {
  all: ['materials'] as const,
  lists: () => [...MATERIALS_QUERY_KEYS.all, 'list'] as const,
  list: (organizationId: string) => [...MATERIALS_QUERY_KEYS.lists(), organizationId] as const,
  details: () => [...MATERIALS_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string, organizationId?: string) => 
    organizationId 
      ? [...MATERIALS_QUERY_KEYS.details(), id, organizationId] as const
      : [...MATERIALS_QUERY_KEYS.details(), id] as const,
  construction: (projectId: string, organizationId: string, phase?: string, taskIds?: string[]) => 
    ['construction-materials', organizationId, projectId, phase, taskIds] as const,
  categories: (organizationId: string) => ['material-categories', organizationId] as const,
  prices: (organizationId: string) => ['material-prices', organizationId] as const,
  taskMaterials: () => ['task-materials'] as const,
  materialView: () => ['material-view'] as const,
};

// ============ MATERIAL TYPE ENUM ============

export const MaterialType = {
  MATERIAL: 'material',
  CONSUMABLE: 'consumable',
} as const;

export type MaterialTypeValue = typeof MaterialType[keyof typeof MaterialType];

// ============ MATERIAL STATUS ============

export const MaterialStatus = {
  COMPLETED: true,
  INCOMPLETE: false,
} as const;

// ============ MATERIAL PAYMENT QUERY KEYS ============

export const MATERIAL_PAYMENT_QUERY_KEYS = {
  payments: (projectId?: string) => ['materials', 'payments', projectId] as const,
  payment: (paymentId?: string) => ['materials', 'payment', paymentId] as const,
} as const;

// ============ PAYMENT STATUS OPTIONS ============

export const MATERIAL_PAYMENT_STATUS = {
  confirmed: { value: 'confirmed', label: 'Confirmado', color: 'green' },
  pending: { value: 'pending', label: 'Pendiente', color: 'yellow' },
  rejected: { value: 'rejected', label: 'Rechazado', color: 'red' },
  void: { value: 'void', label: 'Anulado', color: 'gray' },
} as const;

export const MATERIAL_PAYMENT_STATUS_OPTIONS = Object.values(MATERIAL_PAYMENT_STATUS);
