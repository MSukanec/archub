import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { GENERAL_COSTS_QUERY_KEYS } from '../constants';
import {
  getGeneralCostCategories,
  getGeneralCostCategoryById,
  createGeneralCostCategory,
  updateGeneralCostCategory,
  deleteGeneralCostCategory,
} from '../services/generalCostCategories';
import type { GeneralCostCategory } from '../types';

export function useGeneralCostCategories(organizationId: string | undefined) {
  return useQuery({
    queryKey: GENERAL_COSTS_QUERY_KEYS.categoriesList(organizationId ?? null),
    queryFn: () => getGeneralCostCategories(organizationId!),
    enabled: !!organizationId,
  });
}

export function useGeneralCostCategory(categoryId: string | undefined, organizationId: string | undefined) {
  return useQuery({
    queryKey: GENERAL_COSTS_QUERY_KEYS.category(categoryId ?? null),
    queryFn: () => getGeneralCostCategoryById(categoryId!, organizationId!),
    enabled: !!categoryId && !!organizationId,
  });
}

export function useCreateGeneralCostCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      category,
      organizationId,
    }: {
      category: Pick<GeneralCostCategory, 'name' | 'description'>;
      organizationId: string;
    }) => createGeneralCostCategory(category, organizationId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: GENERAL_COSTS_QUERY_KEYS.categoriesList(data.organization_id),
      });
      toast({
        title: 'Categoría creada',
        description: 'La categoría se creó correctamente',
      });
    },
    onError: (error) => {
      console.error('Error creating category:', error);
      toast({
        title: 'Error',
        description: 'No se pudo crear la categoría',
        variant: 'destructive',
      });
    },
  });
}

export function useUpdateGeneralCostCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      categoryId,
      updates,
      organizationId,
    }: {
      categoryId: string;
      updates: Pick<GeneralCostCategory, 'name' | 'description'>;
      organizationId: string;
    }) => updateGeneralCostCategory(categoryId, updates, organizationId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: GENERAL_COSTS_QUERY_KEYS.categoriesList(data.organization_id),
      });
      queryClient.invalidateQueries({
        queryKey: GENERAL_COSTS_QUERY_KEYS.category(data.id),
      });
      toast({
        title: 'Categoría actualizada',
        description: 'La categoría se actualizó correctamente',
      });
    },
    onError: (error) => {
      console.error('Error updating category:', error);
      toast({
        title: 'Error',
        description: 'No se pudo actualizar la categoría',
        variant: 'destructive',
      });
    },
  });
}

export function useDeleteGeneralCostCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({
      categoryId,
      organizationId,
    }: {
      categoryId: string;
      organizationId: string;
    }) => deleteGeneralCostCategory(categoryId, organizationId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: GENERAL_COSTS_QUERY_KEYS.categoriesList(variables.organizationId),
      });
      toast({
        title: 'Categoría eliminada',
        description: 'La categoría se eliminó correctamente',
      });
    },
    onError: (error) => {
      console.error('Error deleting category:', error);
      toast({
        title: 'Error',
        description: 'No se pudo eliminar la categoría',
        variant: 'destructive',
      });
    },
  });
}
