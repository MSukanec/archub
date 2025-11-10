import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'
import { useCurrentUser } from './use-current-user'
import { toast } from '@/hooks/use-toast'

export interface MaterialPrice {
  id: string
  organization_id: string
  material_id: string
  unit_price: number
  currency_id: string
  created_at: string
  updated_at: string
  material?: {
    id: string
    name: string
    category_id: string
    unit_id: string
    category?: {
      name: string
    }
    unit?: {
      name: string
    }
  }
  currency?: {
    id: string
    symbol: string
    name: string
  }
}

export interface NewMaterialPriceData {
  material_id: string
  unit_price: number
  currency_id: string
}

export function useMaterialPrices() {
  const { data: userData } = useCurrentUser()
  
  return useQuery({
    queryKey: ['material-prices', userData?.organization?.id],
    queryFn: async () => {
      if (!supabase || !userData?.organization?.id) {
        return []
      }

      const { data, error } = await supabase
        .from('organization_material_prices')
        .select(`
          *,
          material:materials(
            id,
            name,
            category_id,
            unit_id,
            category:material_categories(name),
            unit:units(name)
          ),
          currency:currencies(
            id,
            symbol,
            name
          )
        `)
        .eq('organization_id', userData.organization.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching material prices:', error)
        throw error
      }

      return data as MaterialPrice[]
    },
    enabled: !!supabase && !!userData?.organization?.id
  })
}

export function useCreateMaterialPrice() {
  const { data: userData } = useCurrentUser()
  
  return useMutation({
    mutationFn: async (newPrice: NewMaterialPriceData) => {
      if (!supabase || !userData?.organization?.id) {
        throw new Error('No organization found')
      }

      const { data, error } = await supabase
        .from('organization_material_prices')
        .insert({
          ...newPrice,
          organization_id: userData.organization.id
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating material price:', error)
        throw error
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-prices'] })
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      queryClient.invalidateQueries({ queryKey: ['task-materials'] })
      queryClient.invalidateQueries({ queryKey: ['material-view'] })
      toast({
        title: 'Precio agregado',
        description: 'El precio del material se agregó correctamente.',
      })
    },
    onError: (error) => {
      console.error('Error creating material price:', error)
      toast({
        title: 'Error',
        description: 'No se pudo agregar el precio del material.',
        variant: 'destructive',
      })
    }
  })
}

export function useUpdateMaterialPrice() {
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MaterialPrice> & { id: string }) => {
      if (!supabase) {
        throw new Error('Supabase not initialized')
      }

      const { data, error } = await supabase
        .from('organization_material_prices')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating material price:', error)
        throw error
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-prices'] })
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      queryClient.invalidateQueries({ queryKey: ['task-materials'] })
      queryClient.invalidateQueries({ queryKey: ['material-view'] })
      toast({
        title: 'Precio actualizado',
        description: 'El precio del material se actualizó correctamente.',
      })
    },
    onError: (error) => {
      console.error('Error updating material price:', error)
      toast({
        title: 'Error',
        description: 'No se pudo actualizar el precio del material.',
        variant: 'destructive',
      })
    }
  })
}

export function useDeleteMaterialPrice() {
  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) {
        throw new Error('Supabase not initialized')
      }

      const { error } = await supabase
        .from('organization_material_prices')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting material price:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-prices'] })
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      queryClient.invalidateQueries({ queryKey: ['task-materials'] })
      queryClient.invalidateQueries({ queryKey: ['material-view'] })
      toast({
        title: 'Precio eliminado',
        description: 'El precio del material se eliminó correctamente.',
      })
    },
    onError: (error) => {
      console.error('Error deleting material price:', error)
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el precio del material.',
        variant: 'destructive',
      })
    }
  })
}