import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Settings, Search, Plus, ArrowLeft } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCreateConstructionTask, useUpdateConstructionTask } from "@/hooks/use-construction-tasks";
import { useConstructionProjectPhases } from "@/hooks/use-construction-phases";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

// Tipos para el subform
interface ParameterSelection {
  parameterSlug: string;
  optionId: string;
  optionName: string;
}

interface TaskData {
  selections: ParameterSelection[];
  preview: string;
  paramValues: Record<string, string>;
  paramOrder: string[];
  availableParameters: any[];
}

const singleTaskSchema = z.object({
  task_id: z.string().min(1, "Debe seleccionar una tarea"),
  quantity: z.number().min(0.01, "La cantidad debe ser mayor a 0"),
  project_phase_id: z.string().optional()
});

type SingleTaskFormData = z.infer<typeof singleTaskSchema>;

interface ConstructionSingleTaskModalProps {
  modalData: {
    projectId: string;
    organizationId: string;
    userId?: string;
    editingTask?: any;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function ConstructionSingleTaskModal({ 
  modalData, 
  onClose 
}: ConstructionSingleTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [rubroFilter, setRubroFilter] = useState<string>('todos');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [selectedTaskUnit, setSelectedTaskUnit] = useState<string>('');
  
  // Estados para el subform de crear tarea personalizada
  const [showParametricTaskCreator, setShowParametricTaskCreator] = useState(false);
  const [parametricSelections, setParametricSelections] = useState<ParameterSelection[]>([]);
  const [parametricTaskPreview, setParametricTaskPreview] = useState<string>('');
  const [parametricParameterOrder, setParametricParameterOrder] = useState<string[]>([]);
  const [isCreatingParametricTask, setIsCreatingParametricTask] = useState(false);
  
  // Estados para el formulario de tarea personalizada
  const [taskNameText, setTaskNameText] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [isCreatingCustomTask, setIsCreatingCustomTask] = useState(false);
  
  // Referencia al ParametricTaskBuilder
  const parametricTaskBuilderRef = useRef<{ executeCreateTaskCallback: () => void }>(null);
  
  const { data: userData } = useCurrentUser();
  const createTask = useCreateConstructionTask();
  const updateTask = useUpdateConstructionTask();
  const queryClient = useQueryClient();
  
  const isEditing = modalData.isEditing && modalData.editingTask;

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
      
      return data;
    },
    enabled: !!userData?.user?.id && !!modalData.organizationId
  });

  // Hook para cargar TODAS las tareas de la librería parametrica
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['task-parametric-library'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      const { data: allTasks, error } = await supabase
        .from('task_view')
        .select('*')
        .order('name_rendered', { ascending: true });
      
      if (error) {
        console.error('❌ Error cargando librería de tareas:', error);
        throw error;
      }
      

      
      return allTasks || [];
    },
    enabled: !!supabase
  });

  // Hook para obtener las fases del proyecto
  const { data: projectPhases = [], isLoading: isLoadingProjectPhases } = useConstructionProjectPhases(modalData.projectId);

  // Configurar el formulario
  const form = useForm<SingleTaskFormData>({
    resolver: zodResolver(singleTaskSchema),
    defaultValues: {
      task_id: '',
      quantity: 1,
      project_phase_id: ''
    }
  });

  // Si estamos editando, configurar los valores iniciales
  useEffect(() => {
    if (isEditing && modalData.editingTask) {
      console.log('Loading task for editing:', modalData.editingTask);
      
      setSelectedTaskId(modalData.editingTask.task_id || '');
      
      form.reset({
        task_id: modalData.editingTask.task_id || '',
        quantity: modalData.editingTask.quantity || 1,
        project_phase_id: modalData.editingTask.phase_instance_id || ''
      });
    }
  }, [isEditing, modalData.editingTask, form]);

  // Obtener categorías únicas para el filtro
  const uniqueRubros = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    
    const rubros = tasks
      .filter(task => task.element_category_name)
      .map(task => task.element_category_name)
      .filter((rubro, index, self) => self.indexOf(rubro) === index)
      .sort();
    
    return rubros;
  }, [tasks]);

  // Filtrar tareas según búsqueda y filtros
  const filteredTasks = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    
    let filtered = tasks;
    
    // Filtro por búsqueda de texto
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.name_rendered?.toLowerCase().includes(searchLower) ||
        task.code?.toLowerCase().includes(searchLower) ||
        task.element_category_name?.toLowerCase().includes(searchLower)
      );
    }
    
    // Filtro por rubro
    if (rubroFilter && rubroFilter.trim() && rubroFilter !== 'todos') {
      filtered = filtered.filter(task => task.element_category_name === rubroFilter);
    }
    
    return filtered;
  }, [tasks, searchQuery, rubroFilter]);

  // Función para manejar la selección de tarea
  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
    form.setValue('task_id', taskId);
    
    // Encontrar la tarea seleccionada para obtener su unidad
    const selectedTask = tasks.find(task => task.id === taskId);
    if (selectedTask?.unit_name) {
      // Actualizar el placeholder del campo cantidad para mostrar la unidad
      setSelectedTaskUnit(selectedTask.unit_name);
    }
  };

  // Función para enviar el formulario
  const onSubmit = async (data: SingleTaskFormData) => {
    if (!organizationMember?.id) {
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
        await updateTask.mutateAsync({
          id: modalData.editingTask.id,
          quantity: data.quantity,
          project_id: modalData.projectId,
          organization_id: modalData.organizationId,
          project_phase_id: data.project_phase_id
        });
      } else {
        // Modo creación
        await createTask.mutateAsync({
          organization_id: modalData.organizationId,
          project_id: modalData.projectId,
          task_id: data.task_id,
          quantity: data.quantity,
          created_by: organizationMember.id,
          project_phase_id: data.project_phase_id
        });
      }
      
      onClose();
    } catch (error) {
      console.error('❌ Error al procesar tarea:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewPanel = isEditing && modalData.editingTask ? (
    <>
      <div>
        <h4 className="font-medium">Tarea</h4>
        <p className="text-muted-foreground mt-1">
          {modalData.editingTask.task?.display_name || modalData.editingTask.task_code || 'Sin tarea'}
        </p>
      </div>
      
      <div>
        <h4 className="font-medium">Código</h4>
        <p className="text-muted-foreground mt-1">
          {modalData.editingTask.task_code || 'Sin código'}
        </p>
      </div>

      <div>
        <h4 className="font-medium">Cantidad</h4>
        <p className="text-muted-foreground mt-1">
          {modalData.editingTask.quantity || 0}
        </p>
      </div>

      <div>
        <h4 className="font-medium">Fase</h4>
        <p className="text-muted-foreground mt-1">
          {modalData.editingTask.phase_name || 'Sin fase'}
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
    </>
  ) : null;

  const editPanel = (
    <div className="space-y-4">
      {/* Filtros de búsqueda - Orden solicitado: Filtrar por Rubro - Búsqueda de Texto */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
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
        
        <div className="space-y-2">
          <label className="text-xs font-medium leading-none text-muted-foreground">
            Búsqueda de Texto
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tarea..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
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
                      {task.name_rendered || task.code || 'Sin nombre'}
                    </p>
                    {task.element_category_name && (
                      <p className="text-xs text-muted-foreground">
                        {task.element_category_name}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 pt-0.5">
                    {task.unit_name && (
                      <span className="text-xs font-medium text-muted-foreground bg-muted/40 px-2 py-1 rounded">
                        {task.unit_name}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Fase del Proyecto
          </label>
          <Select 
            value={form.watch('project_phase_id') || ''} 
            onValueChange={(value) => form.setValue('project_phase_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Seleccionar fase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">Sin fase</SelectItem>
              {projectPhases.map((phase) => (
                <SelectItem key={phase.project_phase_id} value={phase.project_phase_id}>
                  {phase.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            Cantidad *
          </label>
          <div className="relative">
            <Input
              type="number"
              step="0.01"
              min="0.01"
              placeholder={selectedTaskUnit ? `1 ${selectedTaskUnit}` : "1"}
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
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">
              {isEditing ? "Editar Tarea de Construcción" : "Agregar Tarea"}
            </h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {viewPanel}
          {editPanel}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t bg-muted/50">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={form.handleSubmit(onSubmit)}
            disabled={!selectedTaskId || isSubmitting}
            className="min-w-[120px]"
          >
            {isSubmitting ? "..." : (isEditing ? "Guardar Cambios" : "Agregar Tarea")}
          </Button>
        </div>
      </div>
    </div>
  );
}