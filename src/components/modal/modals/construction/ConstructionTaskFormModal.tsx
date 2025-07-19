import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormModalLayout } from "@/components/modal/form/FormModalLayout";
import { FormModalHeader } from "@/components/modal/form/FormModalHeader";
import { FormModalFooter } from "@/components/modal/form/FormModalFooter";
import { ComboBox } from "@/components/ui-custom/ComboBoxWrite";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";
import { useTaskSearch } from "@/hooks/use-task-search";
import { useCurrentUser } from "@/hooks/use-current-user";
import { useCreateConstructionTask } from "@/hooks/use-construction-tasks";
import { useModalPanelStore } from "@/components/modal/form/modalPanelStore";
import { toast } from "@/hooks/use-toast";

const addTaskSchema = z.object({
  task_id: z.string().min(1, "Debe seleccionar una tarea"),
  quantity: z.number().min(0.01, "La cantidad debe ser mayor a 0")
});

type AddTaskFormData = z.infer<typeof addTaskSchema>;

interface ConstructionTaskFormModalProps {
  modalData: {
    projectId: string;
    organizationId: string;
  };
  onClose: () => void;
}

export function ConstructionTaskFormModal({ 
  modalData, 
  onClose 
}: ConstructionTaskFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { data: userData } = useCurrentUser();
  const { setPanel } = useModalPanelStore();

  // Forzar modo de edición al abrir el modal
  useEffect(() => {
    setPanel("edit");
  }, [setPanel]);
  // Hook para búsqueda de tareas (solo buscar si hay al menos 3 caracteres)
  const { data: tasks = [], isLoading: tasksLoading } = useTaskSearch(
    searchQuery, 
    modalData.organizationId, 
    { origin: 'all' },
    searchQuery.length >= 3
  );

  // Debug para ver qué está pasando
  console.log('Search query:', searchQuery);
  console.log('Tasks found:', tasks.length);
  console.log('Tasks data:', tasks);

  const form = useForm<AddTaskFormData>({
    resolver: zodResolver(addTaskSchema),
    defaultValues: {
      task_id: "",
      quantity: 1
    }
  });

  const { handleSubmit, setValue, watch, formState: { errors } } = form;

  // Preparar opciones para ComboBoxWrite usando display_name
  const taskOptions = tasks.map(task => ({
    value: task.id,
    label: task.display_name || task.code || 'Sin nombre'
  }));

  const selectedTaskId = watch('task_id');
  const selectedTask = tasks.find(t => t.id === selectedTaskId);
  const quantity = watch('quantity');

  const createTask = useCreateConstructionTask();

  const onSubmit = async (data: AddTaskFormData) => {
    if (!userData?.user?.id) {
      toast({
        title: "Error",
        description: "No se pudo identificar el usuario",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      await createTask.mutateAsync({
        organization_id: modalData.organizationId,
        project_id: modalData.projectId,
        task_id: data.task_id,
        quantity: data.quantity,
        created_by: userData.user.id
      });

      onClose();
    } catch (error) {
      // Error already handled in the mutation
    } finally {
      setIsSubmitting(false);
    }
  };

  const viewPanel = (
    <div className="space-y-6">
      <div className="text-center py-8 text-muted-foreground">
        Vista de tareas de construcción
      </div>
    </div>
  );

  const editPanel = (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Task Selection with inline Quantity */}
      <div className="space-y-2">
        <Label htmlFor="task_id">Tarea *</Label>
        <div className="flex gap-3">
          <div className="flex-1">
            <ComboBox
              options={taskOptions}
              value={selectedTaskId}
              onValueChange={(value) => setValue('task_id', value)}
              placeholder="Buscar tarea..."
              searchPlaceholder="Escriba para buscar tareas..."
              emptyMessage="No se encontraron tareas"
              onSearchChange={setSearchQuery}
              searchQuery={searchQuery}
            />
          </div>
          <div className="w-32">
            <Input
              id="quantity"
              type="number"
              step="0.01"
              min="0.01"
              value={quantity}
              onChange={(e) => setValue('quantity', parseFloat(e.target.value) || 0)}
              placeholder="Cantidad"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            {errors.task_id && (
              <p className="text-sm text-destructive">{errors.task_id.message}</p>
            )}
          </div>
          <div className="w-32">
            {errors.quantity && (
              <p className="text-sm text-destructive">{errors.quantity.message}</p>
            )}
          </div>
        </div>
      </div>
    </form>
  );

  const headerContent = (
    <FormModalHeader 
      title="Agregar Tarea de Construcción"
      icon={Plus}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel="Agregar Tarea"
      onRightClick={handleSubmit(onSubmit)}
      rightLoading={isSubmitting}
      rightDisabled={isSubmitting || !selectedTaskId || !quantity}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
    />
  );
}