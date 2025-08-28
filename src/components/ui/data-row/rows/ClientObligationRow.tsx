import DataRowCard, { DataRowCardProps } from '../DataRowCard';

// Interface para compromiso de cliente basada en la estructura de ClientObligations
interface ClientObligation {
  id: string;
  client_id: string;
  unit?: string;
  committed_amount: number;
  currency_id: string;
  exchange_rate?: number;
  created_at: string;
  contacts?: {
    id: string;
    first_name?: string;
    last_name?: string;
    company_name?: string;
    full_name?: string;
  };
  // Campos calculados agregados en ClientObligations
  totalPaid: number;
  remainingAmount: number;
  currency?: {
    id: string;
    name: string;
    code: string;
    symbol: string;
  };
}

interface ClientObligationRowProps {
  obligation: ClientObligation;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  selected?: boolean;
  density?: 'compact' | 'normal' | 'comfortable';
  className?: string;
}

// Helper para formatear importes
const formatCurrency = (amount: number, symbol?: string): string => {
  const formattedAmount = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
  
  return `${symbol || '$'}${formattedAmount}`;
};

// Helper para obtener las iniciales del cliente
const getClientInitials = (obligation: ClientObligation): string => {
  const contact = obligation.contacts;
  
  if (!contact) {
    return 'SC'; // Sin Contacto
  }
  
  if (contact.company_name) {
    // Para empresas, usar las primeras dos letras o primera letra de cada palabra
    const words = contact.company_name.split(' ');
    if (words.length > 1) {
      return words.slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
    }
    return contact.company_name.slice(0, 2).toUpperCase();
  }
  
  // Para personas, usar iniciales de nombre y apellido
  const firstName = contact.first_name || '';
  const lastName = contact.last_name || '';
  
  const firstInitial = firstName.charAt(0)?.toUpperCase() || '';
  const lastInitial = lastName.charAt(0)?.toUpperCase() || '';
  
  return firstInitial + lastInitial || 'CL';
};

// Helper para obtener el nombre completo del cliente
const getClientDisplayName = (obligation: ClientObligation): string => {
  const contact = obligation.contacts;
  
  if (!contact) {
    return 'Sin contacto';
  }
  
  if (contact.company_name) {
    return contact.company_name;
  }
  
  if (contact.full_name) {
    return contact.full_name;
  }
  
  const firstName = contact.first_name || '';
  const lastName = contact.last_name || '';
  
  if (firstName || lastName) {
    return `${firstName} ${lastName}`.trim();
  }
  
  return 'Sin nombre';
};

// Helper para calcular el porcentaje de pago
const calculatePaymentPercentage = (obligation: ClientObligation): number => {
  if (obligation.committed_amount === 0) return 0;
  return (obligation.totalPaid / obligation.committed_amount) * 100;
};

export default function ClientObligationRow({ 
  obligation, 
  onClick, 
  onEdit,
  onDelete,
  selected, 
  density = 'normal',
  className 
}: ClientObligationRowProps) {
  
  // Calcular métricas
  const paymentPercentage = calculatePaymentPercentage(obligation);
  const isComplete = paymentPercentage >= 100;
  const hasOverpayment = obligation.remainingAmount < 0;
  
  // Determinar el color del borde basado en el estado del pago
  const getBorderColor = (): 'success' | 'warning' | 'danger' | 'neutral' => {
    if (isComplete) return 'success';
    if (paymentPercentage > 50) return 'warning';
    if (paymentPercentage > 0) return 'warning';
    return 'neutral';
  };

  // Formatear importes
  const formattedCommitted = formatCurrency(obligation.committed_amount, obligation.currency?.symbol);
  const formattedPaid = formatCurrency(obligation.totalPaid, obligation.currency?.symbol);
  const formattedRemaining = formatCurrency(Math.abs(obligation.remainingAmount), obligation.currency?.symbol);

  // Contenido interno del card
  const cardContent = (
    <>
      {/* Columna de contenido (medio) */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">
          {getClientDisplayName(obligation)}
        </div>
        {obligation.unit && (
          <div className="text-muted-foreground text-sm truncate">
            Unidad: {obligation.unit}
          </div>
        )}
      </div>

      {/* Columna trailing */}
      <div className="flex flex-col items-end flex-shrink-0">
        {/* Línea 1: Comprometido */}
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground text-sm">C:</span>
          <span className="font-mono text-sm">{formattedCommitted}</span>
          <span className="text-xs text-muted-foreground">{obligation.currency?.code}</span>
        </div>
        
        {/* Línea 2: Pagado y porcentaje */}
        <div className="flex items-center gap-2">
          <span className={`text-sm ${paymentPercentage > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>P:</span>
          <span className={`font-mono text-sm ${paymentPercentage > 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
            {formattedPaid}
          </span>
          <span className="text-xs text-muted-foreground">
            {paymentPercentage.toFixed(1)}%
          </span>
        </div>
      </div>
    </>
  );

  return (
    <DataRowCard
      avatarFallback={getClientInitials(obligation)}
      borderColor={getBorderColor()}
      onClick={onClick}
      selected={selected}
      density={density}
      className={className}
      data-testid={`client-obligation-row-${obligation.id}`}
    >
      {cardContent}
    </DataRowCard>
  );
}

// Export del tipo para uso externo
export type { ClientObligation };