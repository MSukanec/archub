/**
 * Learning Feature - Barrel Export
 * 
 * FEATURE CONSOLIDADA que incluye:
 * - Public: Landing pages, catálogo de cursos
 * - Student: Dashboard, progreso, notas, marcadores
 * - Admin: Gestión de cursos (futuro)
 * 
 * Exporta todos los módulos del feature learning:
 * - Services (funciones de Supabase - public/student/admin)
 * - Hooks (React Query - public/student/admin)
 * - Components (UI - landing/dashboard/admin)
 * - Modals (Formularios y diálogos)
 * - Types (TypeScript)
 * - Constants (query keys, enums)
 * - Schemas (Zod validations)
 * - Utils (funciones de utilidad)
 */
export * from './services';
export * from './hooks';
export * from './components';
export * from './modals';
export * from './pages';
export * from './types';
export * from './constants';
export * from './schemas';
// Store exports
export { useCoursePlayerStore } from './stores/coursePlayerStore';
