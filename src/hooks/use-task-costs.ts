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

      // Obtener mano de obra básico
      const { data: laborBasic, error: laborError } = await supabase
        .from("task_labor")
        .select(`
          id,
          task_id,
          labor_type_id,
          quantity,
          organization_id
        `)
        .eq("task_id", taskId);

      if (laborError) {
        console.error("Error fetching task labor:", laborError);
        throw laborError;
      }
      
      // Para cada item de mano de obra, obtener los datos desde labor_view
      const labor = await Promise.all(
        (laborBasic || []).map(async (laborItem) => {
          const { data: laborView, error: laborViewError } = await supabase
            .from('labor_view')
            .select('*')
            .eq('labor_id', laborItem.labor_type_id)
            .single()
            
          if (laborViewError) {
            console.warn('Error fetching labor view:', laborViewError)
            return { ...laborItem, labor_view: null }
          }
          
          return { ...laborItem, labor_view: laborView }
        })
      )

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
          const laborView = Array.isArray(laborItem.labor_view) ? laborItem.labor_view[0] : laborItem.labor_view;
          const unitPrice = laborView?.avg_price || 0;
          const quantity = laborItem.quantity || 0;
          const totalPrice = quantity * unitPrice;
          
          return {
            id: laborItem.id,
            type: 'Mano de Obra',
            name: laborView?.labor_name || 'Mano de obra sin nombre',
            unit: laborView?.unit_name || 'Unidad',
            quantity: quantity,
            unit_price: unitPrice,
            total_price: totalPrice,
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