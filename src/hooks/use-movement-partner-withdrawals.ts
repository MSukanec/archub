import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export interface MovementPartnerWithdrawal {
  id: string
  movement_id: string
  partner_id: string
  created_at: string
}

export interface PartnerWithdrawalItem {
  partner_id: string
  partner_name: string
}

// Hook para obtener retiros de socios de un movimiento
export function useMovementPartnerWithdrawals(movementId?: string) {
  return useQuery({
    queryKey: ['movement-partner-withdrawals', movementId],
    queryFn: async () => {
      if (!supabase || !movementId) {
        return []
      }

      const { data, error } = await supabase
        .from('movement_partner_withdrawals')
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
        console.error('Error fetching movement partner withdrawals:', error)
        throw error
      }

      return data || []
    },
    enabled: !!movementId,
  })
}

// Hook para crear retiros de socios de movimiento
export function useCreateMovementPartnerWithdrawals() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      movementId: string
      partnerWithdrawals: PartnerWithdrawalItem[]
    }) => {
      if (!supabase) throw new Error('Supabase not available')

      // Preparar los datos para inserción
      const withdrawalsToInsert = data.partnerWithdrawals.map(withdrawal => ({
        movement_id: data.movementId,
        partner_id: withdrawal.partner_id
      }))

      const { data: insertedData, error } = await supabase
        .from('movement_partner_withdrawals')
        .insert(withdrawalsToInsert)
        .select()

      if (error) throw error
      return insertedData
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['movement-partner-withdrawals', variables.movementId] })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      toast({
        title: 'Retiros de socios asignados',
        description: 'Los retiros de socios han sido asignados al movimiento correctamente',
      })
    },
    onError: (error) => {
      console.error('Error creating movement partner withdrawals:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron asignar los retiros de socios al movimiento',
      })
    },
  })
}

// Hook para actualizar retiros de socios de movimiento
export function useUpdateMovementPartnerWithdrawals() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      movementId: string
      partnerWithdrawals: PartnerWithdrawalItem[]
    }) => {
      if (!supabase) throw new Error('Supabase not available')

      // Primero eliminar todos los retiros existentes del movimiento
      const { error: deleteError } = await supabase
        .from('movement_partner_withdrawals')
        .delete()
        .eq('movement_id', data.movementId)

      if (deleteError) throw deleteError

      // Si hay retiros nuevos, insertarlos
      if (data.partnerWithdrawals.length > 0) {
        const withdrawalsToInsert = data.partnerWithdrawals.map(withdrawal => ({
          movement_id: data.movementId,
          partner_id: withdrawal.partner_id
        }))

        const { data: insertedData, error: insertError } = await supabase
          .from('movement_partner_withdrawals')
          .insert(withdrawalsToInsert)
          .select()

        if (insertError) throw insertError
        return insertedData
      }

      return []
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['movement-partner-withdrawals', variables.movementId] })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      toast({
        title: 'Retiros de socios actualizados',
        description: 'Los retiros de socios del movimiento han sido actualizados correctamente',
      })
    },
    onError: (error) => {
      console.error('Error updating movement partner withdrawals:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron actualizar los retiros de socios del movimiento',
      })
    },
  })
}