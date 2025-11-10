import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export interface MovementSubcontract {
  id: string
  movement_id: string
  subcontract_id: string
  created_at: string
}

export interface SubcontractItem {
  subcontract_id: string
  contact_name: string
}

// Hook para obtener subcontratos de un movimiento
export function useMovementSubcontracts(movementId?: string) {
  return useQuery({
    queryKey: ['movement-subcontracts', movementId],
    queryFn: async () => {
      if (!supabase || !movementId) {
        return []
      }

      const { data, error } = await supabase
        .from('movement_subcontracts')
        .select(`
          id,
          movement_id,
          subcontract_id,
          created_at,
          subcontracts:subcontracts(
            id,
            title,
            contact:contacts(
              id,
              first_name,
              last_name,
              full_name,
              company_name
            )
          )
        `)
        .eq('movement_id', movementId)

      if (error) {
        throw error
      }

      return data || []
    },
    enabled: !!movementId,
  })
}

// Hook para crear subcontratos de movimiento
export function useCreateMovementSubcontracts() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      movementId: string
      subcontracts: SubcontractItem[]
    }) => {
      if (!supabase) throw new Error('Supabase not available')

      // Preparar los datos para inserción
      const subcontractsToInsert = data.subcontracts.map(subcontract => ({
        movement_id: data.movementId,
        subcontract_id: subcontract.subcontract_id
      }))

      const { data: insertedData, error } = await supabase
        .from('movement_subcontracts')
        .insert(subcontractsToInsert)
        .select()

      if (error) throw error
      return insertedData
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['movement-subcontracts', variables.movementId] })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      toast({
        title: 'Subcontratos asignados',
        description: 'Los subcontratos han sido asignados al movimiento correctamente',
      })
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron asignar los subcontratos al movimiento',
      })
    },
  })
}

// Hook para actualizar subcontratos de movimiento
export function useUpdateMovementSubcontracts() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      movementId: string
      subcontracts: SubcontractItem[]
    }) => {
      if (!supabase) throw new Error('Supabase not available')

      // Primero eliminar todos los subcontratos existentes del movimiento
      const { error: deleteError } = await supabase
        .from('movement_subcontracts')
        .delete()
        .eq('movement_id', data.movementId)

      if (deleteError) throw deleteError

      // Si hay subcontratos nuevos, insertarlos
      if (data.subcontracts.length > 0) {
        const subcontractsToInsert = data.subcontracts.map(subcontract => ({
          movement_id: data.movementId,
          subcontract_id: subcontract.subcontract_id
        }))

        const { data: insertedData, error: insertError } = await supabase
          .from('movement_subcontracts')
          .insert(subcontractsToInsert)
          .select()

        if (insertError) throw insertError
        return insertedData
      }

      return []
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['movement-subcontracts', variables.movementId] })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      toast({
        title: 'Subcontratos actualizados',
        description: 'Los subcontratos del movimiento han sido actualizados correctamente',
      })
    },
    onError: (error) => {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron actualizar los subcontratos del movimiento',
      })
    },
  })
}