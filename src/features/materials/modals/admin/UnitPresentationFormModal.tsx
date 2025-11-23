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

import { ComboBox } from '@/components/ui-custom/fields/ComboBoxWriteField'

import { useCreateUnitPresentation, useUpdateUnitPresentation, UnitPresentation, NewUnitPresentationData } from '@/hooks/use-unit-presentations'
import { useUnits } from '@/hooks/use-units'

import { Ruler } from 'lucide-react'

const unitPresentationSchema = z.object({
  unit_id: z.string().min(1, 'La unidad base es requerida'),
  name: z.string().min(1, 'El nombre es requerido'),
  equivalence: z.string().min(1, 'La equivalencia es requerida').refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'La equivalencia debe ser un número mayor a 0',
  }),
  description: z.string().optional(),
})

interface UnitPresentationFormModalProps {
  modalData: {
    editingUnitPresentation?: UnitPresentation | null
  }
  onClose: () => void
}

export function UnitPresentationFormModal({ modalData, onClose }: UnitPresentationFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const { editingUnitPresentation } = modalData
  const isEditing = !!editingUnitPresentation

  // Hooks
  const createMutation = useCreateUnitPresentation()
  const updateMutation = useUpdateUnitPresentation()
  const { setPanel } = useModalPanelStore()
  
  // Data hooks
  const { data: units = [] } = useUnits()

  // Force edit mode when modal opens
  useEffect(() => {
    setPanel('edit')
  }, [])

  // Form setup
  const form = useForm<z.infer<typeof unitPresentationSchema>>({
    resolver: zodResolver(unitPresentationSchema),
    defaultValues: {
      unit_id: '',
      name: '',
      equivalence: '',
      description: '',
    },
  })

  // Load editing data
  useEffect(() => {
    if (isEditing && editingUnitPresentation) {
      form.reset({
        unit_id: editingUnitPresentation.unit_id,
        name: editingUnitPresentation.name,
        equivalence: editingUnitPresentation.equivalence.toString(),
        description: editingUnitPresentation.description || '',
      })
    } else {
      form.reset({
        unit_id: '',
        name: '',
        equivalence: '',
        description: '',
      })
    }
  }, [isEditing, editingUnitPresentation, form])

  const onSubmit = async (data: z.infer<typeof unitPresentationSchema>) => {
    setIsLoading(true)
    
    try {
      const unitPresentationData: NewUnitPresentationData = {
        unit_id: data.unit_id,
        name: data.name,
        equivalence: parseFloat(data.equivalence),
        description: data.description || undefined,
      }

      if (isEditing && editingUnitPresentation) {
        await updateMutation.mutateAsync({
          id: editingUnitPresentation.id,
          data: unitPresentationData
        })
      } else {
        await createMutation.mutateAsync(unitPresentationData)
      }
      
      onClose()
      form.reset()
    } catch (error) {
      console.error('Error saving unit presentation:', error)
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
        {/* Unit Selection */}
        <FormField
          control={form.control}
          name="unit_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unidad Base *</FormLabel>
              <FormControl>
                <ComboBox
                  value={field.value}
                  onValueChange={field.onChange}
                  options={units.map(unit => ({
                    value: unit.id,
                    label: unit.name
                  }))}
                  placeholder="Selecciona una unidad base"
                  searchPlaceholder="Buscar unidad..."
                  emptyMessage="No se encontraron unidades"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Presentation Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Presentación *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Bolsa de 25kg, Saco de 50kg, Lata de 4L..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Equivalence */}
        <FormField
          control={form.control}
          name="equivalence"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Equivalencia *</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Ej: 25, 50, 4..."
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
                  placeholder="Descripción adicional de la presentación..."
                  className="resize-none"
                  rows={3}
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
      title={isEditing ? "Editar Unidad" : "Nueva Unidad"}
      icon={Ruler}
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