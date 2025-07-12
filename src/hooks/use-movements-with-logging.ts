import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'
import { useCurrentUser } from '@/hooks/use-current-user'
import { logActivity, ACTIVITY_ACTIONS, TARGET_TABLES } from '@/utils/logActivity'

// Interface para crear movimientos
interface CreateMovementData {
  description: string
  amount: number
  exchange_rate?: number
  movement_date: string
  created_by: string
  type_id: string
  category_id: string
  subcategory_id?: string
  currency_id: string
  wallet_id: string
  is_favorite?: boolean
  conversion_group_id?: string
}

// Interface para actualizar movimientos
interface UpdateMovementData {
  description?: string
  amount?: number
  exchange_rate?: number
  movement_date?: string
  type_id?: string
  category_id?: string
  subcategory_id?: string
  currency_id?: string
  wallet_id?: string
  is_favorite?: boolean
}

/**
 * Hook para crear movimientos con logging integrado
 */
export function useCreateMovementWithLogging() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { data: userData } = useCurrentUser()

  return useMutation({
    mutationFn: async (movementData: CreateMovementData) => {
      if (!userData?.preferences?.last_organization_id || !userData?.preferences?.last_project_id) {
        throw new Error('No hay organización o proyecto seleccionado')
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      // Preparar datos del movimiento
      const dataToInsert = {
        ...movementData,
        organization_id: userData.preferences.last_organization_id,
        project_id: userData.preferences.last_project_id
      }

      // 1. Crear el movimiento en la base de datos
      const { data: newMovement, error } = await supabase
        .from('movements')
        .insert([dataToInsert])
        .select()
        .single()

      if (error) {
        console.error('Error creating movement:', error)
        throw error
      }

      // 2. Registrar la actividad
      try {
        await logActivity({
          organization_id: userData.preferences.last_organization_id,
          user_id: userData.user?.id || '',
          action: ACTIVITY_ACTIONS.CREATE_MOVEMENT,
          target_table: TARGET_TABLES.MOVEMENTS,
          target_id: newMovement.id,
          metadata: {
            amount: newMovement.amount,
            description: newMovement.description,
            currency_id: newMovement.currency_id,
            wallet_id: newMovement.wallet_id,
            category_id: newMovement.category_id,
            subcategory_id: newMovement.subcategory_id,
            movement_date: newMovement.movement_date,
            exchange_rate: newMovement.exchange_rate,
            project_id: newMovement.project_id
          }
        })
      } catch (logError) {
        console.error('Error logging movement creation:', logError)
        // No lanzamos el error para no interrumpir el flujo principal
      }

      return newMovement
    },
    onSuccess: () => {
      // Invalidar cache de movimientos
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      
      // Mostrar notificación de éxito
      toast({
        title: 'Movimiento creado',
        description: 'El movimiento financiero ha sido registrado correctamente'
      })
    },
    onError: (error: any) => {
      console.error('Error in create movement mutation:', error)
      toast({
        title: 'Error',
        description: error.message || 'No se pudo crear el movimiento',
        variant: 'destructive'
      })
    }
  })
}

/**
 * Hook para actualizar movimientos con logging integrado
 */
export function useUpdateMovementWithLogging() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { data: userData } = useCurrentUser()

  return useMutation({
    mutationFn: async ({ movementId, updateData }: { movementId: string, updateData: UpdateMovementData }) => {
      if (!userData?.preferences?.last_organization_id) {
        throw new Error('No hay organización seleccionada')
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      // 1. Actualizar el movimiento
      const { data: updatedMovement, error } = await supabase
        .from('movements')
        .update(updateData)
        .eq('id', movementId)
        .select()
        .single()

      if (error) {
        console.error('Error updating movement:', error)
        throw error
      }

      // 2. Registrar la actividad
      try {
        await logActivity({
          organization_id: userData.preferences.last_organization_id,
          user_id: userData.user?.id || '',
          action: ACTIVITY_ACTIONS.UPDATE_MOVEMENT,
          target_table: TARGET_TABLES.MOVEMENTS,
          target_id: movementId,
          metadata: {
            updated_fields: Object.keys(updateData),
            new_amount: updatedMovement.amount,
            new_description: updatedMovement.description,
            new_movement_date: updatedMovement.movement_date,
            previous_data: 'Updated from form' // Podríamos pasar datos anteriores si fuera necesario
          }
        })
      } catch (logError) {
        console.error('Error logging movement update:', logError)
      }

      return updatedMovement
    },
    onSuccess: () => {
      // Invalidar cache de movimientos
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      
      toast({
        title: 'Movimiento actualizado',
        description: 'El movimiento ha sido actualizado correctamente'
      })
    },
    onError: (error: any) => {
      console.error('Error in update movement mutation:', error)
      toast({
        title: 'Error',
        description: error.message || 'No se pudo actualizar el movimiento',
        variant: 'destructive'
      })
    }
  })
}

/**
 * Hook para eliminar movimientos con logging integrado
 */
export function useDeleteMovementWithLogging() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { data: userData } = useCurrentUser()

  return useMutation({
    mutationFn: async (movementId: string) => {
      if (!userData?.preferences?.last_organization_id) {
        throw new Error('No hay organización seleccionada')
      }

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      // Obtener datos del movimiento antes de eliminar (para el log)
      const { data: movementToDelete, error: fetchError } = await supabase
        .from('movements')
        .select('*')
        .eq('id', movementId)
        .single()

      if (fetchError) {
        throw fetchError
      }

      // 1. Eliminar el movimiento
      const { error } = await supabase
        .from('movements')
        .delete()
        .eq('id', movementId)

      if (error) {
        console.error('Error deleting movement:', error)
        throw error
      }

      // 2. Registrar la actividad
      try {
        await logActivity({
          organization_id: userData.preferences.last_organization_id,
          user_id: userData.user?.id || '',
          action: ACTIVITY_ACTIONS.DELETE_MOVEMENT,
          target_table: TARGET_TABLES.MOVEMENTS,
          target_id: movementId,
          metadata: {
            deleted_amount: movementToDelete.amount,
            deleted_description: movementToDelete.description,
            deleted_date: movementToDelete.movement_date,
            currency_id: movementToDelete.currency_id,
            category_id: movementToDelete.category_id
          }
        })
      } catch (logError) {
        console.error('Error logging movement deletion:', logError)
      }

      return { deletedId: movementId }
    },
    onSuccess: () => {
      // Invalidar cache de movimientos
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      
      toast({
        title: 'Movimiento eliminado',
        description: 'El movimiento ha sido eliminado correctamente'
      })
    },
    onError: (error: any) => {
      console.error('Error in delete movement mutation:', error)
      toast({
        title: 'Error',
        description: error.message || 'No se pudo eliminar el movimiento',
        variant: 'destructive'
      })
    }
  })
}