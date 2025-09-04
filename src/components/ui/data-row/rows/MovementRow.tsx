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
  
  // Datos específicos de la vista movements_view
  partner?: string;
  subcontract?: string;
  client?: string;
  member?: string;
  indirect?: string;
  general_cost?: string;
  
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

// Helper para obtener el texto de la tercera línea específica
const getSpecificThirdLine = (movement: Movement): string | null => {
  // Para categoría "Indirectos", priorizar el tipo de indirecto sobre el miembro
  const categoryName = movement.movement_data?.category?.name?.toLowerCase() || '';
  
  if (categoryName.includes('indirecto') && movement.indirect) {
    return movement.indirect;
  }
  
  // Para categoría "Gastos Generales", priorizar el gasto general
  if (categoryName.includes('general') && movement.general_cost) {
    return movement.general_cost;
  }
  
  // Prioridad normal: partner -> subcontract -> client -> indirect -> general_cost -> member
  if (movement.partner) {
    return movement.partner;
  }
  
  if (movement.subcontract) {
    return movement.subcontract;
  }
  
  if (movement.client) {
    return movement.client;
  }
  
  if (movement.indirect) {
    return movement.indirect;
  }
  
  if (movement.general_cost) {
    return movement.general_cost;
  }
  
  if (movement.member) {
    return movement.member;
  }
  
  return null;
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
  const getBorderColor = (movement: Movement): 'success' | 'danger' => {
    const typeName = movement.movement_data?.type?.name?.toLowerCase() || '';
    const categoryName = movement.movement_data?.category?.name?.toLowerCase() || '';
    
    // Si es ingreso, color verde
    if (typeName.includes('ingreso') || categoryName.includes('ingreso')) {
      return 'success';
    }
    
    // Si es egreso o monto negativo, color rojo
    if (typeName.includes('egreso') || categoryName.includes('egreso') || movement.amount < 0) {
      return 'danger';
    }
    
    // Por defecto, si monto positivo, verde
    return movement.amount >= 0 ? 'success' : 'danger';
  };

  // Formatear importe para trailing
  const formattedAmount = formatMovementAmount(movement.amount, movement.movement_data?.currency?.symbol);
  const currencyCode = movement.movement_data?.currency?.code || 'ARS';

  // Obtener avatar del creador (como en la card vieja)
  const getCreatorAvatar = () => {
    // Si hay un campo creator en el movement
    if ((movement as any).creator?.avatar_url) {
      return (movement as any).creator.avatar_url;
    }
    return undefined;
  };

  const getCreatorInitials = () => {
    if ((movement as any).creator?.full_name) {
      return (movement as any).creator.full_name
        .split(' ')
        .map((word: string) => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return 'A';
  };

  // Obtener la información específica de la tercera línea
  const specificThirdLine = getSpecificThirdLine(movement);
  

  // Contenido interno del card
  const cardContent = (
    <>
      {/* Columna de contenido (medio) */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">
          {movement.movement_data?.category?.name || 'Sin categoría'}
        </div>
        {movement.movement_data?.subcategory?.name && (
          <div className="text-muted-foreground text-sm truncate">
            {movement.movement_data?.subcategory?.name}
          </div>
        )}
        {specificThirdLine && (
          <div className="text-muted-foreground text-sm truncate">
            {specificThirdLine}
          </div>
        )}
      </div>

      {/* Columna trailing (dos líneas) */}
      <div className="flex flex-col items-end flex-shrink-0">
        {/* Línea 1: Moneda y monto en dos columnas */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{currencyCode}</span>
          <span className={`font-mono text-sm font-bold ${
            getBorderColor(movement) === 'success' ? 'text-green-600' : 'text-red-600'
          }`}>
            {formattedAmount}
          </span>
        </div>
        
        {/* Línea 2: Billetera */}
        <div className="text-muted-foreground text-sm">
          {movement.movement_data?.wallet?.name || 'Sin billetera'}
        </div>
      </div>
    </>
  );

  return (
    <DataRowCard
      avatarUrl={getCreatorAvatar()}
      avatarFallback={getCreatorInitials()}
      borderColor={getBorderColor(movement)}
      onClick={onClick}
      selected={selected}
      density={density}
      className={className}
      data-testid={`movement-row-${movement.id}`}
    >
      {cardContent}
    </DataRowCard>
  );
}

// Export del tipo para uso externo
export type { Movement };