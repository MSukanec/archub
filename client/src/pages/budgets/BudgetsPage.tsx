import { useState } from "react";
import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { SearchInput } from "@/components/common/SearchInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
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

interface Budget {
  id: number;
  name: string;
  description: string;
  userId: number;
  createdAt: string;
  updatedAt: string;
}

export default function BudgetsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [budgetToDelete, setBudgetToDelete] = useState<Budget | null>(null);

  // Fetch all budgets for the current user
  const { data: budgets = [], isLoading } = useQuery<Budget[]>({
    queryKey: ["/api/budgets"],
    enabled: !!user,
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
      queryClient.invalidateQueries({ queryKey: ["/api/budgets"] });
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
    (budget) => budget.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
               (budget.description && budget.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDelete = () => {
    if (budgetToDelete) {
      deleteMutation.mutate(budgetToDelete.id);
    }
  };

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Presupuestos</h1>
        <Button 
          onClick={() => setLocation('/budgets/new')}
          className="bg-primary hover:bg-primary/90"
        >
          <LucidePlus className="mr-2 h-4 w-4" />
          Nuevo Presupuesto
        </Button>
      </div>

      <div className="grid gap-6 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <div className="w-full">
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
