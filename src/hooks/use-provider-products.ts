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
    queryFn: async () => {
      if (!organizationId || !supabase) return [];

      const { data, error } = await supabase
        .from('provider_products')
        .select(`
          *,
          product_prices (
            id,
            currency_id,
            price,
            currencies (
              id,
              name,
              symbol
            )
          )
        `)
        .eq('organization_id', organizationId);

      if (error) {
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
    mutationFn: async ({ productId, isActive, providerCode, currencyId, price }: { 
      productId: string; 
      isActive: boolean; 
      providerCode?: string;
      currencyId?: string;
      price?: number;
    }) => {
      
      if (!organizationId || !supabase) {
        throw new Error('No organization or supabase client');
      }

      try {
        // Primero verificar si ya existe el provider_product
        const { data: existing, error: selectError } = await supabase
          .from('provider_products')
          .select('id, is_active')
          .eq('organization_id', organizationId)
          .eq('product_id', productId)
          .single();

        if (selectError && selectError.code !== 'PGRST116') {
          throw selectError;
        }

        let providerProduct;

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
          providerProduct = data;
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
          providerProduct = data;
        }

        // Solo manejar product_prices cuando se activa un producto Y se proporcionan AMBOS precio Y moneda
        if (providerProduct && isActive && currencyId && price !== undefined) {
          // Verificar si ya existe un precio para este provider_product
          const { data: existingPrice, error: priceSelectError } = await supabase
            .from('product_prices')
            .select('id')
            .eq('provider_product_id', providerProduct.id)
            .single();

          if (priceSelectError && priceSelectError.code !== 'PGRST116') {
          }

          if (existingPrice) {
            // Si existe y se proporcionan currencyId/price, actualizar
            if (currencyId && price !== undefined) {
              
              const { error: priceUpdateError } = await supabase
                .from('product_prices')
                .update({
                  currency_id: currencyId,
                  price: price,
                  updated_at: new Date().toISOString()
                })
                .eq('id', existingPrice.id);

              if (priceUpdateError) {
              } else {
              }
            }
          } else {
            // No existe, crear nueva entrada
            let insertData: any = {
              provider_product_id: providerProduct.id,
              currency_id: null,
              price: null
            };

            // Si se proporcionan currencyId/price, usarlos
            if (currencyId && price !== undefined) {
              insertData.currency_id = currencyId;
              insertData.price = price;
            }

            const { error: priceInsertError } = await supabase
              .from('product_prices')
              .insert(insertData);

            if (priceInsertError) {
            }
          }
        }

        return providerProduct;
      } catch (error) {
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidar múltiples queries para asegurar actualización completa
      queryClient.invalidateQueries({ queryKey: ['provider-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      // Forzar re-render inmediato
      queryClient.refetchQueries({ queryKey: ['provider-products'] });
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