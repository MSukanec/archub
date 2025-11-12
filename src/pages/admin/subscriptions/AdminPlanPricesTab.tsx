import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Badge } from '@/components/ui/badge';
import { Inbox, Search, Bell } from 'lucide-react';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useActionBarMobile } from '@/components/layout/mobile/ActionBarMobileContext';
import { useMobile } from '@/hooks/use-mobile';

interface PlanPrice {
  id: string;
  plan_id: string;
  currency_code: string;
  monthly_amount: number;
  annual_amount: number;
  provider: string;
  is_active: boolean;
  plans: {
    id: string;
    name: string;
  };
}

const AdminPlanPricesTab = () => {
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

  useEffect(() => {
    if (isMobile && mobileSearchValue !== searchValue) {
      setSearchValue(mobileSearchValue);
    }
  }, [mobileSearchValue, isMobile]);

  const { data: planPrices = [], isLoading } = useQuery<PlanPrice[]>({
    queryKey: ['plan-prices'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available');

      const { data, error } = await supabase
        .from('plan_prices')
        .select(`
          id,
          plan_id,
          currency_code,
          monthly_amount,
          annual_amount,
          provider,
          is_active,
          plans (
            id,
            name
          )
        `)
        .order('plans(name)');

      if (error) throw error;
      return (data || []) as PlanPrice[];
    },
  });

  const filteredPlanPrices = useMemo(() => {
    if (!searchValue) return planPrices;

    const search = searchValue.toLowerCase();
    return planPrices.filter(price => {
      const planName = price.plans?.name?.toLowerCase() || '';
      const currency = price.currency_code?.toLowerCase() || '';
      const provider = price.provider?.toLowerCase() || '';
      
      return planName.includes(search) || 
             currency.includes(search) || 
             provider.includes(search);
    });
  }, [planPrices, searchValue]);

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
  }, [isMobile]);

  const handleRowClick = (planPrice: PlanPrice) => {
    openModal('plan-price', { planPrice, isEditing: true });
  };

  const formatCurrency = (amount: number, currencyCode: string) => {
    const currencySymbols: Record<string, string> = {
      'ARS': '$',
      'USD': 'US$',
      'EUR': '€'
    };

    const symbol = currencySymbols[currencyCode] || currencyCode;
    return `${symbol} ${new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)}`;
  };

  const columns = [
    {
      key: 'plan',
      label: 'Plan',
      width: '25%',
      render: (price: PlanPrice) => (
        <span className="font-medium text-sm">
          {price.plans?.name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'currency',
      label: 'Moneda',
      width: '12%',
      render: (price: PlanPrice) => (
        <Badge variant="outline" className="text-xs">
          {price.currency_code}
        </Badge>
      ),
    },
    {
      key: 'monthly_amount',
      label: 'Precio Mensual',
      width: '18%',
      render: (price: PlanPrice) => (
        <span className="font-semibold text-sm">
          {formatCurrency(price.monthly_amount, price.currency_code)}
        </span>
      ),
    },
    {
      key: 'annual_amount',
      label: 'Precio Anual',
      width: '18%',
      render: (price: PlanPrice) => (
        <span className="font-semibold text-sm">
          {formatCurrency(price.annual_amount, price.currency_code)}
        </span>
      ),
    },
    {
      key: 'provider',
      label: 'Proveedor',
      width: '15%',
      render: (price: PlanPrice) => {
        const providerLabels: Record<string, string> = {
          'mercadopago': 'Mercado Pago',
          'paypal': 'PayPal',
          'any': 'Cualquiera'
        };
        return (
          <Badge variant="secondary" className="text-xs">
            {providerLabels[price.provider] || price.provider}
          </Badge>
        );
      },
    },
    {
      key: 'status',
      label: 'Estado',
      width: '12%',
      render: (price: PlanPrice) => (
        <Badge 
          variant={price.is_active ? "default" : "secondary"}
          className={price.is_active ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400" : ""}
        >
          {price.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Table
        columns={columns}
        data={filteredPlanPrices}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        emptyStateConfig={{
          icon: <Inbox />,
          title: isLoading ? 'Cargando...' : 'No hay precios configurados',
          description: 'No se han configurado precios para los planes de suscripción.'
        }}
      />
    </div>
  );
};

export default AdminPlanPricesTab;
