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

  // Contenido interno del card
  const cardContent = (
    <>
      {/* Columna de contenido (medio) */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">
          Transferencia
        </div>
        <div className="text-muted-foreground text-sm truncate">
          {transfer.from_wallet} → {transfer.to_wallet}
        </div>
      </div>

      {/* Columna trailing */}
      <div className="flex flex-col items-end flex-shrink-0">
        {/* Línea 1: Importe */}
        <div className="font-mono text-sm font-medium">
          ${amountFormatted}
        </div>
        
        {/* Línea 2: Billeteras */}
        <div className="text-muted-foreground text-sm">
          {transfer.from_wallet} → {transfer.to_wallet}
        </div>
      </div>
    </>
  );

  return (
    <DataRowCard
      avatarUrl={getCreatorAvatar()}
      avatarFallback={getCreatorInitials()}
      borderColor="warning"
      onClick={onClick}
      selected={selected}
      density={density}
      className={className}
      data-testid={`transfer-row-${transfer.id}`}
    >
      {cardContent}
    </DataRowCard>
  );
}

// Export del tipo para uso externo
export type { TransferGroup };