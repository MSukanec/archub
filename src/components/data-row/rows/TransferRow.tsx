import DataRowCard, { DataRowCardProps } from '../DataRowCard';

interface TransferGroup {
  id: string;
  transfer_group_id: string;
  movements: any[];
  from_wallet: string;
  to_wallet: string;
  amount: number;
  description: string;
  movement_date: string;
  created_at: string;
  creator?: {
    id: string;
    full_name?: string;
    email: string;
    avatar_url?: string;
  };
  is_transfer_group: true;
}

interface TransferRowProps {
  transfer: TransferGroup;
  onClick?: () => void;
  selected?: boolean;
  density?: 'compact' | 'normal' | 'comfortable';
  className?: string;
}

export default function TransferRow({ 
  transfer, 
  onClick, 
  selected, 
  density = 'normal',
  className 
}: TransferRowProps) {
  
  // Formatear importe
  const amountFormatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(transfer.amount));

  // Obtener avatar del creador
  const getCreatorAvatar = () => {
    if (transfer.creator?.avatar_url) {
      return transfer.creator.avatar_url;
    }
    return undefined;
  };

  const getCreatorInitials = () => {
    if (transfer.creator?.full_name) {
      return transfer.creator.full_name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return 'U';
  };

  // Props para DataRowCard
  const dataRowProps: DataRowCardProps = {
    // Content
    title: 'Transferencia',
    subtitle: `${transfer.from_wallet} → ${transfer.to_wallet}`,
    
    // Leading - Avatar del usuario creador
    avatarUrl: getCreatorAvatar(),
    avatarFallback: getCreatorInitials(),
    
    // Trailing - Importe y billeteras
    lines: [
      {
        text: `$${amountFormatted}`,
        tone: 'neutral' as const,
        mono: true
      },
      {
        text: `${transfer.from_wallet} → ${transfer.to_wallet}`,
        tone: 'muted' as const
      }
    ],
    
    // Visual - amarillo para transferencias
    borderColor: 'warning',
    
    // Trailing  
    showChevron: !!onClick,
    
    // Behavior
    onClick,
    selected,
    density,
    className,
    'data-testid': `transfer-row-${transfer.id}`
  };

  return <DataRowCard {...dataRowProps} />;
}

// Export del tipo para uso externo
export type { TransferGroup };