import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from './use-current-user'
import { toast } from '@/hooks/use-toast'
import { useProjectContext } from '@/stores/projectContext'

interface Task {
  id: string
  name: string
  description: string
  organization_id: string
  category_id: string
  subcategory_id: string
  element_category_id: string
  unit_id: string
  action_id: string
  element_id: string
  unit_labor_price: number
  unit_material_price: number
  created_at: string
}

interface CreateTaskData {
  name: string
  description?: string
  organization_id: string
  category_id?: string
  subcategory_id?: string
  element_category_id?: string
  unit_id?: string
  action_id?: string
  element_id?: string
  unit_labor_price?: number
  unit_material_price?: number
}

export function useTasks() {
  const { currentOrganizationId } = useProjectContext()
  
  return useQuery({
    queryKey: ['tasks', currentOrganizationId],
    queryFn: async () => {
      if (!supabase || !currentOrganizationId) {
        return []
      }

      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return data as Task[]
    },
    enabled: !!currentOrganizationId && !!supabase
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  const { data: userData } = useCurrentUser()

  return useMutation({
    mutationFn: async (taskData: CreateTaskData) => {
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      const { data, error } = await supabase
        .from('tasks')
        .insert([taskData])
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({
        title: 'Éxito',
        description: 'Tarea creada correctamente'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al crear la tarea',
        variant: 'destructive'
      })
    }
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...updateData }: { id: string } & Partial<CreateTaskData>) => {
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({
        title: 'Éxito',
        description: 'Tarea actualizada correctamente'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al actualizar la tarea',
        variant: 'destructive'
      })
    }
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) {
        throw new Error('Supabase client not available')
      }

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      toast({
        title: 'Éxito',
        description: 'Tarea eliminada correctamente'
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Error al eliminar la tarea',
        variant: 'destructive'
      })
    }
  })
}