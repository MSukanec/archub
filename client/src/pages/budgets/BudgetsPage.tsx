import { useState } from "react";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { SearchInput } from "@/components/common/SearchInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { LucidePlus, LucideTrash, LucideEdit, LucideFileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Budget {
  id: number;
  name: string;
  description: string;
  projectId: number;
  createdAt: string;
  updatedAt: string;
}

interface Project {
  id: number;
  name: string;
  status: string;
}

interface BudgetsPageProps {
  projectId?: number;
}

export default function BudgetsPage({ projectId: initialProjectId }: BudgetsPageProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<number | undefined>(initialProjectId);

  // Fetch projects
  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  // Fetch budgets for the selected project
  const { data: budgets = [], isLoading } = useQuery<Budget[]>({
    queryKey: [`/api/projects/${selectedProjectId}/budgets`],
    enabled: !!selectedProjectId,
  });

  // Delete budget mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('DELETE', `/api/budgets/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Presupuesto eliminado",
        description: "El presupuesto ha sido eliminado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${selectedProjectId}/budgets`] });
      setBudgetToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo eliminar el presupuesto: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Filter budgets based on search term
  const filteredBudgets = budgets.filter(
    (budget) => budget.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = () => {
    if (budgetToDelete) {
      deleteMutation.mutate(budgetToDelete.id);
    }
  };

  const handleProjectChange = (value: string) => {
    const projectId = parseInt(value);
    setSelectedProjectId(projectId);
  };

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Presupuestos</h1>
        <Button 
          onClick={() => {
            if (selectedProjectId) {
              setLocation(`/projects/${selectedProjectId}/budgets/new`);
            } else {
              toast({
                title: "Selecciona un proyecto",
                description: "Debes seleccionar un proyecto para crear un presupuesto",
                variant: "destructive",
              });
            }
          }}
          className="bg-primary hover:bg-primary/90"
        >
          <LucidePlus className="mr-2 h-4 w-4" />
          Nuevo Presupuesto
        </Button>
      </div>

      <div className="grid gap-6 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <div className="w-full md:w-1/3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proyecto
                </label>
                <Select
                  value={selectedProjectId?.toString()}
                  onValueChange={handleProjectChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar proyecto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id.toString()}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-full md:w-2/3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <SearchInput
                  placeholder="Buscar presupuestos..."
                  onSearch={setSearchTerm}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {!selectedProjectId ? (
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              Selecciona un proyecto para ver sus presupuestos
            </CardContent>
          </Card>
        ) : (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Tareas</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Fecha de Creación</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Cargando presupuestos...
                      </TableCell>
                    </TableRow>
                  ) : filteredBudgets.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        No se encontraron presupuestos
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredBudgets.map((budget) => (
                      <TableRow key={budget.id}>
                        <TableCell className="font-medium">{budget.name}</TableCell>
                        <TableCell>{budget.description || "—"}</TableCell>
                        <TableCell>
                          {/* We'd fetch budget tasks count here in a real app */}
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                            {Math.floor(Math.random() * 10) + 1} tareas
                          </Badge>
                        </TableCell>
                        <TableCell>${(Math.random() * 100000).toFixed(2)}</TableCell>
                        <TableCell>
                          {new Date(budget.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setLocation(`/budgets/${budget.id}/edit`)}
                            >
                              <LucideEdit className="h-4 w-4" />
                              <span className="sr-only">Editar</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-primary hover:text-primary/90"
                              onClick={() => setLocation(`/budgets/${budget.id}`)}
                            >
                              <LucideFileText className="h-4 w-4" />
                              <span className="sr-only">Ver</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => setBudgetToDelete(budget)}
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
        )}
      </div>

      <AlertDialog 
        open={!!budgetToDelete} 
        onOpenChange={(open) => !open && setBudgetToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el presupuesto "{budgetToDelete?.name}".
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
