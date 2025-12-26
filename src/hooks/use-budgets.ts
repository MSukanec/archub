import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
// Removed direct Supabase import - now using server endpoints
import { useCurrentUser } from './use-current-user'
import { toast } from '@/hooks/use-toast'
import { useProjectContext } from '@/stores/projectContext'

interface Budget {
  id: string
  name: string
  description?: string
  project_id: string
  organization_id: string
  status: string
  created_at: string
  updated_at: string
  created_by: string
  version: number
  currency_id: string
  exchange_rate?: number
  // Budget-level discount and VAT fields
  discount_pct?: number
  tax_pct?: number
  tax_label?: string
  // Calculated totals
  total?: number
  labor_total?: number
  materials_total?: number
  currency?: {
    id: string
    code: string
    name: string
    symbol: string
  }
}

export function useBudgets(projectId?: string) {
  const { currentOrganizationId } = useProjectContext()

  return useQuery({
    queryKey: ['budgets', projectId, currentOrganizationId],
    queryFn: async () => {
      if (!projectId || !currentOrganizationId) {
        return []
      }

      // Get the authentication token
      const { supabase } = await import('@/lib/supabase');
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        throw new Error('No authentication token available');
      }

      // Use server endpoint instead of direct Supabase access
      const response = await fetch(`/api/budgets?project_id=${projectId}&organization_id=${currentOrganizationId}`, {
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
      return data as Budget[]
    },
    enabled: !!projectId && !!currentOrganizationId
  })
}

export function useCreateBudget() {
  const queryClient = useQueryClient()
  const { data: userData } = useCurrentUser()

  return useMutation({
    mutationFn: async (budgetData: Omit<Budget, 'id' | 'created_at'> & { created_at: string }) => {
      // Get the authentication token
      const { supabase } = await import('@/lib/supabase');
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        throw new Error('No authentication token available');
      }

      // Use server endpoint instead of direct Supabase access
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`
        },
        body: JSON.stringify(budgetData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
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
      // Get the authentication token
      const { supabase } = await import('@/lib/supabase');
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        throw new Error('No authentication token available');
      }

      // Use server endpoint instead of direct Supabase access
      const response = await fetch(`/api/budgets/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`
        },
        body: JSON.stringify(budgetData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
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
      // Get the authentication token
      const { supabase } = await import('@/lib/supabase');
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        throw new Error('No authentication token available');
      }

      // Use server endpoint instead of direct Supabase access
      const response = await fetch(`/api/budgets/${budgetId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
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