import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export const useTaskLabor = (taskId: string | null) => {
  return useQuery({
    queryKey: ['task-labor', taskId, 'labor-view'],
    queryFn: async () => {
      if (!taskId) return []
      
      const { data, error } = await supabase
        .from('task_labor')
        .select(`
          id,
          task_id,
          labor_type_id,
          quantity,
          organization_id
        `)
        .eq('task_id', taskId)
        
      if (error) throw error
      
      // Para cada item de mano de obra, obtener los datos desde labor_view
      const laborWithPrices = await Promise.all(
        (data || []).map(async (laborItem) => {
          const { data: laborView, error: laborError } = await supabase
            .from('labor_view')
            .select('*')
            .eq('labor_id', laborItem.labor_type_id)
            .single()
            
          if (laborError) {
            return { ...laborItem, labor_view: null }
          }
          
          return { ...laborItem, labor_view: laborView }
        })
      )
      
      return laborWithPrices
    },
    enabled: !!taskId
  })
}