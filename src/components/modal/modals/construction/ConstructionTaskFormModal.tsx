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
import { Settings, Search, CheckSquare, Square, Filter, X } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCreateConstructionTask, useUpdateConstructionTask } from "@/hooks/use-construction-tasks";
import { useProjectPhases } from "@/hooks/use-construction-phases";
import { useModalPanelStore } from "@/components/modal/form/modalPanelStore";

import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

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
  phase_instance_id?: string;
}

interface ConstructionTaskFormModalProps {
  modalData: {
    projectId: string;
    organizationId: string;
    isEditing?: boolean;
    editingTask?: any;
  };
  onClose: () => void;
}

export function ConstructionTaskFormModal({ modalData, onClose }: ConstructionTaskFormModalProps) {
  const [selectedTasks, setSelectedTasks] = useState<SelectedTask[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [rubroFilter, setRubroFilter] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { userData, currentMember } = useCurrentUser();
  const { data: projectPhases = [] } = useProjectPhases(modalData.projectId);

  // Hook para el formulario
  const form = useForm<AddTaskFormData>({
    resolver: zodResolver(addTaskSchema),
    defaultValues: {
      project_phase_id: '',
      selectedTasks: []
    }
  });

  const { handleSubmit, watch, setValue } = form;

  // Query para obtener TODAS las tareas (task library)
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['task-library', modalData.organizationId],
    queryFn: async () => {
      console.log('🔍 Cargando TODAS las tareas SIN FILTRAR');
      
      const { data, error } = await supabase
        .from('task_generated_view')
        .select('*')
        .order('rubro_name', { ascending: true })
        .order('category_name', { ascending: true })
        .order('display_name', { ascending: true });

      if (error) {
        console.error('Error loading tasks:', error);
        throw error;
      }

      console.log('✅ TODAS las tareas cargadas SIN FILTRO:', data?.length || 0);
      console.log('📋 Primeras 3 tareas:', data?.slice(0, 3));
      
      return data || [];
    },
    enabled: true
  });

  // Generar opciones de rubros dinámicamente
  const rubroOptions = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    
    const uniqueRubros = Array.from(
      new Set(tasks.map(task => task.rubro_name).filter(Boolean))
    ).sort();
    
    return [
      { label: "Todos los rubros", value: "" },
      ...uniqueRubros.map(rubro => ({
        label: rubro,
        value: rubro
      }))
    ];
  }, [tasks]);

  // Filtrado de tareas
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    
    console.log('🔄 Procesando filtros - Tareas totales:', tasks.length, 'Búsqueda:', searchQuery, 'Rubro:', rubroFilter);
    
    let filtered = tasks;

    // Filtro por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        (task.display_name?.toLowerCase().includes(query)) ||
        (task.rubro_name?.toLowerCase().includes(query)) ||
        (task.category_name?.toLowerCase().includes(query))
      );
    }

    // Filtro por rubro
    if (rubroFilter) {
      filtered = filtered.filter(task => task.rubro_name === rubroFilter);
    }

    console.log('🔍 Tareas filtradas:', filtered.length);
    return filtered;
  }, [tasks, searchQuery, rubroFilter]);

  // Funciones de selección - siempre agrega, permite duplicados
  const handleTaskSelection = (taskId: string) => {
    const task = tasks?.find(t => t.id === taskId);
    if (task) {
      console.log('➕ Agregando tarea:', taskId);
      setSelectedTasks(prev => [...prev, {
        task_id: taskId,
        quantity: 1,
        phase_instance_id: ''
      }]);
    }
  };

  // Función para eliminar tarea por índice
  const handleRemoveTask = (indexToRemove: number) => {
    console.log('🗑️ Eliminando tarea en índice:', indexToRemove);
    setSelectedTasks(prev => {
      const newTasks = prev.filter((_, i) => i !== indexToRemove);
      console.log('📋 Tareas después de eliminar:', newTasks.length);
      return newTasks;
    });
  };

  const handleSelectAll = () => {
    const newSelections = filteredTasks
      .filter(task => !selectedTasks.some(selected => selected.task_id === task.id))
      .map(task => ({
        task_id: task.id,
        quantity: 1,
        phase_instance_id: ''
      }));
    
    setSelectedTasks(prev => [...prev, ...newSelections]);
  };

  const handleClearAll = () => {
    const filteredIds = new Set(filteredTasks.map(task => task.id));
    setSelectedTasks(prev => prev.filter(selected => !filteredIds.has(selected.task_id)));
  };

  // Efecto para manejar modo edición
  useEffect(() => {
    if (modalData.isEditing && modalData.editingTask) {
      const task = modalData.editingTask;
      
      // Establecer la tarea seleccionada
      setSelectedTasks([{
        task_id: task.task_id || '',
        quantity: task.quantity || 1,
        phase_instance_id: task.phase_instance_id || ''
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
    console.log('🔄 Sincronizando selectedTasks con formulario:', selectedTasks.length);
    setValue('selectedTasks', selectedTasks);
  }, [selectedTasks, setValue]);

  // Función para actualizar tarea seleccionada por índice
  const updateSelectedTask = (index: number, updates: Partial<SelectedTask>) => {
    console.log('✏️ Actualizando tarea en índice:', index, updates);
    setSelectedTasks(prev => {
      const newTasks = prev.map((task, i) => 
        i === index ? { ...task, ...updates } : task
      );
      console.log('📝 Tareas después de actualizar:', newTasks.length);
      return newTasks;
    });
  };

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
          project_phase_id: firstSelected.phase_instance_id || data.project_phase_id,
          project_id: modalData.projectId,
          organization_id: modalData.organizationId
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
            project_phase_id: selectedTask.phase_instance_id || data.project_phase_id
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
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col h-full">
      {/* Layout de dos columnas principales */}
      <div className="flex-1 min-h-0 grid grid-cols-2 gap-6 p-4">
        {/* Columna Izquierda - Filtros y Tareas Disponibles */}
        <div className="flex flex-col space-y-4">
          {/* Filtros inline arriba */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="rubroFilter">Filtrar por Rubro</Label>
              <ComboBox
                value={rubroFilter}
                onValueChange={setRubroFilter}
                options={rubroOptions}
                placeholder="Selecciona un rubro"
                emptyText="No hay rubros disponibles"
              />
            </div>
            
            <div>
              <Label htmlFor="search">Búsqueda</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar por nombre de tarea..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>

          {/* Tareas Disponibles */}
          <div className="flex-1 border rounded-lg">
            <div className="p-3 border-b bg-muted">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Tareas Disponibles</h3>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAll}
                    className="h-6 px-2 text-xs"
                  >
                    Limpiar
                  </Button>
                  <div className="text-xs text-muted-foreground">
                    {filteredTasks.length} tareas
                  </div>
                </div>
              </div>
            </div>
            


            {/* Table Body */}
            <ScrollArea className="h-[400px]">
              <div className="divide-y">
                {filteredTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchQuery ? "No se encontraron tareas" : "No hay tareas disponibles"}
                  </div>
                ) : (
                  filteredTasks.map((task) => {
                    const isInUse = selectedTasks.some(t => t.task_id === task.id);
                    
                    return (
                      <div 
                        key={task.id} 
                        className={`py-3 px-3 hover:bg-muted/30 cursor-pointer transition-colors ${isInUse ? 'bg-accent/10 border-l-4 border-l-accent' : ''}`}
                        onClick={() => handleTaskSelection(task.id)}
                      >
                        <div className="text-sm leading-tight">
                          {task.display_name || 'Sin nombre'}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          <span className="font-bold">{task.rubro_name || 'Sin rubro'}</span> - {task.category_name || 'Sin categoría'}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Columna Derecha - Tareas Seleccionadas */}
        <div className="flex flex-col">
          <div className="border rounded-lg flex-1">
            <div className="p-3 border-b bg-muted">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Tareas Seleccionadas</h3>
                <Badge variant="secondary">
                  {selectedTasks.length} tarea{selectedTasks.length !== 1 ? 's' : ''}
                </Badge>
              </div>
            </div>
            
            {/* Selected Tasks Header */}
            <div className="grid gap-2 py-2 px-3 bg-muted/50 font-medium text-xs border-b" style={{gridTemplateColumns: "auto 1fr auto auto"}}>
              <div className="text-xs font-medium w-20">FASE</div>
              <div className="text-xs font-medium">TAREA</div>
              <div className="text-xs font-medium w-20">CANTIDAD</div>
              <div className="text-xs font-medium w-8"></div>
            </div>

            {/* Selected Tasks Body */}
            <ScrollArea className="h-[400px]">
              <div className="divide-y">
                {selectedTasks.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="text-lg mb-2">No hay tareas seleccionadas</div>
                    <div className="text-sm">Selecciona tareas de la columna izquierda</div>
                  </div>
                ) : (
                  selectedTasks.map((selectedTask, index) => {
                    const task = tasks?.find(t => t.id === selectedTask.task_id);
                    if (!task) return null;
                    
                    return (
                      <div key={`${selectedTask.task_id}-${index}`} className="grid gap-2 py-3 px-3" style={{gridTemplateColumns: "auto 1fr auto auto"}}>
                        {/* Fase Select */}
                        <div className="w-20">
                          <Select 
                            value={selectedTask.phase_instance_id || ''} 
                            onValueChange={(value) => {
                              updateSelectedTask(index, { phase_instance_id: value });
                            }}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Fase" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Sin fase</SelectItem>
                              {projectPhases.map(phase => (
                                <SelectItem key={phase.id} value={phase.id}>
                                  {phase.phase?.name || 'Sin nombre'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Task Name */}
                        <div>
                          <div className="text-sm leading-tight">
                            {task.display_name || 'Sin nombre'}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            <span className="font-bold">{task.rubro_name || 'Sin rubro'}</span> - {task.category_name || 'Sin categoría'}
                          </div>
                        </div>

                        {/* Cantidad Input */}
                        <div className="w-20">
                          <Input
                            type="number"
                            value={selectedTask.quantity}
                            onChange={(e) => {
                              const newQuantity = parseFloat(e.target.value) || 0;
                              updateSelectedTask(index, { quantity: newQuantity });
                            }}
                            className="h-8 text-xs"
                            min="0"
                            step="0.01"
                          />
                        </div>

                        {/* Delete Button */}
                        <div className="w-8">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleRemoveTask(index)}
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
      </div>
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
      rightLoading={isSubmitting}
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
      className="max-w-[1440px] w-[1440px] p-0"
      isEditing={true}
    />
  );
}