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

  // Hook para obtener contactos ganadores de ofertas
  const useWinnerContacts = (subcontracts: any[]) => {
    return useQuery({
      queryKey: ['winner-contacts', subcontracts.map(s => s.winner_bid_id).filter(Boolean)],
      queryFn: async () => {
        const winnerBidIds = subcontracts.map(s => s.winner_bid_id).filter(Boolean);
        if (winnerBidIds.length === 0) return {};
        
        const response = await fetch(`/api/subcontract-bids/contacts`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ bidIds: winnerBidIds })
        });
        
        if (!response.ok) return {};
        const contacts = await response.json();
        
        // Crear un mapa de bid_id -> contact
        const contactMap: any = {};
        contacts.forEach((contact: any) => {
          contactMap[contact.bid_id] = contact;
        });
        
        return contactMap;
      },
      enabled: subcontracts.length > 0,
    });
  };

  const { data: winnerContacts = {} } = useWinnerContacts(subcontracts);

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

  const headerProps = {
    icon: Package,
    title: "Subcontratos",
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
        // Si el subcontrato está adjudicado y tiene oferta ganadora
        if (subcontract.status === 'awarded' && subcontract.winner_bid_id) {
          const winnerContact = winnerContacts[subcontract.winner_bid_id];
          if (winnerContact) {
            const contactName = winnerContact.full_name || 
              `${winnerContact.first_name || ''} ${winnerContact.last_name || ''}`.trim();
            return (
              <div>
                <div className="font-medium">{contactName}</div>
                {winnerContact.email && <div className="text-xs text-muted-foreground">{winnerContact.email}</div>}
              </div>
            );
          }
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
      <Layout headerProps={headerProps} wide>
        <div className="text-center py-8">
          <div className="text-muted-foreground">Cargando subcontratos...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout headerProps={headerProps} wide>
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
                  
                  {/* Mini Chart - Distribución por estado */}
                  <div className="flex items-end gap-1 h-8">
                    {Object.entries(kpiData.statusDistribution).map(([status, count], i) => (
                      <div
                        key={status}
                        className="rounded-sm flex-1"
                        style={{
                          backgroundColor: status === 'awarded' ? 'var(--accent)' : 
                                         status === 'pending' ? 'hsl(var(--muted-foreground))' : 
                                         'hsl(var(--border))',
                          height: `${Math.max(20, (count / kpiData.totalSubcontracts) * 100)}%`,
                          opacity: count > 0 ? 1 : 0.3
                        }}
                      />
                    ))}
                  </div>
                  
                  <div>
                    <p className="text-2xl font-bold">{kpiData.totalSubcontracts}</p>
                    <p className="text-xs text-muted-foreground">
                      {kpiData.awardedCount} adjudicados, {kpiData.pendingCount} pendientes
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Valor Total Adjudicado */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Valor Adjudicado</p>
                    <DollarSign className="h-6 w-6" style={{ color: 'var(--accent)' }} />
                  </div>
                  
                  {/* Progress bar de adjudicación */}
                  <div className="h-8 flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 rounded-full"
                        style={{ 
                          backgroundColor: 'var(--accent)',
                          width: `${Math.min(100, kpiData.awardedPercentage)}%`
                        }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xl font-bold" style={{ color: 'var(--accent)' }}>
                      {currencyView === 'discriminado' ? (
                        kpiData.totalValues.ars > 0 && kpiData.totalValues.usd > 0 ? (
                          <span>
                            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(kpiData.totalValues.ars)}
                            <br />
                            {new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(kpiData.totalValues.usd)}
                          </span>
                        ) : kpiData.totalValues.ars > 0 ? (
                          new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(kpiData.totalValues.ars)
                        ) : (
                          new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(kpiData.totalValues.usd)
                        )
                      ) : currencyView === 'pesificado' ? (
                        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(kpiData.totalValues.ars)
                      ) : (
                        new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(kpiData.totalValues.usd)
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {kpiData.awardedPercentage.toFixed(1)}% del total adjudicado
                    </p>
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
                  
                  {/* Mini chart de tendencia */}
                  <div className="h-8 relative">
                    <svg className="w-full h-full" viewBox="0 0 100 32">
                      <polyline 
                        points="0,20 25,15 50,18 75,12 100,10" 
                        fill="none" 
                        stroke="var(--accent)" 
                        strokeWidth="2"
                        opacity="0.7"
                      />
                      <circle cx="100" cy="10" r="3" fill="var(--accent)" />
                    </svg>
                  </div>
                  
                  <div>
                    <p className="text-xl font-bold">
                      {new Intl.NumberFormat('es-AR', { 
                        style: 'currency', 
                        currency: 'ARS', 
                        minimumFractionDigits: 0 
                      }).format(kpiData.averageAwardValue)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Por subcontrato adjudicado
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Estado de Adjudicación */}
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">Estado Global</p>
                    <Award className="h-6 w-6" style={{ color: 'var(--accent)' }} />
                  </div>
                  
                  {/* Donut chart simple */}
                  <div className="h-8 flex items-center justify-center">
                    <div className="relative w-8 h-8">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 32 32">
                        <circle
                          cx="16" cy="16" r="12"
                          fill="transparent"
                          stroke="hsl(var(--border))"
                          strokeWidth="4"
                        />
                        <circle
                          cx="16" cy="16" r="12"
                          fill="transparent"
                          stroke="var(--accent)"
                          strokeWidth="4"
                          strokeDasharray={`${(kpiData.awardedPercentage / 100) * 75.4} 75.4`}
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-xl font-bold">{kpiData.awardedPercentage.toFixed(1)}%</p>
                    <p className="text-xs text-muted-foreground">
                      {kpiData.pendingCount > 0 ? `${kpiData.pendingCount} pendientes` : 'Todos adjudicados'}
                    </p>
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
          <Table
            columns={columns}
            data={filteredSubcontracts}
            isLoading={isLoading}
            className="bg-card"
          />
        )}
      </div>
    </Layout>
  );
}