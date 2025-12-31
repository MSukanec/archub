import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Table, type Column } from '@/components/shared/table/Table';
import { Badge } from '@/components/ui/badge';
import { AppCard, AppCardTitle, AppCardValue, AppCardMeta } from '@/components/shared/AppCard';
import { DollarSign, TrendingUp, CreditCard, Inbox, Search, Bell, Banknote, Edit, Trash2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { es } from 'date-fns/locale';
import { useActionBarMobile } from '@/layouts';
import { useMobile } from '@/hooks/use-mobile';
import { useGlobalModalStore } from '@/components/modal';
import { useToast } from '@/hooks/use-toast';
import { queryClient, apiRequest } from '@/lib/queryClient';

interface Payment {
  id: string;
  provider: string;
  provider_payment_id: string | null;
  user_id: string;
  course_id: string;
  amount: number;
  currency: string;
  exchange_rate: number | null;
  status: string;
  created_at: string;
  approved_at: string | null;
  product_type: string | null;
  product_id: string | null;
  organization_id: string | null;
  metadata: any;
  users: {
    auth_id: string;
    full_name: string | null;
    email: string;
  };
  courses: {
    id: string;
    title: string;
    slug: string;
  } | null;
  coupon_redemptions?: {
    coupon_code?: string;
    discount?: number;
  } | null;
}

const AdminPaymentsTab = () => {
  const isMobile = useMobile();
  const { openModal } = useGlobalModalStore();
  const { toast } = useToast();
  
  const { 
    setActions, 
    setShowActionBar, 
    clearActions,
    setFilterConfig,
    searchValue: mobileSearchValue,
    setSearchValue: setMobileSearchValue
  } = useActionBarMobile();

  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    if (isMobile && mobileSearchValue !== searchValue) {
      setSearchValue(mobileSearchValue);
    }
  }, [mobileSearchValue, isMobile]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
    if (isMobile) {
      setMobileSearchValue(value);
    }
  };

  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: ['/api/admin/payments/all'],
  });

  const filteredPayments = useMemo(() => {
    if (!searchValue.trim()) return payments;
    const search = searchValue.toLowerCase();
    return payments.filter(payment => {
      const userName = payment.users?.full_name?.toLowerCase() || '';
      const userEmail = payment.users?.email?.toLowerCase() || '';
      const courseName = payment.courses?.title?.toLowerCase() || '';
      const provider = payment.provider?.toLowerCase() || '';
      return userName.includes(search) || 
             userEmail.includes(search) || 
             courseName.includes(search) ||
             provider.includes(search);
    });
  }, [payments, searchValue]);

  const { data: exchangeRateData } = useQuery({
    queryKey: ['exchange-rate-usd-ars'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exchange_rates')
        .select('rate')
        .eq('from_currency', 'USD')
        .eq('to_currency', 'ARS')
        .eq('is_active', true)
        .single();
      
      if (error) {
        console.error('Error fetching exchange rate:', error);
        return 1200;
      }
      return Number(data?.rate) || 1200;
    },
  });

  const exchangeRate = exchangeRateData || 1200;

  const deletePaymentMutation = useMutation({
    mutationFn: async (paymentId: string) => {
      return apiRequest('DELETE', `/api/admin/payments/${paymentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payments/all'] });
      toast({
        title: 'Pago eliminado',
        description: 'El pago ha sido eliminado correctamente.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el pago.',
        variant: 'destructive',
      });
    },
  });

  const handleEdit = (payment: Payment) => {
    openModal('admin-payments', {
      payment: payment,
      isEditing: true,
    });
  };

  const handleDelete = (payment: Payment) => {
    openModal('delete-confirmation', {
      mode: 'dangerous',
      title: 'Eliminar Pago',
      description: `¿Estás seguro que deseas eliminar este pago de ${payment.users?.full_name || payment.users?.email}? Esta acción no se puede deshacer.`,
      itemName: payment.users?.full_name || payment.users?.email,
      destructiveActionText: 'Eliminar Pago',
      onDelete: () => deletePaymentMutation.mutate(payment.id),
      isLoading: deletePaymentMutation.isPending,
    });
  };

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    const paymentsThisMonth = payments.filter(p => 
      isWithinInterval(new Date(p.created_at), { start: currentMonthStart, end: currentMonthEnd })
    );

    const historicalARS = payments
      .filter(p => p.currency === 'ARS')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const historicalUSD = payments
      .filter(p => p.currency === 'USD')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const monthlyARS = paymentsThisMonth
      .filter(p => p.currency === 'ARS')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const monthlyUSD = paymentsThisMonth
      .filter(p => p.currency === 'USD')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    let historicalDollarized = historicalUSD;
    payments
      .filter(p => p.currency === 'ARS')
      .forEach(p => {
        const rate = p.exchange_rate ? Number(p.exchange_rate) : exchangeRate;
        historicalDollarized += Number(p.amount) / rate;
      });

    let monthlyDollarized = monthlyUSD;
    paymentsThisMonth
      .filter(p => p.currency === 'ARS')
      .forEach(p => {
        const rate = p.exchange_rate ? Number(p.exchange_rate) : exchangeRate;
        monthlyDollarized += Number(p.amount) / rate;
      });

    return {
      totalPayments: payments.length,
      paymentsThisMonth: paymentsThisMonth.length,
      historicalARS,
      historicalUSD,
      monthlyARS,
      monthlyUSD,
      historicalDollarized,
      monthlyDollarized,
    };
  }, [payments, exchangeRate]);

  useEffect(() => {
    if (isMobile) {
      setActions({
        search: {
          id: 'search',
          icon: Search,
          label: 'Buscar',
          onClick: () => {},
        },
        notifications: {
          id: 'notifications',
          icon: Bell,
          label: 'Notificaciones',
          onClick: () => {},
        },
      });
      setShowActionBar(true);
    }

    return () => {
      if (isMobile) {
        clearActions();
      }
    };
  }, [isMobile, setActions, setShowActionBar, clearActions]);

  useEffect(() => {
    if (isMobile) {
      setFilterConfig({
        filters: [],
        onClearFilters: () => {
          setSearchValue("");
          setMobileSearchValue("");
        }
      });
    }
  }, [isMobile, setFilterConfig, setMobileSearchValue]);

  const columns: Column<Payment>[] = [
    {
      key: 'created_at',
      label: 'Fecha',
      sortable: true,
      render: (payment) => (
        <span className="text-sm text-muted-foreground" data-testid={`text-date-${payment.id}`}>
          {format(new Date(payment.created_at), 'dd/MM/yy HH:mm', { locale: es })}
        </span>
      ),
    },
    {
      key: 'user',
      label: 'Usuario',
      render: (payment) => (
        <div className="flex flex-col" data-testid={`text-user-${payment.id}`}>
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
      render: (payment) => {
        if (payment.courses?.title) {
          return <span className="text-sm" data-testid={`text-product-${payment.id}`}>{payment.courses.title}</span>;
        }
        const productTypeLabels: Record<string, string> = {
          'subscription': 'Suscripción',
          'course': 'Curso',
        };
        return (
          <span className="text-sm" data-testid={`text-product-${payment.id}`}>
            {payment.product_type ? productTypeLabels[payment.product_type] || payment.product_type : 'N/A'}
          </span>
        );
      },
    },
    {
      key: 'provider',
      label: 'Proveedor',
      render: (payment) => {
        const providerLabels: Record<string, string> = {
          'mercadopago': 'Mercado Pago',
          'paypal': 'PayPal',
          'bank_transfer': 'Transferencia',
          'manual': 'Manual'
        };
        const providerColors: Record<string, string> = {
          'mercadopago': '#00b3ff',
          'paypal': '#0070ba',
          'bank_transfer': '#6b7280',
          'manual': '#6b7280'
        };
        const provider = payment.provider?.toLowerCase() || '';
        return (
          <Badge 
            variant="neutral"
            data-testid={`badge-provider-${payment.id}`}
          >
            {providerLabels[provider] || payment.provider}
          </Badge>
        );
      },
    },
    {
      key: 'amount',
      label: 'Monto',
      sortable: true,
      render: (payment) => (
        <div className="flex flex-col" data-testid={`text-amount-${payment.id}`}>
          <span className="font-semibold text-sm">
            {new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: payment.currency,
              minimumFractionDigits: 0,
            }).format(payment.amount)}
          </span>
          <span className="text-xs text-muted-foreground">
            Cot. {payment.exchange_rate ? Number(payment.exchange_rate).toFixed(2) : '1.00'}
          </span>
        </div>
      ),
    },
    {
      key: 'coupon',
      label: 'Cupón',
      render: (payment) => {
        const coupon = payment.coupon_redemptions;
        if (!coupon) {
          return <span className="text-xs text-muted-foreground" data-testid={`text-coupon-${payment.id}`}>-</span>;
        }
        return (
          <div className="flex flex-col" data-testid={`text-coupon-${payment.id}`}>
            <span className="font-mono text-xs font-medium">{coupon.coupon_code || 'N/A'}</span>
            <span className="text-xs text-muted-foreground">
              -{coupon.discount ? new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: payment.currency,
                minimumFractionDigits: 0,
              }).format(coupon.discount) : '0'}
            </span>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Estado',
      render: (payment) => (
        <Badge 
          variant="success"
          data-testid={`badge-status-${payment.id}`}
        >
          Completado
        </Badge>
      ),
    },
  ];

  const formatARS = (value: number) => new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

  const formatUSD = (value: number) => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <AppCard data-testid="kpi-total-pagos">
          <div className="flex items-center justify-between">
            <AppCardTitle>Total Pagos</AppCardTitle>
            <DollarSign className="h-5 w-5 text-accent" />
          </div>
          <AppCardValue>{stats.totalPayments}</AppCardValue>
          <AppCardMeta>Este mes: {stats.paymentsThisMonth}</AppCardMeta>
        </AppCard>

        <AppCard data-testid="kpi-total">
          <div className="flex items-center justify-between">
            <AppCardTitle>Total</AppCardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <AppCardValue>{formatUSD(stats.historicalDollarized)}</AppCardValue>
          <AppCardMeta>{formatARS(stats.historicalARS)} + {formatUSD(stats.historicalUSD)}</AppCardMeta>
        </AppCard>

        <AppCard data-testid="kpi-subtotal-ars">
          <div className="flex items-center justify-between">
            <AppCardTitle>Subtotal ARS</AppCardTitle>
            <Banknote className="h-5 w-5 text-blue-600" />
          </div>
          <AppCardValue>{formatARS(stats.historicalARS)}</AppCardValue>
          <AppCardMeta>Este mes: {formatARS(stats.monthlyARS)}</AppCardMeta>
        </AppCard>

        <AppCard data-testid="kpi-subtotal-usd">
          <div className="flex items-center justify-between">
            <AppCardTitle>Subtotal USD</AppCardTitle>
            <CreditCard className="h-5 w-5 text-emerald-600" />
          </div>
          <AppCardValue>{formatUSD(stats.historicalUSD)}</AppCardValue>
          <AppCardMeta>Este mes: {formatUSD(stats.monthlyUSD)}</AppCardMeta>
        </AppCard>
      </div>

      <Table<Payment>
        columns={columns}
        data={filteredPayments}
        isLoading={isLoading}
        defaultSort={{ key: 'created_at', direction: 'desc' }}
        rowActions={(payment) => [
          {
            icon: Edit,
            label: 'Editar',
            onClick: () => handleEdit(payment),
          },
          {
            icon: Trash2,
            label: 'Eliminar',
            onClick: () => handleDelete(payment),
            variant: 'destructive' as const,
          },
        ]}
        emptyStateConfig={{
          icon: <Inbox />,
          title: isLoading ? 'Cargando...' : 'No hay pagos',
          description: 'No se han registrado pagos completados.'
        }}
        topBar={{
          showSearch: true,
          searchValue: searchValue,
          onSearchChange: handleSearchChange,
        }}
      />
    </div>
  );
};

export default AdminPaymentsTab;
