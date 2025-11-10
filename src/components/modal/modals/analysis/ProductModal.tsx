import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { useModalPanelStore } from '@/components/modal/form/modalPanelStore'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField'
import { CurrencyAmountField } from '@/components/ui-custom/fields/CurrencyAmountField'

import { useCreateProduct, useUpdateProduct, NewProductData } from '@/hooks/use-products'
import { useBrands, useCreateBrand } from '@/hooks/use-brands'
import { useMaterials } from '@/hooks/use-materials'
import { useUnits } from '@/hooks/use-units'
import { useUnitPresentations } from '@/hooks/use-unit-presentations'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { useCurrentUser } from '@/hooks/use-current-user'

import { Package } from 'lucide-react'

const productSchema = z.object({
  material_id: z.string().min(1, 'El material es requerido'),
  brand_id: z.string().optional(),
  name: z.string().min(1, 'El nombre del modelo es requerido'),
  description: z.string().optional(),
  unit_presentation_id: z.string().min(1, 'La unidad de venta es requerida'),
  default_price: z.coerce.number().optional(),
  currency_id: z.string().optional(),
  default_provider: z.string().optional(),
  url: z.string().optional(),
  image_url: z.string().optional(),
})


interface ProductModalProps {
  modalData: {
    editingProduct?: any
    isEditing?: boolean
    isDuplicating?: boolean
  }
  onClose: () => void
}

export function ProductModal({ modalData, onClose }: ProductModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState<string>('')
  
  const { editingProduct, isEditing = false, isDuplicating = false } = modalData || {}
  
  // Hooks
  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()
  const createBrandMutation = useCreateBrand()
  const { setPanel } = useModalPanelStore()
  const { data: userData } = useCurrentUser()
  
  // Data hooks
  const { data: materials = [] } = useMaterials()
  const { data: brands = [] } = useBrands()
  const { data: units = [] } = useUnits()
  const { data: unitPresentations = [] } = useUnitPresentations()
  const { data: organizationCurrencies = [] } = useOrganizationCurrencies(userData?.organization?.id)

  // Form setup
  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      material_id: '',
      brand_id: '',
      name: '',
      description: '',
      unit_presentation_id: '',
      default_price: undefined,
      currency_id: '',
      default_provider: '',
      url: '',
      image_url: '',
    },
  })

  // Force edit mode when modal opens or load existing data
  useEffect(() => {
    setPanel('edit')
    
    // Si estamos editando o duplicando, cargar los datos del producto
    if (editingProduct && (isEditing || isDuplicating)) {
      form.reset({
        material_id: editingProduct.material_id || '',
        brand_id: editingProduct.brand_id || '',
        name: isDuplicating ? `${editingProduct.name} - Copia` : (editingProduct.name || ''),
        description: editingProduct.description || '',
        unit_presentation_id: editingProduct.unit_id || '',
        default_price: editingProduct.default_price || undefined,
        currency_id: '',
        default_provider: editingProduct.default_provider || '',
        url: editingProduct.url || '',
        image_url: editingProduct.image_url || '',
      })
    }
  }, [editingProduct, isEditing, isDuplicating, form])

  // Set default currency
  useEffect(() => {
    if (organizationCurrencies.length > 0 && !selectedCurrency) {
      const defaultCurrency = organizationCurrencies.find(oc => oc.is_default) || organizationCurrencies[0]
      setSelectedCurrency(defaultCurrency.currency.id)
      form.setValue('currency_id', defaultCurrency.currency.id)
    }
  }, [organizationCurrencies])

  const onSubmit = async (data: z.infer<typeof productSchema>) => {
    setIsLoading(true)
    
    try {
      const productData: NewProductData = {
        material_id: data.material_id,
        brand_id: data.brand_id || undefined,
        unit_id: data.unit_presentation_id || undefined,
        name: data.name,
        description: data.description || undefined,
        image_url: data.image_url || undefined,
        url: data.url || undefined,
        default_price: data.default_price || undefined,
        default_provider: data.default_provider || undefined,
        organization_id: userData?.organization?.id,
        is_system: false,
      }

      if (editingProduct && isEditing && !isDuplicating) {
        // Actualizar producto existente
        await updateMutation.mutateAsync({ id: editingProduct.id, data: productData })
      } else {
        // Crear nuevo producto (incluye duplicación)
        await createMutation.mutateAsync(productData)
      }
      onClose()
    } catch (error) {
      console.error('Error creating product:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Prepare data for ComboBoxes
  const materialOptions = materials.map(material => ({ value: material.id, label: material.name }))
  const brandOptions = brands.map(brand => ({ value: brand.id, label: brand.name }))
  const unitOptions = units.map(unit => ({ value: unit.id, label: unit.name }))
  const unitPresentationOptions = unitPresentations.map(up => ({ 
    value: up.id, 
    label: up.unit ? `${up.name} (${up.unit.name})` : up.name 
  }))
  const currencyOptions = organizationCurrencies.map(oc => ({
    id: oc.currency.id,
    name: oc.currency.name,
    symbol: oc.currency.symbol
  }))

  // Handle brand creation
  const handleCreateBrand = async (brandName: string) => {
    try {
      const newBrand = await createBrandMutation.mutateAsync({ name: brandName })
      return { value: newBrand.id, label: newBrand.name }
    } catch (error) {
      console.error('Error creating brand:', error)
      throw error
    }
  }

  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          {/* Material */}
          <FormField
            control={form.control}
            name="material_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Material *</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar material..." />
                    </SelectTrigger>
                    <SelectContent>
                      {materialOptions.map((material) => (
                        <SelectItem key={material.value} value={material.value}>
                          {material.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Marca */}
          <FormField
            control={form.control}
            name="brand_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Marca</FormLabel>
                <FormControl>
                  <ComboBox
                    value={field.value}
                    onValueChange={field.onChange}
                    options={brandOptions}
                    placeholder="Seleccionar marca..."
                    searchPlaceholder="Buscar marca..."
                    emptyMessage="No se encontraron marcas."
                    allowCreate={true}
                    onCreateNew={handleCreateBrand}
                    createLabel={(value) => `Crear marca "${value}"`}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Modelo */}
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modelo *</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ej: Premium 2024, Serie A, etc."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Descripción */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descripción</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descripción detallada del producto..."
                    className="min-h-[80px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Precio y Unidad - Inline en Desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Precio */}
            <FormField
              control={form.control}
              name="default_price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Precio</FormLabel>
                  <FormControl>
                    <CurrencyAmountField
                      value={field.value}
                      onValueChange={field.onChange}
                      currency={selectedCurrency}
                      currencies={currencyOptions}
                      onCurrencyChange={(currencyId) => {
                        setSelectedCurrency(currencyId)
                        form.setValue('currency_id', currencyId)
                      }}
                      placeholder="0.00"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Unidad de Venta */}
            <FormField
              control={form.control}
              name="unit_presentation_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unidad de Venta *</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar unidad..." />
                      </SelectTrigger>
                      <SelectContent>
                        {unitPresentationOptions.map((presentation) => (
                          <SelectItem key={presentation.value} value={presentation.value}>
                            {presentation.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          </div>

          {/* Proveedor - Ancho completo */}
          <FormField
            control={form.control}
            name="default_provider"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proveedor (Opcional)</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nombre del proveedor principal"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Link e Imagen - Inline en Desktop */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Link */}
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Link</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://ejemplo.com/producto"
                      type="url"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Imagen */}
            <FormField
              control={form.control}
              name="image_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imagen</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="https://ejemplo.com/imagen.jpg"
                      type="url"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
      </form>
    </Form>
  )

  const headerContent = (
    <FormModalHeader 
      title={editingProduct && isEditing && !isDuplicating ? "Editar Producto" : isDuplicating ? "Duplicar Producto" : "Nuevo Producto Personalizado"}
      icon={Package}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={editingProduct && isEditing && !isDuplicating ? "Actualizar Producto" : isDuplicating ? "Duplicar Producto" : "Crear Producto"}
      onRightClick={form.handleSubmit(onSubmit)}
      showLoadingSpinner={isLoading}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      viewPanel={null}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
      isEditing={true}
    />
  )
}