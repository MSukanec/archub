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
      <div className="flex flex-col w-full gap-2">
        {/* Usuario: valor */}
        <div className="text-sm">
          <span className="text-muted-foreground">Usuario: </span>
          <span className="font-medium">{payment.users?.full_name || 'Sin nombre'}</span>
        </div>

        {/* Email: valor */}
        <div className="text-sm truncate">
          <span className="text-muted-foreground">Email: </span>
          <span>{payment.users?.email}</span>
        </div>

        {/* Curso: valor */}
        <div className="text-sm truncate">
          <span className="text-muted-foreground">Curso: </span>
          <span className="font-medium">{payment.course_prices?.courses?.title || 'N/A'}</span>
        </div>

        {/* Monto: valor */}
        <div className="text-sm">
          <span className="text-muted-foreground">Monto: </span>
          <span className="font-semibold">
            {new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: payment.currency,
              minimumFractionDigits: 0,
            }).format(payment.amount)}
          </span>
        </div>

        {/* Fecha: valor + badge */}
        <div className="text-sm flex items-center gap-2 flex-wrap">
          <div>
            <span className="text-muted-foreground">Fecha: </span>
            <span>{format(new Date(payment.created_at), "dd/MM/yy HH:mm", { locale: es })}</span>
          </div>
          {getStatusBadge()}
        </div>
      </div>

      {/* Botón Ver - ancho completo fuera del contenedor */}
      {payment.receipt_url && (
        <Button
          className="w-full mt-3"
          onClick={() => onViewReceipt(payment)}
          data-testid={`button-view-receipt-${payment.id}`}
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver Comprobante
        </Button>
      )}
    </DataRowCard>
  );
}
