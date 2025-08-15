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
    action: {
      icon: Plus,
      label: "Nuevo Subcontrato",
      onClick: handleCreateSubcontract
    }
  };

  // Router navigation
  const [, setLocation] = useLocation();

  // Función para editar subcontrato
  const handleEdit = (subcontract: any) => {
    openModal('subcontract', {
      projectId: userData?.preferences?.last_project_id,
      organizationId: userData?.organization?.id,
      userId: userData?.user?.id,
      isEditing: true,
      subcontract
    });
  };

  // Función para eliminar subcontrato
  const handleDelete = (id: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este subcontrato?')) {
      deleteSubcontract.mutate(id);
    }
  };

  // Función para ver detalle
  const handleView = (id: string) => {
    setLocation(`/construction/subcontracts/${id}`);
  };

  // Formateo de moneda
  const formatCurrency = (amount: number, currency: string, exchangeRate: number) => {
    const value = currencyView === 'dolarizado' 
      ? (amount / exchangeRate)
      : amount;
    
    const symbol = currencyView === 'dolarizado' ? 'US$' : '$';
    
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currencyView === 'dolarizado' ? 'USD' : 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value).replace(/[A-Z]{3}\s*/, symbol + ' ');
  };

  // Configuración de las columnas de la tabla
  const columns = [
    {
      key: 'title',
      label: 'Título',
      render: (subcontract: any) => (
        <div>
          <div className="font-medium">{subcontract.title}</div>
          {subcontract.code && (
            <div className="text-xs text-muted-foreground">{subcontract.code}</div>
          )}
        </div>
      )
    },
    {
      key: 'contact',
      label: 'Proveedor',
      render: (subcontract: any) => {
        const contact = subcontract.contact;
        if (!contact) return '-';
        
        const contactName = contact.full_name || 
          `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
        
        return (
          <div>
            <div className="font-medium">{contactName}</div>
            {contact.email && <div className="text-xs text-muted-foreground">{contact.email}</div>}
          </div>
        );
      }
    },
    {
      key: 'amount',
      label: 'Monto',
      render: (subcontract: any) => {
        const amount = subcontract.amount_total || 0;
        const exchangeRate = subcontract.exchange_rate || 1;
        return formatCurrency(amount, 'ARS', exchangeRate);
      }
    },
    {
      key: 'status',
      label: 'Estado',
      render: (subcontract: any) => {
        const status = subcontract.status;
        let badgeStyle = {};
        let displayText = '';
        
        switch (status) {
          case 'draft':
            badgeStyle = { 
              backgroundColor: '#f3f4f6', 
              color: '#374151',
              border: '1px solid #d1d5db'
            };
            displayText = 'Borrador';
            break;
          case 'active':
            badgeStyle = { 
              backgroundColor: '#3b82f6', // Azul
              color: 'white',
              border: 'none'
            };
            displayText = 'Activo';
            break;
          case 'awarded':
            badgeStyle = { 
              backgroundColor: '#22c55e', // Verde
              color: 'white',
              border: 'none'
            };
            displayText = 'Adjudicado';
            break;
          case 'completed':
            badgeStyle = { 
              backgroundColor: '#22c55e', // Verde
              color: 'white',
              border: 'none'
            };
            displayText = 'Completado';
            break;
          case 'cancelled':
            badgeStyle = { 
              backgroundColor: '#ef4444', // Rojo
              color: 'white',
              border: 'none'
            };
            displayText = 'Cancelado';
            break;
          default:
            badgeStyle = { 
              backgroundColor: '#f3f4f6', 
              color: '#374151',
              border: '1px solid #d1d5db'
            };
            displayText = status || 'Sin estado';
        }
        
        return (
          <Badge style={badgeStyle} className="border-0">
            {displayText}
          </Badge>
        );
      }
    },
    {
      key: 'due_date',
      label: 'Fecha Entrega',
      render: (subcontract: any) => {
        if (!subcontract.due_date) return '-';
        return format(new Date(subcontract.due_date), 'dd/MM/yyyy', { locale: es });
      }
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (subcontract: any) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleView(subcontract.id)}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(subcontract)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(subcontract.id)}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  if (isLoading || isLoadingAnalysis) {
    return (
      <Layout headerProps={headerProps} wide>
        <div className="text-center py-8">
          <div className="text-muted-foreground">Cargando subcontratos...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerProps={headerProps} wide>
      <div>
        {filteredSubcontracts.length === 0 ? (
          <EmptyState
            icon={<Package className="w-12 h-12 text-muted-foreground" />}
            title="Aún no tienes subcontratos creados"
            description="Los subcontratos te permiten gestionar trabajos especializados que requieren contratistas externos. Puedes controlar estados, fechas y presupuestos."
            action={
              <Button onClick={handleCreateSubcontract}>
                <Plus className="w-4 h-4 mr-2" />
                Crear Primer Subcontrato
              </Button>
            }
          />
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 max-w-xs">
              <Label htmlFor="currency-view" className="text-sm">Vista:</Label>
              <Select value={currencyView} onValueChange={(value: any) => setCurrencyView(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="discriminado">Discriminado</SelectItem>
                  <SelectItem value="pesificado">Pesificado</SelectItem>
                  <SelectItem value="dolarizado">Dolarizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Table
              columns={columns}
              data={filteredSubcontracts}
              isLoading={isLoading}
              className="bg-card"
            />
          </div>
        )}
      </div>
    </Layout>
  );
}