import DataRowCard from '@/components/shared/DataRowCard';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { parseLocalDate } from '@/lib/date-utils';
import type { ClientPaymentWithRelations } from '@/features/clients';

interface ClientPaymentRowProps {
  payment: ClientPaymentWithRelations;
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
const getClientName = (payment: ClientPaymentWithRelations): string => {
  const contact = payment.client?.contact;
  
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
const getClientInitials = (payment: ClientPaymentWithRelations): string => {
  const contact = payment.client?.contact;
  
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
  const getBorderColor = (payment: ClientPaymentWithRelations): 'success' | 'warning' | 'danger' | 'neutral' => {
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

  // Obtener avatar del cliente - no disponible en este tipo
  const getClientAvatar = () => {
    return undefined;
  };

  // Formatear fecha de pago - uses parseLocalDate to avoid timezone issues
  const formatPaymentDate = (dateString: string): string => {
    try {
      const date = parseLocalDate(dateString);
      return date ? format(date, 'dd/MM/yyyy', { locale: es }) : '-';
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
        {/* Línea 2: Billetera */}
        <div className="text-muted-foreground text-sm truncate">
          {payment.wallet?.wallets?.name || 'Sin billetera'}
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
          <span className="font-mono text-sm font-bold text-green-700 dark:text-green-400">
            {formattedAmount}
          </span>
        </div>
        
        {/* Línea 2: Estado */}
        <div className={`text-sm font-medium ${
          payment.status === 'confirmed' ? 'text-green-700 dark:text-green-400' :
          payment.status === 'pending' ? 'text-orange-700 dark:text-orange-400' :
          payment.status === 'rejected' || payment.status === 'void' ? 'text-destructive' :
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