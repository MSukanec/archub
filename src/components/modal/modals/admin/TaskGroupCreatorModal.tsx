import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { PackagePlus, FileText, Settings, GripVertical, Plus, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { toast } from '@/hooks/use-toast'

import { FormModalLayout } from '@/components/modal/form/FormModalLayout'
import { FormModalStepHeader } from '@/components/modal/form/FormModalStepHeader'
import { FormModalStepFooter } from '@/components/modal/form/FormModalStepFooter'

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ComboBox } from '@/components/ui-custom/ComboBoxWrite'
import { ComboBoxMultiSelect } from '@/components/ui-custom/ComboBoxMultiSelect'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

import { useCreateTaskGroup, useUpdateTaskGroup } from '@/hooks/use-task-groups'
import { useCreateTaskTemplate } from '@/hooks/use-task-templates-admin'
import { useSubcategoriesOnly } from '@/hooks/use-task-categories-admin'
import { useUnits } from '@/hooks/use-units'
import { useSaveTaskGroupParameterOptions, useLoadTaskGroupParameterOptions } from '@/hooks/use-task-group-parameter-options'

// Hook para obtener opciones de parámetro
const useParameterOptions = (parameterId: string) => {
  return useQuery({
    queryKey: ['parameter-options', parameterId],
    queryFn: async () => {
      console.log('🔍 Obteniendo opciones para parámetro:', parameterId)
      const { data, error } = await supabase
        .from('task_parameter_values')
        .select('id, name, label')
        .eq('parameter_id', parameterId)
        .order('label', { ascending: true })

      if (error) {
        console.error('❌ Error obteniendo opciones:', error)
        throw error
      }
      
      console.log('📝 Opciones obtenidas:', data)
      return data || []
    },
    enabled: !!parameterId,
  })
}
import { TaskTemplate, TaskTemplateParameter, TaskParameter } from '@shared/schema'

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import {
  CSS,
} from '@dnd-kit/utilities'

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

interface SortableParameterItemProps {
  param: { id: string; parameter_id: string; template_id: string; position: number; option_group_id: string | null }
  parameter: { id: string; name: string; label: string; type: string } | undefined
  onRemove: (id: string) => void
  selectedOptions: string[]
  onOptionsChange: (parameterId: string, options: string[]) => void
}

function SortableParameterItem({ param, parameter, onRemove, selectedOptions, onOptionsChange }: SortableParameterItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: param.id })

  const { data: parameterOptions = [] } = useParameterOptions(param.parameter_id)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const options = parameterOptions.map(option => ({
    value: option.id,
    label: option.label
  }))

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center space-x-3 p-3 bg-muted/30 rounded border"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      
      <div className="flex flex-col min-w-0">
        <p className="font-medium text-sm">{parameter?.label || 'Parámetro sin nombre'}</p>
        <Badge variant="outline" className="text-xs mt-1 w-fit">
          {parameter?.type || 'N/A'}
        </Badge>
      </div>
      
      {parameter?.type === 'select' && options.length > 0 && (
        <div className="flex-1 max-w-xs">
          <ComboBoxMultiSelect
            options={options}
            values={selectedOptions}
            onValuesChange={(values) => onOptionsChange(param.parameter_id, values)}
            placeholder="Seleccionar opciones..."
            className="w-full"
          />
        </div>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onRemove(param.id)}
        className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}

export function TaskGroupCreatorModal({ modalData, onClose }: TaskGroupCreatorModalProps) {
  const [currentStep, setCurrentStep] = useState(() => {
    // If editing existing group, start on step 2 (template configuration)
    return modalData?.taskGroup ? 2 : 1
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdTaskGroup, setCreatedTaskGroup] = useState<any>(null)
  
  const queryClient = useQueryClient()
  const createGroupMutation = useCreateTaskGroup()
  const createTemplateMutation = useCreateTaskTemplate()
  const updateGroupMutation = useUpdateTaskGroup()
  const saveParameterOptionsMutation = useSaveTaskGroupParameterOptions()
  
  // Get task group for step 2
  const taskGroup = modalData?.taskGroup || createdTaskGroup
  
  // Load saved parameter options for the group
  const { data: savedOptionsMap = {} } = useLoadTaskGroupParameterOptions(taskGroup?.id)
  
  // Data hooks for step 1
  const { data: allCategories = [], isLoading: categoriesLoading } = useSubcategoriesOnly()
  const { data: units = [], isLoading: unitsLoading } = useUnits()
  
  // State for step 2 (template configuration)
  const [templateParameters, setTemplateParameters] = useState<any[]>([])
  const [selectedParameterId, setSelectedParameterId] = useState('')
  const [existingTemplate, setExistingTemplate] = useState<any>(null)
  const [availableParameters, setAvailableParameters] = useState<any[]>([])
  
  // State for selected options per parameter
  const [selectedOptionsMap, setSelectedOptionsMap] = useState<Record<string, string[]>>({})
  
  // Sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Generate preview function (como en TaskTemplateFormModal)
  const generatePreview = () => {
    const baseName = taskGroup?.name || 'Nueva tarea';
    
    if (templateParameters.length === 0) {
      return `${baseName}.`;
    }
    
    const parameterPlaceholders = templateParameters
      .map(tp => {
        const parameter = availableParameters.find(p => p.id === tp.parameter_id);
        return `{{${parameter?.name || 'parámetro'}}}`;
      })
      .join(' ');
    
    return `${baseName} ${parameterPlaceholders}.`;
  }

  // Handle options selection changes
  const handleOptionsChange = (parameterId: string, selectedOptions: string[]) => {
    setSelectedOptionsMap(prev => ({
      ...prev,
      [parameterId]: selectedOptions
    }));
  }

  const form = useForm<TaskGroupCreatorFormData>({
    resolver: zodResolver(taskGroupCreatorSchema),
    defaultValues: {
      name: '',
      subcategory_id: '',
      unit_id: '',
    },
  })

  // Load data when editing existing task group
  useEffect(() => {
    if (modalData?.taskGroup) {
      form.reset({
        name: modalData.taskGroup.name,
        subcategory_id: modalData.taskGroup.category_id,
        unit_id: '',
      })
    }
  }, [modalData, form])

  // Load template data for step 2
  useEffect(() => {
    if (currentStep === 2 && taskGroup?.id) {
      fetchTemplateData(taskGroup.id)
    }
  }, [currentStep, taskGroup])
  
  // Load saved parameter options when they become available AND template parameters are loaded
  useEffect(() => {
    if (Object.keys(savedOptionsMap).length > 0 && templateParameters.length > 0) {
      console.log('📥 Cargando opciones guardadas después de cargar parámetros:', savedOptionsMap)
      setSelectedOptionsMap(savedOptionsMap)
    }
  }, [savedOptionsMap, templateParameters])

  const fetchTemplateData = async (taskGroupId: string) => {
    try {
      if (!supabase) return
      
      console.log('🔍 Buscando plantilla para task_group_id:', taskGroupId)
      
      // Fetch existing template using task_group_id
      const { data: template } = await supabase
        .from('task_templates')
        .select('*')
        .eq('task_group_id', taskGroupId)
        .single()

      console.log('🔍 Resultado búsqueda plantilla:', { data: template })

      if (template) {
        setExistingTemplate(template)
        
        // Fetch template parameters
        const { data: templateParams } = await supabase
          .from('task_template_parameters')
          .select(`
            *,
            task_parameter:task_parameters(*)
          `)
          .eq('template_id', template.id)
          .order('position')

        console.log('📋 Parámetros de plantilla cargados:', templateParams)
        setTemplateParameters(templateParams || [])
      }

      // Fetch available parameters
      const { data: params } = await supabase
        .from('task_parameters')
        .select('*')
        .order('name')

      console.log('⚙️ Parámetros disponibles:', params)
      setAvailableParameters(params || [])
    } catch (error) {
      console.error('❌ Error fetching template data:', error)
    }
  }

  // Get subcategories (categories that have parent_id - are not root level)
  const subcategories = allCategories.filter(category => category.parent_id !== null)

  // Prepare subcategories for ComboBoxWrite
  const subcategoryOptions = subcategories.map(subcategory => ({
    label: subcategory.name,
    value: subcategory.id,
  }))

  const onSubmitStep1 = async (data: TaskGroupCreatorFormData) => {
    setIsSubmitting(true)
    
    try {
      if (modalData?.taskGroup) {
        // Editing existing task group
        await updateGroupMutation.mutateAsync({
          id: modalData.taskGroup.id,
          name: data.name,
          category_id: data.subcategory_id,
        })
        
        toast({
          title: "Grupo actualizado",
          description: "El grupo de tareas se actualizó correctamente.",
        })
        
        handleClose()
      } else {
        // Creating new task group
        const newGroup = await createGroupMutation.mutateAsync({
          name: data.name,
          category_id: data.subcategory_id,
        })

        // Create the associated template
        const selectedCategory = subcategories.find(cat => cat.id === data.subcategory_id)
        const taskCode = selectedCategory?.code || 'GEN'
        
        const newTemplate = await createTemplateMutation.mutateAsync({
          name_template: `${data.name}.`,
          task_group_id: newGroup.id,
          unit_id: data.unit_id,
          task_code: taskCode, // Usar el código de la subcategoría seleccionada
        })

        // Update the task group with the template_id
        await updateGroupMutation.mutateAsync({
          id: newGroup.id,
          name: data.name,
          category_id: data.subcategory_id,
          template_id: newTemplate.id,
        })

        setCreatedTaskGroup(newGroup)
        setCurrentStep(2)
        
        toast({
          title: "Grupo creado",
          description: "El grupo de tareas se creó correctamente. Ahora configura los parámetros.",
        })
      }
    } catch (error) {
      console.error('Error creating/updating group and template:', error)
      toast({
        title: "Error",
        description: "No se pudo completar la operación.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over) return

    const activeIndex = templateParameters.findIndex(p => p.id === active.id)
    const overIndex = templateParameters.findIndex(p => p.id === over.id)

    if (activeIndex !== overIndex) {
      const newParams = arrayMove(templateParameters, activeIndex, overIndex)
      setTemplateParameters(newParams)
    }
  }

  const addParameter = async () => {
    if (!selectedParameterId || !existingTemplate || !supabase) return

    const newPosition = templateParameters.length + 1
    
    try {
      const { data, error } = await supabase
        .from('task_template_parameters')
        .insert({
          template_id: existingTemplate.id,
          parameter_id: selectedParameterId,
          position: newPosition,
          option_group_id: null,
        })
        .select()
        .single()

      if (error) throw error

      setTemplateParameters([...templateParameters, data])
      setSelectedParameterId('')
      
      toast({
        title: "Parámetro agregado",
        description: "El parámetro se agregó correctamente a la plantilla.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo agregar el parámetro.",
        variant: "destructive",
      })
    }
  }

  const removeParameter = async (paramId: string) => {
    try {
      if (!supabase) return
      
      await supabase
        .from('task_template_parameters')
        .delete()
        .eq('id', paramId)

      setTemplateParameters(templateParameters.filter(p => p.id !== paramId))
      
      toast({
        title: "Parámetro eliminado",
        description: "El parámetro se eliminó correctamente.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar el parámetro.",
        variant: "destructive",
      })
    }
  }

  const handleClose = () => {
    form.reset()
    setCurrentStep(1)
    setTemplateParameters([])
    setExistingTemplate(null)
    setCreatedTaskGroup(null)
    onClose()
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleNext = async () => {
    if (currentStep === 1) {
      form.handleSubmit(onSubmitStep1)()
    } else {
      // Step 2: Save parameter options using new system
      await saveParameterOptions()
      handleClose()
    }
  }

  const saveParameterOptions = async () => {
    if (!taskGroup?.id) return

    console.log('💾 Guardando opciones con nuevo sistema para grupo:', taskGroup.id)
    console.log('📋 Opciones actuales:', selectedOptionsMap)

    try {
      // Prepare data for new table structure
      const parameterOptions = Object.entries(selectedOptionsMap)
        .filter(([_, options]) => options.length > 0)
        .map(([parameter_id, parameter_option_ids]) => ({
          parameter_id,
          parameter_option_ids
        }))

      console.log('📤 Enviando opciones al nuevo sistema:', parameterOptions)

      await saveParameterOptionsMutation.mutateAsync({
        groupId: taskGroup.id,
        parameterOptions
      })

      console.log('✅ Opciones guardadas exitosamente con nuevo sistema')
    } catch (error) {
      console.error('❌ Error guardando opciones:', error)
    }
  }

  const isLoading = categoriesLoading || unitsLoading || isSubmitting
  const isEditing = !!modalData?.taskGroup

  // Step titles
  const stepTitles = {
    1: isEditing ? "Editar Grupo de Tareas" : "Crear Grupo de Tareas",
    2: "Configurar Plantilla"
  }

  // Step 1: Group creation/editing
  const step1Panel = (
    <Form {...form}>
      <form className="space-y-6">
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
      </form>
    </Form>
  )

  // Step 2: Template configuration
  const step2Panel = (
    <div className="space-y-6">
      {/* Vista Previa */}
      {taskGroup && (
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-muted-foreground">Vista Previa</h4>
          <div className="p-3 bg-background rounded border">
            <p className="text-sm font-medium text-foreground">{generatePreview()}</p>
          </div>
        </div>
      )}

      {/* Add Parameter */}
      <div className="space-y-3">
        <Label>Agregar Parámetro</Label>
        <div className="flex space-x-2">
          <div className="flex-1">
            <Select value={selectedParameterId} onValueChange={setSelectedParameterId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar parámetro..." />
              </SelectTrigger>
              <SelectContent>
                {availableParameters
                  .filter(p => !templateParameters.some(tp => tp.parameter_id === p.id))
                  .map((param) => (
                  <SelectItem key={param.id} value={param.id}>
                    {param.label} ({param.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={addParameter} disabled={!selectedParameterId} size="sm">
            <Plus className="w-4 h-4 mr-1" />
            Agregar
          </Button>
        </div>
      </div>

      {/* Current Parameters */}
      <div className="space-y-3">
        <Label>Parámetros Configurados ({templateParameters.length})</Label>
        {templateParameters.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            <Settings className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No hay parámetros configurados</p>
            <p className="text-sm">Agrega parámetros para personalizar la plantilla</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={templateParameters.map(p => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {templateParameters.map((param) => {
                  const parameter = availableParameters.find(p => p.id === param.parameter_id)
                  return (
                    <SortableParameterItem
                      key={param.id}
                      param={param}
                      parameter={parameter}
                      onRemove={removeParameter}
                      selectedOptions={selectedOptionsMap[param.parameter_id] || []}
                      onOptionsChange={handleOptionsChange}
                    />
                  )
                })}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )

  const stepConfig = {
    currentStep,
    totalSteps: 2,
    stepTitle: stepTitles[currentStep as keyof typeof stepTitles]
  }

  const headerContent = (
    <FormModalStepHeader 
      title={modalData?.taskGroup ? "Editar Grupo de Tareas" : "Crear Grupo de Tareas"}
      icon={currentStep === 1 ? PackagePlus : Settings}
      stepConfig={stepConfig}
    />
  )

  const getFooterConfig = () => {
    switch (currentStep) {
      case 1:
        return {
          cancelAction: { 
            label: 'Cancelar', 
            onClick: handleClose 
          },
          nextAction: { 
            label: 'Siguiente', 
            onClick: handleNext,
            disabled: !form.formState.isValid,
            loading: isSubmitting
          }
        }
      case 2:
        return {
          cancelAction: { 
            label: 'Cancelar', 
            onClick: handleClose 
          },
          previousAction: { 
            label: 'Anterior', 
            onClick: handlePrevious 
          },
          submitAction: { 
            label: modalData?.taskGroup ? 'Actualizar' : 'Finalizar', 
            onClick: handleNext,
            loading: isSubmitting
          }
        }
      default:
        return {
          cancelAction: { 
            label: 'Cancelar', 
            onClick: handleClose 
          }
        }
    }
  }

  const footerContent = (
    <FormModalStepFooter
      config={getFooterConfig()}
    />
  )

  return (
    <FormModalLayout
      headerContent={headerContent}
      footerContent={footerContent}
      stepContent={currentStep === 1 ? step1Panel : step2Panel}
      columns={1}
      onClose={onClose}
    >
    </FormModalLayout>
  )
}