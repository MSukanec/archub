import { useState, useMemo } from "react";
import { Package, Plus, Edit, Trash2, Eye, Award, DollarSign, TrendingUp, Users, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useLocation } from "wouter";

import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjectContext } from '@/stores/projectContext';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useSubcontracts, useDeleteSubcontract } from "@/hooks/use-subcontracts";
import { useSubcontractAnalysis } from "@/hooks/use-subcontract-analysis";
import { useQuery } from '@tanstack/react-query';
import { useMobile } from '@/hooks/use-mobile';
import { SubcontractRow } from '@/components/ui/data-row/rows';

interface SubcontractListProps {
  filterByStatus?: string;
  filterByType?: string;
}

export default function SubcontractList({ filterByStatus = 'all', filterByType = 'all' }: SubcontractListProps) {
  const { data: userData } = useCurrentUser();
  const { selectedProjectId, currentOrganizationId } = useProjectContext();
  const { openModal } = useGlobalModalStore();
  const deleteSubcontract = useDeleteSubcontract();
  const isMobile = useMobile();
  
  // Estado para controles del TableTopBar
  const [searchQuery, setSearchQuery] = useState('');
  const [currencyView, setCurrencyView] = useState<'discriminado' | 'pesificado' | 'dolarizado'>('discriminado');

  // Función para crear subcontrato
  const handleCreateSubcontract = () => {
    openModal('subcontract', {
      projectId: selectedProjectId,
      organizationId: currentOrganizationId,
      userId: userData?.user?.id,
      isEditing: false
    });
  };
  
  // Datos de subcontratos con análisis de pagos
  const { data: subcontracts = [], isLoading } = useSubcontracts(selectedProjectId || null);
  const { data: subcontractAnalysis = [], isLoading: isLoadingAnalysis } = useSubcontractAnalysis(selectedProjectId || null);

  // Cálculos para KPIs de subcontratos
  const kpiData = useMemo(() => {
    if (subcontracts.length === 0) return null;

    const totalSubcontracts = subcontracts.length;
    const awardedSubcontracts = subcontracts.filter(s => s.status === 'awarded');
    const pendingSubcontracts = subcontracts.filter(s => s.status === 'pending');
    const inProgressSubcontracts = subcontracts.filter(s => s.status === 'in_progress');

    // Calcular valores totales usando los campos correctos de la base de datos
    const totalAwardedValueARS = awardedSubcontracts.reduce((sum, s) => {
      // Los subcontratos adjudicados tienen amount_total
      return sum + (s.amount_total || 0);
    }, 0);
    
    const totalAwardedValueUSD = awardedSubcontracts.reduce((sum, s) => {
      // Convertir a USD usando tasa de cambio (para vista dolarizada)
      return sum + ((s.amount_total || 0) / 1125);
    }, 0);
    
    // Simplificar para usar directamente los valores calculados
    const totalValues = {
      ars: totalAwardedValueARS,
      usd: totalAwardedValueUSD
    };

    // Calcular saldo restante usando los campos correctos del análisis
    const totalPaidARS = subcontractAnalysis.reduce((sum, analysis) => {
      // subcontractAnalysis tiene pagoALaFecha
      return sum + (analysis.pagoALaFecha || 0);
    }, 0);
    
    const remainingBalanceARS = totalAwardedValueARS - totalPaidARS;

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
      remainingBalanceARS,
      totalPaidARS,
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

  // Filtrar subcontratos por búsqueda y filtros móviles
  const filteredSubcontracts = enrichedSubcontracts.filter(subcontract => {
    // Búsqueda por texto
    const searchLower = searchQuery.toLowerCase();
    const titleMatch = subcontract.title?.toLowerCase().includes(searchLower);
    const codeMatch = subcontract.code?.toLowerCase().includes(searchLower);
    const searchMatch = !searchQuery || titleMatch || codeMatch;
    
    // Filtro por status
    const statusMatch = filterByStatus === 'all' || subcontract.status === filterByStatus;
    
    // Filtro por tipo (asumiendo que se puede determinar del título o descripción)
    let typeMatch = true;
    if (filterByType !== 'all') {
      const titleLower = (subcontract.title || '').toLowerCase();
      const descriptionLower = (subcontract.description || '').toLowerCase();
      typeMatch = titleLower.includes(filterByType.toLowerCase()) || 
                  descriptionLower.includes(filterByType.toLowerCase());
    }
    
    return searchMatch && statusMatch && typeMatch;
  });

  // Router navigation
  const [, setLocation] = useLocation();

  // Función para editar subcontrato
  const handleEdit = (subcontract: any) => {
    openModal('subcontract', {
      projectId: selectedProjectId,
      organizationId: currentOrganizationId,
      userId: userData?.user?.id,
      isEditing: true,
      subcontractId: subcontract.id
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
        const contact = subcontract.contact || subcontract.winner_bid?.contacts;
        if (subcontract.status === 'awarded' && contact) {
          const contactName = contact.full_name || 
            contact.company_name ||
            `${contact.first_name || ''} ${contact.last_name || ''}`.trim();
          return (
            <div>
              <div className="font-medium">{contactName}</div>
              {contact.email && <div className="text-xs text-muted-foreground">{contact.email}</div>}
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
            Sin subcontratista
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
          case 'en_progreso':
          case 'in_progress':
            badgeStyle = { 
              backgroundColor: '#f59e0b', // Naranja/Amarillo
              color: 'white',
              border: 'none'
            };
            displayText = 'En Progreso';
            break;
          case 'pendiente':
          case 'pending':
            badgeStyle = { 
              backgroundColor: '#8b5cf6', // Púrpura
              color: 'white',
              border: 'none'
            };
            displayText = 'Pendiente';
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
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'}`}>
          {/* Total Subcontratos */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`space-y-${isMobile ? '2' : '4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    {isMobile ? 'Subcontratos' : 'Total Subcontratos'}
                  </p>
                  <Package className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
                </div>
                
                {/* Mini gráfico de barras - altura fija */}
                <div className={`flex items-end gap-1 ${isMobile ? 'h-6' : 'h-8'}`}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-sm flex-1"
                      style={{
                        backgroundColor: 'var(--accent)',
                        height: `${Math.max(30, Math.random() * 100)}%`,
                        opacity: i < kpiData.totalSubcontracts ? 1 : 0.3
                      }}
                    />
                  ))}
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>{kpiData.totalSubcontracts}</p>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    {kpiData.awardedCount} adjudicados
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valor Adjudicado */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`space-y-${isMobile ? '2' : '4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    {isMobile ? 'Adjudicado' : 'Valor Adjudicado'}
                  </p>
                  <Award className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
                </div>
                
                {/* Gráfico de línea de tendencia - altura fija */}
                <div className={`${isMobile ? 'h-6' : 'h-8'} relative`}>
                  <svg className="w-full h-full" viewBox="0 0 100 32">
                    <path
                      d="M 0,24 Q 25,20 50,12 T 100,8"
                      stroke="var(--accent)"
                      strokeWidth="2"
                      fill="none"
                      className="opacity-80"
                    />
                    <circle cx="100" cy="8" r="2" fill="var(--accent)" />
                  </svg>
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>
                    {currencyView === 'pesificado' 
                      ? `$${kpiData.totalValues.ars.toLocaleString('es-AR')}`
                      : currencyView === 'dolarizado'
                      ? `US$${kpiData.totalValues.usd.toLocaleString('es-AR')}`
                      : `$${kpiData.totalValues.ars.toLocaleString('es-AR')}`
                    }
                  </p>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    {((kpiData.awardedCount / kpiData.totalSubcontracts) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Saldo Restante */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`space-y-${isMobile ? '2' : '4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    {isMobile ? 'Saldo' : 'Saldo Restante'}
                  </p>
                  <CreditCard className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
                </div>
                
                {/* Barra de progreso de pagos - altura fija */}
                <div className={`${isMobile ? 'h-6' : 'h-8'} flex items-center`}>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min((kpiData.totalPaidARS / (kpiData.totalValues.ars || 1)) * 100, 100)}%`,
                        background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 50%, var(--accent) 100%)'
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>
                    ${(kpiData.remainingBalanceARS || 0).toLocaleString('es-AR')}
                  </p>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    Pendiente
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estado General */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`space-y-${isMobile ? '2' : '4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    {isMobile ? 'Estado' : 'Estado General'}
                  </p>
                  <Users className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
                </div>
                
                {/* Gráfico de área llena - altura fija */}
                <div className={`${isMobile ? 'h-6' : 'h-8'} relative`}>
                  <svg className="w-full h-full" viewBox="0 0 100 32">
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.8"/>
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.2"/>
                      </linearGradient>
                    </defs>
                    <path
                      d={`M 0,32 L 0,${32 - (kpiData.awardedPercentage * 0.3)} Q 25,${20 - (kpiData.awardedPercentage * 0.2)} 50,${16 - (kpiData.awardedPercentage * 0.25)} T 100,${12 - (kpiData.awardedPercentage * 0.2)} L 100,32 Z`}
                      fill="url(#areaGradient)"
                    />
                  </svg>
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>{kpiData.awardedPercentage.toFixed(0)}%</p>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    Adjudicación
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista/Tabla de Subcontratos */}
      {filteredSubcontracts.length === 0 ? (
        <EmptyState
          icon={<Package className="w-12 h-12 text-muted-foreground" />}
          title="No hay subcontratos"
          description={searchQuery ? "No se encontraron subcontratos que coincidan con tu búsqueda." : "Aún no has creado ningún subcontrato. Haz clic en 'Nuevo Subcontrato' para comenzar."}
          action={
            <Button
              onClick={handleCreateSubcontract}
              className="mt-4"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Subcontrato
            </Button>
          }
        />
      ) : isMobile ? (
        // Vista móvil - usar SubcontractRow
        <div className="space-y-2">
          {filteredSubcontracts.map((subcontract) => (
            <SubcontractRow
              key={subcontract.id}
              subcontract={subcontract}
              onClick={() => handleView(subcontract.id)}
              density="compact"
            />
          ))}
        </div>
      ) : (
        // Vista desktop - usar Table
        <Table 
          data={filteredSubcontracts}
          columns={columns}
          rowActions={(subcontract) => [
            {
              icon: Eye,
              label: 'Ver Detalle',
              onClick: () => handleView(subcontract.id)
            },
            {
              icon: Edit,
              label: 'Editar',
              onClick: () => handleEdit(subcontract)
            },
            {
              icon: Trash2,
              label: 'Eliminar',
              onClick: () => handleDelete(subcontract),
              variant: 'destructive' as const
            }
          ]}
        />
      )}
    </div>
  );
}