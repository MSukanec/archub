import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCurrentUser } from './use-current-user'
import { toast } from '@/hooks/use-toast'
import { useProjectContext } from '@/stores/projectContext'

interface BudgetItem {
  // Campos básicos de budget_items
  id: string
  budget_id: string
  task_id: string | null
  organization_id: string
  project_id: string
  created_at: string
  updated_at: string
  created_by: string
  
  // Campos de presupuesto
  description?: string
  quantity: number
  unit_price: number
  currency_id: string
  markup_pct: number
  tax_pct: number
  cost_scope: 'materials_and_labor' | 'materials_only' | 'labor_only'
  sort_key: number
  
  // Campos enriquecidos de la vista (desde joins)
  custom_name?: string
  division_name?: string
  division_order?: number
  unit?: string
  cost_scope_label?: string
  position?: number // alias para sort_key para compatibilidad
}

export function useBudgetItems(budgetId?: string) {
  const { currentOrganizationId } = useProjectContext()

  return useQuery({
    queryKey: ['budget-items', budgetId, currentOrganizationId],
    queryFn: async () => {
      if (!budgetId || !currentOrganizationId) {
        return []
      }

      // Get the authentication token
      const { supabase } = await import('@/lib/supabase');
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        throw new Error('No authentication token available');
      }

      // Use server endpoint instead of direct Supabase access
      const response = await fetch(`/api/budget-items?budget_id=${budgetId}&organization_id=${currentOrganizationId}`, {
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
      return data as BudgetItem[]
    },
    enabled: !!budgetId && !!currentOrganizationId
  })
}

export function useCreateBudgetItem() {
  const queryClient = useQueryClient()
  const { data: userData } = useCurrentUser()

  return useMutation({
    mutationFn: async (budgetItemData: Omit<BudgetItem, 'id' | 'created_at' | 'updated_at'>) => {
      // Get the authentication token
      const { supabase } = await import('@/lib/supabase');
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        throw new Error('No authentication token available');
      }

      // Use server endpoint instead of direct Supabase access
      const response = await fetch('/api/budget-items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`
        },
        body: JSON.stringify(budgetItemData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['budget-items'] })
      
      toast({
        title: "Tarea agregada",
        description: "La tarea ha sido agregada al presupuesto correctamente",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo agregar la tarea al presupuesto",
        variant: "destructive",
      })
    }
  })
}

export function useUpdateBudgetItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...budgetItemData }: Partial<BudgetItem> & { id: string }) => {
      // Get the authentication token
      const { supabase } = await import('@/lib/supabase');
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        throw new Error('No authentication token available');
      }

      // Use server endpoint instead of direct Supabase access
      const response = await fetch(`/api/budget-items/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`
        },
        body: JSON.stringify(budgetItemData),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-items'] })
      toast({
        title: "Tarea actualizada",
        description: "La tarea ha sido actualizada correctamente",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la tarea",
        variant: "destructive",
      })
    }
  })
}

export function useDeleteBudgetItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (budgetItemId: string) => {
      // Get the authentication token
      const { supabase } = await import('@/lib/supabase');
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        throw new Error('No authentication token available');
      }

      // Use server endpoint instead of direct Supabase access
      const response = await fetch(`/api/budget-items/${budgetItemId}`, {
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
      queryClient.invalidateQueries({ queryKey: ['budget-items'] })
      toast({
        title: "Tarea eliminada",
        description: "La tarea ha sido eliminada del presupuesto correctamente",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la tarea del presupuesto",
        variant: "destructive",
      })
    }
  })
}

export function useMoveBudgetItem() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ budget_id, item_id, prev_item_id, next_item_id }: {
      budget_id: string;
      item_id: string;
      prev_item_id?: string | null;
      next_item_id?: string | null;
    }) => {
      // Get the authentication token
      const { supabase } = await import('@/lib/supabase');
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.access_token) {
        throw new Error('No authentication token available');
      }

      // Use server endpoint for budget item move
      const response = await fetch('/api/budget-items/move', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`
        },
        body: JSON.stringify({
          budget_id,
          item_id,
          prev_item_id,
          next_item_id
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
      }

      const data = await response.json()
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budget-items'] })
      toast({
        title: "Orden actualizado",
        description: "El orden de las tareas ha sido actualizado correctamente",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el orden de las tareas",
        variant: "destructive",
      })
    }
  })
}