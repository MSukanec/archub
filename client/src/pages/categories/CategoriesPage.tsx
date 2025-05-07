import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Edit, Plus, Save, Trash2, X } from "lucide-react";

import { MainLayout } from "@/components/layout/MainLayout";
import { SidebarTypes } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { MATERIAL_CATEGORIES } from "@/lib/constants";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CategoriesPage() {
  const { toast } = useToast();
  // Extraer solo las etiquetas de las categorías
  const [categories, setCategories] = useState<string[]>(
    MATERIAL_CATEGORIES.map(cat => cat.label)
  );
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Editar una categoría
  const handleEdit = (index: number) => {
    setEditingIndex(index);
    setEditValue(categories[index]);
  };

  // Guardar los cambios de una categoría
  const handleSave = (index: number) => {
    if (editValue.trim() === "") {
      toast({
        title: "Error",
        description: "El nombre de la categoría no puede estar vacío",
        variant: "destructive"
      });
      return;
    }

    if (categories.includes(editValue) && categories[index] !== editValue) {
      toast({
        title: "Error",
        description: "Ya existe una categoría con este nombre",
        variant: "destructive"
      });
      return;
    }

    const newCategories = [...categories];
    newCategories[index] = editValue;
    setCategories(newCategories);
    setEditingIndex(null);
    
    toast({
      title: "Categoría actualizada",
      description: `La categoría ha sido actualizada correctamente.`
    });
  };

  // Agregar una nueva categoría
  const handleAddNew = () => {
    if (newCategory.trim() === "") {
      toast({
        title: "Error",
        description: "El nombre de la categoría no puede estar vacío",
        variant: "destructive"
      });
      return;
    }

    if (categories.includes(newCategory)) {
      toast({
        title: "Error",
        description: "Ya existe una categoría con este nombre",
        variant: "destructive"
      });
      return;
    }

    setCategories([...categories, newCategory]);
    setNewCategory("");
    setIsAddingNew(false);
    
    toast({
      title: "Categoría agregada",
      description: `La categoría "${newCategory}" ha sido agregada correctamente.`
    });
  };

  // Eliminar una categoría
  const handleDelete = (index: number) => {
    const categoryToDelete = categories[index];
    
    // Aquí deberíamos verificar si la categoría está siendo utilizada por algún material
    // Por ahora solo mostramos una alerta
    toast({
      title: "Categoría eliminada",
      description: `La categoría "${categoryToDelete}" ha sido eliminada correctamente.`
    });
    
    const newCategories = [...categories];
    newCategories.splice(index, 1);
    setCategories(newCategories);
  };

  // Cancelar la edición
  const handleCancel = () => {
    setEditingIndex(null);
    setIsAddingNew(false);
  };

  return (
    <MainLayout sidebarType={SidebarTypes.SettingsSidebar}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Categorías de Materiales</h1>
          
          {!isAddingNew && (
            <Button 
              onClick={() => setIsAddingNew(true)}
              className="bg-primary hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Nueva Categoría
            </Button>
          )}
        </div>
        
        <Alert className="mb-6 bg-blue-50 text-blue-800 border-blue-200">
          <AlertDescription>
            Las categorías te permiten organizar los materiales para encontrarlos más fácilmente. 
            Las categorías se utilizan en la lista de materiales del proyecto.
          </AlertDescription>
        </Alert>
        
        <Card>
          <CardHeader>
            <CardTitle>Lista de Categorías</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {categories.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  {editingIndex === index ? (
                    <div className="flex-1 flex items-center gap-2">
                      <Input 
                        value={editValue} 
                        onChange={(e) => setEditValue(e.target.value)}
                        className="flex-1"
                        autoFocus
                      />
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={() => handleSave(index)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Save className="h-4 w-4" />
                        <span className="sr-only">Guardar</span>
                      </Button>
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        onClick={handleCancel}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                        <span className="sr-only">Cancelar</span>
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium">{category}</span>
                      <div className="flex items-center gap-2">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => handleEdit(index)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          onClick={() => handleDelete(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Eliminar</span>
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
              
              {/* Formulario para agregar nueva categoría */}
              {isAddingNew && (
                <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                  <div className="flex-1 flex items-center gap-2">
                    <Input 
                      value={newCategory} 
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Nombre de la nueva categoría"
                      className="flex-1"
                      autoFocus
                    />
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={handleAddNew}
                      className="text-green-600 hover:text-green-700 hover:bg-green-50"
                    >
                      <Save className="h-4 w-4" />
                      <span className="sr-only">Guardar</span>
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      onClick={handleCancel}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Cancelar</span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}