import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertCircle, XCircle, Receipt, Download } from 'lucide-react';
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

  const handleDownloadReceipt = (payment: ClientPortalPayment) => {
    if (payment.receipt_url) {
      const link = document.createElement('a');
      link.href = payment.receipt_url;
      link.download = payment.receipt_name || 'comprobante';
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.log('Generate PDF receipt for payment:', payment.id);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3" data-testid="payments-loading">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse p-4 rounded-lg border bg-card">
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-1/3" />
                <div className="h-3 bg-muted rounded w-1/4" />
              </div>
              <div className="h-6 bg-muted rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (payments.length === 0) {
    return (
      <div className="text-center py-12" data-testid="payments-empty">
        <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No hay pagos registrados aún</p>
      </div>
    );
  }

  return (
    <div className="space-y-3" data-testid="payments-list">
      {payments.map((payment) => {
        const config = statusConfig[payment.status as keyof typeof statusConfig] || statusConfig.pending;

        return (
          <div
            key={payment.id}
            className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            data-testid={`payment-item-${payment.id}`}
          >
            {/* Mobile Layout */}
            <div className="block sm:hidden space-y-3">
              {/* Row 1: Fecha + Estado */}
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">
                  {formatDate(payment.payment_date)}
                </p>
                <Badge className={config.className}>
                  {config.label}
                </Badge>
              </div>

              {/* Row 2: Monto + Porcentaje acumulado + Billetera */}
              <div className="flex items-center justify-between">
                <div className="flex items-baseline gap-2">
                  <p className="font-semibold text-base">
                    {formatCurrency(payment.amount, payment.currency_symbol)}
                  </p>
                  {payment.cumulative_percentage !== null && (
                    <span className="text-sm text-muted-foreground">
                      ({payment.cumulative_percentage}%)
                    </span>
                  )}
                </div>
                {payment.wallet_name && (
                  <span className="text-sm text-muted-foreground">
                    {payment.wallet_name}
                  </span>
                )}
              </div>

              {/* Row 3: Cotización + Download */}
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                {payment.exchange_rate && payment.exchange_rate !== 1 ? (
                  <span className="text-xs text-muted-foreground">
                    TC: {payment.exchange_rate.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                ) : (
                  <span />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 h-8"
                  onClick={() => handleDownloadReceipt(payment)}
                  data-testid={`button-download-receipt-${payment.id}`}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Desktop Layout */}
            <div className="hidden sm:flex items-center gap-6">
              {/* Fecha */}
              <div className="w-[180px] flex-shrink-0">
                <p className="font-medium text-sm">
                  {formatDate(payment.payment_date)}
                </p>
              </div>

              {/* Monto + Porcentaje acumulado */}
              <div className="w-[160px] flex-shrink-0">
                <div className="flex items-baseline gap-2">
                  <p className="font-semibold">
                    {formatCurrency(payment.amount, payment.currency_symbol)}
                  </p>
                  {payment.cumulative_percentage !== null && (
                    <span className="text-sm text-muted-foreground">
                      ({payment.cumulative_percentage}%)
                    </span>
                  )}
                </div>
              </div>

              {/* Billetera */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground truncate">
                  {payment.wallet_name || '-'}
                </p>
              </div>

              {/* Cotización */}
              <div className="w-[80px] flex-shrink-0 text-right">
                <p className="text-sm text-muted-foreground">
                  {payment.exchange_rate && payment.exchange_rate !== 1
                    ? payment.exchange_rate.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : '-'
                  }
                </p>
              </div>

              {/* Estado */}
              <div className="w-[100px] flex-shrink-0">
                <Badge className={config.className}>
                  {config.label}
                </Badge>
              </div>

              {/* Download */}
              <div className="w-[40px] flex-shrink-0 flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleDownloadReceipt(payment)}
                  data-testid={`button-download-receipt-${payment.id}`}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
