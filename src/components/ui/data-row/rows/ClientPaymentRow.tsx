import DataRowCard from '../DataRowCard';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Interface para client payment
interface ClientPayment {
  id: string;
  payment_date: string;
  created_at: string;
  amount: number;
  exchange_rate: number;
  status: 'confirmed' | 'pending' | 'rejected' | 'void';
  reference: string | null;
  notes: string | null;
  file_url: string | null;
  client_id: string | null;
  wallet_id: string | null;
  currency_id: string;
  project_id: string;
  organization_id: string;
  
  // Datos expandidos
  project_client: {
    id: string;
    unit: string | null;
    contact: {
      id: string;
      first_name: string | null;
      last_name: string | null;
      full_name: string | null;
      email: string | null;
      phone?: string | null;
      company_name?: string | null;
      linked_user?: {
        id: string;
        avatar_url?: string;
      } | null;
    } | null;
  } | null;
  currency: {
    id: string;
    code: string;
    symbol: string;
  } | null;
  wallet: {
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
  projects?: {
    id: string;
    name: string;
    color: string;
  } | null;
}

interface ClientPaymentRowProps {
  payment: ClientPayment;
  onClick?: () => void;
  selected?: boolean;
  density?: 'compact' | 'normal' | 'comfortable';
  showProject?: boolean;
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

// Helper para obtener el nombre del cliente
const getClientName = (payment: ClientPayment): string => {
  const contact = payment.project_client?.contact;
  
  if (!contact) return 'Sin cliente';
  
  if (contact.company_name) {
    return contact.company_name;
  }
  
  if (contact.full_name) {
    return contact.full_name;
  }
  
  const firstName = contact.first_name || '';
  const lastName = contact.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim();
  
  return fullName || 'Sin nombre';
};

// Helper para obtener las iniciales del cliente
const getClientInitials = (payment: ClientPayment): string => {
  const contact = payment.project_client?.contact;
  
  if (!contact) return 'C';
  
  if (contact.first_name && contact.last_name) {
    return `${contact.first_name[0]}${contact.last_name[0]}`.toUpperCase();
  }
  
  if (contact.first_name) {
    return contact.first_name.slice(0, 2).toUpperCase();
  }
  
  if (contact.company_name) {
    return contact.company_name.slice(0, 2).toUpperCase();
  }
  
  return 'CL';
};

export default function ClientPaymentRow({ 
  payment, 
  onClick, 
  selected, 
  density = 'normal',
  showProject = false,
  className 
}: ClientPaymentRowProps) {
  
  // Determinar el color del borde basado en el estado del pago
  const getBorderColor = (payment: ClientPayment): 'success' | 'warning' | 'danger' | 'neutral' => {
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

  // Obtener avatar del cliente
  const getClientAvatar = () => {
    return payment.project_client?.contact?.linked_user?.avatar_url;
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
        {/* Línea 1: Nombre del cliente */}
        <div className="font-semibold text-sm truncate">
          {getClientName(payment)}
        </div>
        {/* Línea 2: Unidad funcional o billetera */}
        <div className="text-muted-foreground text-sm truncate">
          {payment.project_client?.unit 
            ? `Unidad: ${payment.project_client.unit}`
            : payment.wallet?.wallets?.name || 'Sin billetera'
          }
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
          <span className="font-mono text-sm font-bold text-green-600">
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
      avatarUrl={getClientAvatar()}
      avatarFallback={getClientInitials(payment)}
      borderColor={getBorderColor(payment)}
      onClick={onClick}
      selected={selected}
      density={density}
      className={className}
      data-testid={`payment-row-${payment.id}`}
    >
      {cardContent}
    </DataRowCard>
  );
}

// Export del tipo para uso externo
export type { ClientPayment };