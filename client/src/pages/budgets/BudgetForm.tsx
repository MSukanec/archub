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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { BudgetTaskTable } from "@/components/budgets/BudgetTaskTable";
import { AddTaskForm } from "@/components/budgets/AddTaskForm";
import { EditBudgetTaskDialog } from "@/components/budgets/EditBudgetTaskDialog";
import { BudgetMaterialsList } from "@/components/budgets/BudgetMaterialsList";
import { useAuth } from "@/hooks/use-auth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
  projectId?: number;
  readOnly?: boolean;
}

export default function BudgetForm({ budgetId, projectId, readOnly = false }: BudgetFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isEditing = !!budgetId;
  const [budgetTasks, setBudgetTasks] = useState<BudgetTask[]>([]);
  const [editingTask, setEditingTask] = useState<BudgetTask | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  // Fetch budget if we're editing
  const { data: budget, isLoading: isBudgetLoading } = useQuery<Budget>({
    queryKey: [`/api/budgets/${budgetId}`],
    enabled: isEditing,
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
      if (!user) {
        throw new Error("Debes estar autenticado para crear un presupuesto");
      }

      // Create budget - si hay projectId, usar la ruta específica del proyecto
      const endpoint = projectId 
        ? `/api/projects/${projectId}/budgets`
        : '/api/budgets';
        
      const response = await apiRequest('POST', endpoint, {
        name: data.name,
        description: data.description,
        userId: user.id
      });
      
      // Add budget tasks
      const budget = await response.json();
      const newBudgetId = budget.id;
      
      const taskPromises = budgetTasks.map(bt => {
        return apiRequest('POST', `/api/budgets/${newBudgetId}/tasks`, {
          taskId: bt.taskId,
          quantity: bt.quantity.toString(), // Convertir a string para cumplir con las expectativas del API
        });
      });
      
      await Promise.all(taskPromises);
      
      return budget;
    },
    onSuccess: () => {
      toast({
        title: "Presupuesto creado",
        description: "El presupuesto ha sido creado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/budgets'] });
      
      // Si hay projectId, redirigir a la página del proyecto, si no a la lista de presupuestos
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}/budgets`] });
        setLocation(`/projects/${projectId}`);
      } else {
        setLocation('/budgets');
      }
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
    onSuccess: () => {
      toast({
        title: "Presupuesto actualizado",
        description: "El presupuesto ha sido actualizado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/budgets'] });
      queryClient.invalidateQueries({ queryKey: [`/api/budgets/${budgetId}`] });
      setLocation('/budgets');
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
        quantity: data.quantity.toString(), // Convertir a string para el API
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
        quantity: data.quantity.toString(), // Convertir a string para el API
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

  const handleEditTask = (index: number, task: BudgetTask) => {
    setEditingTask(task);
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

  const title = readOnly ? "Detalles del Presupuesto" : (isEditing ? "Editar Presupuesto" : "Nuevo Presupuesto");
  const submitLabel = isEditing ? "Actualizar" : "Crear";
  const isSubmitting = createBudgetMutation.isPending || updateBudgetMutation.isPending;

  return (
    <MainLayout>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{title}</h1>
          <Button
            variant="outline"
            onClick={() => projectId ? setLocation(`/projects/${projectId}`) : setLocation('/budgets')}
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
                          <Input {...field} placeholder="Nombre del presupuesto" readOnly={readOnly} />
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
                            readOnly={readOnly}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {!readOnly && (
                    <div className="flex justify-end space-x-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => projectId ? setLocation(`/projects/${projectId}`) : setLocation('/budgets')}
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
                  )}
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        {/* Contenedor dividido en dos columnas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna izquierda: Tareas */}
          <Card className="h-full">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle>Tareas del Presupuesto</CardTitle>
              {(readOnly && isEditing) && (
                <Button 
                  size="sm"
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => setLocation(`/budgets/${budgetId}/edit`)}
                >
                  Editar Tareas
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {(!readOnly || (readOnly && isEditing)) && (
                  <AddTaskForm 
                    tasks={tasks} 
                    onAddTask={handleAddTask}
                    isSubmitting={addBudgetTaskMutation.isPending}
                  />
                )}

                {isBudgetTasksLoading && isEditing ? (
                  <div className="text-center py-4">Cargando tareas...</div>
                ) : (
                  <BudgetTaskTable
                    budgetTasks={budgetTasks}
                    onRemoveTask={(!readOnly || (readOnly && isEditing)) ? handleRemoveTask : undefined}
                    onEditTask={(!readOnly || (readOnly && isEditing)) ? (index, task) => handleEditTask(index, task) : undefined}
                    isEditing={!readOnly || (readOnly && isEditing)}
                  />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Columna derecha: Materiales */}
          {(isEditing || readOnly) && budgetId ? (
            <BudgetMaterialsList budgetId={parseInt(budgetId)} />
          ) : (
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle>Lista de Materiales</CardTitle>
              </CardHeader>
              <CardContent>
                {budgetTasks.length > 0 ? (
                  <div className="space-y-4">
                    <div className="p-4 border rounded">
                      <h3 className="text-lg font-medium mb-2">Materiales necesarios</h3>
                      <div className="text-sm text-muted-foreground">
                        Los materiales se calcularán automáticamente al guardar el presupuesto
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 text-center text-muted-foreground">
                    Agregue tareas al presupuesto para ver los materiales necesarios
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
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
