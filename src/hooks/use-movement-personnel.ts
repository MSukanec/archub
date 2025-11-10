import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export interface MovementPersonnel {
  id: string
  movement_id: string
  personnel_id: string
  created_at: string
  project_personnel?: {
    id: string
    contact_id: string
    contact: {
      id: string
      first_name: string
      last_name: string
      full_name: string
      email: string
    }
  }
}

export interface PersonnelItem {
  personnel_id: string
  contact_name: string
}

// Hook para obtener personal de un movimiento
export function useMovementPersonnel(movementId?: string) {
  return useQuery({
    queryKey: ['movement-personnel', movementId],
    queryFn: async () => {
      if (!supabase || !movementId) {
        return []
      }

      const { data, error } = await supabase
        .from('movement_personnel')
        .select(`
          id,
          movement_id,
          personnel_id,
          created_at,
          project_personnel:project_personnel(
            id,
            contact_id,
            contact:contacts(
              id,
              first_name,
              last_name,
              full_name,
              email
            )
          )
        `)
        .eq('movement_id', movementId)

      if (error) {
        console.error('Error fetching movement personnel:', error)
        throw error
      }

      return data || []
    },
    enabled: !!movementId,
  })
}

// Hook para crear personal en un movimiento
export function useCreateMovementPersonnel() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ movementId, personnel }: { movementId: string, personnel: PersonnelItem[] }) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const personnelData = personnel.map(person => ({
        movement_id: movementId,
        personnel_id: person.personnel_id
      }))

      const { error } = await supabase
        .from('movement_personnel')
        .insert(personnelData)

      if (error) throw error

      return personnel
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movement-personnel'] })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
    },
    onError: (error) => {
      console.error('Error creating movement personnel:', error)
      toast({
        title: "Error",
        description: "No se pudo asignar el personal al movimiento",
        variant: "destructive"
      })
    }
  })
}

// Hook para actualizar personal de un movimiento
export function useUpdateMovementPersonnel() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ movementId, personnel }: { movementId: string, personnel: PersonnelItem[] }) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      // First delete existing personnel assignments
      const { error: deleteError } = await supabase
        .from('movement_personnel')
        .delete()
        .eq('movement_id', movementId)

      if (deleteError) throw deleteError

      // Then insert new assignments if any
      if (personnel.length > 0) {
        const personnelData = personnel.map(person => ({
          movement_id: movementId,
          personnel_id: person.personnel_id
        }))

        const { error: insertError } = await supabase
          .from('movement_personnel')
          .insert(personnelData)

        if (insertError) throw insertError
      }

      return personnel
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movement-personnel'] })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
    },
    onError: (error) => {
      console.error('Error updating movement personnel:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el personal del movimiento",
        variant: "destructive"
      })
    }
  })
}