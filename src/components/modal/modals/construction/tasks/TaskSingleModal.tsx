import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Calendar } from "lucide-react";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCreateConstructionTask, useUpdateConstructionTask } from "@/hooks/use-construction-tasks";
import { useConstructionProjectPhases } from "@/hooks/use-construction-phases";
import { toast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FormModalLayout } from "@/components/modal/form/FormModalLayout";
import { FormModalHeader } from "@/components/modal/form/FormModalHeader";
import { FormModalFooter } from "@/components/modal/form/FormModalFooter";

const singleTaskSchema = z.object({
  task_id: z.string().min(1, "Debe seleccionar una tarea"),
  quantity: z.number().min(0.01, "La cantidad debe ser mayor a 0"),
  project_phase_id: z.string().optional()
});

type SingleTaskFormData = z.infer<typeof singleTaskSchema>;

interface TaskSingleModalProps {
  modalData: {
    projectId: string;
    organizationId: string;
    userId?: string;
    editingTask?: any;
    isEditing?: boolean;
  };
  onClose: () => void;
}

export function TaskSingleModal({ 
  modalData, 
  onClose 
}: TaskSingleModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [rubroFilter, setRubroFilter] = useState<string>('todos');
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [selectedTaskUnit, setSelectedTaskUnit] = useState<string>('');
  
  const { data: userData } = useCurrentUser();
  const createTask = useCreateConstructionTask();
  const updateTask = useUpdateConstructionTask();
  
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

  // Hook para cargar TODAS las tareas de la librería parametrica usando TASKS_VIEW
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ['task-library'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized');
      
      // Usar TASKS_VIEW que incluye los campos division y unit ya resueltos
      const { data: allTasks, error } = await supabase
        .from('tasks_view')
        .select('*')
        .order('custom_name', { ascending: true });
      
      if (error) {
        console.error('❌ Error cargando librería de tareas:', error);
        throw error;
      }
      
      console.log('📋 Loaded tasks from TASKS_VIEW:', allTasks?.length, 'tasks');
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

  // Obtener divisiones únicas para el filtro (usando division de la vista)
  const uniqueRubros = useMemo(() => {
    if (!tasks || tasks.length === 0) return [];
    
    const rubros = tasks
      .filter(task => task.division && task.division.trim())
      .map(task => task.division)
      .filter((rubro, index, self) => self.indexOf(rubro) === index)
      .sort();
    
    console.log('🏗️ Unique rubros found:', rubros);
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
    </div>
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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