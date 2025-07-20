import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface ConstructionMaterial {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  computed_quantity: number;
  purchased_quantity: number;
  to_purchase_quantity: number;
}

export function useConstructionMaterials(projectId: string) {
  return useQuery({
    queryKey: ["construction-materials", projectId],
    queryFn: async (): Promise<ConstructionMaterial[]> => {
      console.log("Fetching construction materials for project:", projectId);
      
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      // Get all construction tasks for this project
      const { data: constructionTasksData, error: constructionTasksError } = await supabase
        .from("construction_tasks")
        .select(`
          id,
          task_id,
          quantity,
          project_id,
          organization_id
        `)
        .eq("project_id", projectId);

      if (constructionTasksError) {
        console.error("Error fetching construction tasks:", constructionTasksError);
        throw constructionTasksError;
      }

      if (!constructionTasksData || constructionTasksData.length === 0) {
        console.log("No construction tasks found for project:", projectId);
        return [];
      }

      console.log("Construction tasks found:", constructionTasksData.length);

      // Extract task IDs from construction tasks
      const taskIds = constructionTasksData.map(ct => ct.task_id);

      // Now get task_materials for these tasks
      const { data, error } = await supabase
        .from("task_materials")
        .select(`
          id,
          task_id,
          material_id,
          amount,
          materials:material_id (
            id,
            name,
            category_id,
            material_categories:category_id (
              id,
              name
            )
          )
        `)
        .in("task_id", taskIds);

      if (error) {
        console.error("Error fetching task materials:", error);
        throw error;
      }

      console.log("Task materials data received:", data?.length || 0, "materials");

      // Group materials by material_id and sum quantities
      const materialMap = new Map<string, ConstructionMaterial>();

      data?.forEach((item: any) => {
        const material = item.materials;
        const category = material?.material_categories;
        
        if (material && category) {
          const existingMaterial = materialMap.get(material.id);
          
          // For each task material, we need to multiply by the construction task quantity
          const constructionTask = constructionTasksData.find((ct: any) => ct.task_id === item.task_id);
          const constructionTaskQuantity = constructionTask?.quantity || 1;
          const totalQuantity = (item.amount || 0) * constructionTaskQuantity;
          
          console.log(`Material: ${material.name}, amount: ${item.amount}, construction qty: ${constructionTaskQuantity}, total: ${totalQuantity}`);
          
          if (existingMaterial) {
            existingMaterial.computed_quantity += totalQuantity;
            // Recalcular la cantidad a comprar
            existingMaterial.to_purchase_quantity = Math.max(0, existingMaterial.computed_quantity - existingMaterial.purchased_quantity);
          } else {
            const computedQty = totalQuantity;
            const purchasedQty = 0; // Future use
            materialMap.set(material.id, {
              id: material.id,
              name: material.name,
              category_id: category.id,
              category_name: category.name,
              computed_quantity: computedQty,
              purchased_quantity: purchasedQty,
              to_purchase_quantity: Math.max(0, computedQty - purchasedQty)
            });
          }
        }
      });

      const result = Array.from(materialMap.values()).sort((a, b) => 
        a.category_name.localeCompare(b.category_name) || a.name.localeCompare(b.name)
      );
      
      console.log("Final materials result:", result.length, "unique materials");
      return result;
    },
    enabled: !!projectId && !!supabase
  });
}