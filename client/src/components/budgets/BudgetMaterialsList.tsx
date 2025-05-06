import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Material, TaskMaterial } from "@shared/schema";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState, useEffect } from "react";

interface BudgetMaterialsListProps {
  budgetId: number;
}

type MaterialWithQuantity = Material & { totalQuantity: number };

interface BudgetTask {
  id: number;
  budgetId: number;
  taskId: number;
  quantity: number;
}

export function BudgetMaterialsList({ budgetId }: BudgetMaterialsListProps) {
  const [materialsList, setMaterialsList] = useState<MaterialWithQuantity[]>([]);
  const [materialsByCategory, setMaterialsByCategory] = useState<Record<string, MaterialWithQuantity[]>>({});

  // Obtener las tareas del presupuesto
  const { data: budgetTasks, isLoading: isLoadingTasks } = useQuery<BudgetTask[]>({
    queryKey: [`/api/budgets/${budgetId}/tasks`],
    queryFn: getQueryFn({ on401: "throw" }),
    enabled: !!budgetId,
  });

  // Obtener todas las tareas y materiales para tener los datos completos
  const { data: allTasks, isLoading: isLoadingAllTasks } = useQuery<any[]>({
    queryKey: ["/api/tasks"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  const { data: allMaterials, isLoading: isLoadingAllMaterials } = useQuery<Material[]>({
    queryKey: ["/api/materials"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Cargar los materiales para cada tarea en el presupuesto
  const taskMaterialsQueries = (budgetTasks || []).map((budgetTask) => {
    return useQuery<TaskMaterial[]>({
      queryKey: [`/api/tasks/${budgetTask.taskId}/materials`],
      queryFn: getQueryFn({ on401: "throw" }),
      enabled: !!budgetTasks?.length,
    });
  });

  const isLoading = 
    isLoadingTasks || 
    isLoadingAllTasks || 
    isLoadingAllMaterials || 
    (taskMaterialsQueries.length > 0 && taskMaterialsQueries.some(q => q.isLoading));

  // Procesar datos cuando estén disponibles
  useEffect(() => {
    if (!budgetTasks || !allTasks || !allMaterials || taskMaterialsQueries.some(q => !q.data)) {
      return;
    }

    // Preparamos un mapa de tareas por ID para buscar datos fácilmente
    const tasksMap = new Map();
    allTasks.forEach((task) => {
      tasksMap.set(task.id, task);
    });

    // Preparamos un mapa de materiales por ID para buscar datos fácilmente
    const materialsMap = new Map();
    allMaterials.forEach((material) => {
      materialsMap.set(material.id, material);
    });

    // Calcular la cantidad total de cada material
    const materialQuantities = new Map<number, number>();
    
    taskMaterialsQueries.forEach((query, index) => {
      if (query.data && budgetTasks[index]) {
        const budgetTask = budgetTasks[index];
        const taskMaterials = query.data;
        
        taskMaterials.forEach((taskMaterial) => {
          const currentQuantity = materialQuantities.get(taskMaterial.materialId) || 0;
          // Convertir a número para asegurar operaciones numéricas correctas
          const taskQuantity = typeof budgetTask.quantity === 'string' ? parseFloat(budgetTask.quantity) : budgetTask.quantity;
          const materialQuantity = typeof taskMaterial.quantity === 'string' ? parseFloat(taskMaterial.quantity) : taskMaterial.quantity;
          
          // Multiplicar la cantidad de material por la cantidad de la tarea en el presupuesto
          const additionalQuantity = materialQuantity * taskQuantity;
          materialQuantities.set(taskMaterial.materialId, currentQuantity + additionalQuantity);
        });
      }
    });

    // Crear la lista de materiales con sus cantidades totales
    const materials: MaterialWithQuantity[] = [];
    materialQuantities.forEach((quantity, materialId) => {
      const material = materialsMap.get(materialId);
      if (material) {
        materials.push({
          ...material,
          totalQuantity: quantity,
        });
      }
    });

    // Agrupar materiales por categoría
    const groupedByCategory = materials.reduce((acc: Record<string, MaterialWithQuantity[]>, material) => {
      const category = material.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(material);
      return acc;
    }, {});

    setMaterialsList(materials);
    setMaterialsByCategory(groupedByCategory);
  }, [budgetTasks, allTasks, allMaterials, taskMaterialsQueries]);

  if (isLoading) {
    return (
      <Card className="h-full overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle>Lista de Materiales</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle>Lista de Materiales</CardTitle>
      </CardHeader>
      <CardContent className="overflow-auto p-0">
        {materialsList.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No hay materiales en este presupuesto
          </div>
        ) : (
          <div className="p-4">
            {Object.entries(materialsByCategory).map(([category, materials]) => (
              <div key={category} className="mb-6">
                <h3 className="text-lg font-medium mb-2">{category}</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Material</TableHead>
                      <TableHead>Unidad</TableHead>
                      <TableHead className="text-right">Cantidad Total</TableHead>
                      <TableHead className="text-right">Precio Unitario</TableHead>
                      <TableHead className="text-right">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materials.map((material) => {
                      const unitPrice = typeof material.unitPrice === 'string' ? parseFloat(material.unitPrice) : material.unitPrice;
                      const subtotal = material.totalQuantity * unitPrice;
                      return (
                        <TableRow key={material.id}>
                          <TableCell>{material.name}</TableCell>
                          <TableCell>{material.unit}</TableCell>
                          <TableCell className="text-right">{material.totalQuantity.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${unitPrice.toFixed(2)}</TableCell>
                          <TableCell className="text-right">${subtotal.toFixed(2)}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ))}

            <div className="mt-4 text-right font-medium">
              Total de Materiales: $
              {materialsList
                .reduce((total, material) => {
                  const unitPrice = typeof material.unitPrice === 'string' ? parseFloat(material.unitPrice) : material.unitPrice;
                  return total + (material.totalQuantity * unitPrice);
                }, 0)
                .toFixed(2)}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
