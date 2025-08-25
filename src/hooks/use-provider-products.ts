import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from '@/hooks/use-toast';
import { useCurrentUser } from '@/hooks/use-current-user';

export interface ProviderProduct {
  id: string;
  organization_id: string;
  product_id: string;
  provider_code?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NewProviderProductData {
  organization_id: string;
  product_id: string;
  provider_code?: string;
  is_active?: boolean;
}

// Hook para obtener los productos del proveedor (organización actual)
export function useProviderProducts() {
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;

  return useQuery({
    queryKey: ['provider-products', organizationId],
    queryFn: async (): Promise<ProviderProduct[]> => {
      if (!organizationId || !supabase) return [];

      const { data, error } = await supabase
        .from('provider_products')
        .select('*')
        .eq('organization_id', organizationId);

      if (error) {
        console.error('Error fetching provider products:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!organizationId && !!supabase,
  });
}

// Hook para crear o actualizar un producto de proveedor
export function useToggleProviderProduct() {
  const queryClient = useQueryClient();
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;

  return useMutation({
    mutationFn: async ({ productId, isActive, providerCode }: { productId: string; isActive: boolean; providerCode?: string }) => {
      if (!organizationId || !supabase) {
        throw new Error('No organization or supabase client');
      }

      try {
        // Primero verificar si ya existe
        const { data: existing, error: selectError } = await supabase
          .from('provider_products')
          .select('id, is_active')
          .eq('organization_id', organizationId)
          .eq('product_id', productId)
          .single();

        if (selectError && selectError.code !== 'PGRST116') {
          throw selectError;
        }

        if (existing) {
          // Actualizar existente
          const updateData: any = { 
            is_active: isActive, 
            updated_at: new Date().toISOString() 
          };
          
          if (providerCode !== undefined) {
            updateData.provider_code = providerCode;
          }

          const { data, error } = await supabase
            .from('provider_products')
            .update(updateData)
            .eq('id', existing.id)
            .select()
            .single();

          if (error) throw error;
          return data;
        } else {
          // Crear nuevo
          const insertData: any = {
            organization_id: organizationId,
            product_id: productId,
            is_active: isActive
          };
          
          if (providerCode !== undefined) {
            insertData.provider_code = providerCode;
          }

          const { data, error } = await supabase
            .from('provider_products')
            .insert(insertData)
            .select()
            .single();

          if (error) throw error;
          return data;
        }
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider-products'] });
      toast({
        title: "Producto actualizado",
        description: "La selección del producto se ha guardado correctamente.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "No se pudo actualizar la selección del producto.",
        variant: "destructive"
      });
    },
  });
}

// Hook para obtener el estado de selección de un producto específico
export function useIsProductSelected(productId: string) {
  const { data: providerProducts = [] } = useProviderProducts();
  
  const providerProduct = providerProducts.find(pp => pp.product_id === productId);
  return providerProduct?.is_active || false;
}