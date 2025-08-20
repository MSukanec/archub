import DataRowCard, { DataRowCardProps } from '../DataRowCard';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Interface para el movimiento (usando la estructura real de la app)
interface Movement {
  id: string;
  description: string;
  amount: number;
  exchange_rate?: number;
  created_at: string;
  movement_date: string;
  created_by: string;
  organization_id: string;
  project_id: string;
  concept_id?: string;
  wallet_id?: string;
  currency_id?: string;
  is_favorite?: boolean;
  
  // Estructura real de movement_data
  movement_data?: {
    type?: {
      name: string;
    };
    category?: {
      name: string;
    };
    subcategory?: {
      name: string;
    };
    wallet?: {
      name: string;
    };
    currency?: {
      symbol: string;
      name: string;
      code: string;
    };
  };
  
  // Proyecto expandido
  project?: {
    name: string;
  };
}

interface MovementRowProps {
  movement: Movement;
  onClick?: () => void;
  selected?: boolean;
  density?: 'compact' | 'normal' | 'comfortable';
  showProject?: boolean;  // Para mostrar proyecto cuando no hay filtro activo
  className?: string;
}

// Helper para formatear el importe con signo
const formatMovementAmount = (amount: number, currencySymbol?: string): string => {
  const formattedAmount = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  
  const sign = amount >= 0 ? '+' : '-';
  const symbol = currencySymbol || '$';
  
  return `${sign}${symbol}${formattedAmount}`;
};

// Helper para obtener las iniciales del concepto/categoría
const getConceptInitials = (movement: Movement): string => {
  const category = movement.movement_data?.category?.name;
  const subcategory = movement.movement_data?.subcategory?.name;
  
  if (category && subcategory) {
    const categoryInitial = category[0]?.toUpperCase() || '';
    const subcategoryInitial = subcategory[0]?.toUpperCase() || '';
    return categoryInitial + subcategoryInitial;
  }
  
  if (category) {
    const words = category.split(' ');
    if (words.length > 1) {
      return words.slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
    }
    return category.slice(0, 2).toUpperCase();
  }
  
  return 'M';
};

// Helper para obtener el nombre completo del concepto
const getConceptFullName = (movement: Movement): string => {
  const category = movement.movement_data?.category?.name;
  const subcategory = movement.movement_data?.subcategory?.name;
  
  if (category && subcategory) {
    return `${category} • ${subcategory}`;
  }
  
  if (category) {
    return category;
  }
  
  return 'Sin categoría';
};

export default function MovementRow({ 
  movement, 
  onClick, 
  selected, 
  density = 'normal',
  showProject = false,
  className 
}: MovementRowProps) {
  
  // Determinar el color del borde basado en el tipo de movimiento
  const getBorderColor = (amount: number): 'success' | 'danger' => {
    return amount >= 0 ? 'success' : 'danger';
  };

  // Formatear importe para trailing
  const formattedAmount = formatMovementAmount(movement.amount, movement.movement_data?.currency?.symbol);
  const currencyCode = movement.movement_data?.currency?.code || 'ARS';

  // Props para DataRowCard
  const dataRowProps: DataRowCardProps = {
    // Content - Solo 2 filas como el viejo diseño
    title: movement.movement_data?.category?.name || 'Sin categoría',
    subtitle: movement.movement_data?.subcategory?.name || '',
    
    // Leading
    avatarFallback: getConceptInitials(movement),
    
    // Trailing - Importe y billetera
    lines: [
      {
        text: `${currencyCode} - ${formattedAmount}`,
        tone: movement.amount >= 0 ? 'success' as const : 'danger' as const,
        mono: true
      },
      {
        text: movement.movement_data?.wallet?.name || 'Sin billetera',
        tone: 'muted' as const
      }
    ],
    
    // Visual
    borderColor: getBorderColor(movement.amount),
    
    // Trailing  
    showChevron: !!onClick,
    
    // Behavior
    onClick,
    selected,
    density,
    className,
    'data-testid': `movement-row-${movement.id}`
  };

  return <DataRowCard {...dataRowProps} />;
}

// Export del tipo para uso externo
export type { Movement };