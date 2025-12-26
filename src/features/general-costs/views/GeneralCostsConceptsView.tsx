import { useState, useMemo, useEffect } from "react";
import { Plus, Edit, Trash2, Search, Filter, Bell, Layers, CheckCircle, XCircle, DollarSign } from "lucide-react";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { SparklineChart } from '@/components/charts/sparkline/SparklineChart';
import { Table } from '@/components/shared/table';
import type { Column } from '@/components/shared/table';
import { EmptyState } from '@/components/shared/EmptyState';
import { Button } from "@/components/ui/button";
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/shared/AppCard';
import { useCurrentUser } from "@/hooks/use-current-user";
import { useGlobalModalStore } from '@/components/modal';
import { useGeneralCosts } from "@/features/general-costs/hooks/use-general-costs";
import { useDeleteGeneralCost } from "@/features/general-costs/hooks/use-delete-general-cost";
import { useReplaceGeneralCost } from "@/features/general-costs/hooks/use-replace-general-cost";
import { useGeneralCostsPayments } from "../hooks/use-general-costs-payments";
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
export default function GeneralCostsConceptsView({ onNewGeneralCost }: GeneralCostsListProps) {
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
    const usagePercent = totalConcepts > 0 ? Math.round((usedConcepts / totalConcepts) * 100) : 0;
    // Total pagado en todos los conceptos
    const totalPaid = calculateMonetaryKPI({
      items: payments.map(p => ({
        amount: p.amount,
        currency_id: p.currency_id,
        currency: p.currency,
        exchange_rate: p.exchange_rate
      })),
      baseCurrencyId: defaultCurrency?.code,
      symbol: defaultCurrency?.symbol || '$'
    });
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
      }),
      usagePercent,
      totalPaid
    };
  }, [generalCosts, payments, defaultCurrency]);
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
      .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base'}));
  }, [generalCosts, searchQuery]);
  // Build enriched data for table
  const enrichedGeneralCosts = useMemo(() => {
    const now = new Date();
    
    return filteredGeneralCosts.map(gc => {
      const associatedPayments = payments.filter(p => p.general_cost_id === gc.id);
      const lastPayment = associatedPayments.length > 0 
        ? associatedPayments.sort((a, b) => 
            parseLocalDate(b.payment_date)!.getTime() - parseLocalDate(a.payment_date)!.getTime()
          )[0]
        : null;
      // Calculate total paid - pass currency object with code for proper conversion
      const totalPaidKPI = calculateMonetaryKPI({
        items: associatedPayments.map(p => ({
          amount: p.amount,
          currency_id: p.currency_id,
          currency: p.currency,
          exchange_rate: p.exchange_rate
        })),
        baseCurrencyId: defaultCurrency?.code,
        symbol: defaultCurrency?.symbol || '$'
      });
      // Calculate monthly trend data (last 6 months)
      const trendData: { value: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(now, i);
        const monthStart = startOfMonth(monthDate);
        const monthEnd = endOfMonth(monthDate);
        
        const monthPayments = associatedPayments.filter(p => {
          const paymentDate = parseLocalDate(p.payment_date);
          return paymentDate && paymentDate >= monthStart && paymentDate <= monthEnd;
        });
        
        // Sum payments converted to base currency
        const monthTotal = monthPayments.reduce((sum, p) => {
          const converted = convertToBaseCurrency(
            p.currency?.code || defaultCurrency?.code || 'ARS',
            defaultCurrency?.code || 'ARS',
            p.amount,
            p.exchange_rate || 1
          );
          return sum + converted;
        }, 0);
        
        trendData.push({ value: monthTotal });
      }
      return {
        ...gc,
        paymentCount: associatedPayments.length,
        lastPaymentDate: lastPayment?.payment_date,
        totalPaidKPI,
        associatedPayments,
        trendData
      };
    });
  }, [filteredGeneralCosts, payments, defaultCurrency]);
  // Column definitions
  const columns: Column<typeof enrichedGeneralCosts[0]>[] = useMemo(() => [
    {
      key: 'name'as const,
      label: 'Gasto General',
      type: 'medium-text'as const,
      sortable: false,
      render: (item: typeof enrichedGeneralCosts[0]) => (
        <div className="flex flex-col gap-0.5">
          <div className="font-bold text-sm">{item.name}</div>
          <div className="text-xs text-muted-foreground">
            {item.category?.name || 'Sin categoría'}
          </div>
        </div>
      )
    },
    {
      key: 'usage'as const,
      label: 'Uso',
      type: 'medium-text'as const,
      sortable: false,
      render: (item: typeof enrichedGeneralCosts[0]) => {
        if (item.paymentCount === 0) {
          return (
            <div className="flex flex-col gap-0.5">
              <div className="text-sm text-muted-foreground">Sin uso</div>
            </div>
          );
        }
        return (
          <div className="flex flex-col gap-0.5">
            <div className="text-sm font-bold">Usado {item.paymentCount} {item.paymentCount === 1 ? 'vez': 'veces'}</div>
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
      key: 'totalPaid'as const,
      label: 'Total Pagado',
      type: 'amount'as const,
      sortable: false,
      render: (item: typeof enrichedGeneralCosts[0]) => {
        if (item.paymentCount === 0) {
          return <span className="text-sm text-muted-foreground">—</span>;
        }
        // Check if there are multiple unique currencies in payments
        const uniqueCurrencies = new Set(item.associatedPayments.map(p => p.currency_id));
        const hasMultipleCurrencies = uniqueCurrencies.size > 1;
        
        const breakdownText = hasMultipleCurrencies && item.totalPaidKPI.breakdown && item.totalPaidKPI.breakdown.length > 0
          ? formatSubValue(item.totalPaidKPI.breakdown)
          : undefined;
        return (
          <div className="flex flex-col gap-0.5">
            <div className="text-sm font-bold">
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
      key: 'trend'as const,
      label: 'Tendencia (6 meses)',
      type: 'medium-text'as const,
      sortable: false,
      render: (item: typeof enrichedGeneralCosts[0]) => (
        <SparklineChart 
          data={item.trendData.map(d => d.value)} 
          color="var(--accent)"
        />
      )
    },
    {
      key: 'description'as const,
      label: 'Descripción',
      type: 'long-text'as const,
      sortable: false,
      render: (item: typeof enrichedGeneralCosts[0]) => (
        <span className="text-sm text-muted-foreground line-clamp-2">
          {item.description || '—'}
        </span>
      )
    }
  ], [defaultCurrency]);
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
    const mode = hasReplacements ? 'replace': 'delete';
    const associatedPayments = payments.filter(p => p.general_cost_id === gc.id);
    
    const consequences: string[] = [];
    if (associatedPayments.length > 0) {
      consequences.push(`${associatedPayments.length} pago${associatedPayments.length === 1 ? '': 's'} está${associatedPayments.length === 1 ? '': 'n'} asociado${associatedPayments.length === 1 ? '': 's'}`);
      consequences.push('Puedes reemplazarlos con otro concepto o eliminar sin reemplazar');
    }
    
    openModal('delete-confirmation', {
      mode,
      title: 'Eliminar concepto de gasto',
      description: `¿Estás seguro de que quieres eliminar "${gc.name}"?`,
      itemName: gc.name,
      consequences: consequences.length > 0 ? consequences : undefined,
      replacementOptions: mode === 'replace'? otherGeneralCosts
        .sort((a, b) => a.name.localeCompare(b.name, 'es', { sensitivity: 'base'}))
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard data-testid="stat-card-total-concepts">
          <StatCardTitle showArrow={false}>
            <Layers className="h-4 w-4" />
            Total Conceptos
          </StatCardTitle>
          <StatCardValue>
            {kpis.totalConcepts.value}
          </StatCardValue>
          <StatCardMeta>
            Conceptos activos
          </StatCardMeta>
        </StatCard>
        <StatCard data-testid="stat-card-used-concepts">
          <StatCardTitle showArrow={false}>
            <CheckCircle className="h-4 w-4" />
            Utilizados
          </StatCardTitle>
          <StatCardValue>
            {kpis.usedConcepts.value}
          </StatCardValue>
          <StatCardMeta>
            {kpis.usagePercent}% del total
          </StatCardMeta>
        </StatCard>
        <StatCard data-testid="stat-card-unused-concepts">
          <StatCardTitle showArrow={false}>
            <XCircle className="h-4 w-4" />
            Sin Uso
          </StatCardTitle>
          <StatCardValue>
            {kpis.unusedConcepts.value}
          </StatCardValue>
          <StatCardMeta>
            Conceptos sin pagos
          </StatCardMeta>
        </StatCard>
        <StatCard data-testid="stat-card-total-paid">
          <StatCardTitle showArrow={false}>
            <DollarSign className="h-4 w-4" />
            Total Pagado
          </StatCardTitle>
          <StatCardValue>
            {defaultCurrency?.symbol} {kpis.totalPaid.formatted}
          </StatCardValue>
          <StatCardMeta>
            {payments.length} pagos registrados
          </StatCardMeta>
        </StatCard>
      </div>
      {/* Table */}
      <Table
        data={enrichedGeneralCosts}
        columns={columns}
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
            variant: 'destructive'as const
          }
        ]}
        emptyStateConfig={{
          title: "No hay conceptos de gastos generales",
          description: "Comienza agregando tu primer concepto para organizar tus gastos generales."
        }}
      />
    </div>
  );
}
