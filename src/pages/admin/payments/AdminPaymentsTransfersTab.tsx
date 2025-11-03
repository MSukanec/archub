import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui/stat-card';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle2, XCircle, Eye, AlertCircle, Inbox, Clock, TrendingUp, Search, Filter, Bell } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { Tabs } from '@/components/ui-custom/Tabs';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import AdminPaymentTransferRow from '@/components/ui/data-row/rows/AdminPaymentTransferRow';
import { useActionBarMobile } from '@/components/layout/mobile/ActionBarMobileContext';
import { useMobile } from '@/hooks/use-mobile';

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

const AdminPaymentsTransfersTab = () => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const { toast } = useToast();
  const { openModal } = useGlobalModalStore();
  const isMobile = useMobile();
  
  const { 
    setActions, 
    setShowActionBar, 
    clearActions,
    setFilterConfig,
    searchValue: mobileSearchValue,
    setSearchValue: setMobileSearchValue
  } = useActionBarMobile();

  const [searchValue, setSearchValue] = useState("");

  // Sync search values between mobile and desktop
  useEffect(() => {
    if (isMobile && mobileSearchValue !== searchValue) {
      setSearchValue(mobileSearchValue);
    }
  }, [mobileSearchValue, isMobile]);

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
      totalMonthARS: totalAmountThisMonth,
    };
  }, [payments]);

  const handleViewReceipt = (payment: BankTransferPayment) => {
    if (!payment.receipt_url) {
      toast({
        title: 'Sin comprobante',
        description: 'Este pago no tiene comprobante adjunto',
        variant: 'destructive',
      });
      return;
    }
    
    openModal('bank-transfer-receipt', {
      receiptUrl: payment.receipt_url,
      paymentId: payment.id,
    });
  };

  // Filter payments by status and search
  const filteredPayments = useMemo(() => {
    return payments.filter(payment => {
      // Search filter
      if (searchValue) {
        const search = searchValue.toLowerCase();
        const userName = payment.users?.full_name?.toLowerCase() || '';
        const userEmail = payment.users?.email?.toLowerCase() || '';
        const courseName = payment.course_prices?.courses?.title?.toLowerCase() || '';
        
        if (!userName.includes(search) && !userEmail.includes(search) && !courseName.includes(search)) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'all' && payment.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [payments, searchValue, statusFilter]);

  // Configure mobile action bar
  useEffect(() => {
    if (isMobile) {
      setActions({
        search: {
          id: 'search',
          icon: Search,
          label: 'Buscar',
          onClick: () => {
            // Popover is handled in MobileActionBar
          },
        },
        filter: {
          id: 'filter',
          icon: Filter,
          label: 'Filtros',
          onClick: () => {
            // Popover is handled in MobileActionBar
          },
        },
        notifications: {
          id: 'notifications',
          icon: Bell,
          label: 'Notificaciones',
          onClick: () => {
            // Popover is handled in MobileActionBar
          },
        },
      });
      setShowActionBar(true);
    }

    // Cleanup when component unmounts
    return () => {
      if (isMobile) {
        clearActions();
      }
    };
  }, [isMobile, setActions, setShowActionBar, clearActions]);

  // Separate effect for filter configuration
  useEffect(() => {
    if (isMobile) {
      setFilterConfig({
        filters: [
          {
            label: 'Filtrar por estado',
            value: statusFilter,
            onChange: (value: string) => setStatusFilter(value as typeof statusFilter),
            placeholder: 'Todos los estados',
            allOptionLabel: 'Todos los estados',
            options: [
              { value: 'pending', label: 'Pendientes' },
              { value: 'approved', label: 'Aprobados' },
              { value: 'rejected', label: 'Rechazados' }
            ]
          }
        ],
        onClearFilters: () => {
          setSearchValue("");
          setMobileSearchValue("");
          setStatusFilter("all");
        }
      });
    }
  }, [statusFilter, isMobile]);

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
      width: '20%',
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
      key: 'product',
      label: 'Producto',
      width: '25%',
      render: (payment: BankTransferPayment) => (
        <span className="text-sm">{payment.course_prices?.courses?.title || 'N/A'}</span>
      ),
    },
    {
      key: 'amount',
      label: 'Monto',
      width: '12%',
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
      width: '13%',
      render: (payment: BankTransferPayment) => {
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
      },
    },
  ];

  const pendingCount = payments.filter(p => p.status === 'pending').length;

  const filterTabs = [
    { value: 'pending', label: `Pendientes (${pendingCount})` },
    { value: 'approved', label: `Aprobados (${payments.filter(p => p.status === 'approved').length})` },
    { value: 'rejected', label: `Rechazados (${payments.filter(p => p.status === 'rejected').length})` },
    { value: 'all', label: `Todos (${payments.length})` },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs - 2 columns in one row */}
      <div className="grid grid-cols-2 gap-4">
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

      {/* Filtros con Tabs */}
      <Tabs
        tabs={filterTabs}
        value={statusFilter}
        onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
      />

      {/* Tabla */}
      <Table
        columns={columns}
        data={filteredPayments}
        isLoading={isLoading}
        rowActions={(payment) => [
          {
            icon: Eye,
            label: 'Ver',
            onClick: () => handleViewReceipt(payment)
          }
        ]}
        renderCard={(payment) => (
          <AdminPaymentTransferRow
            payment={payment}
            onViewReceipt={handleViewReceipt}
            density="comfortable"
          />
        )}
        emptyStateConfig={{
          icon: <Inbox />,
          title: isLoading ? 'Cargando...' : 'No hay pagos',
          description: statusFilter === 'all' 
            ? 'No se han registrado pagos por transferencia bancaria.'
            : `No hay pagos ${statusFilter === 'pending' ? 'pendientes' : statusFilter === 'approved' ? 'aprobados' : 'rechazados'}.`
        }}
      />
    </div>
  );
};

export default AdminPaymentsTransfersTab;
