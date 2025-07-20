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

import { useCreateMaterialCategory, useUpdateMaterialCategory, MaterialCategory, NewMaterialCategoryData } from '@/hooks/use-material-categories'

import { Tag } from 'lucide-react'

const materialCategorySchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
})

interface MaterialCategoryFormModalProps {
  modalData: {
    editingMaterialCategory?: MaterialCategory | null
  }
  onClose: () => void
}

export function MaterialCategoryFormModal({ modalData, onClose }: MaterialCategoryFormModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  
  const { editingMaterialCategory } = modalData
  const isEditing = !!editingMaterialCategory

  // Hooks
  const createMutation = useCreateMaterialCategory()
  const updateMutation = useUpdateMaterialCategory()
  const { setPanel } = useModalPanelStore()

  // Force edit mode when modal opens
  useEffect(() => {
    setPanel('edit')
  }, [])

  // Form setup
  const form = useForm<z.infer<typeof materialCategorySchema>>({
    resolver: zodResolver(materialCategorySchema),
    defaultValues: {
      name: '',
    },
  })

  // Load editing data
  useEffect(() => {
    if (isEditing && editingMaterialCategory) {
      form.reset({
        name: editingMaterialCategory.name,
      })
    } else {
      form.reset({
        name: '',
      })
    }
  }, [isEditing, editingMaterialCategory, form])

  const onSubmit = async (data: z.infer<typeof materialCategorySchema>) => {
    setIsLoading(true)
    
    try {
      if (isEditing && editingMaterialCategory) {
        await updateMutation.mutateAsync({
          id: editingMaterialCategory.id,
          data: data as Partial<NewMaterialCategoryData>
        })
      } else {
        await createMutation.mutateAsync(data as NewMaterialCategoryData)
      }
      
      onClose()
      form.reset()
    } catch (error) {
      console.error('Error saving material category:', error)
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
        {/* Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre de la Categoría *</FormLabel>
              <FormControl>
                <Input
                  placeholder="Ej: Cementos y Aglomerantes"
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

  // Header content
  const headerContent = (
    <FormModalHeader 
      title={isEditing ? "Editar Categoría de Material" : "Nueva Categoría de Material"}
      icon={Tag}
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