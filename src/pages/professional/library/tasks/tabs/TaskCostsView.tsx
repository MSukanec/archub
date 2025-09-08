import { useState, useMemo } from "react";
import { Package, Plus, Edit, Trash2, Eye, Award, DollarSign, TrendingUp, Calculator, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useLocation } from "wouter";

import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useMobile } from '@/hooks/use-mobile';
import { useTaskCosts } from '@/hooks/use-task-costs';
import { useDeleteTaskMaterial } from '@/hooks/use-generated-tasks';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

interface TaskCostsViewProps {
  task: any;
}

export function TaskCostsView({ task }: TaskCostsViewProps) {
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const isMobile = useMobile();
  const [, navigate] = useLocation();
  
  // Verificar si el usuario es administrador
  const isAdmin = userData?.role?.name === 'Administrador' || userData?.role?.name === 'Admin';
  
  // Estados para controles del TableTopBar
  const [searchQuery, setSearchQuery] = useState('');
  const [currencyView, setCurrencyView] = useState<'discriminado' | 'pesificado' | 'dolarizado'>('discriminado');
  const [groupBy, setGroupBy] = useState<string | undefined>('tipo');

  // Obtener datos reales de costos usando el hook unificado (materiales + mano de obra)
  const taskId = task?.task_id || task?.id;
  const { data: costs = [], isLoading } = useTaskCosts(taskId);

  // Mutaciones para eliminar costos
  const queryClient = useQueryClient();
  const deleteMaterialMutation = useDeleteTaskMaterial();
  
  const deleteLaborMutation = useMutation({
    mutationFn: async (laborId: string) => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { error } = await supabase
        .from('task_labor')
        .delete()
        .eq('id', laborId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-costs', taskId] });
      queryClient.invalidateQueries({ queryKey: ['task-labor'] });
      toast({
        title: "Mano de obra eliminada",
        description: "La mano de obra se ha eliminado de la tarea"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Error al eliminar la mano de obra",
        variant: "destructive"
      });
    }
  });

  // Cálculos para KPIs de costos
  const kpiData = useMemo(() => {
    if (costs.length === 0) return null;

    // Separar materiales y mano de obra
    const materialCosts = costs.filter(c => c.type === 'Material');
    const laborCosts = costs.filter(c => c.type === 'Mano de Obra');
    
    const materialTotal = materialCosts.reduce((sum, c) => sum + (c.total_price || 0), 0);
    const laborTotal = laborCosts.reduce((sum, c) => sum + (c.total_price || 0), 0);
    const grandTotal = materialTotal + laborTotal;
    
    // Encontrar la fecha de última actualización (usar fecha actual como fallback)
    const lastUpdate = new Date();

    return {
      materialTotal,
      laborTotal,
      grandTotal,
      lastUpdate
    };
  }, [costs]);

  // Función para formatear montos
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Filtrar costos por búsqueda
  const filteredCosts = costs.filter(cost => {
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = cost.name?.toLowerCase().includes(searchLower);
    const categoryMatch = cost.category?.toLowerCase().includes(searchLower);
    const typeMatch = cost.type?.toLowerCase().includes(searchLower);
    return !searchQuery || nameMatch || categoryMatch || typeMatch;
  });

  // Función para abrir modal de agregar costo
  const handleAddCost = () => {
    openModal('cost-modal', { task });
  };

  // Función para editar costo
  const handleEditCost = (cost: any) => {
    openModal('cost-modal', { 
      task, 
      isEditing: true,
      costData: cost
    });
  };

  // Función para eliminar costo
  const handleDeleteCost = (cost: any) => {
    const costTypeName = cost.type === 'Material' ? 'material' : 'mano de obra';
    
    openModal('delete-confirmation', {
      mode: 'simple',
      title: `Eliminar ${costTypeName}`,
      description: `¿Estás seguro que querés eliminar "${cost.name}" de esta tarea?`,
      itemName: cost.name,
      itemType: costTypeName,
      destructiveActionText: `Eliminar ${costTypeName}`,
      onConfirm: async () => {
        try {
          if (cost.type === 'Material') {
            // Eliminar material de tarea usando la mutación correspondiente
            await deleteMaterialMutation.mutateAsync(cost.id);
          } else if (cost.type === 'Mano de Obra') {
            // Eliminar mano de obra de tarea usando la mutación correspondiente  
            await deleteLaborMutation.mutateAsync(cost.id);
          }
        } catch (error) {
          console.error('Error eliminando costo:', error);
        }
      }
    });
  };

  // Definir columnas de la tabla
  const columns = [
    {
      key: 'type',
      label: 'Tipo',
      sortable: true,
      width: '15%',
      render: (cost: any) => (
        <div className="font-medium">{cost.type}</div>
      )
    },
    {
      key: 'name',
      label: 'Concepto',
      sortable: true,
      width: '35%',
      render: (cost: any) => (
        <div>
          <div className="text-sm text-muted-foreground">{cost.name}</div>
          <div className="font-medium">{cost.category}</div>
        </div>
      )
    },
    {
      key: 'quantity',
      label: 'Cantidad',
      sortable: true,
      render: (cost: any) => (
        <div className="font-medium">
          {cost.quantity} {cost.unit}
        </div>
      )
    },
    {
      key: 'unit_price',
      label: 'Precio Unitario Promedio',
      sortable: true,
      render: (cost: any) => (
        <div className="text-right">
          {formatCurrency(cost.unit_price)}
        </div>
      )
    },
    {
      key: 'total_price',
      label: 'Subtotal',
      sortable: true,
      render: (cost: any) => (
        <div className="text-right font-medium">
          {formatCurrency(cost.total_price)}
        </div>
      )
    },
    // Solo mostrar acciones si el usuario es administrador
    ...(isAdmin ? [{
      key: 'actions',
      label: 'Acciones',
      sortable: false,
      render: (cost: any) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleEditCost(cost)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleDeleteCost(cost)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }] : [])
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {kpiData && (
        <div className={`grid ${isMobile ? 'grid-cols-2 gap-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'}`}>
          {/* Costo de Materiales */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`space-y-${isMobile ? '2' : '4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    Costo de Materiales
                  </p>
                  <Package className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
                </div>
                
                {/* Gráfico representativo de materiales */}
                <div className={`flex items-end gap-1 ${isMobile ? 'h-6' : 'h-8'}`}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="rounded-sm flex-1"
                      style={{
                        backgroundColor: 'var(--accent)',
                        height: `${Math.max(20, (kpiData.materialTotal / kpiData.grandTotal) * 100 * Math.random() * 0.8 + 40)}%`,
                        opacity: kpiData.materialTotal > 0 ? 0.8 + (i * 0.05) : 0.3
                      }}
                    />
                  ))}
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>
                    {formatCurrency(kpiData.materialTotal)}
                  </p>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    {kpiData.grandTotal > 0 ? `${Math.round((kpiData.materialTotal / kpiData.grandTotal) * 100)}% del total` : 'Sin datos'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Costo de Mano de Obra */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`space-y-${isMobile ? '2' : '4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    Costo de Mano de Obra
                  </p>
                  <TrendingUp className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
                </div>
                
                {/* Gráfico representativo de mano de obra */}
                <div className={`flex items-center gap-1 ${isMobile ? 'h-6' : 'h-8'}`}>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-1 rounded-full"
                      style={{
                        backgroundColor: 'var(--accent)',
                        height: `${kpiData.laborTotal > 0 ? 30 + Math.sin(i * 0.4) * 30 : 20}%`,
                        opacity: kpiData.laborTotal > 0 ? 0.6 + (i * 0.05) : 0.3
                      }}
                    />
                  ))}
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>
                    {formatCurrency(kpiData.laborTotal)}
                  </p>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    {kpiData.grandTotal > 0 ? `${Math.round((kpiData.laborTotal / kpiData.grandTotal) * 100)}% del total` : 'Sin datos'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Costo Total */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`space-y-${isMobile ? '2' : '4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    Costo Total
                  </p>
                  <DollarSign className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
                </div>
                
                {/* Barra de progreso total */}
                <div className={`${isMobile ? 'h-6' : 'h-8'} bg-muted rounded-full overflow-hidden flex`}>
                  <div 
                    className="rounded-l-full transition-all duration-300"
                    style={{
                      backgroundColor: 'var(--accent)',
                      width: kpiData.grandTotal > 0 ? `${(kpiData.materialTotal / kpiData.grandTotal) * 100}%` : '0%',
                      opacity: 0.8
                    }}
                  />
                  <div 
                    className="rounded-r-full transition-all duration-300"
                    style={{
                      backgroundColor: 'var(--accent)',
                      width: kpiData.grandTotal > 0 ? `${(kpiData.laborTotal / kpiData.grandTotal) * 100}%` : '0%',
                      opacity: 0.6
                    }}
                  />
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold`}>
                    {formatCurrency(kpiData.grandTotal)}
                  </p>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    Materiales + Mano de Obra
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Última Actualización */}
          <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
            <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
              <div className={`space-y-${isMobile ? '2' : '4'}`}>
                <div className="flex items-center justify-between">
                  <p className={`${isMobile ? 'text-xs' : 'text-sm'} text-muted-foreground`}>
                    Última Actualización
                  </p>
                  <Calendar className={`${isMobile ? 'h-4 w-4' : 'h-6 w-6'}`} style={{ color: 'var(--accent)' }} />
                </div>
                
                {/* Indicador temporal */}
                <div className={`flex items-center justify-center ${isMobile ? 'h-6' : 'h-8'}`}>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: 'var(--accent)',
                          opacity: i < 3 ? 1 : 0.3,
                          animation: i < 3 ? `pulse 2s infinite ${i * 0.5}s` : 'none'
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <p className={`${isMobile ? 'text-sm' : 'text-lg'} font-bold`}>
                    {format(kpiData.lastUpdate, 'dd/MM/yyyy', { locale: es })}
                  </p>
                  <p className={`${isMobile ? 'text-xs' : 'text-xs'} text-muted-foreground`}>
                    {format(kpiData.lastUpdate, 'HH:mm', { locale: es })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabla de Costos */}
      {isLoading ? (
        // Estado de carga
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-muted/20 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : filteredCosts.length > 0 ? (
        <Table
          data={filteredCosts}
          columns={groupBy === 'tipo' ? columns.filter(col => col.key !== 'type') : columns}
          groupBy={groupBy === 'tipo' ? 'type' : undefined}
          renderGroupHeader={(groupKey: string, groupRows: any[]) => {
            // Calcular total del grupo
            const groupTotal = groupRows.reduce((sum, cost) => sum + (cost.total_price || 0), 0);
            
            const formatCurrency = (amount: number) => {
              return new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: 'ARS',
                minimumFractionDigits: 0,
                maximumFractionDigits: 0
              }).format(amount);
            };

            return (
              <>
                <div className="truncate text-sm font-medium">
                  {groupKey} ({groupRows.length} {groupRows.length === 1 ? 'ítem' : 'ítems'})
                </div>
                <div></div>
                <div></div>
                <div className="text-left font-medium">
                  {formatCurrency(groupTotal)}
                </div>
                {/* Solo mostrar div vacío para acciones si el usuario es administrador */}
                {isAdmin && <div></div>}
              </>
            );
          }}
          topBar={{
            showSearch: true,
            onSearchChange: setSearchQuery,
            searchValue: searchQuery,
            groupingOptions: [
              { value: 'tipo', label: 'Tipo' },
              { value: '', label: 'Sin agrupar' }
            ],
            currentGrouping: groupBy || '',
            onGroupingChange: (value: string) => setGroupBy(value || undefined),
            isGroupingActive: !!groupBy
          }}
        />
      ) : (
        <EmptyState
          icon={<Package className="h-16 w-16" />}
          title="Sin costos configurados"
          description="Los costos asociados a esta tarea aparecerán aquí."
          action={
            // Solo mostrar botón si el usuario es administrador
            isAdmin ? (
              <Button variant="default" size="sm" onClick={handleAddCost}>
                <Plus className="h-4 w-4 mr-2" />
                Agregar Costo
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  );
}