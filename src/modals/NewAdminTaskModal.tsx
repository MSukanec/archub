import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CustomModalLayout } from '@/components/ui-custom/modal/CustomModalLayout'
import { CustomModalHeader } from '@/components/ui-custom/modal/CustomModalHeader'
import { CustomModalBody } from '@/components/ui-custom/modal/CustomModalBody'
import { CustomModalFooter } from '@/components/ui-custom/modal/CustomModalFooter'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Plus, X } from 'lucide-react'
import { useCurrentUser } from '@/hooks/use-current-user'
import { useCreateTask, useUpdateTask } from '@/hooks/use-tasks'
import { useTopLevelCategories, useSubcategories, useElementCategories } from '@/hooks/use-task-categories'
import { useMaterials } from '@/hooks/use-materials'

// Task schema for validation
const taskSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  description: z.string().optional(),
  category_id: z.string().optional(),
  subcategory_id: z.string().optional(),
  element_category_id: z.string().optional(),
  action_id: z.string().optional(),
  element_id: z.string().optional(),
  unit_id: z.string().optional(),
  unit_labor_price: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  unit_material_price: z.number().min(0, 'El precio debe ser mayor o igual a 0')
})

type TaskFormData = z.infer<typeof taskSchema>

interface Task {
  id: string
  name: string
  description?: string
  category_id?: string
  subcategory_id?: string
  element_category_id?: string
  action_id?: string
  element_id?: string
  unit_id?: string
  unit_labor_price: number
  unit_material_price: number
  created_at: string
}

interface TaskMaterial {
  material_id: string
  quantity: number
}

interface NewAdminTaskModalProps {
  open: boolean
  onClose: () => void
  task?: Task | null
}

export function NewAdminTaskModal({ open, onClose, task }: NewAdminTaskModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [taskMaterials, setTaskMaterials] = useState<TaskMaterial[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null)
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null)
  const [selectedAction, setSelectedAction] = useState<string>('')
  const [selectedElement, setSelectedElement] = useState<string>('')
  
  const { data: userData } = useCurrentUser()
  const createTaskMutation = useCreateTask()
  const updateTaskMutation = useUpdateTask()
  
  // Data hooks with hierarchical structure
  const { data: categories = [] } = useTopLevelCategories()
  const { data: subcategories = [] } = useSubcategories(selectedCategoryId)
  const { data: elementCategories = [] } = useElementCategories(selectedSubcategoryId)
  const { data: materials = [] } = useMaterials()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      name: '',
      description: '',
      category_id: '',
      subcategory_id: '',
      element_category_id: '',
      action_id: '',
      element_id: '',
      unit_id: '',
      unit_labor_price: 0,
      unit_material_price: 0
    }
  })

  // Watch for changes to auto-generate name
  const actionId = watch('action_id')
  const elementId = watch('element_id')

  // Auto-generate task name when action and element are selected
  useEffect(() => {
    if (selectedAction && selectedElement) {
      const generatedName = `${selectedAction} de ${selectedElement}`
      setValue('name', generatedName)
    }
  }, [selectedAction, selectedElement, setValue])

  // Handle category selection to unlock subcategories
  const handleCategoryChange = (categoryId: string) => {
    setSelectedCategoryId(categoryId)
    setSelectedSubcategoryId(null) // Reset subcategory when category changes
    setValue('category_id', categoryId)
    setValue('subcategory_id', '')
    setValue('element_category_id', '')
  }

  // Handle subcategory selection to unlock element categories
  const handleSubcategoryChange = (subcategoryId: string) => {
    setSelectedSubcategoryId(subcategoryId)
    setValue('subcategory_id', subcategoryId)
    setValue('element_category_id', '')
  }

  // Reset form when modal opens/closes or task changes
  useEffect(() => {
    if (open) {
      if (task) {
        // Editing mode
        setValue('name', task.name)
        setValue('description', task.description || '')
        setValue('category_id', task.category_id || '')
        setValue('subcategory_id', task.subcategory_id || '')
        setValue('element_category_id', task.element_category_id || '')
        setValue('action_id', task.action_id || '')
        setValue('element_id', task.element_id || '')
        setValue('unit_id', task.unit_id || '')
        setValue('unit_labor_price', task.unit_labor_price)
        setValue('unit_material_price', task.unit_material_price)
      } else {
        // Creation mode
        reset({
          name: '',
          description: '',
          category_id: '',
          subcategory_id: '',
          element_category_id: '',
          action_id: '',
          element_id: '',
          unit_id: '',
          unit_labor_price: 0,
          unit_material_price: 0
        })
        setTaskMaterials([])
      }
    }
  }, [open, task, setValue, reset])

  const addMaterial = () => {
    setTaskMaterials([...taskMaterials, { material_id: '', quantity: 1 }])
  }

  const removeMaterial = (index: number) => {
    setTaskMaterials(taskMaterials.filter((_, i) => i !== index))
  }

  const updateMaterial = (index: number, field: keyof TaskMaterial, value: string | number) => {
    const updated = [...taskMaterials]
    updated[index] = { ...updated[index], [field]: value }
    setTaskMaterials(updated)
  }

  const onSubmit = async (data: TaskFormData) => {
    if (!userData?.organization?.id) return
    
    try {
      setIsSubmitting(true)
      
      const taskData = {
        ...data,
        organization_id: userData.organization.id
      }

      if (task) {
        // Update existing task
        await updateTaskMutation.mutateAsync({
          id: task.id,
          ...taskData
        })
      } else {
        // Create new task
        await createTaskMutation.mutateAsync(taskData)
      }
      
      handleClose()
    } catch (error) {
      console.error('Error saving task:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    setTaskMaterials([])
    onClose()
  }

  return (
    <CustomModalLayout open={open} onClose={handleClose}>
      {{
        header: (
          <CustomModalHeader
            title={task ? 'Editar Tarea' : 'Nueva Tarea'}
            description={task ? 'Edita los datos de la tarea' : 'Completa la información para crear una nueva tarea'}
            onClose={handleClose}
          />
        ),
        body: (
          <CustomModalBody padding="md">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <Accordion type="multiple" defaultValue={["datos", "costos", "materiales"]} className="space-y-4">
                
                {/* Datos Básicos */}
                <AccordionItem value="datos">
                  <AccordionTrigger>Datos Básicos</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category_id">Categoría</Label>
                        <Select onValueChange={(value) => setValue('category_id', value)} value={watch('category_id')}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((category: any) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subcategory_id">Subcategoría</Label>
                        <Select onValueChange={(value) => setValue('subcategory_id', value)} value={watch('subcategory_id')}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar subcategoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {subcategories.map((subcategory: any) => (
                              <SelectItem key={subcategory.id} value={subcategory.id}>
                                {subcategory.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="element_category_id">Elemento (Categoría)</Label>
                        <Select onValueChange={(value) => setValue('element_category_id', value)} value={watch('element_category_id')}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar elemento" />
                          </SelectTrigger>
                          <SelectContent>
                            {elements.map((element: any) => (
                              <SelectItem key={element.id} value={element.id}>
                                {element.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="action_id">Acción</Label>
                        <Select onValueChange={(value) => setValue('action_id', value)} value={watch('action_id')}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar acción" />
                          </SelectTrigger>
                          <SelectContent>
                            {actions.map((action: any) => (
                              <SelectItem key={action.id} value={action.id}>
                                {action.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="element_id">Elemento</Label>
                        <Select onValueChange={(value) => setValue('element_id', value)} value={watch('element_id')}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar elemento" />
                          </SelectTrigger>
                          <SelectContent>
                            {elements.map((element: any) => (
                              <SelectItem key={element.id} value={element.id}>
                                {element.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="unit_id">Unidad</Label>
                        <Select onValueChange={(value) => setValue('unit_id', value)} value={watch('unit_id')}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar unidad" />
                          </SelectTrigger>
                          <SelectContent>
                            {units.map((unit: any) => (
                              <SelectItem key={unit.id} value={unit.id}>
                                {unit.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="name" className="required-asterisk">Nombre de la Tarea</Label>
                      <Input
                        {...register('name')}
                        id="name"
                        placeholder="Se generará automáticamente"
                        readOnly
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">{errors.name.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Descripción</Label>
                      <Textarea
                        {...register('description')}
                        id="description"
                        placeholder="Describe los detalles de la tarea..."
                        rows={3}
                      />
                    </div>

                  </AccordionContent>
                </AccordionItem>

                {/* Costos */}
                <AccordionItem value="costos">
                  <AccordionTrigger>Costos</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="unit_labor_price">Precio Unitario Mano de Obra</Label>
                        <Input
                          {...register('unit_labor_price', { 
                            valueAsNumber: true,
                            setValueAs: (value) => value === '' ? 0 : Number(value)
                          })}
                          id="unit_labor_price"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                        />
                        {errors.unit_labor_price && (
                          <p className="text-sm text-destructive">{errors.unit_labor_price.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="unit_material_price">Precio Unitario Materiales</Label>
                        <Input
                          {...register('unit_material_price', { 
                            valueAsNumber: true,
                            setValueAs: (value) => value === '' ? 0 : Number(value)
                          })}
                          id="unit_material_price"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                        />
                        {errors.unit_material_price && (
                          <p className="text-sm text-destructive">{errors.unit_material_price.message}</p>
                        )}
                      </div>
                    </div>

                  </AccordionContent>
                </AccordionItem>

                {/* Lista de Materiales */}
                <AccordionItem value="materiales">
                  <AccordionTrigger>Lista de Materiales</AccordionTrigger>
                  <AccordionContent className="space-y-4">
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addMaterial}
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Añadir Material
                    </Button>

                    <div className="space-y-3">
                      {taskMaterials.map((material, index) => (
                        <div key={index} className="flex items-center gap-2 p-3 border rounded-md">
                          <div className="flex-1">
                            <Select 
                              value={material.material_id} 
                              onValueChange={(value) => updateMaterial(index, 'material_id', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Seleccionar material" />
                              </SelectTrigger>
                              <SelectContent>
                                {materials.map((mat: any) => (
                                  <SelectItem key={mat.id} value={mat.id}>
                                    {mat.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="w-24">
                            <Input
                              type="number"
                              min="1"
                              step="1"
                              value={material.quantity}
                              onChange={(e) => updateMaterial(index, 'quantity', parseInt(e.target.value) || 1)}
                              placeholder="Cant."
                            />
                          </div>
                          
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeMaterial(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>

                  </AccordionContent>
                </AccordionItem>

              </Accordion>

              <button type="submit" style={{ display: 'none' }} />
            </form>
          </CustomModalBody>
        ),
        footer: (
          <CustomModalFooter
            onCancel={handleClose}
            onSave={handleSubmit(onSubmit)}
            saveText={task ? 'Guardar cambios' : 'Crear tarea'}
            saveLoading={isSubmitting}
            saveDisabled={false}
          />
        )
      }}
    </CustomModalLayout>
  )
}