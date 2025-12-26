export interface GeneralCost {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string | null;
  is_deleted?: boolean | null;
  deleted_at?: string | null;
  created_by?: string | null;
  category_id?: string | null;
  category?: {
    id: string;
    name: string;
  } | null;
}
export interface InsertGeneralCost {
  organization_id: string;
  name: string;
  description?: string | null;
  created_by?: string | null;
  category_id?: string | null;
}
export interface GeneralCostValue {
  id?: string;
  general_cost_id: string;
  amount: number;
  currency_id: string;
  valid_from: string;
  created_at?: string;
}
export interface GeneralCostPayment {
  id: string;
  organization_id: string;
  amount: number;
  currency_id: string;
  exchange_rate: number | null;
  payment_date: string;
  notes: string | null;
  reference: string | null;
  created_at: string;
  updated_at: string | null;
  wallet_id: string | null;
  general_cost_id: string | null;
  status: 'confirmed'| 'pending'| 'rejected'| 'void';
  created_by: string | null;
  currency?: {
    id: string;
    name: string;
    code: string;
    symbol: string;
  } | null;
  wallet?: {
    id: string;
    wallets?: {
      id: string;
      name: string;
    } | null;
  } | null;
  general_cost?: {
    id: string;
    name: string;
    description: string | null;
    category_id?: string | null;
    category?: {
      id: string;
      name: string;
    } | null;
  } | null;
  creator?: {
    id: string;
    users?: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
}
export interface InsertGeneralCostPayment {
  organization_id: string;
  amount: number;
  currency_id: string;
  exchange_rate?: number;
  payment_date: string;
  notes?: string | null;
  reference?: string | null;
  wallet_id?: string | null;
  general_cost_id?: string | null;
  status?: string;
  created_by?: string | null;
}
export interface GeneralCostCategory {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  is_system: boolean;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}
