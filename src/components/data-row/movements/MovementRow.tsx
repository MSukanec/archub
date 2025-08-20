import DataRowCard, { DataRowCardProps } from '../DataRowCard';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Interface para el movimiento (basada en el tipo existente)
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
  
  // Relaciones expandidas
  concept?: {
    name: string;
    parent?: {
      name: string;
    };
  };
  wallet?: {
    name: string;
  };
  currency?: {
    symbol: string;
    name: string;
  };
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

// Helper para obtener las iniciales del concepto
const getConceptInitials = (concept?: Movement['concept']): string => {
  if (!concept) return 'M';
  
  // Si tiene padre, usar iniciales del padre + hijo
  if (concept.parent) {
    const parentInitial = concept.parent.name[0]?.toUpperCase() || '';
    const childInitial = concept.name[0]?.toUpperCase() || '';
    return parentInitial + childInitial;
  }
  
  // Solo concepto, tomar primeras dos letras o primera letra si es una palabra
  const words = concept.name.split(' ');
  if (words.length > 1) {
    return words.slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
  }
  
  return concept.name.slice(0, 2).toUpperCase();
};

// Helper para obtener el nombre completo del concepto
const getConceptFullName = (concept?: Movement['concept']): string => {
  if (!concept) return 'Sin categoría';
  
  if (concept.parent) {
    return `${concept.parent.name} • ${concept.name}`;
  }
  
  return concept.name;
};

export default function MovementRow({ 
  movement, 
  onClick, 
  selected, 
  density = 'normal',
  showProject = false,
  className 
}: MovementRowProps) {
  
  // Construir las líneas adicionales
  const lines = [
    // Línea 1: Importe con formato
    {
      text: formatMovementAmount(movement.amount, movement.currency?.symbol),
      tone: movement.amount >= 0 ? 'success' as const : 'danger' as const,
      mono: true,
      hintRight: movement.currency?.name || 'ARS'
    },
    // Línea 2: Billetera
    {
      text: movement.wallet?.name || 'Sin billetera',
      tone: 'muted' as const
    },
    // Línea 3: Proyecto (si se debe mostrar)
    ...(showProject && movement.project ? [{
      text: movement.project.name,
      tone: 'info' as const
    }] : [])
  ];

  // Props para DataRowCard
  const dataRowProps: DataRowCardProps = {
    // Content
    title: movement.description,
    subtitle: getConceptFullName(movement.concept),
    lines: lines.slice(0, 3), // Asegurar máximo 3 líneas
    
    // Leading
    avatarFallback: getConceptInitials(movement.concept),
    
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