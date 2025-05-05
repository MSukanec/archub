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

interface Material {
  id: number;
  name: string;
  category: string;
  unit: string;
  unitPrice: number;
  createdAt: string;
  updatedAt: string;
}

export default function MaterialsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);

  // Fetch materials
  const { data: materials = [], isLoading } = useQuery<Material[]>({
    queryKey: ['/api/materials'],
  });

  // Delete material mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('DELETE', `/api/materials/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Material eliminado",
        description: "El material ha sido eliminado correctamente",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/materials'] });
      setMaterialToDelete(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo eliminar el material: ${error}`,
        variant: "destructive",
      });
    },
  });

  // Filter materials based on search term
  const filteredMaterials = materials.filter(
    (material) =>
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = () => {
    if (materialToDelete) {
      deleteMutation.mutate(materialToDelete.id);
    }
  };

  return (
    <MainLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Materiales Unitarios</h1>
        <Button 
          onClick={() => setLocation("/materials/new")}
          className="bg-primary hover:bg-primary/90"
        >
          <LucidePlus className="mr-2 h-4 w-4" />
          Nuevo Material
        </Button>
      </div>

      <div className="mb-6">
        <SearchInput
          placeholder="Buscar materiales..."
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
                <TableHead>Fecha de Creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Cargando materiales...
                  </TableCell>
                </TableRow>
              ) : filteredMaterials.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No se encontraron materiales
                  </TableCell>
                </TableRow>
              ) : (
                filteredMaterials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell className="font-medium">{material.name}</TableCell>
                    <TableCell>{material.category}</TableCell>
                    <TableCell>{material.unit}</TableCell>
                    <TableCell>${Number(material.unitPrice).toFixed(2)}</TableCell>
                    <TableCell>
                      {new Date(material.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setLocation(`/materials/${material.id}/edit`)}
                        >
                          <LucideEdit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => setMaterialToDelete(material)}
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
        open={!!materialToDelete} 
        onOpenChange={(open) => !open && setMaterialToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente el material "{materialToDelete?.name}".
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
