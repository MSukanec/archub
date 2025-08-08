// Types and interfaces for finance-related components
// Extracted from FinancesMovements.tsx for better organization and reusability

export interface Movement {
  id: string;
  description: string;
  amount: number;
  exchange_rate?: number;
  created_at: string;
  movement_date: string;
  created_by: string;
  organization_id: string;
  project_id: string;
  type_id: string;
  category_id: string;
  subcategory_id?: string;
  currency_id: string;
  wallet_id: string;
  is_favorite?: boolean;
  conversion_group_id?: string;
  transfer_group_id?: string;
  movement_data?: {
    type?: {
      id: string;
      name: string;
    };
    category?: {
      id: string;
      name: string;
    };
    subcategory?: {
      id: string;
      name: string;
    };
    currency?: {
      id: string;
      name: string;
      code: string;
    };
    wallet?: {
      id: string;
      name: string;
    };
  };
  creator?: {
    id: string;
    full_name?: string;
    email: string;
    avatar_url?: string;
  };
}

export interface ConversionGroup {
  id: string;
  conversion_group_id: string;
  movements: Movement[];
  from_currency: string;
  to_currency: string;
  from_amount: number;
  to_amount: number;
  description: string;
  movement_date: string;
  created_at: string;
  creator?: {
    id: string;
    full_name?: string;
    email: string;
    avatar_url?: string;
  };
  is_conversion_group: true;
}

export interface TransferGroup {
  id: string;
  transfer_group_id: string;
  movements: Movement[];
  currency: string;
  amount: number;
  description: string;
  movement_date: string;
  created_at: string;
  creator?: {
    id: string;
    full_name?: string;
    email: string;
    avatar_url?: string;
  };
  from_wallet: string;
  to_wallet: string;
  is_transfer_group: true;
}

// Additional types that might be useful for finance components
export type MovementFilters = {
  type: string;
  category: string;
  subcategory: string;
  scope: string;
  favorites: string;
  currency: string;
  wallet: string;
};

export type MovementSortType = 'string' | 'date' | 'number';

export interface MovementTableColumn {
  key: string;
  label: string;
  width: string;
  sortable: boolean;
  sortType: MovementSortType;
  render: (item: Movement | ConversionGroup) => JSX.Element;
}