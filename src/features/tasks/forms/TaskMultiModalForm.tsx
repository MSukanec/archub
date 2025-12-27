import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/lib/supabase";

import { ComboBox } from "@/components/shared/fields/ComboBoxWriteField";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Search, CheckSquare, Square, Filter, X, Plus, Zap, ArrowLeft, Layers, Wrench } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCreateConstructionTask, useUpdateConstructionTask, useCreateGeneratedTask, useTopLevelCategories, useUnits } from "@/features/tasks";
import { useConstructionProjectPhases } from "@/hooks/use-construction-phases";
import { ParametricTaskBuilder } from "@/features/tasks";

import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export const addTaskSchema = z.object({
  selectedTasks: z.array(z.object({
    task_id: z.string(),
    quantity: z.number().min(0.01, "La cantidad debe ser mayor a 0")
  })).min(1, "Debe seleccionar al menos una tarea")
});

export type AddTaskFormData = z.infer<typeof addTaskSchema>;

export interface SelectedTask {
  task_id: string;
  quantity: number;
  project_phase_id?: string;
}

export interface ParameterSelection {
  parameterId: string;
  optionId: string;
  parameterSlug: string;
  parameterLabel: string;
  optionName: string;
  optionLabel: string;
}

interface FormPanelProps {
  selectedTasks: SelectedTask[];
  searchQuery: string;
  rubroFilter: string;
  filteredTasks: any[];
  tasks: any[];
  projectPhases: any[];
  rubros: any[];
  units: any[];
  
  setSearchQuery: (query: string) => void;
  setRubroFilter: (filter: string) => void;
  setSelectedTasks: (tasks: SelectedTask[] | ((prev: SelectedTask[]) => SelectedTask[])) => void;
  handleTaskSelection: (taskId: string, isSelected: boolean) => void;
  
  form: ReturnType<typeof useForm<AddTaskFormData>>;
  errors: any;
  
  setPanel: (panel: string) => void;
  setCurrentSubform: (subform: string) => void;
  
  showParametricTaskCreator: boolean;
  activeTab: 'parametric' | 'custom';
  taskNameText: string;
  selectedCategoryId: string;
  selectedUnitId: string;
  
  setActiveTab: (tab: 'parametric' | 'custom') => void;
  setTaskNameText: (text: string) => void;
  setSelectedCategoryId: (id: string) => void;
  setSelectedUnitId: (id: string) => void;
  
  parametricSelections: ParameterSelection[];
  parametricTaskPreview: string;
  parametricParameterOrder: string[];
  
  setParametricSelections: (selections: ParameterSelection[]) => void;
  setParametricTaskPreview: (preview: string) => void;
  setParametricParameterOrder: (order: string[]) => void;
  
  handleCreateParametricTask: (taskData?: any) => Promise<void>;
  handleCreateCustomTask: () => Promise<void>;
  
  parametricTaskBuilderRef: React.RefObject<{ executeCreateTaskCallback: () => void }>;
  
  isCreatingParametricTask: boolean;
  isCreatingCustomTask: boolean;
  tasksLoading: boolean;
  rubrosLoading: boolean;
  unitsLoading: boolean;
}

export function FormPanel({
  selectedTasks,
  searchQuery,
  rubroFilter,
  filteredTasks,
  tasks,
  projectPhases,
  rubros,
  units,
  
  setSearchQuery,
  setRubroFilter,
  setSelectedTasks,
  handleTaskSelection,
  
  form,
  errors,
  
  setPanel,
  setCurrentSubform,
  
  showParametricTaskCreator,
  activeTab,
  taskNameText,
  selectedCategoryId,
  selectedUnitId,
  
  setActiveTab,
  setTaskNameText,
  setSelectedCategoryId,
  setSelectedUnitId,
  
  parametricSelections,
  parametricTaskPreview,
  parametricParameterOrder,
  
  setParametricSelections,
  setParametricTaskPreview,
  setParametricParameterOrder,
  
  handleCreateParametricTask,
  handleCreateCustomTask,
  
  parametricTaskBuilderRef,
  
  isCreatingParametricTask,
  isCreatingCustomTask,
  tasksLoading,
  rubrosLoading,
  unitsLoading,
}: FormPanelProps) {
  const { handleSubmit } = form;
  
  const rubroOptions = useMemo(() => {
    const uniqueRubros = Array.from(new Set(tasks.map(task => task.category_name).filter(Boolean)));
    return uniqueRubros.map(rubro => ({ value: rubro, label: rubro }));
  }, [tasks]);

  return (
    <form 
      onSubmit={handleSubmit(() => {})} 
      className="flex flex-col h-full"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
        }
      }}
    >
      <div className="flex-shrink-0 space-y-6">
        <div className="space-y-2">
          {errors.selectedTasks && (
            <p className="text-sm text-destructive">{errors.selectedTasks.message}</p>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-2 gap-4">
        <div className="border rounded-lg">
          <div className="p-3 border-b bg-muted">
            <h3 className="text-sm font-medium">Tareas Disponibles</h3>
          </div>
          
          <div className="p-3 border-b space-y-3">
            <div className="grid grid-cols-2 gap-3">
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
          
          <div className="py-2 px-3 bg-muted/50 font-medium text-xs border-b">
            <div className="text-xs font-medium">TAREA</div>
          </div>

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
                        setSelectedTasks(prev => [...prev, { task_id: task.id, quantity: 1 }]);
                      }}
                    >
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

        <div className="border rounded-lg">
          <div className="p-3 border-b bg-muted">
            <h3 className="text-sm font-medium">Tareas Seleccionadas ({selectedTasks.length})</h3>
          </div>
          
          <div className="grid gap-2 py-2 px-3 bg-muted/50 font-medium text-xs border-b" style={{gridTemplateColumns: "1fr auto auto auto"}}>
            <div className="text-xs font-medium">TAREA</div>
            <div className="text-xs font-medium w-16">CANT.</div>
            <div className="text-xs font-medium w-20">FASE</div>
            <div className="text-xs font-medium w-8"></div>
          </div>

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
                      <div>
                        <div className="text-sm leading-tight line-clamp-2">
                          {task.name_rendered || 'Sin nombre'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <span className="font-bold">{task.category_name || 'Sin rubro'}</span> - {task.unit_name || 'Sin unidad'}
                        </div>
                      </div>

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
}

export function useTaskMultiModalForm(
  modalData: {
    projectId: string;
    organizationId: string;
    userId?: string;
    editingTask?: any;
    isEditing?: boolean;
  },
  onClose: () => void,
  setPanel: (panel: any) => void,
  setCurrentSubform: (subform: any) => void
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTasks, setSelectedTasks] = useState<SelectedTask[]>([]);
  const [rubroFilter, setRubroFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [showParametricTaskCreator, setShowParametricTaskCreator] = useState(false);
  
  const [parametricSelections, setParametricSelections] = useState<ParameterSelection[]>([]);
  const [parametricTaskPreview, setParametricTaskPreview] = useState<string>('');
  const [parametricParameterOrder, setParametricParameterOrder] = useState<string[]>([]);
  const [isCreatingParametricTask, setIsCreatingParametricTask] = useState(false);
  
  const parametricTaskBuilderRef = useRef<{ executeCreateTaskCallback: () => void }>(null);
  
  const { data: userData } = useCurrentUser();
  
  const createGeneratedTask = useCreateGeneratedTask();
  
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'parametric' | 'custom'>('parametric');
  
  const [taskNameText, setTaskNameText] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [isCreatingCustomTask, setIsCreatingCustomTask] = useState(false);
  
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
        console.error('❌ Error obteniendo membresía de organización:', error);
        return null;
      }
      
      console.log('✅ Membresía encontrada:', data);
      return data;
    },
    enabled: !!userData?.user?.id && !!modalData.organizationId
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['task-library', modalData.organizationId],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      console.log('🔍 Cargando tareas de la organización:', modalData.organizationId);
      
      const { data: allTasks, error } = await supabase
        .from('task_view')
        .select('*')
        .or(`organization_id.is.null,organization_id.eq.${modalData.organizationId}`)
        .order('name_rendered', { ascending: true });
      
      if (error) {
        console.error('❌ Error cargando librería de tareas:', error);
        throw error;
      }
      
      console.log('✅ Tareas filtradas por organización cargadas:', allTasks?.length || 0);
      console.log('📋 Organizaciones presentes:', Array.from(new Set(allTasks?.map(t => t.organization_id || 'SISTEMA') || [])));
      
      return allTasks || [];
    },
    enabled: !!supabase && !!modalData.organizationId
  });

  const { data: projectPhases = [], isLoading: isLoadingProjectPhases } = useConstructionProjectPhases(modalData.projectId);
  
  const { data: rubros = [], isLoading: rubrosLoading } = useTopLevelCategories();
  const { data: units = [], isLoading: unitsLoading } = useUnits();
  
  useEffect(() => {
    console.log('Project phases loaded:', projectPhases);
  }, [projectPhases]);

  const form = useForm<AddTaskFormData>({
    resolver: zodResolver(addTaskSchema),
    defaultValues: {
      selectedTasks: []
    }
  });

  const { handleSubmit, setValue, watch, formState: { errors } } = form;

  const filteredTasks = useMemo(() => {
    console.log('🔄 Procesando filtros - Tareas totales:', tasks.length, 'Búsqueda:', searchQuery, 'Rubro:', rubroFilter);
    
    let filtered = tasks;
    
    if (rubroFilter) {
      filtered = filtered.filter(task => task.category_name === rubroFilter);
    }
    
    if (searchQuery.trim()) {
      filtered = filtered.filter(task => 
        task.name_rendered?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    console.log('🔍 Tareas filtradas:', filtered.length);
    return filtered;
  }, [tasks, searchQuery, rubroFilter]);

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

  useEffect(() => {
    if (modalData.isEditing && modalData.editingTask) {
      const task = modalData.editingTask;
      console.log('Loading task for editing:', task);
      
      setSelectedTasks([{
        task_id: task.task_id || '',
        quantity: task.quantity || 1,
        project_phase_id: task.phase_instance_id || ''
      }]);
      
      form.reset({
        selectedTasks: [{
          task_id: task.task_id || '',
          quantity: task.quantity || 1
        }]
      });
    }
  }, [modalData.isEditing, modalData.editingTask, form]);

  useEffect(() => {
    setValue('selectedTasks', selectedTasks);
  }, [selectedTasks, setValue]);

  const createTask = useCreateConstructionTask();
  const updateTask = useUpdateConstructionTask();

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

  const handleCreateParametricTask = async (taskData?: { selections: ParameterSelection[], preview: string, paramValues: Record<string, string>, paramOrder: string[], availableParameters: string[] }) => {
    const selections = taskData?.selections || parametricSelections;
    const preview = taskData?.preview || parametricTaskPreview;
    const paramOrder = taskData?.paramOrder || parametricParameterOrder;
    const availableParams = taskData?.availableParameters || [];

    console.log('🔍 DEBUG: Iniciando handleCreateParametricTask');
    console.log('📊 taskData recibida:', taskData);
    console.log('📊 selections:', selections);
    console.log('📊 availableParams:', availableParams);

    if (selections.length === 0) {
      toast({
        title: "Error",
        description: "Debes seleccionar al menos un parámetro",
        variant: "destructive",
      });
      return;
    }

    console.log('🔍 DEBUG: Validando parámetros obligatorios');
    console.log('📊 allParameters:', allParameters);
    console.log('📊 selections:', selections);
    console.log('📊 availableParams (del ParametricTaskBuilder):', availableParams);
    
    const availableRequiredParams = allParameters.filter(param => 
      param.is_required && availableParams.includes(param.id)
    );
    console.log('📊 availableRequiredParams:', availableRequiredParams);
    
    const selectedParameterIds = selections.map(sel => sel.parameterId);
    console.log('📊 selectedParameterIds:', selectedParameterIds);
    
    const missingRequiredParams = availableRequiredParams.filter(param => 
      !selectedParameterIds.includes(param.id)
    );
    console.log('📊 missingRequiredParams:', missingRequiredParams);

    if (missingRequiredParams.length > 0) {
      const missingNames = missingRequiredParams.map(param => param.label).join(', ');
      console.log('❌ VALIDACIÓN FALLÓ - Parámetros faltantes:', missingNames);
      toast({
        title: "Parámetros obligatorios faltantes",
        description: `Debes completar los siguientes parámetros obligatorios: ${missingNames}`,
        variant: "destructive",
      });
      return;
    }

    console.log('✅ VALIDACIÓN EXITOSA - Todos los parámetros obligatorios están presentes');

    setIsCreatingParametricTask(true);

    try {
      const paramValuesToUse = taskData?.paramValues || (() => {
        const paramValues: Record<string, string> = {};
        selections.forEach(selection => {
          paramValues[selection.parameterSlug] = selection.optionId;
        });
        return paramValues;
      })();

      console.log('🚀 Creando tarea paramétrica con valores:', {
        paramValues: paramValuesToUse,
        paramOrder: paramOrder,
        preview: preview
      });

      const response = await createGeneratedTask.mutateAsync({
        param_values: paramValuesToUse,
        param_order: paramOrder
      });

      console.log('✅ Nueva tarea paramétrica creada:', response);

      const newTaskId = response.new_task?.id;
      if (newTaskId) {
        setSelectedTasks(prev => [...prev, { 
          task_id: newTaskId, 
          quantity: 1 
        }]);
      }

      setSearchQuery('');
      setRubroFilter('');
      setCategoryFilter('');

      setParametricSelections([]);
      setParametricTaskPreview('');
      setParametricParameterOrder([]);
      setShowParametricTaskCreator(false);

      setPanel('edit');
      setActiveTab('parametric');

      toast({
        title: "Tarea creada",
        description: "La nueva tarea paramétrica se creó y agregó correctamente",
      });

    } catch (error) {
      console.error('❌ Error creando tarea paramétrica:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la tarea paramétrica",
        variant: "destructive",
      });
    } finally {
      setIsCreatingParametricTask(false);
    }
  };

  const handleCreateCustomTask = async () => {
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
      console.log('🚀 Creando tarea personalizada con datos:', {
        input_custom_name: taskNameText.trim(),
        input_unit_id: selectedUnitId,
        input_category_id: selectedCategoryId,
        input_organization_id: userData.organization.id
      });

      if (!supabase) {
        throw new Error('Supabase client no está disponible');
      }
      
      const { data: result, error } = await supabase.rpc("create_parametric_task", {
        input_param_values: {},
        input_param_order: [],
        input_unit_id: selectedUnitId,
        input_category_id: selectedCategoryId,
        input_organization_id: userData.organization.id,
        input_custom_name: taskNameText.trim()
      });

      if (error) {
        console.error('❌ Error en create_parametric_task:', error);
        throw error;
      }

      console.log('✅ Tarea personalizada creada:', result);

      if (result?.new_task) {
        setSelectedTasks(prev => [...prev, {
          task_id: result.new_task.id,
          quantity: 1,
          project_phase_id: ''
        }]);
      }

      await queryClient.invalidateQueries({ queryKey: ['task-library'] });
      
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
      console.error('❌ Error creando tarea personalizada:', error);
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
    console.log('🚀 SUBMIT INICIADO - Datos del formulario:', data);
    console.log('🚀 SUBMIT INICIADO - selectedTasks:', selectedTasks);
    console.log('🚀 SUBMIT INICIADO - modalData:', modalData);
    console.log('🚀 SUBMIT INICIADO - userData:', userData?.user);
    console.log('🚀 SUBMIT INICIADO - organizationMember:', organizationMember);

    if (!userData?.user?.id) {
      toast({
        title: "Error",
        description: "No se pudo identificar el usuario",
        variant: "destructive"
      });
      return;
    }

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
        console.log('🚀 CREANDO TAREAS - DATOS A ENVIAR:', {
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
        console.log('🔧 ID A USAR PARA created_by:', {
          organizationMember: organizationMember?.id,
          finalId: createdById
        });

        const promises = selectedTasks.map((selectedTask, index) => {
          console.log(`🔄 Preparando tarea ${index + 1}:`, {
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
            console.error(`❌ Error en tarea ${index + 1}:`, error);
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
      console.error('❌ ERROR COMPLETO AL ENVIAR TAREAS:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error message:', (error as any)?.message);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      
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

  return {
    form,
    handleSubmit,
    onSubmit,
    errors: errors,
    
    // State
    isSubmitting,
    searchQuery,
    selectedTasks,
    rubroFilter,
    categoryFilter,
    showParametricTaskCreator,
    parametricSelections,
    parametricTaskPreview,
    parametricParameterOrder,
    activeTab,
    taskNameText,
    selectedCategoryId,
    selectedUnitId,
    isCreatingCustomTask,
    isCreatingParametricTask,
    
    // Setters
    setSearchQuery,
    setSelectedTasks,
    setRubroFilter,
    setCategoryFilter,
    setShowParametricTaskCreator,
    setParametricSelections,
    setParametricTaskPreview,
    setParametricParameterOrder,
    setActiveTab,
    setTaskNameText,
    setSelectedCategoryId,
    setSelectedUnitId,
    setIsCreatingCustomTask,
    
    // Data
    tasks,
    projectPhases,
    rubros,
    units,
    
    // Loading states
    tasksLoading,
    isLoadingProjectPhases,
    rubrosLoading,
    unitsLoading,
    organizationMember,
    
    // Computed
    filteredTasks,
    
    // Handlers
    handleTaskSelection,
    handleQuantityChange,
    handleCreateParametricTask,
    handleCreateCustomTask,
    
    // Refs
    parametricTaskBuilderRef,
  };
}
