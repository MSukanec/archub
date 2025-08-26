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

import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteFieldField'

import { useCreateProduct, useUpdateProduct, Product, NewProductData } from '@/hooks/use-products'
import { useMaterials } from '@/hooks/use-materials'
import { useBrands } from '@/hooks/use-brands'
import { useUnitPresentations } from '@/hooks/use-unit-presentations'

import { Package } from 'lucide-react'

const productSchema = z.object({
  material_id: z.string().min(1, 'El material es requerido'),
  brand_id: z.string().optional(),
  unit_id: z.string().min(1, 'La unidad es requerida'),
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  image_url: z.string().optional(),
  url: z.string().optional(),
  default_price: z.coerce.number().optional(),
  default_provider: z.string().optional(),
})

interface ProductFormModalProps {
  modalData: {
    editingProduct?: Product | null
    isDuplicating?: boolean
  }
  onClose: () => void
}

export function ProductFormModal({ modalData, onClose }: ProductFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const { editingProduct, isDuplicating = false } = modalData
  const isEditing = !!editingProduct && !isDuplicating

  // Hooks
  const createMutation = useCreateProduct()
  const updateMutation = useUpdateProduct()
  const { setPanel } = useModalPanelStore()
  
  // Data hooks
  const { data: materials = [] } = useMaterials()
  const { data: brands = [] } = useBrands()
  const { data: unitPresentations = [] } = useUnitPresentations()

  // Force edit mode when modal opens
  useEffect(() => {
    setPanel('edit')
  }, [])

  // Form setup
  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      material_id: '',
      brand_id: '',
      unit_id: '',
      name: '',
      description: '',
      image_url: '',
      url: '',
      default_price: undefined,
      default_provider: '',
    },
  })

  // Load editing data (including duplication)
  useEffect(() => {
    console.log('ProductFormModal useEffect triggered:', {
      isEditing,
      isDuplicating,
      hasEditingProduct: !!editingProduct,
      editingProduct
    })
    
    if ((isEditing || isDuplicating) && editingProduct) {
      const formData = {
        material_id: editingProduct.material_id || '',
        brand_id: editingProduct.brand_id || '',
        unit_id: editingProduct.unit_id || '',
        name: editingProduct.name || '',
        description: editingProduct.description || '',
        image_url: editingProduct.image_url || '',
        url: editingProduct.url || '',
        default_price: editingProduct.default_price,
        default_provider: editingProduct.default_provider || '',
      }
      
      console.log('Loading form data:', formData)
      form.reset(formData)
    } else {
      form.reset({
        material_id: '',
        brand_id: '',
        unit_id: '',
        name: '',
        description: '',
        image_url: '',
        url: '',
        default_price: undefined,
        default_provider: '',
      })
    }
  }, [isEditing, isDuplicating, editingProduct, form])

  const onSubmit = async (data: z.infer<typeof productSchema>) => {
    setIsLoading(true)
    
    try {
      const productData: NewProductData = {
        material_id: data.material_id,
        brand_id: data.brand_id || undefined,
        unit_id: data.unit_id,
        name: data.name,
        description: data.description || undefined,
        image_url: data.image_url || undefined,
        url: data.url || undefined,
        default_price: data.default_price,
        default_provider: data.default_provider || undefined,
      }

      if (isEditing && editingProduct) {
        await updateMutation.mutateAsync({
          id: editingProduct.id,
          data: productData
        })
      } else {
        await createMutation.mutateAsync(productData)
      }
      
      onClose()
      form.reset()
    } catch (error) {
      console.error('Error saving product:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // View panel (not needed for this modal as it's always in edit mode)
  const viewPanel = null

  // Edit panel with form
  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {/* Material Selection */}
        <FormField
          control={form.control}
          name="material_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Material *</FormLabel>
              <FormControl>
                <ComboBox
                  value={field.value}
                  onValueChange={field.onChange}
                  options={materials.map(material => ({
                    value: material.id,
                    label: material.name
                  }))}
                  placeholder="Selecciona un material"
                  searchPlaceholder="Buscar material..."
                  emptyMessage="No se encontraron materiales"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Brand Selection */}
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
                  options={[
                    { value: '', label: 'Sin marca' },
                    ...brands.map(brand => ({
                      value: brand.id,
                      label: brand.name
                    }))
                  ]}
                  placeholder="Selecciona una marca (opcional)"
                  searchPlaceholder="Buscar marca..."
                  emptyMessage="No se encontraron marcas"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Unit Presentation */}
        <FormField
          control={form.control}
          name="unit_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unidad *</FormLabel>
              <FormControl>
                <ComboBox
                  value={field.value}
                  onValueChange={field.onChange}
                  options={unitPresentations.map(unitPresentation => ({
                    value: unitPresentation.id,
                    label: `${unitPresentation.name} (${unitPresentation.equivalence} ${unitPresentation.unit?.name})`
                  }))}
                  placeholder="Selecciona una unidad de presentación"
                  searchPlaceholder="Buscar unidad..."
                  emptyMessage="No se encontraron unidades"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Product Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre / Modelo del Producto *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Cemento Portland Tipo I, Ladrillo King Kong..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* URL */}
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL del Producto</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://ejemplo.com/producto"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Default Price */}
        <FormField
          control={form.control}
          name="default_price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Precio por Defecto</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Default Provider */}
        <FormField
          control={form.control}
          name="default_provider"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Proveedor por Defecto</FormLabel>
              <FormControl>
                <Input
                  placeholder="Nombre del proveedor..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descripción</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descripción detallada del producto, especificaciones técnicas..."
                  className="resize-none"
                  rows={3}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Image URL */}
        <FormField
          control={form.control}
          name="image_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL de Imagen</FormLabel>
              <FormControl>
                <Input
                  placeholder="https://ejemplo.com/imagen.jpg"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </form>
    </Form>
  )

  const headerContent = (
    <FormModalHeader 
      title={isEditing ? "Editar Producto" : isDuplicating ? "Duplicar Producto" : "Nuevo Producto"}
      icon={Package}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={isEditing ? "Actualizar" : isDuplicating ? "Duplicar" : "Crear"}
      onRightClick={form.handleSubmit(onSubmit)}
      submitDisabled={isLoading}
      showLoadingSpinner={isLoading}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      viewPanel={viewPanel}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={onClose}
    />
  )
}