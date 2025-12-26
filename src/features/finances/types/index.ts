/**
 * Types for the Finances feature
 * 
 * Unified financial movements that aggregate data from:
 * - client_payments
 * - material_payments (future)
 * - indirect_payments (future)
 * - personnel_payments (future)
 * - subcontract_payments (future)
 * - general_cost_payments (future)
 */

// ========== Core Financial Movement Type ==========

/**
 * Unified financial movement type that represents ANY payment in the system.
 * This type is designed to match the columns from the legacy MovementsList.tsx page.
 * 
 * All *_payments tables will be transformed to this unified structure.
 */
export interface FinancialMovement {
  // Core fields (common to all payment types)
  id: string;
  organization_id: string;
  project_id: string | null;
  
  // Payment details
  amount: number;
  currency_id: string;
  exchange_rate: number;
  payment_date: string;
  
  // Description and reference
  description: string;
  notes: string | null;
  reference: string | null;
  
  // Payment metadata
  wallet_id: string | null;
  status: 'confirmed' | 'pending' | 'rejected' | 'void';
  file_url: string | null;
  
  // Audit fields
  created_by: string | null;
  created_at: string;
  updated_at: string;
  
  // Movement classification (replaces type/category/subcategory from old system)
  movement_type: string; // e.g., "client_payment", "material_payment", etc.
  movement_category: string | null; // e.g., client name, material name, etc.
  movement_subcategory: string | null; // e.g., client role, material category, etc.
  
  // Entity-specific fields (only populated for relevant payment types)
  client_id: string | null;
  material_id: string | null;
  personnel_id: string | null;
  indirect_id: string | null;
  subcontract_id: string | null;
  general_cost_id: string | null;
  partner_id: string | null;
}

/**
 * Financial movement with all relations populated.
 * This matches the structure of the old Movement type from MovementsList.tsx
 */
export interface FinancialMovementWithRelations extends FinancialMovement {
  // Project relation
  project: {
    id: string;
    name: string;
    code: string | null;
    color: string;
  } | null;
  
  // Currency relation
  currency: {
    id: string;
    code: string;
    symbol: string;
    name: string;
  } | null;
  
  // Wallet relation
  wallet: {
    id: string;
    name: string;
  } | null;
  
  // Creator relation
  creator: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  } | null;
  
  // Entity-specific relations (populated based on movement_type)
  client: {
    id: string;
    contact: {
      id: string;
      full_name: string | null;
      company_name: string | null;
    } | null;
    role: {
      id: string;
      name: string;
    } | null;
  } | null;
  
  material: {
    id: string;
    name: string;
  } | null;
  
  personnel: {
    id: string;
    name: string;
  } | null;
  
  indirect: {
    id: string;
    name: string;
  } | null;
  
  subcontract: {
    id: string;
    name: string;
  } | null;
  
  general_cost: {
    id: string;
    name: string;
  } | null;
  
  partner: {
    id: string;
    name: string;
  } | null;
}

// ========== Filters and Search ==========

export interface FinancialMovementsFilters {
  search?: string;
  movement_type?: string;
  status?: string;
  project_id?: string;
  currency_id?: string;
  wallet_id?: string;
  date_from?: string;
  date_to?: string;
}

// ========== Statistics ==========

export interface FinancialMovementStats {
  total_movements: number;
  total_income: number;
  total_expenses: number;
  balance: number;
  by_currency: Array<{
    currency_id: string;
    currency_code: string;
    currency_symbol: string;
    total_income: number;
    total_expenses: number;
    balance: number;
  }>;
  by_project: Array<{
    project_id: string;
    project_name: string;
    total_movements: number;
    balance: number;
  }>;
  by_type: Array<{
    movement_type: string;
    count: number;
    total_amount: number;
  }>;
}
