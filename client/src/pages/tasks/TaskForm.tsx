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
import { TASK_CATEGORIES, UNITS } from "@/lib/constants";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LucidePlus, LucideTrash } from "lucide-react";

// Form schema for the task
const taskSchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  category: z.string().min(1, "La categoría es requerida"),
  unit: z.string().min(1, "La unidad es requerida"),
  unitPrice: z.coerce.number().min(0, "El precio unitario debe ser un número positivo"),
});

type TaskFormValues = z.infer<typeof taskSchema>;

// Form schema for adding materials to task
const taskMaterialSchema = z.object({
  materialId: z.string().min(1, "El material es requerido"),
  quantity: z.coerce.number().min(0.01, "La cantidad debe ser mayor a 0"),
});

type TaskMaterialFormValues = z.infer<typeof taskMaterialSchema>;

interface Task {
  id: number;
  name: string;
  category: string;
  unit: string;
  unitPrice: number;
  createdAt: string;
  updatedAt: string;
}

interface Material {
  id: number;
  name: string;
  category: string;
  unit: string;
  unitPrice: number;
}

interface TaskMaterial {
  id: number;
  taskId: number;
  materialId: number;
  quantity: number;
  material?: Material; 
}

interface TaskFormProps {
  taskId?: string;
}

export default function TaskForm({ taskId }: TaskFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!taskId;
  const [taskMaterials, setTaskMaterials] = useState<TaskMaterial[]>([]);

  // Task form
  const taskForm = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: "",
      category: "",
      unit: "",
      unitPrice: 0,
    },
  });

  // Material form
  const materialForm = useForm<TaskMaterialFormValues>({
    resolver: zodResolver(taskMaterialSchema),
    defaultValues: {
      materialId: "",
      quantity: 0,
    },
  });

  // Fetch task if we're editing
  const { data: task, isLoading: isTaskLoading } = useQuery<Task>({
    queryKey: [`/api/tasks/${taskId}`],
    enabled: isEditing,
  });

  // Fetch materials
  const { data: materials = [] } = useQuery<Material[]>({
    queryKey: ['/api/materials'],
  });

  // Fetch task materials if editing
  const { data: fetchedTaskMaterials = [], isLoading: isTaskMaterialsLoading } = useQuery<TaskMaterial[]>({
    queryKey: [`/api/tasks/${taskId}/materials`],
    enabled: isEditing,
  });

  // Create task mutation
  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      const response = await apiRequest('POST', '/api/tasks', data);
      return await response.json();
    },
    onSuccess: (data) => {
      // Add materials to the new task
      const newTaskId = data.id;
      
      const materialPromises = taskMaterials.map(async (tm) => {
        const response = await apiRequest('POST', `/api/tasks/${newTaskId}/materials`, {
          materialId: tm.materialId,
          quantity: tm.quantity,
        });
        return response.json();
      });
      
      Promise.all(materialPromises)
        .then(() => {
          toast({
            title: "Tarea creada",
            description: "La tarea ha sido creada correctamente con todos los materiales",
          });
          queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
          setLocation("/tasks");
        })
        .catch(error => {
          toast({
            title: "Error",
            description: `Algunos materiales no pudieron ser añadidos: ${error}`,
            variant: "destructive",
          });
        });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo crear la tarea: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Update task mutation
  const updateTaskMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      const response = await apiRequest('PATCH', `/api/tasks/${taskId}`, data);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Tarea actualizada",
        description: "La tarea ha sido actualizada correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}`] });
      setLocation("/tasks");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo actualizar la tarea: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Add task material mutation
  const addTaskMaterialMutation = useMutation({
    mutationFn: async (data: {taskId: string, materialId: number, quantity: number}) => {
      const response = await apiRequest('POST', `/api/tasks/${data.taskId}/materials`, {
        materialId: data.materialId,
        quantity: data.quantity,
      });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Material añadido",
        description: "El material ha sido añadido a la tarea correctamente",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/materials`] });
      materialForm.reset({ materialId: "", quantity: 0 });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo añadir el material: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Delete task material mutation
  const deleteTaskMaterialMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/task-materials/${id}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Material eliminado",
        description: "El material ha sido eliminado de la tarea correctamente",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/tasks/${taskId}/materials`] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo eliminar el material: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Update form when task data is loaded
  useEffect(() => {
    if (task) {
      taskForm.reset({
        name: task.name,
        category: task.category,
        unit: task.unit,
        unitPrice: task.unitPrice,
      });
    }
  }, [task, taskForm]);

  // Update task materials when fetched
  useEffect(() => {
    if (fetchedTaskMaterials && fetchedTaskMaterials.length > 0) {
      // Merge with materials data to get material details
      const extendedTaskMaterials = fetchedTaskMaterials.map(tm => {
        const material = materials.find(m => m.id === tm.materialId);
        return {
          ...tm,
          material
        };
      });
      setTaskMaterials(extendedTaskMaterials);
    }
  }, [fetchedTaskMaterials, materials]);

  const onTaskSubmit = (data: TaskFormValues) => {
    if (isEditing) {
      updateTaskMutation.mutate(data);
    } else {
      createTaskMutation.mutate(data);
    }
  };

  const onAddMaterial = (data: TaskMaterialFormValues) => {
    if (isEditing) {
      // If editing an existing task, add material via API
      addTaskMaterialMutation.mutate({
        taskId: taskId as string,
        materialId: parseInt(data.materialId),
        quantity: data.quantity,
      });
    } else {
      // If creating a new task, add material to local state
      const materialId = parseInt(data.materialId);
      const material = materials.find(m => m.id === materialId);
      
      setTaskMaterials([
        ...taskMaterials,
        {
          id: -Math.random(), // Temporary negative ID for new items
          taskId: -1, // Will be assigned after task creation
          materialId: materialId,
          quantity: data.quantity,
          material
        }
      ]);
      
      materialForm.reset({ materialId: "", quantity: 0 });
      
      toast({
        title: "Material añadido",
        description: "El material ha sido añadido a la tarea",
      });
    }
  };

  const handleRemoveMaterial = (id: number) => {
    if (isEditing) {
      // If editing, remove from database
      deleteTaskMaterialMutation.mutate(id);
    } else {
      // If creating, remove from local state
      setTaskMaterials(taskMaterials.filter(tm => tm.id !== id));
      toast({
        title: "Material eliminado",
        description: "El material ha sido eliminado de la tarea",
      });
    }
  };

  const title = isEditing ? "Editar Tarea" : "Nueva Tarea";
  const submitLabel = isEditing ? "Actualizar" : "Crear";
  const isSubmitting = createTaskMutation.isPending || updateTaskMutation.isPending;

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{title}</h1>
          <Button
            variant="outline"
            onClick={() => setLocation("/tasks")}
          >
            Volver
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Detalles de la Tarea</CardTitle>
          </CardHeader>
          <CardContent>
            {isTaskLoading && isEditing ? (
              <div className="text-center py-4">Cargando datos...</div>
            ) : (
              <Form {...taskForm}>
                <form onSubmit={taskForm.handleSubmit(onTaskSubmit)} className="space-y-6">
                  <FormField
                    control={taskForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nombre de la tarea" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={taskForm.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoría</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar categoría" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {TASK_CATEGORIES.map((category) => (
                              <SelectItem key={category.value} value={category.value}>
                                {category.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={taskForm.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidad</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar unidad" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {UNITS.map((unit) => (
                              <SelectItem key={unit.value} value={unit.value}>
                                {unit.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={taskForm.control}
                    name="unitPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Precio Unitario</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLocation("/tasks")}
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
            <CardTitle>Materiales</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...materialForm}>
              <form onSubmit={materialForm.handleSubmit(onAddMaterial)} className="space-y-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={materialForm.control}
                    name="materialId"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Material</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar material" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {materials.map((material) => (
                              <SelectItem key={material.id} value={material.id.toString()}>
                                {material.name} ({material.unit})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={materialForm.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cantidad</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="md:col-span-3 flex justify-end">
                    <Button
                      type="submit"
                      className="bg-primary hover:bg-primary/90"
                      disabled={addTaskMaterialMutation.isPending}
                    >
                      <LucidePlus className="mr-2 h-4 w-4" />
                      {addTaskMaterialMutation.isPending ? "Agregando..." : "Agregar Material"}
                    </Button>
                  </div>
                </div>
              </form>

              {(isTaskMaterialsLoading && isEditing) ? (
                <div className="text-center py-4">Cargando materiales...</div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {taskMaterials.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                            No hay materiales añadidos
                          </TableCell>
                        </TableRow>
                      ) : (
                        taskMaterials.map((tm) => (
                          <TableRow key={tm.id}>
                            <TableCell className="font-medium">{tm.material?.name || '—'}</TableCell>
                            <TableCell>{tm.material?.category || '—'}</TableCell>
                            <TableCell>{tm.material?.unit || '—'}</TableCell>
                            <TableCell>{tm.quantity}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => handleRemoveMaterial(tm.id)}
                                disabled={deleteTaskMaterialMutation.isPending}
                              >
                                <LucideTrash className="h-4 w-4" />
                                <span className="sr-only">Eliminar</span>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </Form>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
