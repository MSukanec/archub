import { useState, useMemo } from "react";
import { Package, Plus, Edit, Trash2, Eye, Award, DollarSign, TrendingUp, Users } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useLocation } from "wouter";

import { Layout } from '@/components/layout/desktop/Layout';
import { Table } from '@/components/ui-custom/Table';
import { EmptyState } from '@/components/ui-custom/EmptyState';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useSubcontracts, useDeleteSubcontract } from "@/hooks/use-subcontracts";
import { useSubcontractAnalysis } from "@/hooks/use-subcontract-analysis";
import { useQuery } from '@tanstack/react-query';

// Componente del contenido de la tab Lista
function SubcontractListContent() {
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

  // Cálculos para KPIs de subcontratos
  const kpiData = useMemo(() => {
    if (subcontracts.length === 0) return null;

    const totalSubcontracts = subcontracts.length;
    const awardedSubcontracts = subcontracts.filter(s => s.status === 'awarded');
    const pendingSubcontracts = subcontracts.filter(s => s.status === 'pending');
    const inProgressSubcontracts = subcontracts.filter(s => s.status === 'in_progress');

    // Calcular valores totales
    const totalAwardedValueARS = awardedSubcontracts.reduce((sum, s) => sum + (s.amount_ars || 0), 0);
    const totalAwardedValueUSD = awardedSubcontracts.reduce((sum, s) => sum + (s.amount_usd || 0), 0);
    
    // Valor total según vista de moneda
    const getTotalValue = () => {
      if (currencyView === 'discriminado') {
        return { ars: totalAwardedValueARS, usd: totalAwardedValueUSD };
      } else if (currencyView === 'pesificado') {
        const exchangeRate = subcontracts[0]?.exchange_rate || 1;
        return { 
          ars: totalAwardedValueARS + (totalAwardedValueUSD * exchangeRate), 
          usd: 0 
        };
      } else if (currencyView === 'dolarizado') {
        const exchangeRate = subcontracts[0]?.exchange_rate || 1;
        return { 
          ars: 0, 
          usd: totalAwardedValueUSD + (totalAwardedValueARS / exchangeRate) 
        };
      }
      return { ars: totalAwardedValueARS, usd: totalAwardedValueUSD };
    };

    const totalValues = getTotalValue();

    // Calcular promedio de adjudicación
    const averageAwardValue = awardedSubcontracts.length > 0 
      ? totalAwardedValueARS / awardedSubcontracts.length 
      : 0;

    // Distribución por estado
    const statusDistribution = {
      awarded: awardedSubcontracts.length,
      pending: pendingSubcontracts.length,
      inProgress: inProgressSubcontracts.length,
      other: totalSubcontracts - awardedSubcontracts.length - pendingSubcontracts.length - inProgressSubcontracts.length
    };

    return {
      totalSubcontracts,
      awardedCount: awardedSubcontracts.length,
      pendingCount: pendingSubcontracts.length,
      inProgressCount: inProgressSubcontracts.length,
      totalValues,
      averageAwardValue,
      statusDistribution,
      awardedPercentage: (awardedSubcontracts.length / totalSubcontracts) * 100
    };
  }, [subcontracts, currencyView]);

  // Función para convertir montos según la vista seleccionada
  const convertAmount = (amountARS: number, amountUSD: number, originalCurrency: string = 'ARS') => {
    if (currencyView === 'discriminado') {
      return originalCurrency === 'USD' ? amountUSD : amountARS;
    } else if (currencyView === 'pesificado') {
      return originalCurrency === 'USD' ? amountUSD * (subcontracts[0]?.exchange_rate || 1) : amountARS;
    } else if (currencyView === 'dolarizado') {
      return originalCurrency === 'ARS' ? amountARS / (subcontracts[0]?.exchange_rate || 1) : amountUSD;
    }
    return amountARS;
  };

  // Función para formatear montos con el símbolo correcto
  const formatSingleCurrency = (amountARS: number, amountUSD: number, originalCurrency: string = 'ARS') => {
    const convertedAmount = convertAmount(amountARS, amountUSD, originalCurrency);
    
    if (currencyView === 'discriminado') {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: originalCurrency === 'USD' ? 'USD' : 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(convertedAmount);
    } else if (currencyView === 'pesificado') {
      return new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(convertedAmount);
    } else if (currencyView === 'dolarizado') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(convertedAmount);
    }
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(convertedAmount);
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

  // Filtrar subcontratos por búsqueda
  const filteredSubcontracts = enrichedSubcontracts.filter(subcontract => {
    const searchLower = searchQuery.toLowerCase();
    const titleMatch = subcontract.title?.toLowerCase().includes(searchLower);
    const codeMatch = subcontract.code?.toLowerCase().includes(searchLower);
    
    return titleMatch || codeMatch;
  });

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
  const handleDelete = (subcontract: any) => {
    openModal('delete-confirmation', {
      title: 'Eliminar Subcontrato',
      message: `¿Estás seguro de que quieres eliminar el subcontrato "${subcontract.title}"? Esta acción no se puede deshacer y eliminará todas las ofertas y datos relacionados.`,
      mode: 'dangerous',
      onConfirm: () => {
        deleteSubcontract.mutate(subcontract.id);
      }
    });
  };

  // Función para ver detalle
  const handleView = (id: string) => {
    setLocation(`/construction/subcontracts/${id}`);
  };

  // Configuración de las columnas de la tabla
  const columns = [
    {
      key: 'title',
      label: 'Subcontrato',
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
      label: 'Subcontratista',
      render: (subcontract: any) => {
        // Si el subcontrato está adjudicado y tiene contacto
        if (subcontract.status === 'awarded' && subcontract.contact) {
          const contactName = subcontract.contact.full_name || 
            subcontract.contact.company_name ||
            `${subcontract.contact.first_name || ''} ${subcontract.contact.last_name || ''}`.trim();
          return (
            <div>
              <div className="font-medium">{contactName}</div>
              {subcontract.contact.email && <div className="text-xs text-muted-foreground">{subcontract.contact.email}</div>}
            </div>
          );
        }
        
        // Si no está adjudicado, mostrar "Sin adjudicar"
        if (subcontract.status !== 'awarded') {
          return (
            <div className="text-muted-foreground">
              Sin adjudicar
            </div>
          );
        }
        
        // Fallback para subcontratos adjudicados sin datos de contacto
        return (
          <div className="text-muted-foreground">
            Sin información de contacto
          </div>
        );
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
              backgroundColor: 'var(--accent)', // Verde accent
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
      key: 'amount',
      label: 'Monto Total',
      render: (subcontract: any) => {
        const amountARS = subcontract.amount_total || 0;
        const amountUSD = amountARS / (subcontract.exchange_rate || 1);
        // Determinar la moneda original del subcontrato
        const originalCurrency = subcontract.currency_id === '58c50aa7-b8b1-4035-b509-58028dd0e33f' ? 'USD' : 'ARS';
        return formatSingleCurrency(amountARS, amountUSD, originalCurrency);
      }
    },
    {
      key: 'paid_amount',
      label: 'A la Fecha',
      render: (subcontract: any) => {
        const analysis = subcontract.analysis;
        if (!analysis) return '-';
        
        const paidARS = analysis.pagoALaFecha || 0;
        const paidUSD = analysis.pagoALaFechaUSD || 0;
        // Usar la misma moneda original que el monto total
        const originalCurrency = subcontract.currency_id === '58c50aa7-b8b1-4035-b509-58028dd0e33f' ? 'USD' : 'ARS';
        return formatSingleCurrency(paidARS, paidUSD, originalCurrency);
      }
    },
    {
      key: 'balance',
      label: 'Saldo',
      render: (subcontract: any) => {
        const analysis = subcontract.analysis;
        if (!analysis) return '-';
        
        const balanceARS = analysis.saldo || 0;
        const balanceUSD = analysis.saldoUSD || 0;
        // Usar la misma moneda original que el monto total
        const originalCurrency = subcontract.currency_id === '58c50aa7-b8b1-4035-b509-58028dd0e33f' ? 'USD' : 'ARS';
        return formatSingleCurrency(balanceARS, balanceUSD, originalCurrency);
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
            onClick={() => handleDelete(subcontract)}
            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  if (isLoading || isLoadingAnalysis) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">Cargando subcontratos...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {kpiData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Total Subcontratos */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Total Subcontratos</p>
                  <Package className="h-6 w-6" style={{ color: 'var(--accent)' }} />
                </div>
                
                <div className="space-y-2">
                  <p className="text-2xl font-bold">{kpiData.totalSubcontracts}</p>
                  <div className="text-xs text-muted-foreground">
                    {kpiData.awardedCount} adjudicados • {kpiData.pendingCount} pendientes
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valor Adjudicado */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Valor Adjudicado</p>
                  <Award className="h-6 w-6" style={{ color: 'var(--accent)' }} />
                </div>
                
                <div className="space-y-2">
                  {currencyView === 'discriminado' ? (
                    <div>
                      <p className="text-lg font-bold">
                        ${kpiData.totalValues.ars.toLocaleString('es-AR')}
                      </p>
                      <p className="text-sm font-medium">
                        US$ {kpiData.totalValues.usd.toLocaleString('es-AR')}
                      </p>
                    </div>
                  ) : (
                    <p className="text-2xl font-bold">
                      {currencyView === 'pesificado' 
                        ? `$${kpiData.totalValues.ars.toLocaleString('es-AR')}`
                        : `US$${kpiData.totalValues.usd.toLocaleString('es-AR')}`
                      }
                    </p>
                  )}
                  <div className="text-xs text-muted-foreground">
                    {((kpiData.awardedCount / kpiData.totalSubcontracts) * 100).toFixed(1)}% del total
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Promedio por Subcontrato */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Promedio Adjudicado</p>
                  <TrendingUp className="h-6 w-6" style={{ color: 'var(--accent)' }} />
                </div>
                
                <div className="space-y-2">
                  <p className="text-2xl font-bold">
                    ${(kpiData.averageAwardValue || 0).toLocaleString('es-AR')}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    Por subcontrato adjudicado
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estado de Subcontratos */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Estado General</p>
                  <Users className="h-6 w-6" style={{ color: 'var(--accent)' }} />
                </div>
                
                <div className="space-y-2">
                  <p className="text-2xl font-bold">{kpiData.awardedPercentage.toFixed(0)}%</p>
                  <div className="text-xs text-muted-foreground">
                    Tasa de adjudicación
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla de Subcontratos */}
      {filteredSubcontracts.length === 0 ? (
        <EmptyState
          icon={<Package className="w-12 h-12 text-muted-foreground" />}
          title="No hay subcontratos"
          description={searchQuery ? "No se encontraron subcontratos que coincidan con tu búsqueda." : "Aún no has creado ningún subcontrato. Haz clic en 'Nuevo Subcontrato' para comenzar."}
        />
      ) : (
        <Table 
          data={filteredSubcontracts}
          columns={columns}
        />
      )}
    </div>
  );
}

export default function Subcontracts() {
  const [activeTab, setActiveTab] = useState('lista')
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();

  // Estados específicos para controles de header en tab Lista
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

  // Props del header que cambian según la tab activa
  const getHeaderProps = () => {
    const baseProps = {
      icon: Package,
      pageTitle: "Subcontratos",
      tabs: [
        { id: 'lista', label: 'Lista', isActive: activeTab === 'lista' },
        { id: 'pagos', label: 'Pagos', isActive: activeTab === 'pagos' }
      ],
      onTabChange: setActiveTab
    };

    // Solo agregar controles específicos para la tab Lista
    if (activeTab === 'lista') {
      return {
        ...baseProps,
        showHeaderSearch: true,
        headerSearchValue: searchQuery,
        onHeaderSearchChange: setSearchQuery,
        showCurrencySelector: true,
        currencyView: currencyView,
        onCurrencyViewChange: setCurrencyView,
        actionButton: {
          icon: Plus,
          label: "Nuevo Subcontrato",
          onClick: handleCreateSubcontract
        }
      };
    }

    return baseProps;
  };

  return (
    <Layout headerProps={getHeaderProps()} wide>
      <div className="h-full">
        {activeTab === 'lista' && <SubcontractListContent />}
        
        {activeTab === 'pagos' && (
          <div className="flex items-center justify-center h-64">
            <p className="text-muted-foreground">Contenido de Pagos - Próximamente</p>
          </div>
        )}
      </div>
    </Layout>
  )
}