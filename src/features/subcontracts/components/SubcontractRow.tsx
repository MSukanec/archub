import DataRowCard, { DataRowCardProps } from '@/components/shared/DataRowCard';

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

const formatCurrency = (amount: number, symbol?: string): string => {
  const formattedAmount = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
  
  return `${symbol || '$'}${formattedAmount}`;
};

const getSubcontractInitials = (subcontract: Subcontract): string => {
  if (subcontract.code) {
    return subcontract.code.slice(0, 2).toUpperCase();
  }
  
  if (subcontract.title) {
    const words = subcontract.title.split(' ');
    if (words.length > 1) {
      return words.slice(0, 2).map(w => w[0]?.toUpperCase()).join('');
    }
    return subcontract.title.slice(0, 2).toUpperCase();
  }
  
  return 'SC';
};

const getContractorName = (subcontract: Subcontract): string => {
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
  
  const paymentPercentage = calculatePaymentPercentage(subcontract);
  const contractorName = getContractorName(subcontract);
  const statusColor = getStatusColor(subcontract.status);
  const statusText = getStatusText(subcontract.status);
  
  const formattedTotal = subcontract.amount_total 
    ? formatCurrency(subcontract.amount_total, subcontract.currency?.symbol)
    : '-';
  
  const formattedPaid = subcontract.analysis?.pagoALaFecha 
    ? formatCurrency(subcontract.analysis.pagoALaFecha, subcontract.currency?.symbol)
    : formatCurrency(0, subcontract.currency?.symbol);

  const formattedBalance = subcontract.analysis?.saldo 
    ? formatCurrency(subcontract.analysis.saldo, subcontract.currency?.symbol)
    : formatCurrency((subcontract.amount_total || 0) - (subcontract.analysis?.pagoALaFecha || 0), subcontract.currency?.symbol);

  const cardContent = (
    <>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">
          {subcontract.title}
        </div>
        
        <div className="text-muted-foreground text-sm truncate">
          {contractorName}
        </div>
        
        <div className={`text-sm truncate ${
          statusColor === 'success' ? 'text-green-600' : 
          statusColor === 'danger' ? 'text-red-600' : 
          statusColor === 'warning' ? 'text-yellow-600' : 
          'text-muted-foreground'
        }`}>
          {statusText}
        </div>
      </div>

      <div className="flex flex-col items-end flex-shrink-0">
        <div className="flex items-center gap-1">
          <span className="text-xs" style={{ color: '#8B5CF6' }}>T:</span>
          <span className="font-mono text-sm" style={{ color: '#8B5CF6' }}>
            {formattedTotal}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <span className="text-xs" style={{ color: '#10B981' }}>P:</span>
          <span className="font-mono text-sm" style={{ color: '#10B981' }}>
            {formattedPaid}
          </span>
        </div>
        
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

export type { Subcontract };
