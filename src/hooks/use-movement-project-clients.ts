import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface MovementProjectClientAssignment {
  id: string
  movement_id: string
  project_client_id: string
  project_installment_id?: string
  created_at: string
  updated_at?: string
  project_clients?: {
    id: string
    organization_id: string
    project_id: string
    client_id: string
    unit: string
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
  project_installments?: {
    id: string
    number: number
  }
}

export interface CreateMovementProjectClientAssignment {
  movement_id: string
  project_client_id: string
  project_installment_id?: string
}

export interface UpdateMovementProjectClientAssignment {
  project_client_id: string
  project_installment_id?: string
}

// Hook para obtener asignaciones de clientes de un movimiento
export function useMovementProjectClients(movementId?: string) {
  return useQuery({
    queryKey: ['movement-project-clients', movementId],
    queryFn: async (): Promise<MovementProjectClientAssignment[]> => {
      if (!supabase || !movementId) {
        return []
      }


      // Use MOVEMENT_PAYMENTS_VIEW for simplified queries
      const { data, error } = await supabase
        .from('movement_payments_view')
        .select('*')
        .eq('movement_id', movementId)


      if (error) {
        throw error
      }

      // Transform MOVEMENT_PAYMENTS_VIEW data to match MovementProjectClientAssignment interface
      const transformedData = (data || []).map(payment => ({
        id: payment.movement_client_id,
        movement_id: payment.movement_id,
        project_client_id: payment.project_client_id,
        project_installment_id: payment.project_installment_id,
        created_at: new Date().toISOString(), // Vista no incluye fechas
        updated_at: new Date().toISOString(),
        project_clients: {
          id: payment.project_client_id,
          organization_id: payment.organization_id,
          project_id: payment.project_id,
          client_id: payment.client_id,
          unit: payment.unit,
          created_at: new Date().toISOString(),
          contact: {
            id: payment.client_id,
            first_name: payment.client_name?.split(' ')[0] || '',
            last_name: payment.client_name?.split(' ').slice(1).join(' ') || '',
            company_name: '',
            email: '',
            phone: '',
            full_name: payment.client_name
          }
        },
        project_installments: payment.project_installment_id ? {
          id: payment.project_installment_id,
          number: payment.installment_number
        } : null
      }))
      
      return transformedData as MovementProjectClientAssignment[]
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


      const { data, error } = await supabase
        .from('movement_clients')
        .insert(assignments.map(assignment => ({
          ...assignment,
          project_installment_id: assignment.project_installment_id || null
        })))
        .select()

      if (error) {
        throw error
      }

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


      // Primero eliminamos todas las asignaciones existentes
      const { error: deleteError } = await supabase
        .from('movement_clients')
        .delete()
        .eq('movement_id', movementId)

      if (deleteError) {
        throw deleteError
      }


      // Si hay nuevas asignaciones, las creamos
      if (assignments.length > 0) {
        const { data, error } = await supabase
          .from('movement_clients')
          .insert(assignments.map(assignment => ({
            movement_id: movementId,
            project_client_id: assignment.project_client_id,
            project_installment_id: assignment.project_installment_id || null
          })))
          .select()

        if (error) {
          throw error
        }

        return data
      }

      return []
    },
    onSuccess: (data, variables) => {
      // Invalidar caché para el movimiento específico
      queryClient.invalidateQueries({ queryKey: ['movement-project-clients', variables.movementId] })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
    },
  })
}