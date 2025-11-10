import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Calendar, DollarSign } from "lucide-react";
import { SearchField } from "@/components/ui-custom/fields/SearchField";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCreateBudgetItem, useUpdateBudgetItem } from "@/hooks/use-budget-items";
import { useOrganizationTaskPrice } from "@/hooks/use-organization-task-prices";
import { useTaskMaterials } from "@/hooks/use-generated-tasks";
import { useTaskLabor } from "@/hooks/use-task-labor";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { FormModalLayout } from "@/components/modal/form/FormModalLayout";
import { FormModalHeader } from "@/components/modal/form/FormModalHeader";
import { FormModalFooter } from "@/components/modal/form/FormModalFooter";

const budgetItemSchema = z.object({
  task_id: z.string().min(1, "Debe seleccionar una tarea"),
  quantity: z.number().min(0.01, "La cantidad debe ser mayor a 0"),
  unit_price: z.number().min(0, "El precio unitario debe ser mayor o igual a 0").default(0),
  markup_pct: z.number().min(0).max(100, "El margen debe estar entre 0 y 100%").default(0),
  tax_pct: z.number().min(0).max(100, "El impuesto debe estar entre 0 y 100%").default(0),
  cost_scope: z.enum(['materials_and_labor', 'materials_only', 'labor_only']).default('materials_and_labor')
});

type BudgetItemFormData = z.infer<typeof budgetItemSchema>;

// Tipos de costo disponibles
type CostType = 'archub' | 'organization' | 'independent';

interface CostOption {
  id: CostType;
  label: string;
  description: string;
}

interface BudgetItemModalProps {
  modalData: {
    projectId: string;
    organizationId: string;
    budgetId: string;
    currencyId?: string;
    userId?: string;
    editingTask?: any;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function BudgetItemModal({ 
  modalData, 
  onClose 
}: BudgetItemModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [rubroFilter, setRubroFilter] = useState<string>('todos');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [selectedTaskUnit, setSelectedTaskUnit] = useState<string>('');
  const [selectedCostType, setSelectedCostType] = useState<CostType>('archub');
  const [calculatedUnitPrice, setCalculatedUnitPrice] = useState<number>(0);
  
  const { data: userData } = useCurrentUser();
  const createBudgetItem = useCreateBudgetItem();
  const updateBudgetItem = useUpdateBudgetItem();
  
  const isEditing = modalData.isEditing && modalData.editingTask;

  // Hooks para calcular costos de Archub (materiales + mano de obra)
  const { data: materials = [], isLoading: materialsLoading } = useTaskMaterials(selectedTaskId || null);
  const { data: labor = [], isLoading: laborLoading } = useTaskLabor(selectedTaskId || null);

  // Hook para obtener precios de organización
  const { data: organizationTaskPrice, isLoading: orgPriceLoading } = useOrganizationTaskPrice(selectedTaskId || null);

  // Opciones de costo disponibles
  const costOptions: CostOption[] = [
    {
      id: 'archub',
      label: 'Costo Archub',
      description: 'Cálculo automático basado en materiales y mano de obra de la librería'
    },
    {
      id: 'organization',
      label: 'Costo de Organización',
      description: 'Precio personalizado definido por tu organización'
    },
    {
      id: 'independent',
      label: 'Costo Independiente',
      description: 'Precio manual ingresado por ti'
    }
  ];

  // Debug: Log modalData al inicializar

  // Calcular costo de Archub (materiales + mano de obra por unidad)
  const archubUnitCost = useMemo(() => {
    if (materialsLoading || laborLoading || !selectedTaskId) return 0;

    // Calcular costo de materiales por unidad
    const materialCostPerUnit = materials.reduce((sum, material) => {
      const materialView = Array.isArray(material.materials_view) ? material.materials_view[0] : material.materials_view;
      const unitPrice = materialView?.avg_price || 0;
      const quantity = material.amount || 0;
      return sum + (quantity * unitPrice);
    }, 0);

    // Calcular costo de mano de obra por unidad
    const laborCostPerUnit = labor.reduce((sum, laborItem) => {
      const laborView = laborItem.labor_view;
      const unitPrice = laborView?.avg_price || 0;
      const quantity = laborItem.quantity || 0;
      return sum + (quantity * unitPrice);
    }, 0);

    return materialCostPerUnit + laborCostPerUnit;
  }, [materials, labor, materialsLoading, laborLoading, selectedTaskId]);

  // Calcular unit_price según el tipo de costo seleccionado (moved after form declaration)

  // Formatear precios
  const formatCost = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Query para obtener la membresía actual del usuario en la organización  
  const { data: organizationMember } = useQuery({
    queryKey: ['organization-member', modalData.organizationId, userData?.user?.id],
    queryFn: async () => {
      if (!supabase || !userData?.user?.id || !modalData.organizationId) return null;
      
      const { data, error } = await supabase
        .from('organization_members')
        .select('id, user_id, organization_id')
        .eq('organization_id', modalData.organizationId)
        .eq('user_id', userData.user.id)
        .single();
        
      if (error) {
        // Si no encuentra membresía, crear una estructura temporal usando el user.id directamente
        if (error.code === 'PGRST116') {
          return {
            id: userData.user.id,
            user_id: userData.user.id,
            organization_id: modalData.organizationId
          };
        }
        return null;
      }
      
      return data;
    },
    enabled: !!userData?.user?.id && !!modalData.organizationId
  });

  // Hook para cargar tareas del SISTEMA y de la ORGANIZACIÓN actual
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['task-library', modalData.organizationId],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      // Usar TASKS_VIEW que incluye los campos division y unit ya resueltos
      // Filtrar solo tareas del SISTEMA (organization_id IS NULL) y de LA ORGANIZACIÓN actual
      const { data: allTasks, error } = await supabase
        .from('tasks_view')
        .select('*')
        .or(`organization_id.is.null,organization_id.eq.${modalData.organizationId}`)
        .order('custom_name', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      return allTasks || [];
    },
    enabled: !!supabase && !!modalData.organizationId
  });


  // Configurar el formulario
  const form = useForm<BudgetItemFormData>({
    resolver: zodResolver(budgetItemSchema),
    defaultValues: {
      task_id: '',
      quantity: undefined,
      unit_price: 0,
      markup_pct: 0,
      tax_pct: 0,
      cost_scope: 'materials_and_labor'
    }
  });

  // Si estamos editando, configurar los valores iniciales
  useEffect(() => {
    if (isEditing && modalData.editingTask) {
      
      setSelectedTaskId(modalData.editingTask.task_id || '');
      
      form.reset({
        task_id: modalData.editingTask.task_id || '',
        quantity: modalData.editingTask.quantity || undefined,
      });
    }
  }, [isEditing, modalData.editingTask, form]);

  // Calcular unit_price según el tipo de costo seleccionado
  useEffect(() => {
    let newUnitPrice = 0;

    switch (selectedCostType) {
      case 'archub':
        newUnitPrice = archubUnitCost;
        break;
      case 'organization':
        newUnitPrice = organizationTaskPrice?.total_unit_cost || 0;
        break;
      case 'independent':
        // Mantener el valor actual del formulario para costo independiente
        newUnitPrice = form.watch('unit_price') || 0;
        break;
    }

    setCalculatedUnitPrice(newUnitPrice);
    
    // Solo actualizar el formulario si no es costo independiente
    if (selectedCostType !== 'independent') {
      form.setValue('unit_price', newUnitPrice);
    }
  }, [selectedCostType, archubUnitCost, organizationTaskPrice, form]);

  // Obtener divisiones únicas para el filtro (usando division de la vista)
  const uniqueRubros = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    
    const rubros = tasks
      .filter(task => task.division && task.division.trim())
      .map(task => task.division)
      .filter((rubro, index, self) => self.indexOf(rubro) === index)
      .sort();
    
    return rubros;
  }, [tasks]);

  // Filtrar tareas según búsqueda y filtros
  const filteredTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    
    let filtered = tasks;
    
    // Filtro por búsqueda de texto (usando custom_name)
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.custom_name?.toLowerCase().includes(searchLower) ||
        task.code?.toLowerCase().includes(searchLower) ||
        task.division?.toLowerCase().includes(searchLower)
      );
    }
    
    // Filtro por rubro (usando division)
    if (rubroFilter && rubroFilter.trim() && rubroFilter !== 'todos') {
      filtered = filtered.filter(task => task.division === rubroFilter);
    }
    
    return filtered;
  }, [tasks, searchQuery, rubroFilter]);

  // Función para manejar la selección de tarea
  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
    form.setValue('task_id', taskId);
    
    // Encontrar la tarea seleccionada para obtener su unidad
    const selectedTask = tasks.find(task => task.id === taskId);
    if (selectedTask?.unit) {
      // Actualizar el placeholder del campo cantidad para mostrar la unidad
      setSelectedTaskUnit(selectedTask.unit);
    }
  };

  // Función para enviar el formulario
  const onSubmit = async (data: BudgetItemFormData) => {
    // Usar userData.user.id directamente si no hay organizationMember
    const createdBy = organizationMember?.id || userData?.user?.id;
    
    if (!createdBy) {
      toast({
        title: "Error", 
        description: "No se pudo obtener la información del usuario",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (isEditing && modalData.editingTask) {
        // Modo edición
        await updateBudgetItem.mutateAsync({
          id: modalData.editingTask.id,
          budget_id: modalData.budgetId,
          task_id: data.task_id,
          quantity: data.quantity || 1,
          unit_price: data.unit_price,
          markup_pct: data.markup_pct,
          tax_pct: data.tax_pct,
          cost_scope: data.cost_scope
        });
      } else {
        // Modo creación
        await createBudgetItem.mutateAsync({
          budget_id: modalData.budgetId,
          task_id: data.task_id,
          organization_id: modalData.organizationId,
          project_id: modalData.projectId,
          quantity: data.quantity || 1,
          unit_price: data.unit_price,
          currency_id: modalData.currencyId || 'default-currency-id', // TODO: Get from budget
          markup_pct: data.markup_pct,
          tax_pct: data.tax_pct,
          cost_scope: data.cost_scope,
          created_by: createdBy,
          sort_key: 0 // Default sort key
        });
      }
      
      onClose();
    } catch (error) {
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewPanel = isEditing && modalData.editingTask ? (
    <div className="space-y-4">
      <div>
        <h4 className="font-medium">Tarea</h4>
        <p className="text-muted-foreground mt-1">
          {modalData.editingTask.custom_name || modalData.editingTask.task_code || 'Sin tarea'}
        </p>
      </div>
      
      <div>
        <h4 className="font-medium">Código</h4>
        <p className="text-muted-foreground mt-1">
          {modalData.editingTask.code || 'Sin código'}
        </p>
      </div>

      <div>
        <h4 className="font-medium">Cantidad</h4>
        <p className="text-muted-foreground mt-1">
          {modalData.editingTask.quantity || 0}
        </p>
      </div>


      {modalData.editingTask.created_at && (
        <div>
          <h4 className="font-medium">Fecha de Creación</h4>
          <p className="text-muted-foreground mt-1">
            {new Date(modalData.editingTask.created_at).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        </div>
      )}
    </div>
  ) : null;

  const editPanel = (
    <div className="space-y-4">
      {/* Filtros de búsqueda - Inline en desktop, stack en mobile */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-2">
            <label className="text-xs font-medium leading-none text-muted-foreground">
              Filtrar por Rubro
            </label>
            <Select value={rubroFilter} onValueChange={setRubroFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los rubros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los rubros</SelectItem>
                {uniqueRubros.map((rubro) => (
                  <SelectItem key={rubro} value={rubro}>
                    {rubro}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1">
            <SearchField
              label="Búsqueda de Texto"
              placeholder="Buscar tarea..."
              value={searchQuery}
              onChange={setSearchQuery}
            />
          </div>
        </div>
      </div>
      
      {/* Lista de tareas optimizada como tabla */}
      <div className="border rounded-lg">
        <ScrollArea className="h-64 md:h-80">
          <div className="divide-y">
            {tasksLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="animate-pulse">Cargando tareas...</div>
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center py-8 space-y-4">
                <div className="text-muted-foreground">
                  {searchQuery ? "No se encontraron tareas" : "No hay tareas disponibles"}
                </div>
                {searchQuery && (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      ¿No encuentras la tarea que necesitas?
                    </p>
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => {
                        toast({
                          title: "Próximamente",
                          description: "Esta funcionalidad estará disponible pronto",
                        });
                      }}
                      className="gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      Crear Tarea Personalizada
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              filteredTasks.map((task) => (
                <div 
                  key={task.id}
                  onClick={() => handleTaskSelect(task.id)}
                  className={`px-4 py-3 cursor-pointer transition-colors duration-150 grid grid-cols-[1fr,auto] gap-4 items-start ${
                    selectedTaskId === task.id 
                      ? 'bg-accent/10 border-l-2 border-l-accent' 
                      : 'hover:bg-muted/30'
                  }`}
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-tight text-foreground">
                      {task.custom_name || '(Sin Nombre)'}
                    </p>
                    {task.division && (
                      <p className="text-xs text-muted-foreground">
                        {task.division}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 pt-0.5">
                    {task.unit && (
                      <span className="text-xs font-medium text-muted-foreground bg-muted/40 px-2 py-1 rounded">
                        {task.unit}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
      
      {/* Validación de selección */}
      {form.formState.errors.task_id && (
        <p className="text-xs text-destructive flex items-center gap-1">
          <span className="w-1 h-1 bg-destructive rounded-full"></span>
          {form.formState.errors.task_id.message}
        </p>
      )}

      {/* Información básica - Movido debajo de la lista */}
      <div className="space-y-2">
        <label className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Cantidad *
        </label>
        <div className="relative">
          <Input
            type="number"
            step="0.01"
            min="0.01"
            placeholder={selectedTaskUnit ? `Cantidad en ${selectedTaskUnit}` : "Cantidad"}
            value={form.watch('quantity') || ''}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (!isNaN(value)) {
                form.setValue('quantity', value);
              }
            }}
            className={`${form.formState.errors.quantity ? 'border-destructive' : ''} ${selectedTaskUnit ? 'pr-12' : ''}`}
          />
          {selectedTaskUnit && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-muted-foreground bg-muted/40 px-2 py-1 rounded">
              {selectedTaskUnit}
            </div>
          )}
        </div>
        {form.formState.errors.quantity && (
          <p className="text-xs text-destructive">
            {form.formState.errors.quantity.message}
          </p>
        )}
      </div>

      {/* Selección de tipo de costo */}
      {selectedTaskId && (
        <div className="space-y-3">
          <label className="text-xs font-medium leading-none">
            Tipo de Costo *
          </label>
          <RadioGroup 
            value={selectedCostType} 
            onValueChange={(value: CostType) => setSelectedCostType(value)}
            className="space-y-3"
          >
            {costOptions.map((option) => {
              const isLoading = option.id === 'archub' && (materialsLoading || laborLoading);
              const isOrgPriceAvailable = option.id === 'organization' && organizationTaskPrice?.total_unit_cost;
              const isDisabled = option.id === 'organization' && !isOrgPriceAvailable && !orgPriceLoading;
              
              let displayPrice = '—';
              if (option.id === 'archub' && !isLoading) {
                displayPrice = formatCost(archubUnitCost);
              } else if (option.id === 'organization' && isOrgPriceAvailable) {
                displayPrice = formatCost(organizationTaskPrice?.total_unit_cost || 0);
              } else if (option.id === 'independent') {
                displayPrice = 'Manual';
              }

              return (
                <Card key={option.id} className={`p-3 cursor-pointer transition-colors ${
                  selectedCostType === option.id ? 'ring-2 ring-primary' : 'hover:bg-muted/30'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <CardContent className="p-0">
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem 
                        value={option.id} 
                        id={option.id}
                        disabled={isDisabled}
                        className="mt-0.5"
                      />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <Label 
                            htmlFor={option.id} 
                            className={`text-sm font-medium cursor-pointer ${isDisabled ? 'cursor-not-allowed' : ''}`}
                          >
                            {option.label}
                          </Label>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-3 h-3 text-muted-foreground" />
                            <span className={`text-xs font-medium ${
                              isLoading ? 'text-muted-foreground' : 'text-foreground'
                            }`}>
                              {isLoading ? '...' : displayPrice}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {option.description}
                          {isDisabled && ' (No disponible para esta tarea)'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </RadioGroup>
        </div>
      )}

      {/* Campo de precio unitario manual - Solo visible para costo independiente */}
      {selectedCostType === 'independent' && (
        <div className="space-y-2">
          <label className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Precio Unitario *
          </label>
          <Input
            type="number"
            step="0.01"
            min="0"
            placeholder="Ingrese el precio unitario"
            value={form.watch('unit_price') || ''}
            onChange={(e) => {
              const value = parseFloat(e.target.value);
              if (!isNaN(value)) {
                form.setValue('unit_price', value);
              }
            }}
            className={form.formState.errors.unit_price ? 'border-destructive' : ''}
          />
          {form.formState.errors.unit_price && (
            <p className="text-xs text-destructive">
              {form.formState.errors.unit_price.message}
            </p>
          )}
        </div>
      )}
    </div>
  );

  const headerContent = (
    <FormModalHeader 
      title={isEditing ? 'Editar Tarea' : 'Agregar Tarea'}
      icon={Calendar}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={isEditing ? 'Actualizar Tarea' : 'Agregar Tarea'}
      onRightClick={form.handleSubmit(onSubmit)}
      showLoadingSpinner={isSubmitting}
      submitDisabled={!selectedTaskId}
    />
  );

  // Función wrapper para el submit que puede ser llamada por ENTER
  const handleSubmitWrapper = () => {
    // Validar que hay una tarea seleccionada antes de enviar
    if (!selectedTaskId) {
      form.setError('task_id', { 
        type: 'manual', 
        message: 'Debe seleccionar una tarea' 
      });
      return;
    }
    
    // Llamar al submit del formulario
    form.handleSubmit(onSubmit)();
  };

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      isEditing={true}
      onClose={onClose}
      onSubmit={handleSubmitWrapper}
    />
  );
}