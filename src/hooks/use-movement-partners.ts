import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export interface MovementPartner {
  id: string
  movement_id: string
  partner_id: string
  created_at: string
  partners?: {
    id: string
    contacts: {
      id: string
      first_name: string
      last_name: string
      company_name: string
      email: string
    }
  }
}

export interface PartnerItem {
  partner_id: string
  partner_name: string
}

// Hook para obtener partners de un movimiento
export function useMovementPartners(movementId?: string) {
  return useQuery({
    queryKey: ['movement-partners', movementId],
    queryFn: async () => {
      if (!supabase || !movementId) {
        return []
      }

      const { data, error } = await supabase
        .from('movement_partners')
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
        console.error('Error fetching movement partners:', error)
        throw error
      }

      return data || []
    },
    enabled: !!movementId,
  })
}

// Hook para obtener todos los partners de múltiples movimientos (para Capital.tsx)
export function useAllMovementPartners(organizationId?: string, movementIds?: string[]) {
  return useQuery({
    queryKey: ['all-movement-partners', organizationId],
    queryFn: async () => {
      if (!supabase || !organizationId || !movementIds?.length) {
        return []
      }

      const { data, error } = await supabase
        .from('movement_partners')
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
        .in('movement_id', movementIds)

      if (error) {
        console.error('Error fetching all movement partners:', error)
        throw error
      }

      return data || []
    },
    enabled: !!organizationId && !!movementIds?.length,
  })
}

// Hook para crear partners de movimiento
export function useCreateMovementPartners() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      movementId: string
      partners: PartnerItem[]
    }) => {
      if (!supabase) throw new Error('Supabase not available')

      // Preparar los datos para inserción
      const partnersToInsert = data.partners.map(partner => ({
        movement_id: data.movementId,
        partner_id: partner.partner_id
      }))

      const { data: insertedData, error } = await supabase
        .from('movement_partners')
        .insert(partnersToInsert)
        .select()

      if (error) throw error
      return insertedData
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['movement-partners', variables.movementId] })
      queryClient.invalidateQueries({ queryKey: ['all-movement-partners'] })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      // No mostrar toast aquí - el componente padre maneja las notificaciones
    },
    onError: (error) => {
      console.error('Error creating movement partners:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron asignar los socios al movimiento',
      })
    },
  })
}

// Hook para actualizar partners de movimiento
export function useUpdateMovementPartners() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (data: {
      movementId: string
      partners: PartnerItem[]
    }) => {
      if (!supabase) throw new Error('Supabase not available')

      // Primero eliminar todos los partners existentes del movimiento
      const { error: deleteError } = await supabase
        .from('movement_partners')
        .delete()
        .eq('movement_id', data.movementId)

      if (deleteError) throw deleteError

      // Si hay partners nuevos, insertarlos
      if (data.partners.length > 0) {
        const partnersToInsert = data.partners.map(partner => ({
          movement_id: data.movementId,
          partner_id: partner.partner_id
        }))

        const { data: insertedData, error: insertError } = await supabase
          .from('movement_partners')
          .insert(partnersToInsert)
          .select()

        if (insertError) throw insertError
        return insertedData
      }

      return []
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['movement-partners', variables.movementId] })
      queryClient.invalidateQueries({ queryKey: ['all-movement-partners'] })
      queryClient.invalidateQueries({ queryKey: ['movements'] })
      // No mostrar toast aquí - el componente padre maneja las notificaciones
    },
    onError: (error) => {
      console.error('Error updating movement partners:', error)
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron actualizar los socios del movimiento',
      })
    },
  })
}