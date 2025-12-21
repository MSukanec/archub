import DataRowCard from '@/components/shared/DataRowCard';
import { SwipeableCard } from '@/layouts';
import { Edit, Trash2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Interface para el cliente basada en ProjectClientSummary
interface Client {
  id: string;
  contact_id: string;
  notes: string | null;
  is_primary: boolean;
  status: string;
  contacts: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    full_name: string | null;
    email: string | null;
    phone?: string | null;
    company_name?: string | null;
    image_bucket?: string | null;
    image_path?: string | null;
    linked_user?: {
      id: string;
      avatar_url?: string;
    } | null;
  } | null;
  role: {
    id: string;
    name: string;
    is_default?: boolean;
  } | null;
  financialByCurrency: Array<{
    currency: {
      id: string;
      code: string;
      symbol: string;
    } | null;
    total_committed_amount: number;
    total_paid_amount: number;
    balance_due: number;
    next_due_date?: string | null;
    next_due_amount?: number | null;
    last_payment_date?: string | null;
    total_schedule_items?: number;
    schedule_paid?: number;
    schedule_overdue?: number;
  }>;
  total_committed_amount: number;
  total_paid_amount: number;
  balance_due: number;
  next_due: number | null;
}

interface ClientRowProps {
  client: Client;
  onClick?: (client: Client) => void;
  onView?: (client: Client) => void;
  onEdit?: (client: Client) => void;
  onDelete?: (client: Client) => void;
  selected?: boolean;
  density?: 'compact' | 'normal' | 'comfortable';
  enableSwipe?: boolean;
  'data-testid'?: string;
}

// Helper para obtener las iniciales del cliente
const getClientInitials = (client: Client): string => {
  const contact = client.contacts;
  
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
const getClientDisplayName = (client: Client): string => {
  const contact = client.contacts;
  
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

// Helper para formatear importes
const formatCurrency = (amount: number, symbol?: string): string => {
  const formattedAmount = new Intl.NumberFormat('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.abs(amount));
  
  return `${symbol || '$'}${formattedAmount}`;
};

// Helper para obtener configuración de badge de estado
const getStatusConfig = (status: string): { label: string; borderColor: string; textColor: string } => {
  const configs: Record<string, { label: string; borderColor: string; textColor: string }> = {
    active: { 
      label: 'Activo', 
      borderColor: 'border-green-600 dark:border-green-400', 
      textColor: 'text-green-600 dark:text-green-400' 
    },
    inactive: { 
      label: 'Inactivo', 
      borderColor: 'border-muted-foreground', 
      textColor: 'text-muted-foreground' 
    },
    pending: { 
      label: 'Pendiente', 
      borderColor: 'border-orange-600 dark:border-orange-400', 
      textColor: 'text-orange-600 dark:text-orange-400' 
    },
  };
  
  return configs[status] || { 
    label: status, 
    borderColor: 'border-muted-foreground', 
    textColor: 'text-muted-foreground' 
  };
};

export default function ClientRow({ 
  client, 
  onClick, 
  onView,
  onEdit,
  onDelete,
  selected, 
  density = 'normal',
  enableSwipe = true,
  'data-testid': dataTestId
}: ClientRowProps) {
  
  // Get avatar from contact's linked user or from images
  const avatarUrl = client.contacts?.linked_user?.avatar_url 
    || (client.contacts?.image_bucket && client.contacts?.image_path 
      ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/${client.contacts.image_bucket}/${client.contacts.image_path}`
      : null);
  const avatarFallback = getClientInitials(client);
  
  // Get primary currency data (first currency in array)
  const primaryCurrency = client.financialByCurrency[0];
  const balanceDue = primaryCurrency?.balance_due || 0;
  const currencySymbol = primaryCurrency?.currency?.symbol || '$';
  
  // Get status config
  const statusConfig = getStatusConfig(client.status);
  
  // Build metadata string (role if exists)
  const metadata: string[] = [];
  
  if (client.role?.name) {
    metadata.push(client.role.name);
  }

  // Contenido interno del card
  const cardContent = (
    <>
      {/* Columna de contenido (principal) */}
      <div className="flex-1 min-w-0">
        {/* Nombre del cliente */}
        <div className="font-semibold text-sm truncate">
          {getClientDisplayName(client)}
        </div>

        {/* Metadata: Rol + Unidad */}
        {metadata.length > 0 && (
          <div className="text-muted-foreground text-xs truncate mt-0.5">
            {metadata.join(' • ')}
          </div>
        )}
      </div>

      {/* Columna derecha: Estado + Balance */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {/* Badge de Estado */}
        <Badge 
          variant="neutral"
          className={`${statusConfig.borderColor} ${statusConfig.textColor} border-2 text-xs`}
        >
          {statusConfig.label}
        </Badge>
        
        {/* Balance debido */}
        {balanceDue !== 0 && (
          <div className="text-xs text-muted-foreground font-mono">
            Deuda: {formatCurrency(balanceDue, currencySymbol)}
          </div>
        )}
      </div>
    </>
  );

  // Card base usando DataRowCard
  const clientCard = (
    <DataRowCard
      avatarUrl={avatarUrl ?? undefined}
      avatarFallback={avatarFallback}
      selected={selected}
      density={density}
      onClick={onClick ? () => onClick(client) : undefined}
      data-testid={dataTestId}
    >
      {cardContent}
    </DataRowCard>
  );

  // If swipe is enabled and we have actions, wrap in SwipeableCard
  if (enableSwipe && (onView || onEdit || onDelete)) {
    const swipeActions = [];
    
    if (onView) {
      swipeActions.push({
        label: "Ver",
        icon: <Eye className="w-4 h-4" />,
        variant: "default" as const,
        onClick: () => onView(client),
      });
    }
    
    if (onEdit) {
      swipeActions.push({
        label: "Editar",
        icon: <Edit className="w-4 h-4" />,
        variant: "default" as const,
        onClick: () => onEdit(client),
      });
    }
    
    if (onDelete) {
      swipeActions.push({
        label: "Eliminar",
        icon: <Trash2 className="w-4 h-4" />,
        variant: "destructive" as const,
        onClick: () => onDelete(client),
      });
    }

    return (
      <SwipeableCard actions={swipeActions}>
        {clientCard}
      </SwipeableCard>
    );
  }

  return clientCard;
}

// Export del tipo para uso externo
export type { Client };
