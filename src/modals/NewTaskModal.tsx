import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CustomModalLayout } from "@/components/ui-custom/CustomModalLayout";
import { CustomModalHeader } from "@/components/ui-custom/CustomModalHeader";
import { CustomModalBody } from "@/components/ui-custom/CustomModalBody";
import { CustomModalFooter } from "@/components/ui-custom/CustomModalFooter";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useCurrentUser } from "@/hooks/use-current-user";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  due_date?: string;
  assigned_to?: string;
  project_id?: string;
  organization_id: string;
}

interface NewTaskModalProps {
  open: boolean;
  onClose: () => void;
  editingTask?: Task | null;
}

const taskSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]),
  priority: z.enum(["low", "medium", "high", "urgent"]),
  due_date: z.date().optional(),
  assigned_to: z.string().optional(),
  project_id: z.string().optional(),
});

type TaskFormData = z.infer<typeof taskSchema>;

export function NewTaskModal({ open, onClose, editingTask }: NewTaskModalProps) {
  const { toast } = useToast();
  const { data: userData } = useCurrentUser();

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: editingTask?.title || "",
      description: editingTask?.description || "",
      status: editingTask?.status || "pending",
      priority: editingTask?.priority || "medium",
      due_date: editingTask?.due_date ? new Date(editingTask.due_date) : undefined,
      assigned_to: editingTask?.assigned_to || "",
      project_id: editingTask?.project_id || "",
    }
  });

  // Fetch organization members for assignment
  const { data: members = [] } = useQuery({
    queryKey: ['organization-members', userData?.preferences?.last_organization_id],
    queryFn: async () => {
      if (!supabase || !userData?.preferences?.last_organization_id) return [];
      
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          user_id,
          users (
            id,
            full_name,
            email
          )
        `)
        .eq('organization_id', userData.preferences.last_organization_id)
        .eq('is_active', true);

      if (error) throw error;
      return data?.map(member => member.users).filter(Boolean) || [];
    },
    enabled: !!userData?.preferences?.last_organization_id
  });

  // Fetch projects for assignment
  const { data: projects = [] } = useQuery({
    queryKey: ['projects-for-tasks', userData?.preferences?.last_organization_id],
    queryFn: async () => {
      if (!supabase || !userData?.preferences?.last_organization_id) return [];
      
      const { data, error } = await supabase
        .from('projects')
        .select('id, name')
        .eq('organization_id', userData.preferences.last_organization_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    },
    enabled: !!userData?.preferences?.last_organization_id
  });

  // Create/Update task mutation
  const taskMutation = useMutation({
    mutationFn: async (formData: TaskFormData) => {
      if (!supabase || !userData?.user?.id || !userData?.preferences?.last_organization_id) {
        throw new Error('Datos de usuario no disponibles');
      }

      const taskData = {
        title: formData.title,
        description: formData.description || null,
        status: formData.status,
        priority: formData.priority,
        due_date: formData.due_date ? formData.due_date.toISOString().split('T')[0] : null,
        assigned_to: formData.assigned_to || null,
        project_id: formData.project_id || null,
        organization_id: userData.preferences.last_organization_id,
      };

      if (editingTask) {
        // Update task
        const { data, error } = await supabase
          .from('tasks')
          .update(taskData)
          .eq('id', editingTask.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create task
        const { data, error } = await supabase
          .from('tasks')
          .insert({
            ...taskData,
            created_by: userData.user.id,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] });
      onClose();
      form.reset();
      toast({
        title: editingTask ? "Tarea actualizada" : "Tarea creada",
        description: editingTask 
          ? "La tarea ha sido actualizada exitosamente." 
          : "La tarea ha sido creada exitosamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al procesar la tarea.",
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: TaskFormData) => {
    taskMutation.mutate(data);
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <CustomModalLayout open={open} onClose={handleClose}>
      {{
        header: (
          <CustomModalHeader
            title={editingTask ? "Editar Tarea" : "Nueva Tarea"}
            description={editingTask ? "Modifica los detalles de la tarea" : "Crea una nueva tarea para tu organización"}
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody padding="md">
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="title">Título de la tarea</Label>
                  <Input
                    id="title"
                    {...form.register("title")}
                    placeholder="Ingresa el título de la tarea"
                  />
                  {form.formState.errors.title && (
                    <p className="text-red-500 text-sm mt-1">{form.formState.errors.title.message}</p>
                  )}
                </div>

                <div className="col-span-2">
                  <Label htmlFor="description">Descripción</Label>
                  <Textarea
                    id="description"
                    {...form.register("description")}
                    placeholder="Describe los detalles de la tarea (opcional)"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="status">Estado</Label>
                  <Select
                    value={form.watch("status")}
                    onValueChange={(value) => form.setValue("status", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pendiente</SelectItem>
                      <SelectItem value="in_progress">En Progreso</SelectItem>
                      <SelectItem value="completed">Completada</SelectItem>
                      <SelectItem value="cancelled">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="priority">Prioridad</Label>
                  <Select
                    value={form.watch("priority")}
                    onValueChange={(value) => form.setValue("priority", value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona una prioridad" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Baja</SelectItem>
                      <SelectItem value="medium">Media</SelectItem>
                      <SelectItem value="high">Alta</SelectItem>
                      <SelectItem value="urgent">Urgente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="assigned_to">Asignar a</Label>
                  <Select
                    value={form.watch("assigned_to") || "none"}
                    onValueChange={(value) => form.setValue("assigned_to", value === "none" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un miembro" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin asignar</SelectItem>
                      {members.map((member) => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.full_name || member.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="project_id">Proyecto</Label>
                  <Select
                    value={form.watch("project_id") || "none"}
                    onValueChange={(value) => form.setValue("project_id", value === "none" ? "" : value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sin proyecto</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2">
                  <Label>Fecha límite</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.watch("due_date") && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch("due_date") ? (
                          format(form.watch("due_date")!, "PPP", { locale: es })
                        ) : (
                          <span>Selecciona una fecha (opcional)</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={form.watch("due_date")}
                        onSelect={(date) => form.setValue("due_date", date)}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                      {form.watch("due_date") && (
                        <div className="p-3 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => form.setValue("due_date", undefined)}
                            className="w-full"
                          >
                            Quitar fecha
                          </Button>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={handleClose}
            onSave={form.handleSubmit(onSubmit)}
            saveText={editingTask ? "Actualizar" : "Crear"}
            isLoading={taskMutation.isPending}
          />
        )
      }}
    </CustomModalLayout>
  );
}