import { useState, useMemo, useEffect } from "react";
import { Plus, Edit, Trash2, Search, Filter, Bell } from "lucide-react";
import { format } from "date-fns";

import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { Button } from "@/components/ui/button";
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui-custom/KPICard';

import { useCurrentUser } from "@/hooks/use-current-user";
import { useGlobalModalStore } from '@/components/modal';
import { useGeneralCosts } from "@/features/general-costs/hooks/use-general-costs";
import { useDeleteGeneralCost } from "@/features/general-costs/hooks/use-delete-general-cost";
import { useReplaceGeneralCost } from "@/features/general-costs/hooks/use-replace-general-cost";
import { useGeneralCostsPayments } from "@/hooks/use-general-costs-payments";
import GeneralCostRow from "@/features/finances/components/GeneralCostRow";
import type { GeneralCost } from "@/features/general-costs/types";
import { useActionBarMobile } from '@/layouts';
import { useMobile } from '@/hooks/use-mobile';
import { convertToBaseCurrency, format as formatMoneyAmount, formatSubValue } from '@/lib/money';
import { calculateMonetaryKPI, calculateCountKPI } from '@/lib/kpis';
import { useOrganizationDefaultCurrency } from '@/hooks/use-currencies';
import { parseLocalDate } from '@/lib/date-utils';

interface GeneralCostsListProps {
  onNewGeneralCost?: () => void;
}

export default function GeneralCostsList({ onNewGeneralCost }: GeneralCostsListProps) {
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const organizationId = userData?.organization?.id || null;
  const deleteGeneralCost = useDeleteGeneralCost(organizationId);
  const replaceGeneralCost = useReplaceGeneralCost(organizationId);
  
  const [searchQuery, setSearchQuery] = useState('');

  // Mobile Action Bar
  const {
    setActions,
    setShowActionBar,
    clearActions,
    searchValue: mobileSearchValue,
    setSearchValue: setMobileSearchValue
  } = useActionBarMobile();
  const isMobile = useMobile();

  // Sync search values between mobile and desktop
  useEffect(() => {
    if (isMobile && mobileSearchValue !== searchQuery) {
      setSearchQuery(mobileSearchValue);
    }
  }, [mobileSearchValue, isMobile]);

  const handleCreateGeneralCost = () => {
    if (onNewGeneralCost) {
      onNewGeneralCost();
    } else {
      openModal('general-costs', {
        organizationId
      });
    }
  };

  const { data: generalCosts = [], isLoading } = useGeneralCosts(organizationId);
  const { data: payments = [] } = useGeneralCostsPayments(organizationId ?? undefined);
  const { data: defaultCurrency } = useOrganizationDefaultCurrency(organizationId ?? undefined);

  // Configure Mobile Action Bar
  useEffect(() => {
    if (!isMobile) return;

    setActions({
      search: {
        id: 'search',
        icon: Search,
        label: 'Buscar',
        onClick: () => { },
      },
      create: {
        id: 'create',
        icon: Plus,
        label: 'Nuevo Gasto',
        onClick: handleCreateGeneralCost,
        variant: 'primary'
      },
      filter: {
        id: 'filter',
        icon: Filter,
        label: 'Filtros',
        onClick: () => { },
      },
      notifications: {
        id: 'notifications',
        icon: Bell,
        label: 'Notificaciones',
        onClick: () => { },
      },
    });
    setShowActionBar(true);

    return () => {
      clearActions();
      setShowActionBar(false);
      setMobileSearchValue('');
    };
  }, [isMobile, setActions, setShowActionBar, clearActions, setMobileSearchValue]);

  // Calculate KPIs
  const kpis = useMemo(() => {
    const totalConcepts = generalCosts.length;
    const usedConcepts = generalCosts.filter(gc => 
      payments.some(p => p.general_cost_id === gc.id)
    ).length;
    const unusedConcepts = totalConcepts - usedConcepts;

    return {
      totalConcepts: calculateCountKPI({
        count: totalConcepts,
        label: 'Conceptos activos'
      }),
      usedConcepts: calculateCountKPI({
        count: usedConcepts,
        label: 'Con pagos asociados'
      }),
      unusedConcepts: calculateCountKPI({
        count: unusedConcepts,
        label: 'Sin pagos'
      })
    };
  }, [generalCosts, payments]);

  // Filter and sort
  const filteredGeneralCosts = useMemo(() => {
    return generalCosts
      .filter(gc => {
        const searchLower = searchQuery.toLowerCase();
        const nameMatch = gc.name?.toLowerCase().includes(searchLower);
        const descriptionMatch = gc.description?.toLowerCase().includes(searchLower);
        const categoryMatch = gc.category?.name?.toLowerCase().includes(searchLower);
        return !searchQuery || nameMatch || descriptionMatch || categoryMatch;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }));
  }, [generalCosts, searchQuery]);

  // Build enriched data for table
  const enrichedGeneralCosts = useMemo(() => {
    return filteredGeneralCosts.map(gc => {
      const associatedPayments = payments.filter(p => p.general_cost_id === gc.id);
      const lastPayment = associatedPayments.length > 0 
        ? associatedPayments.sort((a, b) => 
            parseLocalDate(b.payment_date)!.getTime() - parseLocalDate(a.payment_date)!.getTime()
          )[0]
        : null;

      // Calculate total paid
      const totalPaidKPI = calculateMonetaryKPI({
        items: associatedPayments.map(p => ({
          amount: p.amount,
          currency_id: p.currency_id,
          exchange_rate: p.exchange_rate
        })),
        baseCurrencyId: defaultCurrency?.id,
        symbol: defaultCurrency?.symbol || '$'
      });

      return {
        ...gc,
        paymentCount: associatedPayments.length,
        lastPaymentDate: lastPayment?.payment_date,
        totalPaidKPI,
        associatedPayments
      };
    });
  }, [filteredGeneralCosts, payments, organizationId, defaultCurrency?.id]);

  // Column definitions
  const columns = [
    {
      key: 'name',
      label: 'Gasto General',
      render: (item: typeof enrichedGeneralCosts[0]) => (
        <div className="space-y-1">
          <div className="font-medium text-sm">{item.name}</div>
          <div className="text-xs text-muted-foreground">
            {item.category?.name || 'Sin categoría'}
          </div>
        </div>
      )
    },
    {
      key: 'usage',
      label: 'Uso',
      render: (item: typeof enrichedGeneralCosts[0]) => {
        if (item.paymentCount === 0) {
          return (
            <div className="space-y-1">
              <div className="text-sm font-medium text-muted-foreground">Sin uso</div>
            </div>
          );
        }
        return (
          <div className="space-y-1">
            <div className="text-sm font-medium">Usado {item.paymentCount} {item.paymentCount === 1 ? 'vez' : 'veces'}</div>
            {item.lastPaymentDate && (
              <div className="text-xs text-muted-foreground">
                Último pago: {format(parseLocalDate(item.lastPaymentDate)!, 'dd/MM/yyyy')}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'totalPaid',
      label: 'Total Pagado',
      render: (item: typeof enrichedGeneralCosts[0]) => {
        if (item.paymentCount === 0) {
          return <div className="text-sm text-muted-foreground">—</div>;
        }
        const breakdownText = item.totalPaidKPI.breakdown && item.totalPaidKPI.breakdown.length > 1
          ? formatSubValue(item.totalPaidKPI.breakdown)
          : undefined;
        return (
          <div className="space-y-1">
            <div className="text-sm font-medium">
              {formatMoneyAmount(item.totalPaidKPI.value, defaultCurrency?.symbol || '$')}
            </div>
            {breakdownText && (
              <div className="text-xs text-muted-foreground">
                {breakdownText}
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'description',
      label: 'Descripción',
      render: (item: typeof enrichedGeneralCosts[0]) => (
        <div className="text-sm text-muted-foreground line-clamp-2">
          {item.description || '—'}
        </div>
      )
    }
  ];

  // Handle edit
  const handleEdit = (gc: GeneralCost) => {
    openModal('general-costs', {
      organizationId: userData?.organization?.id,
      generalCostId: gc.id
    });
  };

  // Handle delete with replace logic
  const handleDelete = (gc: GeneralCost) => {
    const otherGeneralCosts = generalCosts.filter(g => g.id !== gc.id);
    const hasReplacements = otherGeneralCosts.length > 0;
    const mode = hasReplacements ? 'replace' : 'delete';
    const associatedPayments = payments.filter(p => p.general_cost_id === gc.id);
    
    const consequences: string[] = [];
    if (associatedPayments.length > 0) {
      consequences.push(`${associatedPayments.length} pago${associatedPayments.length === 1 ? '' : 's'} está${associatedPayments.length === 1 ? '' : 'n'} asociado${associatedPayments.length === 1 ? '' : 's'}`);
      consequences.push('Puedes reemplazarlos con otro concepto o eliminar sin reemplazar');
    }
    
    openModal('delete-confirmation', {
      mode,
      title: 'Eliminar concepto de gasto',
      description: `¿Estás seguro de que quieres eliminar "${gc.name}"?`,
      itemName: gc.name,
      consequences: consequences.length > 0 ? consequences : undefined,
      replacementOptions: mode === 'replace' ? otherGeneralCosts
        .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base' }))
        .map(g => ({ label: g.name, value: g.id })) : undefined,
      currentId: gc.id,
      onDelete: () => {
        deleteGeneralCost.mutate(gc.id);
      },
      onReplace: (newId: string) => {
        replaceGeneralCost.mutate({ oldId: gc.id, newId });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">Cargando gastos generales...</div>
      </div>
    );
  }

  if (generalCosts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState
          icon={<Plus className="w-8 h-8 text-muted-foreground" />}
          title="No hay conceptos de gastos generales"
          description="Comienza agregando tu primer concepto para organizar tus gastos generales."
          action={
            <Button onClick={handleCreateGeneralCost}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Gasto General
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard data-testid="stat-card-total-concepts">
          <StatCardTitle showArrow={false}>
            Total Conceptos
          </StatCardTitle>
          <StatCardValue>
            {kpis.totalConcepts.value}
          </StatCardValue>
          <StatCardMeta>
            {typeof kpis.totalConcepts.meta === 'string' ? kpis.totalConcepts.meta : 'Conceptos activos'}
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="stat-card-used-concepts">
          <StatCardTitle showArrow={false}>
            Utilizados
          </StatCardTitle>
          <StatCardValue>
            {kpis.usedConcepts.value}
          </StatCardValue>
          <StatCardMeta>
            {typeof kpis.usedConcepts.meta === 'string' ? kpis.usedConcepts.meta : 'Con pagos'}
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="stat-card-unused-concepts">
          <StatCardTitle showArrow={false}>
            Sin Uso
          </StatCardTitle>
          <StatCardValue>
            {kpis.unusedConcepts.value}
          </StatCardValue>
          <StatCardMeta>
            {typeof kpis.unusedConcepts.meta === 'string' ? kpis.unusedConcepts.meta : 'Sin pagos'}
          </StatCardMeta>
        </StatCard>
      </div>

      {/* Table */}
      <Table
        data={enrichedGeneralCosts}
        columns={columns}
        topBar={{
          searchValue: searchQuery,
          onSearchChange: setSearchQuery,
          showSearch: true
        }}
        rowActions={(item) => [
          {
            icon: Edit,
            label: 'Editar',
            onClick: () => handleEdit(item)
          },
          {
            icon: Trash2,
            label: 'Eliminar',
            onClick: () => handleDelete(item),
            variant: 'destructive' as const
          }
        ]}
        renderCard={(item) => (
          <GeneralCostRow
            generalCost={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
            enableSwipe={true}
          />
        )}
      />
    </div>
  );
}
