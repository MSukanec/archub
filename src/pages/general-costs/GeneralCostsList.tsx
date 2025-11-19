import { useState } from "react";
import { Receipt, Plus, Edit, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useLocation } from "wouter";

import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useGeneralCosts } from "@/features/general-costs/hooks/use-general-costs";
import { useDeleteGeneralCost } from "@/features/general-costs/hooks/use-delete-general-cost";
import { GeneralCostsKPIs } from "@/features/general-costs/components/GeneralCostsKPIs";
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

  // Router navigation
  const [, setLocation] = useLocation();

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

  // Función para ver detalle
  const handleView = (id: string) => {
    // TODO: Implementar vista de detalle cuando esté disponible
    console.log('Ver detalle de gasto general:', id);
  };

  // Configuración de las columnas de la tabla
  const columns = [
    {
      key: 'name',
      label: 'Gasto General',
      render: (generalCost: GeneralCost) => (
        <div>
          <div className="font-medium">{generalCost.name}</div>
          {generalCost.description && (
            <div className="text-xs text-muted-foreground line-clamp-1">{generalCost.description}</div>
          )}
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Fecha de Creación',
      align: 'right' as const,
      render: (generalCost: GeneralCost) => (
        <div>
          {generalCost.created_at && (
            <div className="text-sm">
              {format(new Date(generalCost.created_at), 'dd/MM/yyyy', { locale: es })}
            </div>
          )}
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
      <GeneralCostsKPIs generalCosts={generalCosts} />

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
            icon: Eye,
            label: 'Ver detalle',
            onClick: () => handleView(generalCost.id)
          },
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