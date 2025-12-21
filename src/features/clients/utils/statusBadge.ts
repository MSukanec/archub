/**
 * Shared utility for client payment status badge styling
 * 
 * Maps payment status to semantic Badge variant
 * Supports light/dark mode via CSS tokens
 */

export type ClientPaymentStatus = 'confirmed' | 'pending' | 'rejected' | 'void';

export interface StatusBadgeConfig {
  label: string;
  variant: 'success' | 'pending' | 'error' | 'neutral';
  className: string;
}

/**
 * Get badge configuration for a client payment status
 * 
 * @param status - The payment status
 * @returns Configuration object with label, variant, and className
 */
export function getClientPaymentStatusBadgeConfig(status: ClientPaymentStatus): StatusBadgeConfig {
  const statusConfig: Record<ClientPaymentStatus, StatusBadgeConfig> = {
    confirmed: { 
      label: 'Confirmado', 
      variant: 'success', 
      className: '' 
    },
    pending: { 
      label: 'Pendiente', 
      variant: 'pending', 
      className: '' 
    },
    rejected: { 
      label: 'Rechazado', 
      variant: 'error', 
      className: '' 
    },
    void: { 
      label: 'Anulado', 
      variant: 'neutral', 
      className: '' 
    },
  };
  
  return statusConfig[status];
}
