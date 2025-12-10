import { supabase } from '@/lib/supabase';

/**
 * Tipo que representa un movimiento de la vista unified_financial_movements_view
 */
export interface UnifiedMovement {
  id: string;
  organization_id: string;
  project_id: string | null;
  amount: number;
  currency_id: string;
  exchange_rate: number;
  payment_date: string;
  description: string;
  notes: string | null;
  reference: string | null;
  wallet_id: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  movement_type: 'client_payment' | 'material_payment' | 'personnel_payment';
  client_id: string | null;
  material_id: string | null;
  personnel_id: string | null;
  purchase_id: string | null;
  amount_sign: number;
}

/**
 * Movimiento unificado con relaciones pobladas
 */
export interface UnifiedMovementWithRelations extends UnifiedMovement {
  project: {
    id: string;
    name: string;
    code: string | null;
    color: string;
  } | null;
  currency: {
    id: string;
    code: string;
    symbol: string;
    name: string;
  } | null;
  wallet: {
    id: string;
    name: string;
  } | null;
  signed_amount: number;
}

/**
 * Obtiene todos los movimientos financieros unificados de la vista.
 * 
 * @param organizationId - ID de la organización
 * @param projectId - ID del proyecto (opcional)
 * @returns Array de movimientos unificados con relaciones
 */
export async function getUnifiedMovements(
  organizationId: string,
  projectId?: string | null
): Promise<UnifiedMovementWithRelations[]> {
  if (!organizationId) {
    return [];
  }

  let query = supabase
    .from('unified_financial_movements_view')
    .select(`
      *,
      project:projects(id, name, code, color),
      currency:currencies(id, code, symbol, name),
      wallet:organization_wallets(
        id,
        wallets:wallet_id(id, name)
      )
    `)
    .eq('organization_id', organizationId)
    .order('payment_date', { ascending: false });

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching unified movements:', error);
    return [];
  }

  return (data || []).map((movement: any) => {
    const project = Array.isArray(movement.project) ? movement.project[0] : movement.project;
    const currency = Array.isArray(movement.currency) ? movement.currency[0] : movement.currency;
    const walletData = Array.isArray(movement.wallet) ? movement.wallet[0] : movement.wallet;
    
    return {
      ...movement,
      project,
      currency,
      wallet: walletData?.wallets ? {
        id: walletData.id,
        name: walletData.wallets.name,
      } : null,
      signed_amount: movement.amount * movement.amount_sign,
    };
  });
}

/**
 * Obtiene estadísticas resumidas de los movimientos
 */
export async function getUnifiedMovementsStats(
  organizationId: string,
  projectId?: string | null
): Promise<{
  total_income: number;
  total_expenses: number;
  balance: number;
  count: number;
}> {
  const movements = await getUnifiedMovements(organizationId, projectId);
  
  let total_income = 0;
  let total_expenses = 0;
  
  movements.forEach(m => {
    if (m.amount_sign > 0) {
      total_income += m.amount;
    } else {
      total_expenses += m.amount;
    }
  });

  return {
    total_income,
    total_expenses,
    balance: total_income - total_expenses,
    count: movements.length,
  };
}
