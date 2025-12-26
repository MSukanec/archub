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
  reference: string | null;
  wallet_id: string | null;
  status: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  movement_type: 'client_payment' | 'material_payment' | 'personnel_payment' | 'partner_contribution' | 'partner_withdrawal' | 'general_cost_payment';
  client_id: string | null;
  material_id: string | null;
  personnel_id: string | null;
  purchase_id: string | null;
  partner_id: string | null;
  general_cost_id: string | null;
  amount_sign: number;
  // Nuevas columnas de la vista v2
  creator_full_name: string | null;
  creator_avatar_url: string | null;
  entity_name: string | null;
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

  // Collect IDs for batch queries
  const projectIds = Array.from(new Set(movements.map(m => m.project_id).filter(Boolean))) as string[];
  const currencyIds = Array.from(new Set(movements.map(m => m.currency_id).filter(Boolean))) as string[];
  const walletIds = Array.from(new Set(movements.map(m => m.wallet_id).filter(Boolean))) as string[];
  const materialIds = Array.from(new Set(movements.filter(m => m.movement_type === 'material_payment' && m.material_id).map(m => m.material_id).filter(Boolean))) as string[];
  const personnelIds = Array.from(new Set(movements.filter(m => m.movement_type === 'personnel_payment' && m.personnel_id).map(m => m.personnel_id).filter(Boolean))) as string[];

  // Build separate ID arrays for each payment type for media_links query
  const clientPaymentIdSet = new Set(movements.filter(m => m.movement_type === 'client_payment').map(m => m.id));
  const materialPaymentIdSet = new Set(movements.filter(m => m.movement_type === 'material_payment').map(m => m.id));
  const personnelPaymentIdSet = new Set(movements.filter(m => m.movement_type === 'personnel_payment').map(m => m.id));
  const partnerContributionIdSet = new Set(movements.filter(m => m.movement_type === 'partner_contribution').map(m => m.id));
  const partnerWithdrawalIdSet = new Set(movements.filter(m => m.movement_type === 'partner_withdrawal').map(m => m.id));
  const generalCostPaymentIdSet = new Set(movements.filter(m => m.movement_type === 'general_cost_payment').map(m => m.id));

  // Build the OR filter parts only for types that have payments
  const orFilterParts: string[] = [];
  if (clientPaymentIdSet.size > 0) {
    orFilterParts.push(`client_payment_id.in.(${Array.from(clientPaymentIdSet).join(',')})`);
  }
  if (materialPaymentIdSet.size > 0) {
    orFilterParts.push(`material_payment_id.in.(${Array.from(materialPaymentIdSet).join(',')})`);
  }
  if (personnelPaymentIdSet.size > 0) {
    orFilterParts.push(`personnel_payment_id.in.(${Array.from(personnelPaymentIdSet).join(',')})`);
  }
  if (partnerContributionIdSet.size > 0) {
    orFilterParts.push(`partner_contribution_id.in.(${Array.from(partnerContributionIdSet).join(',')})`);
  }
  if (partnerWithdrawalIdSet.size > 0) {
    orFilterParts.push(`partner_withdrawal_id.in.(${Array.from(partnerWithdrawalIdSet).join(',')})`);
  }
  if (generalCostPaymentIdSet.size > 0) {
    orFilterParts.push(`general_cost_payment_id.in.(${Array.from(generalCostPaymentIdSet).join(',')})`);
  }

  // Fetch relations (projects, currencies, wallets), materials, personnel, and attachments
  const [projectsResult, currenciesResult, walletsResult, materialsResult, personnelResult, attachmentsResult] = await Promise.all([
    projectIds.length > 0 
      ? supabase.from('projects').select('id, name, code, color').in('id', projectIds)
      : { data: [], error: null },
    currencyIds.length > 0
      ? supabase.from('currencies').select('id, code, symbol, name').in('id', currencyIds)
      : { data: [], error: null },
    walletIds.length > 0
      ? supabase.from('organization_wallets').select('id, wallets:wallet_id(id, name)').in('id', walletIds)
      : { data: [], error: null },
    materialIds.length > 0
      ? supabase.from('materials').select('id, name').in('id', materialIds)
      : { data: [], error: null },
    personnelIds.length > 0
      ? supabase.from('personnel').select('id, full_name').in('id', personnelIds)
      : { data: [], error: null },
    orFilterParts.length > 0
      ? supabase.from('media_links')
          .select('id, client_payment_id, material_payment_id, personnel_payment_id, partner_contribution_id, partner_withdrawal_id, general_cost_payment_id')
          .or(orFilterParts.join(','))
      : { data: [], error: null },
  ]);

  const projectsMap = new Map((projectsResult.data || []).map(p => [p.id, p]));
  const currenciesMap = new Map((currenciesResult.data || []).map(c => [c.id, c]));
  const walletsMap = new Map((walletsResult.data || []).map((w: any) => [
    w.id, 
    w.wallets ? { id: w.id, name: w.wallets.name } : null
  ]));
  const materialsMap = new Map((materialsResult.data || []).map((m: any) => [m.id, m.name]));
  const personnelMap = new Map((personnelResult.data || []).map((p: any) => [p.id, p.full_name]));
  
  const attachmentsSet = new Set<string>();
  (attachmentsResult.data || []).forEach((link: any) => {
    if (link.client_payment_id) attachmentsSet.add(link.client_payment_id);
    if (link.material_payment_id) attachmentsSet.add(link.material_payment_id);
    if (link.personnel_payment_id) attachmentsSet.add(link.personnel_payment_id);
    if (link.partner_contribution_id) attachmentsSet.add(link.partner_contribution_id);
    if (link.partner_withdrawal_id) attachmentsSet.add(link.partner_withdrawal_id);
    if (link.general_cost_payment_id) attachmentsSet.add(link.general_cost_payment_id);
  });

  return movements.map((movement: any) => {
    let entityName = movement.entity_name;
    
    // Enrich entity_name only for material and personnel if missing
    if (!entityName) {
      if (movement.movement_type === 'material_payment' && movement.material_id) {
        entityName = materialsMap.get(movement.material_id) || null;
      } else if (movement.movement_type === 'personnel_payment' && movement.personnel_id) {
        entityName = personnelMap.get(movement.personnel_id) || null;
      }
    }
    
    return {
      ...movement,
      entity_name: entityName,
      project: movement.project_id ? projectsMap.get(movement.project_id) || null : null,
      currency: movement.currency_id ? currenciesMap.get(movement.currency_id) || null : null,
      wallet: movement.wallet_id ? walletsMap.get(movement.wallet_id) || null : null,
      signed_amount: movement.amount * movement.amount_sign,
      has_attachments: attachmentsSet.has(movement.id),
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
