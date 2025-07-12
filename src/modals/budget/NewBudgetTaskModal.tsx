import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { CustomModalLayout } from "@/components/modal/CustomModalLayout";
import { CustomModalHeader } from "@/components/modal/CustomModalHeader";
import { CustomModalBody } from "@/components/modal/CustomModalBody";
import { CustomModalFooter } from "@/components/modal/CustomModalFooter";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TaskSearchCombo } from "@/components/ui-custom/TaskSearchCombo";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Package } from "lucide-react";
import { useTaskSearch, useTaskSearchFilterOptions, TaskSearchFilters } from "@/hooks/use-task-search";
import { useBudgetTasks } from "@/hooks/use-budget-tasks";
import { useDebugTasks } from "@/hooks/use-debug-tasks";
import { CreateGeneratedTaskUserModal } from "@/modals/user/CreateGeneratedTaskUserModal";
import { useCurrentUser } from "@/hooks/use-current-user";
import { generatePreviewDescription } from "@/utils/taskDescriptionGenerator";

// Interface para tareas pendientes de agregar
interface PendingTask {
  id: string;
  task_id: string;
  task_name: string;
  quantity: number;
  unit_name?: string;
}

const addTaskSchema = z.object({
  task_id: z.string().min(1, "Debe seleccionar una tarea"),
  quantity: z.number().min(0.01, "La cantidad debe ser mayor a 0")
});

type AddTaskFormData = z.infer<typeof addTaskSchema>;

interface NewBudgetTaskModalProps {
  open: boolean;
  onClose: () => void;
  budgetId: string;
  organizationId: string;
}

export default function NewBudgetTaskModal({
  open,
  onClose,
  budgetId,
  organizationId
}: NewBudgetTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const [pendingTasks, setPendingTasks] = useState<PendingTask[]>([]);
  const [taskFilters, setTaskFilters] = useState<TaskSearchFilters>({ origin: 'all' });
  
  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useTaskSearch(
    searchQuery, 
    organizationId, 
    taskFilters,
    open
  );
  
  const { data: filterOptions, isLoading: filterOptionsLoading } = useTaskSearchFilterOptions(organizationId);
  const budgetTasksHook = useBudgetTasks(budgetId);
  const { createBudgetTask, updateBudgetTask } = budgetTasksHook;
  const { data: userData } = useCurrentUser();
  
  // Hook de debug temporal
  const { data: debugData } = useDebugTasks(organizationId);

  const form = useForm<AddTaskFormData>({
    resolver: zodResolver(addTaskSchema),
    defaultValues: {
      task_id: "",
      quantity: 1
    }
  });

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = form;

  // Preparar opciones para TaskSearchCombo usando display_name
  const taskOptions = tasks.map(task => ({
    value: task.id,
    label: task.display_name || task.code || 'Sin nombre'
  }));
  
  // Resetear form cuando abre el modal
  useEffect(() => {
    if (open) {
      reset({
        task_id: "",
        quantity: 1
      });
      setPendingTasks([]);
    }
  }, [open, reset]);

  const handleClose = () => {
    reset();
    setSearchQuery('');
    setPendingTasks([]);
    onClose();
  };

  // Handle task creation from modal
  const handleTaskCreated = (newTask: any) => {
    console.log('New task created data:', newTask);
    
    // Simply use the task code as the name since we don't have all the infrastructure for dynamic names
    // The display name will be properly computed by the task search system when it re-fetches
    const taskName = newTask.code || 'Nueva tarea';
    
    // Agregar la nueva tarea directamente a la lista de pendientes
    const newPendingTask: PendingTask = {
      id: `temp-${Date.now()}`,
      task_id: newTask.id,
      task_name: taskName,
      quantity: 1,
      unit_name: newTask.unit_name
    };
    
    setPendingTasks(prev => [...prev, newPendingTask]);
    
    // Close the create task modal
    setCreateTaskModalOpen(false);
    // Refetch tasks to include the new one - this will update the search with proper display names
    refetchTasks();
    
    toast({
      title: "Tarea creada y agregada",
      description: "La nueva tarea se agregó a la lista. Presione 'Guardar Todas' para confirmar."
    });
  };

  // Handle create task button click
  const handleCreateTask = () => {
    setCreateTaskModalOpen(true);
  };

  // Agregar tarea a la lista temporal
  const onAddTask = async (data: AddTaskFormData) => {
    const selectedTask = tasks.find(t => t.id === data.task_id);
    if (!selectedTask) return;

    // Verificar si la tarea ya está en la lista
    if (pendingTasks.some(pt => pt.task_id === data.task_id)) {
      toast({
        title: "Tarea ya agregada",
        description: "Esta tarea ya está en la lista de tareas a agregar",
        variant: "destructive"
      });
      return;
    }

    const newPendingTask: PendingTask = {
      id: `temp-${Date.now()}`,
      task_id: data.task_id,
      task_name: selectedTask.display_name || selectedTask.code || 'Sin nombre',
      quantity: data.quantity,
      unit_name: selectedTask.unit_name
    };

    setPendingTasks(prev => [...prev, newPendingTask]);
    
    // Reset form
    reset({
      task_id: "",
      quantity: 1
    });

    toast({
      title: "Tarea agregada a la lista",
      description: `${newPendingTask.task_name} agregada. Total: ${pendingTasks.length + 1} tareas`
    });
  };

  // Eliminar tarea de la lista temporal
  const removePendingTask = (taskId: string) => {
    setPendingTasks(prev => prev.filter(pt => pt.id !== taskId));
  };

  // Actualizar cantidad de tarea pendiente
  const updatePendingTaskQuantity = (taskId: string, quantity: number) => {
    if (quantity <= 0) return;
    setPendingTasks(prev => 
      prev.map(pt => pt.id === taskId ? { ...pt, quantity } : pt)
    );
  };

  // Guardar todas las tareas pendientes
  const saveAllTasks = async () => {
    if (pendingTasks.length === 0) {
      toast({
        title: "Sin tareas",
        description: "Debe agregar al menos una tarea antes de guardar",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Crear todas las tareas en paralelo
      const promises = pendingTasks.map(task => 
        createBudgetTask.mutateAsync({
          budget_id: budgetId,
          task_id: task.task_id,
          quantity: task.quantity,
          organization_id: organizationId
        })
      );

      await Promise.all(promises);

      toast({
        title: "Tareas agregadas",
        description: `${pendingTasks.length} tareas agregadas al presupuesto correctamente`
      });

      handleClose();
    } catch (error) {
      console.error("Error saving budget tasks:", error);
      toast({
        title: "Error",
        description: "No se pudo guardar la tarea en el presupuesto",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };



  return (
    <>
      <CustomModalLayout open={open} onClose={handleClose}>
      {{
        header: (
          <CustomModalHeader
            title="Agregar Tareas al Presupuesto"
            subtitle="Puede agregar múltiples tareas con sus cantidades y guardarlas todas al mismo tiempo"
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody columns={1}>
            <div className="space-y-6">
              {/* Sección: Agregar Nueva Tarea */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Plus className="w-4 h-4 text-accent" />
                  <h3 className="text-sm font-medium text-foreground">Agregar Tarea</h3>
                </div>
                
                <form onSubmit={handleSubmit(onAddTask)} className="space-y-3">
                  {/* Tarea */}
                  <div className="space-y-1">
                    <Label htmlFor="task_id" className="text-xs required-asterisk">
                      Tipo de Tarea
                    </Label>
                    <TaskSearchCombo
                      options={taskOptions}
                      value={watch("task_id")}
                      onValueChange={(value) => setValue("task_id", value)}
                      onSearchChange={setSearchQuery}
                      placeholder={searchQuery.length < 3 ? "Escriba al menos 3 caracteres para buscar..." : "Seleccionar tarea"}
                      searchPlaceholder="🔍 Buscar tarea por nombre..."
                      emptyText={searchQuery.length < 3 ? "Escriba al menos 3 caracteres para buscar" : "No se encontraron tareas"}
                      disabled={tasksLoading}
                      showCreateButton={!userData?.user_data?.user_type || userData.user_data.user_type !== 'admin'}
                      onCreateTask={handleCreateTask}
                      searchQuery={searchQuery}
                      filters={taskFilters}
                      onFiltersChange={setTaskFilters}
                      filterOptions={filterOptions}
                      isLoading={filterOptionsLoading}
                    />
                    {searchQuery.length >= 3 && tasks.length === 0 && !tasksLoading && !(!userData?.user_data?.user_type || userData.user_data.user_type !== 'admin') && (
                      <div className="text-center py-2">
                        <p className="text-xs text-muted-foreground">
                          No se encontraron tareas que coincidan con "{searchQuery}"
                        </p>
                      </div>
                    )}
                    {errors.task_id && (
                      <p className="text-xs text-destructive">{errors.task_id.message}</p>
                    )}
                  </div>

                  {/* Cantidad */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="quantity" className="text-xs required-asterisk">
                        Cantidad
                      </Label>
                      <Input
                        id="quantity"
                        type="number"
                        step="0.01"
                        min="0.01"
                        {...register("quantity", { valueAsNumber: true })}
                        placeholder="Ej: 1"
                      />
                      {errors.quantity && (
                        <p className="text-xs text-destructive">{errors.quantity.message}</p>
                      )}
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Acción</Label>
                      <Button type="submit" className="w-full h-9 text-xs" disabled={!watch("task_id") || !watch("quantity")}>
                        <Plus className="w-3 h-3 mr-1" />
                        Agregar
                      </Button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Sección: Lista de Tareas Pendientes */}
              {pendingTasks.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-accent" />
                      <h3 className="text-sm font-medium text-foreground">
                        Tareas a Agregar ({pendingTasks.length})
                      </h3>
                    </div>
                  </div>
                  
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {pendingTasks.map((task) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-muted/50 border border-border rounded-md">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">
                            {task.task_name}
                          </p>
                          {task.unit_name && (
                            <p className="text-xs text-muted-foreground">
                              Unidad: {task.unit_name}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={task.quantity}
                            onChange={(e) => {
                              const value = e.target.value;
                              updatePendingTaskQuantity(task.id, value === '' ? 0 : parseFloat(value) || 0);
                            }}
                            className="w-16 h-8 text-xs"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removePendingTask(task.id)}
                            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            cancelText="Cancelar"
            saveText={pendingTasks.length > 0 ? `Guardar Todas (${pendingTasks.length})` : "Cerrar"}
            onCancel={handleClose}
            onSave={pendingTasks.length > 0 ? saveAllTasks : handleClose}
            saveLoading={isSubmitting}
            saveDisabled={pendingTasks.length === 0}
          />
        )
      }}
      </CustomModalLayout>
      
      <CreateGeneratedTaskUserModal
        open={createTaskModalOpen}
        onClose={() => setCreateTaskModalOpen(false)}
        onTaskCreated={handleTaskCreated}
      />
    </>
  );
}