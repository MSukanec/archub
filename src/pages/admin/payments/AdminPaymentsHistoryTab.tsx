import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Badge } from '@/components/ui/badge';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui/stat-card';
import { CheckCircle2, XCircle, AlertCircle, DollarSign, TrendingUp, Clock, Inbox } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';

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

const AdminPaymentsHistoryTab = () => {
  const { data: payments = [], isLoading } = useQuery<BankTransferPayment[]>({
    queryKey: ['/api/admin/payments'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch('/api/admin/payments', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch payments');
      }
      return response.json();
    },
  });

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    const pendingPayments = payments.filter(p => p.status === 'pending');
    const approvedPayments = payments.filter(p => p.status === 'approved');
    
    const approvedThisMonth = approvedPayments.filter(p => 
      isWithinInterval(new Date(p.created_at), { start: currentMonthStart, end: currentMonthEnd })
    );

    const totalAmountThisMonth = approvedThisMonth.reduce((sum, p) => {
      if (p.currency === 'ARS') {
        return sum + p.amount;
      }
      return sum + (p.amount * 1000);
    }, 0);

    return {
      pending: pendingPayments.length,
      approvedToday: approvedPayments.filter(p => {
        const paymentDate = new Date(p.created_at);
        return paymentDate.toDateString() === now.toDateString();
      }).length,
      totalMonthARS: totalAmountThisMonth,
    };
  }, [payments]);

  const columns = [
    {
      key: 'created_at',
      label: 'Fecha',
      width: '12%',
      render: (payment: BankTransferPayment) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(payment.created_at), 'dd/MM/yy HH:mm', { locale: es })}
        </span>
      ),
    },
    {
      key: 'user',
      label: 'Usuario',
      width: '22%',
      render: (payment: BankTransferPayment) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">
            {payment.users?.full_name || 'Sin nombre'}
          </span>
          <span className="text-xs text-muted-foreground">{payment.users?.email}</span>
        </div>
      ),
    },
    {
      key: 'course',
      label: 'Curso',
      width: '28%',
      render: (payment: BankTransferPayment) => (
        <div className="flex flex-col">
          <span className="text-sm">{payment.course_prices?.courses?.title}</span>
          <span className="text-xs text-muted-foreground">
            {payment.course_prices?.months} {payment.course_prices?.months === 1 ? 'mes' : 'meses'}
          </span>
        </div>
      ),
    },
    {
      key: 'amount',
      label: 'Monto',
      width: '15%',
      render: (payment: BankTransferPayment) => (
        <div className="flex flex-col">
          <span className="font-semibold text-sm">
            {new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: payment.currency,
              minimumFractionDigits: 0,
            }).format(payment.amount)}
          </span>
          <span className="text-xs text-muted-foreground">{payment.currency}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      width: '15%',
      render: (payment: BankTransferPayment) => {
        if (payment.status === 'pending') {
          return (
            <Badge className="bg-accent/10 text-accent border-accent/30">
              <AlertCircle className="h-3 w-3 mr-1" />
              Pendiente
            </Badge>
          );
        }
        if (payment.status === 'approved') {
          return (
            <Badge className="bg-green-50 dark:bg-green-950/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Aprobado
            </Badge>
          );
        }
        return (
          <Badge className="bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800">
            <XCircle className="h-3 w-3 mr-1" />
            Rechazado
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard>
          <div className="flex items-center justify-between">
            <StatCardTitle showArrow={false}>Pendientes de Revisión</StatCardTitle>
            <Clock className="h-5 w-5 text-accent" />
          </div>
          <StatCardValue>{stats.pending}</StatCardValue>
          <StatCardMeta>pagos esperando aprobación</StatCardMeta>
        </StatCard>

        <StatCard>
          <div className="flex items-center justify-between">
            <StatCardTitle showArrow={false}>Aprobados Hoy</StatCardTitle>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
          </div>
          <StatCardValue>{stats.approvedToday}</StatCardValue>
          <StatCardMeta>pagos aprobados hoy</StatCardMeta>
        </StatCard>

        <StatCard>
          <div className="flex items-center justify-between">
            <StatCardTitle showArrow={false}>Total del Mes</StatCardTitle>
            <TrendingUp className="h-5 w-5 text-blue-600" />
          </div>
          <StatCardValue>
            {new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'ARS',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(stats.totalMonthARS)}
          </StatCardValue>
          <StatCardMeta>pagos aprobados este mes</StatCardMeta>
        </StatCard>
      </div>

      {/* Tabla sin Card */}
      {payments.length === 0 ? (
        <EmptyState
          icon={<Inbox />}
          title={isLoading ? 'Cargando...' : 'No hay pagos'}
          description="No se han registrado pagos por transferencia bancaria en el sistema."
        />
      ) : (
        <Table
          columns={columns}
          data={payments}
          isLoading={isLoading}
        />
      )}
    </div>
  );
};

export default AdminPaymentsHistoryTab;
