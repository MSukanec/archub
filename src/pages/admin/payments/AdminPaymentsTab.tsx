import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui/stat-card';
import { DollarSign, TrendingUp, CreditCard, Inbox, Search, Filter, Bell, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useActionBarMobile } from '@/components/layout/mobile/ActionBarMobileContext';
import { useMobile } from '@/hooks/use-mobile';

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
}

const AdminPaymentsTab = () => {
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

  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: ['admin-all-payments'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available');

      // Fetch payments
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      if (paymentsError) throw paymentsError;
      if (!paymentsData || paymentsData.length === 0) return [];

      // Get unique user IDs and course IDs
      const userIds = [...new Set(paymentsData.map(p => p.user_id))];
      const courseIds = [...new Set(paymentsData.map(p => p.course_id).filter(Boolean))];

      // Fetch users by auth_id
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('auth_id, full_name, email')
        .in('auth_id', userIds);

      if (usersError) throw usersError;

      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, title, slug')
        .in('id', courseIds);

      if (coursesError) throw coursesError;

      // Map users and courses to payments
      const usersMap = new Map(usersData?.map(u => [u.auth_id, u]) || []);
      const coursesMap = new Map(coursesData?.map(c => [c.id, c]) || []);

      return paymentsData.map((payment: any) => ({
        ...payment,
        users: usersMap.get(payment.user_id) || { auth_id: payment.user_id, full_name: null, email: 'Unknown' },
        courses: payment.course_id ? (coursesMap.get(payment.course_id) || null) : null
      })) as Payment[];
    },
  });

  const stats = useMemo(() => {
    const now = new Date();
    const currentMonthStart = startOfMonth(now);
    const currentMonthEnd = endOfMonth(now);

    const paymentsThisMonth = payments.filter(p => 
      isWithinInterval(new Date(p.created_at), { start: currentMonthStart, end: currentMonthEnd })
    );

    const totalAmountARS = paymentsThisMonth
      .filter(p => p.currency === 'ARS')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalAmountUSD = paymentsThisMonth
      .filter(p => p.currency === 'USD')
      .reduce((sum, p) => sum + p.amount, 0);

    return {
      totalPayments: payments.length,
      paymentsThisMonth: paymentsThisMonth.length,
      totalAmountARS,
      totalAmountUSD,
    };
  }, [payments]);

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
  }, [isMobile]);

  const columns = [
    {
      key: 'created_at',
      label: 'Fecha',
      width: '12%',
      render: (payment: Payment) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(payment.created_at), 'dd/MM/yy HH:mm', { locale: es })}
        </span>
      ),
    },
    {
      key: 'user',
      label: 'Usuario',
      width: '20%',
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
      width: '22%',
      render: (payment: Payment) => (
        <span className="text-sm">{payment.courses?.title || 'N/A'}</span>
      ),
    },
    {
      key: 'provider',
      label: 'Proveedor',
      width: '15%',
      render: (payment: Payment) => {
        const providerLabels: Record<string, string> = {
          'mercadopago': 'Mercado Pago',
          'paypal': 'PayPal',
          'bank_transfer': 'Transferencia',
          'manual': 'Manual'
        };
        return (
          <Badge variant="outline" className="text-xs">
            {providerLabels[payment.provider] || payment.provider}
          </Badge>
        );
      },
    },
    {
      key: 'amount',
      label: 'Monto',
      width: '13%',
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
      key: 'status',
      label: 'Estado',
      width: '13%',
      render: () => (
        <Badge variant="secondary" className="bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400">
          Completado
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPIs - 3 columns in one row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard>
          <div className="flex items-center justify-between">
            <StatCardTitle showArrow={false}>Total Pagos</StatCardTitle>
            <DollarSign className="h-5 w-5 text-accent" />
          </div>
          <StatCardValue>{stats.totalPayments}</StatCardValue>
          <StatCardMeta>pagos completados</StatCardMeta>
        </StatCard>

        <StatCard>
          <div className="flex items-center justify-between">
            <StatCardTitle showArrow={false}>Este Mes (ARS)</StatCardTitle>
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <StatCardValue>
            {new Intl.NumberFormat('es-AR', {
              style: 'currency',
              currency: 'ARS',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            }).format(stats.totalAmountARS)}
          </StatCardValue>
          <StatCardMeta>{stats.paymentsThisMonth} pagos</StatCardMeta>
        </StatCard>

        <StatCard>
          <div className="flex items-center justify-between">
            <StatCardTitle showArrow={false}>Este Mes (USD)</StatCardTitle>
            <CreditCard className="h-5 w-5 text-blue-600" />
          </div>
          <StatCardValue>
            {new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(stats.totalAmountUSD)}
          </StatCardValue>
          <StatCardMeta>{stats.paymentsThisMonth} pagos</StatCardMeta>
        </StatCard>
      </div>

      {/* Tabla */}
      <Table
        columns={columns}
        data={filteredPayments}
        isLoading={isLoading}
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
