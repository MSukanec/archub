import DataRowCard, { DataRowCardProps } from '../DataRowCard';

// Interface para subcontrato basada en la estructura de SubcontractList
interface Subcontract {
  id: string;
  title: string;
  code?: string;
  status: 'draft' | 'active' | 'awarded' | 'pending' | 'in_progress' | 'completed' | 'cancelled';
  amount_total?: number;
  currency_id?: string;
  exchange_rate?: number;
  created_at: string;
  contact?: {
    id: string;
    first_name?: string;
    last_name?: string;
    company_name?: string;
    full_name?: string;
    email?: string;
  };
  currency?: {
    id: string;
    name: string;
    code: string;
    symbol: string;
  };
  // Campos del análisis agregados
  analysis?: {
    pagoALaFecha: number;
    pagoALaFechaUSD: number;
    saldo: number;
    saldoUSD: number;
  };
}

interface SubcontractRowProps {
  subcontract: Subcontract;
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

// Helper para obtener las iniciales del subcontrato
const getSubcontractInitials = (subcontract: Subcontract): string => {
  if (subcontract.code) {
    // Si tiene código, usar las primeras dos letras
    return subcontract.code.slice(0, 2).toUpperCase();
  }
  
  if (subcontract.title) {
    // Usar las primeras dos letras del título o primera letra de las primeras dos palabras
    const words = subcontract.title.split(' ');
    if (words.length > 1) {
      return words.slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
    }
    return subcontract.title.slice(0, 2).toUpperCase();
  }
  
  return 'SC'; // SubContrato
};

// Helper para obtener el nombre del contratista
const getContractorName = (subcontract: Subcontract): string => {
  // Intentar contact directo o contact de la bid ganadora
  const contact = subcontract.contact || (subcontract as any).winner_bid?.contacts;
  
  if (subcontract.status !== 'awarded' || !contact) {
    return 'Sin adjudicar';
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
  
  return 'Sin subcontratista';
};

// Helper para obtener el color del estado
const getStatusColor = (status: string): 'success' | 'warning' | 'danger' | 'neutral' => {
  switch (status) {
    case 'awarded':
    case 'completed':
      return 'success';
    case 'active':
    case 'in_progress':
      return 'warning';
    case 'cancelled':
      return 'danger';
    case 'draft':
    case 'pending':
    default:
      return 'neutral';
  }
};

// Helper para obtener el texto del estado
const getStatusText = (status: string): string => {
  switch (status) {
    case 'draft':
      return 'Borrador';
    case 'active':
      return 'Activo';
    case 'awarded':
      return 'Adjudicado';
    case 'pending':
      return 'Pendiente';
    case 'in_progress':
      return 'En progreso';
    case 'completed':
      return 'Completado';
    case 'cancelled':
      return 'Cancelado';
    default:
      return status;
  }
};

// Helper para calcular el porcentaje de pago
const calculatePaymentPercentage = (subcontract: Subcontract): number => {
  const analysis = subcontract.analysis;
  if (!analysis || !subcontract.amount_total || subcontract.amount_total === 0) {
    return 0;
  }
  return (analysis.pagoALaFecha / subcontract.amount_total) * 100;
};

export default function SubcontractRow({ 
  subcontract, 
  onClick, 
  onEdit,
  onDelete,
  selected, 
  density = 'normal',
  className 
}: SubcontractRowProps) {
  
  // Calcular métricas
  const paymentPercentage = calculatePaymentPercentage(subcontract);
  const contractorName = getContractorName(subcontract);
  const statusColor = getStatusColor(subcontract.status);
  const statusText = getStatusText(subcontract.status);
  
  // Formatear importes
  const formattedTotal = subcontract.amount_total 
    ? formatCurrency(subcontract.amount_total, subcontract.currency?.symbol)
    : '-';
  
  const formattedPaid = subcontract.analysis?.pagoALaFecha 
    ? formatCurrency(subcontract.analysis.pagoALaFecha, subcontract.currency?.symbol)
    : formatCurrency(0, subcontract.currency?.symbol);

  // Formatear saldo
  const formattedBalance = subcontract.analysis?.saldo 
    ? formatCurrency(subcontract.analysis.saldo, subcontract.currency?.symbol)
    : formatCurrency((subcontract.amount_total || 0) - (subcontract.analysis?.pagoALaFecha || 0), subcontract.currency?.symbol);

  // Contenido interno del card usando el nuevo sistema
  const cardContent = (
    <>
      {/* Columna de contenido (principal) */}
      <div className="flex-1 min-w-0">
        {/* Línea 1: Título del subcontrato */}
        <div className="font-semibold text-sm truncate">
          {subcontract.title}
        </div>
        
        {/* Línea 2: Subcontratista */}
        <div className="text-muted-foreground text-sm truncate">
          {contractorName}
        </div>
        
        {/* Línea 3: Estado */}
        <div className={`text-sm truncate ${
          statusColor === 'success' ? 'text-green-600' : 
          statusColor === 'danger' ? 'text-red-600' : 
          statusColor === 'warning' ? 'text-yellow-600' : 
          'text-muted-foreground'
        }`}>
          {statusText}
        </div>
      </div>

      {/* Columna trailing (tres líneas de montos) */}
      <div className="flex flex-col items-end flex-shrink-0">
        {/* Línea 1: Total */}
        <div className="flex items-center gap-1">
          <span className="text-xs" style={{ color: '#8B5CF6' }}>T:</span>
          <span className="font-mono text-sm" style={{ color: '#8B5CF6' }}>
            {formattedTotal}
          </span>
        </div>
        
        {/* Línea 2: Pagado */}
        <div className="flex items-center gap-1">
          <span className="text-xs" style={{ color: '#10B981' }}>P:</span>
          <span className="font-mono text-sm" style={{ color: '#10B981' }}>
            {formattedPaid}
          </span>
        </div>
        
        {/* Línea 3: Saldo */}
        <div className="flex items-center gap-1">
          <span className="text-xs" style={{ color: '#3B82F6' }}>S:</span>
          <span className="font-mono text-sm" style={{ color: '#3B82F6' }}>
            {formattedBalance}
          </span>
        </div>
      </div>
    </>
  );

  return (
    <DataRowCard
      avatarFallback={getSubcontractInitials(subcontract)}
      borderColor={statusColor}
      onClick={onClick}
      selected={selected}
      density={density}
      className={className}
      data-testid={`subcontract-row-${subcontract.id}`}
    >
      {cardContent}
    </DataRowCard>
  );
}

// Export del tipo para uso externo
export type { Subcontract };