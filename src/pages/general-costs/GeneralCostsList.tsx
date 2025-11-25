import { useState, useMemo, useEffect } from "react";
import { CreditCard, Plus, Edit, Trash2, DollarSign, Receipt, Calendar, Search, Filter, Bell } from "lucide-react";

import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { Badge } from "@/components/ui/badge";
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

interface GeneralCostsListProps {
  onNewGeneralCost?: () => void;
}

export default function GeneralCostsList({ onNewGeneralCost }: GeneralCostsListProps) {
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const deleteGeneralCost = useDeleteGeneralCost();
  const replaceGeneralCost = useReplaceGeneralCost();
  
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
        organizationId: userData?.organization?.id
      });
    }
  };
  
  const organizationId = userData?.organization?.id;
  const { data: generalCosts = [], isLoading } = useGeneralCosts(organizationId || null);
  const { data: payments = [] } = useGeneralCostsPayments(organizationId);

  // Configure Mobile Action Bar - Always show 5 buttons
  useEffect(() => {
    if (!isMobile) return;

    setActions({
      search: {
        id: 'search',
        icon: Search,
        label: 'Buscar',
        onClick: () => { }, // Popover is handled in ActionBarMobile
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
        onClick: () => { }, // Popover is handled in ActionBarMobile
      },
      notifications: {
        id: 'notifications',
        icon: Bell,
        label: 'Notificaciones',
        onClick: () => { }, // Popover is handled in ActionBarMobile
      },
    });
    setShowActionBar(true);

    // Cleanup when component unmounts
    return () => {
      clearActions();
      setShowActionBar(false);
      setMobileSearchValue('');
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile]);

  // Calcular métricas reales
  const metrics = useMemo(() => {
    const now = new Date();
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);

    const recentPayments = payments.filter(payment => {
      const paymentDate = new Date(payment.payment_date);
      return paymentDate >= oneMonthAgo && paymentDate <= now;
    });

    return {
      totalConcepts: generalCosts.length,
      totalPayments: payments.length,
      recentPayments: recentPayments.length,
    };
  }, [generalCosts, payments]);

  // Filtrar y ordenar gastos generales por búsqueda y orden alfabético
  const filteredGeneralCosts = generalCosts
    .filter(generalCost => {
      // Búsqueda por texto
      const searchLower = searchQuery.toLowerCase();
      const nameMatch = generalCost.name?.toLowerCase().includes(searchLower);
      const descriptionMatch = generalCost.description?.toLowerCase().includes(searchLower);
      const searchMatch = !searchQuery || nameMatch || descriptionMatch;
      
      return searchMatch;
    })
    .sort((a, b) => {
      // Ordenar alfabéticamente por nombre
      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });

  // Función para editar gasto general
  const handleEdit = (generalCost: GeneralCost) => {
    openModal('general-costs', {
      organizationId: userData?.organization?.id,
      generalCostId: generalCost.id
    });
  };

  // Función para eliminar gasto general
  const handleDelete = (generalCost: GeneralCost) => {
    // Contar cuántos pagos están asociados a este concepto
    const associatedPayments = payments.filter(p => p.general_cost_id === generalCost.id);
    const hasReplacements = generalCosts.filter(gc => gc.id !== generalCost.id).length > 0;
    
    // Determinar el modo: si hay pagos y hay otros conceptos disponibles, usar 'replace'
    const mode = associatedPayments.length > 0 && hasReplacements ? 'replace' : 'delete';
    
    // Preparar opciones de reemplazo
    const replacementOptions = generalCosts
      .filter(gc => gc.id !== generalCost.id)
      .map(gc => ({
        label: gc.name,
        value: gc.id
      }));
    
    // Preparar consecuencias
    const consequences: string[] = [];
    if (associatedPayments.length > 0) {
      consequences.push(`${associatedPayments.length} pago${associatedPayments.length === 1 ? '' : 's'} están asociado${associatedPayments.length === 1 ? '' : 's'} a este concepto`);
      if (mode === 'replace') {
        consequences.push('Puedes reemplazarlos con otro concepto o dejarlos sin referencia');
      } else {
        consequences.push('Los pagos quedarán sin referencia a ningún concepto');
      }
    }
    
    openModal('delete-confirmation', {
      mode,
      title: 'Eliminar concepto de gasto',
      description: `¿Estás seguro de que quieres eliminar "${generalCost.name}"?`,
      itemName: generalCost.name,
      consequences: consequences.length > 0 ? consequences : undefined,
      replacementOptions: mode === 'replace' ? replacementOptions : undefined,
      currentId: generalCost.id,
      onDelete: () => {
        deleteGeneralCost.mutate(generalCost.id);
      },
      onReplace: (newId: string) => {
        replaceGeneralCost.mutate({ oldId: generalCost.id, newId });
      }
    });
  };

  // Configuración de las columnas de la tabla
  const columns = [
    {
      key: 'name',
      label: 'Gasto General',
      render: (generalCost: GeneralCost) => (
        <div className="font-medium">{generalCost.name}</div>
      )
    },
    {
      key: 'description',
      label: 'Descripción',
      render: (generalCost: GeneralCost) => (
        <div className="text-sm text-muted-foreground line-clamp-2">
          {generalCost.description || '-'}
        </div>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">Cargando gastos generales...</div>
      </div>
    );
  }

  // Si no hay datos, mostrar EmptyState
  if (generalCosts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState
          icon={<CreditCard className="w-8 h-8 text-muted-foreground" />}
          title="No hay conceptos de gastos generales"
          description="Comienza agregando tu primer concepto de gasto general para el análisis financiero, por ejemplo: Alquiler, Servicios, Honorarios, etc."
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
      {/* 3 KPIs con datos reales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Total Conceptos - Ocupa 2 columnas */}
        <StatCard data-testid="stat-card-total-concepts" className="col-span-2">
          <StatCardTitle showArrow={false}>
            <CreditCard className="w-4 h-4 inline mr-1" />
            Total Conceptos
          </StatCardTitle>
          <StatCardValue>
            {metrics.totalConcepts}
          </StatCardValue>
          <StatCardMeta>
            Conceptos de gastos generales
          </StatCardMeta>
        </StatCard>

        {/* KPI 2: Pagos Totales - Ocupa 1 columna */}
        <StatCard data-testid="stat-card-total-payments">
          <StatCardTitle showArrow={false}>
            <Receipt className="w-4 h-4 inline mr-1" />
            Pagos Totales
          </StatCardTitle>
          <StatCardValue>
            {metrics.totalPayments}
          </StatCardValue>
          <StatCardMeta>
            Cantidad de pagos realizados
          </StatCardMeta>
        </StatCard>

        {/* KPI 3: Recientes - Ocupa 1 columna */}
        <StatCard data-testid="stat-card-recent">
          <StatCardTitle showArrow={false}>
            <Calendar className="w-4 h-4 inline mr-1" />
            Recientes
          </StatCardTitle>
          <StatCardValue>
            {metrics.recentPayments}
          </StatCardValue>
          <StatCardMeta>
            Pagos del último mes
          </StatCardMeta>
        </StatCard>
      </div>

      <Table
        data={filteredGeneralCosts}
        columns={columns}
        topBar={{
          searchValue: searchQuery,
          onSearchChange: setSearchQuery,
          showSearch: true
        }}
        rowActions={(generalCost) => [
          {
            icon: Edit,
            label: 'Editar',
            onClick: () => handleEdit(generalCost)
          },
          {
            icon: Trash2,
            label: 'Eliminar',
            onClick: () => handleDelete(generalCost),
            variant: 'destructive' as const
          }
        ]}
        renderCard={(generalCost) => (
          <GeneralCostRow
            generalCost={generalCost}
            onEdit={handleEdit}
            onDelete={handleDelete}
            enableSwipe={true}
          />
        )}
      />
    </div>
  );
}