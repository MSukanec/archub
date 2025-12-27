export const TASK_UNITS = [
  { value: 'm2', label: 'm²' },
  { value: 'm3', label: 'm³' },
  { value: 'ml', label: 'ml' },
  { value: 'un', label: 'un' },
  { value: 'gl', label: 'gl' },
  { value: 'kg', label: 'kg' },
  { value: 'tn', label: 'tn' },
  { value: 'lt', label: 'lt' },
  { value: 'hr', label: 'hr' },
  { value: 'jn', label: 'jn' },
] as const;

export const COST_TYPES = {
  material: 'Material',
  labor: 'Mano de Obra',
  equipment: 'Equipo',
  subcontract: 'Subcontrato',
  other: 'Otro',
} as const;

export const TASK_STATUS = {
  active: 'Activo',
  inactive: 'Inactivo',
  archived: 'Archivado',
} as const;

export const PARAMETER_TYPES = {
  select: 'Selección',
  number: 'Número',
  text: 'Texto',
} as const;
