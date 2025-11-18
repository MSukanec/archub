/**
 * TypeScript types for finances feature
 */

// Ejemplo: Tipo de movimiento financiero
export interface FinancialMovement {
  id: string;
  organization_id: string;
  movement_type: 'income' | 'expense' | 'transfer';
  amount: number;
  currency: string;
  description: string;
  movement_date: string;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

// Ejemplo: Tipo para balance de cuenta
export interface AccountBalance {
  account_id: string;
  account_name: string;
  balance: number;
  currency: string;
  last_updated: string;
}
