import { useState, useMemo } from "react";
import { DollarSign, Plus, Edit, Trash2, Eye, TrendingUp, Building, Receipt, CreditCard } from "lucide-react";
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
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useIndirectCosts, useDeleteIndirectCost } from "@/hooks/use-indirect-costs";
import { useMobile } from '@/hooks/use-mobile';

interface IndirectListProps {
  filterByCategory?: string;
  filterByStatus?: string;
}

export default function IndirectList({ filterByCategory = 'all', filterByStatus = 'all' }: IndirectListProps) {
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const deleteIndirectCost = useDeleteIndirectCost();
  const isMobile = useMobile();
  
  // Estado para controles del TableTopBar
  const [searchQuery, setSearchQuery] = useState('');
  const [currencyView, setCurrencyView] = useState<'discriminado' | 'pesificado' | 'dolarizado'>('discriminado');

  // Función para crear costo indirecto
  const handleCreateIndirectCost = () => {
    openModal('indirect-cost', {
      organizationId: userData?.organization?.id,
      isEditing: false
    });
  };
  
  // Datos de costos indirectos
  const { data: indirectCosts = [], isLoading } = useIndirectCosts(userData?.organization?.id || null);

  // Cálculos para KPIs de costos indirectos
  const kpiData = useMemo(() => {
    if (indirectCosts.length === 0) return null;

    const totalIndirectCosts = indirectCosts.length;
    const activeIndirectCosts = indirectCosts.filter(ic => ic.is_active);
    const costsWithValues = indirectCosts.filter(ic => ic.current_value?.amount);
    
    // Agrupar por categorías
    const categoryCounts = indirectCosts.reduce((acc, cost) => {
      const category = cost.category || 'Sin categoría';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calcular valores totales
    const totalValueARS = indirectCosts.reduce((sum, cost) => {
      return sum + (cost.current_value?.amount || 0);
    }, 0);

    const totalValueUSD = totalValueARS / 1125; // Conversión simplificada

    // Distribución por categorías para gráfico
    const categoryDistribution = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count,
      percentage: (count / totalIndirectCosts) * 100
    }));

    return {
      totalIndirectCosts,
      activeCount: activeIndirectCosts.length,
      costsWithValuesCount: costsWithValues.length,
      totalValues: {
        ars: totalValueARS,
        usd: totalValueUSD
      },
      categoryDistribution,
      categoryCounts
    };
  }, [indirectCosts]);

  // Función para convertir montos según la vista seleccionada
  const convertAmount = (amountARS: number, originalCurrency: string = 'ARS') => {
    if (currencyView === 'discriminado') {
      return originalCurrency === 'USD' ? amountARS / 1125 : amountARS;
    } else if (currencyView === 'pesificado') {
      return originalCurrency === 'USD' ? amountARS : amountARS;
    } else if (currencyView === 'dolarizado') {
      return originalCurrency === 'ARS' ? amountARS / 1125 : amountARS / 1125;
    }
    return amountARS;
  };

  // Función para formatear montos con el símbolo correcto
  const formatCurrency = (amount: number, originalCurrency: string = 'ARS') => {
    const convertedAmount = convertAmount(amount, originalCurrency);
    
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

  // Filtrar costos indirectos por búsqueda y filtros
  const filteredIndirectCosts = indirectCosts.filter(indirectCost => {
    // Búsqueda por texto
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = indirectCost.name?.toLowerCase().includes(searchLower);
    const descriptionMatch = indirectCost.description?.toLowerCase().includes(searchLower);
    const categoryMatch = indirectCost.category?.toLowerCase().includes(searchLower);
    const searchMatch = !searchQuery || nameMatch || descriptionMatch || categoryMatch;
    
    // Filtro por categoría
    const categoryFilterMatch = filterByCategory === 'all' || indirectCost.category === filterByCategory;
    
    // Filtro por estado
    const statusFilterMatch = filterByStatus === 'all' || 
      (filterByStatus === 'active' && indirectCost.is_active) ||
      (filterByStatus === 'with_values' && indirectCost.current_value?.amount);
    
    return searchMatch && categoryFilterMatch && statusFilterMatch;
  });

  // Router navigation
  const [, setLocation] = useLocation();

  // Función para editar costo indirecto
  const handleEdit = (indirectCost: any) => {
    openModal('indirect-cost', {
      organizationId: userData?.organization?.id,
      isEditing: true,
      indirectCostId: indirectCost.id
    });
  };

  // Función para eliminar costo indirecto
  const handleDelete = (indirectCost: any) => {
    openModal('delete-confirmation', {
      title: 'Eliminar Costo Indirecto',
      message: `¿Estás seguro de que quieres eliminar el costo indirecto "${indirectCost.name}"? Esta acción no se puede deshacer.`,
      mode: 'dangerous',
      onConfirm: () => {
        deleteIndirectCost.mutate(indirectCost.id);
      }
    });
  };

  // Función para ver detalle
  const handleView = (id: string) => {
    // TODO: Implementar vista de detalle cuando esté disponible
    console.log('Ver detalle de costo indirecto:', id);
  };

  // Configuración de las columnas de la tabla
  const columns = [
    {
      key: 'name',
      label: 'Costo Indirecto',
      render: (indirectCost: any) => (
        <div>
          <div className="font-medium">{indirectCost.name}</div>
          {indirectCost.description && (
            <div className="text-xs text-muted-foreground line-clamp-1">{indirectCost.description}</div>
          )}
        </div>
      )
    },
    {
      key: 'category',
      label: 'Categoría',
      render: (indirectCost: any) => (
        <div>
          {indirectCost.category ? (
            <Badge variant="outline">{indirectCost.category}</Badge>
          ) : (
            <span className="text-muted-foreground text-sm">Sin categoría</span>
          )}
        </div>
      )
    },
    {
      key: 'unit',
      label: 'Unidad',
      render: (indirectCost: any) => (
        <div>
          {indirectCost.unit ? (
            <div>
              <div className="font-medium">{indirectCost.unit.name}</div>
              <div className="text-xs text-muted-foreground">{indirectCost.unit.symbol}</div>
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">Sin unidad</span>
          )}
        </div>
      )
    },
    {
      key: 'current_value',
      label: 'Valor Actual',
      render: (indirectCost: any) => (
        <div>
          {indirectCost.current_value?.amount ? (
            <div>
              <div className="font-medium">
                {formatCurrency(indirectCost.current_value.amount)}
              </div>
              {indirectCost.current_value.valid_from && (
                <div className="text-xs text-muted-foreground">
                  Desde: {format(new Date(indirectCost.current_value.valid_from), 'dd/MM/yyyy')}
                </div>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground text-sm">Sin valor</span>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Estado',
      render: (indirectCost: any) => (
        <div>
          {indirectCost.is_active ? (
            <Badge style={{ backgroundColor: 'var(--accent)', color: 'white', border: 'none' }}>
              Activo
            </Badge>
          ) : (
            <Badge variant="outline" style={{ color: '#6b7280' }}>
              Inactivo
            </Badge>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Acciones',
      render: (indirectCost: any) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleView(indirectCost.id)}
            className=""
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(indirectCost)}
            className=""
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(indirectCost)}
            className=" text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">Cargando costos indirectos...</div>
      </div>
    );
  }

  // Si no hay datos, mostrar EmptyState
  if (indirectCosts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState
          icon={<DollarSign className="w-8 h-8 text-muted-foreground" />}
          title="No hay costos indirectos"
          description="Comienza agregando tu primer costo indirecto para el análisis financiero"
          action={
            <Button onClick={handleCreateIndirectCost}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Costo Indirecto
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {kpiData && (
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'}`}>
          {/* Total Costos Indirectos */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`space-y-${isMobile ? '2' : '4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    {isMobile ? 'Costos' : 'Total Costos'}
                  </p>
                  <Building className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
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
                        opacity: i < kpiData.totalIndirectCosts ? 1 : 0.3
                      }}
                    />
                  ))}
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>{kpiData.totalIndirectCosts}</p>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    {kpiData.activeCount} activos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Valor Total */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`space-y-${isMobile ? '2' : '4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    {isMobile ? 'Valor Total' : 'Valor Total'}
                  </p>
                  <Receipt className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
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
                    {kpiData.costsWithValuesCount} con valores
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Categorías */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`space-y-${isMobile ? '2' : '4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    {isMobile ? 'Categorías' : 'Categorías'}
                  </p>
                  <TrendingUp className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
                </div>
                
                {/* Gráfico de distribución - altura fija */}
                <div className={`${isMobile ? 'h-6' : 'h-8'} relative`}>
                  <div className="flex h-full w-full rounded-full overflow-hidden">
                    {kpiData.categoryDistribution.map((category, index) => (
                      <div
                        key={index}
                        className="h-full"
                        style={{
                          width: `${category.percentage}%`,
                          backgroundColor: `hsl(${(index * 137.5) % 360}, 70%, 50%)`,
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>
                    {Object.keys(kpiData.categoryCounts).length}
                  </p>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    Diferentes
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
                  <CreditCard className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
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
                      d={`M 0,32 L 0,${32 - ((kpiData.activeCount / kpiData.totalIndirectCosts) * 30)} Q 25,${20 - ((kpiData.activeCount / kpiData.totalIndirectCosts) * 0.2)} 50,${16 - ((kpiData.activeCount / kpiData.totalIndirectCosts) * 0.25)} T 100,${12 - ((kpiData.activeCount / kpiData.totalIndirectCosts) * 0.2)} L 100,32 Z`}
                      fill="url(#areaGradient)"
                    />
                  </svg>
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>
                    {((kpiData.activeCount / kpiData.totalIndirectCosts) * 100).toFixed(0)}%
                  </p>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    Activos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla de costos indirectos */}
      <Table
        data={filteredIndirectCosts}
        columns={columns}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        searchPlaceholder="Buscar costos indirectos..."
        actionButton={{
          label: "Nuevo Costo Indirecto",
          onClick: handleCreateIndirectCost,
          icon: Plus
        }}
      />
    </div>
  );
}