import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface TaskCategory {
  id: string
  name: string
  parent_id: string | null
  level: number
  created_at: string
}

export function useTaskCategories() {
  return useQuery({
    queryKey: ['task-categories'],
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data, error } = await supabase
        .from('task_categories')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching task categories:', error)
        throw error
      }

      return data as TaskCategory[]
    }
  })
}

// Hook to get top-level categories (level 1)
export function useTopLevelCategories() {
  const { data: allCategories = [], ...rest } = useTaskCategories()
  
  const topLevelCategories = allCategories.filter(category => category.level === 1)
  
  return {
    data: topLevelCategories,
    ...rest
  }
}

// Hook to get subcategories by parent_id (level 2)
export function useSubcategories(parentId: string | null) {
  const { data: allCategories = [], ...rest } = useTaskCategories()
  
  const subcategories = parentId 
    ? allCategories.filter(category => category.parent_id === parentId && category.level === 2)
    : []
  
  return {
    data: subcategories,
    ...rest
  }
}

// Hook to get element categories by parent_id (level 3)
export function useElementCategories(parentId: string | null) {
  const { data: allCategories = [], ...rest } = useTaskCategories()
  
  const elementCategories = parentId 
    ? allCategories.filter(category => category.parent_id === parentId && category.level === 3)
    : []
  
  return {
    data: elementCategories,
    ...rest
  }
}