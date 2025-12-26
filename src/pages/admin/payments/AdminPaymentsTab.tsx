import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Table } from '@/components/shared/trees/Table';
import { Badge } from '@/components/ui/badge';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/dashboard';
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

  // Sync search values between mobile and desktop
  useEffect(() => {
    if (isMobile && mobileSearchValue !== searchValue) {
      setSearchValue(mobileSearchValue);
    }
  }, [mobileSearchValue, isMobile]);

  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: ['/api/admin/payments/all'],
  });

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
    toast({
      title: 'Función no disponible',
      description: 'La edición de pagos no está disponible actualmente.',
    });
  };

  const handleDelete = (payment: Payment) => {
    openModal('delete-confirmation', {
      mode: 'dangerous',
      title: 'Eliminar Pago',
      description: `¿Estás seguro que deseas eliminar este pago de ${payment.users?.full_name || payment.users?.email}? Esta acción no se puede deshacer.`,
      itemName: `${new Intl.NumberFormat('es-AR', { style: 'currency', currency: payment.currency, minimumFractionDigits: 0 }).format(payment.amount)} - ${payment.users?.full_name || payment.users?.email}`,
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
      .reduce((sum, p) => sum + p.amount, 0);

    const historicalUSD = payments
      .filter(p => p.currency === 'USD')
      .reduce((sum, p) => sum + p.amount, 0);

    const monthlyARS = paymentsThisMonth
      .filter(p => p.currency === 'ARS')
      .reduce((sum, p) => sum + p.amount, 0);

    const monthlyUSD = paymentsThisMonth
      .filter(p => p.currency === 'USD')
      .reduce((sum, p) => sum + p.amount, 0);

    const historicalDollarized = historicalUSD + (historicalARS / exchangeRate);
    const monthlyDollarized = monthlyUSD + (monthlyARS / exchangeRate);

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

  // Filter payments by search
  const filteredPayments = useMemo(() => {
    if (!searchValue) return payments;

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

  // Configure mobile action bar
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

  // Filter configuration
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

  const columns = [
    {
      key: 'created_at',
      label: 'Fecha',
      render: (payment: Payment) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(payment.created_at), 'dd/MM/yy HH:mm', { locale: es })}
        </span>
      ),
    },
    {
      key: 'user',
      label: 'Usuario',
      render: (payment: Payment) => (
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
      render: (payment: Payment) => {
        if (payment.courses?.title) {
          return <span className="text-sm">{payment.courses.title}</span>;
        }
        const productTypeLabels: Record<string, string> = {
          'subscription': 'Suscripción',
          'course': 'Curso',
        };
        return (
          <span className="text-sm">
            {payment.product_type ? productTypeLabels[payment.product_type] || payment.product_type : 'N/A'}
          </span>
        );
      },
    },
    {
      key: 'provider',
      label: 'Proveedor',
      render: (payment: Payment) => {
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
            variant="outline"
            style={{ 
              borderColor: providerColors[provider] || '#6b7280',
              color: providerColors[provider] || '#6b7280'
            }}
          >
            {providerLabels[provider] || payment.provider}
          </Badge>
        );
      },
    },
    {
      key: 'amount',
      label: 'Monto',
      render: (payment: Payment) => (
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
      key: 'coupon',
      label: 'Cupón',
      render: (payment: Payment) => {
        const coupon = payment.coupon_redemptions;
        if (!coupon) {
          return <span className="text-xs text-muted-foreground">-</span>;
        }
        return (
          <div className="flex flex-col">
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
      render: () => (
        <Badge variant="secondary" className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400">
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
      {/* KPIs - 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <StatCard>
          <div className="flex items-center justify-between">
            <StatCardTitle showArrow={false}>Total Pagos</StatCardTitle>
            <DollarSign className="h-5 w-5 text-accent" />
          </div>
          <StatCardValue className="text-xl md:text-3xl">{stats.totalPayments}</StatCardValue>
          <StatCardMeta>Este mes: {stats.paymentsThisMonth}</StatCardMeta>
        </StatCard>

        <StatCard>
          <div className="flex items-center justify-between">
            <StatCardTitle showArrow={false}>Total</StatCardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <StatCardValue className="text-xl md:text-3xl">
            {formatUSD(stats.historicalDollarized)}
          </StatCardValue>
          <StatCardMeta>Este mes: {formatUSD(stats.monthlyDollarized)}</StatCardMeta>
        </StatCard>

        <StatCard>
          <div className="flex items-center justify-between">
            <StatCardTitle showArrow={false}>Total (ARS)</StatCardTitle>
            <Banknote className="h-5 w-5 text-blue-600" />
          </div>
          <StatCardValue className="text-xl md:text-3xl">
            {formatARS(stats.historicalARS)}
          </StatCardValue>
          <StatCardMeta>Este mes: {formatARS(stats.monthlyARS)}</StatCardMeta>
        </StatCard>

        <StatCard>
          <div className="flex items-center justify-between">
            <StatCardTitle showArrow={false}>Total (USD)</StatCardTitle>
            <CreditCard className="h-5 w-5 text-emerald-600" />
          </div>
          <StatCardValue className="text-xl md:text-3xl">
            {formatUSD(stats.historicalUSD)}
          </StatCardValue>
          <StatCardMeta>Este mes: {formatUSD(stats.monthlyUSD)}</StatCardMeta>
        </StatCard>
      </div>

      {/* Tabla */}
      <Table
        columns={columns}
        data={filteredPayments}
        isLoading={isLoading}
        rowActions={(payment: Payment) => [
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
      />
    </div>
  );
};

export default AdminPaymentsTab;
