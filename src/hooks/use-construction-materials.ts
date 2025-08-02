import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface ConstructionMaterial {
  id: string;
  name: string;
  category_id: string;
  category_name: string;
  unit_name?: string;
  computed_quantity: number;
  purchased_quantity: number;
  to_purchase_quantity: number;
}

export function useConstructionMaterials(projectId: string) {
  return useQuery({
    queryKey: ["construction-materials", projectId],
    queryFn: async (): Promise<ConstructionMaterial[]> => {
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      // Get all construction tasks for this project using the view with phase information
      const { data: constructionTasksData, error: constructionTasksError } = await supabase
        .from("construction_tasks_view")
        .select(`
          id,
          task_id,
          quantity,
          project_id,
          phase_name,
          phase_position
        `)
        .eq("project_id", projectId);

      if (constructionTasksError) {
        console.error("Error fetching construction tasks:", constructionTasksError);
        throw constructionTasksError;
      }

      if (!constructionTasksData || constructionTasksData.length === 0) {
        return [];
      }

      // DEBUG: Log construction tasks data to understand quantities and phases
      console.log("🔧 Construction Tasks Data:", constructionTasksData.map(ct => ({
        id: ct.id,
        task_id: ct.task_id,
        quantity: ct.quantity,
        phase_name: ct.phase_name,
        phase_position: ct.phase_position
      })));

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
            unit_id,
            material_categories:category_id (
              id,
              name
            ),
            units:unit_id (
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
          
          // Enhanced logging for porcelanato specifically
          if (material.name.toLowerCase().includes('porcelanato 60x60')) {
            console.log(`🎯 PORCELANATO DEBUG:`)
            console.log(`   - Material: ${material.name}`)
            console.log(`   - Task ID: ${item.task_id}`)
            console.log(`   - Material amount (per unit): ${item.amount}`)
            console.log(`   - Construction task quantity: ${constructionTaskQuantity}`)
            console.log(`   - Phase: ${constructionTask?.phase_name || 'Sin fase'} (pos: ${constructionTask?.phase_position || 'N/A'})`)
            console.log(`   - Total quantity: ${totalQuantity}`)
            console.log(`   - Construction task:`, constructionTask)
            console.log(`   - Existing material in map:`, existingMaterial)
          }
          
          if (existingMaterial) {
            const previousQty = existingMaterial.computed_quantity;
            existingMaterial.computed_quantity += totalQuantity;
            
            // Enhanced logging for porcelanato accumulation
            if (material.name.toLowerCase().includes('porcelanato 60x60')) {
              console.log(`🔄 PORCELANATO ACCUMULATION:`)
              console.log(`   - Previous total: ${previousQty}`)
              console.log(`   - Adding: ${totalQuantity}`)
              console.log(`   - New total: ${existingMaterial.computed_quantity}`)
            }
            
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
              unit_name: material.units?.name,
              computed_quantity: computedQty,
              purchased_quantity: purchasedQty,
              to_purchase_quantity: Math.max(0, computedQty - purchasedQty)
            });
            
            // Enhanced logging for porcelanato first time
            if (material.name.toLowerCase().includes('porcelanato 60x60')) {
              console.log(`🆕 PORCELANATO FIRST TIME:`)
              console.log(`   - Initial quantity: ${computedQty}`)
            }
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