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

import { useCreateBrand, useUpdateBrand, Brand, NewBrandData } from '@/hooks/use-brands'

import { Tag } from 'lucide-react'

const brandSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
})

interface BrandFormModalProps {
  modalData: {
    editingBrand?: Brand | null
  }
  onClose: () => void
}

export function BrandFormModal({ modalData, onClose }: BrandFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const { editingBrand } = modalData
  const isEditing = !!editingBrand

  // Hooks
  const createMutation = useCreateBrand()
  const updateMutation = useUpdateBrand()
  const { setPanel } = useModalPanelStore()

  // Force edit mode when modal opens
  useEffect(() => {
    setPanel('edit')
  }, [])

  // Form setup
  const form = useForm<z.infer<typeof brandSchema>>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: '',
    },
  })

  // Load editing data
  useEffect(() => {
    if (isEditing && editingBrand) {
      form.reset({
        name: editingBrand.name,
      })
    } else {
      form.reset({
        name: '',
      })
    }
  }, [isEditing, editingBrand, form])

  const onSubmit = async (data: z.infer<typeof brandSchema>) => {
    setIsLoading(true)
    
    try {
      if (isEditing && editingBrand) {
        await updateMutation.mutateAsync({
          id: editingBrand.id,
          data: data as Partial<NewBrandData>
        })
      } else {
        await createMutation.mutateAsync(data as NewBrandData)
      }
      
      onClose()
      form.reset()
    } catch (error) {
      console.error('Error saving brand:', error)
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
        {/* Brand Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Marca *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Nike, Adidas, Samsung..."
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
      title={isEditing ? "Editar Marca" : "Nueva Marca"}
      icon={Tag}
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