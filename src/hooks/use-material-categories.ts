import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';

export interface MaterialCategory {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  created_by: string;
  creator?: {
    id: string;
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

export interface NewMaterialCategoryData {
  name: string;
  description?: string;
  created_by: string;
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
          description,
          created_at,
          created_by,
          creator:users!created_by (
            id,
            full_name,
            email,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching material categories:', error);
        throw error;
      }

      return (data || []).map(item => ({
        ...item,
        creator: item.creator?.[0] || undefined
      })) as MaterialCategory[];
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
        console.error('Error creating material category:', error);
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
    onError: (error) => {
      console.error('Error creating material category:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la categoría de material.",
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
        console.error('Error updating material category:', error);
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
    onError: (error) => {
      console.error('Error updating material category:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la categoría de material.",
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
        console.error('Error deleting material category:', error);
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
      console.error('Error deleting material category:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría de material.",
        variant: "destructive",
      });
    },
  });
}