import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';

export interface UnitPresentation {
  id: string;
  unit_id: string;
  name: string;
  equivalence: number;
  description?: string;
  created_at: string;
  updated_at: string;
  // Relaciones
  unit?: {
    id: string;
    name: string;
  };
}

export interface NewUnitPresentationData {
  unit_id: string;
  name: string;
  equivalence: number;
  description?: string;
}

export function useUnitPresentations() {
  const { data: userData } = useCurrentUser()
  
  return useQuery({
    queryKey: ['unit-presentations', userData?.organization?.id],
    queryFn: async () => {
      if (!supabase) {
        return []
      }

      const { data, error } = await supabase
        .from('unit_presentations')
        .select(`
          *,
          unit:units(id, name)
        `)
        .order('name')

      if (error) {
        throw error
      }

      return data || []
    },
    enabled: !!supabase
  })
}

export function useCreateUnitPresentation() {
  const queryClient = useQueryClient()
  const { data: userData } = useCurrentUser()

  return useMutation({
    mutationFn: async (data: NewUnitPresentationData) => {
      if (!supabase) throw new Error('Supabase client not available')

      const { data: result, error } = await supabase
        .from('unit_presentations')
        .insert([data])
        .select(`
          *,
          unit:units(id, name)
        `)
        .single()

      if (error) {
        throw error
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-presentations'] })
      toast({
        title: "Unidad creada",
        description: "La unidad de presentación se ha creado exitosamente.",
        variant: "default",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear la unidad de presentación.",
        variant: "destructive",
      })
    },
  })
}

export function useUpdateUnitPresentation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NewUnitPresentationData> }) => {
      if (!supabase) throw new Error('Supabase client not available')

      const { data: result, error } = await supabase
        .from('unit_presentations')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          unit:units(id, name)
        `)
        .single()

      if (error) {
        throw error
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-presentations'] })
      toast({
        title: "Unidad actualizada",
        description: "La unidad de presentación se ha actualizado exitosamente.",
        variant: "default",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar la unidad de presentación.",
        variant: "destructive",
      })
    },
  })
}

export function useDeleteUnitPresentation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Supabase client not available')

      const { error } = await supabase
        .from('unit_presentations')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unit-presentations'] })
      toast({
        title: "Unidad eliminada",
        description: "La unidad de presentación se ha eliminado exitosamente.",
        variant: "default",
      })
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la unidad de presentación.",
        variant: "destructive",
      })
    },
  })
}