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
  movement_type: 'client_payment' | 'material_payment' | 'personnel_payment' | 'partner_contribution' | 'partner_withdrawal';
  client_id: string | null;
  material_id: string | null;
  personnel_id: string | null;
  purchase_id: string | null;
  partner_id: string | null;
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
  creator: {
    id: string;
    full_name: string;
    avatar_url: string | null;
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
  const creatorIds = Array.from(new Set(movements.map(m => m.created_by).filter(Boolean))) as string[];
  
  const clientPaymentIds = movements
    .filter(m => m.movement_type === 'client_payment' && m.client_id)
    .map(m => m.client_id) as string[];
  const personnelIds = movements
    .filter(m => m.movement_type === 'personnel_payment' && m.personnel_id)
    .map(m => m.personnel_id) as string[];
  const partnerIds = movements
    .filter(m => (m.movement_type === 'partner_contribution' || m.movement_type === 'partner_withdrawal') && m.partner_id)
    .map(m => m.partner_id) as string[];

  // Build separate ID arrays for each payment type for more efficient media_links query
  const clientPaymentIdSet = new Set(movements.filter(m => m.movement_type === 'client_payment').map(m => m.id));
  const materialPaymentIdSet = new Set(movements.filter(m => m.movement_type === 'material_payment').map(m => m.id));
  const personnelPaymentIdSet = new Set(movements.filter(m => m.movement_type === 'personnel_payment').map(m => m.id));
  const partnerContributionIdSet = new Set(movements.filter(m => m.movement_type === 'partner_contribution').map(m => m.id));
  const partnerWithdrawalIdSet = new Set(movements.filter(m => m.movement_type === 'partner_withdrawal').map(m => m.id));

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

  const [projectsResult, currenciesResult, walletsResult, creatorsResult, clientsResult, personnelResult, partnersResult, attachmentsResult] = await Promise.all([
    projectIds.length > 0 
      ? supabase.from('projects').select('id, name, code, color').in('id', projectIds)
      : { data: [], error: null },
    currencyIds.length > 0
      ? supabase.from('currencies').select('id, code, symbol, name').in('id', currencyIds)
      : { data: [], error: null },
    walletIds.length > 0
      ? supabase.from('organization_wallets').select('id, wallets:wallet_id(id, name)').in('id', walletIds)
      : { data: [], error: null },
    creatorIds.length > 0
      ? supabase.from('users').select('id, full_name, avatar_url').in('id', creatorIds)
      : { data: [], error: null },
    clientPaymentIds.length > 0
      ? supabase.from('project_clients').select('id, contact:contacts(id, full_name, company_name)').in('id', clientPaymentIds)
      : { data: [], error: null },
    personnelIds.length > 0
      ? supabase.from('organization_members').select('id, user:users(id, full_name)').in('id', personnelIds)
      : { data: [], error: null },
    partnerIds.length > 0
      ? supabase.from('capital_participants').select('id, contact:contacts(id, full_name, company_name)').in('id', partnerIds)
      : { data: [], error: null },
    orFilterParts.length > 0
      ? supabase.from('media_links')
          .select('id, client_payment_id, material_payment_id, personnel_payment_id, partner_contribution_id, partner_withdrawal_id')
          .or(orFilterParts.join(','))
      : { data: [], error: null },
  ]);

  const projectsMap = new Map((projectsResult.data || []).map(p => [p.id, p]));
  const currenciesMap = new Map((currenciesResult.data || []).map(c => [c.id, c]));
  const walletsMap = new Map((walletsResult.data || []).map((w: any) => [
    w.id, 
    w.wallets ? { id: w.id, name: w.wallets.name } : null
  ]));
  const creatorsMap = new Map((creatorsResult.data || []).map((u: any) => [
    u.id,
    { id: u.id, full_name: u.full_name, avatar_url: u.avatar_url }
  ]));
  const clientsMap = new Map((clientsResult.data || []).map((c: any) => [
    c.id,
    c.contact?.full_name || c.contact?.company_name || null
  ]));
  const personnelMap = new Map((personnelResult.data || []).map((p: any) => [
    p.id,
    p.user?.full_name || null
  ]));
  const partnersMap = new Map((partnersResult.data || []).map((p: any) => [
    p.id,
    p.contact?.full_name || p.contact?.company_name || null
  ]));
  
  const attachmentsSet = new Set<string>();
  (attachmentsResult.data || []).forEach((link: any) => {
    if (link.client_payment_id) attachmentsSet.add(link.client_payment_id);
    if (link.material_payment_id) attachmentsSet.add(link.material_payment_id);
    if (link.personnel_payment_id) attachmentsSet.add(link.personnel_payment_id);
    if (link.partner_contribution_id) attachmentsSet.add(link.partner_contribution_id);
    if (link.partner_withdrawal_id) attachmentsSet.add(link.partner_withdrawal_id);
  });

  const getEntityName = (movement: any): string | null => {
    switch (movement.movement_type) {
      case 'client_payment':
        return movement.client_id ? clientsMap.get(movement.client_id) || null : null;
      case 'personnel_payment':
        return movement.personnel_id ? personnelMap.get(movement.personnel_id) || null : null;
      case 'material_payment':
        return movement.description || null;
      case 'partner_contribution':
      case 'partner_withdrawal':
        return movement.partner_id ? partnersMap.get(movement.partner_id) || null : null;
      default:
        return null;
    }
  };

  return movements.map((movement: any) => ({
    ...movement,
    project: movement.project_id ? projectsMap.get(movement.project_id) || null : null,
    currency: movement.currency_id ? currenciesMap.get(movement.currency_id) || null : null,
    wallet: movement.wallet_id ? walletsMap.get(movement.wallet_id) || null : null,
    creator: movement.created_by ? creatorsMap.get(movement.created_by) || null : null,
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
