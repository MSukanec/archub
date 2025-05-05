import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { BudgetTaskTable } from "@/components/budgets/BudgetTaskTable";
import { AddTaskForm } from "@/components/budgets/AddTaskForm";
import { EditBudgetTaskDialog } from "@/components/budgets/EditBudgetTaskDialog";

// Form schema
const budgetSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof budgetSchema>;

interface Budget {
  id: number;
  name: string;
  description: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

interface Task {
  id: number;
  name: string;
  category: string;
  unit: string;
  unitPrice: number;
}

interface BudgetTask {
  id?: number;
  budgetId?: number;
  taskId: number;
  quantity: number;
  task?: Task;
}

interface BudgetFormProps {
  budgetId?: string;
}

export default function BudgetForm({ budgetId }: BudgetFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!budgetId;
  const [budgetTasks, setBudgetTasks] = useState<BudgetTask[]>([]);
  const [editingTask, setEditingTask] = useState<BudgetTask | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: "",
      description: "",
      projectId: initialProjectId ? initialProjectId.toString() : "",
    },
  });

  // Fetch budget if we're editing
  const { data: budget, isLoading: isBudgetLoading } = useQuery<Budget>({
    queryKey: [`/api/budgets/${budgetId}`],
    enabled: isEditing,
  });

  // Fetch projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // Fetch tasks
  const { data: tasks = [] } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  // Fetch budget tasks if editing
  const { data: fetchedBudgetTasks = [], isLoading: isBudgetTasksLoading } = useQuery<BudgetTask[]>({
    queryKey: [`/api/budgets/${budgetId}/tasks`],
    enabled: isEditing,
  });

  // Create budget mutation
  const createBudgetMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      // Create budget
      const response = await apiRequest('POST', `/api/projects/${data.projectId}/budgets`, {
        name: data.name,
        description: data.description,
      });
      
      // Add budget tasks
      const newBudgetId = response.id;
      
      const taskPromises = budgetTasks.map(bt => {
        return apiRequest('POST', `/api/budgets/${newBudgetId}/tasks`, {
          taskId: bt.taskId,
          quantity: bt.quantity,
        });
      });
      
      await Promise.all(taskPromises);
      
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "Presupuesto creado",
        description: "El presupuesto ha sido creado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${data.projectId}/budgets`] });
      setLocation(`/projects/${data.projectId}/budgets`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo crear el presupuesto: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Update budget mutation
  const updateBudgetMutation = useMutation({
    mutationFn: (data: FormValues) => {
      return apiRequest('PATCH', `/api/budgets/${budgetId}`, {
        name: data.name,
        description: data.description,
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Presupuesto actualizado",
        description: "El presupuesto ha sido actualizado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${data.projectId}/budgets`] });
      queryClient.invalidateQueries({ queryKey: [`/api/budgets/${budgetId}`] });
      setLocation(`/projects/${data.projectId}/budgets`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo actualizar el presupuesto: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Add budget task mutation
  const addBudgetTaskMutation = useMutation({
    mutationFn: (data: { budgetId: string, taskId: number, quantity: number }) => {
      return apiRequest('POST', `/api/budgets/${data.budgetId}/tasks`, {
        taskId: data.taskId,
        quantity: data.quantity,
      });
    },
    onSuccess: () => {
      toast({
        title: "Tarea añadida",
        description: "La tarea ha sido añadida al presupuesto correctamente",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/budgets/${budgetId}/tasks`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo añadir la tarea: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Update budget task mutation
  const updateBudgetTaskMutation = useMutation({
    mutationFn: (data: { id: number, quantity: number }) => {
      return apiRequest('PATCH', `/api/budget-tasks/${data.id}`, {
        quantity: data.quantity,
      });
    },
    onSuccess: () => {
      toast({
        title: "Tarea actualizada",
        description: "La tarea ha sido actualizada correctamente",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/budgets/${budgetId}/tasks`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo actualizar la tarea: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Delete budget task mutation
  const deleteBudgetTaskMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('DELETE', `/api/budget-tasks/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Tarea eliminada",
        description: "La tarea ha sido eliminada del presupuesto correctamente",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/budgets/${budgetId}/tasks`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo eliminar la tarea: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Update form when budget data is loaded
  useEffect(() => {
    if (budget) {
      form.reset({
        name: budget.name,
        description: budget.description || "",
        projectId: budget.projectId.toString(),
      });
    }
  }, [budget, form]);

  // Update budget tasks when fetched
  useEffect(() => {
    if (fetchedBudgetTasks && fetchedBudgetTasks.length > 0) {
      // Merge with tasks data to get task details
      const extendedBudgetTasks = fetchedBudgetTasks.map(bt => {
        const task = tasks.find(t => t.id === bt.taskId);
        return {
          ...bt,
          task
        };
      });
      setBudgetTasks(extendedBudgetTasks);
    }
  }, [fetchedBudgetTasks, tasks]);

  const onSubmit = (data: FormValues) => {
    if (isEditing) {
      updateBudgetMutation.mutate(data);
    } else {
      createBudgetMutation.mutate(data);
    }
  };

  const handleAddTask = (taskId: number, quantity: number) => {
    if (isEditing && budgetId) {
      // If editing, add task via API
      addBudgetTaskMutation.mutate({
        budgetId,
        taskId,
        quantity,
      });
    } else {
      // If creating, add to local state
      const task = tasks.find(t => t.id === taskId);
      
      // Check if task already exists in the budget
      const existingTaskIndex = budgetTasks.findIndex(bt => bt.taskId === taskId);
      
      if (existingTaskIndex >= 0) {
        // Update quantity instead of adding new
        const updatedTasks = [...budgetTasks];
        updatedTasks[existingTaskIndex].quantity += quantity;
        setBudgetTasks(updatedTasks);
        
        toast({
          title: "Tarea actualizada",
          description: "La cantidad de la tarea ha sido actualizada",
        });
      } else {
        // Add new task
        setBudgetTasks([
          ...budgetTasks,
          {
            taskId,
            quantity,
            task
          }
        ]);
        
        toast({
          title: "Tarea añadida",
          description: "La tarea ha sido añadida al presupuesto",
        });
      }
    }
  };

  const handleRemoveTask = (index: number) => {
    if (isEditing) {
      // If editing, remove from database
      const taskToRemove = budgetTasks[index];
      if (taskToRemove.id) {
        deleteBudgetTaskMutation.mutate(taskToRemove.id);
      }
    } else {
      // If creating, remove from local state
      const updatedTasks = [...budgetTasks];
      updatedTasks.splice(index, 1);
      setBudgetTasks(updatedTasks);
      
      toast({
        title: "Tarea eliminada",
        description: "La tarea ha sido eliminada del presupuesto",
      });
    }
  };

  const handleEditTask = (index: number, budgetTask: BudgetTask) => {
    setEditingTask(budgetTask);
    setIsEditDialogOpen(true);
  };

  const handleUpdateTask = (id: number, quantity: number) => {
    if (isEditing) {
      // If editing an existing budget, update via API
      updateBudgetTaskMutation.mutate({
        id,
        quantity,
      });
    } else {
      // If creating a new budget, update local state
      const updatedTasks = [...budgetTasks];
      const taskIndex = updatedTasks.findIndex(bt => bt.taskId === editingTask?.taskId);
      
      if (taskIndex >= 0) {
        updatedTasks[taskIndex].quantity = quantity;
        setBudgetTasks(updatedTasks);
        
        toast({
          title: "Tarea actualizada",
          description: "La cantidad de la tarea ha sido actualizada",
        });
      }
    }
  };

  const title = isEditing ? "Editar Presupuesto" : "Nuevo Presupuesto";
  const submitLabel = isEditing ? "Actualizar" : "Crear";
  const isSubmitting = createBudgetMutation.isPending || updateBudgetMutation.isPending;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{title}</h1>
          <Button
            variant="outline"
            onClick={() => {
              const projectId = form.getValues().projectId;
              setLocation(projectId ? `/projects/${projectId}/budgets` : "/budgets");
            }}
          >
            Volver
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Detalles del Presupuesto</CardTitle>
          </CardHeader>
          <CardContent>
            {isBudgetLoading && isEditing ? (
              <div className="text-center py-4">Cargando datos...</div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nombre del presupuesto" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descripción</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Descripción del presupuesto (opcional)"
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="projectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Proyecto</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                          disabled={!!initialProjectId || isEditing}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar proyecto" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {projects.map((project) => (
                              <SelectItem key={project.id} value={project.id.toString()}>
                                {project.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const projectId = form.getValues().projectId;
                        setLocation(projectId ? `/projects/${projectId}/budgets` : "/budgets");
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-primary hover:bg-primary/90"
                    >
                      {isSubmitting ? "Guardando..." : submitLabel}
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tareas del Presupuesto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <AddTaskForm 
                tasks={tasks} 
                onAddTask={handleAddTask}
                isSubmitting={addBudgetTaskMutation.isPending}
              />

              {isBudgetTasksLoading && isEditing ? (
                <div className="text-center py-4">Cargando tareas...</div>
              ) : (
                <BudgetTaskTable
                  budgetTasks={budgetTasks}
                  onRemoveTask={handleRemoveTask}
                  onEditTask={handleEditTask}
                  isEditing={isEditing}
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Edit Task Dialog */}
      <EditBudgetTaskDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        budgetTask={editingTask}
        onSave={handleUpdateTask}
      />
    </MainLayout>
  );
}
