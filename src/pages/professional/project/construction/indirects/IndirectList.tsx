import { useState, useMemo } from "react";
import { TrendingUp, Plus, Edit, Trash2, Eye, DollarSign, Package } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useLocation } from "wouter";

import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useProjectContext } from '@/stores/projectContext';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useMobile } from '@/hooks/use-mobile';
import { useIndirectCosts } from '@/hooks/use-indirect-costs';

interface IndirectListProps {
  filterByStatus?: string;
  filterByType?: string;
}

export default function IndirectList({ filterByStatus = 'all', filterByType = 'all' }: IndirectListProps) {
  const { data: userData } = useCurrentUser();
  const { selectedProjectId, currentOrganizationId } = useProjectContext();
  const { openModal } = useGlobalModalStore();
  const isMobile = useMobile();
  
  // Estado para controles del TableTopBar
  const [searchQuery, setSearchQuery] = useState('');
  const [currencyView, setCurrencyView] = useState<'discriminado' | 'pesificado' | 'dolarizado'>('discriminado');

  // Función para crear costo indirecto
  const handleCreateIndirect = () => {
    openModal('indirect', {
      projectId: selectedProjectId,
      organizationId: currentOrganizationId,
      userId: userData?.user?.id,
      isEditing: false
    });
  };
  
  // Datos de costos indirectos usando el hook existente
  const { data: indirects = [], isLoading } = useIndirectCosts(currentOrganizationId || null);

  // Cálculos para KPIs de costos indirectos
  const kpiData = useMemo(() => {
    if (indirects.length === 0) return null;

    const totalIndirects = indirects.length;

    // Calcular valores totales usando el valor más reciente de cada costo indirecto
    const totalValueARS = indirects.reduce((sum, indirect) => {
      const currentValue = indirect.current_value;
      if (currentValue) {
        const amount = currentValue.amount || 0;
        return sum + amount;
      }
      return sum;
    }, 0);
    
    const totalValueUSD = totalValueARS / 1125; // Convertir a USD

    // Distribución por categoría
    const categoryDistribution = indirects.reduce((acc, indirect) => {
      const category = indirect.category?.name || 'Sin categoría';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalIndirects,
      totalValueARS,
      totalValueUSD,
      categoryDistribution
    };
  }, [indirects]);

  // Función para convertir montos según la vista seleccionada
  const convertAmount = (amountARS: number, amountUSD: number, originalCurrency: string = 'ARS') => {
    if (currencyView === 'discriminado') {
      return originalCurrency === 'USD' ? amountUSD : amountARS;
    } else if (currencyView === 'pesificado') {
      return originalCurrency === 'USD' ? amountUSD * 1125 : amountARS;
    } else if (currencyView === 'dolarizado') {
      return originalCurrency === 'ARS' ? amountARS / 1125 : amountUSD;
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

  // Filtrar costos indirectos por búsqueda y filtros móviles
  const filteredIndirects = indirects.filter(indirect => {
    // Búsqueda por texto
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = indirect.name?.toLowerCase().includes(searchLower);
    const descriptionMatch = indirect.description?.toLowerCase().includes(searchLower);
    const searchMatch = !searchQuery || nameMatch || descriptionMatch;
    
    // Filtro por status (siempre true ya que no hay campo is_active)
    const statusMatch = true;
    
    // Filtro por categoría
    const typeMatch = filterByType === 'all' || indirect.category?.name === filterByType;
    
    return searchMatch && statusMatch && typeMatch;
  });

  // Router navigation
  const [, setLocation] = useLocation();

  // Función para editar costo indirecto
  const handleEdit = (indirect: any) => {
    openModal('indirect', {
      projectId: selectedProjectId,
      organizationId: currentOrganizationId,
      userId: userData?.user?.id,
      isEditing: true,
      indirectId: indirect.id
    });
  };

  // Función para eliminar costo indirecto
  const handleDelete = (indirect: any) => {
    openModal('delete-confirmation', {
      title: 'Eliminar Costo Indirecto',
      message: `¿Estás seguro de que quieres eliminar el costo indirecto "${indirect.name}"? Esta acción no se puede deshacer.`,
      mode: 'dangerous',
      onConfirm: async () => {
        // TODO: Implement delete functionality
      }
    });
  };

  // Función para ver detalle
  const handleView = (id: string) => {
    setLocation(`/construction/indirects/${id}`);
  };

  // Configuración de las columnas de la tabla
  const columns = [
    {
      key: 'name',
      label: 'Costo Indirecto',
      render: (indirect: any) => (
        <div>
          <div className="font-medium">{indirect.name}</div>
          {indirect.description && (
            <div className="text-xs text-muted-foreground">{indirect.description}</div>
          )}
        </div>
      )
    },
    {
      key: 'category',
      label: 'Categoría',
      render: (indirect: any) => (
        <div className="text-sm">
          {indirect.category_id ? 'Categoría asignada' : 'Sin categoría'}
        </div>
      )
    },
    {
      key: 'current_value',
      label: 'Valor Actual',
      render: (indirect: any) => {
        const currentValue = indirect.current_value;
        if (!currentValue) return '-';
        
        const amount = currentValue.amount || 0;
        
        return (
          <div className="text-right">
            <div className="font-medium text-sm">
              ${amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
          </div>
        );
      }
    },
    {
      key: 'status',
      label: 'Estado',
      render: (indirect: any) => {
        return indirect.is_active ? (
          <Badge className="bg-green-50 text-green-700 border-green-200">
            Activo
          </Badge>
        ) : (
          <Badge variant="secondary">
            Inactivo
          </Badge>
        );
      }
    }
  ];

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="text-muted-foreground">Cargando costos indirectos...</div>
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
                  <TrendingUp className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
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
                        opacity: i < kpiData.totalIndirects ? 1 : 0.3
                      }}
                    />
                  ))}
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>{kpiData.totalIndirects}</p>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    {kpiData.totalIndirects} activos
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
                  <DollarSign className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
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
                      ? `$${kpiData.totalValueARS.toLocaleString('es-AR')}`
                      : currencyView === 'dolarizado'
                      ? `US$${kpiData.totalValueUSD.toLocaleString('es-AR')}`
                      : `$${kpiData.totalValueARS.toLocaleString('es-AR')}`
                    }
                  </p>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    100%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Costos Activos */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`space-y-${isMobile ? '2' : '4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    {isMobile ? 'Activos' : 'Costos Activos'}
                  </p>
                  <Package className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
                </div>
                
                {/* Barra de progreso - altura fija */}
                <div className={`${isMobile ? 'h-6' : 'h-8'} flex items-center`}>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `100%`,
                        background: 'linear-gradient(90deg, var(--accent) 0%, #22c55e 100%)'
                      }}
                    />
                  </div>
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>
                    {kpiData.totalIndirects}
                  </p>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    de {kpiData.totalIndirects}
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
                  <TrendingUp className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
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
                      d={`M 0,32 L 0,20 Q 25,16 50,12 T 100,8 L 100,32 Z`}
                      fill="url(#areaGradient)"
                    />
                  </svg>
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>100%</p>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    Activos
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Lista/Tabla de Costos Indirectos */}
      {filteredIndirects.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="w-12 h-12 text-muted-foreground" />}
          title="No hay costos indirectos"
          description={searchQuery ? "No se encontraron costos indirectos que coincidan con tu búsqueda." : "Aún no has creado ningún costo indirecto. Haz clic en 'Nuevo Costo Indirecto' para comenzar."}
          action={
            <Button onClick={handleCreateIndirect}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Costo Indirecto
            </Button>
          }
        />
      ) : (
        // Vista desktop - usar Table
        <Table 
          data={filteredIndirects}
          columns={columns}
          getItemId={(record: any) => record.id}
          rowActions={(indirect) => [
            {
              icon: Eye,
              label: 'Ver',
              onClick: () => handleView(indirect.id)
            },
            {
              icon: Edit,
              label: 'Editar',
              onClick: () => handleEdit(indirect)
            },
            {
              icon: Trash2,
              label: 'Eliminar',
              onClick: () => handleDelete(indirect),
              variant: 'destructive' as const
            }
          ]}
        />
      )}
    </div>
  );
}