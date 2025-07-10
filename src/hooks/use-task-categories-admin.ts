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
  taskGroups?: TaskGroupAdmin[];
  template?: {
    id: string;
    name_template: string;
    task_group_name?: string;
  } | null;
}

export interface TaskGroupAdmin {
  id: string;
  name: string;
  category_id: string;
  created_at: string;
  updated_at: string;
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

export function useTaskCategoriesAdmin() {
  return useQuery({
    queryKey: ['task-categories-admin'],
    queryFn: async () => {
      if (!supabase) throw new Error('Supabase client not initialized');

      // Fetch categories with their templates
      const { data: categories, error: categoriesError } = await supabase
        .from('task_categories')
        .select('*')
        .order('name');

      if (categoriesError) {
        console.error('Error fetching categories:', categoriesError);
        throw categoriesError;
      }

      // Fetch task groups and templates using the new relationship structure
      const { data: taskGroupsWithTemplates, error: templatesError } = await supabase
        .from('task_groups')
        .select(`
          id,
          category_id,
          name,
          created_at,
          updated_at,
          task_templates (
            id,
            name_template
          )
        `);

      if (templatesError) {
        console.error('Error fetching templates:', templatesError);
        throw templatesError;
      }

      // Build hierarchical structure
      const categoryMap = new Map();
      const rootCategories: TaskCategoryAdmin[] = [];

      // First pass: create all categories with task groups and template info
      categories.forEach(category => {
        // Find task groups for this category
        const categoryTaskGroups = taskGroupsWithTemplates?.filter(tg => tg.category_id === category.id) || [];
        
        // Convert task groups to TaskGroupAdmin format
        const taskGroups: TaskGroupAdmin[] = categoryTaskGroups.map(tg => ({
          id: tg.id,
          name: tg.name,
          category_id: tg.category_id,
          created_at: tg.created_at,
          updated_at: tg.updated_at,
        }));

        // Check if category has templates
        const hasTemplate = categoryTaskGroups.some(tg => tg.task_templates && tg.task_templates.length > 0);
        
        let template = null;
        if (hasTemplate) {
          const firstGroupWithTemplate = categoryTaskGroups.find(tg => tg.task_templates && tg.task_templates.length > 0);
          if (firstGroupWithTemplate && firstGroupWithTemplate.task_templates && firstGroupWithTemplate.task_templates.length > 0) {
            template = {
              id: firstGroupWithTemplate.task_templates[0].id,
              name_template: firstGroupWithTemplate.task_templates[0].name_template,
              task_group_name: firstGroupWithTemplate.name
            };
          }
        }
        
        const categoryWithTemplate: TaskCategoryAdmin = {
          ...category,
          children: [],
          taskGroups,
          template
        };
        categoryMap.set(category.id, categoryWithTemplate);
      });

      // Second pass: build hierarchy
      categories.forEach(category => {
        const categoryWithTemplate = categoryMap.get(category.id);
        if (category.parent_id) {
          const parent = categoryMap.get(category.parent_id);
          if (parent) {
            parent.children!.push(categoryWithTemplate);
          }
        } else {
          rootCategories.push(categoryWithTemplate);
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