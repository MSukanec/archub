/**
 * Partner transaction status badge styling
 * 
 * Uses CSS variables for dynamic color application (light/dark mode support)
 * Matches the pattern from GeneralCostPaymentRow for consistency
 */

export type PartnerTransactionStatus = 'confirmed' | 'pending' | 'rejected' | 'void';

export interface PartnerStatusBadgeConfig {
  label: string;
  colorVar: string;
}

/**
 * Get badge configuration for a partner transaction status
 * 
 * @param status - The transaction status
 * @returns Configuration object with label and CSS variable
 */
export function getPartnerTransactionStatusBadgeConfig(status: PartnerTransactionStatus): PartnerStatusBadgeConfig {
  const statusConfig: Record<PartnerTransactionStatus, PartnerStatusBadgeConfig> = {
    confirmed: { label: 'Confirmado', colorVar: '--badge-status-success' },
    pending: { label: 'Pendiente', colorVar: '--badge-status-warning' },
    rejected: { label: 'Rechazado', colorVar: '--badge-status-destructive' },
    void: { label: 'Anulado', colorVar: '--badge-status-neutral' },
  };
  
  return statusConfig[status] || { label: status, colorVar: '--badge-status-neutral' };
}
