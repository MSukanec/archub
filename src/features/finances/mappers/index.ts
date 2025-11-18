import type { ClientPaymentWithRelations } from '@/features/clients/types';
import type { FinancialMovementWithRelations } from '../types';

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
    
    // Relations - Project (note: project relation not included in client_payments, will be null)
    project: null, // TODO: Fetch project data separately or use a database view
    
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
    
    // Relations - Creator (note: creator relation not included in client_payments, will be null)
    creator: null, // TODO: Fetch creator data separately or use a database view
    
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
