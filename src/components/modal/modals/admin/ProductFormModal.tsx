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

import { ComboBox } from '@/components/ui-custom/ComboBoxWrite'

import { useCreateProduct, useUpdateProduct, Product, NewProductData } from '@/hooks/use-products'
import { useMaterials } from '@/hooks/use-materials'
import { useBrands } from '@/hooks/use-brands'
import { useUnitPresentations } from '@/hooks/use-unit-presentations'

import { Package } from 'lucide-react'

const productSchema = z.object({
  material_id: z.string().min(1, 'El material es requerido'),
  brand_id: z.string().optional(),
  unit_presentation_id: z.string().min(1, 'La unidad es requerida'),
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  image_url: z.string().optional(),
})

interface ProductFormModalProps {
  modalData: {
    editingProduct?: Product | null
  }
  onClose: () => void
}

export function ProductFormModal({ modalData, onClose }: ProductFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const { editingProduct } = modalData
  const isEditing = !!editingProduct

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
      unit_presentation_id: '',
      name: '',
      description: '',
      image_url: '',
    },
  })

  // Load editing data
  useEffect(() => {
    if (isEditing && editingProduct) {
      form.reset({
        material_id: editingProduct.material_id,
        brand_id: editingProduct.brand_id || '',
        unit_presentation_id: editingProduct.unit_presentation_id || '',
        name: editingProduct.name,
        description: editingProduct.description || '',
        image_url: editingProduct.image_url || '',
      })
    } else {
      form.reset({
        material_id: '',
        brand_id: '',
        unit_presentation_id: '',
        name: '',
        description: '',
        image_url: '',
      })
    }
  }, [isEditing, editingProduct, form])

  const onSubmit = async (data: z.infer<typeof productSchema>) => {
    setIsLoading(true)
    
    try {
      const productData: NewProductData = {
        material_id: data.material_id,
        brand_id: data.brand_id || undefined,
        unit_presentation_id: data.unit_presentation_id,
        name: data.name,
        description: data.description || undefined,
        image_url: data.image_url || undefined,
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
          name="unit_presentation_id"
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
      title={isEditing ? "Editar Producto" : "Nuevo Producto"}
      icon={Package}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={isEditing ? "Actualizar" : "Crear"}
      onRightClick={form.handleSubmit(onSubmit)}
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