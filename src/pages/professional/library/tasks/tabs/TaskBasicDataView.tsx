import { Calendar, User, Ruler, Building, FileText, Zap, Hash } from "lucide-react";
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

interface TaskBasicDataViewProps {
  task: any;
  onTabChange?: (tab: string) => void;
}

export function TaskBasicDataView({ 
  task,
  onTabChange 
}: TaskBasicDataViewProps) {
  
  const [taskName, setTaskName] = useState(task.custom_name || task.name_rendered || '');
  const [taskRubro, setTaskRubro] = useState(task.division || task.category || '');
  const [taskUnit, setTaskUnit] = useState(task.unit || '');
  
  // Actualizar estados cuando cambian los datos de la tarea
  useEffect(() => {
    setTaskName(task.custom_name || task.name_rendered || '');
    setTaskRubro(task.division || task.category || '');
    setTaskUnit(task.unit || '');
  }, [task]);
  
  const isSystemTask = task.is_system;
  
  // Auto-save mutation for task data
  const saveTaskMutation = useMutation({
    mutationFn: async (dataToSave: any) => {
      if (!task.id || !supabase || isSystemTask) return;

      // Update task in tasks table
      const { error } = await supabase
        .from('tasks')
        .update({
          custom_name: dataToSave.taskName,
          division: dataToSave.taskRubro,
          unit: dataToSave.taskUnit
        })
        .eq('id', task.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['generated-task', task.id] });
      queryClient.invalidateQueries({ queryKey: ['task-library'] });
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
  
  // Auto-save hook
  const { isSaving } = useDebouncedAutoSave({
    data: {
      taskName,
      taskRubro,
      taskUnit
    },
    saveFn: async (data) => {
      await saveTaskMutation.mutateAsync(data);
      
      toast({
        title: "Cambios guardados",
        description: "Los cambios se han guardado automáticamente"
      });
    },
    delay: 1000,
    enabled: !isSystemTask
  });
  
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
                      {isSystemTask ? 'Sistema' : 'Usuario personalizado'}
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
                  disabled={isSystemTask}
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
                  disabled={isSystemTask}
                  allowCreate={!isSystemTask}
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
                  disabled={isSystemTask}
                  allowCreate={!isSystemTask}
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
            />

            <FormSubsectionButton
              icon={<Building className="h-4 w-4" />}
              title={isSaving ? "Guardando..." : "Auto-guardado activo"}
              description={isSystemTask ? "Tareas del sistema no se pueden editar" : "Los cambios se guardan automáticamente"}
              onClick={() => {}}
              disabled={true}
            />

          </CardContent>
        </Card>
      </div>
    </div>
  );
}