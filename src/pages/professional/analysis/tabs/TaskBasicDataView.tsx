import { Calendar, User, Ruler, Building, FileText, Zap, Hash, Trash2, Calculator } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useState, useEffect } from "react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormSubsectionButton } from '@/components/modal/form/FormSubsectionButton';
import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField';
import { useDebouncedAutoSave } from '@/components/save';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { queryClient } from '@/lib/queryClient';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useGlobalModalStore } from '@/components/modal/form/useGlobalModalStore';
import { useLocation } from 'wouter';
import { useTaskMaterials } from '@/hooks/use-generated-tasks';
import { useTaskLabor } from '@/hooks/use-task-labor';

interface TaskBasicDataViewProps {
  task: any;
  onTabChange?: (tab: string) => void;
}

// Componente inline para mostrar resumen de costos
function CostSummaryCard({ task, onTabChange, canEdit, handleDeleteTask }: { 
  task: any; 
  onTabChange?: (tab: string) => void; 
  canEdit: boolean;
  handleDeleteTask: () => void;
}) {
  // Usar task.task_id o task.id según esté disponible
  const taskId = task.task_id || task.id;
  
  const { data: materials = [], isLoading: materialsLoading } = useTaskMaterials(taskId);
  const { data: labor = [], isLoading: laborLoading } = useTaskLabor(taskId);

  const isLoading = materialsLoading || laborLoading;

  // Calcular total de materiales por unidad (misma lógica que TaskCostPopover)
  const materialsTotalPerUnit = materials.reduce((sum, material) => {
    const materialView = Array.isArray(material.materials_view) ? material.materials_view[0] : material.materials_view;
    const unitPrice = materialView?.avg_price || 0;
    const quantity = material.amount || 0;
    return sum + (quantity * unitPrice);
  }, 0);

  // Calcular total de mano de obra por unidad (misma lógica que TaskCostPopover)
  const laborTotalPerUnit = labor.reduce((sum, laborItem) => {
    const laborView = laborItem.labor_view;
    const unitPrice = laborView?.avg_price || 0;
    const quantity = laborItem.quantity || 0;
    return sum + (quantity * unitPrice);
  }, 0);

  const totalPerUnit = materialsTotalPerUnit + laborTotalPerUnit;

  // Formatear moneda estilo argentino
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const hasCosts = materials.length > 0 || labor.length > 0;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader 
        icon={Calculator}
        title="Costos"
        description="Información de costos por unidad"
      />
      <CardContent className="flex-1 space-y-4 pt-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-6">
            <p className="text-sm text-muted-foreground">Cargando costos...</p>
          </div>
        ) : !hasCosts ? (
          <div className="flex items-center justify-center py-6">
            <p className="text-sm text-muted-foreground">No hay costos definidos para esta tarea</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Sección de totales */}
            <div className="grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="text-sm font-medium">Materiales</p>
                  <p className="text-xs text-muted-foreground">{materials.length} items</p>
                </div>
                <p className="text-sm font-semibold">{formatCurrency(materialsTotalPerUnit)}</p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div>
                  <p className="text-sm font-medium">Mano de Obra</p>
                  <p className="text-xs text-muted-foreground">{labor.length} items</p>
                </div>
                <p className="text-sm font-semibold">{formatCurrency(laborTotalPerUnit)}</p>
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div>
                  <p className="text-sm font-semibold">Total por unidad</p>
                  <p className="text-xs text-muted-foreground">Costo total</p>
                </div>
                <p className="text-sm font-bold text-primary">{formatCurrency(totalPerUnit)}</p>
              </div>
            </div>

            {/* Botón Ver detalle */}
            <FormSubsectionButton
              icon={<FileText className="h-4 w-4" />}
              title="Ver detalle"
              description="Ver descomposición completa de costos"
              onClick={() => onTabChange?.('Costos')}
              variant="default"
              showPlusIcon={false}
              data-testid="button-ver-detalle-costos"
            />
          </div>
        )}

        {/* Botón Eliminar tarea al final */}
        <div className="mt-6 pt-3 border-t">
          <FormSubsectionButton
            icon={<Trash2 className="h-4 w-4" />}
            title="Eliminar tarea"
            description="Eliminar permanentemente esta tarea"
            onClick={handleDeleteTask}
            variant="destructive"
            showPlusIcon={false}
            disabled={!canEdit}
            data-testid="button-eliminar-tarea"
          />
        </div>
      </CardContent>
    </Card>
  );
}

export function TaskBasicDataView({ 
  task,
  onTabChange 
}: TaskBasicDataViewProps) {
  const { data: userData } = useCurrentUser();
  const { openModal } = useGlobalModalStore();
  const [, navigate] = useLocation();
  
  const [taskName, setTaskName] = useState(task.custom_name || task.name_rendered || '');
  const [taskRubro, setTaskRubro] = useState(task.division || '');
  const [taskUnit, setTaskUnit] = useState(task.unit || '');
  
  // Actualizar estados cuando cambian los datos de la tarea
  useEffect(() => {
    setTaskName(task.custom_name || task.name_rendered || '');
    setTaskRubro(task.division || '');
    setTaskUnit(task.unit || '');
  }, [task]);
  
  const isSystemTask = task.is_system;
  
  // Determinar si el usuario puede editar esta tarea
  // ADMIN: puede editar todo (sistema y organización)
  // Usuario normal: solo puede editar tareas de su organización (no sistema)
  const canEdit = userData?.role?.name === 'Administrador' || !isSystemTask;
  
  // Auto-save mutation for task name
  const saveTaskMutation = useMutation({
    mutationFn: async (dataToSave: any) => {
      if (!task.id || !supabase || !canEdit) return;

      const { error } = await supabase
        .from('tasks')
        .update({
          custom_name: dataToSave.taskName
        })
        .eq('id', task.id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidar TODAS las queries relacionadas para sincronización completa
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-view'] });
      queryClient.invalidateQueries({ queryKey: ['generated-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-library'] });
      queryClient.invalidateQueries({ queryKey: ['generated-task', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks-view', task.id] });
      queryClient.invalidateQueries({ queryKey: ['parameters-with-options'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['all-task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['parameter-dependencies-flow'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-dependencies'] });
      
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

  // Auto-save mutation for task division/rubro
  const saveTaskRubroMutation = useMutation({
    mutationFn: async (division: string) => {
      if (!task.id || !supabase || !canEdit) return;

      const { error } = await supabase
        .from('tasks')
        .update({
          division: division
        })
        .eq('id', task.id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidar TODAS las queries relacionadas para sincronización completa
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-view'] });
      queryClient.invalidateQueries({ queryKey: ['generated-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-library'] });
      queryClient.invalidateQueries({ queryKey: ['generated-task', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks-view', task.id] });
      queryClient.invalidateQueries({ queryKey: ['parameters-with-options'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['all-task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['parameter-dependencies-flow'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-dependencies'] });
      
      toast({
        title: "Rubro actualizado",
        description: "El rubro de la tarea se ha actualizado automáticamente"
      });
    },
    onError: (error: any) => {
      console.error('Error saving task division:', error);
      toast({
        title: "Error al guardar rubro",
        description: "No se pudo guardar el rubro de la tarea",
        variant: "destructive"
      });
    }
  });

  // Auto-save mutation for task unit
  const saveTaskUnitMutation = useMutation({
    mutationFn: async (unit: string) => {
      if (!task.id || !supabase || !canEdit) return;

      const { error } = await supabase
        .from('tasks')
        .update({
          unit: unit
        })
        .eq('id', task.id);

      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidar TODAS las queries relacionadas para sincronización completa
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['tasks-view'] });
      queryClient.invalidateQueries({ queryKey: ['generated-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-library'] });
      queryClient.invalidateQueries({ queryKey: ['generated-task', task.id] });
      queryClient.invalidateQueries({ queryKey: ['tasks-view', task.id] });
      queryClient.invalidateQueries({ queryKey: ['parameters-with-options'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameters-admin'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['all-task-parameter-values'] });
      queryClient.invalidateQueries({ queryKey: ['parameter-dependencies-flow'] });
      queryClient.invalidateQueries({ queryKey: ['task-parameter-dependencies'] });
      
      toast({
        title: "Unidad actualizada",
        description: "La unidad de cómputo se ha actualizado automáticamente"
      });
    },
    onError: (error: any) => {
      console.error('Error saving task unit:', error);
      toast({
        title: "Error al guardar unidad",
        description: "No se pudo guardar la unidad de cómputo",
        variant: "destructive"
      });
    }
  });
  
  // Auto-save hook para el nombre de la tarea
  const { isSaving: isSavingName } = useDebouncedAutoSave({
    data: {
      taskName
    },
    saveFn: async (data) => {
      await saveTaskMutation.mutateAsync(data);
    },
    delay: 1000,
    enabled: canEdit
  });

  // Auto-save hook para el rubro de la tarea
  const { isSaving: isSavingRubro } = useDebouncedAutoSave({
    data: {
      taskRubro
    },
    saveFn: async (data) => {
      await saveTaskRubroMutation.mutateAsync(data.taskRubro);
    },
    delay: 1000,
    enabled: canEdit
  });

  // Auto-save hook para la unidad de la tarea
  const { isSaving: isSavingUnit } = useDebouncedAutoSave({
    data: {
      taskUnit
    },
    saveFn: async (data) => {
      await saveTaskUnitMutation.mutateAsync(data.taskUnit);
    },
    delay: 1000,
    enabled: canEdit
  });

  // Estado general de guardado
  const isSaving = isSavingName || isSavingRubro || isSavingUnit;

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
          
          // Invalidar TODAS las queries relacionadas para sincronización completa
          queryClient.invalidateQueries({ queryKey: ['tasks'] });
          queryClient.invalidateQueries({ queryKey: ['tasks-view'] });
          queryClient.invalidateQueries({ queryKey: ['generated-tasks'] });
          queryClient.invalidateQueries({ queryKey: ['task-library'] });
          queryClient.invalidateQueries({ queryKey: ['generated-task'] });
          queryClient.invalidateQueries({ queryKey: ['parameters-with-options'] });
          queryClient.invalidateQueries({ queryKey: ['task-parameters-admin'] });
          queryClient.invalidateQueries({ queryKey: ['task-parameter-values'] });
          queryClient.invalidateQueries({ queryKey: ['all-task-parameter-values'] });
          queryClient.invalidateQueries({ queryKey: ['parameter-dependencies-flow'] });
          queryClient.invalidateQueries({ queryKey: ['task-parameter-dependencies'] });
          
          // Determinar dónde navegar según el origen
          const isFromAdmin = typeof window !== 'undefined' && 
            (document.referrer.includes('/admin/tasks') || 
             localStorage.getItem('taskViewSource') === 'admin');
          localStorage.removeItem('taskViewSource');
          navigate(isFromAdmin ? '/admin/tasks' : '/analysis');
          
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

  // Los valores ya se actualizan en el useEffect principal de arriba
  // Remover useEffects duplicados que pueden causar conflictos

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

        {/* Card derecha - Costos */}
        <CostSummaryCard 
          task={task}
          onTabChange={onTabChange}
          canEdit={canEdit}
          handleDeleteTask={handleDeleteTask}
        />
      </div>
    </div>
  );
}