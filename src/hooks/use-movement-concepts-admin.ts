import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useToast } from '@/hooks/use-toast'

export interface MovementConceptAdmin {
  id: string
  name: string
  description?: string
  parent_id?: string
  organization_id?: string
  created_at: string
  children?: MovementConceptAdmin[]
}

export const useMovementConceptsAdmin = () => {
  return useQuery({
    queryKey: ['movement-concepts-admin'],
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data: concepts, error } = await supabase
        .from('movement_concepts')
        .select('*')
        .order('name')

      if (error) {
        console.error('Error fetching movement concepts:', error)
        throw error
      }

      // Build hierarchical structure
      const conceptMap = new Map<string, MovementConceptAdmin>()
      const rootConcepts: MovementConceptAdmin[] = []

      // First, create all concepts in the map
      concepts.forEach((concept: any) => {
        conceptMap.set(concept.id, { ...concept, children: [] })
      })

      // Then, build the hierarchy
      concepts.forEach((concept: any) => {
        if (concept.parent_id) {
          const parent = conceptMap.get(concept.parent_id)
          if (parent) {
            parent.children?.push(conceptMap.get(concept.id)!)
          }
        } else {
          rootConcepts.push(conceptMap.get(concept.id)!)
        }
      })

      return rootConcepts
    }
  })
}

export const useCreateMovementConcept = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (conceptData: {
      name: string
      description?: string
      parent_id?: string
      organization_id?: string
    }) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data, error } = await supabase
        .from('movement_concepts')
        .insert([conceptData])
        .select()
        .single()

      if (error) {
        console.error('Error creating movement concept:', error)
        throw error
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movement-concepts-admin'] })
      toast({
        title: "Éxito",
        description: "Concepto de movimiento creado correctamente"
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo crear el concepto de movimiento",
        variant: "destructive"
      })
    }
  })
}

export const useUpdateMovementConcept = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async ({ id, ...updates }: {
      id: string
      name?: string
      description?: string
      parent_id?: string
    }) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data, error } = await supabase
        .from('movement_concepts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating movement concept:', error)
        throw error
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movement-concepts-admin'] })
      toast({
        title: "Éxito",
        description: "Concepto de movimiento actualizado correctamente"
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el concepto de movimiento",
        variant: "destructive"
      })
    }
  })
}

export const useDeleteMovementConcept = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { error } = await supabase
        .from('movement_concepts')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting movement concept:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movement-concepts-admin'] })
      toast({
        title: "Éxito",
        description: "Concepto de movimiento eliminado correctamente"
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el concepto de movimiento",
        variant: "destructive"
      })
    }
  })
}

export const useParentMovementConcepts = () => {
  return useQuery({
    queryKey: ['parent-movement-concepts'],
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not initialized')
      }

      const { data, error } = await supabase
        .from('movement_concepts')
        .select('*')
        .is('parent_id', null)
        .order('name')

      if (error) {
        console.error('Error fetching parent movement concepts:', error)
        throw error
      }

      return data
    }
  })
}