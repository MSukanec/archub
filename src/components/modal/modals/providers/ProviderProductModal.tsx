import { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useOrganizationCurrencies } from '@/hooks/use-currencies';
import { useToggleProviderProduct, useProviderProducts } from '@/hooks/use-provider-products';
import { FormModalLayout } from "@/components/modal/form/FormModalLayout";
import { FormModalHeader } from "@/components/modal/form/FormModalHeader";
import { FormModalFooter } from "@/components/modal/form/FormModalFooter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CurrencyAmountField } from '@/components/ui-custom/fields/CurrencyAmountField';
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  provider_code: z.string().optional(),
  currency_id: z.string().optional(),
  amount: z.number().min(0, "El precio debe ser mayor or igual a 0").optional(),
});

type FormData = z.infer<typeof formSchema>;

interface ProviderProductModalProps {
  modalData?: {
    product?: {
      id: string;
      name: string;
      material?: string;
      brand?: string;
      unit?: string;
      default_price?: number;
      categoryHierarchy?: string;
      category_hierarchy?: string;
    };
  };
  onClose: () => void;
}

export function ProviderProductModal({ modalData, onClose }: ProviderProductModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const product = modalData?.product;
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  const { data: organizationCurrencies = [] } = useOrganizationCurrencies(organizationId);
  const { data: providerProducts = [] } = useProviderProducts();
  const toggleProviderProduct = useToggleProviderProduct();
  
  // Obtener moneda por defecto de la organización
  const defaultCurrency = organizationCurrencies.find(oc => oc.is_default)?.currency;
  
  // Formatear monedas para CurrencyAmountField
  const currencies = organizationCurrencies.map(oc => oc.currency);
  

  // Obtener el provider product actual para este producto
  const currentProviderProduct = providerProducts.find(pp => pp.product_id === product?.id);
  const currentPrice = currentProviderProduct?.product_prices?.[0];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      provider_code: '',
      currency_id: defaultCurrency?.id || '',
      amount: undefined,
    },
  });

  // Actualizar valores cuando cambie la moneda por defecto o el provider product
  useEffect(() => {
    // Solo proceder si tenemos las monedas cargadas
    if (organizationCurrencies.length === 0) return;
    
    // Establecer valores iniciales
    if (currentProviderProduct?.provider_code) {
      form.setValue('provider_code', currentProviderProduct.provider_code);
    } else {
      form.setValue('provider_code', '');
    }
    
    if (currentPrice) {
      form.setValue('currency_id', currentPrice.currency_id || '');
      form.setValue('amount', currentPrice.price || undefined);
    } else {
      // Si no hay precio, usar moneda por defecto (UUID de currencies, no de organization_currencies)
      if (defaultCurrency?.id) {
          form.setValue('currency_id', defaultCurrency.id);
        // Forzar trigger para que se actualice el CurrencyAmountField
        form.trigger('currency_id');
      }
      form.setValue('amount', undefined);
    }
  }, [defaultCurrency, currentProviderProduct, currentPrice, form, organizationCurrencies.length]);

  const handleSubmit = async (data: FormData) => {
    if (!product?.id) return;
    
    // Si no hay currency_id, usar la moneda por defecto
    if (!data.currency_id && defaultCurrency?.id) {
      data.currency_id = defaultCurrency.id;
    }
    
    if (!data.currency_id) {
      console.error('No se pudo determinar la moneda');
      return;
    }
    
    setIsLoading(true);
    try {
      const requestData = {
        productId: product.id,
        isActive: true,
        providerCode: data.provider_code,
        currencyId: data.currency_id, // ENVIAR EL UUID DIRECTAMENTE
        price: data.amount || 0
      };
      
      console.log('Guardando producto con:', requestData);
      
      // Actualizar el provider_code, moneda y precio usando el hook existente
      await toggleProviderProduct.mutateAsync(requestData);
      
      onClose();
    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const editPanel = (
    <div className="space-y-6">
      {/* Información del Producto */}
      {product && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Información del Producto
            </label>
          </div>
          
          <div className="space-y-2 text-sm">
            <div>
              <span className="font-medium">Categoría:</span> {product.category_hierarchy?.split(' > ')[0] || product.categoryHierarchy?.split(' > ')[0] || 'Sin categoría'}
            </div>
            <div>
              <span className="font-medium">Material:</span> {product.material || 'No especificado'}
            </div>
            <div>
              <span className="font-medium">Marca:</span> {product.brand || 'No especificada'}
            </div>
            <div>
              <span className="font-medium">Modelo:</span> {product.name}
            </div>
            <div>
              <span className="font-medium">Unidad:</span> {product.unit || 'No especificada'}
            </div>
          </div>
        </div>
      )}

      {/* Formulario */}
      <Form {...form}>
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            console.log('Form onSubmit triggered');
            form.handleSubmit(handleSubmit)(e);
          }} 
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            {/* Campo de Código */}
            <FormField
              control={form.control}
              name="provider_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Código interno del proveedor (opcional)"
                      {...field}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          form.handleSubmit(handleSubmit)();
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campo de Precio con Moneda */}
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio</FormLabel>
                  <FormControl>
                    <CurrencyAmountField
                      value={form.watch('amount')}
                      currency={form.watch('currency_id')}
                      currencies={currencies}
                      onValueChange={(value) => form.setValue('amount', value)}
                      onCurrencyChange={(currencyId) => form.setValue('currency_id', currencyId)}
                      placeholder="0.00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </form>
      </Form>
    </div>
  );

  const headerContent = (
    <FormModalHeader 
      title="Configurar Precio de Producto"
      icon={Package}
    />
  );

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel="Guardar"
      onRightClick={form.handleSubmit(handleSubmit)}
      showLoadingSpinner={isLoading}
    />
  );

  return (
    <FormModalLayout
      columns={1}
      viewPanel={null}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      isEditing={true}
      onClose={onClose}
    />
  );
}