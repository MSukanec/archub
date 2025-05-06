import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { SidebarTypes } from "@/components/layout/Sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, ArrowLeft, Plus } from "lucide-react";
import { SearchInput } from "@/components/SearchInput";
import { apiRequest, getQueryFn } from "@/lib/queryClient";

interface Material {
  id: number;
  name: string;
  category: string;
  unit: string;
  unitPrice: number | string;
}

interface TaskMaterial {
  id: number;
  taskId: number;
  materialId: number;
  quantity: number | string;
  material?: Material;
}

interface BudgetTask {
  id: number;
  budgetId: number;
  taskId: number;
  quantity: number | string;
  task?: {
    id: number;
    name: string;
  };
}

interface Budget {
  id: number;
  name: string;
  projectId: number;
}

interface MaterialWithQuantity extends Material {
  totalQuantity: number;
  sources: {
    budgetName: string;
    budgetId: number;
    quantity: number;
  }[];
}

interface ProjectMaterialsPageProps {
  projectId: string;
}

export default function ProjectMaterialsPage({ projectId }: ProjectMaterialsPageProps) {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [materialsList, setMaterialsList] = useState<MaterialWithQuantity[]>([]);
  const [materialsByCategory, setMaterialsByCategory] = useState<Record<string, MaterialWithQuantity[]>>({});
  const [selectedTab, setSelectedTab] = useState<string>("all");

  // Obtener los presupuestos del proyecto
  const { data: budgets = [], isLoading: isLoadingBudgets } = useQuery<Budget[]>({
    queryKey: [`/api/projects/${projectId}/budgets`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!projectId,
  });

  // Obtener todos los materiales para referencia
  const { data: allMaterials = [], isLoading: isLoadingMaterials } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Para cada presupuesto, obtener sus tareas
  const { data: budgetTasksMap = {}, isLoading: isLoadingBudgetTasks } = useQuery<Record<number, BudgetTask[]>>({
    queryKey: [`/api/projects/${projectId}/budget-tasks`],
    queryFn: async () => {
      const budgetTasks: Record<number, BudgetTask[]> = {};
      
      if (Array.isArray(budgets) && budgets.length > 0) {
        for (const budget of budgets) {
          const response = await apiRequest('GET', `/api/budgets/${budget.id}/tasks`);
          const tasks = await response.json();
          budgetTasks[budget.id] = tasks;
        }
      }
      
      return budgetTasks;
    },
    enabled: Array.isArray(budgets) && budgets.length > 0,
  });

  // Obtener los materiales para cada tarea
  const { data: taskMaterialsMap = {}, isLoading: isLoadingTaskMaterials } = useQuery<Record<number, TaskMaterial[]>>({
    queryKey: [`/api/projects/${projectId}/task-materials`],
    queryFn: async () => {
      const taskMaterials: Record<number, TaskMaterial[]> = {};
      const tasks: number[] = [];
      
      // Recopilar todas las tareas de todos los presupuestos
      if (budgetTasksMap) {
        Object.values(budgetTasksMap).forEach(budgetTasks => {
          budgetTasks.forEach(bt => {
            if (!tasks.includes(bt.taskId)) {
              tasks.push(bt.taskId);
            }
          });
        });
      }
      
      // Obtener los materiales para cada tarea
      for (let i = 0; i < tasks.length; i++) {
        const taskId = tasks[i];
        const response = await apiRequest('GET', `/api/tasks/${taskId}/materials`);
        const materials = await response.json();
        taskMaterials[taskId] = materials;
      }
      
      return taskMaterials;
    },
    enabled: Object.keys(budgetTasksMap).length > 0 && !isLoadingBudgetTasks,
  });

  // Calcular la lista completa de materiales con sus cantidades
  useEffect(() => {
    if (isLoadingBudgets || isLoadingBudgetTasks || isLoadingTaskMaterials || isLoadingMaterials) {
      return;
    }

    const materialsMap = new Map<number, Material>();
    allMaterials.forEach(material => {
      materialsMap.set(material.id, material);
    });

    // Mapa para acumular cantidades de materiales
    const materialTotals = new Map<number, MaterialWithQuantity>();

    // Para cada presupuesto
    Object.entries(budgetTasksMap).forEach(([budgetId, budgetTasks]) => {
      const budget = budgets.find(b => b.id === parseInt(budgetId));
      if (!budget) return;

      // Para cada tarea en el presupuesto
      budgetTasks.forEach(budgetTask => {
        const taskMaterials = taskMaterialsMap[budgetTask.taskId] || [];
        
        // Para cada material en la tarea
        taskMaterials.forEach(taskMaterial => {
          const material = materialsMap.get(taskMaterial.materialId);
          if (!material) return;

          // Convertir cantidades a números
          const taskQuantity = typeof budgetTask.quantity === 'string' 
            ? parseFloat(budgetTask.quantity) 
            : budgetTask.quantity;
            
          const materialQuantity = typeof taskMaterial.quantity === 'string' 
            ? parseFloat(taskMaterial.quantity) 
            : taskMaterial.quantity;
          
          // Cantidad total de este material en este presupuesto/tarea
          const totalQuantity = taskQuantity * materialQuantity;
          
          // Si ya tenemos este material, actualizamos la cantidad
          if (materialTotals.has(material.id)) {
            const existingMaterial = materialTotals.get(material.id)!;
            existingMaterial.totalQuantity += totalQuantity;
            
            // Añadir la fuente (presupuesto) de este material
            existingMaterial.sources.push({
              budgetName: budget.name,
              budgetId: budget.id,
              quantity: totalQuantity
            });
          } else {
            // Si es la primera vez que vemos este material
            materialTotals.set(material.id, {
              ...material,
              totalQuantity,
              sources: [{
                budgetName: budget.name,
                budgetId: budget.id,
                quantity: totalQuantity
              }]
            });
          }
        });
      });
    });

    // Convertir el mapa a array y ordenar por categoría
    const materials = Array.from(materialTotals.values());
    
    // Agrupar por categoría
    const groupedByCategory = materials.reduce<Record<string, MaterialWithQuantity[]>>((acc, material) => {
      const category = material.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(material);
      return acc;
    }, {});

    setMaterialsList(materials);
    setMaterialsByCategory(groupedByCategory);
  }, [
    budgets, 
    allMaterials, 
    budgetTasksMap, 
    taskMaterialsMap, 
    isLoadingBudgets, 
    isLoadingBudgetTasks, 
    isLoadingTaskMaterials, 
    isLoadingMaterials
  ]);

  // Filtrar materiales por término de búsqueda
  const filteredMaterials = materialsList.filter(material => 
    material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filtrar materiales por categoría seleccionada
  const displayedMaterials = selectedTab === 'all' 
    ? filteredMaterials 
    : filteredMaterials.filter(m => m.category === selectedTab);

  // Obtener la lista de categorías únicas
  const categories = Array.from(new Set(materialsList.map(m => m.category)));

  const isLoading = isLoadingBudgets || isLoadingBudgetTasks || isLoadingTaskMaterials || isLoadingMaterials;

  return (
    <MainLayout
      sidebarType={SidebarTypes.ProjectSidebar}
      selectedProject={projectId}
    >
      <div className="px-4 md:px-6 py-4">
        {/* Back button and title */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => setLocation(`/projects/${projectId}`)}
              className="mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al proyecto
            </Button>
            <h1 className="text-2xl font-bold">Lista de Materiales del Proyecto</h1>
          </div>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="w-full md:w-1/2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Buscar
                </label>
                <SearchInput
                  placeholder="Buscar materiales..."
                  onSearch={setSearchTerm}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : materialsList.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <h3 className="text-lg font-medium text-gray-900 mb-1">No hay materiales</h3>
              <p className="text-gray-500 mb-4">
                Este proyecto aún no tiene presupuestos con materiales asignados.
              </p>
              <Button 
                onClick={() => setLocation(`/projects/${projectId}/budgets/new`)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Crear Presupuesto
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div>
            <Tabs defaultValue="all" onValueChange={setSelectedTab}>
              <div className="border-b mb-4">
                <TabsList className="w-full justify-start overflow-x-auto">
                  <TabsTrigger value="all">Todos</TabsTrigger>
                  {categories.map(category => (
                    <TabsTrigger key={category} value={category}>
                      {category}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
              
              <TabsContent value={selectedTab} className="mt-0">
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead className="text-right">Cantidad Total</TableHead>
                        <TableHead className="text-right">Precio Unitario</TableHead>
                        <TableHead className="text-right">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {displayedMaterials.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                            No se encontraron materiales
                          </TableCell>
                        </TableRow>
                      ) : (
                        displayedMaterials.map((material) => {
                          const unitPrice = typeof material.unitPrice === 'string' 
                            ? parseFloat(material.unitPrice) 
                            : material.unitPrice;
                          const subtotal = material.totalQuantity * unitPrice;
                          
                          return (
                            <TableRow key={material.id}>
                              <TableCell className="font-medium">{material.name}</TableCell>
                              <TableCell>{material.category}</TableCell>
                              <TableCell>{material.unit}</TableCell>
                              <TableCell className="text-right">{material.totalQuantity.toFixed(2)}</TableCell>
                              <TableCell className="text-right">${unitPrice.toFixed(2)}</TableCell>
                              <TableCell className="text-right">${subtotal.toFixed(2)}</TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                {displayedMaterials.length > 0 && (
                  <div className="mt-4 p-4 border rounded-md bg-gray-50">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total:</span>
                      <span className="text-lg font-bold">
                        $
                        {displayedMaterials
                          .reduce((total, material) => {
                            const unitPrice = typeof material.unitPrice === 'string' 
                              ? parseFloat(material.unitPrice) 
                              : material.unitPrice;
                            return total + (material.totalQuantity * unitPrice);
                          }, 0)
                          .toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}
      </div>
    </MainLayout>
  );
}