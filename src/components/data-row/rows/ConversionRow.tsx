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

  // Props para DataRowCard
  const dataRowProps: DataRowCardProps = {
    // Content
    title: 'Conversión',
    subtitle: `${conversion.from_currency} - ${conversion.to_currency}`,
    
    // Leading
    avatarFallback: 'C',
    
    // Trailing - Importes de conversión
    lines: [
      {
        text: `$${fromAmountFormatted} → $${toAmountFormatted}`,
        tone: 'info' as const,
        mono: true
      },
      {
        text: `${conversion.from_currency} → ${conversion.to_currency}`,
        tone: 'muted' as const
      }
    ],
    
    // Visual - azul para conversiones
    borderColor: 'info',
    
    // Trailing  
    showChevron: !!onClick,
    
    // Behavior
    onClick,
    selected,
    density,
    className,
    'data-testid': `conversion-row-${conversion.id}`
  };

  return <DataRowCard {...dataRowProps} />;
}

// Export del tipo para uso externo
export type { ConversionGroup };