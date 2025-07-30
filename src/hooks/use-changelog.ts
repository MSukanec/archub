import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export interface ChangelogEntry {
  id: string
  title: string
  description: string
  type: 'Novedad' | 'Mejora' | 'Arreglo de Errores'
  date: string
  is_public: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export function useChangelogEntries() {
  return useQuery({
    queryKey: ['changelog-entries'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not available')

      const { data, error } = await supabase
        .from('changelog_entries')
        .select('*')
        .eq('is_public', true)
        .order('date', { ascending: false })

      if (error) throw error
      return data as ChangelogEntry[]
    },
  })
}

export function useCreateChangelogEntry() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (entry: {
      title: string
      description: string
      type: 'Novedad' | 'Mejora' | 'Arreglo de Errores'
      date: string
      is_public: boolean
      created_by: string
    }) => {
      if (!supabase) throw new Error('Supabase client not available')

      const { data, error } = await supabase
        .from('changelog_entries')
        .insert([entry])
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changelog-entries'] })
      toast({
        title: 'Entrada creada',
        description: 'La entrada del changelog se ha creado correctamente.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo crear la entrada del changelog.',
        variant: 'destructive',
      })
    },
  })
}

export function useUpdateChangelogEntry() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, updates }: {
      id: string
      updates: Partial<Omit<ChangelogEntry, 'id' | 'created_at' | 'updated_at'>>
    }) => {
      if (!supabase) throw new Error('Supabase client not available')

      const { data, error } = await supabase
        .from('changelog_entries')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changelog-entries'] })
      toast({
        title: 'Entrada actualizada',
        description: 'La entrada del changelog se ha actualizado correctamente.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la entrada del changelog.',
        variant: 'destructive',
      })
    },
  })
}

export function useDeleteChangelogEntry() {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Supabase client not available')

      const { error } = await supabase
        .from('changelog_entries')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['changelog-entries'] })
      toast({
        title: 'Entrada eliminada',
        description: 'La entrada del changelog se ha eliminado correctamente.',
      })
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la entrada del changelog.',
        variant: 'destructive',
      })
    },
  })
}