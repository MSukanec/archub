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
  phases?: { phase_name: string; quantity: number }[];
  // Información para cómputo comercial
  commercial_unit_name?: string;
  commercial_equivalence?: number;
  commercial_quantity?: number;
}

export interface ConstructionMaterialsResult {
  materials: ConstructionMaterial[];
  phases: string[];
}

export function useConstructionMaterials(projectId: string, selectedPhase?: string, filterTaskIds?: string[]) {
  return useQuery({
    queryKey: ["construction-materials", projectId, selectedPhase, filterTaskIds],
    queryFn: async (): Promise<ConstructionMaterialsResult> => {
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
          phase_name
        `)
        .eq("project_id", projectId);

      if (constructionTasksError) {
        console.error("Error fetching construction tasks:", constructionTasksError);
        throw constructionTasksError;
      }

      if (!constructionTasksData || constructionTasksData.length === 0) {
        return { materials: [], phases: [] };
      }

      // Get unique phases for filter
      const uniquePhases = Array.from(new Set(constructionTasksData.map(ct => ct.phase_name).filter(Boolean))).sort();

      // Filter construction tasks by selected phase if provided (only if not empty string)
      const shouldFilterByPhase = selectedPhase && selectedPhase.trim() !== '';
      let filteredConstructionTasks = shouldFilterByPhase
        ? constructionTasksData.filter(ct => ct.phase_name === selectedPhase)
        : constructionTasksData;
      
      // Filter by specific task IDs if provided (for budget-specific filtering)
      if (filterTaskIds && filterTaskIds.length > 0) {
        filteredConstructionTasks = filteredConstructionTasks.filter(ct => 
          filterTaskIds.includes(ct.task_id)
        );
        console.log("🎯 Budget Task Filter Debug:", {
          filterTaskIds,
          beforeFilter: shouldFilterByPhase ? 'already filtered by phase' : constructionTasksData.length,
          afterTaskIdFilter: filteredConstructionTasks.length,
          filteredTaskIds: filteredConstructionTasks.map(ct => ct.task_id)
        });
      }

      console.log("🔍 Filter Debug:", {
        selectedPhase: `'${selectedPhase}'`,
        shouldFilterByPhase,
        filterTaskIds: filterTaskIds || 'none',
        totalTasks: constructionTasksData.length,
        filteredTasks: filteredConstructionTasks.length,
        allPhases: uniquePhases
      });

      // DEBUG: Log construction tasks data to understand quantities and phases
      console.log("🔧 Construction Tasks Data:", filteredConstructionTasks.map(ct => ({
        id: ct.id,
        task_id: ct.task_id,
        quantity: ct.quantity,
        phase_name: ct.phase_name
      })));

      // Extract task IDs from filtered construction tasks
      const taskIds = filteredConstructionTasks.map(ct => ct.task_id);

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
              name,
              unit_presentations (
                id,
                name,
                equivalence
              )
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
          
          // For each task material, we need to multiply by ALL construction task quantities for this task_id
          const relatedConstructionTasks = filteredConstructionTasks.filter((ct: any) => ct.task_id === item.task_id);
          const totalConstructionQuantity = relatedConstructionTasks.reduce((sum, ct) => sum + (ct.quantity || 1), 0);
          const totalQuantity = (item.amount || 0) * totalConstructionQuantity;
          
          // Enhanced logging for deck specifically
          if (material.name.toLowerCase().includes('deck')) {
            console.log(`🎯 DECK DEBUG:`)
            console.log(`   - Material: ${material.name}`)
            console.log(`   - Task ID: ${item.task_id}`)
            console.log(`   - Material amount (per unit): ${item.amount}`)
            console.log(`   - Related construction tasks:`, relatedConstructionTasks.map(ct => `${ct.phase_name} (qty: ${ct.quantity})`))
            console.log(`   - Total construction quantity: ${totalConstructionQuantity}`)
            console.log(`   - Total quantity: ${totalQuantity}`)
            console.log(`   - Existing material in map:`, existingMaterial ? `YES (current: ${existingMaterial.computed_quantity})` : 'NO')
          }
          
          if (existingMaterial) {
            const previousQty = existingMaterial.computed_quantity;
            existingMaterial.computed_quantity += totalQuantity;
            
            // Enhanced logging for deck accumulation
            if (material.name.toLowerCase().includes('deck')) {
              console.log(`🔄 DECK ACCUMULATION:`)
              console.log(`   - Previous total: ${previousQty}`)
              console.log(`   - Adding: ${totalQuantity}`)
              console.log(`   - New total: ${existingMaterial.computed_quantity}`)
            }
            
            // Recalcular la cantidad a comprar y comercial
            existingMaterial.to_purchase_quantity = Math.max(0, existingMaterial.computed_quantity - existingMaterial.purchased_quantity);
            
            // Recalcular cómputo comercial
            if (existingMaterial.commercial_equivalence && existingMaterial.commercial_equivalence > 0) {
              existingMaterial.commercial_quantity = Math.ceil(existingMaterial.computed_quantity / existingMaterial.commercial_equivalence);
            }
          } else {
            const computedQty = totalQuantity;
            const purchasedQty = 0; // Future use
            
            // Información de unidad comercial - priorizar unidades comerciales apropiadas
            const unitPresentations = material.units?.unit_presentations || [];
            
            // Para unidades, priorizar presentaciones comerciales que no sean la unidad base
            let preferredPresentation = unitPresentations.find((up: any) => up.name !== 'Unidad' && up.equivalence > 1);
            
            // Si no hay presentación comercial, usar la primera disponible
            if (!preferredPresentation) {
              preferredPresentation = unitPresentations[0];
            }
            
            const commercialUnitName = preferredPresentation?.name;
            const commercialEquivalence = preferredPresentation?.equivalence;
            const commercialQuantity = commercialEquivalence && commercialEquivalence > 0 
              ? Math.ceil(computedQty / commercialEquivalence) 
              : undefined;

            
            materialMap.set(material.id, {
              id: material.id,
              name: material.name,
              category_id: category.id,
              category_name: category.name,
              unit_name: material.units?.name,
              computed_quantity: computedQty,
              purchased_quantity: purchasedQty,
              to_purchase_quantity: Math.max(0, computedQty - purchasedQty),
              commercial_unit_name: commercialUnitName,
              commercial_equivalence: commercialEquivalence,
              commercial_quantity: commercialQuantity
            });
            
            // Enhanced logging for deck first time
            if (material.name.toLowerCase().includes('deck')) {
              console.log(`🆕 DECK FIRST TIME:`)
              console.log(`   - Initial quantity: ${computedQty}`)
            }
          }
        }
      });

      const materials = Array.from(materialMap.values()).sort((a, b) => 
        a.category_name.localeCompare(b.category_name) || a.name.localeCompare(b.name)
      );
      
      console.log("Final materials result:", materials.length, "unique materials");
      return { materials, phases: uniquePhases };
    },
    enabled: !!projectId && !!supabase
  });
}