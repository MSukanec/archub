import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useCurrentUser } from './use-current-user'
import { toast } from '@/hooks/use-toast'
import { InsertOrganizationMaterialPrice } from '@/shared/schema'

export interface Material {
  id: string
  name: string
  unit_id: string
  category_id: string
  organization_id?: string
  is_system: boolean
  created_at: string
  unit?: { name: string }
  category?: { name: string }
}

export interface NewMaterialData {
  name: string
  unit_id: string
  category_id: string
  organization_id?: string
  is_system?: boolean
}

// MaterialPriceData interface eliminada - usar InsertOrganizationMaterialPrice del schema

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
  const { data: userData } = useCurrentUser()

  return useMutation({
    mutationFn: async (data: NewMaterialData) => {
      if (!supabase) throw new Error('Supabase client not available')

      // Prepare material data with organization context
      const materialData = {
        ...data,
        organization_id: userData?.organization?.id || null,
        is_system: false // Always false for organization-created materials
      }

      const { data: result, error } = await supabase
        .from('materials')
        .insert([materialData])
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

export function useCreateMaterialPrice() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: InsertOrganizationMaterialPrice) => {
      if (!supabase) throw new Error('Supabase client not available')

      const { data: result, error } = await supabase
        .from('organization_material_prices')
        .insert([data])
        .select()
        .single()

      if (error) {
        console.error('Error creating material price:', error)
        throw error
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-prices'] })
      queryClient.invalidateQueries({ queryKey: ['materials'] })
    },
    onError: (error) => {
      console.error('Error creating material price:', error)
      toast({
        title: "Error",
        description: "No se pudo guardar el precio del material.",
        variant: "destructive",
      })
    },
  })
}

// Hook para obtener precio de un material específico
export function useMaterialPrice(materialId: string, organizationId: string) {
  return useQuery({
    queryKey: ['material-price', materialId, organizationId],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not available')

      const { data, error } = await supabase
        .from('organization_material_prices')
        .select(`
          *,
          currency:currencies(*)
        `)
        .eq('material_id', materialId)
        .eq('organization_id', organizationId)
        .single()

      if (error && error.code !== 'PGRST116') {
        throw error
      }

      return data
    },
    enabled: !!materialId && !!organizationId && !!supabase,
  })
}

// Hook para actualizar precio de material
export function useUpdateMaterialPrice() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertOrganizationMaterialPrice> }) => {
      if (!supabase) throw new Error('Supabase client not available')
      
      const { data: result, error } = await supabase
        .from('organization_material_prices')
        .update(data)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        console.error('Error updating material price:', error)
        throw error
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] })
      queryClient.invalidateQueries({ queryKey: ['material-prices'] })
      queryClient.invalidateQueries({ queryKey: ['material-price'] })
    },
    onError: (error) => {
      console.error('Error updating material price:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el precio del material.",
        variant: "destructive",
      })
    },
  })
}