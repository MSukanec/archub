import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { Settings, Search, X, CheckSquare, Square } from 'lucide-react';

import { FormModalLayout } from '@/components/modal/form/FormModalLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useProjectPhases } from '@/hooks/use-construction-phases';
import { useCreateConstructionTask } from '@/hooks/use-construction-tasks';
import { supabase } from '@/lib/supabase';

const addTaskSchema = z.object({
  project_phase_id: z.string().min(1, 'Selecciona una fase'),
  selectedTasks: z.array(z.object({
    task_id: z.string(),
    quantity: z.number().min(0.01)
  })).min(1, 'Selecciona al menos una tarea')
});

type AddTaskFormData = z.infer<typeof addTaskSchema>;

interface SelectedTask {
  task_id: string;
  quantity: number;
}

interface ConstructionTaskFormModalProps {
  modalData: {
    projectId: string;
  };
  onClose: () => void;
}

export function ConstructionTaskFormModal({ modalData, onClose }: ConstructionTaskFormModalProps) {
  const [selectedTasks, setSelectedTasks] = useState<SelectedTask[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [rubroFilter, setRubroFilter] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: userData } = useCurrentUser();
  const { data: projectPhases = [] } = useProjectPhases(modalData.projectId);
  
  // Hook para el formulario
  const form = useForm<AddTaskFormData>({
    resolver: zodResolver(addTaskSchema),
    defaultValues: {
      project_phase_id: '',
      selectedTasks: []
    }
  });

  const { handleSubmit } = form;

  // Query para obtener tareas paramétricas de la biblioteca
  const { data: tasks, isLoading: isLoadingTasks, error: tasksError } = useQuery({
    queryKey: ['parametric-tasks-library'],
    queryFn: async () => {
      console.log('🔍 Fetching parametric tasks from library...');
      const { data, error } = await supabase
        .from('task_parametric')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('❌ Error fetching parametric tasks:', error);
        throw error;
      }
      
      console.log('✅ Parametric tasks fetched:', data?.length || 0, 'tasks');

      if (!data || data.length === 0) {
        console.warn('⚠️ No parametric tasks found in database');
        return [];
      }

      // Generar nombres descriptivos para cada tarea
      const tasksWithNames = await Promise.all((data || []).map(async (task: any) => {
        try {
          let displayName = task.name_rendered;
          
          if (!displayName && task.param_values) {
            const paramValues = typeof task.param_values === 'string' 
              ? JSON.parse(task.param_values) 
              : task.param_values;
            
            if (Object.keys(paramValues).length > 0) {
              const { data: paramOptions } = await supabase
                .from('task_parameter_options')
                .select('id, label')
                .in('id', Object.values(paramValues));
              
              if (paramOptions && paramOptions.length > 0) {
                const optionLabels = paramOptions.map(opt => opt.label).join(' ');
                displayName = `${optionLabels}`;
              }
            }
          }
          
          if (!displayName) {
            displayName = `Tarea ${task.code || 'sin código'}`;
          }
          
          return { 
            ...task, 
            display_name: displayName,
            task_name: displayName,
            unit_symbol: 'm²', // Default hasta que tengamos unidades
            rubro_name: 'Mampostería' // Default hasta que tengamos rubros
          };
        } catch (error) {
          console.error('Error generating task name:', error);
          return { 
            ...task, 
            display_name: `Tarea ${task.code || 'sin código'}`,
            task_name: `Tarea ${task.code || 'sin código'}`,
            unit_symbol: 'm²',
            rubro_name: 'General'
          };
        }
      }));

      console.log('📋 Tasks with names generated:', tasksWithNames.length, 'tasks');
      console.log('📋 Sample task:', tasksWithNames[0]);
      return tasksWithNames;
    }
  });

  // Debug: mostrar errores y estado de carga
  if (tasksError) {
    console.error('🚨 Tasks error:', tasksError);
  }
  
  console.log('📊 Modal render state:', {
    isLoadingTasks,
    tasksCount: tasks?.length || 0,
    projectPhasesCount: projectPhases.length,
    hasError: !!tasksError
  });

  // Crear mutación para agregar tareas
  const createTaskMutation = useCreateConstructionTask();

  // Filtrar tareas basado en búsqueda y filtros
  const filteredTasks = useMemo(() => {
    if (!tasks) return [];
    
    return tasks.filter(task => {
      const matchesSearch = !searchQuery || 
        task.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.task_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.rubro_name?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesRubro = !rubroFilter ||
        task.rubro_name?.toLowerCase().includes(rubroFilter.toLowerCase());
      
      return matchesSearch && matchesRubro;
    });
  }, [tasks, searchQuery, rubroFilter]);

  // Por ahora rubros simplificados hasta que tengamos datos reales
  const uniqueRubros = ['Mampostería', 'Estructura', 'General'];

  // Manejar selección de tarea
  const handleTaskSelect = (taskId: string) => {
    const isSelected = selectedTasks.some(st => st.task_id === taskId);
    
    if (isSelected) {
      // Deseleccionar tarea
      setSelectedTasks(prev => prev.filter(st => st.task_id !== taskId));
    } else {
      // Seleccionar tarea
      setSelectedTasks(prev => [...prev, { task_id: taskId, quantity: 1 }]);
    }
  };

  // Manejar cambio de cantidad
  const handleQuantityChange = (taskId: string, quantity: number) => {
    setSelectedTasks(prev => prev.map(st => 
      st.task_id === taskId ? { ...st, quantity } : st
    ));
  };

  // Manejar envío del formulario
  const onSubmit = async (data: AddTaskFormData) => {
    try {
      setIsSubmitting(true);
      
      // Agregar cada tarea seleccionada
      for (const selectedTask of selectedTasks) {
        const task = tasks?.find(t => t.id === selectedTask.task_id);
        if (task) {
          const taskData = {
            project_id: modalData.projectId,
            task_id: task.id,
            quantity: selectedTask.quantity,
            phase_instance_id: data.project_phase_id,
            organization_id: userData?.organization?.id || ''
          };
        
          await createTaskMutation.mutateAsync(taskData);
        }
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

  const viewPanel = (
    <div className="space-y-6">
      <div className="text-center py-8 text-muted-foreground">
        Vista de tareas disponibles
      </div>
    </div>
  );

  const editPanel = (
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
            ) : tasksError ? (
              <div className="text-center text-red-600">
                Error cargando tareas: {tasksError.message}
              </div>
            ) : filteredTasks.length === 0 ? (
              <div className="text-center text-muted-foreground">
                No se encontraron tareas ({tasks?.length || 0} total, {filteredTasks.length} filtradas)
              </div>
            ) : (
              filteredTasks.map((task: any) => {
                const isSelected = selectedTasks.some(st => st.task_id === task.id);
                const selectedTask = selectedTasks.find(st => st.task_id === task.id);

                return (
                  <div
                    key={task.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      isSelected ? 'bg-accent border-accent-foreground' : 'hover:bg-muted'
                    }`}
                    onClick={() => handleTaskSelect(task.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-3 flex-1">
                        {isSelected ? (
                          <CheckSquare className="w-5 h-5 text-primary mt-0.5" />
                        ) : (
                          <Square className="w-5 h-5 text-muted-foreground mt-0.5" />
                        )}
                        
                        <div className="flex-1 space-y-1">
                          <div className="font-medium">{task.task_name}</div>
                          <div className="text-sm text-muted-foreground">
                            {task.rubro_name} • {task.unit_symbol}
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
  );

  return (
    <FormModalLayout 
      isEditing={true}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
    />
  );
}