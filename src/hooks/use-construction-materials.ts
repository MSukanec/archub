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

      // Get all materials from tasks that are in budgets for this project
      const { data, error } = await supabase
        .from("task_materials")
        .select(`
          id,
          task_id,
          material_id,
          quantity,
          materials:material_id (
            id,
            name,
            category_id,
            material_categories:category_id (
              id,
              name
            )
          ),
          budget_tasks!inner (
            id,
            budget_id,
            budgets!inner (
              id,
              project_id
            )
          )
        `)
        .eq("budget_tasks.budgets.project_id", projectId);

      if (error) {
        console.error("Error fetching construction materials:", error);
        throw error;
      }

      console.log("Construction materials data received:", data);

      // Group materials by material_id and sum quantities
      const materialMap = new Map<string, ConstructionMaterial>();

      data?.forEach((item: any) => {
        const material = item.materials;
        const category = material?.material_categories;
        
        if (material && category) {
          const existingMaterial = materialMap.get(material.id);
          
          if (existingMaterial) {
            existingMaterial.computed_quantity += item.quantity || 0;
          } else {
            materialMap.set(material.id, {
              id: material.id,
              name: material.name,
              category_id: category.id,
              category_name: category.name,
              computed_quantity: item.quantity || 0,
              purchased_quantity: 0, // Future use
              to_purchase_quantity: 0, // Future use
            });
          }
        }
      });

      return Array.from(materialMap.values()).sort((a, b) => 
        a.category_name.localeCompare(b.category_name) || a.name.localeCompare(b.name)
      );
    },
    enabled: !!projectId && !!supabase
  });
}