import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

export interface MaterialCategory {
  id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  children?: MaterialCategory[];
}

export interface NewMaterialCategoryData {
  name: string;
  parent_id?: string | null;
}

export function useMaterialCategories() {
  return useQuery({
    queryKey: ['material-categories'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not available');

      const { data, error } = await supabase
        .from('material_categories')
        .select(`
          id,
          name,
          parent_id,
          created_at
        `)
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }

      // Transform flat data into hierarchical structure
      const categories = (data || []) as MaterialCategory[];
      
      // Build hierarchy by creating a map of parent-child relationships
      const categoryMap = new Map<string, MaterialCategory>();
      const rootCategories: MaterialCategory[] = [];
      
      // First pass: create map with all categories
      categories.forEach(category => {
        categoryMap.set(category.id, { ...category, children: [] });
      });
      
      // Second pass: build parent-child relationships
      categories.forEach(category => {
        const categoryWithChildren = categoryMap.get(category.id)!;
        
        if (category.parent_id) {
          // This is a child category
          const parent = categoryMap.get(category.parent_id);
          if (parent) {
            parent.children!.push(categoryWithChildren);
          }
        } else {
          // This is a root category
          rootCategories.push(categoryWithChildren);
        }
      });
      
      return rootCategories;
    },
  });
}

export function useCreateMaterialCategory() {
  return useMutation({
    mutationFn: async (data: NewMaterialCategoryData) => {
      if (!supabase) throw new Error('Supabase client not available');

      const { data: result, error } = await supabase
        .from('material_categories')
        .insert([data])
        .select()
        .single();

      if (error) {
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-categories'] });
      toast({
        title: "Categoría creada",
        description: "La categoría de material se ha creado exitosamente.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      
      let errorMessage = "No se pudo crear la categoría de material.";
      
      // Check for specific foreign key constraint error
      if (error?.code === '23503' && error?.message?.includes('material_categories_parent_id_fkey')) {
        if (error?.details?.includes('movement_concepts')) {
          errorMessage = "🔧 Error de BD: El constraint parent_id apunta incorrectamente a movement_concepts. Ve al SQL Editor en Supabase y ejecuta: DROP CONSTRAINT material_categories_parent_id_fkey CASCADE; luego ADD CONSTRAINT material_categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES material_categories(id);";
        } else {
          errorMessage = "Error de configuración de base de datos: El constraint de foreign key para parent_id está mal configurado.";
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}

export function useUpdateMaterialCategory() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<NewMaterialCategoryData> }) => {
      if (!supabase) throw new Error('Supabase client not available');

      const { data: result, error } = await supabase
        .from('material_categories')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-categories'] });
      toast({
        title: "Categoría actualizada",
        description: "La categoría de material se ha actualizado exitosamente.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      
      let errorMessage = "No se pudo actualizar la categoría de material.";
      
      // Check for specific foreign key constraint error
      if (error?.code === '23503' && error?.message?.includes('material_categories_parent_id_fkey')) {
        if (error?.details?.includes('movement_concepts')) {
          errorMessage = "🔧 Error de BD: El constraint parent_id apunta incorrectamente a movement_concepts. Ve al SQL Editor en Supabase y ejecuta: DROP CONSTRAINT material_categories_parent_id_fkey CASCADE; luego ADD CONSTRAINT material_categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES material_categories(id);";
        } else {
          errorMessage = "Error de configuración de base de datos: El constraint de foreign key para parent_id está mal configurado.";
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });
}

export function useDeleteMaterialCategory() {
  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Supabase client not available');

      const { error } = await supabase
        .from('material_categories')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-categories'] });
      toast({
        title: "Categoría eliminada",
        description: "La categoría de material se ha eliminado exitosamente.",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría de material.",
        variant: "destructive",
      });
    },
  });
}