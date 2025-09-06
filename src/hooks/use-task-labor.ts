import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export const useTaskLabor = (taskId: string | null) => {
  return useQuery({
    queryKey: ['task-labor', taskId],
    queryFn: async () => {
      if (!taskId) return []
      
      const { data, error } = await supabase
        .from('task_labor')
        .select(`
          id,
          task_id,
          labor_type_id,
          quantity,
          organization_id,
          labor_view!labor_types_labor_view(
            labor_id,
            labor_name,
            labor_description,
            unit_name,
            avg_price,
            current_price,
            current_currency_symbol
          )
        `)
        .eq('task_id', taskId)
      
      if (error) throw error
      return data || []
    },
    enabled: !!taskId
  })
}