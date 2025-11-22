/**
 * Project Constants
 * 
 * Constants, enums, and configuration values for the projects feature.
 */

export const PRESET_COLORS = [
  { hex: '#007aff', name: 'Ocean' },
  { hex: '#34c759', name: 'Grass' },
  { hex: '#ffcc00', name: 'Amber' },
  { hex: '#ff3b30', name: 'Coral' },
  { hex: '#af52de', name: 'Violet' },
  { hex: '#5e5ce6', name: 'Slate' },
  { hex: '#00c7be', name: 'Mint' },
  { hex: '#84cc16', name: 'Lime' }, // Verde por defecto de Archub
] as const;

export const PROJECT_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  COMPLETED: 'completed',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
  PLANNING: 'planning'
} as const;

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  active: 'En Proceso',
  inactive: 'Inactivo',
  completed: 'Completado',
  paused: 'Pausado',
  cancelled: 'Cancelado',
  planning: 'Planificación'
};

export const DEFAULT_ACCENT = {
  hex: '#84cc16',
  hsl: '76 100% 40%',
  rgb: '132, 204, 22'
} as const;

export const QUERY_KEYS = {
  PROJECTS: 'projects',
  PROJECTS_LITE: 'projects-lite',
  PROJECTS_COUNT: 'projects-count',
  PROJECTS_MAP: 'projects-map',
  PROJECT: 'project',
  PROJECT_STATS: 'project-stats',
  PROJECT_ACTIVITY: 'project-activity',
  PROJECT_COLOR: 'project-color',
  PROJECT_DATA: 'project-data'
} as const;
