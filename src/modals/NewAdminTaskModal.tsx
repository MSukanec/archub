import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from '@/hooks/use-toast'
import { useCreateTask, useUpdateTask } from '@/hooks/use-tasks'
import { useCurrentUser } from '@/hooks/use-current-user'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout'
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader'
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody'
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter'

const taskSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  unit_labor_price: z.number().min(0, 'El precio debe ser positivo').optional(),
  unit_material_price: z.number().min(0, 'El precio debe ser positivo').optional()
})

type TaskFormData = z.infer<typeof taskSchema>

interface Task {
  id: string
  name: string
  description: string
  organization_id: string
  category_id: string
  subcategory_id: string
  element_category_id: string
  unit_id: string
  action_id: string
  element_id: string
  unit_labor_price: number
  unit_material_price: number
  created_at: string
}

interface NewAdminTaskModalProps {
  open: boolean
  onClose: () => void
  task?: Task | null
}

export function NewAdminTaskModal({ open, onClose, task }: NewAdminTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: userData } = useCurrentUser()
  const createTaskMutation = useCreateTask()
  const updateTaskMutation = useUpdateTask()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors }
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: '',
      description: '',
      unit_labor_price: 0,
      unit_material_price: 0
    }
  })

  // Reset form when modal opens/closes or task changes
  useEffect(() => {
    if (open) {
      if (task) {
        // Editing mode
        setValue('name', task.name)
        setValue('description', task.description || '')
        setValue('unit_labor_price', task.unit_labor_price || 0)
        setValue('unit_material_price', task.unit_material_price || 0)
      } else {
        // Creation mode
        reset({
          name: '',
          description: '',
          unit_labor_price: 0,
          unit_material_price: 0
        })
      }
    }
  }, [open, task, setValue, reset])

  const onSubmit = async (data: TaskFormData) => {
    if (!userData?.organization?.id) {
      toast({
        title: "Error",
        description: "No se pudo obtener la información de la organización.",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)

    try {
      const taskData = {
        name: data.name,
        description: data.description || '',
        organization_id: userData.organization.id,
        unit_labor_price: data.unit_labor_price || 0,
        unit_material_price: data.unit_material_price || 0
      }

      if (task) {
        // Update existing task
        await updateTaskMutation.mutateAsync({
          id: task.id,
          ...taskData
        })
        toast({
          title: "Tarea actualizada",
          description: "La tarea ha sido actualizada exitosamente."
        })
      } else {
        // Create new task
        await createTaskMutation.mutateAsync(taskData)
        toast({
          title: "Tarea creada",
          description: "La tarea ha sido creada exitosamente."
        })
      }

      onClose()
    } catch (error) {
      console.error('Error saving task:', error)
      toast({
        title: "Error",
        description: "No se pudo guardar la tarea. Inténtalo de nuevo.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <CustomModalLayout open={open} onClose={handleClose}>
      {{
        header: (
          <CustomModalHeader
            title={task ? "Editar Tarea" : "Nueva Tarea"}
            onClose={handleClose}
          />
        ),
        body: (
          <form id="task-form" onSubmit={handleSubmit(onSubmit)}>
            <CustomModalBody padding="md">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Task Name */}
                <div className="col-span-2">
                  <Label htmlFor="name" className="required-asterisk">
                    Nombre de la Tarea
                  </Label>
                  <Input
                    id="name"
                    {...register('name')}
                    placeholder="Ej: Colocación de cerámicos"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                  )}
                </div>

                {/* Description */}
                <div className="col-span-2">
                  <Label htmlFor="description">
                    Descripción
                  </Label>
                  <Textarea
                    id="description"
                    {...register('description')}
                    placeholder="Descripción detallada de la tarea..."
                    rows={3}
                  />
                  {errors.description && (
                    <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
                  )}
                </div>

                {/* Unit Labor Price */}
                <div className="col-span-1">
                  <Label htmlFor="unit_labor_price">
                    Precio Unitario Mano de Obra
                  </Label>
                  <Input
                    id="unit_labor_price"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('unit_labor_price', { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                  {errors.unit_labor_price && (
                    <p className="text-sm text-red-500 mt-1">{errors.unit_labor_price.message}</p>
                  )}
                </div>

                {/* Unit Material Price */}
                <div className="col-span-1">
                  <Label htmlFor="unit_material_price">
                    Precio Unitario Materiales
                  </Label>
                  <Input
                    id="unit_material_price"
                    type="number"
                    step="0.01"
                    min="0"
                    {...register('unit_material_price', { valueAsNumber: true })}
                    placeholder="0.00"
                  />
                  {errors.unit_material_price && (
                    <p className="text-sm text-red-500 mt-1">{errors.unit_material_price.message}</p>
                  )}
                </div>
              </div>
            </CustomModalBody>
          </form>
        ),
        footer: (
          <CustomModalFooter
            onCancel={handleClose}
            onSave={() => {}}
            isSubmitting={isSubmitting}
            submitForm="task-form"
          />
        )
      }}
    </CustomModalLayout>
  )
}