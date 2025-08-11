import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from './use-current-user'
import { toast } from '@/hooks/use-toast'

interface Budget {
  id: string
  name: string
  description?: string
  project_id: string
  organization_id: string
  status: string
  created_at: string
  created_by: string
}

export function useBudgets(projectId?: string) {
  const { data: userData } = useCurrentUser()

  return useQuery({
    queryKey: ['budgets', projectId, userData?.organization?.id],
    queryFn: async () => {
      if (!supabase || !projectId || !userData?.organization?.id) {
        return []
      }

      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .eq('project_id', projectId)
        .eq('organization_id', userData.organization.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }
      return data as Budget[]
    },
    enabled: !!supabase && !!projectId && !!userData?.organization?.id
  })
}

export function useCreateBudget() {
  const queryClient = useQueryClient()
  const { data: userData } = useCurrentUser()

  return useMutation({
    mutationFn: async (budgetData: Omit<Budget, 'id' | 'created_at'> & { created_at: string }) => {
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      const { data, error } = await supabase
        .from('budgets')
        .insert(budgetData)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      
      toast({
        title: "Presupuesto creado",
        description: "El presupuesto ha sido creado correctamente",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el presupuesto",
        variant: "destructive",
      })
    }
  })
}

export function useUpdateBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...budgetData }: Partial<Budget> & { id: string }) => {
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      const { data, error } = await supabase
        .from('budgets')
        .update(budgetData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      toast({
        title: "Presupuesto actualizado",
        description: "El presupuesto ha sido actualizado correctamente",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el presupuesto",
        variant: "destructive",
      })
    }
  })
}

export function useDeleteBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (budgetId: string) => {
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
      toast({
        title: "Presupuesto eliminado",
        description: "El presupuesto ha sido eliminado correctamente",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el presupuesto",
        variant: "destructive",
      })
    }
  })
}