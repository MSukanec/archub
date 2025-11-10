import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'

export interface ConstructionPhase {
  id: string
  name: string
  position: number
  project_phase_id: string
  phase_id?: string
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
          phase_id,
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
            phase_id: item.phase_id, // Agregar phase_id para el upsert
            taskCount: count || 0
          }
        })
      )

      return phasesWithCount
    },
    enabled: !!projectId,
  })
}

export function useConstructionPhases(organizationId: string) {
  return useQuery({
    queryKey: ['construction-phases', organizationId],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const { data, error } = await supabase
        .from('construction_phases')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name', { ascending: true })

      if (error) {
        console.error('Error fetching construction phases:', error)
        throw error
      }

      return data || []
    },
    enabled: !!organizationId,
  })
}

export function useCreateConstructionPhase() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (phaseData: {
      projectId: string
      organizationId: string
      name: string
      description?: string
      createdBy: string
      useExisting?: boolean
      existingPhaseId?: string
    }) => {
      if (!supabase) throw new Error('Supabase not initialized')

      let phaseId = phaseData.existingPhaseId

      // Si no está usando una fase existente, crear nueva fase
      if (!phaseData.useExisting) {
        const { data: newPhase, error: phaseError } = await supabase
          .from('construction_phases')
          .insert({
            name: phaseData.name,
            description: phaseData.description,
            organization_id: phaseData.organizationId
          })
          .select()
          .single()

        if (phaseError) {
          console.error('Error creating phase:', phaseError)
          throw phaseError
        }

        phaseId = newPhase.id
      }

      // Obtener la próxima posición
      const { count } = await supabase
        .from('construction_project_phases')
        .select('*', { count: 'exact', head: true })
        .eq('project_id', phaseData.projectId)

      const nextPosition = (count || 0) + 1

      // Crear relación proyecto-fase
      const { data: projectPhase, error: projectPhaseError } = await supabase
        .from('construction_project_phases')
        .insert({
          project_id: phaseData.projectId,
          phase_id: phaseId,
          position: nextPosition,
          created_by: phaseData.createdBy
        })
        .select()
        .single()

      if (projectPhaseError) {
        console.error('Error creating project phase:', projectPhaseError)
        throw projectPhaseError
      }

      return { success: true, projectPhase }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['construction-project-phases', variables.projectId] 
      })
      queryClient.invalidateQueries({ 
        queryKey: ['construction-tasks', variables.projectId] 
      })
      
      toast({
        title: "Fase creada exitosamente",
        description: "La nueva fase ha sido agregada al proyecto."
      })
    },
    onError: (error) => {
      console.error('Error creating phase:', error)
      toast({
        title: "Error al crear fase",
        description: "No se pudo crear la fase. Inténtalo de nuevo.",
        variant: "destructive"
      })
    }
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

      // Actualizar posiciones en lote incluyendo project_id y phase_id
      const updates = phases.map(phase => ({
        id: phase.project_phase_id,
        project_id: projectId, // Incluir project_id requerido
        phase_id: phase.phase_id, // Incluir phase_id requerido
        position: phase.position
      }))

      // Debug logs removed

      const { error, data } = await supabase
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