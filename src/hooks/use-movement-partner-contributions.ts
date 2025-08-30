import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export interface MovementPartnerContribution {
  id: string
  movement_id: string
  partner_id: string
  created_at: string
}

export interface PartnerContributionItem {
  partner_id: string
  partner_name: string
}

// Hook para obtener aportes de socios de un movimiento
export function useMovementPartnerContributions(movementId?: string) {
  return useQuery({
    queryKey: ['movement-partner-contributions', movementId],
    queryFn: async () => {
      if (!supabase || !movementId) {
        return []
      }

      const { data, error } = await supabase
        .from('movement_partner_contributions')
        .select(`
          id,
          movement_id,
          partner_id,
          created_at,
          partners:partners(
            id,
            contacts:contacts(
              id,
              first_name,
              last_name,
              company_name,
              email
            )
          )
        `)
        .eq('movement_id', movementId)

      if (error) {
        console.error('Error fetching movement partner contributions:', error)
        throw error
      }

      return data || []
    },
    enabled: !!movementId,
  })
}

// Hook para crear aportes de socios de movimiento
export function useCreateMovementPartnerContributions() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      movementId: string
      partnerContributions: PartnerContributionItem[]
    }) => {
      if (!supabase) throw new Error('Supabase not available')

      // Preparar los datos para inserción
      const contributionsToInsert = data.partnerContributions.map(contribution => ({
        movement_id: data.movementId,
        partner_id: contribution.partner_id
      }))

      const { data: insertedData, error } = await supabase
        .from('movement_partner_contributions')
        .insert(contributionsToInsert)
        .select()

      if (error) throw error
      return insertedData
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['movement-partner-contributions', variables.movementId] })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      toast({
        title: 'Aportes de socios asignados',
        description: 'Los aportes de socios han sido asignados al movimiento correctamente',
      })
    },
    onError: (error) => {
      console.error('Error creating movement partner contributions:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron asignar los aportes de socios al movimiento',
      })
    },
  })
}

// Hook para actualizar aportes de socios de movimiento
export function useUpdateMovementPartnerContributions() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      movementId: string
      partnerContributions: PartnerContributionItem[]
    }) => {
      if (!supabase) throw new Error('Supabase not available')

      // Primero eliminar todos los aportes existentes del movimiento
      const { error: deleteError } = await supabase
        .from('movement_partner_contributions')
        .delete()
        .eq('movement_id', data.movementId)

      if (deleteError) throw deleteError

      // Si hay aportes nuevos, insertarlos
      if (data.partnerContributions.length > 0) {
        const contributionsToInsert = data.partnerContributions.map(contribution => ({
          movement_id: data.movementId,
          partner_id: contribution.partner_id
        }))

        const { data: insertedData, error: insertError } = await supabase
          .from('movement_partner_contributions')
          .insert(contributionsToInsert)
          .select()

        if (insertError) throw insertError
        return insertedData
      }

      return []
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['movement-partner-contributions', variables.movementId] })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      toast({
        title: 'Aportes de socios actualizados',
        description: 'Los aportes de socios del movimiento han sido actualizados correctamente',
      })
    },
    onError: (error) => {
      console.error('Error updating movement partner contributions:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron actualizar los aportes de socios del movimiento',
      })
    },
  })
}