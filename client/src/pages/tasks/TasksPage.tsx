import { useState } from "react";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { SearchInput } from "@/components/common/SearchInput";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { apiRequest } from "@/lib/queryClient";
import { LucidePlus, LucideTrash, LucideEdit } from "lucide-react";

interface Task {
  id: number;
  name: string;
  category: string;
  unit: string;
  unitPrice: number;
  createdAt: string;
  updatedAt: string;
}

export default function TasksPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  // Fetch tasks
  const { data: tasks = [], isLoading } = useQuery<Task[]>({
    queryKey: ['/api/tasks'],
  });

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('DELETE', `/api/tasks/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Tarea eliminada",
        description: "La tarea ha sido eliminada correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setTaskToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo eliminar la tarea: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Filter tasks based on search term
  const filteredTasks = tasks.filter(
    (task) =>
      task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = () => {
    if (taskToDelete) {
      deleteMutation.mutate(taskToDelete.id);
    }
  };

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Tareas de Obra</h1>
        <Button 
          onClick={() => setLocation("/tasks/new")}
          className="bg-primary hover:bg-primary/90"
        >
          <LucidePlus className="mr-2 h-4 w-4" />
          Nueva Tarea
        </Button>
      </div>

      <div className="mb-6">
        <SearchInput
          placeholder="Buscar tareas..."
          onSearch={setSearchTerm}
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Unidad</TableHead>
                <TableHead>Precio Unitario</TableHead>
                <TableHead>Materiales</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Cargando tareas...
                  </TableCell>
                </TableRow>
              ) : filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No se encontraron tareas
                  </TableCell>
                </TableRow>
              ) : (
                filteredTasks.map((task) => (
                  <TableRow key={task.id}>
                    <TableCell className="font-medium">{task.name}</TableCell>
                    <TableCell>{task.category}</TableCell>
                    <TableCell>{task.unit}</TableCell>
                    <TableCell>${Number(task.unitPrice).toFixed(2)}</TableCell>
                    <TableCell>
                      {/* We'd fetch task materials count here in a real app */}
                      {Math.floor(Math.random() * 5) + 1} materiales
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/tasks/${task.id}/edit`)}
                        >
                          <LucideEdit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => setTaskToDelete(task)}
                        >
                          <LucideTrash className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <AlertDialog 
        open={!!taskToDelete} 
        onOpenChange={(open) => !open && setTaskToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la tarea "{taskToDelete?.name}".
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
