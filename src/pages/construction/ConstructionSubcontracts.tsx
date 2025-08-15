import { useState } from "react";
import { Package, Plus, Edit, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useLocation } from "wouter";

import { Layout } from '@/components/layout/desktop/Layout';
import { Table } from '@/components/ui-custom/Table';
import { EmptyState } from '@/components/ui-custom/EmptyState';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useSubcontracts, useDeleteSubcontract } from "@/hooks/use-subcontracts";
import { useSubcontractAnalysis } from "@/hooks/use-subcontract-analysis";

export default function ConstructionSubcontracts() {
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const deleteSubcontract = useDeleteSubcontract();
  
  // Estado para controles del TableTopBar
  const [searchQuery, setSearchQuery] = useState('');
  const [currencyView, setCurrencyView] = useState<'discriminado' | 'pesificado' | 'dolarizado'>('discriminado');

  // Función para crear subcontrato
  const handleCreateSubcontract = () => {
    openModal('subcontract', {
      projectId: userData?.preferences?.last_project_id,
      organizationId: userData?.organization?.id,
      userId: userData?.user?.id,
      isEditing: false
    });
  };
  
  // Datos de subcontratos con análisis de pagos
  const { data: subcontracts = [], isLoading } = useSubcontracts(userData?.preferences?.last_project_id || null);
  const { data: subcontractAnalysis = [], isLoading: isLoadingAnalysis } = useSubcontractAnalysis(userData?.preferences?.last_project_id || null);



  // Combinar datos de subcontratos con análisis de pagos
  const enrichedSubcontracts = subcontracts.map(subcontract => {
    const analysis = subcontractAnalysis.find(a => a.id === subcontract.id);
    return {
      ...subcontract,
      analysis: analysis || {
        pagoALaFecha: 0,
        pagoALaFechaUSD: 0,
        saldo: subcontract.amount_total || 0,
        saldoUSD: (subcontract.amount_total || 0) / (subcontract.exchange_rate || 1)
      }
    };
  });



  // Filtrar subcontratos por búsqueda
  const filteredSubcontracts = enrichedSubcontracts.filter(subcontract => {
    const searchLower = searchQuery.toLowerCase();
    const titleMatch = subcontract.title?.toLowerCase().includes(searchLower);
    const codeMatch = subcontract.code?.toLowerCase().includes(searchLower);
    
    return titleMatch || codeMatch;
  });

  const headerProps = {
    icon: Package,
    title: "Subcontratos",
    showHeaderSearch: true,
    headerSearchValue: searchQuery,
    onHeaderSearchChange: setSearchQuery,
    showHeaderFilter: true,
    renderHeaderFilterContent: () => (
      <div className="space-y-3 p-2 min-w-[200px]">
        <div>
          <Label className="text-xs font-medium mb-1 block">Moneda</Label>
          <Select 
            value={currencyView} 
            onValueChange={(value: string) => setCurrencyView(value as 'discriminado' | 'pesificado' | 'dolarizado')}
          >
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Seleccionar moneda" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="discriminado">Todo</SelectItem>
              <SelectItem value="pesificado">Peso Argentino</SelectItem>
              <SelectItem value="dolarizado">Dólar Estadounidense</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    ),
    isHeaderFilterActive: currencyView !== 'discriminado',
    showHeaderClearFilters: currencyView !== 'discriminado',
    onHeaderClearFilters: () => setCurrencyView('discriminado'),
    actionButton: {
      label: 'Crear Subcontrato',
      icon: Plus,
      onClick: handleCreateSubcontract
    }
  }



  // Función para formatear el estado
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'draft': { variant: 'secondary' as const, label: 'Borrador' },
      'pendiente': { variant: 'secondary' as const, label: 'Pendiente' },
      'en_proceso': { variant: 'default' as const, label: 'En Proceso' },
      'completado': { variant: 'default' as const, label: 'Completado' },
      'cancelado': { variant: 'destructive' as const, label: 'Cancelado' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const [, navigate] = useLocation();

  // Definir columnas con ancho uniforme (6 columnas)
  const columns = [
    {
      key: 'title',
      label: 'Título',
      width: '16.66%',
      render: (subcontract: any) => (
        <div className="font-medium">{subcontract.title}</div>
      )
    },
    {
      key: 'code',
      label: 'Código',
      width: '16.66%',
      render: (subcontract: any) => (
        <span className="text-muted-foreground">{subcontract.code || 'Sin código'}</span>
      )
    },
    {
      key: 'date',
      label: 'Fecha',
      width: '16.66%',
      render: (subcontract: any) => (
        <span>{format(new Date(subcontract.date), 'dd/MM/yyyy', { locale: es })}</span>
      )
    },
    {
      key: 'status',
      label: 'Estado',
      width: '16.66%',
      render: (subcontract: any) => getStatusBadge(subcontract.status)
    },
    {
      key: 'amount_total',
      label: 'Monto Total',
      width: '16.66%',
      render: (subcontract: any) => {
        const amount = subcontract.amount_total || 0;
        return (
          <span className="font-medium">
            ${amount.toLocaleString('es-AR')}
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '16.66%',
      render: (subcontract: any) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => navigate(`/construction/subcontracts/${subcontract.id}`)}
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
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
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
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
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <Layout wide={true} headerProps={headerProps}>
      <Table
        columns={columns}
        data={filteredSubcontracts}
        isLoading={isLoading || isLoadingAnalysis}
        emptyState={
          <EmptyState
            icon={<Package />}
            title="Sin subcontratos creados"
            description="Los subcontratos te permiten gestionar trabajos especializados que requieren contratistas externos"
            action={
              <Button onClick={handleCreateSubcontract}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Subcontrato
              </Button>
            }
          />
        }
      />
    </Layout>
  );
}