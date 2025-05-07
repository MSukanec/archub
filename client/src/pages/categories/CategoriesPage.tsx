import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, ChevronsUpDown, Edit, FileDown, FileUp, Loader2, Plus, RotateCcw, Save, Trash2, X } from "lucide-react";

import { MainLayout } from "@/components/layout/MainLayout";
import { SidebarTypes } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { THEME_COLORS } from "@/lib/constants";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Definición de tipos
interface Category {
  id: number;
  name: string;
  type: string;
  position: number;
  parentId: number | null;
  children?: Category[];
}

interface EditingCategory {
  id: number;
  name: string;
  parentId: number | null;
}

export default function CategoriesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("material");
  const [editingCategory, setEditingCategory] = useState<EditingCategory | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", parentId: null as number | null });
  const [expandedCategories, setExpandedCategories] = useState<number[]>([]);

  // Consultar categorías desde el API
  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories', { type: activeTab }],
  });

  // Mutación para crear nueva categoría
  const createMutation = useMutation({
    mutationFn: (data: { name: string; type: string; parentId: number | null }) => {
      return apiRequest('POST', '/api/categories', {
        name: data.name,
        type: data.type,
        parentId: data.parentId
      });
    },
    onSuccess: () => {
      toast({
        title: "Categoría creada",
        description: "La categoría ha sido creada correctamente"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setIsAddDialogOpen(false);
      setNewCategory({ name: "", parentId: null });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo crear la categoría: ${error}`,
        variant: "destructive"
      });
    }
  });

  // Mutación para actualizar categoría
  const updateMutation = useMutation({
    mutationFn: (data: { id: number; name: string; parentId: number | null }) => {
      return apiRequest('PATCH', `/api/categories/${data.id}`, {
        name: data.name,
        parentId: data.parentId
      });
    },
    onSuccess: () => {
      toast({
        title: "Categoría actualizada",
        description: "La categoría ha sido actualizada correctamente"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      setEditingCategory(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo actualizar la categoría: ${error}`,
        variant: "destructive"
      });
    }
  });

  // Mutación para actualizar posición de categoría
  const updatePositionMutation = useMutation({
    mutationFn: (data: { id: number; position: number }) => {
      return apiRequest('PATCH', `/api/categories/${data.id}/position`, {
        position: data.position
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo actualizar la posición: ${error}`,
        variant: "destructive"
      });
    }
  });

  // Mutación para eliminar categoría
  const deleteMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('DELETE', `/api/categories/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Categoría eliminada",
        description: "La categoría ha sido eliminada correctamente"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `No se pudo eliminar la categoría: ${error}`,
        variant: "destructive"
      });
    }
  });

  // Manejar el cambio de tipo de categoría (Material/Tarea)
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setEditingCategory(null);
  };

  // Agregar nueva categoría
  const handleAddCategory = () => {
    if (!newCategory.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la categoría no puede estar vacío",
        variant: "destructive"
      });
      return;
    }

    createMutation.mutate({
      name: newCategory.name,
      type: activeTab,
      parentId: newCategory.parentId
    });
  };

  // Iniciar edición de categoría
  const handleEditStart = (category: Category) => {
    setEditingCategory({
      id: category.id,
      name: category.name,
      parentId: category.parentId
    });
  };

  // Guardar edición de categoría
  const handleSaveEdit = () => {
    if (!editingCategory) return;
    
    if (!editingCategory.name.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la categoría no puede estar vacío",
        variant: "destructive"
      });
      return;
    }

    updateMutation.mutate({
      id: editingCategory.id,
      name: editingCategory.name,
      parentId: editingCategory.parentId
    });
  };

  // Mover categoría hacia arriba (disminuir posición)
  const handleMoveUp = (category: Category, index: number, categories: Category[]) => {
    if (index > 0) {
      const newPosition = categories[index - 1].position;
      updatePositionMutation.mutate({
        id: category.id,
        position: newPosition
      });
    }
  };

  // Mover categoría hacia abajo (aumentar posición)
  const handleMoveDown = (category: Category, index: number, categories: Category[]) => {
    if (index < categories.length - 1) {
      const newPosition = categories[index + 1].position;
      updatePositionMutation.mutate({
        id: category.id,
        position: newPosition
      });
    }
  };

  // Eliminar categoría
  const handleDelete = (id: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta categoría? Si tiene subcategorías, éstas se moverán al nivel superior.')) {
      deleteMutation.mutate(id);
    }
  };

  // Alternar expansión de una categoría
  const toggleExpand = (id: number) => {
    if (expandedCategories.includes(id)) {
      setExpandedCategories(expandedCategories.filter(catId => catId !== id));
    } else {
      setExpandedCategories([...expandedCategories, id]);
    }
  };

  // Renderizar categoría y sus hijos (recursivo)
  const renderCategory = (category: Category, index: number, siblings: Category[], level = 0) => {
    const isExpanded = expandedCategories.includes(category.id);
    const hasChildren = category.children && category.children.length > 0;
    
    return (
      <div key={category.id} className="category-item">
        <div 
          className={`flex items-center justify-between p-3 border rounded-lg mb-1 ${
            editingCategory?.id === category.id ? 'border-primary' : ''
          }`}
          style={{ marginLeft: `${level * 1.5}rem` }}
        >
          {editingCategory?.id === category.id ? (
            <div className="flex-1 flex items-center gap-2">
              <Input 
                value={editingCategory.name} 
                onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                className="flex-1"
                autoFocus
              />
              <Select 
                value={editingCategory.parentId?.toString() || ""} 
                onValueChange={(value) => setEditingCategory({
                  ...editingCategory,
                  parentId: value === "" ? null : parseInt(value)
                })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Categoría padre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin categoría padre</SelectItem>
                  {categories
                    .filter(cat => cat.id !== category.id && !checkIsDescendant(cat, category.id))
                    .map(cat => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
              <Button 
                size="sm" 
                onClick={handleSaveEdit}
                variant="default"
                className="bg-primary hover:bg-primary/90"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
              <Button 
                size="sm" 
                onClick={() => setEditingCategory(null)}
                variant="outline"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                {hasChildren && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="p-0 h-6 w-6"
                    onClick={() => toggleExpand(category.id)}
                  >
                    <ChevronRight className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </Button>
                )}
                {!hasChildren && <div className="w-6"></div>}
                <span className="font-medium">{category.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button 
                  size="sm" 
                  onClick={() => handleMoveUp(category, index, siblings)}
                  variant="ghost"
                  className="p-1 h-7 w-7"
                  disabled={index === 0 || updatePositionMutation.isPending}
                >
                  <FileUp className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => handleMoveDown(category, index, siblings)}
                  variant="ghost"
                  className="p-1 h-7 w-7"
                  disabled={index === siblings.length - 1 || updatePositionMutation.isPending}
                >
                  <FileDown className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => handleEditStart(category)}
                  variant="ghost"
                  className="p-1 h-7 w-7"
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => handleDelete(category.id)}
                  variant="ghost"
                  className="p-1 h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Renderizar hijos si hay y está expandido */}
        {hasChildren && isExpanded && (
          <div className="ml-4">
            {category.children!.map((child, childIndex) => 
              renderCategory(child, childIndex, category.children!, level + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  // Verificar si una categoría es descendiente de otra (para prevenir ciclos)
  const checkIsDescendant = (category: Category, targetId: number): boolean => {
    if (!category.children || category.children.length === 0) return false;
    
    for (const child of category.children) {
      if (child.id === targetId) return true;
      if (checkIsDescendant(child, targetId)) return true;
    }
    
    return false;
  };

  // Verificar si hay categorías de nivel superior
  const hasRootCategories = categories.some(cat => !cat.parentId);

  return (
    <MainLayout sidebarType={SidebarTypes.SettingsSidebar}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Categorías</h1>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Nueva Categoría
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Crear Nueva Categoría</DialogTitle>
                <DialogDescription>
                  Ingresa la información para la nueva categoría.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium" htmlFor="category-name">Nombre de la categoría</label>
                  <Input
                    id="category-name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    placeholder="Nombre de la categoría"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Categoría padre (opcional)</label>
                  <Select 
                    value={newCategory.parentId?.toString() || ""} 
                    onValueChange={(value) => setNewCategory({
                      ...newCategory,
                      parentId: value === "" ? null : parseInt(value)
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sin categoría padre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin categoría padre</SelectItem>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleAddCategory}
                  className="bg-primary hover:bg-primary/90"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Crear Categoría
                    </>
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <Alert className="mb-6 bg-blue-50 text-blue-800 border-blue-200">
          <AlertDescription>
            Las categorías te permiten organizar los materiales y tareas en una estructura jerárquica.
            Puedes crear categorías principales y subcategorías para una mejor organización.
          </AlertDescription>
        </Alert>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="mb-6">
          <TabsList>
            <TabsTrigger value="material">Materiales</TabsTrigger>
            <TabsTrigger value="task">Tareas</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Card>
          <CardHeader>
            <CardTitle>Categorías de {activeTab === "material" ? "Materiales" : "Tareas"}</CardTitle>
            <CardDescription>
              {activeTab === "material" 
                ? "Organiza tus materiales por categorías para facilitar su búsqueda y gestión." 
                : "Organiza las tareas por categorías para una mejor planificación de presupuestos."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : categories.length === 0 ? (
              <div className="text-center p-8 text-muted-foreground">
                <p>No hay categorías disponibles.</p>
                <p className="mt-2">Crea una nueva categoría para empezar.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Renderizar solo categorías de nivel superior y sus hijos recursivamente */}
                {categories
                  .filter(cat => !cat.parentId)
                  .map((category, index, rootCategories) => 
                    renderCategory(category, index, rootCategories)
                  )}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between border-t p-4">
            <div className="text-sm text-muted-foreground">
              {categories.length} categorías en total
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/categories'] })}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Refrescar
            </Button>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
}