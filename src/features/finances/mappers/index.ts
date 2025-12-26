import type { ClientPaymentWithRelations } from '@/features/clients/types';
import type { FinancialMovementWithRelations } from '../types';
import type { PartnerContributionWithRelations } from '../services/getPartnerContributions';
import type { PartnerWithdrawalWithRelations } from '../services/getPartnerWithdrawals';
import type { MaterialPaymentWithRelations } from '@/features/materials/types';
import type { PersonnelPaymentWithRelations } from '@/features/personnel/types';
import type { GeneralCostPayment } from '@/features/general-costs/types';

export interface LegacyMovementWithRelations {
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
  partner?: string;
  subcontract?: string;
  indirect_id?: string;
  general_cost_id?: string;
  projects?: { name: string; color: string; code?: string };
  movement_types?: { id: string; name: string };
  movement_categories?: { id: string; name: string };
  movement_subcategories?: { id: string; name: string };
  currencies?: { id: string; name: string; code: string; symbol?: string };
  organization_wallets?: { id: string; wallets?: { id: string; name: string } };
  profiles?: { full_name?: string; avatar_url?: string };
  indirect_costs?: { id: string; name: string };
}

/**
 * Transforms a client_payments record into a unified FinancialMovement.
 * This mapper ensures that all payment types share the same structure.
 * 
 * @param clientPayment - Client payment with all relations
 * @returns Unified financial movement
 */
export function mapClientPaymentToFinancialMovement(
  clientPayment: ClientPaymentWithRelations
): FinancialMovementWithRelations {
  // Extract client name for category
  const clientName = clientPayment.client?.contact?.full_name || 
                     clientPayment.client?.contact?.company_name || 
                     'Cliente sin nombre';
  
  // Extract role name for subcategory
  const roleName = clientPayment.client?.role?.name || null;
  
  // Build description from notes or reference
  const description = clientPayment.notes || 
                      clientPayment.reference || 
                      `Pago de ${clientName}`;
  
  return {
    // Core fields
    id: clientPayment.id,
    organization_id: clientPayment.organization_id,
    project_id: clientPayment.project_id,
    
    // Payment details
    amount: clientPayment.amount,
    currency_id: clientPayment.currency_id,
    exchange_rate: clientPayment.exchange_rate ?? 1,
    payment_date: clientPayment.payment_date,
    
    // Description and reference
    description,
    notes: clientPayment.notes,
    reference: clientPayment.reference,
    
    // Payment metadata
    wallet_id: clientPayment.wallet_id,
    status: clientPayment.status,
    file_url: clientPayment.file_url ?? null,
    
    // Audit fields
    created_by: clientPayment.created_by,
    created_at: clientPayment.created_at,
    updated_at: clientPayment.updated_at,
    
    // Movement classification
    movement_type: 'client_payment',
    movement_category: clientName,
    movement_subcategory: roleName,
    
    // Entity-specific fields (only client_id populated)
    client_id: clientPayment.client_id,
    material_id: null,
    personnel_id: null,
    indirect_id: null,
    subcontract_id: null,
    general_cost_id: null,
    partner_id: null,
    
    // Relations - Project (hydrated by service)
    project: clientPayment.project ? {
      id: clientPayment.project.id,
      name: clientPayment.project.name,
      code: clientPayment.project.code,
      color: clientPayment.project.color,
    } : null,
    
    // Relations - Currency
    currency: clientPayment.currency ? {
      id: clientPayment.currency.id,
      code: clientPayment.currency.code,
      symbol: clientPayment.currency.symbol || '',
      name: clientPayment.currency.name,
    } : null,
    
    // Relations - Wallet
    wallet: clientPayment.wallet?.wallets ? {
      id: clientPayment.wallet.wallets.id,
      name: clientPayment.wallet.wallets.name,
    } : null,
    
    // Relations - Creator (hydrated by service)
    creator: clientPayment.creator ? {
      id: clientPayment.creator.id,
      email: clientPayment.creator.email,
      full_name: clientPayment.creator.full_name,
      avatar_url: clientPayment.creator.avatar_url,
    } : null,
    
    // Relations - Client (already populated)
    client: clientPayment.client ? {
      id: clientPayment.client.id,
      contact: clientPayment.client.contact ? {
        id: clientPayment.client.contact.id,
        full_name: clientPayment.client.contact.full_name,
        company_name: clientPayment.client.contact.company_name,
      } : null,
      role: clientPayment.client.role ? {
        id: clientPayment.client.role.id,
        name: clientPayment.client.role.name,
      } : null,
    } : null,
    
    // Relations - Other entity types (null for client payments)
    material: null,
    personnel: null,
    indirect: null,
    subcontract: null,
    general_cost: null,
    partner: null,
  };
}

/**
 * Maps an array of client payments to financial movements.
 * 
 * @param clientPayments - Array of client payments with relations
 * @returns Array of unified financial movements
 */
export function mapClientPaymentsToFinancialMovements(
  clientPayments: ClientPaymentWithRelations[]
): FinancialMovementWithRelations[] {
  return clientPayments.map(mapClientPaymentToFinancialMovement);
}

/**
 * Transforms a partner_contributions record into a unified FinancialMovement.
 * Partner contributions are capital investments (ingresos).
 * 
 * @param contribution - Partner contribution with all relations
 * @returns Unified financial movement
 */
export function mapPartnerContributionToFinancialMovement(
  contribution: PartnerContributionWithRelations
): FinancialMovementWithRelations {
  // Extract partner name for category (prioritize full_name)
  const partnerContact = contribution.partner?.contacts;
  const partnerName = partnerContact?.full_name ||
    (partnerContact?.first_name && partnerContact?.last_name
      ? `${partnerContact.first_name} ${partnerContact.last_name}`
      : null) ||
    partnerContact?.company_name || 
    partnerContact?.email || 
    'Sin socio';
  
  // Build description from notes or reference
  const description = contribution.notes || 
                      contribution.reference || 
                      `Aporte de ${partnerName}`;
  
  return {
    // Core fields
    id: contribution.id,
    organization_id: contribution.organization_id,
    project_id: contribution.project_id,
    
    // Payment details
    amount: contribution.amount,
    currency_id: contribution.currency_id,
    exchange_rate: contribution.exchange_rate,
    payment_date: contribution.contribution_date,
    
    // Description and reference
    description,
    notes: contribution.notes,
    reference: contribution.reference,
    
    // Payment metadata
    wallet_id: contribution.wallet_id,
    status: contribution.status,
    file_url: contribution.file_url,
    
    // Audit fields
    created_by: contribution.created_by,
    created_at: contribution.created_at,
    updated_at: contribution.updated_at,
    
    // Movement classification
    movement_type: 'partner_contribution',
    movement_category: partnerName,
    movement_subcategory: 'Aporte de Capital',
    
    // Entity-specific fields (only partner_id populated)
    client_id: null,
    material_id: null,
    personnel_id: null,
    indirect_id: null,
    subcontract_id: null,
    general_cost_id: null,
    partner_id: contribution.partner_id,
    
    // Relations - Project
    project: contribution.project ? {
      id: contribution.project.id,
      name: contribution.project.name,
      code: contribution.project.code,
      color: contribution.project.color,
    } : null,
    
    // Relations - Currency
    currency: contribution.currency ? {
      id: contribution.currency.id,
      code: contribution.currency.code,
      symbol: contribution.currency.symbol || '',
      name: contribution.currency.name,
    } : null,
    
    // Relations - Wallet
    wallet: contribution.wallet?.wallets ? {
      id: contribution.wallet.wallets.id,
      name: contribution.wallet.wallets.name,
    } : null,
    
    // Relations - Creator
    creator: contribution.creator ? {
      id: contribution.creator.id,
      email: contribution.creator.email,
      full_name: contribution.creator.full_name,
      avatar_url: contribution.creator.avatar_url,
    } : null,
    
    // Relations - Partner
    partner: contribution.partner?.contacts ? {
      id: contribution.partner.id,
      name: partnerName,
    } : null,
    
    // Relations - Other entity types (null for partner contributions)
    client: null,
    material: null,
    personnel: null,
    indirect: null,
    subcontract: null,
    general_cost: null,
  };
}

/**
 * Transforms a partner_withdrawals record into a unified FinancialMovement.
 * Partner withdrawals are capital removals (egresos).
 * 
 * @param withdrawal - Partner withdrawal with all relations
 * @returns Unified financial movement
 */
export function mapPartnerWithdrawalToFinancialMovement(
  withdrawal: PartnerWithdrawalWithRelations
): FinancialMovementWithRelations {
  // Extract partner name for category (prioritize full_name)
  const partnerContact = withdrawal.partner?.contacts;
  const partnerName = partnerContact?.full_name ||
    (partnerContact?.first_name && partnerContact?.last_name
      ? `${partnerContact.first_name} ${partnerContact.last_name}`
      : null) ||
    partnerContact?.company_name || 
    partnerContact?.email || 
    'Sin socio';
  
  // Build description from notes or reference
  const description = withdrawal.notes || 
                      withdrawal.reference || 
                      `Retiro de ${partnerName}`;
  
  return {
    // Core fields
    id: withdrawal.id,
    organization_id: withdrawal.organization_id,
    project_id: withdrawal.project_id,
    
    // Payment details (negative for withdrawals)
    amount: -withdrawal.amount,
    currency_id: withdrawal.currency_id,
    exchange_rate: withdrawal.exchange_rate,
    payment_date: withdrawal.withdrawal_date,
    
    // Description and reference
    description,
    notes: withdrawal.notes,
    reference: withdrawal.reference,
    
    // Payment metadata
    wallet_id: withdrawal.wallet_id,
    status: withdrawal.status,
    file_url: withdrawal.file_url,
    
    // Audit fields
    created_by: withdrawal.created_by,
    created_at: withdrawal.created_at,
    updated_at: withdrawal.updated_at,
    
    // Movement classification
    movement_type: 'partner_withdrawal',
    movement_category: partnerName,
    movement_subcategory: 'Retiro de Capital',
    
    // Entity-specific fields (only partner_id populated)
    client_id: null,
    material_id: null,
    personnel_id: null,
    indirect_id: null,
    subcontract_id: null,
    general_cost_id: null,
    partner_id: withdrawal.partner_id,
    
    // Relations - Project
    project: withdrawal.project ? {
      id: withdrawal.project.id,
      name: withdrawal.project.name,
      code: withdrawal.project.code,
      color: withdrawal.project.color,
    } : null,
    
    // Relations - Currency
    currency: withdrawal.currency ? {
      id: withdrawal.currency.id,
      code: withdrawal.currency.code,
      symbol: withdrawal.currency.symbol || '',
      name: withdrawal.currency.name,
    } : null,
    
    // Relations - Wallet
    wallet: withdrawal.wallet?.wallets ? {
      id: withdrawal.wallet.wallets.id,
      name: withdrawal.wallet.wallets.name,
    } : null,
    
    // Relations - Creator
    creator: withdrawal.creator ? {
      id: withdrawal.creator.id,
      email: withdrawal.creator.email,
      full_name: withdrawal.creator.full_name,
      avatar_url: withdrawal.creator.avatar_url,
    } : null,
    
    // Relations - Partner
    partner: withdrawal.partner?.contacts ? {
      id: withdrawal.partner.id,
      name: partnerName,
    } : null,
    
    // Relations - Other entity types (null for partner withdrawals)
    client: null,
    material: null,
    personnel: null,
    indirect: null,
    subcontract: null,
    general_cost: null,
  };
}

/**
 * Maps an array of partner contributions to financial movements.
 * 
 * @param contributions - Array of partner contributions with relations
 * @returns Array of unified financial movements
 */
export function mapPartnerContributionsToFinancialMovements(
  contributions: PartnerContributionWithRelations[]
): FinancialMovementWithRelations[] {
  return contributions.map(mapPartnerContributionToFinancialMovement);
}

/**
 * Maps an array of partner withdrawals to financial movements.
 * 
 * @param withdrawals - Array of partner withdrawals with relations
 * @returns Array of unified financial movements
 */
export function mapPartnerWithdrawalsToFinancialMovements(
  withdrawals: PartnerWithdrawalWithRelations[]
): FinancialMovementWithRelations[] {
  return withdrawals.map(mapPartnerWithdrawalToFinancialMovement);
}

/**
 * Transforms a material_payments record into a unified FinancialMovement.
 * Material payments are expenses (egresos).
 * 
 * @param payment - Material payment with all relations
 * @returns Unified financial movement
 */
export function mapMaterialPaymentToFinancialMovement(
  payment: MaterialPaymentWithRelations
): FinancialMovementWithRelations {
  const description = payment.notes || 
                      payment.reference || 
                      'Pago de materiales';
  
  return {
    id: payment.id,
    organization_id: payment.organization_id,
    project_id: payment.project_id,
    
    amount: -payment.amount,
    currency_id: payment.currency_id,
    exchange_rate: payment.exchange_rate ?? 1,
    payment_date: payment.payment_date,
    
    description,
    notes: payment.notes,
    reference: payment.reference,
    
    wallet_id: payment.wallet_id,
    status: payment.status,
    file_url: payment.attachments?.[0]?.file_url || null,
    
    created_by: payment.created_by,
    created_at: payment.created_at,
    updated_at: payment.updated_at,
    
    movement_type: 'material_payment',
    movement_category: 'Materiales',
    movement_subcategory: null,
    
    client_id: null,
    material_id: payment.purchase_id,
    personnel_id: null,
    indirect_id: null,
    subcontract_id: null,
    general_cost_id: null,
    partner_id: null,
    
    project: payment.project ? {
      id: payment.project.id,
      name: payment.project.name,
      code: payment.project.code || null,
      color: payment.project.color,
    } : null,
    
    currency: payment.currency ? {
      id: payment.currency.id,
      code: payment.currency.code,
      symbol: payment.currency.symbol || '',
      name: payment.currency.name,
    } : null,
    
    wallet: payment.wallet?.wallets ? {
      id: payment.wallet.wallets.id,
      name: payment.wallet.wallets.name,
    } : null,
    
    creator: payment.creator ? {
      id: payment.creator.id,
      email: payment.creator.email,
      full_name: payment.creator.full_name,
      avatar_url: payment.creator.avatar_url,
    } : null,
    
    client: null,
    material: null,
    personnel: null,
    indirect: null,
    subcontract: null,
    general_cost: null,
    partner: null,
  };
}

/**
 * Maps an array of material payments to financial movements.
 */
export function mapMaterialPaymentsToFinancialMovements(
  payments: MaterialPaymentWithRelations[]
): FinancialMovementWithRelations[] {
  return payments.map(mapMaterialPaymentToFinancialMovement);
}

/**
 * Transforms a personnel_payments record into a unified FinancialMovement.
 * Personnel payments are expenses (egresos).
 * 
 * @param payment - Personnel payment with all relations
 * @returns Unified financial movement
 */
export function mapPersonnelPaymentToFinancialMovement(
  payment: PersonnelPaymentWithRelations
): FinancialMovementWithRelations {
  const personnelName = payment.personnel?.contact?.full_name || 
                        (payment.personnel?.contact?.first_name && payment.personnel?.contact?.last_name 
                          ? `${payment.personnel.contact.first_name} ${payment.personnel.contact.last_name}` 
                          : null) ||
                        'Sin personal';
  
  const description = payment.notes || 
                      payment.reference || 
                      `Pago a ${personnelName}`;
  
  return {
    id: payment.id,
    organization_id: payment.organization_id,
    project_id: payment.project_id,
    
    amount: -payment.amount,
    currency_id: payment.currency_id,
    exchange_rate: payment.exchange_rate ?? 1,
    payment_date: payment.payment_date,
    
    description,
    notes: payment.notes,
    reference: payment.reference,
    
    wallet_id: payment.wallet_id,
    status: payment.status,
    file_url: null,
    
    created_by: payment.created_by,
    created_at: payment.created_at,
    updated_at: payment.updated_at,
    
    movement_type: 'personnel_payment',
    movement_category: personnelName,
    movement_subcategory: 'Mano de Obra',
    
    client_id: null,
    material_id: null,
    personnel_id: payment.personnel_id,
    indirect_id: null,
    subcontract_id: null,
    general_cost_id: null,
    partner_id: null,
    
    project: payment.project ? {
      id: payment.project.id,
      name: payment.project.name,
      code: null,
      color: payment.project.color,
    } : null,
    
    currency: payment.currency ? {
      id: payment.currency.id,
      code: payment.currency.code,
      symbol: payment.currency.symbol || '',
      name: payment.currency.code,
    } : null,
    
    wallet: payment.wallet?.wallets ? {
      id: payment.wallet.wallets.id,
      name: payment.wallet.wallets.name,
    } : null,
    
    creator: null,
    
    client: null,
    material: null,
    personnel: payment.personnel ? {
      id: payment.personnel.id,
      name: personnelName,
    } : null,
    indirect: null,
    subcontract: null,
    general_cost: null,
    partner: null,
  };
}

/**
 * Maps an array of personnel payments to financial movements.
 */
export function mapPersonnelPaymentsToFinancialMovements(
  payments: PersonnelPaymentWithRelations[]
): FinancialMovementWithRelations[] {
  return payments.map(mapPersonnelPaymentToFinancialMovement);
}

/**
 * Transforms a general_costs_payments record into a unified FinancialMovement.
 * General cost payments are organization-level expenses (egresos).
 * 
 * @param payment - General cost payment with all relations
 * @returns Unified financial movement
 */
export function mapGeneralCostPaymentToFinancialMovement(
  payment: GeneralCostPayment
): FinancialMovementWithRelations {
  const generalCostName = payment.general_cost?.name || 'Gasto general';
  
  const description = payment.notes || 
                      payment.reference || 
                      `Pago: ${generalCostName}`;
  
  return {
    id: payment.id,
    organization_id: payment.organization_id,
    project_id: null,
    
    amount: -payment.amount,
    currency_id: payment.currency_id,
    exchange_rate: payment.exchange_rate ?? 1,
    payment_date: payment.payment_date,
    
    description,
    notes: payment.notes,
    reference: payment.reference,
    
    wallet_id: payment.wallet_id,
    status: payment.status,
    file_url: null,
    
    created_by: payment.created_by,
    created_at: payment.created_at,
    updated_at: payment.updated_at || payment.created_at,
    
    movement_type: 'general_cost_payment',
    movement_category: generalCostName,
    movement_subcategory: 'Gastos Generales',
    
    client_id: null,
    material_id: null,
    personnel_id: null,
    indirect_id: null,
    subcontract_id: null,
    general_cost_id: payment.general_cost_id,
    partner_id: null,
    
    project: null,
    
    currency: payment.currency ? {
      id: payment.currency.id,
      code: payment.currency.code,
      symbol: payment.currency.symbol || '',
      name: payment.currency.name,
    } : null,
    
    wallet: payment.wallet?.wallets ? {
      id: payment.wallet.wallets.id,
      name: payment.wallet.wallets.name,
    } : null,
    
    creator: payment.creator?.users ? {
      id: payment.creator.users.id,
      email: '',
      full_name: payment.creator.users.full_name,
      avatar_url: payment.creator.users.avatar_url,
    } : null,
    
    client: null,
    material: null,
    personnel: null,
    indirect: null,
    subcontract: null,
    general_cost: payment.general_cost ? {
      id: payment.general_cost.id,
      name: payment.general_cost.name,
    } : null,
    partner: null,
  };
}

/**
 * Maps an array of general cost payments to financial movements.
 */
export function mapGeneralCostPaymentsToFinancialMovements(
  payments: GeneralCostPayment[]
): FinancialMovementWithRelations[] {
  return payments.map(mapGeneralCostPaymentToFinancialMovement);
}

/**
 * Transforms a legacy movements record into a unified FinancialMovement.
 * Legacy movements include subcontracts and indirect costs.
 * 
 * @param movement - Legacy movement with all relations
 * @returns Unified financial movement
 */
export function mapLegacyMovementToFinancialMovement(
  movement: LegacyMovementWithRelations
): FinancialMovementWithRelations {
  const typeName = movement.movement_types?.name || 'Movimiento';
  const categoryName = movement.movement_categories?.name || null;
  const subcategoryName = movement.movement_subcategories?.name || null;
  
  let movementType = 'legacy_movement';
  if (movement.subcontract) {
    movementType = 'subcontract_payment';
  } else if (movement.indirect_id) {
    movementType = 'indirect_payment';
  } else if (movement.general_cost_id) {
    movementType = 'general_cost_legacy';
  }
  
  return {
    id: movement.id,
    organization_id: movement.organization_id,
    project_id: movement.project_id,
    
    amount: movement.amount,
    currency_id: movement.currency_id,
    exchange_rate: movement.exchange_rate ?? 1,
    payment_date: movement.movement_date,
    
    description: movement.description,
    notes: null,
    reference: null,
    
    wallet_id: movement.wallet_id,
    status: 'confirmed',
    file_url: null,
    
    created_by: movement.created_by,
    created_at: movement.created_at,
    updated_at: movement.created_at,
    
    movement_type: movementType,
    movement_category: categoryName,
    movement_subcategory: subcategoryName,
    
    client_id: null,
    material_id: null,
    personnel_id: null,
    indirect_id: movement.indirect_id || null,
    subcontract_id: movement.subcontract || null,
    general_cost_id: movement.general_cost_id || null,
    partner_id: movement.partner || null,
    
    project: movement.projects ? {
      id: movement.project_id,
      name: movement.projects.name,
      code: movement.projects.code || null,
      color: movement.projects.color,
    } : null,
    
    currency: movement.currencies ? {
      id: movement.currencies.id,
      code: movement.currencies.code,
      symbol: movement.currencies.symbol || '',
      name: movement.currencies.name,
    } : null,
    
    wallet: movement.organization_wallets?.wallets ? {
      id: movement.organization_wallets.wallets.id,
      name: movement.organization_wallets.wallets.name,
    } : null,
    
    creator: movement.profiles ? {
      id: movement.created_by,
      email: '',
      full_name: movement.profiles.full_name || null,
      avatar_url: movement.profiles.avatar_url || null,
    } : null,
    
    client: null,
    material: null,
    personnel: null,
    indirect: movement.indirect_costs ? {
      id: movement.indirect_costs.id,
      name: movement.indirect_costs.name,
    } : null,
    subcontract: movement.subcontract ? {
      id: movement.subcontract,
      name: movement.subcontract,
    } : null,
    general_cost: null,
    partner: movement.partner ? {
      id: movement.partner,
      name: movement.partner,
    } : null,
  };
}

/**
 * Maps an array of legacy movements to financial movements.
 */
export function mapLegacyMovementsToFinancialMovements(
  movements: LegacyMovementWithRelations[]
): FinancialMovementWithRelations[] {
  return movements.map(mapLegacyMovementToFinancialMovement);
}
