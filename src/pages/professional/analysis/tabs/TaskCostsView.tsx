import { useState, useMemo, useEffect } from "react";
import { Package, Plus, Edit, Trash2, DollarSign, TrendingUp, Calendar, Settings, Save, Truck, Users } from "lucide-react";
import { formatDate, formatTime } from "@/lib/date-utils";
import { useLocation } from "wouter";

import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { BreakdownChart } from '@/components/charts/BreakdownChart';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { useCurrentUser } from "@/hooks/use-current-user";
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useMobile } from '@/hooks/use-mobile';
import { useTaskCosts } from '@/hooks/use-task-costs';
import { useDeleteTaskMaterial } from '@/hooks/use-generated-tasks';
import { useOrganizationTaskPrice, useUpsertOrganizationTaskPrice, useDeleteOrganizationTaskPrice, type OrganizationTaskPriceData } from '@/hooks/use-organization-task-prices';
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

  // Custom pricing functionality
  const { data: customPrice } = useOrganizationTaskPrice(taskId);
  const upsertCustomPrice = useUpsertOrganizationTaskPrice();
  const deleteCustomPrice = useDeleteOrganizationTaskPrice();

  // Estados para edición individual de cada card
  const [isEditingMaterial, setIsEditingMaterial] = useState(false);
  const [isEditingLabor, setIsEditingLabor] = useState(false);
  const [isEditingSupply, setIsEditingSupply] = useState(false);
  const [customMaterialCost, setCustomMaterialCost] = useState<string>('');
  const [customLaborCost, setCustomLaborCost] = useState<string>('');
  const [customSupplyCost, setCustomSupplyCost] = useState<string>('');

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

    // Separar materiales, mano de obra e insumos
    const materialCosts = costs.filter(c => c.type === 'Material');
    const laborCosts = costs.filter(c => c.type === 'Mano de Obra');
    const supplyCosts = costs.filter(c => c.type === 'Insumos');
    
    const materialTotal = materialCosts.reduce((sum, c) => sum + (c.total_price || 0), 0);
    const laborTotal = laborCosts.reduce((sum, c) => sum + (c.total_price || 0), 0);
    const supplyTotal = supplyCosts.reduce((sum, c) => sum + (c.total_price || 0), 0);
    const grandTotal = materialTotal + laborTotal + supplyTotal;
    
    // Encontrar la fecha de última actualización (usar fecha actual como fallback)
    const lastUpdate = new Date();

    return {
      materialTotal,
      laborTotal,
      supplyTotal,
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

  // Cargar precios personalizados al inicializar
  useEffect(() => {
    if (customPrice) {
      setCustomMaterialCost(customPrice.material_unit_cost?.toString() || '');
      setCustomLaborCost(customPrice.labor_unit_cost?.toString() || '');
      setCustomSupplyCost(customPrice.supply_unit_cost?.toString() || '');
    }
  }, [customPrice]);

  // Función para guardar material cost
  const handleSaveMaterialCost = async (data: { materialCost: string }) => {
    try {
      // Handle different input scenarios:
      // Empty string "" -> save null (revert to calculated)
      // String "0" -> save 0 (explicit zero override)
      // Valid number strings -> save parsed number
      let materialCostValue: number | null = null;
      if (data.materialCost.trim() !== '') {
        const parsed = parseFloat(data.materialCost);
        if (!isNaN(parsed)) {
          materialCostValue = parsed;
        }
      }
      
      const priceData: OrganizationTaskPriceData = {
        task_id: taskId,
        currency_code: 'ARS',
        note: null,
        material_unit_cost: materialCostValue,
        labor_unit_cost: customPrice?.labor_unit_cost || null,
        supply_unit_cost: customPrice?.supply_unit_cost || null,
        total_unit_cost: null
      };
      await upsertCustomPrice.mutateAsync(priceData);
      setIsEditingMaterial(false);
    } catch (error) {
      console.error('Error saving material cost:', error);
    }
  };

  // Función para guardar labor cost
  const handleSaveLaborCost = async (data: { laborCost: string }) => {
    try {
      // Handle different input scenarios:
      // Empty string "" -> save null (revert to calculated)
      // String "0" -> save 0 (explicit zero override)
      // Valid number strings -> save parsed number
      let laborCostValue: number | null = null;
      if (data.laborCost.trim() !== '') {
        const parsed = parseFloat(data.laborCost);
        if (!isNaN(parsed)) {
          laborCostValue = parsed;
        }
      }
      
      const priceData: OrganizationTaskPriceData = {
        task_id: taskId,
        currency_code: 'ARS',
        note: null,
        material_unit_cost: customPrice?.material_unit_cost || null,
        labor_unit_cost: laborCostValue,
        supply_unit_cost: customPrice?.supply_unit_cost || null,
        total_unit_cost: null
      };
      await upsertCustomPrice.mutateAsync(priceData);
      setIsEditingLabor(false);
    } catch (error) {
      console.error('Error saving labor cost:', error);
    }
  };

  // Función para guardar supply cost
  const handleSaveSupplyCost = async (data: { supplyCost: string }) => {
    try {
      // Handle different input scenarios:
      // Empty string "" -> save null (revert to calculated)
      // String "0" -> save 0 (explicit zero override)
      // Valid number strings -> save parsed number
      let supplyCostValue: number | null = null;
      if (data.supplyCost.trim() !== '') {
        const parsed = parseFloat(data.supplyCost);
        if (!isNaN(parsed)) {
          supplyCostValue = parsed;
        }
      }
      
      const priceData: OrganizationTaskPriceData = {
        task_id: taskId,
        currency_code: 'ARS',
        note: null,
        material_unit_cost: customPrice?.material_unit_cost || null,
        labor_unit_cost: customPrice?.labor_unit_cost || null,
        supply_unit_cost: supplyCostValue,
        total_unit_cost: null
      };
      await upsertCustomPrice.mutateAsync(priceData);
      setIsEditingSupply(false);
    } catch (error) {
      console.error('Error saving supply cost:', error);
    }
  };


  const handleDeleteCustomPrice = async () => {
    try {
      await deleteCustomPrice.mutateAsync(taskId);
      setCustomMaterialCost('');
      setCustomLaborCost('');
      setCustomSupplyCost('');
      setIsEditingMaterial(false);
      setIsEditingLabor(false);
      setIsEditingSupply(false);
    } catch (error) {
      console.error('Error deleting custom price:', error);
    }
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
        <div className="font-medium">{cost.type === 'Material' ? 'Materiales' : cost.type}</div>
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
      {/* Layout con gráfico (3/4) y precios personalizados (1/4) */}
      {kpiData && (
        <div className={`${isMobile ? 'space-y-6' : 'flex gap-6'}`}>
          {/* Cost Breakdown Chart - 3/4 del ancho */}
          <div className={`${isMobile ? 'w-full' : 'flex-1'}`} style={isMobile ? {} : { flexBasis: '75%' }}>
            <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
              <CardHeader 
                icon={TrendingUp}
                title="Distribución de Costos" 
                description="Desglose de costos por categoría"
              />
              <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
                <BreakdownChart 
                  data={[
                    { 
                      label: 'Materiales', 
                      value: kpiData.materialTotal,
                      icon: <Package className="h-4 w-4" />
                    },
                    { 
                      label: 'Mano de Obra', 
                      value: kpiData.laborTotal,
                      icon: <Users className="h-4 w-4" />
                    },
                    { 
                      label: 'Insumos', 
                      value: kpiData.supplyTotal,
                      icon: <Truck className="h-4 w-4" />
                    }
                  ]}
                  formatValue={(value) => formatCurrency(value)}
                />
              </CardContent>
            </Card>
          </div>

          {/* Custom Pricing Section - 1/4 del ancho - Only show for admins */}
          {isAdmin && (
            <div className={`${isMobile ? 'w-full' : 'flex-shrink-0'}`} style={isMobile ? {} : { flexBasis: '25%' }}>
              <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200 h-full">
                <CardHeader 
                  icon={Settings}
                  title="Precios Personalizados" 
                  description="Ajusta los costos para esta tarea específica"
                >
                  <div className="flex flex-col gap-2">
                    {customPrice && (
                      <Badge style={{ backgroundColor: 'var(--accent)', color: 'white' }} className="self-start">
                        PERSONALIZADO
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Última actualización: {formatDate(customPrice?.updated_at ? new Date(customPrice.updated_at) : kpiData?.lastUpdate || new Date())}
                    </span>
                    {customPrice && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleDeleteCustomPrice}
                        disabled={deleteCustomPrice.isPending}
                        className="flex items-center gap-2 self-start"
                        data-testid="button-delete-custom-price"
                      >
                        <Trash2 className="h-4 w-4" />
                        {deleteCustomPrice.isPending ? 'Eliminando...' : 'Restaurar'}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
                  {/* Price Cards - Verticales uno debajo del otro */}
                  <div className="space-y-4">
                    {/* Materiales */}
                    <div className="text-sm font-medium text-foreground">Materiales</div>
                    
                    {/* Mano de Obra */}  
                    <div className="text-sm font-medium text-foreground">Mano de Obra</div>
                    
                    {/* Insumos */}
                    <div className="text-sm font-medium text-foreground">Insumos</div>
                    
                    {/* Total */}
                    <Separator />
                    <div className="text-sm font-bold text-foreground">Total</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
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
                  {groupKey === 'Material' ? 'Materiales' : groupKey} ({groupRows.length} {groupRows.length === 1 ? 'ítem' : 'ítems'})
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