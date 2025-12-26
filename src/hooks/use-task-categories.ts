import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface TaskCategory {
  id: string
  name: string
  parent_id: string | null
  code?: string
  position?: string
  created_at: string
}

export function useTaskCategories() {
  return useQuery({
    queryKey: ['task-categories'],
    queryFn: async () => {
      if (!supabase) {
        console.error('Supabase client not initialized')
        throw new Error('Supabase client not initialized')
      }

      console.log('Fetching task categories...')
      const { data, error } = await supabase
        .from('task_categories')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching task categories:', error)
        throw error
      }

      console.log('Task categories data:', data)
      return data as TaskCategory[]
    }
  })
}

// Hook to get top-level categories (parent_id === null)
export function useTopLevelCategories() {
  const { data: allCategories = [], ...rest } = useTaskCategories()
  
  const topLevelCategories = allCategories.filter(category => category.parent_id === null)
  
  console.log('Top level categories:', topLevelCategories)
  
  return {
    data: topLevelCategories,
    ...rest
  }
}

// Hook to get subcategories by parent_id
export function useSubcategories(parentId: string | null) {
  const { data: allCategories = [], ...rest } = useTaskCategories()
  
  const subcategories = parentId 
    ? allCategories.filter(category => category.parent_id === parentId)
    : []
  
  return {
    data: subcategories,
    ...rest
  }
}

// Hook to get element categories by parent_id
export function useElementCategories(parentId: string | null) {
  const { data: allCategories = [], ...rest } = useTaskCategories()
  
  const elementCategories = parentId 
    ? allCategories.filter(category => category.parent_id === parentId)
    : []
  
  return {
    data: elementCategories,
    ...rest
  }
}

// Hook to get units
export function useUnits() {
  return useQuery({
    queryKey: ['units'],
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
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
    }
  })
}

// Hook to get actions
export function useActions() {
  return useQuery({
    queryKey: ['actions'],
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data, error } = await supabase
        .from('actions')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching actions:', error)
        throw error
      }

      return data || []
    }
  })
}

// Hook to get task elements
export function useElements() {
  return useQuery({
    queryKey: ['task-elements'],
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
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
    }
  })
}