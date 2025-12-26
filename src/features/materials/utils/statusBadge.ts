/**
 * Shared utility for material payment status badge styling
 * 
 * Maps payment status to semantic Badge variant
 * Uses the design system's semantic color tokens
 */
import type { BadgeVariant } from '@/components/ui/badge';

export type MaterialPaymentStatus = 'confirmed' | 'pending' | 'rejected' | 'void';

export interface StatusBadgeConfig {
  label: string;
  variant: BadgeVariant;
  className: string;
}

/**
 * Get badge configuration for a material payment status
 * 
 * @param status - The payment status
 * @returns Configuration object with label, variant, and className
 */
export function getMaterialPaymentStatusBadgeConfig(status: MaterialPaymentStatus): StatusBadgeConfig {
  const statusConfig: Record<MaterialPaymentStatus, StatusBadgeConfig> = {
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
