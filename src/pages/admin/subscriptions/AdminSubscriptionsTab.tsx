import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Badge } from '@/components/ui/badge';
import { Inbox, Search, Bell, Edit, Trash2 } from 'lucide-react';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useActionBarMobile } from '@/components/layout/mobile/ActionBarMobileContext';
import { useMobile } from '@/hooks/use-mobile';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface OrganizationSubscription {
  id: string;
  organization_id: string;
  plan_id: string;
  status: string;
  billing_period: string;
  started_at: string;
  expires_at: string;
  cancelled_at: string | null;
  amount: number;
  currency: string;
  organizations: {
    name: string;
  };
  plans: {
    name: string;
    slug: string;
  };
}

const AdminSubscriptionsTab = () => {
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

  const { data: subscriptions = [], isLoading } = useQuery<OrganizationSubscription[]>({
    queryKey: ['admin-subscriptions'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available');

      const { data, error } = await supabase
        .from('organization_subscriptions')
        .select(`
          id,
          organization_id,
          plan_id,
          status,
          billing_period,
          started_at,
          expires_at,
          cancelled_at,
          amount,
          currency,
          organizations(name),
          plans(name, slug)
        `)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return (data || []) as any;
    },
  });

  const filteredSubscriptions = useMemo(() => {
    if (!searchValue) return subscriptions;

    const search = searchValue.toLowerCase();
    return subscriptions.filter(sub => {
      const orgName = sub.organizations?.name?.toLowerCase() || '';
      const planName = sub.plans?.name?.toLowerCase() || '';
      const status = sub.status?.toLowerCase() || '';
      
      return orgName.includes(search) || planName.includes(search) || status.includes(search);
    });
  }, [subscriptions, searchValue]);

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
  }, [isMobile, setFilterConfig, setSearchValue, setMobileSearchValue]);

  const handleRowClick = (subscription: OrganizationSubscription) => {
    // TODO: Implement subscription modal
    console.log('View subscription:', subscription.id);
  };

  const handleEdit = (subscription: OrganizationSubscription) => {
    // TODO: Implement subscription modal
    console.log('Edit subscription:', subscription.id);
  };

  const handleDelete = (subscription: OrganizationSubscription) => {
    // TODO: Implement cancel subscription
    console.log('Cancel subscription:', subscription.id);
  };

  const columns = [
    {
      key: 'organization',
      label: 'Organización',
      width: '20%',
      render: (sub: OrganizationSubscription) => (
        <span className="font-medium text-sm">
          {sub.organizations?.name || 'Sin nombre'}
        </span>
      ),
    },
    {
      key: 'plan',
      label: 'Plan',
      width: '15%',
      render: (sub: OrganizationSubscription) => (
        <div className="flex flex-col gap-0.5">
          <span className="font-medium text-sm">
            {sub.plans?.name || 'Sin plan'}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {sub.plans?.slug || '-'}
          </span>
        </div>
      ),
    },
    {
      key: 'billing_period',
      label: 'Periodo',
      width: '10%',
      render: (sub: OrganizationSubscription) => (
        <Badge variant="outline" className="text-xs">
          {sub.billing_period === 'monthly' ? 'Mensual' : 'Anual'}
        </Badge>
      ),
    },
    {
      key: 'amount',
      label: 'Monto',
      width: '12%',
      render: (sub: OrganizationSubscription) => (
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-xs font-mono">
            {sub.currency}
          </Badge>
          <span className="text-sm font-medium">
            ${parseFloat(sub.amount.toString()).toFixed(2)}
          </span>
        </div>
      ),
    },
    {
      key: 'dates',
      label: 'Vigencia',
      width: '18%',
      render: (sub: OrganizationSubscription) => (
        <div className="flex flex-col gap-0.5">
          <span className="text-xs">
            <span className="text-muted-foreground">Inicio: </span>
            {format(new Date(sub.started_at), 'dd/MM/yyyy', { locale: es })}
          </span>
          <span className="text-xs">
            <span className="text-muted-foreground">Expira: </span>
            {format(new Date(sub.expires_at), 'dd/MM/yyyy', { locale: es })}
          </span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Estado',
      width: '12%',
      render: (sub: OrganizationSubscription) => {
        const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive'; className?: string }> = {
          active: { label: 'Activa', variant: 'default', className: 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400' },
          expired: { label: 'Expirada', variant: 'secondary' },
          cancelled: { label: 'Cancelada', variant: 'destructive' },
          pending: { label: 'Pendiente', variant: 'secondary', className: 'bg-yellow-100 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400' },
        };
        
        const config = statusConfig[sub.status] || { label: sub.status, variant: 'secondary' };
        
        return (
          <Badge variant={config.variant} className={config.className}>
            {config.label}
          </Badge>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <Table
        columns={columns}
        data={filteredSubscriptions}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        rowActions={(sub: OrganizationSubscription) => [
          {
            icon: Edit,
            label: 'Editar',
            onClick: () => handleEdit(sub)
          },
          {
            icon: Trash2,
            label: 'Cancelar',
            onClick: () => handleDelete(sub),
            variant: 'destructive' as const
          }
        ]}
        emptyStateConfig={{
          icon: <Inbox />,
          title: isLoading ? 'Cargando...' : 'No hay suscripciones',
          description: 'Las suscripciones activas aparecerán aquí cuando las organizaciones contraten planes.',
        }}
      />
    </div>
  );
};

export default AdminSubscriptionsTab;
