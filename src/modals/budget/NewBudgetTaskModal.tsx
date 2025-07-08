import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { CustomModalLayout } from "@/components/ui-custom/modal/CustomModalLayout";
import { CustomModalHeader } from "@/components/ui-custom/modal/CustomModalHeader";
import { CustomModalBody } from "@/components/ui-custom/modal/CustomModalBody";
import { CustomModalFooter } from "@/components/ui-custom/modal/CustomModalFooter";

import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskSearchCombo } from "@/components/ui-custom/misc/TaskSearchCombo";
import { Label } from "@/components/ui/label";
import { useTaskSearch } from "@/hooks/use-task-search";
import { useBudgetTasks } from "@/hooks/use-budget-tasks";
import { useDebugTasks } from "@/hooks/use-debug-tasks";
import { CreateGeneratedTaskUserModal } from "@/modals/user/CreateGeneratedTaskUserModal";
import { useCurrentUser } from "@/hooks/use-current-user";

const budgetTaskSchema = z.object({
  task_id: z.string().min(1, "Debe seleccionar una tarea"),
  quantity: z.number().min(0.01, "La cantidad debe ser mayor a 0"),
  start_date: z.string().optional(),
  end_date: z.string().optional()
});

type BudgetTaskFormData = z.infer<typeof budgetTaskSchema>;

interface NewBudgetTaskModalProps {
  open: boolean;
  onClose: () => void;
  budgetId: string;
  organizationId: string;
  editingTask?: any;
}

export default function NewBudgetTaskModal({
  open,
  onClose,
  budgetId,
  organizationId,
  editingTask
}: NewBudgetTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [createTaskModalOpen, setCreateTaskModalOpen] = useState(false);
  const { data: tasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useTaskSearch(searchQuery, organizationId, open);
  const budgetTasksHook = useBudgetTasks(budgetId);
  const { createBudgetTask, updateBudgetTask } = budgetTasksHook;
  const { data: userData } = useCurrentUser();
  
  // Hook de debug temporal
  const { data: debugData } = useDebugTasks(organizationId);

  const form = useForm<BudgetTaskFormData>({
    resolver: zodResolver(budgetTaskSchema),
    defaultValues: {
      task_id: "",
      quantity: 1,
      start_date: "",
      end_date: ""
    }
  });

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = form;

  // Preparar opciones para TaskSearchCombo usando display_name
  const taskOptions = tasks.map(task => ({
    value: task.id,
    label: task.display_name || task.code || 'Sin nombre'
  }));
  


  // Precargar datos en modo edición
  useEffect(() => {
    if (editingTask && open) {
      reset({
        task_id: editingTask.task_id || "",
        quantity: editingTask.quantity || 1,
        start_date: editingTask.start_date || "",
        end_date: editingTask.end_date || ""
      });
      // Forzar actualización del campo task_id
      setValue("task_id", editingTask.task_id || "");
    } else if (!editingTask && open) {
      reset({
        task_id: "",
        quantity: 1,
        start_date: "",
        end_date: ""
      });
    }
  }, [editingTask, open, reset, setValue]);

  const handleClose = () => {
    reset();
    setSearchQuery('');
    onClose();
  };

  // Handle task creation from modal
  const handleTaskCreated = (newTask: any) => {
    // Set the newly created task in the form
    setValue("task_id", newTask.id);
    // Close the create task modal
    setCreateTaskModalOpen(false);
    // Refetch tasks to include the new one
    refetchTasks();
  };

  // Handle create task button click
  const handleCreateTask = () => {
    setCreateTaskModalOpen(true);
  };

  const onSubmit = async (data: BudgetTaskFormData) => {
    setIsSubmitting(true);
    try {
      const budgetTaskData = {
        budget_id: budgetId,
        task_id: data.task_id,
        quantity: data.quantity,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        organization_id: organizationId
      };

      if (editingTask) {
        await updateBudgetTask.mutateAsync({
          id: editingTask.id,
          ...budgetTaskData
        });
        toast({
          title: "Tarea actualizada",
          description: "La tarea del presupuesto se actualizó correctamente"
        });
      } else {
        await createBudgetTask.mutateAsync(budgetTaskData);
        toast({
          title: "Tarea agregada",
          description: "La tarea se agregó al presupuesto correctamente"
        });
      }

      handleClose();
    } catch (error) {
      console.error("Error saving budget task:", error);
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
            title={editingTask ? "Editar Tarea del Presupuesto" : "Agregar Tarea al Presupuesto"}
            onClose={handleClose}
          />
        ),
        body: (
          <form onSubmit={handleSubmit(onSubmit)} id="budget-task-form">
            <CustomModalBody columns={1}>
              <div className="space-y-4">
                {/* Tarea */}
                <div className="space-y-1">
                  <Label htmlFor="task_id" className="text-xs required-asterisk">
                    Tarea
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
              </div>
            </CustomModalBody>
          </form>
        ),
        footer: (
          <CustomModalFooter
            cancelText="Cancelar"
            saveText={editingTask ? "Actualizar" : "Agregar"}
            onCancel={handleClose}
            onSave={() => handleSubmit(onSubmit)()}
            saveLoading={isSubmitting}
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