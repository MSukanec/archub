import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Hook para obtener todos los costos de una tarea (materiales + mano de obra)
export function useTaskCosts(taskId: string | null) {
  return useQuery({
    queryKey: ["task-costs", taskId],
    queryFn: async () => {
      if (!supabase || !taskId) {
        throw new Error("Supabase client not initialized or no task ID provided");
      }

      console.log('Fetching task costs for task:', taskId);
      
      // Obtener materiales
      const { data: materials, error: materialsError } = await supabase
        .from("task_materials")
        .select(`
          id,
          task_id,
          material_id,
          amount,
          materials_view (
            id,
            name,
            unit_of_computation,
            avg_price,
            category_name
          )
        `)
        .eq("task_id", taskId);

      if (materialsError) {
        console.error("Error fetching task materials:", materialsError);
        throw materialsError;
      }

      // Obtener mano de obra
      const { data: labor, error: laborError } = await supabase
        .from("task_labor")
        .select(`
          id,
          task_id,
          labor_type_id,
          quantity,
          organization_id,
          labor_types:labor_type_id (
            id,
            name,
            description,
            unit_id,
            units:unit_id (
              id,
              name
            )
          )
        `)
        .eq("task_id", taskId);

      if (laborError) {
        console.error("Error fetching task labor:", laborError);
        throw laborError;
      }

      // Combinar ambos tipos de costos
      const combinedCosts = [
        ...(materials || []).map(material => {
          const materialView = Array.isArray(material.materials_view) ? material.materials_view[0] : material.materials_view;
          const unitPrice = materialView?.avg_price || 0;
          const quantity = material.amount || 0;
          const totalPrice = quantity * unitPrice;
          
          return {
            id: material.id,
            type: 'Material',
            name: materialView?.name || 'Material sin nombre',
            unit: materialView?.unit_of_computation || 'Unidad',
            quantity: quantity,
            unit_price: unitPrice,
            total_price: totalPrice,
            category: materialView?.category_name || 'Sin categoría',
            material_id: material.material_id
          };
        }),
        ...(labor || []).map(laborItem => {
          const laborType = Array.isArray(laborItem.labor_types) ? laborItem.labor_types[0] : laborItem.labor_types;
          const unit = Array.isArray(laborType?.units) ? laborType.units[0] : laborType?.units;
          
          return {
            id: laborItem.id,
            type: 'Mano de Obra',
            name: laborType?.name || 'Mano de obra sin nombre',
            unit: unit?.name || 'Unidad',
            quantity: laborItem.quantity || 0,
            unit_price: 0, // TODO: Implementar precios para mano de obra
            total_price: 0, // TODO: Calcular precio total
            category: 'Mano de Obra',
            labor_type_id: laborItem.labor_type_id
          };
        })
      ];

      return combinedCosts;
    },
    enabled: !!taskId && !!supabase
  });
}