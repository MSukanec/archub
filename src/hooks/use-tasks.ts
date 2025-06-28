import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from './use-current-user'
import { toast } from '@/hooks/use-toast'

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
  const { data: userData } = useCurrentUser()
  
  return useQuery({
    queryKey: ['tasks', userData?.organization?.id],
    queryFn: async () => {
      if (!supabase || !userData?.organization?.id) {
        return []
      }

      // For now, return empty array until we have task data in the database
      // This allows the page to load without errors
      return []
    },
    enabled: !!userData?.organization?.id && !!supabase
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
        console.error('Error creating task:', error)
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
        console.error('Error updating task:', error)
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
        console.error('Error deleting task:', error)
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