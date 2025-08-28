import DataRowCard, { DataRowCardProps } from '../DataRowCard';

interface ConversionGroup {
  id: string;
  conversion_group_id: string;
  movements: any[];
  from_currency: string;
  to_currency: string;
  from_amount: number;
  to_amount: number;
  description: string;
  movement_date: string;
  created_at: string;
  creator?: {
    id: string;
    full_name?: string;
    email: string;
    avatar_url?: string;
  };
  is_conversion_group: true;
}

interface ConversionRowProps {
  conversion: ConversionGroup;
  onClick?: () => void;
  selected?: boolean;
  density?: 'compact' | 'normal' | 'comfortable';
  className?: string;
}

export default function ConversionRow({ 
  conversion, 
  onClick, 
  selected, 
  density = 'normal',
  className 
}: ConversionRowProps) {
  
  // Formatear importes
  const fromAmountFormatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(conversion.from_amount));

  const toAmountFormatted = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(conversion.to_amount));

  // Obtener avatar del creador
  const getCreatorAvatar = () => {
    if (conversion.creator?.avatar_url) {
      return conversion.creator.avatar_url;
    }
    return undefined;
  };

  const getCreatorInitials = () => {
    if (conversion.creator?.full_name) {
      return conversion.creator.full_name
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
          Conversión
        </div>
        <div className="text-muted-foreground text-sm truncate">
          {conversion.from_currency} - {conversion.to_currency}
        </div>
      </div>

      {/* Columna trailing */}
      <div className="flex flex-col items-end flex-shrink-0">
        {/* Línea 1: Importes de conversión */}
        <div className="text-blue-600 font-mono text-sm font-medium">
          ${fromAmountFormatted} → ${toAmountFormatted}
        </div>
        
        {/* Línea 2: Monedas */}
        <div className="text-muted-foreground text-sm">
          {conversion.from_currency} → {conversion.to_currency}
        </div>
      </div>
    </>
  );

  return (
    <DataRowCard
      avatarUrl={getCreatorAvatar()}
      avatarFallback={getCreatorInitials()}
      borderColor="info"
      onClick={onClick}
      selected={selected}
      density={density}
      className={className}
      data-testid={`conversion-row-${conversion.id}`}
    >
      {cardContent}
    </DataRowCard>
  );
}

// Export del tipo para uso externo
export type { ConversionGroup };