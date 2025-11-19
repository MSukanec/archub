import { useState, useMemo } from "react";
import { CreditCard, Plus, Edit, Trash2, DollarSign, Receipt, Calendar } from "lucide-react";

import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui-custom/KPICard';

import { useCurrentUser } from "@/hooks/use-current-user";
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useGeneralCosts } from "@/features/general-costs/hooks/use-general-costs";
import { useDeleteGeneralCost } from "@/features/general-costs/hooks/use-delete-general-cost";
import { useGeneralCostsPayments } from "@/hooks/use-general-costs-payments";
import GeneralCostRow from "@/components/ui/data-row/rows/GeneralCostRow";
import type { GeneralCost } from "@/features/general-costs/types";

interface GeneralCostsListProps {
  onNewGeneralCost?: () => void;
}

export default function GeneralCostsList({ onNewGeneralCost }: GeneralCostsListProps) {
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const deleteGeneralCost = useDeleteGeneralCost();
  
  const [searchQuery, setSearchQuery] = useState('');

  const handleCreateGeneralCost = () => {
    if (onNewGeneralCost) {
      onNewGeneralCost();
    } else {
      openModal('general-costs', {
        organizationId: userData?.organization?.id,
        isEditing: false
      });
    }
  };
  
  const organizationId = userData?.organization?.id;
  const { data: generalCosts = [], isLoading } = useGeneralCosts(organizationId || null);
  const { data: payments = [] } = useGeneralCostsPayments(organizationId);

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
      isEditing: true,
      generalCostId: generalCost.id
    });
  };

  // Función para eliminar gasto general
  const handleDelete = (generalCost: GeneralCost) => {
    openModal('delete-confirmation', {
      title: 'Eliminar Gasto General',
      message: `¿Estás seguro de que quieres eliminar el gasto general "${generalCost.name}"? Esta acción no se puede deshacer.`,
      mode: 'dangerous',
      onConfirm: () => {
        deleteGeneralCost.mutate(generalCost.id);
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