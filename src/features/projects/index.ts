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
export * from './services/getProjectModalities';
export * from './services/createProjectModality';
export * from './services/updateProjectModality';
export * from './services/deleteProjectModality';
export * from './services/replaceProjectModality';
export * from './services/getProjectTypes';
export * from './services/createProjectType';
export * from './services/updateProjectType';
export * from './services/deleteProjectType';
export * from './services/replaceProjectType';

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
export * from './hooks/use-project-modalities';
export * from './hooks/use-project-types';

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
export { ProjectItemCard } from './components/ProjectItemCard';
export { ProjectColorAdvanced } from './components/ProjectColorAdvanced';
export { ProjectSelectorField } from './components/ProjectSelectorField';
export { ProjectRow } from './components/ProjectRow';

// ============ FORMS ============
export * from './forms/ProjectForm';
export * from './forms/ProjectModalityForm';
export * from './forms/ProjectTypeForm';

// ============ MODALS ============
export { ProjectModal } from './modals/ProjectModal';
export { ProjectModalityModal } from './modals/ProjectModalityModal';
export { ProjectTypeModal } from './modals/ProjectTypeModal';

// ============ VIEWS ============
export { ProjectBasicDataView } from './views/ProjectBasicDataView';
export { ProjectLocationView } from './views/ProjectLocationView';
export { ProjectActivesView } from './views/ProjectActivesView';
export { ProjectListView } from './views/ProjectListView';
export { ProjectSettingsView } from './views/ProjectSettingsView';
export { ProjectVisionGeneralView } from './views/ProjectVisionGeneralView';

// ============ LEGACY MODALS (Re-exported for backward compatibility) ============
// These modals are now in @/features/legacy and will be distributed to appropriate features
export { GalleryFormModal, DocumentFolderFormModal, DocumentPreviewModal, DocumentUploadFormModal } from '@/features/legacy';
export { BudgetFormModal, BudgetTaskFormModal, ConstructionPhaseFormModal, ConstructionTaskScheduleModal, DependencyConnectionModal, IndirectModal, InsuranceFormModal, RenewInsuranceFormModal, TaskMultiModal, BudgetItemModal, CostModal } from '@/features/legacy';
export { TaskCategoryFormModal, TaskDivisionFormModal, TaskParameterFormModal, TaskParameterOptionFormModal, ParameterVisibilityConfigModal, AddParameterToCanvasModal, TaskModal } from '@/features/legacy';
