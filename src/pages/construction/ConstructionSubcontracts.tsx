import { useState, useMemo } from "react";
import { Package, Plus, Search, Filter, Edit, Trash2, DollarSign, ChevronDown, ChevronRight } from "lucide-react";
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
  
  // Estado para filas expandidas
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);

  // Función para alternar expansión de fila
  const toggleRowExpansion = (subcontractId: string) => {
    setExpandedRowId(expandedRowId === subcontractId ? null : subcontractId);
  };

  // Generar datos simulados de ofertas basados en subcontratos existentes
  const bidsMap: Record<string, Array<{
    id: string;
    contact_name: string;
    amount_total: number;
    currency: string;
    status: 'pendiente' | 'aceptado' | 'rechazado';
    submitted_at: string;
  }>> = useMemo(() => {
    const map: any = {};
    
    // Agregar ofertas simuladas para algunos subcontratos
    enrichedSubcontracts.slice(0, 3).forEach((subcontract, index) => {
      const offers = [
        {
          id: `bid-${subcontract.id}-1`,
          contact_name: 'Wildo Duarte',
          amount_total: (subcontract.amount_total || 0) * 0.95, // 5% menos
          currency: 'ARS',
          status: index === 0 ? 'aceptado' : 'pendiente',
          submitted_at: '2024-10-15'
        },
        {
          id: `bid-${subcontract.id}-2`,
          contact_name: 'Lucas Rojas',
          amount_total: (subcontract.amount_total || 0) * 1.04, // 4% más
          currency: 'ARS',
          status: index === 0 ? 'rechazado' : 'pendiente',
          submitted_at: '2024-10-16'
        }
      ];
      
      map[subcontract.id] = offers;
    });
    
    return map;
  }, [enrichedSubcontracts]);

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

  const getBidStatusBadge = (status: 'pendiente' | 'aceptado' | 'rechazado') => {
    const statusConfig = {
      'pendiente': { variant: 'secondary' as const, label: 'Pendiente' },
      'aceptado': { variant: 'default' as const, label: 'Aceptado' },
      'rechazado': { variant: 'destructive' as const, label: 'Rechazado' }
    };
    
    const config = statusConfig[status];
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
      key: 'expand',
      label: '',
      width: '3%',
      sortable: false,
      render: (item: any) => {
        // Solo mostrar botón de expansión para filas de subcontrato (no para filas expandidas)
        if (item.isExpandedRow) {
          return null;
        }
        
        const hasOffers = bidsMap[item.id] && bidsMap[item.id].length > 0;
        if (!hasOffers) {
          return null;
        }
        
        const isExpanded = expandedRowId === item.id;
        return (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => toggleRowExpansion(item.id)}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </Button>
        );
      }
    },
    {
      key: 'title',
      label: 'Título',
      width: '14%',
      render: (item: any) => {
        if (item.isExpandedRow) {
          return (
            <div className="pl-6 text-sm text-muted-foreground">
              ⤷ Ofertas recibidas:
            </div>
          );
        }
        return <div className="font-medium">{item.title}</div>;
      }
    },
    {
      key: 'date',
      label: 'Fecha',
      width: '10%',
      render: (item: any) => {
        if (item.isExpandedRow) {
          // Mostrar tabla de ofertas
          const offers = bidsMap[item.parentId] || [];
          
          if (offers.length === 0) {
            return (
              <div className="py-4 text-sm text-muted-foreground">
                No se han recibido ofertas para este subcontrato
              </div>
            );
          }

          return (
            <div className="py-2">
              <div className="space-y-2">
                {offers.map((offer) => (
                  <div key={offer.id} className="flex items-center justify-between bg-background/50 rounded-lg p-3 border">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{offer.contact_name}</div>
                      <div className="text-xs text-muted-foreground">
                        Enviado: {format(new Date(offer.submitted_at), 'dd/MM/yyyy', { locale: es })}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="font-medium text-sm">
                          {offer.currency} {offer.amount_total.toLocaleString('es-AR')}
                        </div>
                      </div>
                      <div>
                        {getBidStatusBadge(offer.status)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        try {
          return format(new Date(item.date), 'dd/MM/yyyy', { locale: es });
        } catch {
          return item.date;
        }
      }
    },
    {
      key: 'contact',
      label: 'Proveedor',
      width: '15%',
      render: (item: any) => {
        if (item.isExpandedRow) {
          return null;
        }

        const contact = item.contact;
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
      width: '12%',
      render: (item: any) => {
        if (item.isExpandedRow) {
          return null;
        }
        const amountARS = item.amount_total || 0;
        const amountUSD = amountARS / (item.exchange_rate || 1);
        // Determinar la moneda original del subcontrato
        const originalCurrency = item.currency_id === '58c50aa7-b8b1-4035-b509-58028dd0e33f' ? 'USD' : 'ARS';
        return formatSingleCurrency(amountARS, amountUSD, originalCurrency);
      }
    },
    {
      key: 'pago_fecha',
      label: 'Pago a la Fecha',
      width: '12%',
      render: (item: any) => {
        if (item.isExpandedRow) {
          return null;
        }
        const pagoARS = item.analysis?.pagoALaFecha || 0;
        const pagoUSD = item.analysis?.pagoALaFechaUSD || 0;
        return formatSingleCurrency(pagoARS, pagoUSD, 'ARS'); // Los pagos siempre en moneda mixta
      }
    },
    {
      key: 'saldo',
      label: 'Saldo',
      width: '12%',
      render: (item: any) => {
        if (item.isExpandedRow) {
          return null;
        }
        const saldoARS = item.analysis?.saldo || 0;
        const saldoUSD = item.analysis?.saldoUSD || 0;
        return formatSingleCurrency(saldoARS, saldoUSD, 'ARS'); // Los saldos siempre en moneda mixta
      }
    },
    {
      key: 'status',
      label: 'Estado',
      width: '10%',
      render: (item: any) => {
        if (item.isExpandedRow) {
          return null;
        }
        return getStatusBadge(item.status);
      }
    },
    {
      key: 'actions',
      label: 'Acciones',
      width: '11%',
      sortable: false,
      render: (item: any) => {
        if (item.isExpandedRow) {
          return null;
        }
        return (
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
                  subcontractId: item.id,
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
                  description: `¿Estás seguro de que deseas eliminar el subcontrato "${item.title}"?`,
                  confirmText: 'Eliminar',
                  mode: 'dangerous',
                  onConfirm: () => {
                    deleteSubcontract.mutate(item.id);
                  }
                });
              }}
            >
              <Trash2 className="w-4 h-4 text-destructive" />
            </Button>
          </div>
        );
      }
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

  // Transformar datos para incluir filas expandibles
  const tableData = filteredSubcontracts.flatMap(subcontract => {
    const baseRow = subcontract;
    
    // Si esta fila está expandida, agregar la fila expandible
    if (expandedRowId === subcontract.id) {
      const expandedRow = {
        id: subcontract.id + '-expanded',
        parentId: subcontract.id,
        isExpandedRow: true,
        // Datos necesarios para el rendering
        title: '',
        date: '',
        contact: null,
        amount_total: 0,
        status: '',
        analysis: null
      };
      return [baseRow, expandedRow];
    }
    
    return [baseRow];
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
          data={tableData}
          isLoading={isLoading || isLoadingAnalysis}
          defaultSort={{ key: 'title', direction: 'asc' }}
          topBar={tableTopBar}
          getItemId={(item) => item.isExpandedRow ? item.parentId + '-expanded' : item.id}
          getRowClassName={(item) => item.isExpandedRow ? 'bg-muted/30' : ''}
        />
      )}
    </Layout>
  );
}