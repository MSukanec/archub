export interface GeneralCost {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  category?: string;
  unit?: {
    id: string;
    name: string;
    symbol: string;
  };
  current_value?: {
    amount: number;
    currency_id: string;
    valid_from: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface InsertGeneralCost {
  organization_id: string;
  name: string;
  description?: string | undefined;
}

export interface GeneralCostValue {
  general_cost_id?: string;
  amount: number;
  currency_id: string;
  valid_from: string;
}
