import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';

// Helper function to build category hierarchy path
async function buildCategoryHierarchy(categoryId: string): Promise<string> {
  if (!categoryId || !supabase) return 'Sin categoría';
  
  const hierarchy: string[] = [];
  let currentCategoryId: string | null = categoryId;
  
  // Traverse up the hierarchy
  while (currentCategoryId) {
    const { data: category, error }: { data: { name: string; parent_id: string | null } | null; error: any } = await supabase
      .from('material_categories')
      .select('name, parent_id')
      .eq('id', currentCategoryId)
      .single();
    
    if (error || !category) break;
    
    hierarchy.unshift(category.name); // Add to beginning of array
    currentCategoryId = category.parent_id;
  }
  
  return hierarchy.length > 0 ? hierarchy.join(' > ') : 'Sin categoría';
}

export interface Product {
  id: string;
  material_id: string;
  brand_id?: string;
  unit_id?: string;
  name: string;
  description?: string;
  image_url?: string;
  url?: string;
  default_price?: number;
  default_provider?: string;
  is_system?: boolean;
  created_at: string;
  // Campos calculados
  categoryHierarchy?: string;
  // Relaciones
  material?: {
    id: string;
    name: string;
    category_id: string;
    category?: {
      id: string;
      name: string;
      parent_id: string | null;
    };
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
  unit_id?: string;
  name: string;
  description?: string;
  image_url?: string;
  url?: string;
  default_price?: number;
  default_provider?: string;
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
        .from('products')
        .select(`
          *,
          material:materials(
            id, name, category_id,
            category:material_categories!materials_category_id_fkey(id, name, parent_id)
          ),
          brand:brands(id, name),
          unit_presentation:unit_presentations!unit_id(
            id, name, equivalence,
            unit:units(id, name)
          )
        `)
        .order('name')

      if (error) {
        console.error('Error fetching products:', error)
        throw error
      }

      // Build category hierarchy for each product
      const productsWithHierarchy = await Promise.all(
        (data || []).map(async (product: any) => {
          const categoryHierarchy = product.material?.category_id 
            ? await buildCategoryHierarchy(product.material.category_id)
            : 'Sin categoría';
          
          return {
            ...product,
            categoryHierarchy
          };
        })
      );

      return productsWithHierarchy
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
        .from('products')
        .insert([data])
        .select(`
          *,
          material:materials(
            id, name, category_id,
            category:material_categories!materials_category_id_fkey(id, name, parent_id)
          ),
          brand:brands(id, name),
          unit_presentation:unit_presentations!unit_id(
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
        .from('products')
        .update(data)
        .eq('id', id)
        .select(`
          *,
          material:materials(
            id, name, category_id,
            category:material_categories!materials_category_id_fkey(id, name, parent_id)
          ),
          brand:brands(id, name),
          unit_presentation:unit_presentations!unit_id(
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
        .from('products')
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