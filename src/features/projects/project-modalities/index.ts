/**
 * Project Modalities Feature - Barrel Export
 * 
 * Exporta todos los módulos del sub-feature project-modalities:
 * - Services (funciones de Supabase)
 * - Hooks (React Query)
 * - Modals (componentes)
 */

// ============ SERVICES ============
export * from './services/getProjectModalities';
export * from './services/createProjectModality';
export * from './services/updateProjectModality';
export * from './services/deleteProjectModality';

// ============ HOOKS ============
export * from './hooks/use-project-modalities';

// ============ MODALS ============
export { ProjectModalityModal } from './modals/ProjectModalityModal';
