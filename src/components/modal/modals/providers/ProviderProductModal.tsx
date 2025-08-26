import { useState, useEffect } from 'react';
import { Package } from 'lucide-react';
import { useCurrentUser } from '@/hooks/use-current-user';
import { useOrganizationDefaultCurrency } from '@/hooks/use-currencies';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const formSchema = z.object({
  provider_code: z.string().optional(),
  currency: z.string().min(1, "La moneda es obligatoria"),
  price: z.coerce.number().min(0, "El precio debe ser mayor or igual a 0"),
});

type FormData = z.infer<typeof formSchema>;

interface ProviderProductModalProps {
  modalData?: {
    product?: {
      id: string;
      name: string;
      material?: {
        name: string;
      };
      brand?: {
        name: string;
      };
      unit_presentation?: {
        name: string;
      };
      default_price?: number;
      categoryHierarchy?: string;
    };
  };
  onClose: () => void;
}

export function ProviderProductModal({ modalData, onClose }: ProviderProductModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const product = modalData?.product;
  const { data: userData } = useCurrentUser();
  const organizationId = userData?.organization?.id;
  const { data: defaultCurrency } = useOrganizationDefaultCurrency(organizationId);
  const { data: providerProducts = [] } = useProviderProducts();
  const toggleProviderProduct = useToggleProviderProduct();

  // Obtener el provider product actual para este producto
  const currentProviderProduct = providerProducts.find(pp => pp.product_id === product?.id);
  const currentPrice = currentProviderProduct?.product_prices?.[0];

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      provider_code: currentProviderProduct?.provider_code || '',
      currency: currentPrice?.currencies?.symbol || defaultCurrency?.symbol || "CLP",
      price: currentPrice?.price || product?.default_price || 0,
    },
  });

  // Actualizar valores cuando cambie la moneda por defecto o el provider product
  useEffect(() => {
    if (currentPrice) {
      form.setValue('currency', currentPrice.currencies?.symbol || 'CLP');
      form.setValue('price', currentPrice.price || 0);
    } else if (defaultCurrency) {
      form.setValue('currency', defaultCurrency.symbol);
    }
    if (currentProviderProduct?.provider_code) {
      form.setValue('provider_code', currentProviderProduct.provider_code);
    }
  }, [defaultCurrency, currentProviderProduct, currentPrice, form]);

  const handleSubmit = async (data: FormData) => {
    if (!product?.id) return;
    
    setIsLoading(true);
    try {
      // Actualizar el provider_code, moneda y precio usando el hook existente
      await toggleProviderProduct.mutateAsync({
        productId: product.id,
        isActive: true, // Asegurar que esté activo
        providerCode: data.provider_code,
        currency: data.currency,
        price: data.price
      });
      
      onClose();
    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const editPanel = (
    <div className="space-y-6">
      {/* Descripción del Producto */}
      {product && (
        <div className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-4 w-4 text-[var(--accent)]" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Información del Producto
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Material</span>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {product.material?.name || 'No especificado'}
              </p>
            </div>
            
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Marca</span>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {product.brand?.name || 'No especificada'}
              </p>
            </div>
            
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Modelo</span>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {product.name}
              </p>
            </div>
            
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Unidad</span>
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {product.unit_presentation?.name || 'No especificada'}
              </p>
            </div>
          </div>
          
          {product.categoryHierarchy && (
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Categoría</span>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {product.categoryHierarchy.split(' > ')[0]}
                </Badge>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Formulario */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="currency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Moneda</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar moneda" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="CLP">CLP (Peso Chileno)</SelectItem>
                      <SelectItem value="USD">USD (Dólar)</SelectItem>
                      <SelectItem value="EUR">EUR (Euro)</SelectItem>
                      <SelectItem value="UF">UF (Unidad de Fomento)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      {...field}
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