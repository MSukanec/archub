import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface ConstructionPhase {
  id: string
  name: string
  position: number
  project_phase_id: string
}

export function useConstructionProjectPhases(projectId: string) {
  return useQuery({
    queryKey: ['construction-project-phases', projectId],
    queryFn: async (): Promise<ConstructionPhase[]> => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const { data, error } = await supabase
        .from('construction_project_phases')
        .select(`
          id,
          position,
          construction_phases (
            id,
            name
          )
        `)
        .eq('project_id', projectId)
        .order('position', { ascending: true })

      if (error) {
        console.error('Error fetching construction project phases:', error)
        throw error
      }

      return (data || []).map((item: any) => ({
        id: item.construction_phases?.id || '',
        name: item.construction_phases?.name || 'Sin nombre',
        position: item.position,
        project_phase_id: item.id
      }))
    },
    enabled: !!projectId,
  })
}