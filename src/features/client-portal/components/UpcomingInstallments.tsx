import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarClock, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { format, isPast, isToday, addDays, isBefore } from 'date-fns';
import { es } from 'date-fns/locale';
import type { ClientPortalScheduleItem } from '../types';
interface UpcomingInstallmentsProps {
  schedules: ClientPortalScheduleItem[];
  isLoading?: boolean;
}
export function UpcomingInstallments({ schedules, isLoading }: UpcomingInstallmentsProps) {
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isToday(date)) return 'Hoy';
      return format(date, "d 'de'MMMM", { locale: es });
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
  const getStatus = (schedule: ClientPortalScheduleItem) => {
    if (schedule.status === 'paid'|| schedule.paid_at) {
      return { label: 'Pagado', icon: CheckCircle, className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'};
    }
    if (schedule.status === 'cancelled') {
      return { label: 'Cancelado', icon: Clock, className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'};
    }
    
    const dueDate = new Date(schedule.due_date);
    if (isPast(dueDate) && !isToday(dueDate)) {
      return { label: 'Vencido', icon: AlertTriangle, className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'};
    }
    if (isToday(dueDate) || isBefore(dueDate, addDays(new Date(), 7))) {
      return { label: 'Próximo', icon: CalendarClock, className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'};
    }
    return { label: 'Pendiente', icon: Clock, className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'};
  };
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Próximas Cuotas</CardTitle>
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
  const pendingSchedules = schedules.filter(s => s.status !== 'paid'&& !s.paid_at && s.status !== 'cancelled');
  if (pendingSchedules.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-medium">Próximas Cuotas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
            <p className="text-muted-foreground">No hay cuotas pendientes</p>
            <p className="text-sm text-muted-foreground mt-1">¡Estás al día con tus pagos!</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  return (
    <Card data-testid="card-upcoming-installments">
      <CardHeader>
        <CardTitle className="text-base font-medium">Próximas Cuotas</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pendingSchedules.map((schedule) => {
            const status = getStatus(schedule);
            const StatusIcon = status.icon;
            return (
              <div
                key={schedule.id}
                className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                data-testid={`schedule-item-${schedule.id}`}
              >
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <StatusIcon className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">
                    {formatCurrency(schedule.amount, schedule.currency_symbol)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Vence: {formatDate(schedule.due_date)}
                  </p>
                </div>
                <Badge className={status.className}>
                  {status.label}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
