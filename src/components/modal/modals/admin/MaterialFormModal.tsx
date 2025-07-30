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

import { useCreateMaterial, useUpdateMaterial, useCreateMaterialPrice, useMaterialPrice, useUpdateMaterialPrice, Material, NewMaterialData } from '@/hooks/use-materials'
import { useMaterialCategories } from '@/hooks/use-material-categories'
import { useUnits } from '@/hooks/use-units'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useCurrencies } from '@/hooks/use-currencies'
import { HelpPopover } from '@/components/ui-custom/HelpPopover'

import { Package, DollarSign } from 'lucide-react'

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
  const updatePriceMutation = useUpdateMaterialPrice()
  const { data: userData } = useCurrentUser()
  const { data: categories = [] } = useMaterialCategories()
  const { data: units = [] } = useUnits()
  const { data: currencies = [] } = useCurrencies()
  const { setPanel } = useModalPanelStore()
  
  // Hook para cargar precio del material cuando se está editando
  const { data: materialPrice } = useMaterialPrice(
    editingMaterial?.id || '',
    userData?.organization?.id || ''
  )

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
        currency_id: materialPrice?.currency_id || '',
        price: materialPrice?.unit_price?.toString() || '',
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
  }, [editingMaterial, isEditing, materialPrice, form])

  // Submit handler
  const onSubmit = async (values: z.infer<typeof materialSchema>) => {
    setIsLoading(true)

    try {
      if (isEditing && editingMaterial) {
        // Actualizar material
        await updateMutation.mutateAsync({
          id: editingMaterial.id,
          data: {
            name: values.name,
            unit_id: values.unit_id,
            category_id: values.category_id,
          },
        })
        
        // Actualizar o crear precio si se especificó
        if (values.price && values.price.trim() !== '' && userData?.organization?.id) {
          const priceData = {
            organization_id: userData.organization.id,
            material_id: editingMaterial.id,
            unit_price: parseFloat(values.price),
            currency_id: values.currency_id && values.currency_id !== '' ? values.currency_id : null,
          }
          
          if (materialPrice?.id) {
            // Actualizar precio existente
            await updatePriceMutation.mutateAsync({
              id: materialPrice.id,
              data: priceData
            })
          } else {
            // Crear nuevo precio
            await createPriceMutation.mutateAsync(priceData)
          }
        }
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
            organization_id: userData.organization.id,
            material_id: newMaterial.id,
            unit_price: parseFloat(values.price),
            currency_id: values.currency_id && values.currency_id !== '' ? values.currency_id : null,
          })
          
          
          const priceData = {
            organization_id: userData.organization.id,
            material_id: newMaterial.id,
            unit_price: parseFloat(values.price),
            currency_id: values.currency_id && values.currency_id !== '' ? values.currency_id : null,
          }
          
          try {
            await createPriceMutation.mutateAsync(priceData)
          } catch (priceError) {
            throw priceError
          }
        } else {
            hasPrice: !!values.price,
            priceValue: values.price,
            hasOrganization: !!userData?.organization?.id,
            hasMaterial: !!newMaterial
          })
        }
      }
      onClose()
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }

  // View panel (not needed for this modal as it's always in edit mode)
  const viewPanel = null

  // Determinar si el material es del sistema
  const isSystemMaterial = editingMaterial?.is_system && editingMaterial?.organization_id !== userData?.organization?.id

  // Edit panel
  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* SECCIÓN 1: INFORMACIÓN BÁSICA DEL MATERIAL */}
        <div className="space-y-4">
          {/* Título de sección */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-accent/10 rounded-lg">
              <Package className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">Información Básica del Material</h3>
              <p className="text-xs text-muted-foreground">
                {isSystemMaterial ? 'Datos del sistema (solo lectura)' : 'Configuración general del material'}
              </p>
            </div>
          </div>

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
                    disabled={isSystemMaterial}
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
                  <Select onValueChange={field.onChange} value={field.value} disabled={isSystemMaterial}>
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
                  <FormLabel>Unidad de Cómputo *</FormLabel>
                  <div className="flex items-center gap-2">
                    <Select onValueChange={field.onChange} value={field.value} disabled={isSystemMaterial}>
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
                    <HelpPopover
                      title="¿Qué es la Unidad de Cómputo?"
                      description="Esta no es la unidad de venta del material, sino la unidad con la que se calculan las cantidades en el proyecto. Por ejemplo: la cal se computa por kilogramos (KG) para los cálculos de obra, pero se vende por bolsas de 25kg. El cemento se computa por kilogramos pero se vende por bolsas de 50kg. Esta unidad te ayuda a hacer cálculos precisos de materiales."
                    />
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* SECCIÓN 2: INFORMACIÓN DE PRECIOS */}
        <div className="space-y-4">
          {/* Título de sección */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-accent/10 rounded-lg">
              <DollarSign className="w-4 h-4 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-foreground">Información de Precios</h3>
              <p className="text-xs text-muted-foreground">Costos específicos para tu organización</p>
            </div>
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