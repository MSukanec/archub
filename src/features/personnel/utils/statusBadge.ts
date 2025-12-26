import type { BadgeVariant } from '@/components/ui/badge';

export type PersonnelPaymentStatus = 'confirmed' | 'pending' | 'rejected' | 'void';

export interface StatusBadgeConfig {
  label: string;
  variant: BadgeVariant;
  className: string;
}

export function getPersonnelPaymentStatusBadgeConfig(status: PersonnelPaymentStatus): StatusBadgeConfig {
  const statusConfig: Record<PersonnelPaymentStatus, StatusBadgeConfig> = {
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
