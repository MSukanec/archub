/**
 * Projects Feature - Barrel Export
 * 
 * Exporta todos los módulos del feature projects:
 * - Services (funciones de Supabase)
 * - Hooks (React Query)
 * - Types (TypeScript)
 * - Schemas (Zod)
 * - Constants (enums, query keys)
 * - Mappers (transformaciones)
 * - Utils (utilidades)
 */

// ============ SERVICES ============
export * from './services/getProjects';
export * from './services/getProjectById';
export * from './services/getProjectsLite';
export * from './services/createProject';
export * from './services/updateProject';
export * from './services/softDeleteProject';
export * from './services/getProjectStats';
export * from './services/getProjectActivity';
export * from './services/uploadProjectImage';

// ============ HOOKS ============
export * from './hooks/use-projects';
export * from './hooks/use-project';
export * from './hooks/use-projects-lite';
export * from './hooks/use-create-project';
export * from './hooks/use-update-project';
export * from './hooks/use-delete-project';
export * from './hooks/use-project-stats';
export * from './hooks/use-project-activity';
export * from './hooks/use-project-accent-color';

// ============ TYPES ============
export * from './types';

// ============ SCHEMAS ============
export * from './schemas';

// ============ CONSTANTS ============
export * from './constants';

// ============ MAPPERS ============
export * from './mappers/projectMapper';

// ============ UTILS ============
export * from './utils/colorUtils';

// ============ COMPONENTS ============
export { default as ProjectItemCard } from './components/ProjectItemCard';
export { default as ProjectColorAdvanced } from './components/ProjectColorAdvanced';
export { default as ProjectSelectorField } from './components/ProjectSelectorField';

// ============ MODALS ============
export * from './modals/ProjectModal';
