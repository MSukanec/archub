import { useState, useMemo } from "react";
import { Package, Plus, Edit, Trash2, Eye, Award, DollarSign, TrendingUp, Calculator, Calendar, Settings, Save } from "lucide-react";
import { formatDate, formatTime } from "@/lib/date-utils";
import { useLocation } from "wouter";

import { Table } from '@/components/ui-custom/tables-and-trees/Table';
import { EmptyState } from '@/components/ui-custom/security/EmptyState';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

  // Estados para el formulario de precios personalizados
  const [showCustomPricing, setShowCustomPricing] = useState(false);
  const [customMaterialCost, setCustomMaterialCost] = useState<string>('');
  const [customLaborCost, setCustomLaborCost] = useState<string>('');
  const [customTotalCost, setCustomTotalCost] = useState<string>('');
  const [pricingNote, setPricingNote] = useState<string>('');
  const [pricingMode, setPricingMode] = useState<'separate' | 'total'>('separate');

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

  // Funciones para manejar precios personalizados
  const loadCustomPrice = () => {
    if (customPrice) {
      setCustomMaterialCost(customPrice.material_unit_cost?.toString() || '');
      setCustomLaborCost(customPrice.labor_unit_cost?.toString() || '');
      setCustomTotalCost(customPrice.total_unit_cost?.toString() || '');
      setPricingNote(customPrice.note || '');
      setShowCustomPricing(true);
      
      // Determinar el modo basado en qué campos están poblados
      if (customPrice.total_unit_cost && !customPrice.material_unit_cost && !customPrice.labor_unit_cost) {
        setPricingMode('total');
      } else {
        setPricingMode('separate');
      }
    }
  };

  const handleSaveCustomPrice = async () => {
    try {
      const priceData: OrganizationTaskPriceData = {
        task_id: taskId,
        currency_code: 'ARS', // Default to ARS
        note: pricingNote || null
      };

      if (pricingMode === 'separate') {
        priceData.material_unit_cost = customMaterialCost ? parseFloat(customMaterialCost) : null;
        priceData.labor_unit_cost = customLaborCost ? parseFloat(customLaborCost) : null;
        priceData.total_unit_cost = null; // Reset total when using separate
      } else {
        priceData.total_unit_cost = customTotalCost ? parseFloat(customTotalCost) : null;
        priceData.material_unit_cost = null; // Reset separate when using total
        priceData.labor_unit_cost = null;
      }

      await upsertCustomPrice.mutateAsync(priceData);
      setShowCustomPricing(false);
    } catch (error) {
      console.error('Error saving custom price:', error);
    }
  };

  const handleDeleteCustomPrice = async () => {
    try {
      await deleteCustomPrice.mutateAsync(taskId);
      setCustomMaterialCost('');
      setCustomLaborCost('');
      setCustomTotalCost('');
      setPricingNote('');
      setShowCustomPricing(false);
    } catch (error) {
      console.error('Error deleting custom price:', error);
    }
  };

  const handleCancelCustomPricing = () => {
    if (customPrice) {
      loadCustomPrice(); // Revert to saved values
    } else {
      setCustomMaterialCost('');
      setCustomLaborCost('');
      setCustomTotalCost('');
      setPricingNote('');
    }
    setShowCustomPricing(false);
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
      {/* Custom Pricing Section - Only show for admins and when there are costs */}
      {isAdmin && kpiData && (
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-200">
          <CardContent className={`${isMobile ? 'p-4' : 'p-6'}`}>
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(var(--accent-rgb), 0.1)' }}>
                    <Settings className="h-5 w-5" style={{ color: 'var(--accent)' }} />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">Precios Personalizados</h3>
                    <p className="text-sm text-muted-foreground">Ajusta los costos para esta tarea específica</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {customPrice && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      Personalizado
                    </Badge>
                  )}
                  {!showCustomPricing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (customPrice) {
                          loadCustomPrice();
                        } else {
                          setShowCustomPricing(true);
                        }
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      {customPrice ? 'Editar' : 'Personalizar'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Values Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Material Cost */}
                <Card className="border-2" style={{ borderColor: customPrice?.material_unit_cost ? 'var(--accent)' : 'var(--border)' }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">COSTO DE MATERIALES</span>
                      </div>
                      {customPrice?.material_unit_cost && (
                        <Badge variant="outline" className="text-xs">Personalizado</Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">
                        {customPrice?.material_unit_cost ? formatCurrency(Number(customPrice.material_unit_cost)) : formatCurrency(kpiData.materialTotal)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {customPrice?.material_unit_cost ? `Original: ${formatCurrency(kpiData.materialTotal)}` : 'Calculado automáticamente'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Labor Cost */}
                <Card className="border-2" style={{ borderColor: customPrice?.labor_unit_cost ? 'var(--accent)' : 'var(--border)' }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">COSTO DE MANO DE OBRA</span>
                      </div>
                      {customPrice?.labor_unit_cost && (
                        <Badge variant="outline" className="text-xs">Personalizado</Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">
                        {customPrice?.labor_unit_cost ? formatCurrency(Number(customPrice.labor_unit_cost)) : formatCurrency(kpiData.laborTotal)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {customPrice?.labor_unit_cost ? `Original: ${formatCurrency(kpiData.laborTotal)}` : 'Calculado automáticamente'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Total Cost */}
                <Card className="border-2" style={{ borderColor: customPrice?.total_unit_cost ? 'var(--accent)' : 'var(--border)' }}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">COSTO TOTAL</span>
                      </div>
                      {customPrice?.total_unit_cost && (
                        <Badge variant="outline" className="text-xs">Personalizado</Badge>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-2xl font-bold">
                        {customPrice?.total_unit_cost ? formatCurrency(Number(customPrice.total_unit_cost)) : formatCurrency(kpiData.grandTotal)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {customPrice?.total_unit_cost ? `Original: ${formatCurrency(kpiData.grandTotal)}` : 'Materiales + Mano de Obra'}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Editing Form Section */}
              {showCustomPricing && (
                <>
                  <Separator />
                  <div className="space-y-6">
                    {/* Modal-style header for editing form */}
                    <div className="flex items-center gap-3 py-4 border-b border-border/50">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10">
                        <Edit className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide letter-spacing-[0.05em]">
                          MODO DE PERSONALIZACIÓN
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          Modifica los costos de esta tarea específica
                        </p>
                      </div>
                    </div>

                    {/* Pricing Mode Selection */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 py-2">
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          CONFIGURACIÓN DE COSTOS
                        </h5>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-7">
                        <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/20 transition-colors">
                          <input
                            type="radio"
                            value="separate"
                            checked={pricingMode === 'separate'}
                            onChange={(e) => setPricingMode(e.target.value as 'separate' | 'total')}
                            className="w-4 h-4 text-primary"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium">Separar por Categorías</span>
                            <p className="text-xs text-muted-foreground">Material y Mano de Obra por separado</p>
                          </div>
                        </label>
                        
                        <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/20 transition-colors">
                          <input
                            type="radio"
                            value="total"
                            checked={pricingMode === 'total'}
                            onChange={(e) => setPricingMode(e.target.value as 'separate' | 'total')}
                            className="w-4 h-4 text-primary"
                          />
                          <div className="flex-1">
                            <span className="text-sm font-medium">Costo Total</span>
                            <p className="text-xs text-muted-foreground">Un solo monto global</p>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Input Fields Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 py-2">
                        <Calculator className="h-4 w-4 text-muted-foreground" />
                        <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          VALORES PERSONALIZADOS
                        </h5>
                      </div>

                      <div className="pl-7">
                        {pricingMode === 'separate' ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <Label htmlFor="materialCost" className="text-sm font-medium">
                                Costo de Materiales
                              </Label>
                              <Input
                                id="materialCost"
                                type="number"
                                step="0.01"
                                placeholder={`Actual: ${formatCurrency(kpiData?.materialTotal || 0)}`}
                                value={customMaterialCost}
                                onChange={(e) => setCustomMaterialCost(e.target.value)}
                                className="text-right"
                              />
                              <p className="text-xs text-muted-foreground">
                                Valor calculado: {formatCurrency(kpiData?.materialTotal || 0)}
                              </p>
                            </div>
                            
                            <div className="space-y-3">
                              <Label htmlFor="laborCost" className="text-sm font-medium">
                                Costo de Mano de Obra
                              </Label>
                              <Input
                                id="laborCost"
                                type="number"
                                step="0.01"
                                placeholder={`Actual: ${formatCurrency(kpiData?.laborTotal || 0)}`}
                                value={customLaborCost}
                                onChange={(e) => setCustomLaborCost(e.target.value)}
                                className="text-right"
                              />
                              <p className="text-xs text-muted-foreground">
                                Valor calculado: {formatCurrency(kpiData?.laborTotal || 0)}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <Label htmlFor="totalCost" className="text-sm font-medium">
                              Costo Total
                            </Label>
                            <Input
                              id="totalCost"
                              type="number"
                              step="0.01"
                              placeholder={`Actual: ${formatCurrency(kpiData?.grandTotal || 0)}`}
                              value={customTotalCost}
                              onChange={(e) => setCustomTotalCost(e.target.value)}
                              className="text-right"
                            />
                            <p className="text-xs text-muted-foreground">
                              Valor calculado: {formatCurrency(kpiData?.grandTotal || 0)}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notes Section */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 py-2">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          OBSERVACIONES
                        </h5>
                      </div>

                      <div className="pl-7">
                        <Label htmlFor="note" className="text-sm font-medium">
                          Nota Explicativa (Opcional)
                        </Label>
                        <Textarea
                          id="note"
                          placeholder="Especifica el motivo de la personalización o detalles adicionales..."
                          value={pricingNote}
                          onChange={(e) => setPricingNote(e.target.value)}
                          rows={3}
                          className="mt-2 resize-none"
                        />
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-6 border-t border-border/50">
                      <Button
                        variant="outline"
                        onClick={handleCancelCustomPricing}
                        disabled={upsertCustomPrice.isPending}
                        className="min-w-[100px]"
                      >
                        Cancelar
                      </Button>
                      
                      <div className="flex items-center gap-3">
                        {customPrice && (
                          <Button
                            variant="destructive"
                            onClick={handleDeleteCustomPrice}
                            disabled={deleteCustomPrice.isPending}
                            className="flex items-center gap-2"
                          >
                            <Trash2 className="h-4 w-4" />
                            {deleteCustomPrice.isPending ? 'Eliminando...' : 'Eliminar'}
                          </Button>
                        )}
                        <Button
                          onClick={handleSaveCustomPrice}
                          disabled={upsertCustomPrice.isPending}
                          className="flex items-center gap-2 min-w-[120px]"
                        >
                          <Save className="h-4 w-4" />
                          {upsertCustomPrice.isPending ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Last Update - Always show with better styling */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Última actualización:</span>
                  <span className="text-sm font-medium">
                    {customPrice?.updated_at ? formatDate(new Date(customPrice.updated_at)) : formatDate(kpiData?.lastUpdate || new Date())}
                  </span>
                </div>
                {customPrice?.note && !showCustomPricing && (
                  <Badge variant="outline" className="text-xs">
                    <Package className="h-3 w-3 mr-1" />
                    {customPrice.note}
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
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