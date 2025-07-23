import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from './use-current-user'
import { toast } from '@/hooks/use-toast'

export interface Material {
  id: string
  name: string
  unit_id: string
  category_id: string
  created_at: string
  unit?: { name: string }
  category?: { name: string }
}

export interface NewMaterialData {
  name: string
  unit_id: string
  category_id: string
}

export function useMaterials() {
  return useQuery({
    queryKey: ['materials'],
    queryFn: async () => {
      if (!supabase) {
        return []
      }

      const { data, error } = await supabase
        .from('materials')
        .select(`
          *,
          unit:units(name),
          category:material_categories(name)
        `)
        .order('name')

      if (error) {
        console.error('Error fetching materials:', error)
        throw error
      }

      return data || []
    },
    enabled: !!supabase
  })
}

export function useCreateMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: NewMaterialData) => {
      if (!supabase) throw new Error('Supabase client not available')

      const { data: result, error } = await supabase
        .from('materials')
        .insert([data])
        .select(`
          *,
          unit:units(name),
          category:material_categories(name)
        `)
        .single()

      if (error) {
        console.error('Error creating material:', error)
        throw error
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      toast({
        title: "Material creado",
        description: "El material se ha creado exitosamente.",
        variant: "default",
      })
    },
    onError: (error) => {
      console.error('Error creating material:', error)
      toast({
        title: "Error",
        description: "No se pudo crear el material.",
        variant: "destructive",
      })
    },
  })
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NewMaterialData> }) => {
      if (!supabase) throw new Error('Supabase client not available')

      const { data: result, error } = await supabase
        .from('materials')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          unit:units(name),
          category:material_categories(name)
        `)
        .single()

      if (error) {
        console.error('Error updating material:', error)
        throw error
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      toast({
        title: "Material actualizado",
        description: "El material se ha actualizado exitosamente.",
        variant: "default",
      })
    },
    onError: (error) => {
      console.error('Error updating material:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el material.",
        variant: "destructive",
      })
    },
  })
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Supabase client not available')

      const { error } = await supabase
        .from('materials')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting material:', error)
        throw error
      }

      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      toast({
        title: "Material eliminado",
        description: "El material se ha eliminado exitosamente.",
        variant: "default",
      })
    },
    onError: (error) => {
      console.error('Error deleting material:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el material.",
        variant: "destructive",
      })
    },
  })
}