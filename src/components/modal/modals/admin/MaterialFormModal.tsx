import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { useCreateMaterial, useUpdateMaterial, Material, NewMaterialData } from '@/hooks/use-materials'
import { useMaterialCategories } from '@/hooks/use-material-categories'
import { useUnits } from '@/hooks/use-units'

import { Package } from 'lucide-react'

const materialSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  unit_id: z.string().min(1, 'La unidad es requerida'),
  cost: z.number().min(0, 'El costo debe ser mayor o igual a 0'),
  category_id: z.string().min(1, 'La categoría es requerida'),
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
  const { data: categories = [] } = useMaterialCategories()
  const { data: units = [] } = useUnits()

  // Form setup
  const form = useForm<z.infer<typeof materialSchema>>({
    resolver: zodResolver(materialSchema),
    defaultValues: {
      name: '',
      unit_id: '',
      cost: 0,
      category_id: '',
    },
  })

  // Load editing data
  useEffect(() => {
    if (isEditing && editingMaterial) {
      form.reset({
        name: editingMaterial.name,
        unit_id: editingMaterial.unit_id,
        cost: editingMaterial.cost,
        category_id: editingMaterial.category_id,
      })
    } else {
      form.reset({
        name: '',
        unit_id: '',
        cost: 0,
        category_id: '',
      })
    }
  }, [editingMaterial, isEditing, form])

  // Submit handler
  const onSubmit = async (values: z.infer<typeof materialSchema>) => {
    setIsLoading(true)

    try {
      if (isEditing && editingMaterial) {
        await updateMutation.mutateAsync({
          id: editingMaterial.id,
          data: values,
        })
      } else {
        await createMutation.mutateAsync(values)
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
              <FormLabel>Unidad de Medida *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar unidad" />
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

        {/* Cost */}
        <FormField
          control={form.control}
          name="cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Costo Unitario *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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