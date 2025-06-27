import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'

export function useMaterials() {
  return useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const { data, error } = await supabase
        .from('materials')
        .select(`
          id,
          name,
          cost,
          unit_id,
          category_id,
          created_at,
          unit:units(name),
          category:material_categories(name)
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data || []
    }
  })
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (materialId: string) => {
      if (!supabase) throw new Error('Supabase not initialized')
      
      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', materialId)
      
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      toast({
        title: 'Material eliminado',
        description: 'El material ha sido eliminado correctamente.'
      })
    },
    onError: (error) => {
      console.error('Error deleting material:', error)
      toast({
        title: 'Error',
        description: 'Hubo un problema al eliminar el material.',
        variant: 'destructive'
      })
    }
  })
}