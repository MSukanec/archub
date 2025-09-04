import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'
import type { MovementGeneralCost, InsertMovementGeneralCost } from '@shared/schema'

// Hook para obtener gastos generales de un movimiento
export function useMovementGeneralCosts(movementId: string | undefined) {
  return useQuery({
    queryKey: ['movement-general-costs', movementId],
    queryFn: async () => {
      if (!movementId) return []

      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data, error } = await supabase
        .from('movement_general_costs')
        .select('*')
        .eq('movement_id', movementId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching movement general costs:', error)
        throw error
      }

      return data || []
    },
    enabled: !!movementId,
  })
}

// Hook para crear gastos generales de movimiento
export function useCreateMovementGeneralCosts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (generalCosts: InsertMovementGeneralCost[]) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      if (generalCosts.length === 0) {
        return []
      }

      const { data, error } = await supabase
        .from('movement_general_costs')
        .insert(generalCosts)
        .select()

      if (error) {
        console.error('Error creating movement general costs:', error)
        throw error
      }

      return data
    },
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas
      if (variables.length > 0) {
        const movementId = variables[0].movement_id
        queryClient.invalidateQueries({ queryKey: ['movement-general-costs', movementId] })
        queryClient.invalidateQueries({ queryKey: ['movements'] })
      }
    },
    onError: (error) => {
      console.error('Error creating movement general costs:', error)
      toast({
        title: "Error",
        description: "No se pudieron guardar los gastos generales del movimiento",
        variant: "destructive",
      })
    },
  })
}

// Hook para actualizar gastos generales de movimiento
export function useUpdateMovementGeneralCosts() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      movementId, 
      generalCosts 
    }: { 
      movementId: string
      generalCosts: InsertMovementGeneralCost[] 
    }) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      // Primero eliminar los gastos generales existentes
      const { error: deleteError } = await supabase
        .from('movement_general_costs')
        .delete()
        .eq('movement_id', movementId)

      if (deleteError) {
        console.error('Error deleting existing movement general costs:', deleteError)
        throw deleteError
      }

      // Luego insertar los nuevos gastos generales si hay alguno
      if (generalCosts.length === 0) {
        return []
      }

      const { data, error } = await supabase
        .from('movement_general_costs')
        .insert(generalCosts)
        .select()

      if (error) {
        console.error('Error inserting new movement general costs:', error)
        throw error
      }

      return data
    },
    onSuccess: (data, variables) => {
      // Invalidar queries relacionadas
      queryClient.invalidateQueries({ queryKey: ['movement-general-costs', variables.movementId] })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
    },
    onError: (error) => {
      console.error('Error updating movement general costs:', error)
      toast({
        title: "Error",
        description: "No se pudieron actualizar los gastos generales del movimiento",
        variant: "destructive",
      })
    },
  })
}