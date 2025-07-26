import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Package2 } from 'lucide-react'

import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

import { useCreateTaskGroup, useUpdateTaskGroup } from '@/hooks/use-task-groups'

const taskGroupSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  category_id: z.string().min(1, 'La categoría es requerida'),
})

type TaskGroupFormData = z.infer<typeof taskGroupSchema>

interface TaskGroupFormModalProps {
  modalData?: {
    categoryId?: string
    categoryName?: string
    taskGroup?: {
      id: string
      name: string
      category_id: string
    }
    isEditing?: boolean
  }
  onClose: () => void
}

export function TaskGroupFormModal({ modalData, onClose }: TaskGroupFormModalProps) {
  const createMutation = useCreateTaskGroup()
  const updateMutation = useUpdateTaskGroup()

  const form = useForm<TaskGroupFormData>({
    resolver: zodResolver(taskGroupSchema),
    defaultValues: {
      name: '',
      category_id: modalData?.categoryId || '',
    },
  })

  // Load data when editing
  useEffect(() => {
    if (modalData?.taskGroup) {
      form.reset({
        name: modalData.taskGroup.name,
        category_id: modalData.taskGroup.category_id,
      })
    } else if (modalData?.categoryId) {
      form.reset({
        name: '',
        category_id: modalData.categoryId,
      })
    }
  }, [modalData, form])

  const onSubmit = async (data: TaskGroupFormData) => {
    try {
      if (modalData?.taskGroup) {
        // Editing existing task group
        await updateMutation.mutateAsync({
          id: modalData.taskGroup.id,
          ...data,
        })
      } else {
        // Creating new task group
        await createMutation.mutateAsync(data)
      }
      
      handleClose()
    } catch (error) {
      console.error('Error saving task group:', error)
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  const isEditing = !!modalData?.taskGroup
  const isLoading = createMutation.isPending || updateMutation.isPending

  // Edit panel with form
  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Category context */}
        {modalData?.categoryName && (
          <div className="p-3 bg-muted rounded-md">
            <p className="text-sm text-muted-foreground">
              Categoría: <span className="font-medium text-foreground">{modalData.categoryName}</span>
            </p>
          </div>
        )}

        {/* Task Group Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nombre del Grupo <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input 
                  placeholder="Ej: Muros de Mampostería, Estructuras de Hormigón..." 
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
      title={isEditing ? "Editar Grupo de Tareas" : "Nuevo Grupo de Tareas"}
      icon={Package2}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={isEditing ? "Actualizar Grupo" : "Crear Grupo"}
      onRightClick={form.handleSubmit(onSubmit)}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      viewPanel={null}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      isEditing={true} // Always show edit panel since this is a form-only modal
      onClose={handleClose}
    />
  )
}