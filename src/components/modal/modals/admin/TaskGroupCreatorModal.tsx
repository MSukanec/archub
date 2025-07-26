import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { PackagePlus } from 'lucide-react'

import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalHeader } from '@/components/modal/form/FormModalHeader'
import { FormModalFooter } from '@/components/modal/form/FormModalFooter'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ComboBox } from '@/components/ui-custom/ComboBoxWrite'

import { useCreateTaskGroup } from '@/hooks/use-task-groups'
import { useCreateTaskTemplate } from '@/hooks/use-task-templates-admin'
import { useAllTaskCategories } from '@/hooks/use-task-categories-admin'
import { useUnits } from '@/hooks/use-units'

const taskGroupCreatorSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  subcategory_id: z.string().min(1, 'La subcategoría es requerida'),
  unit_id: z.string().min(1, 'La unidad es requerida'),
})

type TaskGroupCreatorFormData = z.infer<typeof taskGroupCreatorSchema>

interface TaskGroupCreatorModalProps {
  modalData?: any
  onClose: () => void
}

export function TaskGroupCreatorModal({ modalData, onClose }: TaskGroupCreatorModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const createGroupMutation = useCreateTaskGroup()
  const createTemplateMutation = useCreateTaskTemplate()
  
  // Data hooks
  const { data: allCategories = [], isLoading: categoriesLoading } = useAllTaskCategories()
  const { data: units = [], isLoading: unitsLoading } = useUnits()

  const form = useForm<TaskGroupCreatorFormData>({
    resolver: zodResolver(taskGroupCreatorSchema),
    defaultValues: {
      name: '',
      subcategory_id: '',
      unit_id: '',
    },
  })

  // Get subcategories (categories that have parent_id - are not root level)
  const subcategories = allCategories.filter(category => category.parent_id !== null)

  // Prepare subcategories for ComboBoxWrite
  const subcategoryOptions = subcategories.map(subcategory => ({
    label: subcategory.name,
    value: subcategory.id,
  }))

  const onSubmit = async (data: TaskGroupCreatorFormData) => {
    setIsSubmitting(true)
    
    try {
      // Step 1: Create the task group
      const newGroup = await createGroupMutation.mutateAsync({
        name: data.name,
        category_id: data.subcategory_id,
      })

      // Step 2: Create the associated template
      await createTemplateMutation.mutateAsync({
        name_template: `${data.name} {{}}`, // Basic template with placeholder
        category_id: data.subcategory_id, // Use category_id instead of task_group_id
        unit_id: data.unit_id,
        task_code: 'AUTO', // Auto-generated code
      })

      handleClose()
    } catch (error) {
      console.error('Error creating group and template:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    form.reset()
    onClose()
  }

  const isLoading = categoriesLoading || unitsLoading || isSubmitting

  // Edit panel with form
  const editPanel = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        
        {/* Subcategory Selection */}
        <FormField
          control={form.control}
          name="subcategory_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subcategoría <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <ComboBox
                  options={subcategoryOptions}
                  value={field.value}
                  onValueChange={field.onChange}
                  placeholder="Buscar subcategoría..."
                  emptyText="No se encontraron subcategorías"
                  disabled={categoriesLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Group Name */}
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

        {/* Unit Selection */}
        <FormField
          control={form.control}
          name="unit_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Unidad <span className="text-red-500">*</span></FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={unitsLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar unidad..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.name} ({unit.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Information section */}
        <div className="p-3 bg-muted rounded-md">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Este proceso creará:</strong>
          </p>
          <ul className="text-sm text-muted-foreground mt-2 space-y-1">
            <li>• Un nuevo grupo de tareas en la subcategoría seleccionada</li>
            <li>• Una plantilla de tarea asociada con la unidad seleccionada</li>
            <li>• Base para futuras tareas parametrizadas</li>
          </ul>
        </div>
      </form>
    </Form>
  )

  const headerContent = (
    <FormModalHeader 
      title="Crear Grupo y Plantilla"
      icon={PackagePlus}
    />
  )

  const footerContent = (
    <FormModalFooter
      leftLabel="Cancelar"
      onLeftClick={handleClose}
      rightLabel={isSubmitting ? "Creando..." : "Crear Grupo"}
      onRightClick={form.handleSubmit(onSubmit)}
      rightDisabled={isLoading}
    />
  )

  return (
    <FormModalLayout
      columns={1}
      viewPanel={<div />}
      editPanel={editPanel}
      headerContent={headerContent}
      footerContent={footerContent}
      onClose={handleClose}
    />
  )
}