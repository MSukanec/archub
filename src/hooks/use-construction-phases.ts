import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'

export interface ConstructionPhase {
  id: string
  name: string
  position: number
  project_phase_id: string
  taskCount?: number
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

      // Para cada fase, obtener el conteo de tareas de forma separada
      const phasesWithCount = await Promise.all(
        (data || []).map(async (item: any) => {
          const { count } = await supabase
            .from('construction_tasks')
            .select('*', { count: 'exact', head: true })
            .eq('project_id', projectId)
            .eq('phase_instance_id', item.id)

          return {
            id: item.construction_phases?.id || '',
            name: item.construction_phases?.name || 'Sin nombre',
            position: item.position,
            project_phase_id: item.id,
            taskCount: count || 0
          }
        })
      )

      return phasesWithCount
    },
    enabled: !!projectId,
  })
}

export function useUpdatePhasePositions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      projectId, 
      phases 
    }: { 
      projectId: string
      phases: ConstructionPhase[] 
    }) => {
      if (!supabase) throw new Error('Supabase not initialized')

      // Actualizar posiciones en lote
      const updates = phases.map(phase => ({
        id: phase.project_phase_id,
        position: phase.position
      }))

      const { error } = await supabase
        .from('construction_project_phases')
        .upsert(updates, { onConflict: 'id' })

      if (error) {
        console.error('Error updating phase positions:', error)
        throw error
      }

      return { success: true }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['construction-project-phases', variables.projectId] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['construction-tasks', variables.projectId] 
      })
      
      toast({
        title: "Orden actualizado",
        description: "El orden de las fases ha sido actualizado correctamente."
      })
    },
    onError: (error) => {
      console.error('Error updating phase positions:', error)
      toast({
        title: "Error al actualizar",
        description: "No se pudo actualizar el orden de las fases. Inténtalo de nuevo.",
        variant: "destructive"
      })
    }
  })
}