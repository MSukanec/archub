import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export function useTaskCategories() {
  return useQuery({
    queryKey: ['task-categories'],
    queryFn: async () => {
      if (!supabase) {
        return []
      }

      const { data, error } = await supabase
        .from('task_categories')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching task categories:', error)
        throw error
      }

      return data || []
    },
    enabled: !!supabase
  })
}

export function useTaskSubcategories() {
  return useQuery({
    queryKey: ['task-subcategories'],
    queryFn: async () => {
      if (!supabase) {
        return []
      }

      const { data, error } = await supabase
        .from('task_subcategories')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching task subcategories:', error)
        throw error
      }

      return data || []
    },
    enabled: !!supabase
  })
}

export function useTaskElements() {
  return useQuery({
    queryKey: ['task-elements'],
    queryFn: async () => {
      if (!supabase) {
        return []
      }

      const { data, error } = await supabase
        .from('task_elements')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching task elements:', error)
        throw error
      }

      return data || []
    },
    enabled: !!supabase
  })
}

export function useTaskActions() {
  return useQuery({
    queryKey: ['task-actions'],
    queryFn: async () => {
      if (!supabase) {
        return []
      }

      const { data, error } = await supabase
        .from('task_actions')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching task actions:', error)
        throw error
      }

      return data || []
    },
    enabled: !!supabase
  })
}

export function useUnits() {
  return useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      if (!supabase) {
        return []
      }

      const { data, error } = await supabase
        .from('units')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching units:', error)
        throw error
      }

      return data || []
    },
    enabled: !!supabase
  })
}