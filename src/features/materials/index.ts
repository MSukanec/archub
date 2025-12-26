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
export * from './services/materialPayments';

// ============ HOOKS ============
export * from './hooks/use-materials';
export * from './hooks/use-material';
export * from './hooks/use-create-material';
export * from './hooks/use-update-material';
export * from './hooks/use-delete-material';
export * from './hooks/use-construction-materials';
export * from './hooks/use-products';
export * from './hooks/use-provider-products';
export * from './hooks/use-material-payments';

// ============ TYPES ============
export * from './types';

// ============ SCHEMAS ============
export * from './schemas';

// ============ CONSTANTS ============
export * from './constants';

// ============ MAPPERS ============
export * from './mappers/materialMapper';

// ============ UTILS ============
export * from './utils/statusBadge';

// ============ FORMS ============
export { PurchaseOrderForm } from './forms/PurchaseOrderForm';
export { MaterialPurchaseForm } from './forms/MaterialPurchaseForm';

// Payment Modal (nuevo patrón agnóstico)
export { MaterialPaymentModal } from './modals/MaterialPaymentModal';
export { MaterialPaymentFormFields } from './forms/MaterialPaymentFormFields';

// ============ MODALS ============
export { MaterialModal } from './modals/MaterialModal';
export { ProviderProductModal } from './modals/ProviderProductModal';

// Admin Modals
export { MaterialFormModal } from './modals/admin/MaterialFormModal';
export { MaterialCategoryFormModal } from './modals/admin/MaterialCategoryFormModal';
export { BrandFormModal } from './modals/admin/BrandFormModal';
export { AdminProductModal } from './modals/admin/AdminProductModal';
export { UnitPresentationFormModal } from './modals/admin/UnitPresentationFormModal';
export { ProductModal } from './modals/admin/ProductModal';

// ============ COMPONENTS ============
// Admin Components
export { default as AdminMaterialRow } from './components/admin/AdminMaterialRow';
export { default as AdminProductRow } from './components/admin/AdminProductRow';

// ============ SUB-FEATURES ============
// Material Categories
export * from './material-categories';

// Material Prices
export * from './material-prices';
