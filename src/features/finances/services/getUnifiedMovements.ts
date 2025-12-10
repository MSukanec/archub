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
 * Las relaciones se obtienen por separado porque las vistas no tienen FK automáticas.
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
    .select('*')
    .eq('organization_id', organizationId)
    .order('payment_date', { ascending: false });

  if (projectId) {
    query = query.eq('project_id', projectId);
  }

  const { data: movements, error } = await query;

  if (error) {
    console.error('Error fetching unified movements:', error);
    return [];
  }

  if (!movements || movements.length === 0) {
    return [];
  }

  const projectIds = Array.from(new Set(movements.map(m => m.project_id).filter(Boolean))) as string[];
  const currencyIds = Array.from(new Set(movements.map(m => m.currency_id).filter(Boolean))) as string[];
  const walletIds = Array.from(new Set(movements.map(m => m.wallet_id).filter(Boolean))) as string[];

  const [projectsResult, currenciesResult, walletsResult] = await Promise.all([
    projectIds.length > 0 
      ? supabase.from('projects').select('id, name, code, color').in('id', projectIds)
      : { data: [], error: null },
    currencyIds.length > 0
      ? supabase.from('currencies').select('id, code, symbol, name').in('id', currencyIds)
      : { data: [], error: null },
    walletIds.length > 0
      ? supabase.from('organization_wallets').select('id, wallets:wallet_id(id, name)').in('id', walletIds)
      : { data: [], error: null },
  ]);

  const projectsMap = new Map((projectsResult.data || []).map(p => [p.id, p]));
  const currenciesMap = new Map((currenciesResult.data || []).map(c => [c.id, c]));
  const walletsMap = new Map((walletsResult.data || []).map((w: any) => [
    w.id, 
    w.wallets ? { id: w.id, name: w.wallets.name } : null
  ]));

  return movements.map((movement: any) => ({
    ...movement,
    project: movement.project_id ? projectsMap.get(movement.project_id) || null : null,
    currency: movement.currency_id ? currenciesMap.get(movement.currency_id) || null : null,
    wallet: movement.wallet_id ? walletsMap.get(movement.wallet_id) || null : null,
    signed_amount: movement.amount * movement.amount_sign,
  }));
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
