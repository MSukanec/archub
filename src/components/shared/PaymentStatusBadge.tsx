import { Badge, type BadgeVariant } from '@/components/ui/badge';

export type PaymentStatus = 'confirmed' | 'pending' | 'rejected' | 'void';

interface PaymentStatusConfig {
  label: string;
  variant: BadgeVariant;
}

const STATUS_CONFIG: Record<PaymentStatus, PaymentStatusConfig> = {
  confirmed: { 
    label: 'Confirmado', 
    variant: 'success'
  },
  pending: { 
    label: 'Pendiente', 
    variant: 'pending'
  },
  rejected: { 
    label: 'Rechazado', 
    variant: 'error'
  },
  void: { 
    label: 'Anulado', 
    variant: 'neutral'
  },
};

interface PaymentStatusBadgeProps {
  status: PaymentStatus;
  className?: string;
  'data-testid'?: string;
}

export function PaymentStatusBadge({ 
  status, 
  className,
  'data-testid': testId 
}: PaymentStatusBadgeProps) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  
  return (
    <Badge 
      variant={config.variant} 
      className={className}
      data-testid={testId}
    >
      {config.label}
    </Badge>
  );
}

export function getPaymentStatusConfig(status: PaymentStatus): PaymentStatusConfig {
  return STATUS_CONFIG[status] || STATUS_CONFIG.pending;
}
