import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';

export interface Brand {
  id: string;
  name: string;
  created_at: string;
}

export interface NewBrandData {
  name: string;
}

export function useBrands() {
  const { data: userData } = useCurrentUser()
  
  return useQuery({
    queryKey: ['brands', userData?.organization?.id],
    queryFn: async () => {
      if (!supabase) {
        return []
      }

      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('name')

      if (error) {
        throw error
      }

      return data || []
    },
    enabled: !!supabase
  })
}

export function useCreateBrand() {
  const queryClient = useQueryClient()
  const { data: userData } = useCurrentUser()

  return useMutation({
    mutationFn: async (data: NewBrandData) => {
      if (!supabase) throw new Error('Supabase client not available')

      const { data: result, error } = await supabase
        .from('brands')
        .insert([data])
        .select()
        .single()

      if (error) {
        throw error
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] })
      toast({
        title: "Marca creada",
        description: "La marca se ha creado exitosamente.",
        variant: "default",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear la marca.",
        variant: "destructive",
      })
    },
  })
}

export function useUpdateBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NewBrandData> }) => {
      if (!supabase) throw new Error('Supabase client not available')

      const { data: result, error } = await supabase
        .from('brands')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] })
      toast({
        title: "Marca actualizada",
        description: "La marca se ha actualizado exitosamente.",
        variant: "default",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la marca.",
        variant: "destructive",
      })
    },
  })
}

export function useDeleteBrand() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Supabase client not available')

      const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['brands'] })
      toast({
        title: "Marca eliminada",
        description: "La marca se ha eliminado exitosamente.",
        variant: "default",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la marca.",
        variant: "destructive",
      })
    },
  })
}