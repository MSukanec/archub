import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, XCircle, Receipt, Calendar, Wallet, FileText, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ClientPortalPayment } from '../types';

interface PaymentsListProps {
  payments: ClientPortalPayment[];
  isLoading?: boolean;
}

const statusConfig = {
  confirmed: { label: 'Confirmado', icon: CheckCircle, className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  pending: { label: 'Pendiente', icon: Clock, className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  rejected: { label: 'Rechazado', icon: XCircle, className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  void: { label: 'Anulado', icon: AlertCircle, className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200' },
};

export function PaymentsList({ payments, isLoading }: PaymentsListProps) {
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "d 'de' MMMM, yyyy", { locale: es });
    } catch {
      return dateStr;
    }
  };

  const formatCurrency = (amount: number, symbol: string = '$') => {
    return `${symbol} ${new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Historial de Pagos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="h-10 w-10 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-1/4" />
                </div>
                <div className="h-6 bg-muted rounded w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (payments.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Historial de Pagos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No hay pagos registrados aún</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="card-payments-list">
      <CardHeader>
        <CardTitle className="text-base font-medium">Historial de Pagos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {payments.map((payment) => {
            const config = statusConfig[payment.status as keyof typeof statusConfig] || statusConfig.pending;

            return (
              <div
                key={payment.id}
                className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                data-testid={`payment-item-${payment.id}`}
              >
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {/* Fecha de pago */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span className="text-xs">Fecha</span>
                    </div>
                    <p className="font-medium text-sm">
                      {formatDate(payment.payment_date)}
                    </p>
                  </div>

                  {/* Compromiso */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                      <FileText className="h-3.5 w-3.5" />
                      <span className="text-xs">Compromiso</span>
                    </div>
                    <p className="font-medium text-sm">
                      {payment.commitment_name || '-'}
                    </p>
                    {payment.commitment_amount && (
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(payment.commitment_amount, payment.currency_symbol)}
                      </p>
                    )}
                  </div>

                  {/* Billetera */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                      <Wallet className="h-3.5 w-3.5" />
                      <span className="text-xs">Billetera</span>
                    </div>
                    <p className="font-medium text-sm">
                      {payment.wallet_name || '-'}
                    </p>
                  </div>

                  {/* Monto */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                      <DollarSign className="h-3.5 w-3.5" />
                      <span className="text-xs">Monto</span>
                    </div>
                    <p className="font-medium text-sm">
                      {formatCurrency(payment.amount, payment.currency_symbol)}
                    </p>
                    {payment.exchange_rate && payment.exchange_rate !== 1 && (
                      <p className="text-xs text-muted-foreground">
                        TC: {payment.exchange_rate.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    )}
                  </div>

                  {/* Estado */}
                  <div className="flex flex-col items-start sm:items-end">
                    <span className="text-xs text-muted-foreground mb-1">Estado</span>
                    <Badge className={config.className}>
                      {config.label}
                    </Badge>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
