/**
 * Materials Feature - Type Definitions
 * 
 * Interfaces y tipos para la gestión de materiales.
 */
// ============ MATERIAL TYPES ============
export interface Material {
  id: string;
  name: string;
  category_id?: string;
  category_name?: string;
  unit_id: string;
  unit_of_computation?: string;
  unit_description?: string;
  default_unit_presentation_id?: string;
  default_unit_presentation?: string;
  unit_equivalence?: number;
  is_system: boolean;
  is_completed?: boolean;
  material_type?: string;
  created_at: string;
  updated_at?: string;
  min_price?: number;
  max_price?: number;
  avg_price?: number;
  product_count?: number;
  provider_product_count?: number;
  price_count?: number;
  // Legacy fields for backward compatibility
  unit?: { name: string };
  category?: { name: string };
  organization_material_prices?: Array<{
    id: string;
    unit_price: number;
    currency_id: string;
    currency: {
      symbol: string;
      name: string;
    };
  }>;
}
export interface NewMaterialData {
  name: string;
  material_type?: string;
  unit_id: string;
  category_id: string;
  is_completed?: boolean;
  organization_id?: string;
  is_system?: boolean;
}
export interface UpdateMaterialData extends Partial<NewMaterialData> {}
// ============ CONSTRUCTION MATERIAL TYPES ============
export interface ConstructionMaterial {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  unit_name?: string;
  computed_quantity: number;
  purchased_quantity: number;
  to_purchase_quantity: number;
  phases?: { phase_name: string; quantity: number }[];
  commercial_unit_name?: string;
  commercial_equivalence?: number;
  commercial_quantity?: number;
}
export interface ConstructionMaterialsResult {
  materials: ConstructionMaterial[];
  phases: string[];
}
export interface ConstructionMaterialsParams {
  projectId: string;
  organizationId: string;
  selectedPhase?: string;
  filterTaskIds?: string[];
}
// ============ MATERIAL CATEGORY TYPES ============
export interface MaterialCategory {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  children?: MaterialCategory[];
}
export interface NewMaterialCategoryData {
  name: string;
  parent_id?: string | null;
  organization_id?: string;
}
export interface UpdateMaterialCategoryData extends Partial<NewMaterialCategoryData> {}
// ============ MATERIAL PAYMENT TYPES ============
export interface MaterialPayment {
  id: string;
  project_id: string;
  organization_id: string;
  purchase_id: string | null;
  amount: number;
  currency_id: string;
  exchange_rate: number | null;
  payment_date: string;
  notes: string | null;
  reference: string | null;
  wallet_id: string | null;
  status: 'confirmed'| 'pending'| 'rejected'| 'void';
  created_by: string | null;
  created_at: string;
  updated_at: string;
}
export interface MaterialPaymentWithRelations extends MaterialPayment {
  currency: {
    id: string;
    code: string;
    symbol: string;
    name: string;
  } | null;
  wallet: {
    id: string;
    organization_id: string;
    wallet_id: string;
    is_active: boolean;
    is_default: boolean;
    wallets: {
      id: string;
      name: string;
      is_active: boolean;
      created_at: string;
      updated_at: string;
    } | null;
  } | null;
  creator: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  project: {
    id: string;
    name: string;
    code: string | null;
    color: string;
  } | null;
  attachments?: Array<{
    id: string;
    file_url: string;
    file_name: string;
    file_type: string;
  }>;
}
