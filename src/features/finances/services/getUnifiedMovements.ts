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
  entity_name: string | null;
  has_attachments: boolean;
}

/**
 * Obtiene todos los movimientos financieros unificados de la vista.
 * Las relaciones se obtienen por separado porque las vistas no tienen FK automáticas.
 * 
 * NOTE: The `unified_financial_movements_view` database view needs to be updated in Supabase
 * to filter out soft-deleted records. Add the following WHERE clause to each UNION component:
 * - client_payments: WHERE (is_deleted IS NULL OR is_deleted = false)
 * - material_payments: WHERE (is_deleted IS NULL OR is_deleted = false)
 * - personnel_payments: WHERE (is_deleted IS NULL OR is_deleted = false)
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
  
  const clientPaymentIds = movements
    .filter(m => m.movement_type === 'client_payment' && m.client_id)
    .map(m => m.client_id) as string[];
  const personnelIds = movements
    .filter(m => m.movement_type === 'personnel_payment' && m.personnel_id)
    .map(m => m.personnel_id) as string[];
  const paymentIds = movements.map(m => m.id) as string[];

  const [projectsResult, currenciesResult, walletsResult, clientsResult, personnelResult, attachmentsResult] = await Promise.all([
    projectIds.length > 0 
      ? supabase.from('projects').select('id, name, code, color').in('id', projectIds)
      : { data: [], error: null },
    currencyIds.length > 0
      ? supabase.from('currencies').select('id, code, symbol, name').in('id', currencyIds)
      : { data: [], error: null },
    walletIds.length > 0
      ? supabase.from('organization_wallets').select('id, wallets:wallet_id(id, name)').in('id', walletIds)
      : { data: [], error: null },
    clientPaymentIds.length > 0
      ? supabase.from('project_clients').select('id, contact:contacts(id, full_name, company_name)').in('id', clientPaymentIds)
      : { data: [], error: null },
    personnelIds.length > 0
      ? supabase.from('organization_members').select('id, user:users(id, full_name)').in('id', personnelIds)
      : { data: [], error: null },
    paymentIds.length > 0
      ? supabase.from('media_links').select('id, client_payment_id, material_payment_id, personnel_payment_id').or(
          `client_payment_id.in.(${paymentIds.join(',')}),material_payment_id.in.(${paymentIds.join(',')}),personnel_payment_id.in.(${paymentIds.join(',')})`
        )
      : { data: [], error: null },
  ]);

  const projectsMap = new Map((projectsResult.data || []).map(p => [p.id, p]));
  const currenciesMap = new Map((currenciesResult.data || []).map(c => [c.id, c]));
  const walletsMap = new Map((walletsResult.data || []).map((w: any) => [
    w.id, 
    w.wallets ? { id: w.id, name: w.wallets.name } : null
  ]));
  const clientsMap = new Map((clientsResult.data || []).map((c: any) => [
    c.id,
    c.contact?.full_name || c.contact?.company_name || null
  ]));
  const personnelMap = new Map((personnelResult.data || []).map((p: any) => [
    p.id,
    p.user?.full_name || null
  ]));
  
  const attachmentsSet = new Set<string>();
  (attachmentsResult.data || []).forEach((link: any) => {
    if (link.client_payment_id) attachmentsSet.add(link.client_payment_id);
    if (link.material_payment_id) attachmentsSet.add(link.material_payment_id);
    if (link.personnel_payment_id) attachmentsSet.add(link.personnel_payment_id);
  });

  const getEntityName = (movement: any): string | null => {
    switch (movement.movement_type) {
      case 'client_payment':
        return movement.client_id ? clientsMap.get(movement.client_id) || null : null;
      case 'personnel_payment':
        return movement.personnel_id ? personnelMap.get(movement.personnel_id) || null : null;
      case 'material_payment':
        return movement.description || null;
      default:
        return null;
    }
  };

  return movements.map((movement: any) => ({
    ...movement,
    project: movement.project_id ? projectsMap.get(movement.project_id) || null : null,
    currency: movement.currency_id ? currenciesMap.get(movement.currency_id) || null : null,
    wallet: movement.wallet_id ? walletsMap.get(movement.wallet_id) || null : null,
    signed_amount: movement.amount * movement.amount_sign,
    entity_name: getEntityName(movement),
    has_attachments: attachmentsSet.has(movement.id),
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
