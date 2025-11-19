import { useState } from "react";
import { CreditCard, Plus, Edit, Trash2, DollarSign, TrendingUp, Users, Calendar } from "lucide-react";

import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatCard, StatCardTitle, StatCardValue, StatCardMeta } from '@/components/ui-custom/stat-card';

import { useCurrentUser } from "@/hooks/use-current-user";
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useGeneralCosts } from "@/features/general-costs/hooks/use-general-costs";
import { useDeleteGeneralCost } from "@/features/general-costs/hooks/use-delete-general-cost";
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
  
  const { data: generalCosts = [], isLoading } = useGeneralCosts(userData?.organization?.id || null);

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
      {/* 4 KPIs usando StatCard por defecto */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard data-testid="stat-card-total-costs">
          <StatCardTitle showArrow={false}>
            <DollarSign className="w-4 h-4 inline mr-1" />
            Total Gastos
          </StatCardTitle>
          <StatCardValue>
            {generalCosts.length}
          </StatCardValue>
          <StatCardMeta>
            Conceptos de gastos generales
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="stat-card-recent">
          <StatCardTitle showArrow={false}>
            <Calendar className="w-4 h-4 inline mr-1" />
            Recientes
          </StatCardTitle>
          <StatCardValue className="text-2xl md:text-3xl">
            12
          </StatCardValue>
          <StatCardMeta>
            Gastos del último mes
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="stat-card-trending">
          <StatCardTitle showArrow={false}>
            <TrendingUp className="w-4 h-4 inline mr-1" />
            Tendencia
          </StatCardTitle>
          <StatCardValue className="text-2xl md:text-3xl text-green-600 dark:text-green-400">
            +15%
          </StatCardValue>
          <StatCardMeta>
            Crecimiento este trimestre
          </StatCardMeta>
        </StatCard>

        <StatCard data-testid="stat-card-active">
          <StatCardTitle showArrow={false}>
            <Users className="w-4 h-4 inline mr-1" />
            Activos
          </StatCardTitle>
          <StatCardValue className="text-2xl md:text-3xl">
            {generalCosts.length}
          </StatCardValue>
          <StatCardMeta>
            Gastos activos en el sistema
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