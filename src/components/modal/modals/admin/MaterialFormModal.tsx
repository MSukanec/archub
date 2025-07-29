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

import { useCreateMaterial, useUpdateMaterial, useCreateMaterialPrice, Material, NewMaterialData } from '@/hooks/use-materials'
import { useMaterialCategories } from '@/hooks/use-material-categories'
import { useUnits } from '@/hooks/use-units'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useCurrencies } from '@/hooks/use-currencies'
import { HelpPopover } from '@/components/ui-custom/HelpPopover'

import { Package } from 'lucide-react'

const materialSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  category_id: z.string().min(1, 'La categoría es requerida'),
  unit_id: z.string().min(1, 'La unidad es requerida'),
  currency_id: z.string().optional(),
  price: z.string().optional().refine((val) => !val || !isNaN(Number(val)), {
    message: 'El precio debe ser un número válido',
  }),
})

interface MaterialFormModalProps {
  modalData: {
    editingMaterial?: Material | null
  }
  onClose: () => void
}

export function MaterialFormModal({ modalData, onClose }: MaterialFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const { editingMaterial } = modalData
  const isEditing = !!editingMaterial

  // Hooks
  const createMutation = useCreateMaterial()
  const updateMutation = useUpdateMaterial()
  const createPriceMutation = useCreateMaterialPrice()
  const { data: userData } = useCurrentUser()
  const { data: categories = [] } = useMaterialCategories()
  const { data: units = [] } = useUnits()
  const { data: currencies = [] } = useCurrencies()
  const { setPanel } = useModalPanelStore()

  // Force edit mode when modal opens
  useEffect(() => {
    setPanel('edit')
  }, [])

  // Form setup
  const form = useForm<z.infer<typeof materialSchema>>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: '',
      category_id: '',
      unit_id: '',
      currency_id: '',
      price: '',
    },
  })

  // Load editing data
  useEffect(() => {
    if (isEditing && editingMaterial) {
      form.reset({
        name: editingMaterial.name,
        category_id: editingMaterial.category_id,
        unit_id: editingMaterial.unit_id,
        currency_id: '', // Moneda se cargará por separado desde organization_material_prices
        price: '', // Precio se cargará por separado desde organization_material_prices
      })
    } else {
      form.reset({
        name: '',
        category_id: '',
        unit_id: '',
        currency_id: '',
        price: '',
      })
    }
  }, [editingMaterial, isEditing, form])

  // Submit handler
  const onSubmit = async (values: z.infer<typeof materialSchema>) => {
    setIsLoading(true)

    try {
      if (isEditing && editingMaterial) {
        // Solo actualizar material (no precio por ahora en edición)
        await updateMutation.mutateAsync({
          id: editingMaterial.id,
          data: {
            name: values.name,
            unit_id: values.unit_id,
            category_id: values.category_id,
          },
        })
      } else {
        // Crear material
        const materialData: NewMaterialData = {
          name: values.name,
          category_id: values.category_id,
          unit_id: values.unit_id,
          organization_id: userData?.organization?.id,
          is_system: false,
        }
        
        const newMaterial = await createMutation.mutateAsync(materialData)
        
        // Si se especificó un precio, crear el registro de precio
        if (values.price && values.price.trim() !== '' && userData?.organization?.id && newMaterial) {
          const priceData = {
            organization_id: userData.organization.id,
            material_id: newMaterial.id,
            price: parseFloat(values.price),
            currency_id: values.currency_id || undefined,
          }
          
          await createPriceMutation.mutateAsync(priceData)
        }
      }
      onClose()
    } catch (error) {
      console.error('Error saving material:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // View panel (not needed for this modal as it's always in edit mode)
  const viewPanel = null

  // Edit panel
  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Material Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Material *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Cemento Portland"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Category and Unit Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Category */}
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoría *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar categoría" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Unit */}
          <FormField
            control={form.control}
            name="unit_id"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-2">
                  <FormLabel>Unidad de Cómputo *</FormLabel>
                  <HelpPopover
                    title="¿Qué es la Unidad de Cómputo?"
                    description="Esta no es la unidad de venta del material, sino la unidad con la que se calculan las cantidades en el proyecto. Por ejemplo: la cal se computa por kilogramos (KG) para los cálculos de obra, pero se vende por bolsas de 25kg. El cemento se computa por kilogramos pero se vende por bolsas de 50kg. Esta unidad te ayuda a hacer cálculos precisos de materiales."
                  />
                </div>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar unidad de cómputo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Currency and Price Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Currency */}
          <FormField
            control={form.control}
            name="currency_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Moneda (Opcional)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar moneda" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.id} value={currency.id}>
                        {currency.name} ({currency.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Price */}
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Costo por Unidad (Opcional)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Ej: 1250.00"
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

  // Header content
  const headerContent = (
    <FormModalHeader 
      title={isEditing ? "Editar Material" : "Nuevo Material"}
      icon={Package}
    />
  )

  // Footer content
  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={onClose}
      rightLabel={isEditing ? "Actualizar" : "Crear"}
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