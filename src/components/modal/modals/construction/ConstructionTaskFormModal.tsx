import React, { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/lib/supabase";
import { FormModalLayout } from "@/components/modal/form/FormModalLayout";
import { FormModalHeader } from "@/components/modal/form/FormModalHeader";
import { FormModalFooter } from "@/components/modal/form/FormModalFooter";

import { ComboBox } from "@/components/ui-custom/ComboBoxWrite";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Search, CheckSquare, Square, Filter } from "lucide-react";
import { useTaskSearch } from "@/hooks/use-task-search";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCreateConstructionTask, useUpdateConstructionTask } from "@/hooks/use-construction-tasks";
import { useProjectPhases } from "@/hooks/use-construction-phases";
import { useModalPanelStore } from "@/components/modal/form/modalPanelStore";

import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const addTaskSchema = z.object({
  project_phase_id: z.string().min(1, "Debe seleccionar una fase de proyecto"),
  selectedTasks: z.array(z.object({
    task_id: z.string(),
    quantity: z.number().min(0.01, "La cantidad debe ser mayor a 0")
  })).min(1, "Debe seleccionar al menos una tarea")
});

type AddTaskFormData = z.infer<typeof addTaskSchema>;

interface SelectedTask {
  task_id: string;
  quantity: number;
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
  
  const { data: userData } = useCurrentUser();
  const { setPanel } = useModalPanelStore();

  // Get current user's member_id
  const { data: currentMember } = useQuery({
    queryKey: ['current-member', modalData.organizationId, userData?.user?.id],
    queryFn: async () => {
      if (!userData?.user?.id || !modalData.organizationId) return null;
      
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data, error } = await supabase
        .from('organization_members')
        .select('id')
        .eq('organization_id', modalData.organizationId)
        .eq('user_id', userData.user.id)
        .single();

      if (error) {
        console.error('Error fetching member:', error);
        return null;
      }

      return data;
    },
    enabled: !!userData?.user?.id && !!modalData.organizationId
  });

  // Forzar modo de edición al abrir el modal
  useEffect(() => {
    setPanel("edit");
  }, [setPanel]);

  // Hook para búsqueda de tareas (buscar siempre si hay query o si estamos editando)
  const { data: tasks = [], isLoading: tasksLoading } = useTaskSearch(
    searchQuery, 
    modalData.organizationId, 
    { origin: 'all' },
    searchQuery.length >= 3 || modalData.isEditing
  );

  // Hook para obtener las fases del proyecto
  const { data: projectPhases = [], isLoading: isLoadingProjectPhases } = useProjectPhases(modalData.projectId);
  
  // Log para debug
  useEffect(() => {
    console.log('Project phases loaded:', projectPhases);
  }, [projectPhases]);

  // Hook para obtener la fase actual de la tarea cuando se está editando
  // Ya tenemos la información en editingTask.phase_instance_id, no necesitamos query adicional

  const form = useForm<AddTaskFormData>({
    resolver: zodResolver(addTaskSchema),
    defaultValues: {
      project_phase_id: "",
      selectedTasks: []
    }
  });

  const { handleSubmit, setValue, watch, formState: { errors } } = form;

  // Filtrar y procesar todas las tareas disponibles
  const filteredTasks = useMemo(() => {
    let filtered = tasks;
    
    // Filtro por búsqueda
    if (searchQuery.trim()) {
      filtered = filtered.filter(task => 
        task.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.rubro_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category_name?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filtro por rubro
    if (rubroFilter) {
      filtered = filtered.filter(task => task.rubro_name === rubroFilter);
    }
    
    // Filtro por categoría
    if (categoryFilter) {
      filtered = filtered.filter(task => task.category_name === categoryFilter);
    }
    
    return filtered;
  }, [tasks, searchQuery, rubroFilter, categoryFilter]);

  // Obtener opciones únicas para filtros
  const rubroOptions = useMemo(() => {
    const rubros = [...new Set(tasks.map(task => task.rubro_name).filter(Boolean))];
    return rubros.sort();
  }, [tasks]);

  const categoryOptions = useMemo(() => {
    const categories = [...new Set(tasks.map(task => task.category_name).filter(Boolean))];
    return categories.sort();
  }, [tasks]);

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

  const handleSelectAll = () => {
    const allFiltered = filteredTasks.map(task => ({ task_id: task.id, quantity: 1 }));
    setSelectedTasks(allFiltered);
  };

  const handleClearAll = () => {
    setSelectedTasks([]);
  };

  // Cargar datos cuando está en modo edición
  useEffect(() => {
    if (modalData.isEditing && modalData.editingTask) {
      const task = modalData.editingTask;
      console.log('Loading task for editing:', task);
      
      // Pre-cargar la tarea actual como seleccionada
      setSelectedTasks([{
        task_id: task.task_id || '',
        quantity: task.quantity || 1
      }]);
      
      // Reset del formulario con valores básicos
      form.reset({
        project_phase_id: task.phase_instance_id || '',
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

  const onSubmit = async (data: AddTaskFormData) => {
    if (!userData?.user?.id) {
      toast({
        title: "Error",
        description: "No se pudo identificar el usuario",
        variant: "destructive"
      });
      return;
    }

    if (!currentMember?.id) {
      toast({
        title: "Error", 
        description: "No se pudo identificar el miembro de la organización",
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
          project_phase_id: data.project_phase_id
        });

        toast({
          title: "Tarea actualizada",
          description: "La tarea se ha actualizado correctamente",
        });
      } else {
        // Modo creación - crear múltiples tareas
        const promises = selectedTasks.map(selectedTask => 
          createTask.mutateAsync({
            organization_id: modalData.organizationId,
            project_id: modalData.projectId,
            task_id: selectedTask.task_id,
            quantity: selectedTask.quantity,
            created_by: currentMember.id,
            project_phase_id: data.project_phase_id
          })
        );

        await Promise.all(promises);

        toast({
          title: "Tareas agregadas",
          description: `Se agregaron ${selectedTasks.length} tarea${selectedTasks.length > 1 ? 's' : ''} al proyecto`,
        });
      }

      onClose();
    } catch (error) {
      console.error('Error submitting tasks:', error);
      toast({
        title: "Error",
        description: modalData.isEditing ? "No se pudo actualizar la tarea" : "No se pudo agregar las tareas",
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
      className="space-y-6 h-full flex flex-col"
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          handleSubmit(onSubmit)();
        }
      }}
    >
      {/* Phase Selection */}
      <div className="space-y-2">
        <Label htmlFor="project_phase_id">Fase de Proyecto *</Label>
        <Select 
          value={watch('project_phase_id') || ""}
          onValueChange={(value) => setValue('project_phase_id', value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar fase del proyecto" />
          </SelectTrigger>
          <SelectContent>
            {projectPhases.map((projectPhase) => (
              <SelectItem key={projectPhase.id} value={projectPhase.id}>
                {projectPhase.phase.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.project_phase_id && (
          <p className="text-sm text-destructive">{errors.project_phase_id.message}</p>
        )}
      </div>

      {/* Search and Filters Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Seleccionar Tareas *</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
              disabled={filteredTasks.length === 0}
            >
              Seleccionar Todo
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearAll}
              disabled={selectedTasks.length === 0}
            >
              Limpiar
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nombre, código, rubro o categoría..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
          />
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select value={rubroFilter} onValueChange={setRubroFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por Rubro" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todos los Rubros</SelectItem>
              {rubroOptions.map((rubro) => (
                <SelectItem key={rubro} value={rubro}>
                  {rubro}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Todas las Categorías</SelectItem>
              {categoryOptions.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Selected Tasks Summary */}
        {selectedTasks.length > 0 && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              {selectedTasks.length} tarea{selectedTasks.length > 1 ? 's' : ''} seleccionada{selectedTasks.length > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Tasks List */}
      <div className="flex-1 min-h-0">
        <ScrollArea className="h-full max-h-[400px] border rounded-md">
          <div className="p-4 space-y-2">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery || rubroFilter || categoryFilter 
                  ? "No se encontraron tareas con los filtros aplicados" 
                  : "No hay tareas disponibles"
                }
              </div>
            ) : (
              filteredTasks.map((task) => {
                const isSelected = selectedTasks.some(t => t.task_id === task.id);
                const selectedTask = selectedTasks.find(t => t.task_id === task.id);
                
                return (
                  <div key={task.id} className="flex items-start space-x-3 p-3 border rounded-md hover:bg-muted/50">
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => handleTaskSelection(task.id, checked as boolean)}
                      className="mt-1"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight mb-1">
                            {task.display_name || task.code || 'Sin nombre'}
                          </p>
                          
                          <div className="flex flex-wrap gap-1 mb-2">
                            {task.code && (
                              <Badge variant="outline" className="text-xs">
                                {task.code}
                              </Badge>
                            )}
                            {task.rubro_name && (
                              <Badge variant="secondary" className="text-xs">
                                {task.rubro_name}
                              </Badge>
                            )}
                            {task.category_name && (
                              <Badge variant="outline" className="text-xs">
                                {task.category_name}
                              </Badge>
                            )}
                          </div>
                          
                          <p className="text-xs text-muted-foreground">
                            Unidad: {task.units?.symbol || task.units?.name || 'ud'}
                          </p>
                        </div>
                        
                        {isSelected && (
                          <div className="ml-3 flex-shrink-0">
                            <div className="flex items-center space-x-2">
                              <Label htmlFor={`quantity-${task.id}`} className="text-xs">
                                Cant:
                              </Label>
                              <input
                                id={`quantity-${task.id}`}
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={selectedTask?.quantity || 1}
                                onChange={(e) => handleQuantityChange(task.id, parseFloat(e.target.value) || 1)}
                                className="w-20 px-2 py-1 text-xs border border-input rounded bg-background"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {errors.selectedTasks && (
        <p className="text-sm text-destructive">{errors.selectedTasks.message}</p>
      )}
    </form>
  );

  const headerContent = (
    <FormModalHeader 
      title={modalData.isEditing ? "Editar Tarea de Construcción" : "Seleccionar Tareas del Proyecto"}
      icon={CheckSquare}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={modalData.isEditing ? "Guardar Cambios" : `Agregar ${selectedTasks.length} Tarea${selectedTasks.length !== 1 ? 's' : ''}`}
      onRightClick={handleSubmit(onSubmit)}
      rightDisabled={isSubmitting || selectedTasks.length === 0}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
    />
  );
}