import DataRowCard from '@/components/shared/DataRowCard';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Interface para general cost payment
interface GeneralCostPayment {
  id: string;
  organization_id: string;
  amount: number;
  currency_id: string;
  exchange_rate: number | null;
  payment_date: string;
  notes: string | null;
  reference: string | null;
  created_at: string;
  updated_at: string | null;
  wallet_id: string | null;
  general_cost_id: string | null;
  status: 'confirmed' | 'pending' | 'rejected' | 'void';
  created_by: string | null;
  file_url?: string | null;
  
  // Datos expandidos
  general_cost?: {
    id: string;
    name: string;
    description: string | null;
    category_id?: string | null;
    category?: {
      id: string;
      name: string;
    } | null;
  } | null;
  currency?: {
    id: string;
    code: string;
    symbol: string;
    name: string;
  } | null;
  wallet?: {
    id: string;
    organization_id: string;
    wallet_id: string;
    is_active: boolean;
    is_default: boolean;
    wallets: {
      id: string;
      name: string;
      is_active: boolean;
    } | null;
  } | null;
  creator?: {
    id: string;
    users?: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
}

interface GeneralCostPaymentRowProps {
  payment: GeneralCostPayment;
  onClick?: () => void;
  selected?: boolean;
  density?: 'compact' | 'normal' | 'comfortable';
  className?: string;
}

// Helper para formatear el monto de pago
const formatPaymentAmount = (amount: number, currencySymbol?: string): string => {
  const formattedAmount = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount));
  
  const symbol = currencySymbol || '$';
  return `${symbol}${formattedAmount}`;
};

// Helper para obtener el nombre del gasto general
const getGeneralCostName = (payment: GeneralCostPayment): string => {
  if (!payment.general_cost) return 'Sin asignar';
  return payment.general_cost.name;
};

// Helper para obtener las iniciales del gasto general
const getGeneralCostInitials = (payment: GeneralCostPayment): string => {
  if (!payment.general_cost) return 'GG';
  
  const name = payment.general_cost.name;
  const words = name.split(' ').filter(w => w.length > 0);
  
  if (words.length >= 2) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }
  
  return name.slice(0, 2).toUpperCase();
};

export default function GeneralCostPaymentRow({ 
  payment, 
  onClick, 
  selected, 
  density = 'normal',
  className 
}: GeneralCostPaymentRowProps) {
  
  // Determinar el color del borde basado en el estado del pago
  const getBorderColor = (payment: GeneralCostPayment): 'success' | 'warning' | 'danger' | 'neutral' => {
    switch (payment.status) {
      case 'confirmed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'rejected':
      case 'void':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  // Formatear importe para trailing
  const formattedAmount = formatPaymentAmount(payment.amount, payment.currency?.symbol);
  const currencyCode = payment.currency?.code || 'ARS';

  // Obtener avatar del creador
  const getCreatorAvatar = () => {
    return payment.creator?.users?.avatar_url;
  };

  // Formatear fecha de pago
  const formatPaymentDate = (dateString: string): string => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
    } catch {
      return '-';
    }
  };

  // Obtener el estado formateado
  const getStatusLabel = (status: string): string => {
    const statusMap: Record<string, string> = {
      confirmed: 'Confirmado',
      pending: 'Pendiente',
      rejected: 'Rechazado',
      void: 'Anulado'
    };
    return statusMap[status] || status;
  };

  // Contenido interno del card
  const cardContent = (
    <>
      {/* Columna de contenido (medio) */}
      <div className="flex-1 min-w-0">
        {/* Línea 1: Nombre del gasto general */}
        <div className="font-semibold text-sm truncate">
          {getGeneralCostName(payment)}
        </div>
        {/* Línea 2: Categoría */}
        <div className="text-muted-foreground text-sm truncate">
          {payment.general_cost?.category?.name || 'Sin categoría'}
        </div>
        {/* Línea 3: Fecha de pago */}
        <div className="text-muted-foreground text-sm truncate">
          {formatPaymentDate(payment.payment_date)}
        </div>
      </div>

      {/* Columna trailing (dos líneas) */}
      <div className="flex flex-col items-end flex-shrink-0">
        {/* Línea 1: Moneda y monto */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{currencyCode}</span>
          <span className="font-mono text-sm font-bold text-red-600">
            {formattedAmount}
          </span>
        </div>
        
        {/* Línea 2: Estado */}
        <div className={`text-sm font-medium ${
          payment.status === 'confirmed' ? 'text-green-600' :
          payment.status === 'pending' ? 'text-orange-600' :
          payment.status === 'rejected' || payment.status === 'void' ? 'text-red-600' :
          'text-muted-foreground'
        }`}>
          {getStatusLabel(payment.status)}
        </div>
      </div>
    </>
  );

  return (
    <DataRowCard
      avatarUrl={getCreatorAvatar() || undefined}
      avatarFallback={getGeneralCostInitials(payment)}
      borderColor={getBorderColor(payment)}
      onClick={onClick}
      selected={selected}
      density={density}
      className={className}
      data-testid={`general-cost-payment-row-${payment.id}`}
    >
      {cardContent}
    </DataRowCard>
  );
}

// Export del tipo para uso externo
export type { GeneralCostPayment };
