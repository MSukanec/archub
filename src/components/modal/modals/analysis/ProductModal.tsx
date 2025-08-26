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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField'
import { CurrencyAmountField } from '@/components/ui-custom/fields/CurrencyAmountField'

import { useCreateProduct, NewProductData } from '@/hooks/use-products'
import { useMaterialCategories } from '@/hooks/use-material-categories'
import { useBrands, useCreateBrand } from '@/hooks/use-brands'
import { useUnits } from '@/hooks/use-units'
import { useUnitPresentations } from '@/hooks/use-unit-presentations'
import { useOrganizationCurrencies } from '@/hooks/use-currencies'
import { useCurrentUser } from '@/hooks/use-current-user'

import { Package } from 'lucide-react'

const productSchema = z.object({
  material_id: z.string().min(1, 'El material es requerido'),
  brand_id: z.string().optional(),
  name: z.string().min(1, 'El nombre del modelo es requerido'),
  unit_id: z.string().min(1, 'La unidad de cómputo es requerida'),
  unit_presentation_id: z.string().optional(),
  default_price: z.coerce.number().optional(),
  currency_id: z.string().optional(),
  url: z.string().optional(),
  image_url: z.string().optional(),
})

// Helper function to flatten material categories for ComboBox
function flattenCategories(categories: any[]): Array<{ value: string; label: string }> {
  const result: Array<{ value: string; label: string }> = []
  
  function traverse(cats: any[], prefix = '') {
    cats.forEach(cat => {
      const label = prefix ? `${prefix} > ${cat.name}` : cat.name
      result.push({ value: cat.id, label })
      
      if (cat.children && cat.children.length > 0) {
        traverse(cat.children, label)
      }
    })
  }
  
  traverse(categories)
  return result
}

interface ProductModalProps {
  modalData: {}
  onClose: () => void
}

export function ProductModal({ modalData, onClose }: ProductModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState<string>('')
  
  // Hooks
  const createMutation = useCreateProduct()
  const createBrandMutation = useCreateBrand()
  const { setPanel } = useModalPanelStore()
  const { data: userData } = useCurrentUser()
  
  // Data hooks
  const { data: materialCategories = [] } = useMaterialCategories()
  const { data: brands = [] } = useBrands()
  const { data: units = [] } = useUnits()
  const { data: unitPresentations = [] } = useUnitPresentations()
  const { data: organizationCurrencies = [] } = useOrganizationCurrencies(userData?.organization?.id)

  // Force edit mode when modal opens
  useEffect(() => {
    setPanel('edit')
  }, [])

  // Set default currency
  useEffect(() => {
    if (organizationCurrencies.length > 0 && !selectedCurrency) {
      const defaultCurrency = organizationCurrencies.find(oc => oc.is_default) || organizationCurrencies[0]
      setSelectedCurrency(defaultCurrency.currency.id)
      form.setValue('currency_id', defaultCurrency.currency.id)
    }
  }, [organizationCurrencies])

  // Form setup
  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      material_id: '',
      brand_id: '',
      name: '',
      unit_id: '',
      unit_presentation_id: '',
      default_price: undefined,
      currency_id: '',
      url: '',
      image_url: '',
    },
  })

  const onSubmit = async (data: z.infer<typeof productSchema>) => {
    setIsLoading(true)
    
    try {
      const productData: NewProductData = {
        material_id: data.material_id,
        brand_id: data.brand_id || undefined,
        unit_id: data.unit_id || undefined,
        name: data.name,
        description: undefined,
        image_url: data.image_url || undefined,
        url: data.url || undefined,
        default_price: data.default_price || undefined,
        default_provider: undefined,
      }

      await createMutation.mutateAsync(productData)
      onClose()
    } catch (error) {
      console.error('Error creating product:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Prepare data for ComboBoxes
  const categoryOptions = flattenCategories(materialCategories)
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 gap-6">
          {/* Categoría */}
          <FormField
            control={form.control}
            name="material_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría *</FormLabel>
                <FormControl>
                  <ComboBox
                    value={field.value}
                    onValueChange={field.onChange}
                    options={categoryOptions}
                    placeholder="Seleccionar categoría..."
                    searchPlaceholder="Buscar categoría..."
                    emptyMessage="No se encontraron categorías."
                  />
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

          {/* Unidad de Cómputo */}
          <FormField
            control={form.control}
            name="unit_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidad de Cómputo *</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar unidad..." />
                    </SelectTrigger>
                    <SelectContent>
                      {unitOptions.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Unidad de Venta/Presentación */}
          <FormField
            control={form.control}
            name="unit_presentation_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unidad de Venta/Presentación</FormLabel>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar presentación..." />
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
                    onCurrencyChange={(currencyId) => {
                      setSelectedCurrency(currencyId)
                      form.setValue('currency_id', currencyId)
                    }}
                    currencies={currencyOptions}
                    placeholder="0.00"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

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
      </form>
    </Form>
  )

  const headerContent = (
    <FormModalHeader 
      title="Nuevo Producto Personalizado"
      icon={Package}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel="Crear Producto"
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