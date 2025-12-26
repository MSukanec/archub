import { useQuery } from '@tanstack/react-query';
import { useOptimisticMutation } from '@/core/save-engine';
import { generalCostsKeys } from '@/core/query-keys';
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
    queryKey: generalCostsKeys.categoryList(organizationId),
    queryFn: async () => {
      if (!organizationId) return [];
      return getGeneralCostCategories(organizationId);
    },
    enabled: !!organizationId,
    staleTime: 30000,
  });
}
export function useGeneralCostCategory(categoryId: string | undefined, organizationId: string | undefined) {
  return useQuery({
    queryKey: generalCostsKeys.category(categoryId),
    queryFn: async () => {
      if (!categoryId || !organizationId) return null;
      return getGeneralCostCategoryById(categoryId, organizationId);
    },
    enabled: !!categoryId && !!organizationId,
    staleTime: 30000,
  });
}
interface CreateCategoryParams {
  category: Pick<GeneralCostCategory, 'name'| 'description'>;
  organizationId: string;
}
export function useCreateGeneralCostCategory(organizationId: string | null) {
  return useOptimisticMutation({
    mutationFn: ({ category, organizationId: orgId }: CreateCategoryParams) =>
      createGeneralCostCategory(category, orgId),
    queryKey: generalCostsKeys.categoryList(organizationId),
    optimisticUpdate: (oldData: GeneralCostCategory[] | undefined, { category, organizationId: orgId }: CreateCategoryParams) => {
      if (!oldData) return oldData;
      const tempCategory: GeneralCostCategory = {
        id: `temp-${Date.now()}`,
        organization_id: orgId,
        name: category.name,
        description: category.description,
        is_system: false,
        is_deleted: false,
        deleted_at: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return [...oldData, tempCategory];
    },
    onSuccessMessage: 'Categoría creada',
    onErrorMessage: 'No se pudo crear la categoría',
  });
}
interface UpdateCategoryParams {
  categoryId: string;
  updates: Pick<GeneralCostCategory, 'name'| 'description'>;
  organizationId: string;
}
export function useUpdateGeneralCostCategory(organizationId: string | null) {
  return useOptimisticMutation({
    mutationFn: ({ categoryId, updates, organizationId: orgId }: UpdateCategoryParams) =>
      updateGeneralCostCategory(categoryId, updates, orgId),
    queryKey: generalCostsKeys.categoryList(organizationId),
    optimisticUpdate: (oldData: GeneralCostCategory[] | undefined, { categoryId, updates }: UpdateCategoryParams) => {
      if (!oldData) return oldData;
      return oldData.map((cat) =>
        cat.id === categoryId
          ? { ...cat, ...updates, updated_at: new Date().toISOString() }
          : cat
      );
    },
    onSuccessMessage: 'Categoría actualizada',
    onErrorMessage: 'No se pudo actualizar la categoría',
  });
}
interface DeleteCategoryParams {
  categoryId: string;
  organizationId: string;
}
export function useDeleteGeneralCostCategory(organizationId: string | null) {
  return useOptimisticMutation({
    mutationFn: ({ categoryId, organizationId: orgId }: DeleteCategoryParams) =>
      deleteGeneralCostCategory(categoryId, orgId),
    queryKey: generalCostsKeys.categoryList(organizationId),
    optimisticUpdate: (oldData: GeneralCostCategory[] | undefined, { categoryId }: DeleteCategoryParams) => {
      if (!oldData) return oldData;
      return oldData.filter((cat) => cat.id !== categoryId);
    },
    additionalQueryKeys: [
      generalCostsKeys.list(organizationId),
      generalCostsKeys.byCategoryList(organizationId),
    ],
    onSuccessMessage: 'Categoría eliminada',
    onErrorMessage: 'No se pudo eliminar la categoría',
  });
}
