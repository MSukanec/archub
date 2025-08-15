import { useState } from "react";
import { Package, Plus, Search, Filter, Edit, Trash2, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { Layout } from '@/components/layout/desktop/Layout';
import { EmptyState } from "@/components/ui-custom/EmptyState";
import { Table } from "@/components/ui-custom/Table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  // Función para convertir montos según la vista de moneda
  const convertAmount = (amountARS: number, amountUSD: number, currencyCode: string) => {
    if (currencyView === 'discriminado') {
      return currencyCode === 'USD' ? amountUSD : amountARS;
    } else if (currencyView === 'pesificado') {
      return amountARS; // Siempre mostrar en ARS
    } else if (currencyView === 'dolarizado') {
      return amountUSD; // Siempre mostrar en USD
    }
    return amountARS;
  };

  const formatSingleCurrency = (amountARS: number, amountUSD: number, originalCurrency: string = 'ARS') => {
    const convertedAmount = convertAmount(amountARS, amountUSD, originalCurrency);
    
    if (currencyView === 'discriminado') {
      const symbol = originalCurrency === 'USD' ? 'USD' : 'ARS';
      return (
        <div className="text-left">
          <div className="font-medium">
            {symbol} {convertedAmount.toLocaleString('es-AR')}
          </div>
        </div>
      );
    } else if (currencyView === 'pesificado') {
      return (
        <div className="text-left">
          <div className="font-medium">
            ARS {convertedAmount.toLocaleString('es-AR')}
          </div>
        </div>
      );
    } else { // dolarizado
      return (
        <div className="text-left">
          <div className="font-medium">
            USD {Math.round(convertedAmount).toLocaleString('es-AR')}
          </div>
        </div>
      );
    }
  };

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

  const columns = [
    {
      key: 'title',
      label: 'Título',
      width: '12.5%',
      render: (subcontract: any) => (
        <div className="font-medium">{subcontract.title}</div>
      )
    },
    {
      key: 'date',
      label: 'Fecha',
      width: '12.5%',
      render: (subcontract: any) => {
        try {
          return format(new Date(subcontract.date), 'dd/MM/yyyy', { locale: es });
        } catch {
          return subcontract.date;
        }
      }
    },
    {
      key: 'contact',
      label: 'Proveedor',
      width: '12.5%',
      render: (subcontract: any) => {
        const contact = subcontract.contact;
        if (!contact) {
          return <span className="text-muted-foreground">Sin proveedor</span>;
        }
        
        // Usar full_name si existe, sino construir con first_name y last_name
        const contactName = contact.full_name || 
          `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 
          'Nombre no disponible';
        
        return (
          <div>
            <div className="font-medium">{contactName}</div>
            {contact.email && <div className="text-xs text-muted-foreground">{contact.email}</div>}
          </div>
        );
      }
    },
    {
      key: 'amount_total',
      label: 'Monto Total',
      width: '12.5%',
      render: (subcontract: any) => {
        const amountARS = subcontract.amount_total || 0;
        const amountUSD = amountARS / (subcontract.exchange_rate || 1);
        // Determinar la moneda original del subcontrato
        const originalCurrency = subcontract.currency_id === '58c50aa7-b8b1-4035-b509-58028dd0e33f' ? 'USD' : 'ARS';
        return formatSingleCurrency(amountARS, amountUSD, originalCurrency);
      }
    },
    {
      key: 'pago_fecha',
      label: 'Pago a la Fecha',
      width: '12.5%',
      render: (subcontract: any) => {
        const pagoARS = subcontract.analysis?.pagoALaFecha || 0;
        const pagoUSD = subcontract.analysis?.pagoALaFechaUSD || 0;
        return formatSingleCurrency(pagoARS, pagoUSD, 'ARS'); // Los pagos siempre en moneda mixta
      }
    },
    {
      key: 'saldo',
      label: 'Saldo',
      width: '12.5%',
      render: (subcontract: any) => {
        const saldoARS = subcontract.analysis?.saldo || 0;
        const saldoUSD = subcontract.analysis?.saldoUSD || 0;
        return formatSingleCurrency(saldoARS, saldoUSD, 'ARS'); // Los saldos siempre en moneda mixta
      }
    },
    {
      key: 'status',
      label: 'Estado',
      width: '12.5%',
      render: (subcontract: any) => getStatusBadge(subcontract.status)
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '12.5%',
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
  const filteredSubcontracts = enrichedSubcontracts.filter(subcontract => {
    const searchLower = searchQuery.toLowerCase();
    const titleMatch = subcontract.title?.toLowerCase().includes(searchLower);
    
    // Buscar en el nombre del contacto usando la misma lógica de renderizado
    const contact = subcontract.contact;
    const contactName = contact?.full_name || 
      `${contact?.first_name || ''} ${contact?.last_name || ''}`.trim();
    const contactMatch = contactName?.toLowerCase().includes(searchLower);
    
    return titleMatch || contactMatch;
  });

  const headerProps = {
    icon: Package,
    title: "Subcontratos",
    actionButton: {
      label: 'Crear Subcontrato',
      icon: Plus,
      onClick: handleCreateSubcontract
    }
  }

  const tableTopBar = {
    showSearch: true,
    searchValue: searchQuery,
    onSearchChange: setSearchQuery,
    searchPlaceholder: "Buscar subcontratos...",
    showFilter: true,
    isFilterActive: currencyView !== 'discriminado',
    renderFilterContent: () => (
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
    showClearFilters: true,
    onClearFilters: () => {
      setCurrencyView('discriminado')
    }
  }

  return (
    <Layout wide={true} headerProps={headerProps}>
      {filteredSubcontracts.length === 0 && !isLoading && !isLoadingAnalysis ? (
        <EmptyState
          icon={<Package className="w-12 h-12 text-muted-foreground" />}
          title="Aún no tienes subcontratos creados"
          description="Los subcontratos te permiten gestionar trabajos especializados que requieren contratistas externos. Puedes controlar estados, fechas y presupuestos."
        />
      ) : (
        <Table
          columns={columns}
          data={filteredSubcontracts}
          isLoading={isLoading || isLoadingAnalysis}
          defaultSort={{ key: 'title', direction: 'asc' }}
          topBar={tableTopBar}
        />
      )}
    </Layout>
  );
}