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
export * from './services/getProjectsCount';
export * from './services/createProject';
export * from './services/updateProject';
export * from './services/updateProjectLastActive';
export * from './services/softDeleteProject';
export * from './services/getProjectStats';
export * from './services/getProjectActivity';
export * from './services/uploadProjectImage';

// ============ HOOKS ============
export * from './hooks/use-projects';
export * from './hooks/use-project';
export * from './hooks/use-projects-lite';
export * from './hooks/use-projects-count';
export * from './hooks/use-projects-map';
export * from './hooks/use-create-project';
export * from './hooks/use-update-project';
export * from './hooks/use-update-project-last-active';
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

// Gantt Components
export * from './components/gantt';

// ============ FORMS ============
export { ProjectForm } from './forms/ProjectForm';

// ============ MODALS (Legacy) ============
export * from './modals/ProjectModal';
export { GalleryFormModal } from './modals/GalleryFormModal';
export { DocumentFolderFormModal } from './modals/DocumentFolderFormModal';
export { DocumentPreviewModal } from './modals/DocumentPreviewModal';
export { DocumentUploadFormModal } from './modals/DocumentUploadFormModal';
export { BudgetFormModal } from './modals/construction/BudgetModal';
export { BudgetTaskFormModal } from './modals/construction/BudgetTaskFormModal';
export { ConstructionPhaseFormModal } from './modals/construction/ConstructionPhaseFormModal';
export { ConstructionTaskScheduleModal } from './modals/construction/ConstructionTaskScheduleModal';
export { DependencyConnectionModal } from './modals/construction/DependencyConnectionModal';
export { IndirectModal } from './modals/construction/IndirectModal';
export { InsuranceFormModal } from './modals/construction/InsuranceFormModal';
export { RenewInsuranceFormModal } from './modals/construction/RenewInsuranceFormModal';
export { TaskMultiModal } from './modals/construction/tasks/TaskMultiModal';
export { BudgetItemModal } from './modals/construction/tasks/BudgetItemModal';
export { CostModal } from './modals/construction/tasks/CostModal';

// Admin Modals
export { TaskCategoryFormModal } from './modals/admin/TaskCategoryFormModal';
export { TaskDivisionFormModal } from './modals/admin/TaskDivisionFormModal';
export { TaskParameterFormModal } from './modals/admin/TaskParameterFormModal';
export { TaskParameterOptionFormModal } from './modals/admin/TaskParameterOptionFormModal';
export { ParameterVisibilityConfigModal } from './modals/admin/ParameterVisibilityConfigModal';
export { AddParameterToCanvasModal } from './modals/admin/AddParameterToCanvasModal';
export { TaskModal } from './modals/admin/TaskModal';

// ============ SUB-FEATURES ============
// Project Types
export * from './project-types';

// Project Modalities
export * from './project-modalities';
