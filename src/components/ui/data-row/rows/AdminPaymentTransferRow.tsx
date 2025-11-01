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

  return (
    <DataRowCard
      avatarUrl={payment.users?.avatar_url || undefined}
      avatarFallback={getInitials(payment.users?.full_name)}
      density={density}
      data-testid={`payment-transfer-row-${payment.id}`}
    >
      {/* Layout vertical con todos los datos apilados */}
      <div className="space-y-2.5 w-full">
        {/* Fila 1: Nombre del usuario */}
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Usuario</p>
          <p className="font-semibold text-sm">
            {payment.users?.full_name || 'Sin nombre'}
          </p>
        </div>

        {/* Fila 2: Email */}
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Email</p>
          <p className="text-sm truncate">
            {payment.users?.email}
          </p>
        </div>

        {/* Fila 3: Curso */}
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Curso</p>
          <p className="text-sm font-medium truncate">
            {payment.course_prices?.courses?.title || 'N/A'}
          </p>
        </div>

        {/* Fila 4: Monto */}
        <div>
          <p className="text-xs text-muted-foreground mb-0.5">Monto</p>
          <p className="font-semibold text-base">
            {new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: payment.currency,
              minimumFractionDigits: 0,
            }).format(payment.amount)}
          </p>
        </div>

        {/* Fila 5: Fecha y Estado */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5">Fecha</p>
            <p className="text-sm">
              {format(new Date(payment.created_at), "dd/MM/yy HH:mm", { locale: es })}
            </p>
          </div>
          <div>
            {getStatusBadge()}
          </div>
        </div>

        {/* Fila 6: Botón Ver - ancho completo si hay comprobante */}
        {payment.receipt_url && (
          <Button
            className="w-full mt-2"
            onClick={() => onViewReceipt(payment)}
            data-testid={`button-view-receipt-${payment.id}`}
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Comprobante
          </Button>
        )}
      </div>
    </DataRowCard>
  );
}
