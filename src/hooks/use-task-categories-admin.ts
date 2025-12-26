import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';

export interface TaskCategoryAdmin {
  id: string;
  name: string;
  code?: string;
  parent_id: string | null;
  position?: string;
  created_at: string;
  children?: TaskCategoryAdmin[];
}

export interface CreateTaskCategoryData {
  name: string;
  code?: string;
  parent_id?: string | null;
  position?: string;
}

export interface UpdateTaskCategoryData extends CreateTaskCategoryData {
  id: string;
}

export function useAllTaskCategories() {
  return useQuery({
    queryKey: ['all-task-categories'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized');

      const { data: categories, error } = await supabase
        .from('task_categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching all categories:', error);
        throw error;
      }

      return categories || [];
    },
  });
}

export function useSubcategoriesOnly() {
  return useQuery({
    queryKey: ['subcategories-only'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized');

      const { data: categories, error } = await supabase
        .from('task_categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }

      // Filter to get only subcategories (items that have a parent_id and their parent also has a parent_id)
      const subcategories = categories?.filter(category => {
        if (!category.parent_id) return false; // Must have a parent
        
        // Find the parent
        const parent = categories.find(c => c.id === category.parent_id);
        if (!parent) return false;
        
        // Parent must also have a parent (making current item a subcategory)
        return parent.parent_id !== null;
      }) || [];

      return subcategories;
    },
  });
}

export function useTaskCategoriesAdmin() {
  return useQuery({
    queryKey: ['task-categories-admin'],
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      // Fetch categories only - simplified without groups and templates
      const { data: categories, error: categoriesError } = await supabase
        .from('task_categories')
        .select('*')
        .order('name');

      if (categoriesError) {
        throw categoriesError;
      }

      // Build hierarchical structure
      const categoryMap = new Map();
      const rootCategories: TaskCategoryAdmin[] = [];

      // First pass: create all categories
      categories.forEach(category => {
        const categoryWithChildren: TaskCategoryAdmin = {
          ...category,
          children: []
        };
        categoryMap.set(category.id, categoryWithChildren);
      });

      // Second pass: build hierarchy
      categories.forEach(category => {
        const categoryWithChildren = categoryMap.get(category.id);
        if (category.parent_id) {
          const parent = categoryMap.get(category.parent_id);
          if (parent) {
            parent.children!.push(categoryWithChildren);
          }
        } else {
          rootCategories.push(categoryWithChildren);
        }
      });

      // Sort children recursively
      const sortCategories = (cats: TaskCategoryAdmin[]) => {
        cats.sort((a, b) => a.name.localeCompare(b.name));
        cats.forEach(cat => {
          if (cat.children && cat.children.length > 0) {
            sortCategories(cat.children);
          }
        });
      };

      sortCategories(rootCategories);
      return rootCategories;
    },
  });
}

export function useCreateTaskCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (categoryData: CreateTaskCategoryData) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      
      const { data, error } = await supabase
        .from('task_categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) {
        console.error('Error creating category:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-categories-admin'] });
      toast({
        title: "Categoría creada",
        description: "La categoría se ha creado exitosamente.",
      });
    },
    onError: (error: any) => {
      console.error('Create category error:', error);
      toast({
        title: "Error",
        description: "No se pudo crear la categoría. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
}

export function useUpdateTaskCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updateData }: UpdateTaskCategoryData) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      
      const { data, error } = await supabase
        .from('task_categories')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating category:', error);
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-categories-admin'] });
      toast({
        title: "Categoría actualizada",
        description: "La categoría se ha actualizado exitosamente.",
      });
    },
    onError: (error: any) => {
      console.error('Update category error:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la categoría. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteTaskCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!supabase) throw new Error('Supabase client not initialized');
      
      const { error } = await supabase
        .from('task_categories')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting category:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-categories-admin'] });
      toast({
        title: "Categoría eliminada",
        description: "La categoría se ha eliminado exitosamente.",
      });
    },
    onError: (error: any) => {
      console.error('Delete category error:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la categoría. Inténtalo de nuevo.",
        variant: "destructive",
      });
    },
  });
}