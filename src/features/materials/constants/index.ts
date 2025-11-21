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
  detail: (id: string) => [...MATERIALS_QUERY_KEYS.details(), id] as const,
  construction: (projectId: string, phase?: string, taskIds?: string[]) => 
    ['construction-materials', projectId, phase, taskIds] as const,
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
