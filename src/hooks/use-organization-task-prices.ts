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
      if (!userData?.organization?.id || !taskId) {
        return null
      }

      // Get the authentication token
      const { supabase } = await import('@/lib/supabase');
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        throw new Error('No authentication token available');
      }

      // Use server endpoint to query ORGANIZATION_TASK_PRICES_VIEW
      const response = await fetch(`/api/organization-task-prices?organization_id=${userData.organization.id}&task_id=${taskId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data as OrganizationTaskPrice | null
    },
    enabled: !!userData?.organization?.id && !!taskId
  })
}

export function useOrganizationTaskPrices() {
  const { data: userData } = useCurrentUser()
  
  return useQuery({
    queryKey: ['organization-task-prices', userData?.organization?.id],
    queryFn: async () => {
      if (!userData?.organization?.id) {
        return []
      }

      // Get the authentication token
      const { supabase } = await import('@/lib/supabase');
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        throw new Error('No authentication token available');
      }

      // Use server endpoint to query ORGANIZATION_TASK_PRICES_VIEW
      const response = await fetch(`/api/organization-task-prices?organization_id=${userData.organization.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data as OrganizationTaskPrice[]
    },
    enabled: !!userData?.organization?.id
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
            ...priceData,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPrice.id)
          .select()
          .single()

        if (error) {
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
      toast({
        title: 'Error',
        description: 'No se pudo eliminar el precio personalizado.',
        variant: 'destructive',
      })
    }
  })
}