import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface MovementProjectClientAssignment {
  id: string
  movement_id: string
  project_client_id: string
  created_at: string
  updated_at?: string
  project_clients?: {
    id: string
    organization_id: string
    project_id: string
    client_id: string

    created_at: string
    contact: {
      id: string
      first_name: string
      last_name: string
      company_name: string
      email: string
      phone: string
      full_name: string
    }
  }
}

export interface CreateMovementProjectClientAssignment {
  movement_id: string
  project_client_id: string
}

export interface UpdateMovementProjectClientAssignment {
  movement_id: string
  project_client_id: string
}

// Hook para obtener asignaciones de clientes de un movimiento
export function useMovementProjectClients(movementId?: string) {
  return useQuery({
    queryKey: ['movement-project-clients', movementId],
    queryFn: async (): Promise<MovementProjectClientAssignment[]> => {
      if (!supabase || !movementId) {
        return []
      }

      console.log('🔍 Fetching movement project client assignments for movement:', movementId)

      const { data, error } = await supabase
        .from('movement_clients')
        .select(`
          id,
          movement_id,
          project_client_id,
          created_at,
          updated_at,
          project_clients!inner(
            id,
            organization_id,
            project_id,
            client_id,

            created_at,
            contact:client_id(
              id,
              first_name,
              last_name,
              company_name,
              email,
              phone,
              full_name
            )
          )
        `)
        .eq('movement_id', movementId)

      console.log('📊 Movement project client assignments query result:', { data, error, count: data?.length || 0 })

      if (error) {
        console.error('❌ Error fetching movement project client assignments:', error)
        throw error
      }

      return (data || []) as MovementProjectClientAssignment[]
    },
    enabled: !!movementId && !!supabase,
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
}

// Hook para crear asignaciones de clientes para un movimiento
export function useCreateMovementProjectClients() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (assignments: CreateMovementProjectClientAssignment[]) => {
      if (!supabase || !assignments.length) {
        throw new Error('No assignments provided')
      }

      console.log('💾 Creating movement project client assignments:', assignments.length)

      const { data, error } = await supabase
        .from('movement_clients')
        .insert(assignments)
        .select()

      if (error) {
        console.error('❌ Error creating movement project client assignments:', error)
        throw error
      }

      console.log('✅ Movement project client assignments created successfully:', data?.length || 0)
      return data
    },
    onSuccess: (data, variables) => {
      // Invalidar caché para el movimiento específico
      const movementId = variables[0]?.movement_id
      if (movementId) {
        queryClient.invalidateQueries({ queryKey: ['movement-project-clients', movementId] })
        queryClient.invalidateQueries({ queryKey: ['movements'] })
      }
    },
  })
}

// Hook para actualizar asignaciones de clientes para un movimiento
export function useUpdateMovementProjectClients() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ movementId, assignments }: { 
      movementId: string
      assignments: UpdateMovementProjectClientAssignment[] 
    }) => {
      if (!supabase || !movementId) {
        throw new Error('Missing required parameters')
      }

      console.log('🔄 Updating movement project client assignments for movement:', movementId)

      // Primero eliminamos todas las asignaciones existentes
      const { error: deleteError } = await supabase
        .from('movement_clients')
        .delete()
        .eq('movement_id', movementId)

      if (deleteError) {
        console.error('❌ Error deleting existing movement project client assignments:', deleteError)
        throw deleteError
      }

      console.log('🗑️ Existing movement project client assignments deleted')

      // Si hay nuevas asignaciones, las creamos
      if (assignments.length > 0) {
        const { data, error } = await supabase
          .from('movement_clients')
          .insert(assignments.map(assignment => ({
            movement_id: movementId,
            project_client_id: assignment.project_client_id
          })))
          .select()

        if (error) {
          console.error('❌ Error creating new movement project client assignments:', error)
          throw error
        }

        console.log('✅ New movement project client assignments created:', data?.length || 0)
        return data
      }

      console.log('✅ Movement project client assignments updated (no new assignments)')
      return []
    },
    onSuccess: (data, variables) => {
      // Invalidar caché para el movimiento específico
      queryClient.invalidateQueries({ queryKey: ['movement-project-clients', variables.movementId] })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
    },
  })
}