import { useState } from "react";
import { Receipt, Plus, Edit, Trash2 } from "lucide-react";

import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useGeneralCosts } from "@/features/general-costs/hooks/use-general-costs";
import { useDeleteGeneralCost } from "@/features/general-costs/hooks/use-delete-general-cost";
import { GeneralCostsStatsSection } from "@/features/general-costs/components/GeneralCostsStatsSection";
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

  // Filtrar gastos generales por búsqueda
  const filteredGeneralCosts = generalCosts.filter(generalCost => {
    // Búsqueda por texto
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = generalCost.name?.toLowerCase().includes(searchLower);
    const descriptionMatch = generalCost.description?.toLowerCase().includes(searchLower);
    const searchMatch = !searchQuery || nameMatch || descriptionMatch;
    
    return searchMatch;
  });

  // Función para editar gasto general
  const handleEdit = (generalCost: GeneralCost) => {
    console.log('🔧 handleEdit called with:', {
      generalCost,
      id: generalCost.id,
      hasId: !!generalCost.id
    });
    
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
          icon={<Receipt className="w-8 h-8 text-muted-foreground" />}
          title="No hay gastos generales"
          description="Comienza agregando tu primer gasto general para el análisis financiero"
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
      <GeneralCostsStatsSection generalCosts={generalCosts} />

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
      />
    </div>
  );
}