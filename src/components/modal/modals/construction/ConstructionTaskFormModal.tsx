import React, { useState, useMemo } from 'react';
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
import { Settings, Search, CheckSquare, Square, Filter, X, LayoutGrid, Plus } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCreateConstructionTask, useUpdateConstructionTask } from "@/hooks/use-construction-tasks";
import { useProjectPhases } from "@/hooks/use-construction-phases";

import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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

  const [groupingType, setGroupingType] = useState('none');
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

  // Query para obtener tareas de la biblioteca
  const { data: tasks, isLoading: isLoadingTasks } = useQuery({
    queryKey: ['task-library', modalData.organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_parametric_view')
        .select('*')
        .order('category_name', { ascending: true });
      
      if (error) {
        console.error('Error loading task library:', error);
        throw error;
      }
      
      console.log('🔍 MODAL - Tasks loaded:', data?.length, 'tasks');
      console.log('🔍 MODAL - Sample task:', data?.[0]);
      
      return data || [];
    }
  });

  // Crear mutación para agregar tareas
  const createTaskMutation = useCreateConstructionTask();

  // Filtrar tareas basado en búsqueda y filtros
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    
    return tasks.filter(task => {
      const matchesSearch = !searchQuery || 
        task.name_rendered?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.category_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRubro = !rubroFilter || task.category_name === rubroFilter;
      
      return matchesSearch && matchesRubro;
    });
  }, [tasks, searchQuery, rubroFilter]);

  // Obtener categorías únicas para el filtro
  const uniqueRubros = useMemo(() => {
    if (!tasks) return [];
    const rubros = [...new Set(tasks.map(task => task.category_name).filter(Boolean))];
    return rubros;
  }, [tasks]);

  // Manejar selección de tarea
  const handleTaskSelect = (taskId: string) => {
    const isSelected = selectedTasks.some(st => st.task_id === taskId);
    
    if (isSelected) {
      setSelectedTasks(prev => prev.filter(st => st.task_id !== taskId));
    } else {
      setSelectedTasks(prev => [...prev, { task_id: taskId, quantity: 1 }]);
    }
  };

  // Actualizar cantidad de tarea seleccionada
  const handleQuantityChange = (taskId: string, quantity: number) => {
    setSelectedTasks(prev => 
      prev.map(st => 
        st.task_id === taskId ? { ...st, quantity } : st
      )
    );
  };

  // Función para enviar el formulario
  const onSubmit = async (data: AddTaskFormData) => {
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
      for (const selectedTask of selectedTasks) {
        const taskData = {
          project_id: modalData.projectId,
          task_id: selectedTask.task_id,
          quantity: selectedTask.quantity,
          project_phase_id: data.project_phase_id,
          organization_id: modalData.organizationId,
          created_by: currentMember?.member_id || userData?.id || ''
        };
        
        await createTaskMutation.mutateAsync(taskData);
      }
      
      toast({
        title: "Tareas agregadas exitosamente",
        description: `Se agregaron ${selectedTasks.length} tarea(s) al proyecto`
      });
      
      onClose();
    } catch (error) {
      console.error('Error adding tasks:', error);
      toast({
        title: "Error al agregar tareas",
        description: "Hubo un problema al agregar las tareas. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setRubroFilter('');
  };

  // Configuración del header del modal
  const headerContent = {
    icon: <Settings className="w-5 h-5" />,
    title: "Agregar Tareas al Proyecto",
    description: "Selecciona las tareas que deseas agregar al proyecto y especifica las cantidades."
  };

  // Configuración del footer del modal  
  const footerContent = {
    cancelAction: {
      label: "Cancelar",
      onClick: onClose
    },
    submitAction: {
      label: "Agregar Tareas",
      onClick: handleSubmit(onSubmit),
      loading: isSubmitting,
      disabled: selectedTasks.length === 0
    }
  };

  return (
    <FormModalLayout>
      <FormModalHeader headerContent={headerContent} />
      
      <div className="space-y-6">
        {/* Selección de fase del proyecto */}
        <div className="space-y-2">
          <Label htmlFor="project_phase_id">Fase del Proyecto *</Label>
          <Select onValueChange={(value) => form.setValue('project_phase_id', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una fase del proyecto" />
            </SelectTrigger>
            <SelectContent>
              {projectPhases.map((phase) => (
                <SelectItem key={phase.id} value={phase.id}>
                  {phase.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Filtros y búsqueda */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tareas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={rubroFilter} onValueChange={setRubroFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por rubro" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos los rubros</SelectItem>
                {uniqueRubros.map((rubro) => (
                  <SelectItem key={rubro} value={rubro}>
                    {rubro}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {(searchQuery || rubroFilter) && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-2" />
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* Lista de tareas */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">
              Tareas Disponibles ({filteredTasks.length})
            </Label>
            {selectedTasks.length > 0 && (
              <Badge variant="secondary">
                {selectedTasks.length} seleccionada(s)
              </Badge>
            )}
          </div>
          
          <ScrollArea className="h-96 border rounded-lg">
            <div className="p-4 space-y-3">
              {isLoadingTasks ? (
                <div className="text-center text-muted-foreground">
                  Cargando tareas...
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="text-center text-muted-foreground">
                  No se encontraron tareas
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const isSelected = selectedTasks.some(st => st.task_id === task.id);
                  const selectedTask = selectedTasks.find(st => st.task_id === task.id);
                  
                  return (
                    <div
                      key={task.id}
                      className={cn(
                        "p-3 border rounded-lg cursor-pointer transition-colors",
                        isSelected 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50"
                      )}
                      onClick={() => handleTaskSelect(task.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-primary mt-0.5" />
                          ) : (
                            <Square className="w-5 h-5 text-muted-foreground mt-0.5" />
                          )}
                          
                          <div className="flex-1 space-y-1">
                            <div className="font-medium">{task.name_rendered}</div>
                            <div className="text-sm text-muted-foreground">
                              {task.category_name} • {task.unit_name}
                            </div>
                          </div>
                        </div>
                        
                        {isSelected && (
                          <div className="flex items-center gap-2 ml-2">
                            <Label className="text-sm">Cantidad:</Label>
                            <Input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={selectedTask?.quantity || 1}
                              onChange={(e) => handleQuantityChange(task.id, parseFloat(e.target.value) || 1)}
                              className="w-20 h-8"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
      
      <FormModalFooter footerContent={footerContent} />
    </FormModalLayout>
  );
}