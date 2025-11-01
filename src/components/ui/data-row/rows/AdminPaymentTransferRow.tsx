import DataRowCard from '../DataRowCard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { CheckCircle2, XCircle, AlertCircle, Eye, FileText, User } from 'lucide-react'

interface BankTransferPayment {
  id: string;
  user_id: string;
  course_price_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'rejected';
  receipt_url: string | null;
  created_at: string;
  users: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url?: string | null;
  };
  course_prices: {
    id: string;
    amount: number;
    currency_code: string;
    months: number;
    courses: {
      id: string;
      title: string;
      slug: string;
    };
  };
}

interface AdminPaymentTransferRowProps {
  payment: BankTransferPayment;
  onViewReceipt: (payment: BankTransferPayment) => void;
  density?: 'compact' | 'comfortable';
}

export default function AdminPaymentTransferRow({
  payment,
  onViewReceipt,
  density = 'comfortable'
}: AdminPaymentTransferRowProps) {
  const getStatusBadge = () => {
    if (payment.status === 'pending') {
      return (
        <Badge className="bg-[hsl(var(--warning))] text-[hsl(var(--warning-text))] border-[hsl(var(--warning))]">
          <AlertCircle className="h-3 w-3 mr-1" />
          Pendiente
        </Badge>
      );
    }
    if (payment.status === 'approved') {
      return (
        <Badge variant="secondary" className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Aprobado
        </Badge>
      );
    }
    return (
      <Badge variant="destructive">
        <XCircle className="h-3 w-3 mr-1" />
        Rechazado
      </Badge>
    );
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const cardContent = (
    <>
      {/* Columna de contenido (principal) */}
      <div className="flex-1 min-w-0">
        {/* Primera fila - Nombre del usuario */}
        <div className="font-semibold text-sm truncate">
          {payment.users?.full_name || 'Sin nombre'}
        </div>

        {/* Segunda fila - Email */}
        <div className="text-xs text-muted-foreground truncate">
          {payment.users?.email}
        </div>
      </div>

      {/* Trailing Section - Monto y Fecha */}
      <div className="flex flex-col items-end gap-0.5">
        <span className="font-semibold text-sm">
          {new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: payment.currency,
            minimumFractionDigits: 0,
          }).format(payment.amount)}
        </span>
        <span className="text-xs text-muted-foreground">
          {format(new Date(payment.created_at), 'dd/MM/yy', { locale: es })}
        </span>
      </div>
    </>
  );

  return (
    <DataRowCard
      avatarUrl={payment.users?.avatar_url || undefined}
      avatarFallback={getInitials(payment.users?.full_name)}
      density={density}
      data-testid={`payment-transfer-row-${payment.id}`}
    >
      {cardContent}
      <div className="space-y-3 mt-3">
        {/* Curso */}
        <div className="flex items-start gap-2">
          <FileText className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">Curso</p>
            <p className="text-sm font-medium truncate">
              {payment.course_prices?.courses?.title || 'N/A'}
            </p>
          </div>
        </div>

        {/* Estado */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getStatusBadge()}
          </div>
          
          {/* Botón Ver solo si hay comprobante */}
          {payment.receipt_url && (
            <Button
              size="sm"
              onClick={() => onViewReceipt(payment)}
              data-testid={`button-view-receipt-${payment.id}`}
            >
              <Eye className="h-4 w-4 mr-1" />
              Ver
            </Button>
          )}
        </div>
      </div>
    </DataRowCard>
  );
}
