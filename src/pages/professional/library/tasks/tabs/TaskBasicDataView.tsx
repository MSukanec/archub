import { Calendar, User, Ruler, Building, FileText, Zap, Hash, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState, useEffect } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormSubsectionButton } from '@/components/modal/form/FormSubsectionButton';
import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField';
import { useDebouncedAutoSave } from '@/hooks/useDebouncedAutoSave';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useLocation } from 'wouter';

interface TaskBasicDataViewProps {
  task: any;
  onTabChange?: (tab: string) => void;
}

export function TaskBasicDataView({ 
  task,
  onTabChange 
}: TaskBasicDataViewProps) {
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const [, navigate] = useLocation();
  
  const [taskName, setTaskName] = useState(task.custom_name || task.name_rendered || '');
  const [taskRubro, setTaskRubro] = useState(task.division || task.category || '');
  const [taskUnit, setTaskUnit] = useState(task.unit || '');
  
  // Actualizar estados cuando cambian los datos de la tarea
  useEffect(() => {
    setTaskName(task.custom_name || task.name_rendered || '');
  }, [task]);
  
  const isSystemTask = task.is_system;
  
  // Determinar si el usuario puede editar esta tarea
  // ADMIN: puede editar todo (sistema y organización)
  // Usuario normal: solo puede editar tareas de su organización (no sistema)
  const canEdit = userData?.role?.name === 'Administrador' || !isSystemTask;
  
  // Auto-save mutation for task data
  const saveTaskMutation = useMutation({
    mutationFn: async (dataToSave: any) => {
      if (!task.id || !supabase || !canEdit) return;

      // Solo actualizar custom_name por ahora
      // Las otras propiedades (rubro, unidad) se actualizan por separado
      const { error } = await supabase
        .from('tasks')
        .update({
          custom_name: dataToSave.taskName
        })
        .eq('id', task.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-task', task.id] });
      queryClient.invalidateQueries({ queryKey: ['task-library'] });
      toast({
        title: "Cambios guardados",
        description: "Los cambios se han guardado automáticamente"
      });
    },
    onError: (error: any) => {
      console.error('Error saving task data:', error);
      toast({
        title: "Error al guardar",
        description: "No se pudieron guardar los cambios de la tarea",
        variant: "destructive"
      });
    }
  });
  
  // Auto-save hook solo para el nombre
  const { isSaving } = useDebouncedAutoSave({
    data: {
      taskName
    },
    saveFn: async (data) => {
      await saveTaskMutation.mutateAsync(data);
    },
    delay: 1000,
    enabled: canEdit
  });

  // Función para eliminar tarea
  const handleDeleteTask = () => {
    const taskName = task.custom_name || task.name_rendered || 'esta tarea';
    
    openModal('delete-confirmation', {
      mode: 'dangerous',
      title: "Eliminar tarea",
      description: `¿Estás seguro que querés eliminar "${taskName}"? Esta acción no se puede deshacer.`,
      itemName: taskName,
      itemType: "tarea",
      destructiveActionText: "Eliminar tarea",
      onConfirm: async () => {
        try {
          if (!supabase) throw new Error('Supabase not initialized');
          
          const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', task.id);
          
          if (error) throw error;
          
          toast({
            title: "Tarea eliminada",
            description: "La tarea se ha eliminado correctamente"
          });
          
          // Invalidar queries y navegar de vuelta
          queryClient.invalidateQueries({ queryKey: ['task-library'] });
          queryClient.invalidateQueries({ queryKey: ['generated-tasks'] });
          
          // Determinar dónde navegar según el origen
          const isFromAdmin = typeof window !== 'undefined' && 
            (document.referrer.includes('/admin/tasks') || 
             localStorage.getItem('taskViewSource') === 'admin');
          localStorage.removeItem('taskViewSource');
          navigate(isFromAdmin ? '/admin/tasks' : '/library/tasks');
          
        } catch (error: any) {
          console.error('Error deleting task:', error);
          toast({
            title: "Error",
            description: error.message || "Error al eliminar la tarea",
            variant: "destructive"
          });
        }
      }
    });
  };
  
  // Cargar opciones dinámicamente desde la base de datos
  const { data: divisions = [] } = useQuery({
    queryKey: ['task-divisions'],
    queryFn: async () => {
      if (!supabase) return [];
      
      const { data, error } = await supabase
        .from('task_divisions')
        .select('name')
        .order('name');
      
      if (error) {
        console.error('Error loading divisions:', error);
        return [];
      }
      
      return data?.map(d => ({ value: d.name, label: d.name })) || [];
    }
  });
  
  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      if (!supabase) return [];
      
      const { data, error } = await supabase
        .from('units')
        .select('name')
        .order('name');
      
      if (error) {
        console.error('Error loading units:', error);
        return [];
      }
      
      return data?.map(u => ({ value: u.name, label: u.name })) || [];
    }
  });

  // Actualizar rubro cuando cambien los datos de la tarea o las divisiones estén cargadas
  useEffect(() => {
    if (divisions.length > 0) {
      const rubroValue = task.division || task.category || '';
      setTaskRubro(rubroValue);
    }
  }, [task.division, task.category, divisions.length]);

  // Actualizar unidad cuando cambien los datos de la tarea o las unidades estén cargadas
  useEffect(() => {
    if (units.length > 0) {
      const unitValue = task.unit || '';
      setTaskUnit(unitValue);
    }
  }, [task.unit, units.length]);

  return (
    <div className="space-y-6">
      {/* Cards principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card izquierda - Ficha de la Tarea */}
        <Card className="h-full flex flex-col">
          <CardHeader 
            icon={FileText}
            title="Ficha de la Tarea"
            description="Información general y detalles de la tarea"
          />
          <CardContent className="flex-1 space-y-4 pt-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Creador y Fecha de Creación - Inline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Creador</p>
                    <p className="text-sm text-muted-foreground">
                      {isSystemTask ? 'Sistema' : (userData?.organization?.name || 'Organización')}
                    </p>
                  </div>
                </div>
                
                {task.created_at && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Fecha de Creación</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(task.created_at), 'dd/MM/yyyy', { locale: es })}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Nombre de la Tarea - Textarea */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre de la Tarea</label>
                <Textarea
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  placeholder="Nombre de la tarea"
                  disabled={!canEdit}
                  className="min-h-[80px] resize-none"
                />
              </div>

              {/* Rubro - Editable con ComboBox */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Rubro</label>
                <ComboBox
                  value={taskRubro}
                  onValueChange={setTaskRubro}
                  options={divisions}
                  placeholder="Seleccionar rubro"
                  disabled={!canEdit}
                  allowCreate={canEdit}
                />
              </div>

              {/* Unidad de Cómputo - Editable con ComboBox */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Unidad de Cómputo</label>
                <ComboBox
                  value={taskUnit}
                  onValueChange={setTaskUnit}
                  options={units}
                  placeholder="Seleccionar unidad"
                  disabled={!canEdit}
                  allowCreate={canEdit}
                />
              </div>


              {/* Descripción - Si existe */}
              {task.description && (
                <div className="p-3 rounded-lg bg-muted/30">
                  <p className="text-sm font-medium mb-2">Descripción</p>
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card derecha - Acciones rápidas */}
        <Card className="h-full flex flex-col">
          <CardHeader 
            icon={Zap}
            title="Acciones Rápidas"
            description="Accesos directos para gestionar la tarea"
          />
          <CardContent className="flex-1 space-y-3 pt-4">
            <FormSubsectionButton
              icon={<FileText className="h-4 w-4" />}
              title="Ver costos"
              description="Materiales y mano de obra asociada"
              onClick={() => onTabChange?.('Costos')}
              variant="default"
              showPlusIcon={false}
            />

            <FormSubsectionButton
              icon={<Trash2 className="h-4 w-4" />}
              title="Eliminar tarea"
              description="Eliminar permanentemente esta tarea"
              onClick={handleDeleteTask}
              variant="destructive"
              showPlusIcon={false}
              disabled={!canEdit}
            />

          </CardContent>
        </Card>
      </div>
    </div>
  );
}