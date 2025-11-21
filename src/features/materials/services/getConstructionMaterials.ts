/**
 * Get Construction Materials Service
 * 
 * Calcula los materiales necesarios para un proyecto de construcción.
 * Agrupa y suma cantidades de materiales por fase y tareas.
 */

import { supabase } from '@/lib/supabase';
import type { ConstructionMaterial, ConstructionMaterialsResult, ConstructionMaterialsParams } from '../types';

export async function getConstructionMaterials(
  params: ConstructionMaterialsParams
): Promise<ConstructionMaterialsResult> {
  const { projectId, organizationId, selectedPhase, filterTaskIds } = params;

  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  if (!organizationId) {
    throw new Error('organizationId is required for getConstructionMaterials');
  }

  // Get all construction tasks for this project using the view with phase information
  const { data: constructionTasksData, error: constructionTasksError } = await supabase
    .from('construction_tasks_view')
    .select(`
      id,
      task_id,
      quantity,
      project_id,
      phase_name
    `)
    .eq('project_id', projectId)
    .eq('organization_id', organizationId);

  if (constructionTasksError) {
    console.error('Error fetching construction tasks:', constructionTasksError);
    throw constructionTasksError;
  }

  if (!constructionTasksData || constructionTasksData.length === 0) {
    return { materials: [], phases: [] };
  }

  // Get unique phases for filter
  const uniquePhases = Array.from(
    new Set(constructionTasksData.map(ct => ct.phase_name).filter(Boolean))
  ).sort();

  // Filter construction tasks by selected phase if provided
  const shouldFilterByPhase = selectedPhase && selectedPhase.trim() !== '';
  let filteredConstructionTasks = shouldFilterByPhase
    ? constructionTasksData.filter(ct => ct.phase_name === selectedPhase)
    : constructionTasksData;

  // Filter by specific task IDs if provided
  if (filterTaskIds && filterTaskIds.length > 0) {
    filteredConstructionTasks = filteredConstructionTasks.filter(ct =>
      filterTaskIds.includes(ct.task_id)
    );
  }

  // Extract task IDs from filtered construction tasks
  const taskIds = filteredConstructionTasks.map(ct => ct.task_id);

  // Guard against empty arrays to prevent .in('task_id', []) errors
  if (taskIds.length === 0) {
    return { materials: [], phases: uniquePhases };
  }

  // Get task_materials for these tasks
  const { data, error } = await supabase
    .from('task_materials')
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
    .in('task_id', taskIds)
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error fetching task materials:', error);
    throw error;
  }

  // Group materials by material_id and sum quantities
  const materialMap = new Map<string, ConstructionMaterial>();

  data?.forEach((item: any) => {
    const material = item.materials;
    const category = material?.material_categories;

    if (material && category) {
      const existingMaterial = materialMap.get(material.id);

      // Multiply by ALL construction task quantities for this task_id
      const relatedConstructionTasks = filteredConstructionTasks.filter(
        (ct: any) => ct.task_id === item.task_id
      );
      const totalConstructionQuantity = relatedConstructionTasks.reduce(
        (sum, ct) => sum + (ct.quantity || 1), 
        0
      );
      const totalQuantity = (item.amount || 0) * totalConstructionQuantity;

      if (existingMaterial) {
        existingMaterial.computed_quantity += totalQuantity;
        existingMaterial.to_purchase_quantity = Math.max(
          0, 
          existingMaterial.computed_quantity - existingMaterial.purchased_quantity
        );

        // Recalculate commercial quantity
        if (existingMaterial.commercial_equivalence && existingMaterial.commercial_equivalence > 0) {
          existingMaterial.commercial_quantity = Math.ceil(
            existingMaterial.computed_quantity / existingMaterial.commercial_equivalence
          );
        }
      } else {
        const computedQty = totalQuantity;
        const purchasedQty = 0;

        // Get commercial unit information
        const unitPresentations = material.units?.unit_presentations || [];
        const preferredPresentation = 
          unitPresentations.find((up: any) => up.name !== 'Unidad' && up.equivalence > 1) ||
          unitPresentations[0];

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
          commercial_quantity: commercialQuantity,
        });
      }
    }
  });

  const materials = Array.from(materialMap.values()).sort((a, b) =>
    a.category_name.localeCompare(b.category_name) || a.name.localeCompare(b.name)
  );

  return { materials, phases: uniquePhases };
}
