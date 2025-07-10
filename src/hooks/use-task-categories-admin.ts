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
  template_id?: string | null;
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
    retry: false,
    refetchOnWindowFocus: false,
    queryFn: async () => {
      console.log('🔍 Starting task categories admin query...');
      
      if (!supabase) {
        console.error('❌ Supabase client not initialized');
        throw new Error('Supabase client not initialized');
      }

      console.log('✅ Supabase client OK, fetching categories...');

      // Fetch categories with their templates
      const { data: categories, error: categoriesError } = await supabase
        .from('task_categories')
        .select('*')
        .order('name');

      if (categoriesError) {
        console.error('❌ Error fetching categories:', categoriesError);
        throw categoriesError;
      }

      console.log('✅ Categories fetched successfully:', categories?.length || 0);

      // Fetch task groups first without templates to avoid relationship conflicts
      console.log('Fetching task groups...');
      const { data: taskGroups, error: taskGroupsError } = await supabase
        .from('task_groups')
        .select('*');

      if (taskGroupsError) {
        console.error('Error fetching task groups:', taskGroupsError);
        throw taskGroupsError;
      }

      console.log('Task groups fetched successfully:', taskGroups?.length || 0, taskGroups);
      
      // Let's specifically look for the "Muertos" task group
      const muertosGroup = taskGroups?.find(tg => tg.name.includes('Muertos') || tg.name.includes('Muertos'));
      if (muertosGroup) {
        console.log('🎯 Found Muertos task group:', muertosGroup);
      } else {
        console.log('❌ Muertos task group not found');
        console.log('🔍 All task group names:', taskGroups?.map(tg => tg.name));
      }

      // Fetch templates separately if needed
      console.log('Fetching templates...');
      const { data: templates, error: templatesError } = await supabase
        .from('task_templates')
        .select('id, name_template, task_group_id');

      if (templatesError) {
        console.error('Error fetching templates:', templatesError);
        // Don't throw here, templates are optional
      }

      console.log('Templates fetched successfully:', templates?.length || 0, templates);

      // Build hierarchical structure
      const categoryMap = new Map();
      const rootCategories: TaskCategoryAdmin[] = [];

      // First pass: create all categories with task groups and template info
      categories.forEach(category => {
        // Find task groups for this category
        const categoryTaskGroups = taskGroups?.filter(tg => tg.category_id === category.id) || [];
        
        console.log(`Category ${category.name} has ${categoryTaskGroups.length} task groups:`, categoryTaskGroups);
        
        // Convert task groups to TaskGroupAdmin format
        const taskGroupsForCategory: TaskGroupAdmin[] = categoryTaskGroups.map(tg => ({
          id: tg.id,
          name: tg.name,
          category_id: tg.category_id,
          template_id: tg.template_id,
          created_at: tg.created_at,
          updated_at: tg.updated_at,
        }));

        // Check if category has templates (match templates with task groups)
        const categoryTemplates = templates?.filter(t => 
          categoryTaskGroups.some(tg => tg.id === t.task_group_id)
        ) || [];
        
        let template = null;
        if (categoryTemplates.length > 0) {
          const firstTemplate = categoryTemplates[0];
          const associatedTaskGroup = categoryTaskGroups.find(tg => tg.id === firstTemplate.task_group_id);
          template = {
            id: firstTemplate.id,
            name_template: firstTemplate.name_template,
            task_group_name: associatedTaskGroup?.name || ''
          };
        }
        
        const categoryWithTemplate: TaskCategoryAdmin = {
          ...category,
          children: [],
          taskGroups: taskGroupsForCategory,
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