export interface GeneralCost {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  category: string | null;
  is_active: boolean;
  unit: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface InsertGeneralCost {
  organization_id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  is_active?: boolean;
  unit?: string | null;
}

export interface GeneralCostValue {
  id?: string;
  general_cost_id: string;
  amount: number;
  currency_id: string;
  valid_from: string;
  created_at?: string;
}
