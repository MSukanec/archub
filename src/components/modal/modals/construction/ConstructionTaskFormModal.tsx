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

import { ComboBox } from "@/components/ui-custom/ComboBoxWrite";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Search, CheckSquare, Square, Filter, X, Plus, Zap, ArrowLeft, Layers, Wrench } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCreateConstructionTask, useUpdateConstructionTask } from "@/hooks/use-construction-tasks";
import { useConstructionProjectPhases } from "@/hooks/use-construction-phases";
import { ParametricTaskBuilder } from "@/components/ui-custom/ParametricTaskBuilder";
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

interface ConstructionTaskFormModalProps {
  modalData: {
    projectId: string;
    organizationId: string;
    userId?: string;
    editingTask?: any;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function ConstructionTaskFormModal({ 
  modalData, 
  onClose 
}: ConstructionTaskFormModalProps) {
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
        console.error('❌ Error obteniendo membresía de organización:', error);
        return null;
      }
      
      console.log('✅ Membresía encontrada:', data);
      return data;
    },
    enabled: !!userData?.user?.id && !!modalData.organizationId
  });



  // Hook para cargar TODAS las tareas de la librería parametrica (sin filtrar por proyecto)
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['task-parametric-library'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      console.log('🔍 Cargando librería completa de tareas parametricas');
      
      const { data: allTasks, error } = await supabase
        .from('task_view')
        .select('*')
        .order('name_rendered', { ascending: true });
      
      if (error) {
        console.error('❌ Error cargando librería de tareas:', error);
        throw error;
      }
      
      console.log('✅ Librería de tareas cargada:', allTasks?.length || 0);
      console.log('📋 Primeras 3 tareas:', allTasks?.slice(0, 3));
      
      return allTasks || [];
    },
    enabled: !!supabase
  });

  // Hook para obtener las fases del proyecto
  const { data: projectPhases = [], isLoading: isLoadingProjectPhases } = useConstructionProjectPhases(modalData.projectId);
  
  // Hooks para datos de tarea personalizada
  const { data: rubros = [], isLoading: rubrosLoading } = useTopLevelCategories();
  const { data: units = [], isLoading: unitsLoading } = useUnits();
  
  // Log para debug
  useEffect(() => {
    console.log('Project phases loaded:', projectPhases);
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
    console.log('🔄 Procesando filtros - Tareas totales:', tasks.length, 'Búsqueda:', searchQuery, 'Rubro:', rubroFilter);
    
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
    
    console.log('🔍 Tareas filtradas:', filtered.length);
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
      console.log('Loading task for editing:', task);
      
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

    // Validar parámetros obligatorios entre los disponibles
    console.log('🔍 DEBUG: Validando parámetros obligatorios');
    console.log('📊 allParameters:', allParameters);
    console.log('📊 selections:', selections);
    console.log('📊 availableParams (del ParametricTaskBuilder):', availableParams);
    
    // Solo validar parámetros obligatorios que están actualmente disponibles/visibles
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
      // Usar paramValues del callback si está disponible, sino crear desde selections
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
      console.log('🚀 Creando tarea personalizada con datos:', {
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
        console.error('❌ Error en create_parametric_task:', error);
        throw error;
      }

      console.log('✅ Tarea personalizada creada:', result);

      // Agregar la nueva tarea a la lista de tareas seleccionadas
      if (result?.new_task) {
        setSelectedTasks(prev => [...prev, {
          task_id: result.new_task.id,
          quantity: 1,
          project_phase_id: '' // Sin fase por defecto
        }]);
      }

      // Invalidar caché para que la tabla se actualice automáticamente
      await queryClient.invalidateQueries({ queryKey: ['task-parametric-library'] });
      
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

    if (!organizationMember?.id) {
      console.log('⚠️ organizationMember es null');
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
        console.log('🚀 CREANDO TAREAS - DATOS A ENVIAR:', {
          numberOfTasks: selectedTasks.length,
          organizationId: modalData.organizationId,
          projectId: modalData.projectId,
          createdBy: organizationMember?.id,
          taskDetails: selectedTasks.map(st => ({
            task_id: st.task_id,
            quantity: st.quantity,
            project_phase_id: st.project_phase_id
          }))
        });

        const createdById = organizationMember?.id;
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

  // Panel de vista (vacío para este modal)
  const viewPanel = (
      Este modal no tiene vista previa
    </div>
  );

  const editPanel = (
    <form 
      onSubmit={handleSubmit(onSubmit)} 
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSubmit(onSubmit)();
        }
      }}
    >
      {/* Sección fija superior */}


        {/* Errores y estado */}
          {errors.selectedTasks && (
          )}
        </div>
      </div>

      {/* Layout de dos columnas */}
        {/* Columna Izquierda - Tareas Disponibles */}
          </div>
          
          {/* Filtros en la columna izquierda - inline */}
              {/* Filtro por Rubro */}
                  Filtrar por Rubro
                </Label>
                <ComboBox
                  value={rubroFilter}
                  onValueChange={setRubroFilter}
                  options={rubroOptions}
                  placeholder="Todos los rubros"
                  searchPlaceholder="Buscar rubro..."
                  emptyMessage="No se encontraron rubros"
                />
              </div>
              
              {/* Campo de búsqueda */}
                  Búsqueda de Texto
                </Label>
                  <input
                    type="text"
                    placeholder="Buscar por nombre o categoría..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Table Header */}
          </div>

          {/* Table Body */}
              {filteredTasks.length === 0 ? (
                    {searchQuery ? "No se encontraron tareas" : "No hay tareas disponibles"}
                  </div>
                  {searchQuery && (
                        ¿No encuentras la tarea que necesitas?
                      </p>
                      <Button
                        type="button"
                        variant="default"
                        size="sm"
                        onClick={() => {
                          // Navegar al subform
                          setPanel('subform');
                          setCurrentSubform('parametric-task');
                        }}
                      >
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
                          {task.name_rendered || 'Sin nombre'}
                        </div>
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
          </div>
          
          {/* Selected Tasks Header */}
          </div>

          {/* Selected Tasks Body */}
              {selectedTasks.length === 0 ? (
                  No hay tareas seleccionadas
                </div>
              ) : (
                selectedTasks.map((selectedTask, index) => {
                  const task = tasks?.find(t => t.id === selectedTask.task_id);
                  if (!task) return null;
                  
                  return (
                      {/* Task Name */}
                      <div>
                          {task.name_rendered || 'Sin nombre'}
                        </div>
                        </div>
                      </div>

                      {/* Cantidad Input */}
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
                          min="0"
                          step="0.01"
                        />
                      </div>

                      {/* Fase Select */}
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTasks(prev => prev.filter((_, i) => i !== index));
                          }}
                        >
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
              {/* Tabs personalizadas al estilo ActionBar */}
                <div 
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
                      </div>
                      <div>
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
                      </div>
                      <div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Formulario de tarea personalizada */}
                    {/* 1. Rubro y Unidad en la misma fila */}
                      {/* ComboBox para Rubros */}
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
                        Nombre de la Tarea *
                      </Label>
                      <Textarea
                        placeholder="Describe detalladamente la tarea a realizar..."
                        value={taskNameText}
                        onChange={(e) => setTaskNameText(e.target.value)}
                        rows={3}
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
      description="Elige el método para crear tu nueva tarea de construcción"
      icon={Plus}
      leftActions={
        <Button
          variant="ghost"
          onClick={() => setPanel('edit')}
        >
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
        console.log('🎯 BOTÓN PRESIONADO - Form errors:', form.formState.errors);
        console.log('🎯 BOTÓN PRESIONADO - Form isValid:', form.formState.isValid);
        console.log('🎯 BOTÓN PRESIONADO - Form values:', form.getValues());
        console.log('🎯 BOTÓN PRESIONADO - selectedTasks:', selectedTasks);
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