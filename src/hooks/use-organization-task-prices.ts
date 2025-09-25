import { useQuery, useMutation } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { queryClient } from '@/lib/queryClient'
import { useCurrentUser } from './use-current-user'
import { toast } from '@/hooks/use-toast'
import type { OrganizationTaskPrice, InsertOrganizationTaskPrice } from '@shared/schema'

export interface OrganizationTaskPriceData {
  task_id: string
  labor_unit_cost?: number | null
  material_unit_cost?: number | null
  supply_unit_cost?: number | null
  total_unit_cost?: number | null
  currency_code?: string | null
  note?: string | null
}

export function useOrganizationTaskPrice(taskId: string | null) {
  const { data: userData } = useCurrentUser()
  
  return useQuery({
    queryKey: ['organization-task-price', userData?.organization?.id, taskId],
    queryFn: async () => {
      if (!supabase || !userData?.organization?.id || !taskId) {
        return null
      }

      const { data, error } = await supabase
        .from('organization_task_prices')
        .select('*')
        .eq('organization_id', userData.organization.id)
        .eq('task_id', taskId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching organization task price:', error)
        throw error
      }

      return data as OrganizationTaskPrice | null
    },
    enabled: !!supabase && !!userData?.organization?.id && !!taskId
  })
}

export function useOrganizationTaskPrices() {
  const { data: userData } = useCurrentUser()
  
  return useQuery({
    queryKey: ['organization-task-prices', userData?.organization?.id],
    queryFn: async () => {
      if (!supabase || !userData?.organization?.id) {
        return []
      }

      const { data, error } = await supabase
        .from('organization_task_prices')
        .select('*')
        .eq('organization_id', userData.organization.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching organization task prices:', error)
        throw error
      }

      return data as OrganizationTaskPrice[]
    },
    enabled: !!supabase && !!userData?.organization?.id
  })
}

export function useUpsertOrganizationTaskPrice() {
  const { data: userData } = useCurrentUser()
  
  return useMutation({
    mutationFn: async (priceData: OrganizationTaskPriceData) => {
      if (!supabase || !userData?.organization?.id) {
        throw new Error('No organization found')
      }

      // Try to update first, if no rows affected, then insert
      const { data: existingPrice } = await supabase
        .from('organization_task_prices')
        .select('id')
        .eq('organization_id', userData.organization.id)
        .eq('task_id', priceData.task_id)
        .maybeSingle()

      let result;

      if (existingPrice) {
        // Update existing record
        const { data, error } = await supabase
          .from('organization_task_prices')
          .update({
            labor_unit_cost: priceData.labor_unit_cost,
            material_unit_cost: priceData.material_unit_cost,
            total_unit_cost: priceData.total_unit_cost,
            currency_code: priceData.currency_code,
            note: priceData.note,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPrice.id)
          .select()
          .single()

        if (error) {
          console.error('Error updating organization task price:', error)
          throw error
        }

        result = data
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('organization_task_prices')
          .insert({
            ...priceData,
            organization_id: userData.organization.id
          })
          .select()
          .single()

        if (error) {
          console.error('Error creating organization task price:', error)
          throw error
        }

        result = data
      }

      return result
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['organization-task-prices', userData?.organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['organization-task-price', userData?.organization?.id, variables.task_id] })
      queryClient.invalidateQueries({ queryKey: ['task-costs'] })
      toast({
        title: 'Precio personalizado guardado',
        description: 'Los costos personalizados de la tarea se han guardado correctamente.',
      })
    },
    onError: (error) => {
      console.error('Error saving organization task price:', error)
      toast({
        title: 'Error',
        description: 'No se pudieron guardar los costos personalizados.',
        variant: 'destructive',
      })
    }
  })
}

export function useDeleteOrganizationTaskPrice() {
  const { data: userData } = useCurrentUser()
  
  return useMutation({
    mutationFn: async (taskId: string) => {
      if (!supabase || !userData?.organization?.id) {
        throw new Error('Supabase not initialized or no organization found')
      }

      const { error } = await supabase
        .from('organization_task_prices')
        .delete()
        .eq('organization_id', userData.organization.id)
        .eq('task_id', taskId)

      if (error) {
        console.error('Error deleting organization task price:', error)
        throw error
      }
    },
    onSuccess: (_, taskId) => {
      queryClient.invalidateQueries({ queryKey: ['organization-task-prices', userData?.organization?.id] })
      queryClient.invalidateQueries({ queryKey: ['organization-task-price', userData?.organization?.id, taskId] })
      queryClient.invalidateQueries({ queryKey: ['task-costs'] })
      toast({
        title: 'Precio personalizado eliminado',
        description: 'Los costos personalizados se han eliminado correctamente.',
      })
    },
    onError: (error) => {
      console.error('Error deleting organization task price:', error)
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el precio personalizado.',
        variant: 'destructive',
      })
    }
  })
}