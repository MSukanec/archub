import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/lib/supabase";
import { FormModalLayout } from "@/components/modal/form/FormModalLayout";
import { FormModalHeader } from "@/components/modal/form/FormModalHeader";
import { FormModalFooter } from "@/components/modal/form/FormModalFooter";
import { useModalPanelStore } from "@/components/modal/form/modalPanelStore";

import { ComboBox } from "@/components/ui-custom/fields/ComboBoxWriteField";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Search, CheckSquare, Square, Filter, X, Plus, Zap, ArrowLeft, Layers, Wrench } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCreateConstructionTask, useUpdateConstructionTask } from "@/hooks/use-construction-tasks";
import { useConstructionProjectPhases } from "@/hooks/use-construction-phases";
import { ParametricTaskBuilder } from "@/components/ui-custom/admin/tasks/ParametricTaskBuilder";
import { useCreateGeneratedTask } from "@/hooks/use-generated-tasks";
import { useTopLevelCategories, useUnits } from "@/hooks/use-task-categories";


import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

const addTaskSchema = z.object({
  selectedTasks: z.array(z.object({
    task_id: z.string(),
    quantity: z.number().min(0.01, "La cantidad debe ser mayor a 0")
  })).min(1, "Debe seleccionar al menos una tarea")
});

type AddTaskFormData = z.infer<typeof addTaskSchema>;

interface SelectedTask {
  task_id: string;
  quantity: number;
  project_phase_id?: string;
}

interface ParameterSelection {
  parameterId: string;
  optionId: string;
  parameterSlug: string;
  parameterLabel: string;
  optionName: string;
  optionLabel: string;
}

interface TaskMultiModalProps {
  modalData: {
    projectId: string;
    organizationId: string;
    userId?: string;
    editingTask?: any;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function TaskMultiModal({ 
  modalData, 
  onClose 
}: TaskMultiModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<SelectedTask[]>([]);
  const [rubroFilter, setRubroFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showParametricTaskCreator, setShowParametricTaskCreator] = useState(false);
  
  // Estados para el subformulario paramétrico
  const [parametricSelections, setParametricSelections] = useState<ParameterSelection[]>([]);
  const [parametricTaskPreview, setParametricTaskPreview] = useState<string>('');
  const [parametricParameterOrder, setParametricParameterOrder] = useState<string[]>([]);
  const [isCreatingParametricTask, setIsCreatingParametricTask] = useState(false);
  
  // Referencia al ParametricTaskBuilder
  const parametricTaskBuilderRef = useRef<{ executeCreateTaskCallback: () => void }>(null);
  
  const { data: userData } = useCurrentUser();
  
  // Hook para crear tarea paramétrica
  const createGeneratedTask = useCreateGeneratedTask();
  
  // Query client para invalidar caché
  const queryClient = useQueryClient();

  // Panel store para manejar subforms
  const { currentPanel, setPanel, currentSubform, setCurrentSubform } = useModalPanelStore();
  
  // Estado para manejo de tabs dentro del subform
  const [activeTab, setActiveTab] = useState<'parametric' | 'custom'>('parametric');
  
  // Estados para el formulario de tarea personalizada
  const [taskNameText, setTaskNameText] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [isCreatingCustomTask, setIsCreatingCustomTask] = useState(false);
  
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
        return null;
      }
      
      return data;
    },
    enabled: !!userData?.user?.id && !!modalData.organizationId
  });



  // Hook para cargar tareas SOLO de la organización actual o del sistema
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['task-library', modalData.organizationId],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      
      const { data: allTasks, error } = await supabase
        .from('task_view')
        .select('*')
        .or(`organization_id.is.null,organization_id.eq.${modalData.organizationId}`)
        .order('name_rendered', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      
      return allTasks || [];
    },
    enabled: !!supabase && !!modalData.organizationId
  });

  // Hook para obtener las fases del proyecto
  const { data: projectPhases = [], isLoading: isLoadingProjectPhases } = useConstructionProjectPhases(modalData.projectId);
  
  // Hooks para datos de tarea personalizada
  const { data: rubros = [], isLoading: rubrosLoading } = useTopLevelCategories();
  const { data: units = [], isLoading: unitsLoading } = useUnits();
  
  // Log para debug
  useEffect(() => {
  }, [projectPhases]);

  // Hook para obtener la fase actual de la tarea cuando se está editando
  // Ya tenemos la información en editingTask.phase_instance_id, no necesitamos query adicional

  const form = useForm<AddTaskFormData>({
    resolver: zodResolver(addTaskSchema),
    defaultValues: {
      selectedTasks: []
    }
  });

  const { handleSubmit, setValue, watch, formState: { errors } } = form;

  // Obtener rubros únicos para el filtro
  const rubroOptions = useMemo(() => {
    const uniqueRubros = Array.from(new Set(tasks.map(task => task.category_name).filter(Boolean)));
    return uniqueRubros.map(rubro => ({ value: rubro, label: rubro }));
  }, [tasks]);

  // Filtrar tareas con ambos filtros
  const filteredTasks = useMemo(() => {
    
    let filtered = tasks;
    
    // Filtro por rubro
    if (rubroFilter) {
      filtered = filtered.filter(task => task.category_name === rubroFilter);
    }
    
    // Filtro por búsqueda de texto
    if (searchQuery.trim()) {
      filtered = filtered.filter(task => 
        task.name_rendered?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return filtered;
  }, [tasks, searchQuery, rubroFilter]);

  // Función para obtener la unidad de una tarea específica
  const getTaskUnit = (task: any) => {
    return task.units?.name || task.unit_name || 'ud';
  };

  // Funciones para manejar la selección de tareas
  const handleTaskSelection = (taskId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedTasks(prev => [...prev, { task_id: taskId, quantity: 1 }]);
    } else {
      setSelectedTasks(prev => prev.filter(t => t.task_id !== taskId));
    }
  };

  const handleQuantityChange = (taskId: string, quantity: number) => {
    setSelectedTasks(prev => 
      prev.map(t => t.task_id === taskId ? { ...t, quantity } : t)
    );
  };



  // Cargar datos cuando está en modo edición
  useEffect(() => {
    if (modalData.isEditing && modalData.editingTask) {
      const task = modalData.editingTask;
      
      // Pre-cargar la tarea actual como seleccionada
      setSelectedTasks([{
        task_id: task.task_id || '',
        quantity: task.quantity || 1,
        project_phase_id: task.phase_instance_id || ''
      }]);
      
      // Reset del formulario con valores básicos
      form.reset({
        selectedTasks: [{
          task_id: task.task_id || '',
          quantity: task.quantity || 1
        }]
      });
    }
  }, [modalData.isEditing, modalData.editingTask, form]);

  // Sincronizar selectedTasks con el formulario
  useEffect(() => {
    setValue('selectedTasks', selectedTasks);
  }, [selectedTasks, setValue]);

  const createTask = useCreateConstructionTask();
  const updateTask = useUpdateConstructionTask();

  // Hook para obtener parámetros con información de is_required
  const { data: allParameters = [] } = useQuery({
    queryKey: ['task-parameters-with-required'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      const { data, error } = await supabase
        .from('task_parameters')
        .select('id, slug, label, is_required');
      if (error) throw error;
      return data;
    },
  });

  // Función para manejar la creación de tarea paramétrica
  const handleCreateParametricTask = async (taskData?: { selections: ParameterSelection[], preview: string, paramValues: Record<string, string>, paramOrder: string[], availableParameters: string[] }) => {
    // Usar datos del callback si están disponibles, sino usar estados locales
    const selections = taskData?.selections || parametricSelections;
    const preview = taskData?.preview || parametricTaskPreview;
    const paramOrder = taskData?.paramOrder || parametricParameterOrder;
    const availableParams = taskData?.availableParameters || [];


    if (selections.length === 0) {
      toast({
        title: "Error",
        description: "Debes seleccionar al menos un parámetro",
        variant: "destructive",
      });
      return;
    }

    // Validar parámetros obligatorios entre los disponibles
    
    // Solo validar parámetros obligatorios que están actualmente disponibles/visibles
    const availableRequiredParams = allParameters.filter(param => 
      param.is_required && availableParams.includes(param.id)
    );
    
    const selectedParameterIds = selections.map(sel => sel.parameterId);
    
    const missingRequiredParams = availableRequiredParams.filter(param => 
      !selectedParameterIds.includes(param.id)
    );

    if (missingRequiredParams.length > 0) {
      const missingNames = missingRequiredParams.map(param => param.label).join(', ');
      toast({
        title: "Parámetros obligatorios faltantes",
        description: `Debes completar los siguientes parámetros obligatorios: ${missingNames}`,
        variant: "destructive",
      });
      return;
    }


    setIsCreatingParametricTask(true);

    try {
      // Usar paramValues del callback si está disponible, sino crear desde selections
      const paramValuesToUse = taskData?.paramValues || (() => {
        const paramValues: Record<string, string> = {};
        selections.forEach(selection => {
          paramValues[selection.parameterSlug] = selection.optionId;
        });
        return paramValues;
      })();

        paramValues: paramValuesToUse,
        paramOrder: paramOrder,
        preview: preview
      });

      const response = await createGeneratedTask.mutateAsync({
        param_values: paramValuesToUse,
        param_order: paramOrder
      });


      // Agregar la nueva tarea como seleccionada en el formulario principal
      const newTaskId = response.new_task?.id;
      if (newTaskId) {
        setSelectedTasks(prev => [...prev, { 
          task_id: newTaskId, 
          quantity: 1 
        }]);
      }

      // Limpiar filtros y búsqueda para mostrar todas las tareas incluyendo la nueva
      setSearchQuery('');
      setRubroFilter('');
      setCategoryFilter('');

      // Limpiar el subformulario
      setParametricSelections([]);
      setParametricTaskPreview('');
      setParametricParameterOrder([]);
      setShowParametricTaskCreator(false);

      // Volver al panel principal
      setPanel('edit');
      setActiveTab('parametric'); // Reset tab al por defecto

      toast({
        title: "Tarea creada",
        description: "La nueva tarea paramétrica se creó y agregó correctamente",
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la tarea paramétrica",
        variant: "destructive",
      });
    } finally {
      setIsCreatingParametricTask(false);
    }
  };

  // Función para crear tarea personalizada
  const handleCreateCustomTask = async () => {
    // Validación de campos obligatorios
    if (!selectedCategoryId) {
      toast({
        title: "Error",
        description: "Debe seleccionar un rubro",
        variant: "destructive"
      });
      return;
    }

    if (!selectedUnitId) {
      toast({
        title: "Error",
        description: "Debe seleccionar una unidad",
        variant: "destructive"
      });
      return;
    }

    if (!taskNameText.trim()) {
      toast({
        title: "Error",
        description: "Debe ingresar el nombre de la tarea",
        variant: "destructive"
      });
      return;
    }

    if (!userData?.organization?.id) {
      toast({
        title: "Error",
        description: "No se pudo identificar la organización",
        variant: "destructive"
      });
      return;
    }

    setIsCreatingCustomTask(true);

    try {
        input_custom_name: taskNameText.trim(),
        input_unit_id: selectedUnitId,
        input_category_id: selectedCategoryId,
        input_organization_id: userData.organization.id
      });

      // Llamar directamente a la función SQL create_parametric_task usando supabase.rpc
      if (!supabase) {
        throw new Error('Supabase client no está disponible');
      }
      
      const { data: result, error } = await supabase.rpc("create_parametric_task", {
        input_param_values: {},                    // json vacío
        input_param_order: [],                     // array vacío
        input_unit_id: selectedUnitId,             // UUID de la unidad elegida
        input_category_id: selectedCategoryId,     // UUID del rubro elegido
        input_organization_id: userData.organization.id, // ID de la organización activa del usuario
        input_custom_name: taskNameText.trim()     // nombre ingresado por el usuario
      });

      if (error) {
        throw error;
      }


      // Agregar la nueva tarea a la lista de tareas seleccionadas
      if (result?.new_task) {
        setSelectedTasks(prev => [...prev, {
          task_id: result.new_task.id,
          quantity: 1,
          project_phase_id: '' // Sin fase por defecto
        }]);
      }

      // Invalidar caché para que la tabla se actualice automáticamente
      await queryClient.invalidateQueries({ queryKey: ['task-library'] });
      
      // Limpiar formulario y volver al panel principal
      setTaskNameText('');
      setSelectedCategoryId('');
      setSelectedUnitId('');
      setPanel('edit');
      setActiveTab('parametric');

      toast({
        title: "Tarea creada",
        description: "La tarea personalizada se creó y agregó correctamente",
      });

    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo crear la tarea personalizada",
        variant: "destructive",
      });
    } finally {
      setIsCreatingCustomTask(false);
    }
  };

  const onSubmit = async (data: AddTaskFormData) => {

    if (!userData?.user?.id) {
      toast({
        title: "Error",
        description: "No se pudo identificar el usuario",
        variant: "destructive"
      });
      return;
    }

    // Usar userData.user.id directamente si no hay organizationMember
    const createdBy = organizationMember?.id || userData?.user?.id;
    
    if (!createdBy) {
      toast({
        title: "Error",
        description: "No se pudo verificar tu membresía en la organización",
        variant: "destructive"
      });
      return;
    }

    if (selectedTasks.length === 0) {
      toast({
        title: "Error",
        description: "Debe seleccionar al menos una tarea",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (modalData.isEditing && modalData.editingTask) {
        // Modo edición - solo editar la primera tarea seleccionada
        const firstSelected = selectedTasks[0];
        await updateTask.mutateAsync({
          id: modalData.editingTask.id,
          quantity: firstSelected.quantity,
          task_id: firstSelected.task_id,
          project_id: modalData.projectId,
          organization_id: modalData.organizationId,
          project_phase_id: firstSelected.project_phase_id || undefined
        });

        toast({
          title: "Tarea actualizada",
          description: "La tarea se ha actualizado correctamente",
        });
      } else {
        // Modo creación - crear múltiples tareas
          numberOfTasks: selectedTasks.length,
          organizationId: modalData.organizationId,
          projectId: modalData.projectId,
          createdBy: createdBy,
          taskDetails: selectedTasks.map(st => ({
            task_id: st.task_id,
            quantity: st.quantity,
            project_phase_id: st.project_phase_id
          }))
        });

        const createdById = createdBy;
          organizationMember: organizationMember?.id,
          finalId: createdById
        });

        const promises = selectedTasks.map((selectedTask, index) => {
            task_id: selectedTask.task_id,
            quantity: selectedTask.quantity,
            organization_id: modalData.organizationId,
            project_id: modalData.projectId,
            created_by: createdById,
            project_phase_id: selectedTask.project_phase_id || undefined
          });
          
          return createTask.mutateAsync({
            organization_id: modalData.organizationId,
            project_id: modalData.projectId,
            task_id: selectedTask.task_id,
            quantity: selectedTask.quantity,
            created_by: createdById,
            project_phase_id: selectedTask.project_phase_id || undefined
          }).catch(error => {
            throw error;
          });
        });

        await Promise.all(promises);

        toast({
          title: "Tareas agregadas",
          description: `Se agregaron ${selectedTasks.length} tarea${selectedTasks.length > 1 ? 's' : ''} al proyecto`,
        });
      }

      onClose();
    } catch (error) {
      
      let errorMessage = "Error desconocido";
      
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = String(error.message);
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error && typeof error === 'object' && 'details' in error) {
        errorMessage = String(error.details);
      }
      
      toast({
        title: "Error",
        description: `${modalData.isEditing ? "No se pudo actualizar la tarea" : "No se pudo agregar las tareas"}: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Panel de vista (vacío para este modal)
  const viewPanel = (
    <div className="p-4 text-center text-muted-foreground">
      Este modal no tiene vista previa
    </div>
  );

  const editPanel = (
    <form 
      onSubmit={handleSubmit(onSubmit)} 
      className="flex flex-col h-full"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSubmit(onSubmit)();
        }
      }}
    >
      {/* Sección fija superior */}
      <div className="flex-shrink-0 space-y-6">


        {/* Errores y estado */}
        <div className="space-y-2">
          {errors.selectedTasks && (
            <p className="text-sm text-destructive">{errors.selectedTasks.message}</p>
          )}
        </div>
      </div>

      {/* Layout de dos columnas */}
      <div className="flex-1 min-h-0 grid grid-cols-2 gap-4">
        {/* Columna Izquierda - Tareas Disponibles */}
        <div className="border rounded-lg">
          <div className="p-3 border-b bg-muted">
            <h3 className="text-sm font-medium">Tareas Disponibles</h3>
          </div>
          
          {/* Filtros en la columna izquierda - inline */}
          <div className="p-3 border-b space-y-3">
            <div className="grid grid-cols-2 gap-3">
              {/* Filtro por Rubro */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Filtrar por Rubro
                </Label>
                <ComboBox
                  value={rubroFilter}
                  onValueChange={setRubroFilter}
                  options={rubroOptions}
                  placeholder="Todos los rubros"
                  searchPlaceholder="Buscar rubro..."
                  emptyMessage="No se encontraron rubros"
                  className="text-xs"
                />
              </div>
              
              {/* Campo de búsqueda */}
              <div className="space-y-2">
                <Label className="text-xs font-medium text-muted-foreground">
                  Búsqueda de Texto
                </Label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por nombre o categoría..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex w-full text-xs leading-tight py-2 px-3 border border-[var(--input-border)] bg-[var(--input-bg)] text-foreground rounded-md transition-all duration-150 placeholder:text-[var(--input-placeholder)] file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Table Header */}
          <div className="py-2 px-3 bg-muted/50 font-medium text-xs border-b">
            <div className="text-xs font-medium">TAREA</div>
          </div>

          {/* Table Body */}
          <ScrollArea className="h-[350px]">
            <div className="divide-y">
              {filteredTasks.length === 0 ? (
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
                          // Log para debugging
                          // Navegar al subform de forma sincronizada
                          setCurrentSubform('parametric-task');
                          setPanel('subform');
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
                filteredTasks.map((task) => {
                  const isSelected = selectedTasks.some(t => t.task_id === task.id);
                  
                  return (
                    <div 
                      key={task.id} 
                      className={`p-3 hover:bg-muted/50 cursor-pointer border-b transition-all ${
                        isSelected ? 'border-l-4 border-l-accent bg-accent/10' : ''
                      }`}
                      onClick={() => {
                        // Permite agregar la misma tarea múltiples veces
                        setSelectedTasks(prev => [...prev, { task_id: task.id, quantity: 1 }]);
                      }}
                    >
                      {/* Task Name */}
                      <div>
                        <div className="text-sm leading-tight line-clamp-2">
                          {task.name_rendered || 'Sin nombre'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <span className="font-bold">{task.category_name || 'Sin rubro'}</span> - {task.unit_name || 'Sin unidad'}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Columna Derecha - Tareas Seleccionadas */}
        <div className="border rounded-lg">
          <div className="p-3 border-b bg-muted">
            <h3 className="text-sm font-medium">Tareas Seleccionadas ({selectedTasks.length})</h3>
          </div>
          
          {/* Selected Tasks Header */}
          <div className="grid gap-2 py-2 px-3 bg-muted/50 font-medium text-xs border-b" style={{gridTemplateColumns: "1fr auto auto auto"}}>
            <div className="text-xs font-medium">TAREA</div>
            <div className="text-xs font-medium w-16">CANT.</div>
            <div className="text-xs font-medium w-20">FASE</div>
            <div className="text-xs font-medium w-8"></div>
          </div>

          {/* Selected Tasks Body */}
          <ScrollArea className="h-[350px]">
            <div className="divide-y">
              {selectedTasks.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No hay tareas seleccionadas
                </div>
              ) : (
                selectedTasks.map((selectedTask, index) => {
                  const task = tasks?.find(t => t.id === selectedTask.task_id);
                  if (!task) return null;
                  
                  return (
                    <div key={`${selectedTask.task_id}-${index}`} className="grid gap-2 py-3 px-3" style={{gridTemplateColumns: "1fr auto auto auto"}}>
                      {/* Task Name */}
                      <div>
                        <div className="text-sm leading-tight line-clamp-2">
                          {task.name_rendered || 'Sin nombre'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <span className="font-bold">{task.category_name || 'Sin rubro'}</span> - {task.unit_name || 'Sin unidad'}
                        </div>
                      </div>

                      {/* Cantidad Input */}
                      <div className="w-16">
                        <Input
                          type="number"
                          value={selectedTask.quantity}
                          onChange={(e) => {
                            const newQuantity = parseFloat(e.target.value) || 0;
                            setSelectedTasks(prev => 
                              prev.map((t, i) => 
                                i === index ? { ...t, quantity: newQuantity } : t
                              )
                            );
                          }}
                          className="h-8 text-xs"
                          min="0"
                          step="0.01"
                        />
                      </div>

                      {/* Fase Select */}
                      <div className="w-20">
                        <Select 
                          value={selectedTask.project_phase_id || ""}
                          onValueChange={(value) => {
                            setSelectedTasks(prev => 
                              prev.map((t, i) => 
                                i === index ? { ...t, project_phase_id: value } : t
                              )
                            );
                          }}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue placeholder="Fase" />
                          </SelectTrigger>
                          <SelectContent>
                            {projectPhases.map((projectPhase) => (
                              <SelectItem key={projectPhase.project_phase_id} value={projectPhase.project_phase_id}>
                                {projectPhase.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Delete Button */}
                      <div className="w-8">
                        <Button
                          variant="ghost"
                          size="sm"
                          className=""
                          onClick={() => {
                            setSelectedTasks(prev => prev.filter((_, i) => i !== index));
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </div>


    </form>
  );

  // Función para crear el subform paramétrico
  const getSubform = () => {
    switch (currentSubform) {
      case 'parametric-task':
        return (
          <div className="flex flex-col h-full">
            <div className="flex-1 overflow-y-auto space-y-6">
              {/* Tabs personalizadas al estilo ActionBar */}
              <div className="px-6 pt-0 pb-0">
                <div 
                  className="flex items-center rounded-lg p-1 gap-0.5 bg-[var(--button-ghost-bg)] border border-[var(--card-border)] shadow-button-normal w-full"
                >
                  <button
                    onClick={() => setActiveTab('parametric')}
                    className={`flex-1 inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-150 px-3 py-1.5 h-8 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 ${
                      activeTab === 'parametric'
                        ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm rounded-lg"
                        : "text-[var(--button-ghost-text)] hover:bg-[var(--button-ghost-hover-bg)] hover:text-[var(--button-ghost-hover-text)] rounded-md"
                    }`}
                  >
                    Nueva Tarea Paramétrica
                  </button>
                  <button
                    onClick={() => setActiveTab('custom')}
                    className={`flex-1 inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-150 px-3 py-1.5 h-8 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent focus-visible:ring-offset-0 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 ${
                      activeTab === 'custom'
                        ? "bg-[var(--accent)] text-[var(--accent-foreground)] shadow-sm rounded-lg"
                        : "text-[var(--button-ghost-text)] hover:bg-[var(--button-ghost-hover-bg)] hover:text-[var(--button-ghost-hover-text)] rounded-md"
                    }`}
                  >
                    Nueva Tarea Personalizada
                  </button>
                </div>
              </div>
              
              {activeTab === 'parametric' && (
                <div>
                  {/* Título de sección para tarea paramétrica */}
                  <div className="mb-4 px-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex items-center justify-center w-8 h-8 bg-accent/10 rounded-lg">
                        <Layers className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-foreground">Tarea Paramétrica de la Comunidad</h3>
                        <p className="text-xs text-muted-foreground">Esta tarea se generará mediante parámetros configurables y formará parte de la librería de tareas disponible para toda la comunidad de usuarios.</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <ParametricTaskBuilder
                      ref={parametricTaskBuilderRef}
                      onSelectionChange={setParametricSelections}
                      onPreviewChange={setParametricTaskPreview}
                      onOrderChange={setParametricParameterOrder}
                      onCreateTask={handleCreateParametricTask}
                      initialParameters={null}
                      initialParameterOrder={null}
                    />
                  </div>
                </div>
              )}
                
              {activeTab === 'custom' && (
                <div>
                  {/* Título de sección para tarea personalizada */}
                  <div className="mb-4 px-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex items-center justify-center w-8 h-8 bg-accent/10 rounded-lg">
                        <Wrench className="w-4 h-4 text-accent" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-foreground">Tarea Completamente Personalizada</h3>
                        <p className="text-xs text-muted-foreground">Esta tarea será completamente personalizada y única para tu proyecto. Solo estará disponible para ti y no se compartirá con otros usuarios.</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Formulario de tarea personalizada */}
                  <div className="space-y-6">
                    {/* 1. Rubro y Unidad en la misma fila */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* ComboBox para Rubros */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-foreground">
                          Rubro *
                        </Label>
                        <ComboBox
                          placeholder="Selecciona un rubro..."
                          options={rubros.map(rubro => ({
                            value: rubro.id,
                            label: rubro.name
                          }))}
                          value={selectedCategoryId}
                          onValueChange={setSelectedCategoryId}
                          disabled={rubrosLoading}
                        />
                      </div>

                      {/* Select para Unidades */}
                      <div className="space-y-2">
                        <Label className="text-xs font-medium text-foreground">
                          Unidad *
                        </Label>
                        <Select value={selectedUnitId} onValueChange={setSelectedUnitId} disabled={unitsLoading}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona una unidad..." />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map((unit: any) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.name} ({unit.symbol})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* 2. Textarea para Nombre de la Tarea */}
                    <div className="space-y-2">
                      <Label className="text-xs font-medium text-foreground">
                        Nombre de la Tarea *
                      </Label>
                      <Textarea
                        placeholder="Describe detalladamente la tarea a realizar..."
                        value={taskNameText}
                        onChange={(e) => setTaskNameText(e.target.value)}
                        rows={3}
                        className="resize-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const headerContent = currentPanel === 'subform' ? (
    <FormModalHeader
      title="Crear Nueva Tarea Personalizada"
      description="Elige el método para crear tu nueva tarea de construcción"
      icon={Plus}
      leftActions={
        <Button
          variant="ghost"
          onClick={() => setPanel('edit')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </Button>
      }
    />
  ) : (
    <FormModalHeader 
      title={modalData.isEditing ? "Editar Tarea de Construcción" : "Seleccionar Tareas del Proyecto"}
      icon={CheckSquare}
    />
  );

  const footerContent = currentPanel === 'subform' ? (
    activeTab === 'parametric' ? (
      <FormModalFooter
        leftLabel="Cancelar"
        onLeftClick={() => setPanel('edit')}
        rightLabel="Crear Nueva Tarea"
        onRightClick={() => {
          // Llamar al callback del ParametricTaskBuilder para que pase los datos completos
          if (parametricTaskBuilderRef.current?.executeCreateTaskCallback) {
            parametricTaskBuilderRef.current.executeCreateTaskCallback();
          } else {
            // Fallback: crear los datos manualmente desde los estados actuales
            const taskData = {
              selections: parametricSelections,
              preview: parametricTaskPreview,
              paramValues: (() => {
                const values: Record<string, string> = {};
                parametricSelections.forEach(sel => {
                  values[sel.parameterSlug] = sel.optionId;
                });
                return values;
              })(),
              paramOrder: parametricParameterOrder,
              availableParameters: [] // No disponible en fallback
            };
            handleCreateParametricTask(taskData);
          }
        }}
        showLoadingSpinner={isCreatingParametricTask}
        submitDisabled={parametricSelections.length === 0 || isCreatingParametricTask}
      />
    ) : (
      <FormModalFooter
        leftLabel="Cancelar"
        onLeftClick={() => {
          // Reset campos
          setTaskNameText('');  
          setSelectedCategoryId('');
          setSelectedUnitId('');
          // Volver al panel principal
          setPanel('edit');
          setActiveTab('parametric');
        }}
        rightLabel={isCreatingCustomTask ? "Creando..." : "Crear Nueva Tarea"}
        onRightClick={handleCreateCustomTask}
        showLoadingSpinner={isCreatingCustomTask}
        submitDisabled={!taskNameText.trim() || !selectedCategoryId || !selectedUnitId || isCreatingCustomTask}
      />
    )
  ) : (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={modalData.isEditing ? "Guardar Cambios" : `Agregar ${selectedTasks.length} Tarea${selectedTasks.length !== 1 ? 's' : ''}`}
      onRightClick={() => {
        handleSubmit(onSubmit)();
      }}
      showLoadingSpinner={isSubmitting}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      wide={true}
      viewPanel={viewPanel}
      editPanel={editPanel}
      subformPanel={getSubform()}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
      isEditing={true}
    />
  );
}