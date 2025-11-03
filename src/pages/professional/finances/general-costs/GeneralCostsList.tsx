import { useState, useMemo } from "react";
import { Receipt, Plus, Edit, Trash2, Eye, TrendingUp, Building, CreditCard } from "lucide-react";
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
import { useGeneralCosts, useDeleteGeneralCost } from "@/hooks/use-general-costs";
import { useMobile } from '@/hooks/use-mobile';

interface GeneralCostsListProps {
  filterByCategory?: string;
  filterByStatus?: string;
  onNewGeneralCost?: () => void;
}

export default function GeneralCostsList({ filterByCategory = 'all', filterByStatus = 'all', onNewGeneralCost }: GeneralCostsListProps) {
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const deleteGeneralCost = useDeleteGeneralCost();
  const isMobile = useMobile();
  
  // Estado para controles del TableTopBar
  const [searchQuery, setSearchQuery] = useState('');
  const [currencyView, setCurrencyView] = useState<'discriminado' | 'pesificado' | 'dolarizado'>('discriminado');

  // Función para crear gasto general
  const handleCreateGeneralCost = () => {
    if (onNewGeneralCost) {
      onNewGeneralCost();
    } else {
      openModal('general-costs', {
        organizationId: userData?.organization?.id,
        isEditing: false
      });
    }
  };
  
  // Datos de gastos generales
  const { data: generalCosts = [], isLoading } = useGeneralCosts(userData?.organization?.id || null);

  // Cálculos para KPIs de gastos generales
  const kpiData = useMemo(() => {
    if (generalCosts.length === 0) return null;

    const totalGeneralCosts = generalCosts.length;
    const activeGeneralCosts = generalCosts.filter(gc => gc.is_active);
    const costsWithValues = generalCosts.filter(gc => (gc as any).current_value?.amount);
    
    // Agrupar por categorías
    const categoryCounts = generalCosts.reduce((acc, cost) => {
      const category = cost.category || 'Sin categoría';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Calcular valores totales
    const totalValueARS = generalCosts.reduce((sum, cost) => {
      return sum + ((cost as any).current_value?.amount || 0);
    }, 0);

    const totalValueUSD = totalValueARS / 1125; // Conversión simplificada

    // Distribución por categorías para gráfico
    const categoryDistribution = Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count,
      percentage: (count / totalGeneralCosts) * 100
    }));

    return {
      totalGeneralCosts,
      activeCount: activeGeneralCosts.length,
      costsWithValuesCount: costsWithValues.length,
      totalValues: {
        ars: totalValueARS,
        usd: totalValueUSD
      },
      categoryDistribution,
      categoryCounts
    };
  }, [generalCosts]);

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

  // Filtrar gastos generales por búsqueda y filtros
  const filteredGeneralCosts = generalCosts.filter(generalCost => {
    // Búsqueda por texto
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = generalCost.name?.toLowerCase().includes(searchLower);
    const descriptionMatch = generalCost.description?.toLowerCase().includes(searchLower);
    const categoryMatch = generalCost.category?.toLowerCase().includes(searchLower);
    const searchMatch = !searchQuery || nameMatch || descriptionMatch || categoryMatch;
    
    // Filtro por categoría
    const categoryFilterMatch = filterByCategory === 'all' || generalCost.category === filterByCategory;
    
    // Filtro por estado
    const statusFilterMatch = filterByStatus === 'all' || 
      (filterByStatus === 'active' && generalCost.is_active) ||
      (filterByStatus === 'with_values' && (generalCost as any).current_value?.amount);
    
    return searchMatch && categoryFilterMatch && statusFilterMatch;
  });

  // Router navigation
  const [, setLocation] = useLocation();

  // Función para editar gasto general
  const handleEdit = (generalCost: any) => {
    openModal('general-costs', {
      organizationId: userData?.organization?.id,
      isEditing: true,
      generalCostId: generalCost.id
    });
  };

  // Función para eliminar gasto general
  const handleDelete = (generalCost: any) => {
    openModal('delete-confirmation', {
      title: 'Eliminar Gasto General',
      message: `¿Estás seguro de que quieres eliminar el gasto general "${generalCost.name}"? Esta acción no se puede deshacer.`,
      mode: 'dangerous',
      onConfirm: () => {
        deleteGeneralCost.mutate(generalCost.id);
      }
    });
  };

  // Función para ver detalle
  const handleView = (id: string) => {
    // TODO: Implementar vista de detalle cuando esté disponible
    console.log('Ver detalle de gasto general:', id);
  };

  // Configuración de las columnas de la tabla
  const columns = [
    {
      key: 'name',
      label: 'Gasto General',
      render: (generalCost: any) => (
        <div>
          <div className="font-medium">{generalCost.name}</div>
          {generalCost.description && (
            <div className="text-xs text-muted-foreground line-clamp-1">{generalCost.description}</div>
          )}
        </div>
      )
    },
    {
      key: 'category',
      label: 'Categoría',
      render: (generalCost: any) => (
        <div>
          {generalCost.category ? (
            <Badge variant="outline">{generalCost.category}</Badge>
          ) : (
            <span className="text-muted-foreground text-sm">Sin categoría</span>
          )}
        </div>
      )
    },
    {
      key: 'created_at',
      label: 'Fecha de Creación',
      render: (generalCost: any) => (
        <div>
          {generalCost.created_at && (
            <div className="text-xs">
              {format(new Date(generalCost.created_at), 'dd/MM/yyyy', { locale: es })}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'status',
      label: 'Estado',
      render: (generalCost: any) => (
        <div>
          {generalCost.is_active ? (
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
    }
  ];

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">Cargando gastos generales...</div>
      </div>
    );
  }

  // Si no hay datos, mostrar EmptyState
  if (generalCosts.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <EmptyState
          icon={<Receipt className="w-8 h-8 text-muted-foreground" />}
          title="No hay gastos generales"
          description="Comienza agregando tu primer gasto general para el análisis financiero"
          action={
            <Button onClick={handleCreateGeneralCost}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Gasto General
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
          {/* Total Gastos Generales */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`space-y-${isMobile ? '2' : '4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    {isMobile ? 'Gastos' : 'Total Gastos'}
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
                        opacity: i < kpiData.totalGeneralCosts ? 1 : 0.3
                      }}
                    />
                  ))}
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>{kpiData.totalGeneralCosts}</p>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    {kpiData.activeCount} activos
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
                      d={`M 0,32 L 0,${32 - ((kpiData.activeCount / kpiData.totalGeneralCosts) * 30)} Q 25,${20 - ((kpiData.activeCount / kpiData.totalGeneralCosts) * 0.2)} 50,${16 - ((kpiData.activeCount / kpiData.totalGeneralCosts) * 0.25)} T 100,${12 - ((kpiData.activeCount / kpiData.totalGeneralCosts) * 0.2)} L 100,32 Z`}
                      fill="url(#areaGradient)"
                    />
                  </svg>
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>
                    {((kpiData.activeCount / kpiData.totalGeneralCosts) * 100).toFixed(0)}%
                  </p>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    Activos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Organización */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`space-y-${isMobile ? '2' : '4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    {isMobile ? 'Scope' : 'Alcance'}
                  </p>
                  <Receipt className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
                </div>
                
                {/* Indicador organizacional */}
                <div className={`${isMobile ? 'h-6' : 'h-8'} relative flex items-center`}>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full w-full"></div>
                  </div>
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>
                    Org.
                  </p>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    General
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla de gastos generales */}
      <Table
        data={filteredGeneralCosts}
        columns={columns}
        topBar={{
          searchValue: searchQuery,
          onSearchChange: setSearchQuery,
          showSearch: true,
          customActions: (
            <Button onClick={handleCreateGeneralCost} size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Gasto General
            </Button>
          )
        }}
        rowActions={(generalCost) => [
          {
            icon: Eye,
            label: 'Ver detalle',
            onClick: () => handleView(generalCost.id)
          },
          {
            icon: Edit,
            label: 'Editar',
            onClick: () => handleEdit(generalCost)
          },
          {
            icon: Trash2,
            label: 'Eliminar',
            onClick: () => handleDelete(generalCost),
            variant: 'destructive' as const
          }
        ]}
      />
    </div>
  );
}