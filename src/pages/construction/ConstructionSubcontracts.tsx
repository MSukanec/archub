import { useState } from "react";
import { Package, Plus, Search, Filter, Edit, Trash2, Calendar, DollarSign } from "lucide-react";
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

export default function ConstructionSubcontracts() {
  const { data: userData } = useCurrentUser();
  const isMobile = useMobile();
  const { openModal } = useGlobalModalStore();
  const deleteSubcontract = useDeleteSubcontract();
  
  // Estado para controles del ActionBar
  const [searchQuery, setSearchQuery] = useState('');
  
  // Datos de subcontratos
  const { data: subcontracts = [], isLoading } = useSubcontracts(userData?.preferences?.last_project_id || null);

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
      console.log('Missing organization or project data');
      return;
    }

    openModal('subcontract', {
      projectId: userData.preferences.last_project_id,
      organizationId: userData.organization.id,
      userId: userData.user?.id
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pendiente': { variant: 'secondary' as const, label: 'Pendiente' },
      'en_proceso': { variant: 'default' as const, label: 'En Proceso' },
      'completado': { variant: 'default' as const, label: 'Completado' },
      'cancelado': { variant: 'destructive' as const, label: 'Cancelado' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendiente;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatCurrency = (amount: number, symbol: string = '$') => {
    return `${symbol} ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
  };

  const columns = [
    {
      key: 'title',
      label: 'Título',
      width: '25%',
      render: (subcontract: any) => (
        <div className="font-medium">{subcontract.title}</div>
      )
    },
    {
      key: 'contact',
      label: 'Proveedor',
      width: '20%',
      render: (subcontract: any) => {
        const contact = subcontract.contact;
        return contact ? (
          <div>
            <div className="font-medium">{contact.full_name}</div>
            {contact.email && <div className="text-xs text-muted-foreground">{contact.email}</div>}
          </div>
        ) : (
          <span className="text-muted-foreground">Sin proveedor</span>
        );
      }
    },
    {
      key: 'amount_total',
      label: 'Monto Total',
      width: '15%',
      render: (subcontract: any) => (
        <div className="text-right">
          <div className="font-medium">
            {formatCurrency(subcontract.amount_total || 0)}
          </div>
          {subcontract.exchange_rate && subcontract.exchange_rate !== 1 && (
            <div className="text-xs text-muted-foreground">
              Cotización: {subcontract.exchange_rate}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Estado',
      width: '10%',
      render: (subcontract: any) => getStatusBadge(subcontract.status)
    },
    {
      key: 'date',
      label: 'Fecha',
      width: '10%',
      render: (subcontract: any) => {
        try {
          return format(new Date(subcontract.date), 'dd/MM/yyyy', { locale: es });
        } catch {
          return subcontract.date;
        }
      }
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '10%',
      sortable: false,
      render: (subcontract: any) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              openModal('subcontract', {
                projectId: userData?.preferences?.last_project_id,
                organizationId: userData?.organization?.id,
                userId: userData?.user?.id,
                subcontractId: subcontract.id,
                isEditing: true
              });
            }}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              openModal('delete-confirmation', {
                title: 'Eliminar Subcontrato',
                description: `¿Estás seguro de que deseas eliminar el subcontrato "${subcontract.title}"?`,
                confirmText: 'Eliminar',
                mode: 'dangerous',
                onConfirm: () => {
                  deleteSubcontract.mutate(subcontract.id);
                }
              });
            }}
          >
            <Trash2 className="w-4 h-4 text-destructive" />
          </Button>
        </div>
      )
    }
  ];

  // Filtrar subcontratos por búsqueda
  const filteredSubcontracts = subcontracts.filter(subcontract =>
    subcontract.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subcontract.contact?.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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



        {/* Contenido principal */}
        {filteredSubcontracts.length === 0 && !isLoading ? (
          <EmptyState
            icon={<Package className="w-12 h-12 text-muted-foreground" />}
            title="Aún no tienes subcontratos creados"
            description="Los subcontratos te permiten gestionar trabajos especializados que requieren contratistas externos. Puedes controlar estados, fechas y presupuestos."
          />
        ) : (
          <div className="space-y-4">
            <Table
              columns={columns}
              data={filteredSubcontracts}
              isLoading={isLoading}
              className="bg-card"
              defaultSort={{ key: 'date', direction: 'desc' }}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}