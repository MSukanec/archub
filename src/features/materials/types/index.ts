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
}

export interface UpdateMaterialCategoryData extends Partial<NewMaterialCategoryData> {}
