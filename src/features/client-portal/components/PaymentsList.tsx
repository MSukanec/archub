import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle, Clock, AlertCircle, XCircle, Receipt, Calendar, Wallet, FileText, DollarSign, ArrowDownToLine, TrendingUp } from 'lucide-react';
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

  const handleDownloadReceipt = (url: string, fileName: string | null) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || 'comprobante';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                {/* Mobile Layout */}
                <div className="block sm:hidden space-y-4">
                  {/* Row 1: Fecha + Estado */}
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span className="text-xs">Fecha</span>
                      </div>
                      <p className="font-medium text-sm">
                        {formatDate(payment.payment_date)}
                      </p>
                    </div>
                    <Badge className={config.className}>
                      {config.label}
                    </Badge>
                  </div>

                  {/* Row 2: Compromiso + Monto */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                        <FileText className="h-3.5 w-3.5" />
                        <span className="text-xs">Compromiso</span>
                      </div>
                      {payment.commitment_amount ? (
                        <>
                          <p className="font-medium text-sm">
                            {formatCurrency(payment.commitment_amount, payment.currency_symbol)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {payment.commitment_name || 'Total'}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">-</p>
                      )}
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span className="text-xs">Monto</span>
                      </div>
                      <p className="font-medium text-sm">
                        {formatCurrency(payment.amount, payment.currency_symbol)}
                      </p>
                      {payment.commitment_percentage !== null && (
                        <p className="text-xs text-muted-foreground">
                          {payment.commitment_percentage}% del compromiso
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Row 3: Billetera + Cotización */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                        <Wallet className="h-3.5 w-3.5" />
                        <span className="text-xs">Billetera</span>
                      </div>
                      <p className="font-medium text-sm">
                        {payment.wallet_name || '-'}
                      </p>
                    </div>

                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span className="text-xs">Cotización</span>
                      </div>
                      <p className="font-medium text-sm">
                        {payment.exchange_rate && payment.exchange_rate !== 1
                          ? payment.exchange_rate.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : '-'
                        }
                      </p>
                    </div>
                  </div>

                  {/* Row 4: Download Button */}
                  {payment.receipt_url && (
                    <div className="pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => handleDownloadReceipt(payment.receipt_url!, payment.receipt_name)}
                        data-testid={`button-download-receipt-${payment.id}`}
                      >
                        <ArrowDownToLine className="h-4 w-4" />
                        Descargar Comprobante
                      </Button>
                    </div>
                  )}
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:block">
                  <div className="grid grid-cols-7 gap-4 items-start">
                    {/* Fecha */}
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
                      {payment.commitment_amount ? (
                        <>
                          <p className="font-medium text-sm">
                            {formatCurrency(payment.commitment_amount, payment.currency_symbol)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {payment.commitment_name || 'Total'}
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-muted-foreground">-</p>
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
                      {payment.commitment_percentage !== null && (
                        <p className="text-xs text-muted-foreground">
                          {payment.commitment_percentage}% del compromiso
                        </p>
                      )}
                    </div>

                    {/* Cotización */}
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span className="text-xs">Cotización</span>
                      </div>
                      <p className="font-medium text-sm">
                        {payment.exchange_rate && payment.exchange_rate !== 1
                          ? payment.exchange_rate.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : '-'
                        }
                      </p>
                    </div>

                    {/* Estado */}
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground mb-1">Estado</span>
                      <Badge className={config.className}>
                        {config.label}
                      </Badge>
                    </div>

                    {/* Comprobante */}
                    <div className="flex flex-col items-end">
                      {payment.receipt_url ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5"
                          onClick={() => handleDownloadReceipt(payment.receipt_url!, payment.receipt_name)}
                          data-testid={`button-download-receipt-${payment.id}`}
                        >
                          <ArrowDownToLine className="h-3.5 w-3.5" />
                          <span className="hidden lg:inline">Descargar</span>
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </div>
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
