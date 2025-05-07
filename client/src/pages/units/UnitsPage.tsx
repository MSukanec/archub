import React, { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { UNITS } from "@/lib/constants";
import { 
  LucideEdit, 
  LucideTrash, 
  LucidePlus, 
  LucideLoader2
} from "lucide-react";

interface Unit {
  id: number;
  name: string;
}

export default function UnitsPage() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [formData, setFormData] = useState({
    value: "",
    label: ""
  });

  // Query para obtener la lista de unidades
  const { data: units = [], isLoading } = useQuery<Unit[]>({
    queryKey: ['/api/units'],
    queryFn: async () => {
      try {
        // Si la API aún no está disponible, usamos las unidades de las constantes
        const response = await apiRequest("GET", "/api/units");
        const data = await response.json();
        return data;
      } catch (error) {
        console.error("Error al obtener unidades, usando valores por defecto:", error);
        // Usar valores de constante si la API falla
        return UNITS.map((unit, index) => ({
          id: index + 1,
          ...unit
        }));
      }
    }
  });

  // Mutación para crear una nueva unidad
  const createMutation = useMutation({
    mutationFn: async (formData: {value: string, label: string}) => {
      // Convertimos el formato del formulario al formato de la API
      const unitData = {
        name: formData.label || formData.value
      };
      const response = await apiRequest("POST", "/api/units", unitData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/units'] });
      resetForm();
      setIsDialogOpen(false);
      toast({
        title: "Unidad creada",
        description: "La unidad ha sido creada exitosamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo crear la unidad: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Mutación para actualizar una unidad existente
  const updateMutation = useMutation({
    mutationFn: async ({id, formData}: {id: number, formData: {value: string, label: string}}) => {
      // Convertimos el formato del formulario al formato de la API
      const unitData = {
        name: formData.label || formData.value
      };
      const response = await apiRequest("PATCH", `/api/units/${id}`, unitData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/units'] });
      resetForm();
      setIsDialogOpen(false);
      toast({
        title: "Unidad actualizada",
        description: "La unidad ha sido actualizada exitosamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo actualizar la unidad: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Mutación para eliminar una unidad
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      // No intentamos analizar la respuesta como JSON ya que será 204 No Content
      await apiRequest("DELETE", `/api/units/${id}`);
      return true;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/units'] });
      toast({
        title: "Unidad eliminada",
        description: "La unidad ha sido eliminada exitosamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo eliminar la unidad: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Función para resetear el formulario
  const resetForm = () => {
    setFormData({ value: "", label: "" });
    setSelectedUnit(null);
  };

  // Función para abrir el diálogo en modo creación
  const handleCreateClick = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  // Función para abrir el diálogo en modo edición
  const handleEditClick = (unit: Unit) => {
    setSelectedUnit(unit);
    // Extraemos el código básico del nombre completo si es posible
    // El nombre puede venir en formato "m2 (metro cuadrado)"
    const nameMatch = unit.name.match(/^([^ ]+)/);
    const extractedValue = nameMatch ? nameMatch[1] : unit.name;
    
    setFormData({
      value: extractedValue,
      label: unit.name
    });
    setIsDialogOpen(true);
  };

  // Función para manejar el envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.value || !formData.label) {
      toast({
        title: "Campos incompletos",
        description: "Todos los campos son obligatorios",
        variant: "destructive",
      });
      return;
    }

    if (selectedUnit) {
      // Actualizar unidad existente
      updateMutation.mutate({
        id: selectedUnit.id,
        formData: {
          value: formData.value,
          label: formData.label
        }
      });
    } else {
      // Crear nueva unidad
      createMutation.mutate({
        value: formData.value,
        label: formData.label
      });
    }
  };

  // Función para confirmar la eliminación de una unidad
  const handleDeleteClick = (id: number) => {
    if (window.confirm("¿Estás seguro de que deseas eliminar esta unidad?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6 h-full flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Unidades de Medida</h1>
          <Button 
            onClick={handleCreateClick}
            className="bg-primary hover:bg-primary/90 text-white"
          >
            <LucidePlus className="mr-2 h-4 w-4" />
            Nueva Unidad
          </Button>
        </div>

        <Card className="flex-1 overflow-auto">
          <CardHeader>
            <CardTitle>Lista de Unidades</CardTitle>
          </CardHeader>
          <CardContent className="overflow-auto">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <LucideLoader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : units.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No hay unidades definidas
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Código</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {units.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell>{unit.id}</TableCell>
                      <TableCell className="font-medium">{unit.value}</TableCell>
                      <TableCell>{unit.label}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditClick(unit)}
                        >
                          <LucideEdit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(unit.id)}
                        >
                          <LucideTrash className="h-4 w-4 text-red-500" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {selectedUnit ? "Editar Unidad" : "Crear Nueva Unidad"}
              </DialogTitle>
              <DialogDescription>
                Complete los campos para {selectedUnit ? "actualizar la" : "crear una nueva"} unidad de medida.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="value">Código</Label>
                  <Input
                    id="value"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                    placeholder="Ejemplo: m2"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="label">Descripción</Label>
                  <Input
                    id="label"
                    value={formData.label}
                    onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                    placeholder="Ejemplo: Metro cuadrado (m²)"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit"
                  className="bg-primary hover:bg-primary/90 text-white"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <LucideLoader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {selectedUnit ? "Actualizar" : "Crear"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}