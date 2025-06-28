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
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useTasks } from "@/hooks/use-tasks";
import { useBudgetTasks } from "@/hooks/use-budget-tasks";

const budgetTaskSchema = z.object({
  task_id: z.string().min(1, "Debe seleccionar una tarea"),
  quantity: z.number().min(0.01, "La cantidad debe ser mayor a 0"),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  planned_days: z.number().min(1, "Los días planificados deben ser al menos 1").optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
  dependencies: z.array(z.string()).optional()
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
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const budgetTasksHook = useBudgetTasks(budgetId);
  const { createBudgetTask, updateBudgetTask } = budgetTasksHook;

  const form = useForm<BudgetTaskFormData>({
    resolver: zodResolver(budgetTaskSchema),
    defaultValues: {
      task_id: "",
      quantity: 1,
      start_date: "",
      end_date: "",
      planned_days: 1,
      priority: "medium",
      dependencies: []
    }
  });

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = form;

  // Precargar datos en modo edición
  useEffect(() => {
    if (editingTask && open) {
      reset({
        task_id: editingTask.task_id || "",
        quantity: editingTask.quantity || 1,
        start_date: editingTask.start_date || "",
        end_date: editingTask.end_date || "",
        planned_days: editingTask.planned_days || 1,
        priority: editingTask.priority || "medium",
        dependencies: editingTask.dependencies || []
      });
    } else if (!editingTask && open) {
      reset({
        task_id: "",
        quantity: 1,
        start_date: "",
        end_date: "",
        planned_days: 1,
        priority: "medium",
        dependencies: []
      });
    }
  }, [editingTask, open, reset]);

  const handleClose = () => {
    reset();
    onClose();
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
        planned_days: data.planned_days || null,
        priority: data.priority || null,
        dependencies: data.dependencies || [],
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

  const selectedTask = tasks.find(task => task.id === watch("task_id"));

  return (
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
            <CustomModalBody>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Selección de Tarea */}
            <div className="col-span-2">
              <Label className="required-asterisk">Tarea</Label>
              <Select
                value={watch("task_id")}
                onValueChange={(value) => setValue("task_id", value)}
                disabled={tasksLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tarea..." />
                </SelectTrigger>
                <SelectContent>
                  {tasks.map((task) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.task_id && (
                <p className="text-sm text-destructive mt-1">{errors.task_id.message}</p>
              )}
            </div>

            {/* Información de la tarea seleccionada */}
            {selectedTask && (
              <div className="col-span-2 p-3 bg-muted rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Precio M.O.:</span>
                    <span className="ml-2">${selectedTask.unit_labor_price || 0}</span>
                  </div>
                  <div>
                    <span className="font-medium">Precio Material:</span>
                    <span className="ml-2">${selectedTask.unit_material_price || 0}</span>
                  </div>
                  <div>
                    <span className="font-medium">Total Unitario:</span>
                    <span className="ml-2 font-semibold">
                      ${(selectedTask.unit_labor_price || 0) + (selectedTask.unit_material_price || 0)}
                    </span>
                  </div>
                </div>
                {selectedTask.description && (
                  <p className="text-muted-foreground mt-2">{selectedTask.description}</p>
                )}
              </div>
            )}

            {/* Cantidad */}
            <div className="col-span-1">
              <Label className="required-asterisk">Cantidad</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                {...register("quantity", { valueAsNumber: true })}
                placeholder="1.00"
              />
              {errors.quantity && (
                <p className="text-sm text-destructive mt-1">{errors.quantity.message}</p>
              )}
            </div>

            {/* Días Planificados */}
            <div className="col-span-1">
              <Label>Días Planificados</Label>
              <Input
                type="number"
                min="1"
                {...register("planned_days", { valueAsNumber: true })}
                placeholder="1"
              />
              {errors.planned_days && (
                <p className="text-sm text-destructive mt-1">{errors.planned_days.message}</p>
              )}
            </div>

            {/* Fecha de Inicio */}
            <div className="col-span-1">
              <Label>Fecha de Inicio</Label>
              <Input
                type="date"
                {...register("start_date")}
              />
            </div>

            {/* Fecha de Fin */}
            <div className="col-span-1">
              <Label>Fecha de Fin</Label>
              <Input
                type="date"
                {...register("end_date")}
              />
            </div>

            {/* Prioridad */}
            <div className="col-span-2">
              <Label>Prioridad</Label>
              <Select
                value={watch("priority")}
                onValueChange={(value) => setValue("priority", value as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar prioridad..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Baja</SelectItem>
                  <SelectItem value="medium">Media</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="urgent">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Total calculado */}
            {selectedTask && watch("quantity") && (
              <div className="col-span-2 p-3 bg-accent/10 rounded-lg border">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total de la Tarea:</span>
                  <span className="text-lg font-bold">
                    ${((selectedTask.unit_labor_price || 0) + (selectedTask.unit_material_price || 0)) * (watch("quantity") || 0)}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-2 text-sm text-muted-foreground">
                  <div>
                    <span>M.O.: ${(selectedTask.unit_labor_price || 0) * (watch("quantity") || 0)}</span>
                  </div>
                  <div>
                    <span>Material: ${(selectedTask.unit_material_price || 0) * (watch("quantity") || 0)}</span>
                  </div>
                </div>
              </div>
            )}
              </div>
            </CustomModalBody>
          </form>
        ),
        footer: (
          <CustomModalFooter
            onCancel={handleClose}
            onSave={handleSubmit(onSubmit)}
            saveText={editingTask ? "Actualizar Tarea" : "Agregar Tarea"}
            isLoading={isSubmitting}
          />
        )
      }}
    </CustomModalLayout>
  );
}