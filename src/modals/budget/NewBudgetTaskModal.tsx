import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { CustomModalLayout } from "@/components/ui-custom/modal/CustomModalLayout";
import { CustomModalHeader } from "@/components/ui-custom/modal/CustomModalHeader";
import { CustomModalBody } from "@/components/ui-custom/modal/CustomModalBody";
import { CustomModalFooter } from "@/components/ui-custom/modal/CustomModalFooter";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskSearchCombo } from "@/components/ui-custom/misc/TaskSearchCombo";
import { Label } from "@/components/ui/label";
import { useGeneratedTasks } from "@/hooks/use-generated-tasks";
import { useBudgetTasks } from "@/hooks/use-budget-tasks";

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
  const { data: tasks = [], isLoading: tasksLoading } = useGeneratedTasks();
  const budgetTasksHook = useBudgetTasks(budgetId);
  const { createBudgetTask, updateBudgetTask } = budgetTasksHook;

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

  // Filtrar tareas basado en búsqueda (mínimo 3 caracteres)
  const filteredTasks = searchQuery.length >= 3 
    ? tasks.filter(task => 
        task.name?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  // Preparar opciones para CustomComboBox
  const taskOptions = filteredTasks.map(task => ({
    value: task.id,
    label: task.name || 'Sin nombre'
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
    } else if (!editingTask && open) {
      reset({
        task_id: "",
        quantity: 1,
        start_date: "",
        end_date: ""
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
              <Accordion type="single" collapsible defaultValue="datos-tarea" className="w-full">
                <AccordionItem value="datos-tarea">
                  <AccordionTrigger className="text-sm font-medium">
                    Datos de Tarea
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-3 pb-4">
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
                        searchPlaceholder="Buscar tarea por nombre..."
                        emptyText={searchQuery.length < 3 ? "Escriba al menos 3 caracteres" : "No se encontraron tareas"}
                        disabled={tasksLoading}
                      />
                      {searchQuery.length >= 3 && filteredTasks.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          No se encontraron tareas que coincidan con "{searchQuery}"
                        </p>
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
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="ejecucion">
                  <AccordionTrigger className="text-sm font-medium">
                    Ejecución
                  </AccordionTrigger>
                  <AccordionContent className="space-y-3 pt-3 pb-4">
                    {/* Fecha de Inicio */}
                    <div className="space-y-1">
                      <Label htmlFor="start_date" className="text-xs">
                        Fecha de Inicio
                      </Label>
                      <Input
                        id="start_date"
                        type="date"
                        {...register("start_date")}
                      />
                      {errors.start_date && (
                        <p className="text-xs text-destructive">{errors.start_date.message}</p>
                      )}
                    </div>

                    {/* Fecha de Finalización */}
                    <div className="space-y-1">
                      <Label htmlFor="end_date" className="text-xs">
                        Fecha de Finalización
                      </Label>
                      <Input
                        id="end_date"
                        type="date"
                        {...register("end_date")}
                      />
                      {errors.end_date && (
                        <p className="text-xs text-destructive">{errors.end_date.message}</p>
                      )}
                    </div>


                  </AccordionContent>
                </AccordionItem>
              </Accordion>
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
  );
}