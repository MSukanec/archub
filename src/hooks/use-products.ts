import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';

export interface Product {
  id: string;
  material_id: string;
  brand_id?: string;
  unit_presentation_id?: string;
  name: string;
  description?: string;
  image_url?: string;
  created_at: string;
  // Relaciones
  material?: {
    id: string;
    name: string;
  };
  brand?: {
    id: string;
    name: string;
  };
  unit_presentation?: {
    id: string;
    name: string;
    equivalence: number;
    unit?: {
      id: string;
      name: string;
    };
  };
}

export interface NewProductData {
  material_id: string;
  brand_id?: string;
  unit_presentation_id?: string;
  name: string;
  description?: string;
  image_url?: string;
}

export function useProducts() {
  const { data: userData } = useCurrentUser()
  
  return useQuery({
    queryKey: ['products', userData?.organization?.id],
    queryFn: async () => {
      if (!supabase) {
        return []
      }

      const { data, error } = await supabase
        .from('product_models')
        .select(`
          *,
          material:materials(id, name),
          brand:brands(id, name),
          unit_presentation:unit_presentations(
            id, name, equivalence,
            unit:units(id, name)
          )
        `)
        .order('name')

      if (error) {
        console.error('Error fetching products:', error)
        throw error
      }

      return data || []
    },
    enabled: !!supabase
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  const { data: userData } = useCurrentUser()

  return useMutation({
    mutationFn: async (data: NewProductData) => {
      if (!supabase) throw new Error('Supabase client not available')

      const { data: result, error } = await supabase
        .from('product_models')
        .insert([data])
        .select(`
          *,
          material:materials(id, name),
          brand:brands(id, name),
          unit_presentation:unit_presentations(
            id, name, equivalence,
            unit:units(id, name)
          )
        `)
        .single()

      if (error) {
        console.error('Error creating product:', error)
        throw error
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: "Producto creado",
        description: "El producto se ha creado exitosamente.",
        variant: "default",
      })
    },
    onError: (error) => {
      console.error('Error creating product:', error)
      toast({
        title: "Error",
        description: "No se pudo crear el producto.",
        variant: "destructive",
      })
    },
  })
}

export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NewProductData> }) => {
      if (!supabase) throw new Error('Supabase client not available')

      const { data: result, error } = await supabase
        .from('product_models')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          material:materials(id, name),
          brand:brands(id, name),
          unit_presentation:unit_presentations(
            id, name, equivalence,
            unit:units(id, name)
          )
        `)
        .single()

      if (error) {
        console.error('Error updating product:', error)
        throw error
      }

      return result
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: "Producto actualizado",
        description: "El producto se ha actualizado exitosamente.",
        variant: "default",
      })
    },
    onError: (error) => {
      console.error('Error updating product:', error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el producto.",
        variant: "destructive",
      })
    },
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Supabase client not available')

      const { error } = await supabase
        .from('product_models')
        .delete()
        .eq('id', id)

      if (error) {
        console.error('Error deleting product:', error)
        throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      toast({
        title: "Producto eliminado",
        description: "El producto se ha eliminado exitosamente.",
        variant: "default",
      })
    },
    onError: (error) => {
      console.error('Error deleting product:', error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto.",
        variant: "destructive",
      })
    },
  })
}