/**
 * Materials Feature - Barrel Export
 * 
 * Exporta todos los módulos del feature materials siguiendo Feature-Sliced Design:
 * - Services (funciones de Supabase)
 * - Hooks (React Query)
 * - Types (TypeScript)
 * - Schemas (Zod)
 * - Constants (enums, query keys)
 * - Mappers (transformaciones)
 * - Modals (componentes presentacionales)
 * - Sub-Features (material-categories, material-prices)
 */

// ============ SERVICES ============
export * from './services/getMaterials';
export * from './services/getMaterialById';
export * from './services/createMaterial';
export * from './services/updateMaterial';
export * from './services/deleteMaterial';
export * from './services/getConstructionMaterials';

// ============ HOOKS ============
export * from './hooks/use-materials';
export * from './hooks/use-material';
export * from './hooks/use-create-material';
export * from './hooks/use-update-material';
export * from './hooks/use-delete-material';
export * from './hooks/use-construction-materials';

// ============ TYPES ============
export * from './types';

// ============ SCHEMAS ============
export * from './schemas';

// ============ CONSTANTS ============
export * from './constants';

// ============ MAPPERS ============
export * from './mappers/materialMapper';

// ============ MODALS ============
export { MaterialModal } from './modals/MaterialModal';

// ============ SUB-FEATURES ============
// Material Categories
export * from './material-categories';

// Material Prices
export * from './material-prices';
