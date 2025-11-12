import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { Badge } from '@/components/ui/badge';
import { Inbox, Search, Bell, Edit, Trash2 } from 'lucide-react';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useActionBarMobile } from '@/components/layout/mobile/ActionBarMobileContext';
import { useMobile } from '@/hooks/use-mobile';

interface Plan {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  billing_type: string;
  features: any;
}

const AdminPlansTab = () => {
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

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ['plans'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not available');

      const { data, error } = await supabase
        .from('plans')
        .select('id, name, slug, is_active, billing_type, features')
        .order('name');

      if (error) throw error;
      return (data || []) as Plan[];
    },
  });

  const filteredPlans = useMemo(() => {
    if (!searchValue) return plans;

    const search = searchValue.toLowerCase();
    return plans.filter(plan => {
      const name = plan.name?.toLowerCase() || '';
      const slug = plan.slug?.toLowerCase() || '';
      
      return name.includes(search) || slug.includes(search);
    });
  }, [plans, searchValue]);

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

  const handleRowClick = (plan: Plan) => {
    openModal('plan', { plan, isEditing: true });
  };

  const handleEdit = (plan: Plan) => {
    openModal('plan', { plan, isEditing: true });
  };

  const handleDelete = (plan: Plan) => {
    console.log('Delete plan:', plan.id);
  };

  const columns = [
    {
      key: 'name',
      label: 'Nombre',
      width: '25%',
      render: (plan: Plan) => (
        <span className="font-medium text-sm">
          {plan.name}
        </span>
      ),
    },
    {
      key: 'slug',
      label: 'Slug',
      width: '20%',
      render: (plan: Plan) => (
        <span className="text-sm text-muted-foreground font-mono">
          {plan.slug}
        </span>
      ),
    },
    {
      key: 'billing_type',
      label: 'Tipo de Facturación',
      width: '20%',
      render: (plan: Plan) => {
        const billingTypeLabels: Record<string, string> = {
          'per_user': 'Por Usuario',
          'flat_rate': 'Tarifa Fija'
        };
        return (
          <Badge variant="outline" className="text-xs">
            {billingTypeLabels[plan.billing_type] || plan.billing_type}
          </Badge>
        );
      },
    },
    {
      key: 'features',
      label: 'Features',
      width: '23%',
      render: (plan: Plan) => {
        const featureCount = Array.isArray(plan.features) 
          ? plan.features.length 
          : (plan.features ? Object.keys(plan.features).length : 0);
        return (
          <span className="text-xs text-muted-foreground">
            {featureCount > 0 ? `${featureCount} característica${featureCount !== 1 ? 's' : ''}` : 'Sin características'}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Estado',
      width: '12%',
      render: (plan: Plan) => (
        <Badge 
          variant={plan.is_active ? "default" : "secondary"}
          className={plan.is_active ? "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-400" : ""}
        >
          {plan.is_active ? 'Activo' : 'Inactivo'}
        </Badge>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Table
        columns={columns}
        data={filteredPlans}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        rowActions={(plan: Plan) => [
          {
            icon: Edit,
            label: 'Editar',
            onClick: () => handleEdit(plan)
          },
          {
            icon: Trash2,
            label: 'Eliminar',
            onClick: () => handleDelete(plan),
            variant: 'destructive' as const
          }
        ]}
        emptyStateConfig={{
          icon: <Inbox />,
          title: isLoading ? 'Cargando...' : 'No hay planes configurados',
          description: 'Crea planes de suscripción para tus usuarios.',
          actionButton: {
            label: 'Nuevo Plan',
            onClick: () => openModal('plan', {})
          }
        }}
      />
    </div>
  );
};

export default AdminPlansTab;
