import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

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
  return useQuery({
    queryKey: ['admin-tasks'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized')

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching tasks:', error)
        throw error
      }

      return data as Task[]
    }
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskData: CreateTaskData) => {
      if (!supabase) throw new Error('Supabase client not initialized')

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
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] })
    }
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, ...taskData }: Partial<Task> & { id: string }) => {
      if (!supabase) throw new Error('Supabase client not initialized')

      const { data, error } = await supabase
        .from('tasks')
        .update(taskData)
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
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] })
    }
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (taskId: string) => {
      if (!supabase) throw new Error('Supabase client not initialized')

      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) {
        console.error('Error deleting task:', error)
        throw error
      }

      return taskId
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tasks'] })
    }
  })
}