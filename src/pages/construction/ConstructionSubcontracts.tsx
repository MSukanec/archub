import { useState, useEffect } from "react";
import { Package, Plus, Search, Filter, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Layout } from '@/components/layout/desktop/Layout';
import { ActionBarDesktop } from '@/components/layout/desktop/ActionBarDesktop';
import { EmptyState } from "@/components/ui-custom/EmptyState";
import { FeatureIntroduction } from "@/components/ui-custom/FeatureIntroduction";
import { Table } from "@/components/ui-custom/Table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useMobile } from "@/hooks/use-mobile";
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useSubcontracts, useDeleteSubcontract } from "@/hooks/use-subcontracts";
import { useOrganizationCurrencies } from "@/hooks/use-currencies";
import { useQueryClient } from "@tanstack/react-query";

export default function ConstructionSubcontracts() {
  const { data: userData } = useCurrentUser();
  const isMobile = useMobile();
  const { openModal } = useGlobalModalStore();
  const deleteSubcontract = useDeleteSubcontract();
  const queryClient = useQueryClient();
  
  // Estado para controles del ActionBar
  const [searchQuery, setSearchQuery] = useState('');
  
  // Obtener datos
  const projectId = userData?.preferences?.last_project_id;
  const organizationId = userData?.organization?.id;
  
  const { data: subcontracts = [], isLoading } = useSubcontracts(projectId);
  const { data: organizationCurrencies = [] } = useOrganizationCurrencies(organizationId);



  const features = [
    {
      icon: <Package className="w-4 h-4" />,
      title: "Gestión de Subcontratos",
      description: "Crea y administra pedidos de subcontrato para diferentes especialidades de la obra."
    },
    {
      icon: <Search className="w-4 h-4" />,
      title: "Búsqueda Avanzada",
      description: "Encuentra rápidamente subcontratos por especialidad, estado, fecha o contratista."
    },
    {
      icon: <Filter className="w-4 h-4" />,
      title: "Filtros Inteligentes",
      description: "Filtra subcontratos por estado, especialidad, prioridad o fechas de ejecución."
    },
    {
      icon: <Plus className="w-4 h-4" />,
      title: "Control de Estados",
      description: "Gestiona el ciclo completo desde pedido inicial hasta finalización y facturación."
    }
  ];

  const handleCreateSubcontract = () => {
    if (!userData?.organization?.id || !userData?.preferences?.last_project_id) {
      return;
    }

    openModal('subcontract', {
      projectId: userData.preferences.last_project_id,
      organizationId: userData.organization.id,
      userId: userData.user?.id,
    });
  };

  const handleEditSubcontract = (subcontract: any) => {
    if (!userData?.organization?.id || !userData?.preferences?.last_project_id) {
      return;
    }

    openModal('subcontract', {
      projectId: userData.preferences.last_project_id,
      organizationId: userData.organization.id,
      userId: userData.user?.id,
      subcontractId: subcontract.id,
    });
  };

  const handleDeleteSubcontract = (subcontractId: string) => {
    openModal('delete-confirmation', {
      title: "Eliminar Subcontrato",
      description: "¿Estás seguro de que quieres eliminar este subcontrato? Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar",
      cancelLabel: "Cancelar",
      onConfirm: () => deleteSubcontract.mutate(subcontractId),
      variant: "dangerous",
    });
  };

  // Función para obtener la moneda
  const getCurrencyDisplay = (currencyId: string) => {
    const orgCurrency = organizationCurrencies.find(oc => oc.id === currencyId);
    return orgCurrency?.currency?.symbol || '$';
  };

  // Filtrar subcontratos basado en búsqueda
  const filteredSubcontracts = subcontracts.filter(subcontract =>
    subcontract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (subcontract.contact?.full_name || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Configuración de columnas de la tabla usando el componente Table personalizado
  const tableColumns = [
    {
      key: "date",
      header: "Fecha",
      width: "120px",
      render: (value: string) => {
        if (!value) return <div className="text-xs text-muted-foreground">Sin fecha</div>;
        try {
          return (
            <div className="text-xs">
              {format(new Date(value), "dd/MM/yyyy", { locale: es })}
            </div>
          );
        } catch (error) {
          return <div className="text-xs text-muted-foreground">Fecha inválida</div>;
        }
      },
    },
    {
      key: "title",
      header: "Título",
      width: "1fr",
      render: (value: string) => (
        <div className="text-sm font-medium">{value || 'Sin título'}</div>
      ),
    },
    {
      key: "contact",
      header: "Proveedor",
      width: "180px",
      render: (value: any) => (
        <div className="text-sm">{value?.full_name || 'Sin asignar'}</div>
      ),
    },
    {
      key: "currency_id",
      header: "Moneda",
      width: "80px",
      align: "center" as const,
      render: (value: string) => (
        <div className="text-xs">
          {getCurrencyDisplay(value)}
        </div>
      ),
    },
    {
      key: "amount_total",
      header: "Monto Total",
      width: "120px",
      align: "right" as const,
      render: (value: number, row: any) => {
        const currency = getCurrencyDisplay(row.currency_id);
        return (
          <div className="text-sm font-medium">
            {currency} {value?.toLocaleString() || '0'}
          </div>
        );
      },
    },
    {
      key: "exchange_rate",
      header: "Cotización",
      width: "100px",
      align: "right" as const,
      render: (value: number) => (
        <div className="text-sm">
          {value?.toFixed(2) || '1.00'}
        </div>
      ),
    },
    {
      key: "status",
      header: "Estado",
      width: "120px",
      align: "center" as const,
      render: (value: string) => {
        const variants: { [key: string]: any } = {
          'pendiente': 'secondary',
          'en_progreso': 'default',
          'completado': 'default',
          'cancelado': 'destructive',
        };
        return (
          <Badge variant={variants[value] || 'secondary'} className="text-xs">
            {value?.replace('_', ' ') || 'Sin estado'}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "Acciones",
      width: "120px",
      align: "center" as const,
      render: (value: any, row: any) => (
        <div className="flex gap-1 justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleEditSubcontract(row);
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteSubcontract(row.id);
            }}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <Layout wide={false}>
      <div className="space-y-6">
        {/* ActionBar */}
        <ActionBarDesktop
          title="Gestión de Subcontratos"
          icon={<Package className="w-6 h-6" />}
          features={features}
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          primaryActionLabel="Crear Pedido de Subcontrato"
          onPrimaryActionClick={handleCreateSubcontract}
          showProjectSelector={true}
        />



        {/* FeatureIntroduction para mobile */}
        <FeatureIntroduction 
          title="Gestión de Subcontratos"
          features={features} 
          className="block md:hidden" 
        />

        {/* Contenido principal */}
        {filteredSubcontracts.length > 0 ? (
          <Table 
            columns={tableColumns}
            data={filteredSubcontracts}
            loading={isLoading}
            onRowClick={handleEditSubcontract}
          />
        ) : !isLoading ? (
          <EmptyState
            icon={<Package className="w-12 h-12 text-muted-foreground" />}
            title="Aún no tienes subcontratos creados"
            description="Los subcontratos te permiten gestionar trabajos especializados que requieren contratistas externos. Puedes controlar estados, fechas y presupuestos."
          />
        ) : null}
      </div>
    </Layout>
  );
}