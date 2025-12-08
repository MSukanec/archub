export type PersonnelPaymentStatus = 'confirmed' | 'pending' | 'rejected' | 'void';

export interface StatusBadgeConfig {
  label: string;
  variant: 'default' | 'secondary' | 'destructive' | 'outline';
  className: string;
}

export function getPersonnelPaymentStatusBadgeConfig(status: PersonnelPaymentStatus): StatusBadgeConfig {
  const statusConfig: Record<PersonnelPaymentStatus, StatusBadgeConfig> = {
    confirmed: { 
      label: 'Confirmado', 
      variant: 'default', 
      className: 'bg-green-500/10 text-green-700 dark:text-green-400 hover:bg-green-500/20 border-green-500/20' 
    },
    pending: { 
      label: 'Pendiente', 
      variant: 'secondary', 
      className: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 hover:bg-orange-500/20 border-orange-500/20' 
    },
    rejected: { 
      label: 'Rechazado', 
      variant: 'destructive', 
      className: '' 
    },
    void: { 
      label: 'Anulado', 
      variant: 'outline', 
      className: 'bg-muted/50 text-muted-foreground' 
    },
  };
  
  return statusConfig[status];
}
