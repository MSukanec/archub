/**
 * Partner transaction status badge styling
 * 
 * Uses semantic Badge variants for proper color application
 */
export type PartnerTransactionStatus = 'confirmed'| 'pending'| 'rejected'| 'void';
export interface PartnerStatusBadgeConfig {
  label: string;
  variant: 'success'| 'warning'| 'error'| 'neutral';
}
/**
 * Get badge configuration for a partner transaction status
 * 
 * @param status - The transaction status
 * @returns Configuration object with label and semantic variant
 */
export function getPartnerTransactionStatusBadgeConfig(status: PartnerTransactionStatus): PartnerStatusBadgeConfig {
  const statusConfig: Record<PartnerTransactionStatus, PartnerStatusBadgeConfig> = {
    confirmed: { label: 'Confirmado', variant: 'success'},
    pending: { label: 'Pendiente', variant: 'warning'},
    rejected: { label: 'Rechazado', variant: 'error'},
    void: { label: 'Anulado', variant: 'neutral'},
  };
  
  return statusConfig[status] || { label: status, variant: 'neutral'};
}
