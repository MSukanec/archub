import type { ClientPaymentWithRelations } from '@/features/clients/types';
import type { FinancialMovementWithRelations } from '../types';
import type { PartnerContributionWithRelations } from '../services/getPartnerContributions';
import type { PartnerWithdrawalWithRelations } from '../services/getPartnerWithdrawals';

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
    exchange_rate: clientPayment.exchange_rate,
    payment_date: clientPayment.payment_date,
    
    // Description and reference
    description,
    notes: clientPayment.notes,
    reference: clientPayment.reference,
    
    // Payment metadata
    wallet_id: clientPayment.wallet_id,
    status: clientPayment.status,
    file_url: clientPayment.file_url,
    
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
  // Extract partner name for category
  const partnerContact = contribution.partner?.contacts;
  const partnerName = partnerContact?.first_name && partnerContact?.last_name
    ? `${partnerContact.first_name} ${partnerContact.last_name}`
    : partnerContact?.company_name || 'Sin socio';
  
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
  // Extract partner name for category
  const partnerContact = withdrawal.partner?.contacts;
  const partnerName = partnerContact?.first_name && partnerContact?.last_name
    ? `${partnerContact.first_name} ${partnerContact.last_name}`
    : partnerContact?.company_name || 'Sin socio';
  
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
